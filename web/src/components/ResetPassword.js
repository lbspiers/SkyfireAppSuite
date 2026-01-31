import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import axios from '../config/axios';

// Reusable UI Components
import { FormInput, Button, Modal, SuccessIcon, PasswordStrength } from './ui';

// Styles
import styles from './ResetPassword.module.css';

// Assets
import appLogo from '../assets/images/applogo.png';

const ResetPassword = () => {
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      password: '',
      confirmPassword: '',
    },
    validationSchema: Yup.object({
      password: Yup.string()
        .required('Please Enter Your Password')
        .min(8, 'Password must be at least 8 characters long'),
      confirmPassword: Yup.string()
        .required('Please Confirm Your Password')
        .oneOf([Yup.ref('password')], 'Passwords must match'),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        await axios.post('/auth/reset-password', {
          token: sessionStorage.getItem('otpVerifyToken'),
          newPassword: values.password,
        });
        setLoading(false);
        setShowSuccessModal(true);
      } catch (error) {
        setLoading(false);
        let errorMessage = 'Request Failed';
        if (error.response && error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
        toast(`Error ! ${errorMessage}`, {
          position: 'top-right',
          hideProgressBar: true,
          closeOnClick: false,
          className: 'bg-danger text-white',
        });
      }
    },
  });

  return (
    <>
      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Congratulations!"
        size="sm"
        footer={
          <Button
            variant="primary"
            fullWidth
            onClick={() => navigate('/login')}
          >
            Sign in
          </Button>
        }
      >
        <div className={styles.successModalContent}>
          <SuccessIcon size="md" />
        </div>
        <p className={styles.successMessage}>
          You have successfully reset your password. Please try login with new credentials.
        </p>
      </Modal>

      <div className={styles.gradientContainer}>
        <div className={`${styles.pageWrapper} ${loading ? styles.loading : ''}`}>
          {/* Logo */}
          <div className={styles.logoContainer}>
            <img src={appLogo} alt="Skyfire Logo" className={styles.logo} />
          </div>

          {/* Form Container */}
          <div className={styles.formContainer}>
            <h2 className={styles.title}>Reset Password</h2>
            <p className={styles.subtitle}>Enter your new password</p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                validation.handleSubmit();
                return false;
              }}
              className={styles.form}
            >
              <div className={styles.inputGroup}>
                <FormInput
                  type="password"
                  label="New Password"
                  name="password"
                  placeholder="Enter new password"
                  value={validation.values.password || ''}
                  onChange={validation.handleChange}
                  onBlur={validation.handleBlur}
                  error={validation.touched.password && validation.errors.password}
                  showPasswordToggle
                  size="md"
                  fullWidth
                />
                <PasswordStrength password={validation.values.password} />
              </div>

              <FormInput
                type="password"
                label="Confirm Password"
                name="confirmPassword"
                placeholder="Confirm new password"
                value={validation.values.confirmPassword || ''}
                onChange={validation.handleChange}
                onBlur={validation.handleBlur}
                error={validation.touched.confirmPassword && validation.errors.confirmPassword}
                showPasswordToggle
                size="md"
                fullWidth
              />

              <div className={styles.buttonRow}>
                <Button variant="primary" type="submit" loading={loading} fullWidth>
                  Reset Password
                </Button>
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => navigate('/login')}
                  fullWidth
                >
                  Back to Login
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResetPassword;
