import { useState } from 'react';
import { toast } from 'react-toastify';
import { Modal, Button, FormInput, FormSelect, Textarea } from '../../../../components/ui';
import styles from './AddToQueueModal.module.css';

const TIME_LIMIT_OPTIONS = [
  { value: '15', label: '15 minutes' },
  { value: '20', label: '20 minutes' },
  { value: '30', label: '30 minutes (default)' },
  { value: '45', label: '45 minutes' },
  { value: '60', label: '60 minutes' }
];

/**
 * Modal to add project to queue
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal open state
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onAdd - Add handler
 */
const AddToQueueModal = ({ isOpen, onClose, onAdd }) => {
  const [projectId, setProjectId] = useState('');
  const [notes, setNotes] = useState('');
  const [timeLimit, setTimeLimit] = useState('30');
  const [adding, setAdding] = useState(false);

  const handleSubmit = async () => {
    if (!projectId.trim()) {
      toast.warning('Please enter a project ID', {
        position: 'top-center',
        autoClose: 3000,
      });
      return;
    }

    try {
      setAdding(true);
      const timeLimitSeconds = parseInt(timeLimit) * 60;
      await onAdd(projectId.trim(), notes.trim(), timeLimitSeconds);

      // Reset and close
      setProjectId('');
      setNotes('');
      setTimeLimit('30');
      onClose();
    } catch (error) {
      toast.error('Failed to add project to queue', {
        position: 'top-center',
        autoClose: 5000,
      });
    } finally {
      setAdding(false);
    }
  };

  const handleClose = () => {
    if (!adding) {
      setProjectId('');
      setNotes('');
      setTimeLimit('30');
      onClose();
    }
  };

  const footer = (
    <>
      <Button
        variant="secondary"
        onClick={handleClose}
        disabled={adding}
      >
        Cancel
      </Button>
      <Button
        variant="primary"
        onClick={handleSubmit}
        disabled={adding}
        loading={adding}
      >
        Add to Queue
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Project to Queue"
      size="md"
      footer={footer}
      closeOnOverlay={!adding}
      closeOnEscape={!adding}
    >
      <div className={styles.content}>
        <FormInput
          label="Project ID"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          placeholder="Enter project ID or UUID"
          required
          disabled={adding}
        />

        <Textarea
          label="Notes for Drafter"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any special instructions..."
          rows={3}
          maxLength={500}
          showCount
          disabled={adding}
        />

        <FormSelect
          label="Time Limit (minutes)"
          value={timeLimit}
          onChange={(e) => setTimeLimit(e.target.value)}
          options={TIME_LIMIT_OPTIONS}
          disabled={adding}
        />
      </div>
    </Modal>
  );
};

export default AddToQueueModal;
