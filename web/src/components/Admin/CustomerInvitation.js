/**
 * Customer Invitation Section
 * Allows super admins to invite new customers/companies
 */

import React, { useState } from 'react';
import Button from '../ui/Button';
import InviteCustomerModal from './InviteCustomerModal';
import styles from './CustomerInvitation.module.css';

const CustomerInvitation = () => {
  const [showInviteModal, setShowInviteModal] = useState(false);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h4 className={styles.title}>Invite New Customer</h4>
          <p className={styles.subtitle}>
            Send an invitation to a new company to join Skyfire
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowInviteModal(true)}
        >
          Invite Customer
        </Button>
      </div>

      <div className={styles.infoBox}>
        <div className={styles.infoIcon}>📧</div>
        <div className={styles.infoContent}>
          <h5 className={styles.infoTitle}>How it works:</h5>
          <ul className={styles.infoList}>
            <li>Enter the company name and contact information</li>
            <li>System sends an invitation email with a unique link</li>
            <li>Customer completes their registration</li>
            <li>They get instant access (no approval needed)</li>
          </ul>
        </div>
      </div>

      {/* Invite Customer Modal */}
      <InviteCustomerModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={() => {
          // Refresh pending invitations list if needed
        }}
      />
    </div>
  );
};

export default CustomerInvitation;
