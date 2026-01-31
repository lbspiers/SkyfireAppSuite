/**
 * Redeem Invite Code Screen
 * Two-step process:
 * 1. Enter invite code (SKY-XXXX-XXXX) OR auto-validate from URL param (?code=SKY-XXXX-XXXX)
 * 2. Create account with pre-filled data
 * Users get instant access (no approval needed)
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { validateInviteCode, redeemInviteCode } from '../../services/authService';
import { setTokens } from '../../store/slices/authSlice';
import styles from './Auth.module.css';

const RedeemInvite = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState('enter-code');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [inviteData, setInviteData] = useState(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});

  // Auto-validate code from URL parameter on mount
  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) {
      setCode(codeFromUrl);
      // Auto-validate the code
      handleValidateCode(codeFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const formatInviteCode = (text) => {
    const cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
    let formatted = cleaned;
    if (cleaned.length > 3) {
      formatted = cleaned.slice(0, 3) + '-' + cleaned.slice(3);
    }
    if (cleaned.length > 7) {
      formatted = formatted.slice(0, 8) + '-' + cleaned.slice(7, 11);
    }
    return formatted.slice(0, 13);
  };

  const handleCodeChange = (e) => {
    const formatted = formatInviteCode(e.target.value);
    setCode(formatted);
  };

  const handleValidateCode = async (codeToValidate = null) => {
    const inviteCode = codeToValidate || code;

    if (inviteCode.replace(/-/g, '').length < 11) {
      toast.error('Please enter a complete invite code');
      return;
    }

    setLoading(true);

    try {
      const response = await validateInviteCode(inviteCode);

      if (response.status === 'SUCCESS') {
        const data = response.data;
        setInviteData(data);

        setFormData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.phone || '',
          password: '',
          confirmPassword: '',
        });

        setStep('create-account');
        toast.success('Code validated! Complete your account setup.');
      }
    } catch (error) {
      const message = error?.response?.data?.message || 'Invalid invite code. Please check and try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim() || !formData.email.includes('@')) newErrors.email = 'Valid email is required';
    if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateAccount = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await redeemInviteCode({
        code,
        ...formData,
      });

      if (response.status === 'SUCCESS') {
        const { accessToken, refreshToken, user } = response.data || response;

        // Store tokens in session only (no "remember me" on first login)
        sessionStorage.setItem('token', accessToken);
        if (refreshToken) {
          sessionStorage.setItem('refreshToken', refreshToken);
        }

        // Dispatch tokens to Redux store
        dispatch(setTokens({
          accessToken,
          refreshToken,
          rememberMe: false,
        }));

        // Prepare complete user data with company info
        const userData = {
          ...user,
          isSuperAdmin: false, // New users are not super admins
          isSuperUser: false,
          token: accessToken,
          refreshToken,
          company: user.company || { name: inviteData?.companyName },
        };

        // Store user data
        sessionStorage.setItem('userData', JSON.stringify(userData));
        if (user.company) {
          sessionStorage.setItem('companyData', JSON.stringify(user.company));
        }

        toast.success(`🎉 Welcome to ${inviteData?.companyName || 'Skyfire'}!`);
        navigate('/dashboard');
      }
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to create account. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) setErrors({ ...errors, [field]: undefined });
  };

  if (step === 'enter-code') {
    return (
      <div className={styles.container}>
        <div className={styles.formWrapper}>
          <button className={styles.backButton} onClick={() => navigate('/login')}>
            ← Back to Login
          </button>

          <div className={styles.logoContainer}>
            <span className={styles.logoText}>SKYFIRE</span>
          </div>

          <h1 className={styles.title}>Redeem Invite Code</h1>
          <p className={styles.subtitle}>
            Enter the invite code you received via email to join your team
          </p>

          <div className={styles.codeInputContainer}>
            <input
              type="text"
              value={code}
              onChange={handleCodeChange}
              placeholder="SKY-XXXX-XXXX"
              className={`${styles.formGroup} input ${styles.codeInput}`}
              maxLength={13}
              autoFocus
            />
            <p className={styles.hint}>Format: SKY-XXXX-XXXX</p>
          </div>

          <button className={styles.submitButton} onClick={handleValidateCode} disabled={loading}>
            {loading ? 'Validating...' : 'Continue'}
          </button>

          <div className={styles.helpSection}>
            <p>Can't find your invite code? Check your email (including spam) or contact your administrator.</p>
          </div>

          <p className={styles.loginLink}>
            Need to create a new company? <Link to="/register">Sign Up</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <button className={styles.backButton} onClick={() => setStep('enter-code')}>
          ← Back
        </button>

        <h1 className={styles.title}>Create Your Account</h1>
        <p className={styles.subtitle}>
          Joining <strong>{inviteData?.companyName || 'your team'}</strong>
        </p>

        <div className={styles.form}>
          <div className={styles.formGroup}>
            <label>First Name *</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
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
              disabled={loading}
              className={errors.email ? styles.inputError : ''}
            />
            {errors.email && <span className={styles.errorText}>{errors.email}</span>}
          </div>

          <div className={styles.formGroup}>
            <label>Phone (Optional)</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Password * (min 8 characters)</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
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
              disabled={loading}
              className={errors.confirmPassword ? styles.inputError : ''}
            />
            {errors.confirmPassword && <span className={styles.errorText}>{errors.confirmPassword}</span>}
          </div>

          <button className={styles.submitButton} onClick={handleCreateAccount} disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RedeemInvite;
