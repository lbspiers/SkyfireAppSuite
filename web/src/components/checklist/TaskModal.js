import { useState, useEffect } from 'react';
import { Modal, Button, FormInput, FormSelect, Textarea } from '../ui';
import * as Icons from 'lucide-react';
import * as teamService from '../../services/teamService';
import styles from './TaskModal.module.css';

/**
 * TaskModal - Modal for creating and assigning tasks
 */
const TaskModal = ({ isOpen, onClose, onSubmit, projectUuid }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeUuid, setAssigneeUuid] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('normal');
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch team members for assignment dropdown
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const response = await teamService.getCompanyUsers();
        setTeamMembers(response.data || []);
      } catch (error) {
        console.error('Failed to fetch team members:', error);
        setTeamMembers([]);
      }
    };

    if (isOpen) {
      fetchTeamMembers();
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!title.trim()) return;

    setLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        assigneeUuid: assigneeUuid || null,
        dueDate: dueDate || null,
        priority,
      });

      // Reset form
      setTitle('');
      setDescription('');
      setAssigneeUuid('');
      setDueDate('');
      setPriority('normal');
    } finally {
      setLoading(false);
    }
  };

  const assigneeOptions = [
    { value: '', label: 'Unassigned' },
    ...teamMembers.map((member) => ({
      value: member.uuid,
      label: `${member.first_name || member.firstName} ${member.last_name || member.lastName}`,
    })),
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
  ];

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose}>
        Cancel
      </Button>
      <Button
        variant="primary"
        onClick={handleSubmit}
        disabled={!title.trim() || loading}
        loading={loading}
      >
        Create Task
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Task"
      size="md"
      footer={footer}
    >
      <div className={styles.taskForm}>
        <FormInput
          label="Task Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter task title..."
          required
        />

        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add task details..."
          rows={3}
        />

        <FormSelect
          label="Assign To"
          value={assigneeUuid}
          onChange={(e) => setAssigneeUuid(e.target.value)}
          options={assigneeOptions}
        />

        <div className={styles.formRow}>
          <FormInput
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />

          <FormSelect
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            options={priorityOptions}
          />
        </div>
      </div>
    </Modal>
  );
};

export default TaskModal;
