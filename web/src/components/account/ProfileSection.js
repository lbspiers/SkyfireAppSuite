import React, { useState, useEffect } from 'react';
import FormSection from '../ui/FormSection';
import FormInput from '../ui/FormInput';
import Button from '../ui/Button';
import CompanyLogoUpload from './CompanyLogoUpload';
import { getUserProfile, updateUserProfile, uploadCompanyLogo, removeCompanyLogo } from '../../services/accountAPI';
import logger from '../../services/devLogger';
import styles from './ProfileSection.module.css';

/**
 * ProfileSection - User profile editing form
 * Includes company logo, name, email, phone, display name, account details
 */
const ProfileSection = ({ onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    displayName: '',
    companyLogo: null,
    createdAt: null,
    updatedAt: null,
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await getUserProfile();
      const profile = response.data || response; // Handle both wrapped and unwrapped responses

      setFormData({
        firstName: profile.first_name || profile.firstName || '',
        lastName: profile.last_name || profile.lastName || '',
        email: profile.email || '',
        phone: profile.phone || '',
        displayName: profile.display_name || profile.displayName || '',
        companyLogo: profile.company_logo || profile.companyLogo || null,
        createdAt: profile.created_at || profile.createdAt || null,
        updatedAt: profile.updated_at || profile.updatedAt || null,
      });
    } catch (error) {
      logger.error('ProfileSection', 'Failed to load profile:', error);
      if (onError) onError(error.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  const handleLogoUpload = async (formDataFile) => {
    try {
      const result = await uploadCompanyLogo(formDataFile);
      setFormData(prev => ({ ...prev, companyLogo: result.logo_url }));
      if (onSuccess) onSuccess('Logo uploaded successfully');
    } catch (error) {
      logger.error('ProfileSection', 'Failed to upload logo:', error);
      if (onError) onError('Failed to upload logo');
    }
  };

  const handleLogoRemove = async () => {
    try {
      await removeCompanyLogo();
      setFormData(prev => ({ ...prev, companyLogo: null }));
      if (onSuccess) onSuccess('Logo removed successfully');
    } catch (error) {
      logger.error('ProfileSection', 'Failed to remove logo:', error);
      if (onError) onError('Failed to remove logo');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      const response = await updateUserProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        displayName: formData.displayName,
      });

      // Update sessionStorage userData after successful save
      const storedUserData = sessionStorage.getItem('userData');
      if (storedUserData) {
        try {
          const userData = JSON.parse(storedUserData);
          const updatedUserData = {
            ...userData,
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            displayName: formData.displayName,
          };
          sessionStorage.setItem('userData', JSON.stringify(updatedUserData));
        } catch (err) {
          logger.error('ProfileSection', 'Failed to update sessionStorage:', err);
        }
      }

      if (onSuccess) onSuccess('Profile updated successfully');
    } catch (error) {
      logger.error('ProfileSection', 'Failed to update profile:', error);
      if (onError) onError(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <FormSection title="Profile Information">
        <div className={styles.loading}>Loading profile...</div>
      </FormSection>
    );
  }

  return (
    <FormSection title="Profile Information">
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.logoAndDetailsRow}>
          <div className={styles.logoSection}>
            <CompanyLogoUpload
              logoUrl={formData.companyLogo}
              onUpload={handleLogoUpload}
              onRemove={handleLogoRemove}
            />
          </div>

          <div className={styles.accountDetailsSection}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Member Since</span>
              <span className={styles.detailValue}>{formatDate(formData.createdAt)}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Last Updated</span>
              <span className={styles.detailValue}>{formatDate(formData.updatedAt)}</span>
            </div>
          </div>
        </div>

        <div className={styles.row}>
          <FormInput
            label="First Name"
            value={formData.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            required
            autoCapitalize
          />
          <FormInput
            label="Last Name"
            value={formData.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            required
            autoCapitalize
          />
        </div>

        <div className={styles.row}>
          <FormInput
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            required
          />
          <FormInput
            label="Phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
          />
        </div>

        <FormInput
          label="Display Name"
          value={formData.displayName}
          onChange={(e) => handleChange('displayName', e.target.value)}
          helper="Optional: Shown instead of your real name in the app"
        />

        <div className={styles.actions}>
          <Button
            type="submit"
            variant="primary"
            loading={saving}
            disabled={saving}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </FormSection>
  );
};

export default ProfileSection;
