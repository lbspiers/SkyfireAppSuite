import React, { useState } from 'react';
import Dropdown from './Dropdown';
import Modal from './Modal';
import Button from './Button';
import styles from './TabStatusSelector.module.css';

/**
 * Status icons
 */
const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path fillRule="evenodd" d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.5-13v5.5l4.28 2.54a.5.5 0 1 1-.52.86L7.5 9V3a.5.5 0 0 1 1 0z"/>
  </svg>
);

const FileTextIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M5 4a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1H5zm-.5 2.5A.5.5 0 0 1 5 6h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zM5 8a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1H5zm0 2a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1H5z"/>
    <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2zm10-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1z"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path fillRule="evenodd" d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
  </svg>
);

const AlertTriangleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.146.146 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.163.163 0 0 1-.054.06.116.116 0 0 1-.066.017H1.146a.115.115 0 0 1-.066-.017.163.163 0 0 1-.054-.06.176.176 0 0 1 .002-.183L7.884 2.073a.147.147 0 0 1 .054-.057zm1.044-.45a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566z"/>
    <path d="M7.002 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 5.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995z"/>
  </svg>
);

const CircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

/**
 * TabStatusSelector - Dropdown selector for changing tab status
 *
 * @param {string} value - Current status: 'pending', 'draft', 'complete', 'needs_attention', 'none'
 * @param {function} onChange - Called with (newStatus, reason) when status changes
 * @param {boolean} disabled - Disable the selector
 * @param {boolean} showReasonInput - Show reason input for needs_attention (default: true)
 * @param {string} currentReason - Current status reason (for needs_attention)
 * @param {string} size - Button size: 'sm', 'md', 'lg' (default: 'sm')
 * @param {string} className - Additional CSS classes
 *
 * @example
 * ```jsx
 * <TabStatusSelector
 *   value="pending"
 *   onChange={(status, reason) => handleStatusUpdate(status, reason)}
 * />
 * ```
 */
const TabStatusSelector = ({
  value,
  onChange,
  disabled = false,
  showReasonInput = true,
  currentReason = '',
  size = 'sm',
  className = '',
}) => {
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [reasonText, setReasonText] = useState('');
  const [pendingStatus, setPendingStatus] = useState(null);

  const STATUS_OPTIONS = [
    { value: 'none', label: 'None', icon: <CircleIcon /> },
    { value: 'pending', label: 'Pending', icon: <ClockIcon /> },
    { value: 'draft', label: 'Draft', icon: <FileTextIcon /> },
    { value: 'complete', label: 'Complete', icon: <CheckIcon /> },
    { value: 'needs_attention', label: 'Needs Attention', icon: <AlertTriangleIcon /> },
  ];

  const currentOption = STATUS_OPTIONS.find((opt) => opt.value === value) || STATUS_OPTIONS[0];

  const handleStatusClick = (newStatus) => {
    if (newStatus === 'needs_attention' && showReasonInput) {
      // Show modal to enter reason
      setPendingStatus(newStatus);
      setReasonText(currentReason || '');
      setShowReasonModal(true);
    } else {
      // Update status without reason
      onChange(newStatus, null);
    }
  };

  const handleReasonSubmit = () => {
    onChange(pendingStatus, reasonText || null);
    setShowReasonModal(false);
    setPendingStatus(null);
    setReasonText('');
  };

  const handleReasonCancel = () => {
    setShowReasonModal(false);
    setPendingStatus(null);
    setReasonText('');
  };

  return (
    <>
      <div className={`${styles.container} ${className}`}>
        <Dropdown
          trigger={
            <button
              className={`${styles.trigger} ${styles[size]} ${disabled ? styles.disabled : ''}`}
              disabled={disabled}
            >
              <span className={styles.triggerIcon}>{currentOption.icon}</span>
              <span className={styles.triggerLabel}>{currentOption.label}</span>
              <ChevronDownIcon />
            </button>
          }
          align="left"
          closeOnClick={true}
        >
          <Dropdown.Label>Change Status</Dropdown.Label>
          <Dropdown.Divider />
          {STATUS_OPTIONS.map((option) => (
            <Dropdown.Item
              key={option.value}
              onClick={() => handleStatusClick(option.value)}
              icon={option.icon}
              className={value === option.value ? styles.active : ''}
            >
              {option.label}
            </Dropdown.Item>
          ))}
        </Dropdown>
      </div>

      {/* Reason Modal */}
      {showReasonModal && (
        <Modal
          isOpen={showReasonModal}
          onClose={handleReasonCancel}
          title="Needs Attention - Add Reason"
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={handleReasonCancel}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleReasonSubmit}>
                Update Status
              </Button>
            </>
          }
        >
          <div className={styles.modalContent}>
            <p className={styles.modalDescription}>
              Please provide a reason why this tab needs attention (optional):
            </p>
            <textarea
              className={styles.reasonInput}
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              placeholder="e.g., Missing documents, Requires review..."
              rows={4}
              autoFocus
            />
          </div>
        </Modal>
      )}
    </>
  );
};

const ChevronDownIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className={styles.chevronIcon}>
    <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
  </svg>
);

export default TabStatusSelector;
