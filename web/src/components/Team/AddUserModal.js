/**
 * Add User Modal
 * Multi-step wizard: Details → Role → Confirm
 */

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import FormInput from '../ui/FormInput';
import FormSelect from '../ui/FormSelect';
import { addCompanyUser, validateEmail, validatePhone } from '../../services/teamService';
import { getCompanies } from '../../services/superAdminService';
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

const AddUserModal = ({
  isOpen = false,
  onClose,
  onUserAdded,
  preselectedRole = null,
  isSuperAdmin = false,
  currentCompanyId = null
}) => {
  const [step, setStep] = useState(1); // 1: Details, 2: Role, 3: Confirm
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    roleId: preselectedRole || 2, // Use preselected role or default to Designer
    companyId: currentCompanyId || null, // For super admins to select company
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  // Reset form to initial state
  const resetForm = () => {
    setStep(1);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      roleId: preselectedRole || 2,
      companyId: currentCompanyId || null,
    });
    setErrors({});
    setLoading(false);
  };

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  // Load companies for super admins
  useEffect(() => {
    if (isSuperAdmin && isOpen) {
      loadCompanies();
    }
  }, [isSuperAdmin, isOpen]);

  const loadCompanies = async () => {
    setLoadingCompanies(true);
    try {
      const result = await getCompanies();
      if (result.status === 'SUCCESS' && result.data) {
        // Deduplicate companies by ID to avoid React key warnings
        const uniqueCompanies = result.data.reduce((acc, company) => {
          if (!acc.find(c => c.id === company.id)) {
            acc.push(company);
          }
          return acc;
        }, []);

        setCompanies(uniqueCompanies);
        // If no company selected and user has current company, default to it
        if (!formData.companyId && currentCompanyId) {
          setFormData(prev => ({ ...prev, companyId: currentCompanyId }));
        }
      }
    } catch (error) {
      console.error('[AddUserModal] Error loading companies:', error);
      toast.error('Failed to load companies');
    } finally {
      setLoadingCompanies(false);
    }
  };

  // Get selected role info
  const selectedRole = ROLES.find(r => r.id === formData.roleId) || ROLES[1];

  // Get selected company info
  const selectedCompany = companies.find(c => c.id === formData.companyId);

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

    // Validate company selection for super admins
    if (isSuperAdmin && !formData.companyId) {
      newErrors.companyId = 'Please select a company';
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
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        roleId: formData.roleId,
      };

      // Include companyId for super admin invites
      if (isSuperAdmin && formData.companyId) {
        payload.companyId = formData.companyId;
      }

      const result = await addCompanyUser(payload);

      if (result.status === 'SUCCESS') {
        toast.success(
          `Invite sent to ${formData.firstName}! They'll receive an email with instructions.`,
          { autoClose: 4000 }
        );
        resetForm(); // Reset form before closing
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

  const footer = (
    <>
      {step === 1 && (
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleNext}>
            Continue
          </Button>
        </>
      )}
      {step === 2 && (
        <>
          <Button variant="ghost" onClick={handleBack}>
            Back
          </Button>
          <Button variant="primary" onClick={handleNext}>
            Continue
          </Button>
        </>
      )}
      {step === 3 && (
        <>
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
        </>
      )}
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      footer={footer}
      closeOnOverlay={!loading}
      closeOnEscape={!loading}
      showCloseButton={!loading}
    >
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
            {/* Company Selection - Super Admins Only */}
            {isSuperAdmin && (
              <FormSelect
                label="Company"
                value={formData.companyId || ''}
                onChange={(e) => handleInputChange('companyId', e.target.value)}
                options={companies.map(company => ({
                  value: company.id,
                  label: company.name || company.company_name
                }))}
                placeholder={loadingCompanies ? 'Loading companies...' : 'Select company...'}
                error={errors.companyId}
                required
                disabled={loadingCompanies}
              />
            )}

            <FormInput
              label="First Name"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              placeholder="Enter first name"
              error={errors.firstName}
              required
              autoFocus
            />

            <FormInput
              label="Last Name"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              placeholder="Enter last name"
              error={errors.lastName}
              required
            />

            <FormInput
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="name@company.com"
              error={errors.email}
              required
            />

            <FormInput
              label="Phone Number (optional)"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="(555) 123-4567"
              error={errors.phone}
            />
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

            {/* Show company for super admins */}
            {isSuperAdmin && selectedCompany && (
              <div className={styles.summaryRole}>
                <span className={styles.summaryLabel}>Company</span>
                <div className={styles.summaryRoleValue}>
                  <i className="ri-building-line" />
                  <span>{selectedCompany.name || selectedCompany.company_name}</span>
                </div>
              </div>
            )}
          </div>

          <div className={styles.notice}>
            <i className="ri-mail-send-line" />
            <p>
              {formData.firstName} will receive an email with a link to set up their account
              {isSuperAdmin && selectedCompany
                ? ` and join ${selectedCompany.name || selectedCompany.company_name}.`
                : ' and join your team.'}
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default AddUserModal;
