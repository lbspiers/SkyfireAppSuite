import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { resendVerificationEmail } from '../../services/authService';
import { showErrorToast, showSuccessToast } from '../../utils/errorHandling';
import styles from '../../styles/Auth.module.css';

const RegistrationSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || 'your email';

  const [isResending, setIsResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleResendVerification = async () => {
    if (!email || email === 'your email' || isResending || resent) {
      return;
    }

    setIsResending(true);
    try {
      await resendVerificationEmail(email);
      setResent(true);
      showSuccessToast('Verification email sent! Please check your inbox.');
    } catch (error) {
      console.error('Failed to resend verification:', error);
      showErrorToast(error, 'Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.successContainer}>
          <svg
            className={styles.successIcon}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>

          <h1 className={styles.successTitle}>Registration Successful!</h1>

          <p className={styles.successMessage}>
            Thank you for registering. A verification email has been sent to{' '}
            <strong>{email}</strong>. Please check your inbox and click the
            verification link to activate your account.
          </p>

          <div className={styles.successActions}>
            <button
              type="button"
              className={styles.submitBtn}
              onClick={() => navigate('/login')}
            >
              Go to Login
            </button>
          </div>

          <div className={styles.authLinks}>
            <span className={styles.authLink}>
              Didn't receive the email?{' '}
              <button
                type="button"
                className={styles.authLinkButton}
                onClick={handleResendVerification}
                disabled={isResending || resent || email === 'your email'}
              >
                {isResending ? 'Sending...' : resent ? 'Email Sent!' : 'Resend verification'}
              </button>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationSuccess;
