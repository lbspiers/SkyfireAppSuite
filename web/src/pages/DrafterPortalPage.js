import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import logger from '../services/devLogger';
import StatusTabs from '../components/dashboard/StatusTabs';
import DrafterPortal from '../components/dashboard/DrafterPortal';
import ProjectInformationForm from '../components/project/ProjectInformationForm';
import ChatterPanel from '../components/chatter/ChatterPanel';
import NotificationBell from '../components/chatter/NotificationBell';
import TabbedPanel from '../components/common/TabbedPanel';
import { Button } from '../components/ui';
import Account from './Account';
import Inventory from './Inventory';
import SupportPanel from '../components/support/SupportPanel';
import useDashboardData from '../hooks/useDashboardData';
import styles from '../styles/Dashboard.module.css';
import projectStyles from '../styles/ProjectAdd.module.css';
import pageStyles from '../pages/Project.module.css';
import { CSS_GRADIENTS } from '../styles/gradient';

/**
 * Drafter Portal Page
 * Dedicated portal for drafters with project management
 */
const DrafterPortalPage = () => {
  const { stats, statusCounts, statusChanges, projects, loading, error, refetch} = useDashboardData();
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [leftPanelMode, setLeftPanelMode] = useState('none'); // 'none' | 'newProject' | 'chatter'
  const [selectedChatterProject, setSelectedChatterProject] = useState(null);
  const [showMenuPanel, setShowMenuPanel] = useState(false); // Toggle menu/settings panel
  const [isFormValid, setIsFormValid] = useState(false);
  const navigate = useNavigate();
  const projectFormRef = useRef(null);

  // Solid midnight blue
  const containerColor = 'var(--bg-panel)';

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/login');
  };

  const handleFlameIconClick = (e) => {
    e.preventDefault();
    setShowMenuPanel(!showMenuPanel);
  };

  const handleProjectCreated = (projectUuid) => {
    logger.log('DrafterPortal', 'Project created:', projectUuid);
    // Navigate to the project page
    navigate(`/project/${projectUuid}`);
  };

  const handleNewProjectToggle = () => {
    if (leftPanelMode === 'newProject') {
      setLeftPanelMode('none');
    } else {
      setLeftPanelMode('newProject');
      setSelectedChatterProject(null);
    }
  };

  const handleViewChatter = (projectInfo) => {
    logger.debug('DrafterPortal', 'Opening chatter for project:', projectInfo);
    setLeftPanelMode('chatter');
    setSelectedChatterProject(projectInfo);
  };

  const handleCloseChatter = () => {
    setLeftPanelMode('none');
    setSelectedChatterProject(null);
  };

  const handleSwitchToNewProject = () => {
    setLeftPanelMode('newProject');
    setSelectedChatterProject(null);
  };

  const handleFormValidityChange = (isValid) => {
    setIsFormValid(isValid);
  };

  const pageVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        when: "beforeChildren"
      }
    }
  };

  // Get user info from session
  const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');

  // Try multiple possible property names for first name
  const userName = userData.first_name || userData.firstName || userData.firstname ||
                   userData.name?.split(' ')[0] || userData.email?.split('@')[0] || 'Admin';

  return (
    <motion.div
      className={styles.dashboardContainer}
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <div className={styles.dashboardHeader}>
        <div>
          <h1 className={styles.dashboardTitle}>
            Drafter Portal - Welcome, {userName} <NotificationBell />
          </h1>
        </div>

        <nav className={styles.topNav}>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate('/dashboard');
            }}
            className={styles.navLink}
          >
            Dashboard
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setShowMenuPanel(false);
            }}
            className={`${styles.navLink} ${!showMenuPanel ? styles.navLinkActive : ''}`}
          >
            Projects
          </a>
          <a
            href="#"
            onClick={handleFlameIconClick}
            className={styles.flameIconLink}
          >
            <img
              src={showMenuPanel ? require('../assets/images/fire-active.png') : require('../assets/images/appIcon.png')}
              alt="Skyfire"
              className={styles.flameIcon}
            />
          </a>
        </nav>
      </div>

      {/* Split Layout: Project Form (30%) | Dashboard (70%) */}
      <div className={`${styles.splitLayoutDashboard} ${leftPanelMode === 'none' ? styles.splitLayoutCollapsed : ''}`}>
        {/* Left Column: New Project OR Chatter Panel */}
        {leftPanelMode !== 'none' && (
          <motion.div
            className={`${styles.projectFormSidebar} ${
              leftPanelMode === 'chatter' ? styles.chatterSidebarTransparent : styles.chatterSidebarSolid
            }`}
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: '100%', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{
              width: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
              opacity: { duration: 0.4, delay: 0.05, ease: [0.4, 0, 0.2, 1] }
            }}
          >
            {leftPanelMode === 'newProject' && (
              <>
                <div className={styles.projectFormHeader}>
                  <h2 className={styles.projectFormTitle}>New Project</h2>
                  <Button
                    variant="primary"
                    onClick={() => {
                      if (projectFormRef.current && isFormValid) {
                        projectFormRef.current.submitForm();
                      }
                    }}
                    disabled={!isFormValid}
                  >
                    <span className={styles.createButtonIcon}>+</span>
                    <span>Create</span>
                  </Button>
                </div>

                <div className={projectStyles.tabContent}>
                  <ProjectInformationForm
                    ref={projectFormRef}
                    onNext={handleProjectCreated}
                    hideSubmitButton={true}
                    onValidityChange={handleFormValidityChange}
                  />
                </div>
              </>
            )}

            {leftPanelMode === 'chatter' && selectedChatterProject && (
              <ChatterPanel
                projectUuid={selectedChatterProject.uuid}
                projectInfo={selectedChatterProject}
                isInline={true}
                onClose={handleCloseChatter}
                onSwitchToNewProject={handleSwitchToNewProject}
              />
            )}
          </motion.div>
        )}

        {/* Right: Dashboard Content (70% or 100% when collapsed) */}
        <div className={styles.dashboardContent}>
          {/* Error State */}
          {error && (
            <div className={`${styles.section} ${styles.errorSection}`}>
              <div className={styles.errorContent}>
                <div>
                  <h3 className={styles.errorTitle}>⚠️ Error Loading Data</h3>
                  <p className={styles.errorMessage}>{error}</p>
                </div>
                <Button variant="secondary" onClick={refetch}>
                  Retry
                </Button>
              </div>
            </div>
          )}

          {/* Show either Menu Panel or Status Tabs */}
          {showMenuPanel ? (
            <div className={styles.menuPanelContainer}>
              <TabbedPanel
                tabs={[
                  { id: 'account', label: 'Account' },
                  { id: 'support', label: 'Support' },
                  { id: 'inventory', label: 'Inventory' },
                  { id: 'logout', label: 'Logout' }
                ]}
                defaultTab="account"
                storageKey="drafterPortalMenuTab"
                tabContent={{
                  account: (
                    <Account />
                  ),
                  support: (
                    <div className={styles.menuTabContent}>
                      <SupportPanel />
                    </div>
                  ),
                  inventory: <Inventory />,
                  logout: (
                    <div className={styles.menuTabContent}>
                      <h3 className={pageStyles.tabContentTitle}>Logout</h3>
                      <p className={pageStyles.tabContentPlaceholder}>Are you sure you want to logout?</p>
                      <Button variant="primary" onClick={handleLogout}>
                        Confirm Logout
                      </Button>
                    </div>
                  )
                }}
              />
            </div>
          ) : (
            <div>
              <StatusTabs
                statusCounts={statusCounts}
                statusChanges={statusChanges}
                selectedStatus={selectedStatus}
                onStatusChange={setSelectedStatus}
                loading={loading}
                customColor={containerColor}
              >
                <DrafterPortal
                  projects={projects}
                  loading={loading}
                  selectedStatus={selectedStatus}
                  onViewChatter={handleViewChatter}
                  onNewProject={handleNewProjectToggle}
                  isNewProjectOpen={leftPanelMode === 'newProject'}
                />
              </StatusTabs>
            </div>
          )}
        </div>
      </div>

    </motion.div>
  );
};

export default DrafterPortalPage;
