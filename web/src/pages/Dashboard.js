import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { toast } from 'react-toastify';
import logger from '../services/devLogger';
import StatusTabs from '../components/dashboard/StatusTabs';
import ProjectsOverview from '../components/dashboard/ProjectsOverview';
import ProjectInformationForm from '../components/project/ProjectInformationForm';
import ChatterPanel from '../components/chatter/ChatterPanel';
import NotificationBell from '../components/chatter/NotificationBell';
import TabbedPanel from '../components/common/TabbedPanel';
import { Button, FormSelect } from '../components/ui';
import Account from './Account';
import Inventory from './Inventory';
import SupportPanel from '../components/support/SupportPanel';
import { DevPortal } from '../components/dev';
import useDashboardData from '../hooks/useDashboardData';
import { useDevNotes } from '../hooks/useDevNotes';
import { useSocket } from '../hooks/useSocket';
import { isCurrentUserAdminAsync } from '../utils/adminUtils';
import axios from '../config/axios';
import styles from '../styles/Dashboard.module.css';
import projectStyles from '../styles/ProjectAdd.module.css';
import pageStyles from '../pages/Project.module.css';
import { CSS_GRADIENTS } from '../styles/gradient';
import { getTimeBasedGreeting } from '../utils/constants';
import { canAccessDevPortal } from '../constants/devPortalConstants';

/**
 * Skyfire Admin Dashboard - Main Page
 * Professional industrial-themed dashboard with dark mode, animated KPI cards, and real-time data
 * Split layout: Dashboard content (70%) | Project creation form (30%)
 */
