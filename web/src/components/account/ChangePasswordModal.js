import React, { useState } from 'react';
import Modal from '../ui/Modal';
import FormInput from '../ui/FormInput';
import Button from '../ui/Button';
import { changePassword } from '../../services/accountAPI';
import styles from './ChangePasswordModal.module.css';

const ChangePasswordModal = ({ isOpen, onClose, onSuccess, onError }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      if (onError) onError('Passwords do not match');
      return;
    }

    if (formData.newPassword.length < 8) {
      if (onError) onError('Password must be at least 8 characters');
      return;
    }

    try {
      setLoading(true);
      await changePassword(formData.currentPassword, formData.newPassword);
      if (onSuccess) onSuccess('Password changed successfully');
      onClose();
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Failed to change password:', error);
      if (onError) onError('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleSubmit} loading={loading} disabled={loading}>
        Change Password
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change Password" footer={footer}>
      <div className={styles.form}>
        <FormInput
          label="Current Password"
          type="password"
          value={formData.currentPassword}
          onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
          required
        />
        <FormInput
          label="New Password"
          type="password"
          value={formData.newPassword}
          onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
          required
          helper="Minimum 8 characters"
        />
        <FormInput
          label="Confirm New Password"
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
          required
        />
      </div>
    </Modal>
  );
};

export default ChangePasswordModal;
