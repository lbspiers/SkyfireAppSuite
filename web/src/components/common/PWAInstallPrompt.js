import React, { useState, useEffect } from 'react';
import logger from '../../services/devLogger';
import styles from './PWAInstallPrompt.module.css';

/**
 * PWA Install Prompt Component
 * Shows a custom install banner when the app is installable
 *
 * Features:
 * - Captures beforeinstallprompt event
 * - Shows custom branded install UI
 * - Dismissable with "remind later" option
 * - Tracks if app is already installed
 */
export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if user dismissed recently (within 7 days)
    const dismissedAt = localStorage.getItem('pwa-install-dismissed');
    if (dismissedAt) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return; // Don't show prompt yet
      }
    }

    // Listen for the install prompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // Show prompt after a short delay (let user see the app first)
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    };

    // Listen for successful install
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      localStorage.removeItem('pwa-install-dismissed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the native install prompt
    deferredPrompt.prompt();

    // Wait for user response
    const { outcome } = await deferredPrompt.userChoice;
    logger.log('PWA', 'Install prompt outcome:', outcome);

    // Clear the deferred prompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Don't render if installed, no prompt available, or shouldn't show
  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.prompt}>
        <div className={styles.iconContainer}>
          <img
            src="/logo192.png"
            alt="Skyfire"
            className={styles.icon}
          />
        </div>

        <div className={styles.content}>
          <h3 className={styles.title}>Install Skyfire</h3>
          <p className={styles.description}>
            Install Skyfire for quick access and a better experience
          </p>
        </div>

        <div className={styles.actions}>
          <button
            className={styles.dismissButton}
            onClick={handleDismiss}
          >
            Not now
          </button>
          <button
            className={styles.installButton}
            onClick={handleInstallClick}
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
}

export default PWAInstallPrompt;