const Dashboard = () => {
  // DIAGNOSTIC - Remove after debugging
  const mountCountRef = useRef(0);
  useEffect(() => {
    mountCountRef.current++;
    console.log(`🏠 Dashboard MOUNTED (count: ${mountCountRef.current})`);
    return () => console.log(`🏠 Dashboard UNMOUNTED (count: ${mountCountRef.current})`);
  }, []);

  const { stats, statusCounts, statusChanges, projects, loading, error, refetch, addProject} = useDashboardData();
  const { openPanel } = useDevNotes();
  const { onAutomationComplete } = useSocket();
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [leftPanelMode, setLeftPanelMode] = useState('none'); // 'none' | 'newProject' | 'chatter'
  const [selectedChatterProject, setSelectedChatterProject] = useState(null);
  const [showMenuPanel, setShowMenuPanel] = useState(false); // Toggle menu/settings panel
  const [isFormValid, setIsFormValid] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [companyFilter, setCompanyFilter] = useState(() => {
    // Load company filter from localStorage
    const saved = localStorage.getItem('dashboardCompanyFilter');
    return saved || 'All';
  });
  const [isSuperUser, setIsSuperUser] = useState(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(() => {
    // Load collapsed state from localStorage
    const saved = localStorage.getItem('dashboardPanelCollapsed');
    return saved === 'true';
  });
  const [isPanelHovered, setIsPanelHovered] = useState(false);
  const navigate = useNavigate();
  const projectFormRef = useRef(null);

  // Get user data from session
  const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');

  // Check if user can access Dev Portal
  const showDevPortalTab = canAccessDevPortal(userData?.email);

  // Save collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem('dashboardPanelCollapsed', isPanelCollapsed.toString());
  }, [isPanelCollapsed]);

  // Save company filter to localStorage
  useEffect(() => {
    localStorage.setItem('dashboardCompanyFilter', companyFilter);
  }, [companyFilter]);

  // Check admin status on mount
  useEffect(() => {
    const checkAdminStatus = async () => {
      const isAdmin = await isCurrentUserAdminAsync();
      setIsSuperUser(isAdmin);
    };
    checkAdminStatus();
  }, []);

  // Fetch companies for super user filter
  useEffect(() => {
    const fetchCompanies = async () => {
      if (!isSuperUser) return;

      try {
        const response = await axios.get('/companies/list-active');
        if (response.data?.status === 'SUCCESS' && Array.isArray(response.data.data)) {
          const companyOptions = [
            { label: 'All Companies', value: 'All', uuid: 'All' },
            ...response.data.data.map(c => ({
              label: c.name,
              value: c.uuid,
              uuid: c.uuid
            }))
          ];
          setCompanies(companyOptions);
        }
      } catch (error) {
        logger.error('Dashboard', 'Failed to fetch companies:', error);
      }
    };

    fetchCompanies();
  }, [isSuperUser]);

  // Memoize the automation handler to prevent listener cycling
  const handleAutomationComplete = useCallback(async (eventData) => {
    console.log('🎉 automation:complete EVENT RECEIVED:', eventData);
    logger.log('Dashboard', 'New project created via automation:', eventData);

    try {
      // Fetch the single new project by UUID
      const response = await axios.get(`/project/${eventData.project_id}`);
      const newProject = response.data;

      logger.log('Dashboard', 'Fetched new project data:', newProject);

      // Prepend to existing list (no full refetch - smooth!)
      addProject(newProject);

      // Show subtle toast notification
      toast.success(`New project: ${eventData.project_number || eventData.project_id}`, {
        position: 'bottom-right',
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
    } catch (err) {
      logger.error('Dashboard', 'Failed to fetch new project:', err);
      // Fallback to full refetch if single fetch fails
      refetch();
    }
  }, [addProject, refetch]);

  // Listen for automation:complete events (new project created via webhook)
  useEffect(() => {
    console.log('🔧 Dashboard: Setting up automation:complete listener');
    console.log('🔧 handleAutomationComplete reference:', handleAutomationComplete);
    console.log('🔧 onAutomationComplete reference:', onAutomationComplete);
    const cleanup = onAutomationComplete(handleAutomationComplete);
    console.log('✅ Dashboard: automation:complete listener registered successfully');

    return () => {
      console.log('🔧 Dashboard: Cleaning up automation:complete listener');
      cleanup();
    };
  }, [onAutomationComplete, handleAutomationComplete]);

  // Filter projects by company for super users
  const filteredProjects = useMemo(() => {
    if (!isSuperUser || companyFilter === 'All') {
      return projects;
    }
    return projects.filter(p => p.company?.uuid === companyFilter || p.company_id === companyFilter);
  }, [projects, companyFilter, isSuperUser]);

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/login');
  };

  const handleFlameIconClick = (e) => {
    e.preventDefault();
    setShowMenuPanel(!showMenuPanel);
  };

  const handleProjectCreated = (projectUuid) => {
    logger.log('Dashboard', 'Project created on dashboard:', projectUuid);
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
    logger.debug('Dashboard', 'Opening chatter for project:', projectInfo);
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

  const togglePanelCollapse = () => {
    setIsPanelCollapsed(!isPanelCollapsed);
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
        <div className={styles.headerLeft}>
          <h1 className={styles.dashboardTitle}>
            {getTimeBasedGreeting(userName)}
          </h1>
          {/* Super User Company Filter - Left of NotificationBell */}
          {isSuperUser && companies.length > 0 && (
            <div className={styles.companyFilterWrapper}>
              <FormSelect
                options={companies}
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                fullWidth={false}
                size="md"
              />
            </div>
          )}
          {/* Dev Notes Icon - Super Admin Only */}
          {showDevPortalTab && (
            <button
              className={styles.devNotesIcon}
              onClick={openPanel}
              title="Dev Notes"
            >
              <FileText size={20} />
            </button>
          )}
          <NotificationBell />
        </div>

        <nav className={styles.topNav}>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate('/scheduling');
            }}
            className={styles.navLink}
          >
            Scheduling
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
      <div className={`${styles.splitLayoutDashboard} ${leftPanelMode === 'none' ? styles.splitLayoutCollapsed : ''} ${isPanelCollapsed ? styles.splitLayoutPanelCollapsed : ''}`}>
        {/* Left Column: New Project OR Chatter Panel */}
        {leftPanelMode !== 'none' && (
          <motion.div
            className={`${styles.projectFormSidebar} ${
              leftPanelMode === 'chatter' ? styles.chatterSidebarTransparent : styles.chatterSidebarSolid
            } ${isPanelCollapsed ? styles.projectFormSidebarCollapsed : ''} ${isPanelHovered && isPanelCollapsed ? styles.projectFormSidebarHovered : ''}`}
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: '100%', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{
              width: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
              opacity: { duration: 0.4, delay: 0.05, ease: [0.4, 0, 0.2, 1] }
            }}
            onMouseEnter={() => isPanelCollapsed && setIsPanelHovered(true)}
            onMouseLeave={() => setIsPanelHovered(false)}
          >
            {/* Chevron Toggle Button */}
            {/* FEATURE DISABLED: Collapse/expand functionality fully implemented but hidden for now */}
            {/* <button
              className={styles.chevronToggleButton}
              onClick={togglePanelCollapse}
              title={isPanelCollapsed ? 'Expand panel' : 'Collapse panel'}
            >
              {isPanelCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button> */}
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
                  ...(showDevPortalTab ? [{ id: 'devportal', label: 'Dev Portal' }] : []),
                  { id: 'logout', label: 'Logout' }
                ]}
                defaultTab="account"
                storageKey="dashboardMenuTab"
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
                  devportal: <DevPortal />,
                  logout: (
                    <div className={styles.menuTabContent}>
                      <h3 className={pageStyles.tabContentTitle}>Logout</h3>
                      <p className={pageStyles.tabContentPlaceholder}>Are you sure you want to logout?</p>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <Button variant="primary" onClick={handleLogout}>
                          Confirm Logout
                        </Button>
                      </div>
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
              >
                <ProjectsOverview
                  projects={filteredProjects}
                  loading={loading}
                  selectedStatus={selectedStatus}
                  onViewChatter={handleViewChatter}
                  onNewProject={handleNewProjectToggle}
                  isNewProjectOpen={leftPanelMode === 'newProject'}
                  showCompanyBadge={isSuperUser}
                />
              </StatusTabs>
            </div>
          )}
        </div>
      </div>

    </motion.div>
  );
};

export default Dashboard;
