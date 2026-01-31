import { useState } from 'react';
import { toast } from 'react-toastify';
import { Modal, Button } from '../../../components/ui';
import styles from './SubmitModal.module.css';

const REQUIRED_FILE_TYPES = [
  { type: 'site_plan_pdf', label: 'Site Plan (PDF)' },
  { type: 'site_plan_dwg', label: 'Site Plan (DWG)' },
  { type: 'single_line_pdf', label: 'Single Line Diagram (PDF)' }
];

/**
 * Submit project modal
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal open state
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onSubmit - Submit handler
 * @param {Array} props.files - Uploaded files
 */
const SubmitModal = ({ isOpen, onClose, onSubmit, files = [] }) => {
  const [submitting, setSubmitting] = useState(false);

  const getFileForType = (fileType) => {
    return files.find(f => f.fileType === fileType);
  };

  const allRequiredPresent = REQUIRED_FILE_TYPES.every(rf => getFileForType(rf.type));

  const handleSubmit = async () => {
    if (!allRequiredPresent) {
      toast.warning('Please upload all required files before submitting', {
        position: 'top-center',
        autoClose: 4000,
      });
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit();

      // Show success toast instead of custom animation
      toast.success('Project submitted successfully!', {
        position: 'top-center',
        autoClose: 2000,
      });

      onClose();
    } catch (error) {
      console.error('Failed to submit project:', error);
      toast.error('Failed to submit project. Please try again.', {
        position: 'top-center',
        autoClose: 5000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const footer = (
    <>
      <Button
        variant="secondary"
        onClick={onClose}
        disabled={submitting}
      >
        Cancel
      </Button>
      <Button
        variant="primary"
        onClick={handleSubmit}
        disabled={submitting || !allRequiredPresent}
        loading={submitting}
      >
        Submit Project
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Project"
      size="md"
      footer={footer}
      closeOnEscape={!submitting}
      showCloseButton={!submitting}
    >
      <div className={styles.content}>
        <p className={styles.subtitle}>
          Please confirm all required files are uploaded:
        </p>

        <div className={styles.fileChecklist}>
          {REQUIRED_FILE_TYPES.map(rf => {
            const file = getFileForType(rf.type);
            const isPresent = !!file;

            return (
              <div key={rf.type} className={styles.checklistItem}>
                <span className={`${styles.checkbox} ${isPresent ? styles.checked : ''}`}>
                  {isPresent ? '✓' : ''}
                </span>
                <span className={styles.itemLabel}>{rf.label}</span>
                {isPresent && file.fileName && (
                  <span className={styles.fileName}>({file.fileName})</span>
                )}
              </div>
            );
          })}
        </div>

        {!allRequiredPresent && (
          <div className={styles.errorBanner}>
            <span className={styles.errorIcon}>⚠️</span>
            <span>Please upload all required files before submitting</span>
          </div>
        )}

        {allRequiredPresent && (
          <div className={styles.successBanner}>
            <span className={styles.successBannerIcon}>✓</span>
            <span>All required files uploaded</span>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SubmitModal;
