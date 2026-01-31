import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { forceChangePassword } from '../../services/authService';
import PasswordStrength from '../../components/ui/PasswordStrength';
import styles from './Auth.module.css';

const ForceChangePassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Verify that user came from login with mustChangePassword flag
    const mustChange = sessionStorage.getItem('mustChangePassword');
    const tempToken = sessionStorage.getItem('tempAccessToken');

    if (!mustChange || !tempToken) {
      // If no flag or token, redirect to login
      navigate('/login');
    }
  }, [navigate]);

  const validatePassword = () => {
    if (!newPassword) {
      setError('Please enter a new password');
      return false;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validatePassword()) {
      return;
    }

    setLoading(true);

    try {
      const tempToken = sessionStorage.getItem('tempAccessToken');

      if (!tempToken) {
        throw new Error('Session expired. Please log in again.');
      }

      await forceChangePassword(newPassword, tempToken);

      // Clear temporary session data
      sessionStorage.removeItem('mustChangePassword');
      sessionStorage.removeItem('tempAccessToken');

      // Show success message
      toast.success('Password changed successfully! Please log in with your new password.', {
        position: 'top-right',
        hideProgressBar: true,
        closeOnClick: false,
        className: 'bg-success text-white',
      });

      // Redirect to login
      navigate('/login');
    } catch (err) {
      setLoading(false);
      let errorMsg = 'Failed to change password. Please try again.';

      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.message) {
        errorMsg = err.message;
      }

      setError(errorMsg);

      toast.error(`Error: ${errorMsg}`, {
        position: 'top-right',
        hideProgressBar: true,
        closeOnClick: false,
        className: 'bg-danger text-white',
      });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <div className={styles.logoContainer}>
          <h1 className={styles.logoText}>Skyfire</h1>
        </div>

        <h2 className={styles.title}>Please Set a New Password</h2>
        <p className={styles.subtitle}>
          Your password was reset by an administrator. Please create a new password to continue.
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="newPassword">New Password</label>
            <div className={styles.passwordInputWrapper}>
              <input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 8 characters)"
                className={error && error.includes('password') ? styles.inputError : ''}
                disabled={loading}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className={styles.passwordToggleButton}
              >
                {showNewPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {newPassword && <PasswordStrength password={newPassword} />}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className={styles.passwordInputWrapper}>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
                className={error && error.includes('match') ? styles.inputError : ''}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className={styles.passwordToggleButton}
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading || !newPassword || !confirmPassword}
          >
            {loading ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>

        <div className={styles.loginLink}>
          <a href="/login">Back to Login</a>
        </div>
      </div>
    </div>
  );
};

export default ForceChangePassword;
