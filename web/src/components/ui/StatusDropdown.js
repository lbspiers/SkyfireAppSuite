import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { StatusActionButton } from './';
import styles from './StatusDropdown.module.css';
import { getStatusOptionsForTab } from '../../constants/tabStatusConfig';

/**
 * StatusDropdown - Dropdown selector for manually overriding tab status
 *
 * @param {string} currentStatus - Current status value
 * @param {function} onStatusChange - Callback when status is changed (status, reason)
 * @param {boolean} disabled - Disabled state
 * @param {string} tabName - Tab name for filtering available statuses ('survey' | 'site_plan' | 'plan_set' | 'revisions')
 */
const StatusDropdown = ({ currentStatus = 'none', onStatusChange, disabled = false, tabName = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [reason, setReason] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);

  // Update dropdown position when it opens
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left
      });
    }
  }, [isOpen]);

  // Get tab-specific status options, or all statuses if no tabName provided
  const statusOptions = tabName
    ? getStatusOptionsForTab(tabName)
    : [
        { value: 'pending', label: 'Pending' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'draft', label: 'Draft' },
        { value: 'complete', label: 'Complete' },
        { value: 'needs_attention', label: 'Needs Attention' },
        { value: 'none', label: 'None' }
      ];

  const statuses = statusOptions;

  const handleStatusClick = (status) => {
    if (status === 'needs_attention') {
      // Show modal for reason
      setSelectedStatus(status);
      setShowReasonModal(true);
      setIsOpen(false);
    } else {
      // Update status immediately
      onStatusChange(status, null);
      setIsOpen(false);
    }
  };

  const handleReasonSubmit = () => {
    if (selectedStatus && reason.trim()) {
      onStatusChange(selectedStatus, reason.trim());
      setShowReasonModal(false);
      setReason('');
      setSelectedStatus(null);
    }
  };

  const handleReasonCancel = () => {
    setShowReasonModal(false);
    setReason('');
    setSelectedStatus(null);
  };

  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <>
      <div className={styles.container} ref={triggerRef}>
        <div className={styles.trigger} onClick={handleToggle}>
          <StatusActionButton status={currentStatus} disabled={true} />
        </div>
      </div>

      {isOpen && createPortal(
        <>
          <div className={styles.backdrop} onClick={() => setIsOpen(false)} />
          <div className={styles.dropdown} style={{ position: 'fixed', top: `${dropdownPosition.top}px`, left: `${dropdownPosition.left}px` }}>
            {statuses.map((status) => (
              <button
                key={status.value}
                className={`${styles.option} ${currentStatus === status.value ? styles.optionActive : ''}`}
                onClick={() => handleStatusClick(status.value)}
              >
                <StatusActionButton status={status.value} disabled />
                <span className={styles.optionLabel}>{status.label}</span>
              </button>
            ))}
          </div>
        </>,
        document.body
      )}

      {/* Reason Modal for "Needs Attention" */}
      {showReasonModal && (
        <div className={styles.modalBackdrop} onClick={handleReasonCancel}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Needs Attention - Reason Required</h3>
            <p className={styles.modalDescription}>
              Please provide a reason why this requires attention:
            </p>
            <textarea
              className={styles.reasonInput}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason..."
              rows={4}
              autoFocus
            />
            <div className={styles.modalActions}>
              <button
                className={styles.cancelButton}
                onClick={handleReasonCancel}
              >
                Cancel
              </button>
              <button
                className={styles.submitButton}
                onClick={handleReasonSubmit}
                disabled={!reason.trim()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StatusDropdown;
