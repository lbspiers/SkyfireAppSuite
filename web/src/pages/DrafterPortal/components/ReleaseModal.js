import { useState } from 'react';
import { toast } from 'react-toastify';
import { Modal, Button, FormSelect, Textarea } from '../../../components/ui';
import styles from './ReleaseModal.module.css';

const RELEASE_REASONS = [
  { value: 'complex', label: 'Complex project' },
  { value: 'missing_info', label: 'Missing information' },
  { value: 'technical_issue', label: 'Technical issue' },
  { value: 'personal_emergency', label: 'Personal emergency' },
  { value: 'other', label: 'Other' }
];

/**
 * Release project modal
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal open state
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onRelease - Release handler
 * @param {number} props.releasesRemaining - Releases remaining
 */
const ReleaseModal = ({ isOpen, onClose, onRelease, releasesRemaining = 0 }) => {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [releasing, setReleasing] = useState(false);

  const handleRelease = async () => {
    if (!reason) {
      toast.warning('Please select a reason for releasing', {
        position: 'top-center',
        autoClose: 3000,
      });
      return;
    }

    try {
      setReleasing(true);
      await onRelease(reason, notes.trim());
    } catch (error) {
      console.error('Failed to release project:', error);
      toast.error('Failed to release project. Please try again.', {
        position: 'top-center',
        autoClose: 5000,
      });
    } finally {
      setReleasing(false);
    }
  };

  const handleClose = () => {
    if (!releasing) {
      setReason('');
      setNotes('');
      onClose();
    }
  };

  const footer = (
    <>
      <Button
        variant="secondary"
        onClick={handleClose}
        disabled={releasing}
      >
        Cancel
      </Button>
      <Button
        variant="danger"
        onClick={handleRelease}
        disabled={releasing || !reason}
        loading={releasing}
      >
        Release Project
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Release Project"
      size="md"
      footer={footer}
      closeOnOverlay={!releasing}
      closeOnEscape={!releasing}
    >
      <div className={styles.warningBanner}>
        <span className={styles.warningIcon}>⚠️</span>
        <div>
          <div className={styles.warningText}>
            Releasing affects your completion rate
          </div>
          <div className={styles.warningSubtext}>
            Releases remaining: <strong>{releasesRemaining}/2</strong>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <FormSelect
          label="Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          options={RELEASE_REASONS}
          placeholder="Select a reason..."
          required
          disabled={releasing}
        />

        <Textarea
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any additional details..."
          rows={4}
          maxLength={500}
          showCount
          disabled={releasing}
        />
      </div>
    </Modal>
  );
};

export default ReleaseModal;
