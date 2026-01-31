import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import axios from '../config/axios';
import logger from '../services/devLogger';
import { setTokens } from '../store/slices/authSlice';
import { verifyAdminStatus } from '../utils/adminUtils';

// Reusable UI Components
import { CircleToggle } from './ui';
import IconButton from './ui/IconButton';

// Styles
import styles from '../styles/Login.module.css';

// Assets
import appLogo from '../assets/images/applogo.png';
import appIcon from '../assets/images/appIcon.png';
import plusIcon from '../assets/images/icons/plus_icon_orange_fd7332.png';
import eyeIcon from '../assets/images/icons/eye.png';

// Validation schema
const validationSchema = Yup.object({
  userName: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
});

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const errorTimeoutRef = useRef(null);

  // Formik form management
  const formik = useFormik({
    initialValues: {
      userName: '',
      password: '',
      keepSignIn: false,
    },
    validationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values) => {
      setLoading(true);
      setErrorMessage('');

      // Clear any existing error timeout
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
        errorTimeoutRef.current = null;
      }

      try {
        // Login API call to backend
        const loginResponse = await axios.post('/auth/login', {
          email: values.userName,
          password: values.password,
        });

        if (!loginResponse || !loginResponse.data) {
          throw new Error('Invalid response from server');
        }

        const { accessToken, refreshToken, mustChangePassword } = loginResponse.data;

        if (!accessToken) {
          throw new Error('Invalid login response');
        }

        // Check if user must change password
        if (mustChangePassword) {
          sessionStorage.setItem('mustChangePassword', 'true');
          sessionStorage.setItem('tempAccessToken', accessToken);
          navigate('/force-change-password');
          setLoading(false);
          return;
        }

        // Set authorization header for future requests
        axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

        // Fetch user profile and company data using the same endpoint as mobile app
        let userData = { email: values.userName };
        let companyData = {};

        try {
          const profileResponse = await axios.post('/auth/handle-login', {}, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          // Extract user and company data (matches mobile app pattern)
          userData = profileResponse.data?.user || {};
          companyData = profileResponse.data?.company || userData?.company || {};

          logger.log('Auth', 'Profile fetch successful:', userData.email);
          logger.log('Auth', 'Company UUID:', companyData.uuid);
        } catch (err) {
          logger.warn('Auth', 'Profile fetch failed:', err);
        }

        // Dispatch tokens to Redux store (CRITICAL for axiosInstance to work)
        dispatch(setTokens({
          accessToken,
          refreshToken,
          rememberMe: values.keepSignIn,
        }));

        // Store token FIRST - BEFORE any authenticated API calls
        if (values.keepSignIn) {
          localStorage.setItem('token', accessToken);
        }
        sessionStorage.setItem('token', accessToken);

        // NOW call server-verified admin status (requires token to be in storage)
        const isSuperAdmin = await verifyAdminStatus();

        // Prepare user data with all necessary fields
        // Include company nested in userData for components that access userData.company.uuid
        userData = {
          ...userData,
          email: userData.email || values.userName, // Ensure email is always set
          isSuperAdmin, // Server-verified admin status
          isSuperUser: isSuperAdmin, // Alias for consistency
          token: accessToken,
          refreshToken,
          company: companyData,  // Nest company in userData for useDashboardData.js pattern
        };

        // Store complete user data and company data based on "keep me logged in" preference
        if (values.keepSignIn) {
          localStorage.setItem('userData', JSON.stringify(userData));
          localStorage.setItem('companyData', JSON.stringify(companyData));  // Store separately for surveyService.js pattern
        }
        sessionStorage.setItem('userData', JSON.stringify(userData));
        sessionStorage.setItem('companyData', JSON.stringify(companyData));  // Store separately for surveyService.js pattern

        // Role-based navigation
        const isDrafter = userData.is_drafter === true || userData.isDrafter === true;
        const destinationRoute = isDrafter ? '/drafter-portal' : '/dashboard';
        const welcomeMessage = isDrafter ? 'Welcome to the Drafter Portal!' : 'Welcome to Skyfire!';

        navigate(destinationRoute);
        toast.success(welcomeMessage, {
          position: 'top-right',
          hideProgressBar: true,
          closeOnClick: false,
          className: 'bg-success text-white',
        });
        setLoading(false);
      } catch (error) {
        setLoading(false);
        let errorMsg = 'Login failed. Please check your credentials.';

        if (error.response && error.response.data && error.response.data.message) {
          errorMsg = error.response.data.message;
        } else if (error.message) {
          errorMsg = error.message;
        }

        setErrorMessage(errorMsg);

        // Auto-hide error message after 10 seconds
        errorTimeoutRef.current = setTimeout(() => {
          setErrorMessage('');
          errorTimeoutRef.current = null;
        }, 10000);

        toast.error(`Error: ${errorMsg}`, {
          position: 'top-right',
          hideProgressBar: true,
          closeOnClick: false,
          className: 'bg-danger text-white',
        });
      }
    },
  });

  // Clear error message when user starts typing
  const handleInputChange = (field) => (e) => {
    formik.handleChange(e);
    if (errorMessage) {
      setErrorMessage('');
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
        errorTimeoutRef.current = null;
      }
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={styles.gradientContainer}>
      <div className={`${styles.loginWrapper} ${loading ? styles.loading : ''}`}>
        {/* Logo */}
        <div className={styles.logoContainer}>
          <img src={appLogo} alt="Skyfire Logo" className={styles.logo} />
        </div>

        {/* Login Form */}
        <form onSubmit={formik.handleSubmit} className={styles.formContainer}>
          {/* Email Input */}
          <div className={styles.inputGroup}>
            <label htmlFor="userName" className={styles.inputLabel}>Email</label>
            <div className={styles.passwordInputContainer}>
              <input
                type="email"
                name="userName"
                id="userName"
                placeholder="you@example.com"
                value={formik.values.userName}
                onChange={handleInputChange('userName')}
                onBlur={formik.handleBlur}
                autoComplete="email"
                className={styles.textInput}
              />
            </div>
            {formik.touched.userName && formik.errors.userName && (
              <div className={styles.errorText}>{formik.errors.userName}</div>
            )}
          </div>

          {/* Password Input */}
          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.inputLabel}>Password</label>
            <div className={styles.passwordInputContainer}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                id="password"
                placeholder="••••••••"
                value={formik.values.password}
                onChange={handleInputChange('password')}
                onBlur={formik.handleBlur}
                autoComplete="current-password"
                className={styles.textInput}
              />
              <button
                type="button"
                className={styles.eyeIconButton}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <img src={eyeIcon} alt="" className={styles.eyeIcon} />
              </button>
            </div>
            {formik.touched.password && formik.errors.password && (
              <div className={styles.errorText}>{formik.errors.password}</div>
            )}
          </div>

          {/* Global Error Message */}
          {errorMessage && (
            <div
              className={styles.globalError}
              onClick={() => {
                setErrorMessage('');
                if (errorTimeoutRef.current) {
                  clearTimeout(errorTimeoutRef.current);
                  errorTimeoutRef.current = null;
                }
              }}
              role="alert"
            >
              {errorMessage}
            </div>
          )}

          {/* Keep Me Logged In - Circle Toggle */}
          <CircleToggle
            checked={formik.values.keepSignIn}
            onChange={(checked) => formik.setFieldValue('keepSignIn', checked)}
            label="Keep Me Logged In"
            size="md"
          />

          {/* Action Buttons */}
          <div className={styles.iconButtonRow}>
            <IconButton
              icon={plusIcon}
              label="Sign Up"
              onClick={() => navigate('/register')}
              type="button"
            />

            <IconButton
              icon={appIcon}
              label="Sign In"
              onClick={formik.handleSubmit}
              disabled={loading}
              primary
              type="submit"
            />
          </div>

          {/* Forgot Password Link */}
          <a
            href="/recover-credentials"
            className={styles.helpLink}
            onClick={(e) => {
              e.preventDefault();
              navigate('/recover-credentials');
            }}
          >
            Forgot Password?
          </a>

          {/* Registration Links */}
          <div className={styles.registrationLinks}>
            <p className={styles.registrationText}>
              Don't have an account? <Link to="/register" className={styles.registrationLink}>Sign Up</Link>
            </p>
            <p className={styles.registrationText}>
              Have an invite code? <Link to="/redeem-invite" className={styles.registrationLink}>Redeem Code</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
