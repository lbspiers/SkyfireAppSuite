import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import axios from '../config/axios';

// Reusable UI Components
import { FormInput, Button } from './ui';
import OTPModal from './OTPModal';

// Styles
import styles from './RecoverCredentials.module.css';

// Assets
import appLogo from '../assets/images/applogo.png';

const RecoverCredentials = () => {
  const [loading, setLoading] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  // Email recovery form
  const emailValidation = useFormik({
    initialValues: {
      email: '',
    },
    validationSchema: Yup.object({
      email: Yup.string().email('Invalid email').required('Please enter your email'),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        await axios.post('/auth/request-reset-password', { email: values.email });
        setEmail(values.email);
        setShowModal(true);
        toast('Recovery code sent to your email!', {
          position: 'top-right',
          hideProgressBar: true,
          closeOnClick: false,
          className: 'bg-success text-white',
        });
        setLoading(false);
      } catch (error) {
        setLoading(false);
        toast('Error sending recovery code. Please try again.', {
          position: 'top-right',
          hideProgressBar: true,
          closeOnClick: false,
          className: 'bg-danger text-white',
        });
      }
    },
  });

  // Phone lookup form
  const phoneValidation = useFormik({
    initialValues: {
      phoneNo: '',
    },
    validationSchema: Yup.object({
      phoneNo: Yup.string().required('Please Enter Your Phone No'),
    }),
    onSubmit: async (values) => {
      setPhoneLoading(true);
      try {
        const response = await axios.post('/auth/lookup-email', {
          phoneNo: values.phoneNo,
        });
        toast(`Your email is: ${response.data.email}`, {
          position: 'top-right',
          hideProgressBar: true,
          closeOnClick: false,
          className: 'bg-success text-white',
        });
        setPhoneLoading(false);
      } catch (error) {
        setPhoneLoading(false);
        toast('No account found with this phone number', {
          position: 'top-right',
          hideProgressBar: true,
          closeOnClick: false,
          className: 'bg-danger text-white',
        });
      }
    },
  });

  const toggleModal = () => {
    setShowModal(!showModal);
  };

  return (
    <>
      {/* OTP Verification Modal */}
      <OTPModal show={showModal} toggleModal={toggleModal} email={email} />

      <div className={styles.gradientContainer}>
        <div className={`${styles.pageWrapper} ${loading ? styles.loading : ''}`}>
          {/* Logo */}
          <div className={styles.logoContainer}>
            <img src={appLogo} alt="Skyfire Logo" className={styles.logo} />
          </div>

          {/* Form Container */}
          <div className={styles.formContainer}>
            {/* Forgot Email Section */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Forgot Email?</h2>
              <p className={styles.hintText}>Enter your phone number to look up your email</p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  phoneValidation.handleSubmit();
                  return false;
                }}
              >
                <div className={styles.formRow}>
                  <FormInput
                    type="text"
                    id="phoneNo"
                    name="phoneNo"
                    label="Phone Number"
                    placeholder="(###) ###-####"
                    onChange={phoneValidation.handleChange}
                    onBlur={phoneValidation.handleBlur}
                    value={phoneValidation.values.phoneNo || ''}
                    error={phoneValidation.touched.phoneNo && phoneValidation.errors.phoneNo}
                    size="md"
                    fullWidth
                  />

                  <div className={styles.submitButton}>
                    <Button variant="primary" fullWidth type="submit" loading={phoneLoading}>
                      Look Up
                    </Button>
                  </div>
                </div>
              </form>
            </div>

            {/* Visual Divider */}
            <div className={styles.sectionDivider} />

            {/* Forgot Password Section */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Forgot Password?</h2>
              <p className={styles.hintText}>Enter your email to receive a recovery code</p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  emailValidation.handleSubmit();
                  return false;
                }}
              >
                <div className={styles.formRow}>
                  <FormInput
                    type="email"
                    id="email"
                    name="email"
                    label="Email"
                    placeholder="you@example.com"
                    onChange={emailValidation.handleChange}
                    onBlur={emailValidation.handleBlur}
                    value={emailValidation.values.email || ''}
                    error={emailValidation.touched.email && emailValidation.errors.email}
                    size="md"
                    fullWidth
                  />

                  <div className={styles.submitButton}>
                    <Button
                      variant="primary"
                      fullWidth
                      type="submit"
                      loading={loading}
                    >
                      Send Code
                    </Button>
                  </div>
                </div>
              </form>
            </div>

            {/* Back to Login Link */}
            <a
              href="/login"
              className={styles.helpLink}
              onClick={(e) => {
                e.preventDefault();
                navigate('/login');
              }}
            >
              Back to Login
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default RecoverCredentials;
