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
 * @param {boolean} isOpen - Modal visibility
 * @param {Object} event - Event to edit (null for new event)
 * @param {Function} onSave - Save handler
 * @param {Function} onDelete - Delete handler
 * @param {Function} onClose - Close handler
 * @param {Date} initialDate - Pre-filled date/time for new events
 */
const EventModal = ({
  isOpen = false,
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

  const eventTypeOptions = EVENT_TYPES.map(type => ({
    value: type.id,
    label: type.label
  }));

  const priorityOptions = PRIORITY_OPTIONS.map(opt => ({
    value: opt.value,
    label: opt.label
  }));

  const reminderOptions = REMINDER_OPTIONS.map(opt => ({
    value: opt.value,
    label: opt.label
  }));

  const recurrenceOptions = RECURRENCE_OPTIONS.map(opt => ({
    value: opt.value,
    label: opt.label
  }));

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose}>
        Cancel
      </Button>
      {isEditMode && (
        <Button variant="danger" onClick={handleDelete}>
          Delete
        </Button>
      )}
      <Button variant="primary" onClick={handleSave}>
        {isEditMode ? 'Save Changes' : 'Create Event'}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Event' : 'New Event'}
      size="md"
      footer={footer}
    >
      {/* Color bar for event type */}
      <div className={styles.headerColorBar} style={{ backgroundColor: selectedEventType.color }} />

      {/* Event Type */}
      <div className={styles.formGroup}>
        <FormSelect
          label="Event Type"
          value={formData.type}
          onChange={(value) => handleChange('type', value)}
          options={eventTypeOptions}
          required
        />
      </div>

      {/* Title */}
      <div className={styles.formGroup}>
        <FormInput
          label="Title"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="e.g., Johnson Residence - Site Survey"
          error={errors.title}
          required
        />
      </div>

      {/* Date and All Day */}
      <div className={styles.formRow}>
        <FormInput
          label="Date"
          type="date"
          value={formData.date}
          onChange={(e) => handleChange('date', e.target.value)}
          error={errors.date}
          required
        />

        <div className={styles.formGroup}>
          <label>All Day</label>
          <div className={styles.checkboxContainer}>
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
          <FormInput
            label="Start Time"
            type="time"
            value={formData.startTime}
            onChange={(e) => handleChange('startTime', e.target.value)}
            error={errors.startTime}
            required
          />

          <FormInput
            label="End Time"
            type="time"
            value={formData.endTime}
            onChange={(e) => handleChange('endTime', e.target.value)}
            error={errors.endTime}
            required
          />
        </div>
      )}

      {/* Project Link */}
      <div className={styles.formGroup}>
        <label>Project</label>
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
        <label>Assigned To</label>
        {loadingTeam ? (
          <div className={styles.loadingText}>
            Loading team members...
          </div>
        ) : teamMembers.length > 0 ? (
          <div className={styles.teamChips}>
            {teamMembers.map(member => (
              <button
                key={member.value}
                type="button"
                className={`${styles.teamChip} ${
                  formData.assignedTo.includes(member.value) ? styles.teamChipActive : ''
                }`}
                onClick={() => handleAssignedToToggle(member.value)}
              >
                {member.label}
              </button>
            ))}
          </div>
        ) : (
          <div className={styles.emptyText}>
            No team members available
          </div>
        )}
      </div>

      {/* Location */}
      <div className={styles.formGroup}>
        <FormInput
          label="Location"
          value={formData.location}
          onChange={(e) => handleChange('location', e.target.value)}
          placeholder="e.g., 1234 Solar Lane, Phoenix, AZ"
        />
      </div>

      {/* Description */}
      <div className={styles.formGroup}>
        <Textarea
          label="Description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Add notes or details about this event..."
          rows={3}
        />
      </div>

      {/* Priority and Reminder */}
      <div className={styles.formRow}>
        <FormSelect
          label="Priority"
          value={formData.priority}
          onChange={(value) => handleChange('priority', value)}
          options={priorityOptions}
        />

        <FormSelect
          label="Reminder"
          value={formData.reminder}
          onChange={(value) => handleChange('reminder', value)}
          options={reminderOptions}
        />
      </div>

      {/* Recurrence */}
      <div className={styles.formGroup}>
        <FormSelect
          label="Recurrence"
          value={formData.recurrence}
          onChange={(value) => handleChange('recurrence', value)}
          options={recurrenceOptions}
        />
      </div>
    </Modal>
  );
};

export default EventModal;
