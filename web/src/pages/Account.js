import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import ProfileSection from '../components/account/ProfileSection';
import FormSection from '../components/ui/FormSection';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import ChangePasswordModal from '../components/account/ChangePasswordModal';
import TeamManagement from './Team/TeamManagement';
import CustomerInvitation from '../components/Admin/CustomerInvitation';
import { toast } from 'react-toastify';
import accountStyles from '../components/account/Account.module.css';
import { useServiceWorker } from '../hooks/useServiceWorker';
import { getVersionInfo, DEPLOYMENT_NUMBER, DEPLOYMENT_VERSION, BUILD_DATE, BUILD_TIME } from '../config/version';
import { isCurrentUserAdminAsync } from '../utils/adminUtils';

/**
 * Account Management Page
 * Settings tab with Profile, Security, Team, Account Details, Danger Zone
 * Billing tab with placeholder for future payment integration
 */
const Account = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('settings');
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const { updateAvailable, applyUpdate } = useServiceWorker();
  const [checkingForUpdates, setCheckingForUpdates] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Get app version info
  const versionInfo = getVersionInfo();

  // Check if we should open Inventory tab (from navigation state)
  useEffect(() => {
    if (location.state?.openInventory) {
      setActiveTab('inventory');
    }
  }, [location.state]);

  // Check if user is super admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      const isAdmin = await isCurrentUserAdminAsync();

      // TEMPORARY: Also check userData directly for debugging
      const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');

      // Fallback: Also check userData directly if backend verification fails
      const isAdminFromUserData = userData.isSuperAdmin === true ||
                                   userData.is_super_user === true ||
                                   userData.isSuperUser === true;

      const finalAdminStatus = isAdmin || isAdminFromUserData;
      setIsSuperAdmin(finalAdminStatus);
    };
    checkAdminStatus();
  }, []);

  const tabs = [
    { id: 'settings', label: 'Settings' },
    { id: 'billing', label: 'Billing' },
  ];

  const handleSuccess = (message) => {
    toast.success(message);
  };

  const handleError = (message) => {
    toast.error(message);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // Manual check for updates
  const handleCheckForUpdates = async () => {
    setCheckingForUpdates(true);

    // Force service worker to check for updates
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();

          // Wait a moment to see if update was found
          setTimeout(() => {
            setCheckingForUpdates(false);
            if (!updateAvailable) {
              toast.info('You are already on the latest version!', {
                position: 'top-right',
                autoClose: 3000,
              });
            }
          }, 1500);
        } else {
          setCheckingForUpdates(false);
          toast.info('Service worker not registered', {
            position: 'top-right',
            autoClose: 3000,
          });
        }
      } catch (error) {
        setCheckingForUpdates(false);
        toast.error('Failed to check for updates', {
          position: 'top-right',
          autoClose: 3000,
        });
      }
    } else {
      setCheckingForUpdates(false);
      toast.info('Updates not supported in this browser', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={accountStyles.container}
    >
      {/* Subtab Navigation */}
      <div className={accountStyles.subtabContainer}>
        {tabs.map((tab, index) => (
          <a
            key={tab.id}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab(tab.id);
            }}
            className={`${accountStyles.subtabLink} ${activeTab === tab.id ? accountStyles.subtabLinkActive : ''} ${index === 0 ? accountStyles.subtabLinkFirst : ''}`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className={`${accountStyles.subtabIndicator} ${index === 0 ? accountStyles.subtabIndicatorFirst : accountStyles.subtabIndicatorCenter}`} />
            )}
          </a>
        ))}
      </div>

      {/* Tab Content */}
      <div className={accountStyles.tabContent}>
        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className={accountStyles.settingsGrid}>
            {/* Left Column */}
            <div className={accountStyles.leftColumn}>
              {/* Profile Section with Account Details */}
              <ProfileSection
                onSuccess={handleSuccess}
                onError={handleError}
              />

              {/* Customer Invitation Section - Super Admin Only */}
              {isSuperAdmin && (
                <FormSection title="Customer Invitation">
                  <CustomerInvitation />
                </FormSection>
              )}
            </div>

            {/* Right Column */}
            <div className={accountStyles.rightColumn}>
              {/* Security Section */}
              <FormSection title="Security">
                <div className={accountStyles.securityContent}>
                  <div className={accountStyles.securityItem}>
                    <div>
                      <h4 className={accountStyles.securityItemTitle}>Password</h4>
                      <p className={accountStyles.securityItemDesc}>
                        Change your password to keep your account secure
                      </p>
                    </div>
                    <Button variant="secondary" onClick={() => setPasswordModalOpen(true)}>
                      Change Password
                    </Button>
                  </div>
                  <div className={accountStyles.securityItem}>
                    <div>
                      <h4 className={accountStyles.securityItemTitle}>Two-Factor Authentication</h4>
                      <p className={accountStyles.securityItemDesc}>
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <span className={accountStyles.comingSoonBadge}>Coming Soon</span>
                  </div>
                </div>
              </FormSection>

              {/* App Version & Updates Section */}
              <FormSection title="App Version & Updates">
                <div className={accountStyles.securityContent}>
                  {/* Deployment Info - Super Admin Only */}
                  {isSuperAdmin && (
                    <div className={accountStyles.deploymentInfoBox}>
                      <div className={accountStyles.deploymentInfoGrid}>
                        <div className={accountStyles.deploymentInfoItem}>
                          <span className={accountStyles.deploymentInfoLabel}>Deploy #</span>
                          <span className={accountStyles.deploymentInfoValue}>{DEPLOYMENT_NUMBER}</span>
                        </div>
                        <div className={accountStyles.deploymentInfoItem}>
                          <span className={accountStyles.deploymentInfoLabel}>Version</span>
                          <span className={accountStyles.deploymentInfoValue}>{DEPLOYMENT_VERSION}</span>
                        </div>
                        <div className={accountStyles.deploymentInfoItem}>
                          <span className={accountStyles.deploymentInfoLabel}>Deployed</span>
                          <span className={accountStyles.deploymentInfoValue}>{BUILD_DATE} {BUILD_TIME}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className={accountStyles.securityItem}>
                    <div>
                      <h4 className={accountStyles.securityItemTitle}>Current Version</h4>
                      <p className={accountStyles.securityItemDesc}>
                        Version {versionInfo.appVersion} ({versionInfo.buildDate})
                        {versionInfo.serviceWorkerActive && ' • PWA Active'}
                      </p>
                    </div>
                    <div className={accountStyles.versionActions}>
                      {updateAvailable && (
                        <span className={accountStyles.updateBadge}>
                          Update Available
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={accountStyles.securityItem}>
                    <div>
                      <h4 className={accountStyles.securityItemTitle}>
                        {updateAvailable ? 'Update Now' : 'Check for Updates'}
                      </h4>
                      <p className={accountStyles.securityItemDesc}>
                        {updateAvailable
                          ? 'A new version is ready to install'
                          : 'Manually check if a new version is available'
                        }
                      </p>
                    </div>
                    <Button
                      variant={updateAvailable ? "primary" : "secondary"}
                      onClick={updateAvailable ? applyUpdate : handleCheckForUpdates}
                      disabled={checkingForUpdates}
                    >
                      {checkingForUpdates
                        ? 'Checking...'
                        : updateAvailable
                          ? 'Install Update'
                          : 'Check for Updates'
                      }
                    </Button>
                  </div>
                </div>
              </FormSection>

              {/* Team Management Section - Super Admin Only */}
              {isSuperAdmin && (
                <FormSection title="Team Management">
                  <TeamManagement />
                </FormSection>
              )}

              {/* Danger Zone */}
              <FormSection title="Danger Zone">
                <Card className={accountStyles.dangerCard}>
                  <Card.Body>
                    <div className={accountStyles.dangerContent}>
                      <div>
                        <h4 className={accountStyles.dangerTitle}>Delete Account</h4>
                        <p className={accountStyles.dangerDesc}>
                          Permanently delete your account and all associated data. This action cannot
                          be undone.
                        </p>
                      </div>
                      <Button variant="secondary" onClick={() => toast.info('Delete account feature coming soon', { position: 'top-center', autoClose: 3000 })}>
                        Delete Account
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </FormSection>
            </div>
          </div>
        )}

        {/* BILLING TAB */}
        {activeTab === 'billing' && (
          <div className={accountStyles.billingContainer}>
            <Card>
              <Card.Header>
                <h2>Billing & Project Credits</h2>
              </Card.Header>
              <Card.Body>
                <div className={accountStyles.placeholderContent}>
                  <div className={accountStyles.placeholderIcon}>💳</div>
                  <h3 className={accountStyles.placeholderHeading}>Coming Soon</h3>
                  <p className={accountStyles.placeholderText}>
                    Purchase project credits and manage billing directly from your account.
                    Payment integration will be available soon.
                  </p>
                  <div className={accountStyles.billingFeatures}>
                    <div className={accountStyles.feature}>✓ Flexible project credit packages</div>
                    <div className={accountStyles.feature}>✓ Volume discounts</div>
                    <div className={accountStyles.feature}>✓ Secure payment processing</div>
                    <div className={accountStyles.feature}>✓ Transaction history</div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>
        )}
      </div>

      {/* Modals */}
      <ChangePasswordModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        onSuccess={handleSuccess}
        onError={handleError}
      />
    </motion.div>
  );
};

export default Account;
