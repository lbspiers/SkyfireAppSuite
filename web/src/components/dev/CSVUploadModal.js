import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Textarea from '../ui/Textarea';
import { toast } from 'react-toastify';
import { bulkCompleteCSV } from '../../services/devTaskService';
import styles from './CSVUploadModal.module.css';

const CSVUploadModal = ({ isOpen, onClose, onSuccess }) => {
  const [csvContent, setCsvContent] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCsvContent(event.target.result);
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async () => {
    if (!csvContent.trim()) {
      toast.error('Please enter or upload task names');
      return;
    }

    setLoading(true);
    try {
      const response = await bulkCompleteCSV(csvContent);

      if (response.status === 'SUCCESS') {
        setResults(response.data);
        toast.success(response.message);
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to process CSV');
    }
    setLoading(false);
  };

  const handleClose = () => {
    setCsvContent('');
    setResults(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Bulk Complete Tasks"
      size="md"
      footer={
        !results && (
          <>
            <Button
              variant="secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={loading}
            >
              Complete Tasks
            </Button>
          </>
        )
      }
    >
      {!results ? (
        <div className={styles.uploadSection}>
          <p className={styles.description}>
            Enter task names (one per line) or upload a CSV file:
          </p>

          <input
            type="file"
            accept=".csv,.txt"
            onChange={handleFileUpload}
            className={styles.fileInput}
          />

          <Textarea
            value={csvContent}
            onChange={(e) => setCsvContent(e.target.value)}
            placeholder="Task name 1&#10;Task name 2&#10;Task name 3"
            rows={10}
            fullWidth
          />
        </div>
      ) : (
        <div className={styles.results}>
          <h3 className={styles.resultsTitle}>Results</h3>

          <div className={styles.summary}>
            <div className={styles.summaryItem}>
              <span className={styles.successIcon}>✅</span>
              <span className={styles.summaryLabel}>Completed:</span>
              <span className={styles.summaryValue}>{results.summary.completed}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.warningIcon}>⚠️</span>
              <span className={styles.summaryLabel}>Not Found:</span>
              <span className={styles.summaryValue}>{results.summary.notFound}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.infoIcon}>ℹ️</span>
              <span className={styles.summaryLabel}>Already Done:</span>
              <span className={styles.summaryValue}>{results.summary.alreadyComplete}</span>
            </div>
          </div>

          {results.completed.length > 0 && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>Completed Tasks:</h4>
              <ul className={styles.taskList}>
                {results.completed.map(t => (
                  <li key={t.uuid} className={styles.taskItem}>{t.title}</li>
                ))}
              </ul>
            </div>
          )}

          {results.notFound.length > 0 && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>Not Found:</h4>
              <ul className={styles.taskList}>
                {results.notFound.map((name, i) => (
                  <li key={i} className={styles.taskItem}>{name}</li>
                ))}
              </ul>
            </div>
          )}

          {results.alreadyComplete.length > 0 && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>Already Complete:</h4>
              <ul className={styles.taskList}>
                {results.alreadyComplete.map((name, i) => (
                  <li key={i} className={styles.taskItem}>{name}</li>
                ))}
              </ul>
            </div>
          )}

          <div className={styles.closeButtonContainer}>
            <Button onClick={handleClose} variant="primary" fullWidth>
              Close
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default CSVUploadModal;
