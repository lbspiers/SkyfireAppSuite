/**
 * Add User Modal
 * Multi-step wizard: Details → Role → Confirm
 */

import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { addCompanyUser, validateEmail, validatePhone } from '../../services/teamService';
import Button from '../ui/Button';
import styles from './AddUserModal.module.css';

// Available roles - matches backend role table
const ROLES = [
  {
    id: 1,
    name: 'Admin',
    icon: 'ri-shield-star-line',
    description: 'Full access to all features, team management, and settings'
  },
  {
    id: 2,
    name: 'Designer',
    icon: 'ri-layout-line',
    description: 'Create and edit project designs, manage equipment'
  },
  {
    id: 3,
    name: 'Surveyor',
    icon: 'ri-map-pin-line',
    description: 'Conduct site surveys, upload photos and measurements'
  },
  {
    id: 4,
    name: 'Drafter',
    icon: 'ri-draft-line',
    description: 'Create and edit plan sets, CAD drawings'
  },
  {
    id: 5,
    name: 'Installer',
    icon: 'ri-tools-line',
    description: 'View installation details and project specifications'
  },
  {
    id: 6,
    name: 'Sales',
    icon: 'ri-money-dollar-circle-line',
    description: 'Manage sales pipeline and customer information'
  },
  {
    id: 7,
    name: 'Viewer',
    icon: 'ri-eye-line',
    description: 'View-only access to assigned projects'
  },
];

const AddUserModal = ({ onClose, onUserAdded, preselectedRole = null }) => {
  const [step, setStep] = useState(1); // 1: Details, 2: Role, 3: Confirm
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    roleId: preselectedRole || 2, // Use preselected role or default to Designer
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Get selected role info
  const selectedRole = ROLES.find(r => r.id === formData.roleId) || ROLES[1];

  // Validation
  const validateStep1 = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.phone.trim() && !validatePhone(formData.phone.trim())) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step navigation
  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  // Submit
  const handleSubmit = async () => {
    setLoading(true);

    try {
      const result = await addCompanyUser({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        roleId: formData.roleId,
      });

      if (result.status === 'SUCCESS') {
        toast.success(
          `Invite sent to ${formData.firstName}! They'll receive an email with instructions.`,
          { autoClose: 4000 }
        );
        onUserAdded();
      } else {
        toast.error(result.message || 'Failed to send invite');
      }
    } catch (error) {
      console.error('[AddUserModal] Error:', error);

      let errorMessage = 'Unable to send invite. Please try again.';
      if (error?.message?.toLowerCase().includes('already exists')) {
        errorMessage = 'A user with this email already exists.';
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Input handler
  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  // Overlay click handler
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        {/* Progress Steps */}
        <div className={styles.progressBar}>
          <div className={`${styles.progressStep} ${step >= 1 ? styles.active : ''}`}>
            <span className={styles.stepNumber}>1</span>
            <span className={styles.stepLabel}>Details</span>
          </div>
          <div className={styles.progressLine} />
          <div className={`${styles.progressStep} ${step >= 2 ? styles.active : ''}`}>
            <span className={styles.stepNumber}>2</span>
            <span className={styles.stepLabel}>Role</span>
          </div>
          <div className={styles.progressLine} />
          <div className={`${styles.progressStep} ${step >= 3 ? styles.active : ''}`}>
            <span className={styles.stepNumber}>3</span>
            <span className={styles.stepLabel}>Send</span>
          </div>
        </div>

        {/* Step 1: Details */}
        {step === 1 && (
          <div className={styles.stepContent}>
            <div className={styles.stepHeader}>
              <h2>Add Team Member</h2>
              <p>Enter their contact information</p>
            </div>

            <div className={styles.form}>
              {/* First Name */}
              <div className={styles.formGroup}>
                <label>First Name *</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Enter first name"
                  className={errors.firstName ? styles.inputError : ''}
                  autoFocus
                />
                {errors.firstName && (
                  <span className={styles.errorText}>{errors.firstName}</span>
                )}
              </div>

              {/* Last Name */}
              <div className={styles.formGroup}>
                <label>Last Name *</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Enter last name"
                  className={errors.lastName ? styles.inputError : ''}
                />
                {errors.lastName && (
                  <span className={styles.errorText}>{errors.lastName}</span>
                )}
              </div>

              {/* Email */}
              <div className={styles.formGroup}>
                <label>Email Address *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="name@company.com"
                  className={errors.email ? styles.inputError : ''}
                />
                {errors.email && (
                  <span className={styles.errorText}>{errors.email}</span>
                )}
              </div>

              {/* Phone */}
              <div className={styles.formGroup}>
                <label>Phone Number <span className={styles.optional}>(optional)</span></label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                  className={errors.phone ? styles.inputError : ''}
                />
                {errors.phone && (
                  <span className={styles.errorText}>{errors.phone}</span>
                )}
              </div>
            </div>

            <div className={styles.buttonRow}>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleNext}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Role Selection */}
        {step === 2 && (
          <div className={styles.stepContent}>
            <div className={styles.stepHeader}>
              <h2>Select Role</h2>
              <p>What will {formData.firstName} do?</p>
            </div>

            <div className={styles.roleGrid}>
              {ROLES.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  className={`${styles.roleCard} ${formData.roleId === role.id ? styles.roleSelected : ''}`}
                  onClick={() => setFormData({ ...formData, roleId: role.id })}
                >
                  <i className={`${role.icon} ${styles.roleIcon}`} />
                  <span className={styles.roleName}>{role.name}</span>
                  <span className={styles.roleDescription}>{role.description}</span>
                </button>
              ))}
            </div>

            <div className={styles.buttonRow}>
              <Button variant="ghost" onClick={handleBack}>
                Back
              </Button>
              <Button variant="primary" onClick={handleNext}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div className={styles.stepContent}>
            <div className={styles.stepHeader}>
              <h2>Send Invite</h2>
              <p>Review and confirm</p>
            </div>

            <div className={styles.summary}>
              <div className={styles.summaryCard}>
                <div className={styles.summaryAvatar}>
                  {formData.firstName[0]}{formData.lastName[0]}
                </div>
                <div className={styles.summaryInfo}>
                  <span className={styles.summaryName}>
                    {formData.firstName} {formData.lastName}
                  </span>
                  <span className={styles.summaryEmail}>{formData.email}</span>
                </div>
              </div>

              <div className={styles.summaryRole}>
                <span className={styles.summaryLabel}>Role</span>
                <div className={styles.summaryRoleValue}>
                  <i className={selectedRole.icon} />
                  <span>{selectedRole.name}</span>
                </div>
              </div>
            </div>

            <div className={styles.notice}>
              <i className="ri-mail-send-line" />
              <p>
                {formData.firstName} will receive an email with a link to set up their account
                and join your team.
              </p>
            </div>

            <div className={styles.buttonRow}>
              <Button variant="ghost" onClick={handleBack} disabled={loading}>
                Back
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                loading={loading}
              >
                <i className="ri-send-plane-fill" /> Send Invite
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddUserModal;
