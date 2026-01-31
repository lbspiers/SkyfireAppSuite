/**
 * Invite Customer Modal
 * For super admins to invite new companies/customers
 */

import React, { useState } from 'react';
import { toast } from 'react-toastify';
import Modal from '../ui/Modal';
import FormInput from '../ui/FormInput';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import { inviteCustomer } from '../../services/customerInvitationService';
import styles from './InviteCustomerModal.module.css';

const InviteCustomerModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    contactFirstName: '',
    contactLastName: '',
    contactEmail: '',
    contactPhone: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    if (!formData.contactFirstName.trim()) {
      newErrors.contactFirstName = 'First name is required';
    }

    if (!formData.contactLastName.trim()) {
      newErrors.contactLastName = 'Last name is required';
    }

    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail.trim())) {
      newErrors.contactEmail = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const result = await inviteCustomer(formData);

      if (result.status === 'SUCCESS') {
        toast.success(
          `Invitation sent! ${formData.companyName} will receive an email with instructions.`,
          { autoClose: 5000 }
        );

        // Reset form
        setFormData({
          companyName: '',
          contactFirstName: '',
          contactLastName: '',
          contactEmail: '',
          contactPhone: '',
        });

        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error(result.message || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('[InviteCustomerModal] Error:', error);
      toast.error(error.message || 'Failed to send invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        companyName: '',
        contactFirstName: '',
        contactLastName: '',
        contactEmail: '',
        contactPhone: '',
      });
      setErrors({});
      onClose();
    }
  };

  const footer = (
    <>
      <Button
        variant="ghost"
        onClick={handleClose}
        disabled={loading}
      >
        Cancel
      </Button>
      <Button
        variant="primary"
        onClick={handleSubmit}
        loading={loading}
        disabled={loading}
      >
        Send Invitation
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Invite New Customer"
      size="md"
      footer={footer}
    >
      <div className={styles.form}>
        <Alert variant="info" collapsible={false}>
          <strong>Customer Invitation:</strong> The customer will receive an email with a unique link to create their company account. They'll bypass the approval queue.
        </Alert>

        <FormInput
          label="Company Name"
          value={formData.companyName}
          onChange={(e) => handleInputChange('companyName', e.target.value)}
          error={errors.companyName}
          required
          disabled={loading}
          placeholder="e.g., Green Energy Solutions"
        />

        <div className={styles.row}>
          <FormInput
            label="Contact First Name"
            value={formData.contactFirstName}
            onChange={(e) => handleInputChange('contactFirstName', e.target.value)}
            error={errors.contactFirstName}
            required
            disabled={loading}
          />

          <FormInput
            label="Contact Last Name"
            value={formData.contactLastName}
            onChange={(e) => handleInputChange('contactLastName', e.target.value)}
            error={errors.contactLastName}
            required
            disabled={loading}
          />
        </div>

        <FormInput
          label="Contact Email"
          type="email"
          value={formData.contactEmail}
          onChange={(e) => handleInputChange('contactEmail', e.target.value)}
          error={errors.contactEmail}
          required
          disabled={loading}
          placeholder="contact@company.com"
        />

        <FormInput
          label="Contact Phone"
          type="tel"
          value={formData.contactPhone}
          onChange={(e) => handleInputChange('contactPhone', e.target.value)}
          error={errors.contactPhone}
          disabled={loading}
          placeholder="(555) 123-4567"
          hint="Optional"
        />
      </div>
    </Modal>
  );
};

export default InviteCustomerModal;
