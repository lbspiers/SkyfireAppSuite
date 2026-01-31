import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, FormInput, Toggle, Modal, useToast, StatusBadge } from '../../components/ui';
import { useDrafterProfile } from '../../hooks/useDrafterProfile';
import styles from './DrafterProfilePage.module.css';

const DrafterProfilePage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const fileInputRef = useRef(null);

  const {
    profile,
    loading,
    saving,
    usingMockData,
    updateProfile,
    uploadPhoto,
    removePhoto,
    updateNotifications
  } = useDrafterProfile();

  const [formData, setFormData] = useState({});
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [isDangerZoneOpen, setIsDangerZoneOpen] = useState(false);

  // Update form data when profile loads
  useState(() => {
    if (profile && Object.keys(formData).length === 0) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phone: profile.phone || ''
      });
    }
  }, [profile]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile(formData);
      addToast('Profile updated successfully', 'success');
    } catch (err) {
      addToast('Failed to update profile', 'error');
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('Please select an image file', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addToast('Image must be less than 5MB', 'error');
      return;
    }

    try {
      await uploadPhoto(file);
      addToast('Photo uploaded successfully', 'success');
    } catch (err) {
      addToast('Failed to upload photo', 'error');
    }
  };

  const handleRemovePhoto = async () => {
    try {
      await removePhoto();
      addToast('Photo removed', 'success');
    } catch (err) {
      addToast('Failed to remove photo', 'error');
    }
  };

  const handleNotificationToggle = async (key, value) => {
    try {
      await updateNotifications({ [key]: value });
      addToast('Notification preferences updated', 'success');
    } catch (err) {
      addToast('Failed to update preferences', 'error');
    }
  };

  const getInitials = () => {
    if (!profile) return '?';
    return `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}`.toUpperCase();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  const getTaxStatusVariant = (status) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'submitted':
        return 'info';
      default:
        return 'warning';
    }
  };

  if (loading || !profile) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading profile...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>
          <span className={styles.titleIcon}>👤</span>
          Profile Settings
        </h1>
      </div>

      {usingMockData && (
        <div className={styles.mockBanner}>
          📊 Showing mock data (API not connected)
        </div>
      )}

      {/* Profile Photo Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Profile Photo</h2>
        <div className={styles.photoSection}>
          <div className={styles.avatarContainer}>
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="Profile" className={styles.avatar} />
            ) : (
              <div className={styles.avatarPlaceholder}>{getInitials()}</div>
            )}
          </div>
          <div className={styles.photoActions}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className={styles.fileInput}
            />
            <Button
              variant="primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={saving}
            >
              {profile.avatarUrl ? 'Change Photo' : 'Upload Photo'}
            </Button>
            {profile.avatarUrl && (
              <Button variant="secondary" onClick={handleRemovePhoto} disabled={saving}>
                Remove Photo
              </Button>
            )}
            <div className={styles.photoHint}>JPG, PNG or GIF (max 5MB)</div>
          </div>
        </div>
      </section>

      {/* Personal Information */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Personal Information</h2>
        <div className={styles.formGrid}>
          <FormInput
            label="First Name"
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            disabled={saving}
          />
          <FormInput
            label="Last Name"
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            disabled={saving}
          />
          <FormInput
            label="Email Address"
            value={profile.email}
            disabled
            prefix={<span className={styles.lockIcon}>🔒</span>}
            hint="Email cannot be changed"
          />
          <FormInput
            label="Phone Number"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            disabled={saving}
          />
        </div>
        <div className={styles.saveActions}>
          <Button variant="primary" onClick={handleSaveProfile} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </section>

      {/* Notification Preferences */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Notification Preferences</h2>
        <div className={styles.notificationsList}>
          <div className={styles.notificationItem}>
            <div className={styles.notificationInfo}>
              <div className={styles.notificationLabel}>Email Notifications</div>
              <div className={styles.notificationHint}>Job alerts and announcements</div>
            </div>
            <Toggle
              checked={profile.notifications.email}
              onChange={(checked) => handleNotificationToggle('email', checked)}
            />
          </div>
          <div className={styles.notificationItem}>
            <div className={styles.notificationInfo}>
              <div className={styles.notificationLabel}>Push Notifications</div>
              <div className={styles.notificationHint}>Browser notifications</div>
            </div>
            <Toggle
              checked={profile.notifications.push}
              onChange={(checked) => handleNotificationToggle('push', checked)}
            />
          </div>
          <div className={styles.notificationItem}>
            <div className={styles.notificationInfo}>
              <div className={styles.notificationLabel}>SMS Notifications</div>
              <div className={styles.notificationHint}>Urgent alerts only</div>
            </div>
            <Toggle
              checked={profile.notifications.sms}
              onChange={(checked) => handleNotificationToggle('sms', checked)}
            />
          </div>
        </div>
      </section>

      {/* Payment Information */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Payment Information</h2>
        <div className={styles.paymentInfo}>
          <div className={styles.paymentMethod}>
            <span className={styles.paymentIcon}>
              {profile.paymentMethod.type === 'bank' ? '🏦' : '💳'}
            </span>
            <div className={styles.paymentDetails}>
              <div className={styles.paymentLabel}>
                {profile.paymentMethod.bankName} •••• {profile.paymentMethod.last4}
              </div>
              <div className={styles.paymentHint}>
                Contact support to update payment method
              </div>
            </div>
          </div>
          <Button variant="secondary" onClick={() => navigate('/drafter-portal/help')}>
            Contact Support
          </Button>
        </div>
      </section>

      {/* Tax Information */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Tax Information</h2>
        <div className={styles.taxInfo}>
          <div className={styles.taxStatus}>
            <span className={styles.taxLabel}>W-9 Status:</span>
            <StatusBadge
              status={profile.taxFormStatus}
              variant={getTaxStatusVariant(profile.taxFormStatus)}
            />
          </div>
          {profile.taxFormStatus === 'pending' ? (
            <Button variant="primary">Submit W-9</Button>
          ) : (
            <Button variant="secondary">View Submitted W-9</Button>
          )}
        </div>
      </section>

      {/* Account Statistics */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Account Statistics</h2>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Member Since</div>
            <div className={styles.statValue}>{formatDate(profile.memberSince)}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Total Jobs</div>
            <div className={styles.statValue}>{profile.stats.totalJobs}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Total Earnings</div>
            <div className={styles.statValue}>
              ${profile.stats.totalEarnings.toLocaleString()}
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Average Rating</div>
            <div className={styles.statValue}>
              {'⭐'.repeat(Math.round(profile.stats.avgRating))} {profile.stats.avgRating}
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>On-Time Rate</div>
            <div className={styles.statValue}>{profile.stats.onTimeRate}%</div>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className={`${styles.section} ${styles.dangerSection}`}>
        <button
          className={styles.dangerHeader}
          onClick={() => setIsDangerZoneOpen(!isDangerZoneOpen)}
        >
          <h2 className={styles.sectionTitle}>Danger Zone</h2>
          <span className={styles.chevron}>{isDangerZoneOpen ? '▼' : '▶'}</span>
        </button>
        {isDangerZoneOpen && (
          <div className={styles.dangerContent}>
            <div className={styles.dangerWarning}>
              <strong>⚠️ Warning:</strong> Deactivating your account will prevent you from accessing
              the drafter portal and claiming new projects.
            </div>
            <Button variant="secondary" onClick={() => setShowDeactivateModal(true)}>
              Deactivate Account
            </Button>
          </div>
        )}
      </section>

      {/* Deactivate Confirmation Modal */}
      {showDeactivateModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowDeactivateModal(false)}
          title="Deactivate Account"
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowDeactivateModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  addToast('Account deactivation requested', 'info');
                  setShowDeactivateModal(false);
                }}
              >
                Confirm Deactivation
              </Button>
            </>
          }
        >
          <div className={styles.modalContent}>
            <p>
              Are you sure you want to deactivate your account? This action will prevent you from:
            </p>
            <ul className={styles.deactivateList}>
              <li>Claiming new projects</li>
              <li>Accessing the drafter portal</li>
              <li>Receiving job notifications</li>
            </ul>
            <p>
              <strong>Note:</strong> You will still be able to complete any active projects and
              receive pending payouts.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DrafterProfilePage;
