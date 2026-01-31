/**
 * Self-Registration Screen
 * Creates a new company + user account
 * User must wait for admin approval before logging in
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../../services/authService';
import { showErrorToast, showSuccessToast } from '../../utils/errorHandling';
import styles from '../../styles/Auth.module.css';

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    companyName: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms';
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
      const response = await register({
        companyName: formData.companyName,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });

      if (response?.status === 'SUCCESS') {
        showSuccessToast('Registration successful! Please check your email.');
        navigate('/registration-success', { state: { email: formData.email } });
      }
    } catch (error) {
      console.error('Registration failed:', error);
      showErrorToast(error, 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <h1 className={styles.authTitle}>Create Account</h1>
          <p className={styles.authSubtitle}>Join Skyfire to get started</p>
        </div>

        <form className={styles.authForm} onSubmit={handleSubmit}>
          {/* Company Name */}
          <div className={styles.formGroup}>
            <label htmlFor="companyName" className={styles.formLabel}>
              Company Name
            </label>
            <input
              type="text"
              id="companyName"
              name="companyName"
              className={styles.formInput}
              value={formData.companyName}
              onChange={handleChange}
              disabled={isSubmitting}
              autoComplete="organization"
            />
            {errors.companyName && (
              <span className={styles.formError}>{errors.companyName}</span>
            )}
          </div>

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

          {/* Email */}
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.formLabel}>
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className={styles.formInput}
              value={formData.email}
              onChange={handleChange}
              disabled={isSubmitting}
              autoComplete="email"
            />
            {errors.email && (
              <span className={styles.formError}>{errors.email}</span>
            )}
          </div>

          {/* Phone */}
          <div className={styles.formGroup}>
            <label htmlFor="phone" className={styles.formLabel}>
              Phone
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              className={styles.formInput}
              value={formData.phone}
              onChange={handleChange}
              disabled={isSubmitting}
              autoComplete="tel"
            />
            {errors.phone && (
              <span className={styles.formError}>{errors.phone}</span>
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
              placeholder="Minimum 8 characters"
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

          {/* Terms Checkbox */}
          <div className={styles.checkboxGroup}>
            <input
              type="checkbox"
              id="agreeToTerms"
              name="agreeToTerms"
              className={styles.checkbox}
              checked={formData.agreeToTerms}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            <label htmlFor="agreeToTerms" className={styles.checkboxLabel}>
              I agree to the Terms of Service and Privacy Policy
            </label>
          </div>
          {errors.agreeToTerms && (
            <span className={styles.formError}>{errors.agreeToTerms}</span>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className={styles.spinner} />
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Links */}
        <div className={styles.authLinks}>
          <span className={styles.authLink}>
            Already have an account?{' '}
            <Link to="/login" className={styles.authLinkButton}>
              Sign in
            </Link>
          </span>
          <span className={styles.authLink}>
            Have an invite code?{' '}
            <Link to="/redeem-invite" className={styles.authLinkButton}>
              Redeem Code
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
};

export default Register;
