import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import FormInput from '../ui/FormInput';
import FormSelect from '../ui/FormSelect';
import Textarea from '../ui/Textarea';
import styles from './EventModal.module.css';
import {
  EVENT_TYPES,
  PRIORITY_OPTIONS,
  REMINDER_OPTIONS,
  RECURRENCE_OPTIONS,
  getEventType,
  getPriority
} from '../../constants/scheduleConstants';
import SearchableSelect from '../common/SearchableSelect';
import { listProjects } from '../../services/projectAPI';
import axiosInstance from '../../api/axiosInstance';
import apiEndpoints from '../../config/apiEndpoints';

/**
 * EventModal - Create/Edit event form
 *
 * All fields:
 * - Event Type, Title, Date, Start/End Time
 * - All Day toggle, Project Link, Assigned To
 * - Location, Description, Priority, Reminder, Recurrence
 *
 * @param {Object} event - Event to edit (null for new event)
 * @param {Function} onSave - Save handler
 * @param {Function} onDelete - Delete handler
 * @param {Function} onClose - Close handler
 * @param {Date} initialDate - Pre-filled date/time for new events
 */
const EventModal = ({
  event = null,
  onSave,
  onDelete,
  onClose,
  initialDate = null
}) => {
  const isEditMode = !!event;

  // Real project data from API
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Real team members from API
  const [teamMembers, setTeamMembers] = useState([]);
  const [loadingTeam, setLoadingTeam] = useState(true);

  // Initialize form state
  const getInitialState = () => {
    if (event) {
      // Extract assigned user IDs from attendees array
      const assignedUserIds = event.attendees ? event.attendees.map(att => att.userId) : [];

      return {
        type: event.type,
        title: event.title,
        date: event.startTime.split('T')[0],
        startTime: new Date(event.startTime).toTimeString().slice(0, 5),
        endTime: new Date(event.endTime).toTimeString().slice(0, 5),
        allDay: event.allDay,
        projectId: event.projectUuid || event.projectId || '',
        assignedTo: assignedUserIds,
        location: event.location || '',
        description: event.description || '',
        priority: event.priority,
        reminder: event.reminder,
        recurrence: event.recurrence || 'none'
      };
    } else {
      const defaultDate = initialDate || new Date();
      const startHour = initialDate ? initialDate.getHours() : 9;
      const endHour = startHour + 1;

      return {
        type: 'site_survey',
        title: '',
        date: defaultDate.toISOString().split('T')[0],
        startTime: `${startHour.toString().padStart(2, '0')}:00`,
        endTime: `${endHour.toString().padStart(2, '0')}:00`,
        allDay: false,
        projectId: '',
        assignedTo: [],
        location: '',
        description: '',
        priority: 'medium',
        reminder: '30',
        recurrence: 'none'
      };
    }
  };

  const [formData, setFormData] = useState(getInitialState());
  const [errors, setErrors] = useState({});

  const selectedEventType = getEventType(formData.type);

  // Load projects on mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoadingProjects(true);
        const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
        if (userData?.company_id) {
          const response = await listProjects(userData.company_id);
          if (response.status === 'SUCCESS' && response.data?.projects) {
            const projectOptions = response.data.projects.map(proj => ({
              value: proj.uuid,
              label: `${proj.customer_first_name || ''} ${proj.customer_last_name || ''}`.trim() || proj.installer_project_id || proj.uuid
            }));
            projectOptions.push({ value: '', label: 'No Project' });
            setProjects(projectOptions);
          }
        }
      } catch (error) {
        console.error('Error loading projects:', error);
        setProjects([{ value: '', label: 'No Project' }]);
      } finally {
        setLoadingProjects(false);
      }
    };

    loadProjects();
  }, []);

  // Load team members on mount
  useEffect(() => {
    const loadTeamMembers = async () => {
      try {
        setLoadingTeam(true);
        const response = await axiosInstance.get(apiEndpoints.TEAM.GET_USERS);
        if (response.data.status === 'SUCCESS' && response.data.data) {
          const memberOptions = response.data.data.map(user => ({
            value: user.id || user.uuid,
            label: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email
          }));
          setTeamMembers(memberOptions);
        }
      } catch (error) {
        console.error('Error loading team members:', error);
        setTeamMembers([]);
      } finally {
        setLoadingTeam(false);
      }
    };

    loadTeamMembers();
  }, []);

  // Handle form field changes
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle all-day toggle
  const handleAllDayToggle = () => {
    setFormData(prev => ({
      ...prev,
      allDay: !prev.allDay,
      startTime: !prev.allDay ? '00:00' : '09:00',
      endTime: !prev.allDay ? '23:59' : '10:00'
    }));
  };

  // Handle assigned to (multi-select)
  const handleAssignedToToggle = (userId) => {
    setFormData(prev => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(userId)
        ? prev.assignedTo.filter(id => id !== userId)
        : [...prev.assignedTo, userId]
    }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.allDay) {
      if (!formData.startTime) {
        newErrors.startTime = 'Start time is required';
      }
      if (!formData.endTime) {
        newErrors.endTime = 'End time is required';
      }

      // Check if end time is after start time
      if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
        newErrors.endTime = 'End time must be after start time';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    // Construct event data
    const eventData = {
      type: formData.type,
      title: formData.title,
      description: formData.description,
      startTime: formData.allDay
        ? `${formData.date}T00:00:00Z`
        : `${formData.date}T${formData.startTime}:00Z`,
      endTime: formData.allDay
        ? `${formData.date}T23:59:59Z`
        : `${formData.date}T${formData.endTime}:00Z`,
      allDay: formData.allDay,
      projectUuid: formData.projectId || null,
      projectName: projects.find(p => p.value === formData.projectId)?.label || null,
      assignedTo: formData.assignedTo,
      assignedNames: formData.assignedTo.map(
        id => teamMembers.find(m => m.value === id)?.label || ''
      ),
      location: formData.location,
      priority: formData.priority,
      reminder: formData.reminder,
      recurrence: formData.recurrence,
      status: 'scheduled',
      timezone: 'America/Phoenix'
    };

    if (onSave) {
      onSave(eventData, event?.id);
    }
  };

  // Handle delete
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      if (onDelete && event) {
        onDelete(event.id);
      }
    }
  };

  return (
    <>
      {/* Modal Header with Event Type Color */}
      <div className={styles.eventModalHeader} style={{ borderTopColor: selectedEventType.color, borderTopWidth: '3px', borderTopStyle: 'solid' }}>
        <h2 className={styles.eventModalTitle}>
          {isEditMode ? 'Edit Event' : 'New Event'}
        </h2>
        <button className={styles.eventModalClose} onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>

      {/* Modal Body */}
      <div className={styles.eventModalBody}>
        {/* Event Type */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Event Type *</label>
          <select
            className={styles.formSelect}
            value={formData.type}
            onChange={(e) => handleChange('type', e.target.value)}
          >
            {EVENT_TYPES.map(type => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Title *</label>
          <input
            type="text"
            className={styles.formInput}
            placeholder="e.g., Johnson Residence - Site Survey"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            style={errors.title ? { borderColor: 'var(--color-error)' } : {}}
          />
          {errors.title && (
            <div style={{ color: 'var(--color-error)', fontSize: 'var(--text-xs)', marginTop: 'var(--spacing-xs)' }}>
              {errors.title}
            </div>
          )}
        </div>

        {/* Date and All Day */}
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Date *</label>
            <input
              type="date"
              className={styles.formInput}
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              style={errors.date ? { borderColor: 'var(--color-error)' } : {}}
            />
            {errors.date && (
              <div style={{ color: 'var(--color-error)', fontSize: 'var(--text-xs)', marginTop: 'var(--spacing-xs)' }}>
                {errors.date}
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>All Day</label>
            <div className={styles.formCheckbox}>
              <input
                type="checkbox"
                id="allDay"
                checked={formData.allDay}
                onChange={handleAllDayToggle}
              />
              <label htmlFor="allDay">All day event</label>
            </div>
          </div>
        </div>

        {/* Start Time and End Time */}
        {!formData.allDay && (
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Start Time *</label>
              <input
                type="time"
                className={styles.formInput}
                value={formData.startTime}
                onChange={(e) => handleChange('startTime', e.target.value)}
                style={errors.startTime ? { borderColor: 'var(--color-error)' } : {}}
              />
              {errors.startTime && (
                <div style={{ color: 'var(--color-error)', fontSize: 'var(--text-xs)', marginTop: 'var(--spacing-xs)' }}>
                  {errors.startTime}
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>End Time *</label>
              <input
                type="time"
                className={styles.formInput}
                value={formData.endTime}
                onChange={(e) => handleChange('endTime', e.target.value)}
                style={errors.endTime ? { borderColor: 'var(--color-error)' } : {}}
              />
              {errors.endTime && (
                <div style={{ color: 'var(--color-error)', fontSize: 'var(--text-xs)', marginTop: 'var(--spacing-xs)' }}>
                  {errors.endTime}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Project Link */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Project</label>
          <SearchableSelect
            value={formData.projectId}
            onChange={(value) => handleChange('projectId', value)}
            options={projects}
            placeholder={loadingProjects ? "Loading projects..." : "Select a project..."}
            disabled={loadingProjects}
          />
        </div>

        {/* Assigned To (Multi-select) */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Assigned To</label>
          {loadingTeam ? (
            <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
              Loading team members...
            </div>
          ) : teamMembers.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
              {teamMembers.map(member => (
                <button
                  key={member.value}
                  type="button"
                  className={`${styles.filterChip} ${
                    formData.assignedTo.includes(member.value) ? styles.filterChipActive : ''
                  }`}
                  onClick={() => handleAssignedToToggle(member.value)}
                >
                  {member.label}
                </button>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
              No team members available
            </div>
          )}
        </div>

        {/* Location */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Location</label>
          <input
            type="text"
            className={styles.formInput}
            placeholder="e.g., 1234 Solar Lane, Phoenix, AZ"
            value={formData.location}
            onChange={(e) => handleChange('location', e.target.value)}
          />
        </div>

        {/* Description */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Description</label>
          <textarea
            className={styles.formTextarea}
            placeholder="Add notes or details about this event..."
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={3}
          />
        </div>

        {/* Priority and Reminder */}
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Priority</label>
            <select
              className={styles.formSelect}
              value={formData.priority}
              onChange={(e) => handleChange('priority', e.target.value)}
            >
              {PRIORITY_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Reminder</label>
            <select
              className={styles.formSelect}
              value={formData.reminder}
              onChange={(e) => handleChange('reminder', e.target.value)}
            >
              {REMINDER_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Recurrence */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Recurrence</label>
          <select
            className={styles.formSelect}
            value={formData.recurrence}
            onChange={(e) => handleChange('recurrence', e.target.value)}
          >
            {RECURRENCE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Modal Footer */}
      <div className={styles.eventModalFooter}>
        <button className={styles.buttonSecondary} onClick={onClose}>
          Cancel
        </button>
        {isEditMode && (
          <button className={styles.buttonDanger} onClick={handleDelete}>
            Delete
          </button>
        )}
        <button className={styles.buttonPrimary} onClick={handleSave}>
          {isEditMode ? 'Save Changes' : 'Create Event'}
        </button>
      </div>
    </>
  );
};

export default EventModal;
