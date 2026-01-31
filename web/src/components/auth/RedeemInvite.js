import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { redeemInviteCode, validateInviteCode } from '../../services/authService';
import { showErrorToast, showSuccessToast } from '../../utils/errorHandling';
import LoadingSpinner from '../ui/LoadingSpinner';
import styles from '../../styles/Auth.module.css';

const RedeemInvite = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [inviteData, setInviteData] = useState(null);
  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate invite token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setValidationError('Invalid invite link. No token provided.');
        setIsValidating(false);
        return;
      }

      try {
        const data = await validateInviteCode(token);
        setInviteData(data);
        setIsValidating(false);
      } catch (error) {
        console.error('Token validation failed:', error);
        setValidationError(error.message || 'Invalid or expired invite link.');
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await redeemInviteCode({
        code: token,
        email: inviteData?.email || '',
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: inviteData?.phone || '',
        password: formData.password,
      });

      showSuccessToast('Account created successfully! Please log in.');
      navigate('/login');
    } catch (error) {
      console.error('Invite redemption failed:', error);
      showErrorToast(error, 'Failed to create account');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isValidating) {
    return (
      <div className={styles.authContainer}>
        <div className={styles.authCard}>
          <div className={styles.successContainer}>
            <LoadingSpinner size="large" />
            <p className={styles.successMessage}>Validating invite...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (validationError) {
    return (
      <div className={styles.authContainer}>
        <div className={styles.authCard}>
          <div className={styles.successContainer}>
            <svg
              className={styles.successIcon}
              style={{ color: 'var(--color-error)' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>

            <h1 className={styles.successTitle}>Invalid Invite</h1>
            <p className={styles.successMessage}>{validationError}</p>

            <div className={styles.successActions}>
              <button
                type="button"
                className={styles.submitBtn}
                onClick={() => navigate('/login')}
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success - show registration form
  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <h1 className={styles.authTitle}>Complete Your Account</h1>
          <p className={styles.authSubtitle}>
            You've been invited to join{' '}
            <strong>{inviteData?.company_name || 'the team'}</strong>
          </p>
        </div>

        {inviteData?.email && (
          <div className={styles.alertInfo}>
            Creating account for: <strong>{inviteData.email}</strong>
          </div>
        )}

        <form className={styles.authForm} onSubmit={handleSubmit}>
          {/* First Name */}
          <div className={styles.formGroup}>
            <label htmlFor="firstName" className={styles.formLabel}>
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              className={styles.formInput}
              value={formData.firstName}
              onChange={handleChange}
              disabled={isSubmitting}
              autoComplete="given-name"
            />
            {errors.firstName && (
              <span className={styles.formError}>{errors.firstName}</span>
            )}
          </div>

          {/* Last Name */}
          <div className={styles.formGroup}>
            <label htmlFor="lastName" className={styles.formLabel}>
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              className={styles.formInput}
              value={formData.lastName}
              onChange={handleChange}
              disabled={isSubmitting}
              autoComplete="family-name"
            />
            {errors.lastName && (
              <span className={styles.formError}>{errors.lastName}</span>
            )}
          </div>

          {/* Password */}
          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.formLabel}>
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className={styles.formInput}
              value={formData.password}
              onChange={handleChange}
              disabled={isSubmitting}
              autoComplete="new-password"
            />
            {errors.password && (
              <span className={styles.formError}>{errors.password}</span>
            )}
          </div>

          {/* Confirm Password */}
          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword" className={styles.formLabel}>
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              className={styles.formInput}
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={isSubmitting}
              autoComplete="new-password"
            />
            {errors.confirmPassword && (
              <span className={styles.formError}>{errors.confirmPassword}</span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isSubmitting}
          >
            {isSubmitting ? <span className={styles.spinner} /> : 'Create Account'}
          </button>
        </form>

        {/* Links */}
        <div className={styles.authLinks}>
          <span className={styles.authLink}>
            Already have an account?{' '}
            <button
              type="button"
              className={styles.authLinkButton}
              onClick={() => navigate('/login')}
            >
              Sign in
            </button>
          </span>
        </div>
      </div>
    </div>
  );
};

export default RedeemInvite;
