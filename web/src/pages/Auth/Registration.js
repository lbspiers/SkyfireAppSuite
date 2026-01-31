/**
 * Self-Registration Screen
 * Creates a new company + user account
 * User must wait for admin approval before logging in
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { register } from '../../services/authService';
import styles from './Auth.module.css';

const Registration = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    companyName: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
      newErrors.email = 'Please enter a valid email';
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
      newErrors.confirmPassword = 'Passwords must match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validateForm()) return;

    setLoading(true);

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
        navigate('/registration-success');
      } else {
        setErrorMessage(response?.message || 'Registration failed');
      }
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || 'Registration failed';
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <div className={styles.logoContainer}>
          <span className={styles.logoText}>SKYFIRE</span>
        </div>

        <h1 className={styles.title}>Create Account</h1>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Company Name *</label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => handleInputChange('companyName', e.target.value)}
              placeholder="Your Company Name"
              disabled={loading}
              className={errors.companyName ? styles.inputError : ''}
            />
            {errors.companyName && <span className={styles.errorText}>{errors.companyName}</span>}
          </div>

          <div className={styles.formGroup}>
            <label>First Name *</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              placeholder="First Name"
              disabled={loading}
              className={errors.firstName ? styles.inputError : ''}
            />
            {errors.firstName && <span className={styles.errorText}>{errors.firstName}</span>}
          </div>

          <div className={styles.formGroup}>
            <label>Last Name *</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              placeholder="Last Name"
              disabled={loading}
              className={errors.lastName ? styles.inputError : ''}
            />
            {errors.lastName && <span className={styles.errorText}>{errors.lastName}</span>}
          </div>

          <div className={styles.formGroup}>
            <label>Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="email@company.com"
              disabled={loading}
              className={errors.email ? styles.inputError : ''}
            />
            {errors.email && <span className={styles.errorText}>{errors.email}</span>}
          </div>

          <div className={styles.formGroup}>
            <label>Phone Number *</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="(555) 123-4567"
              disabled={loading}
              className={errors.phone ? styles.inputError : ''}
            />
            {errors.phone && <span className={styles.errorText}>{errors.phone}</span>}
          </div>

          <div className={styles.formGroup}>
            <label>Password * (min 8 characters)</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              className={errors.password ? styles.inputError : ''}
            />
            {errors.password && <span className={styles.errorText}>{errors.password}</span>}
          </div>

          <div className={styles.formGroup}>
            <label>Confirm Password *</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              className={errors.confirmPassword ? styles.inputError : ''}
            />
            {errors.confirmPassword && <span className={styles.errorText}>{errors.confirmPassword}</span>}
          </div>

          {errorMessage && <div className={styles.errorMessage}>{errorMessage}</div>}

          <button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className={styles.loginLink}>
          Already have an account? <Link to="/login">Sign In</Link>
        </p>

        <p className={styles.inviteLink}>
          Have an invite code? <Link to="/redeem-invite">Redeem Code</Link>
        </p>
      </div>
    </div>
  );
};

export default Registration;
