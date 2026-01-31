/**
 * Registration Success Screen
 * Shown after successful self-registration
 * Informs user their account is under review
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Auth.module.css';

const RegistrationSuccess = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.successContainer}>
      <div className={styles.successContent}>
        <div className={styles.successIcon}>✅</div>

        <h1>Thank you for Registering!</h1>

        <p>A Skyfire Onboarding Specialist will be in contact soon.</p>

        <p className={styles.note}>
          Your account is under review. You'll receive an email once approved and can then log in to access the platform.
        </p>

        <button
          className={styles.successButton}
          onClick={() => navigate('/login')}
        >
          Back to Login
        </button>
      </div>
    </div>
  );
};

export default RegistrationSuccess;
