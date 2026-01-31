import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import axios from '../config/axios';

// Reusable UI Components
import { Button, Modal, SuccessIcon } from './ui';
import OTPInput from './ui/OTPInput';

// Styles
import styles from './OTPModal.module.css';

const OTPModal = ({ show, toggleModal, email }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRef = useRef(null);

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      otp: '',
      email: '',
    },
    validationSchema: Yup.object({
      otp: Yup.string().required('Please Enter OTP'),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const response = await axios.post('/auth/verify-otp', {
          email: email,
          otpCode: parseInt(values.otp),
        });

        setLoading(false);
        if (response.data.status && response.data.status === 'SUCCESS') {
          sessionStorage.setItem('otpVerifyToken', response.data.resetToken);
          navigate('/reset-password');
        }
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

  // Auto-focus input when modal opens
  useEffect(() => {
    if (show && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [show]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;

    setResendCooldown(60);
    try {
      await axios.post('/auth/request-reset-password', { email });
      toast('New recovery code sent!', {
        position: 'top-right',
        hideProgressBar: true,
        closeOnClick: false,
        className: 'bg-success text-white',
      });
    } catch (error) {
      setResendCooldown(0);
      toast('Failed to resend code. Please try again.', {
        position: 'top-right',
        hideProgressBar: true,
        closeOnClick: false,
        className: 'bg-danger text-white',
      });
    }
  };

  return (
    <Modal
      isOpen={show}
      onClose={toggleModal}
      title="Enter Verification Code"
      size="sm"
      footer={
        <Button variant="primary" fullWidth onClick={validation.handleSubmit} loading={loading}>
          Verify OTP
        </Button>
      }
    >
      <div className={styles.iconContainer}>
        <SuccessIcon size="md" />
      </div>

      {email && (
        <p className={styles.emailDisplay}>
          Enter the code sent to <strong>{email}</strong>
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          validation.handleSubmit();
          return false;
        }}
      >
        <OTPInput
          ref={inputRef}
          length={6}
          value={validation.values.otp || ''}
          onChange={(value) => validation.setFieldValue('otp', value)}
          error={validation.touched.otp && validation.errors.otp}
        />
      </form>

      <div className={styles.resendContainer}>
        {resendCooldown > 0 ? (
          <span className={styles.resendTimer}>Resend in {resendCooldown}s</span>
        ) : (
          <button
            type="button"
            className={styles.resendLink}
            onClick={handleResendCode}
            disabled={resendCooldown > 0}
          >
            Didn't receive code? Resend
          </button>
        )}
      </div>
    </Modal>
  );
};

export default OTPModal;
