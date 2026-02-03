/**
 * ApprovalModal Component
 * Shows approval progress and status (approving → sending email → success/error)
 */

import React from 'react';
import { Modal, LoadingSpinner } from '../ui';
import styles from './ApprovalModal.module.css';

const ApprovalModal = ({ user, status, onClose }) => {
  const getModalContent = () => {
    switch (status) {
      case 'approving':
        return {
          icon: <LoadingSpinner />,
          title: 'Approving User',
          message: `Approving ${user.first_name} ${user.last_name}...`,
          variant: 'info'
        };

      case 'sending-email':
        return {
          icon: <LoadingSpinner />,
          title: 'Sending Approval Email',
          message: 'Sending welcome email with login credentials...',
          variant: 'info'
        };

      case 'success':
        return {
          icon: (
            <div className={styles.successIcon}>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="24" fill="#10B981" />
                <path
                  d="M14 24l8 8 12-12"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          ),
          title: 'User Approved!',
          message: `${user.first_name} ${user.last_name} has been approved and notified via email.`,
          variant: 'success'
        };

      case 'email-failed':
        return {
          icon: (
            <div className={styles.warningIcon}>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="24" fill="#F59E0B" />
                <path
                  d="M24 14v12M24 30h.01"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          ),
          title: 'User Approved (Email Failed)',
          message: `${user.first_name} ${user.last_name} has been approved, but the approval email failed to send. Please contact them directly.`,
          variant: 'warning'
        };

      case 'error':
        return {
          icon: (
            <div className={styles.errorIcon}>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="24" fill="#EF4444" />
                <path
                  d="M16 16l16 16M16 32l16-16"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          ),
          title: 'Approval Failed',
          message: 'Failed to approve user. Please try again.',
          variant: 'error'
        };

      default:
        return null;
    }
  };

  const content = getModalContent();
  if (!content) return null;

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      size="sm"
      hideFooter
    >
      <div className={styles.modalContent}>
        <div className={styles.iconContainer}>
          {content.icon}
        </div>
        <h3 className={styles.title}>{content.title}</h3>
        <p className={styles.message}>{content.message}</p>
      </div>
    </Modal>
  );
};

export default ApprovalModal;
