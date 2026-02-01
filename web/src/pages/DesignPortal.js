import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from '../config/axios';
import logger from '../services/devLogger';
import ProjectDetailsTabs from '../components/dashboard/ProjectDetailsTabs';
import ProjectOverviewTabs from '../components/dashboard/ProjectOverviewTabs';
import PlanSetVersions from '../components/dashboard/PlanSetVersions';
import SitePlanVersions from '../components/dashboard/SitePlanVersions';
import SurveyPanel from '../components/project/SurveyPanel';
import FilesTab from '../components/project/FilesTab';
import FilesPanel from '../components/project/FilesPanel';
import SiteForm from '../components/project/SiteForm';
import EquipmentForm from '../components/project/EquipmentForm';
import ElectricalForm from '../components/project/ElectricalForm';
import StructuralForm from '../components/project/StructuralForm';
import SubmitForm from '../components/project/SubmitForm';
import ChatterPanel from '../components/chatter/ChatterPanel';
import TabbedPanel from '../components/common/TabbedPanel';
import QCChecklistPanel from '../components/pdf/QCChecklistPanel';
import Account from './Account';
import SupportPanel from '../components/support/SupportPanel';
import { ProjectHeader, FormSelect } from '../components/ui';
import ProjectChatTab from '../components/project/ProjectChatTab';
import RevisionsPanel from '../components/revisions/RevisionsPanel';
import useDashboardData from '../hooks/useDashboardData';
import { isCurrentUserAdminAsync } from '../utils/adminUtils';
import styles from '../styles/Dashboard.module.css';
import portalStyles from '../styles/Portal.module.css';
import { CSS_GRADIENTS } from '../styles/gradient';
import { canAccessDevPortal } from '../constants/devPortalConstants';

/**
 * Design Portal Page
 * Design team view of project information
 */
const DesignPortal = () => {
  const { projectUuid } = useParams();
  const { stats, statusCounts, statusChanges, loading, error, refetch } = useDashboardData();
  const [selectedStatus, setSelectedStatus] = useState('equipment');
  const [equipmentInitialSubTab, setEquipmentInitialSubTab] = useState(null); // Track where to land in Equipment
  const [selectedOverviewTab, setSelectedOverviewTab] = useState('survey');
  const [projectData, setProjectData] = useState(null);
  const [showMenuPanel, setShowMenuPanel] = useState(false); // Toggle menu/settings panel
  const [showQCPanel, setShowQCPanel] = useState(false);
  const [qcProjectId, setQcProjectId] = useState(null);
  const [qcChecklistType, setQcChecklistType] = useState('site'); // 'site' or 'design'
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(() => {
    return localStorage.getItem('dashboardCompanyFilter') || 'All';
  });
  const [isSuperUser, setIsSuperUser] = useState(false);
  const navigate = useNavigate();

  // Get user data from session
  const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');

  // Check if user can access Dev Portal
  const showDevPortalTab = canAccessDevPortal(userData?.email);

  // Enhanced navigation handler that supports sub-tab targeting
  const handleNavigateToTab = (tabKey, options = {}) => {
    setSelectedStatus(tabKey);

    // If navigating to equipment tab with sub-tab specified
    if (tabKey === 'equipment' && options.subTab) {
      setEquipmentInitialSubTab(options.subTab);
    } else {
      setEquipmentInitialSubTab(null);
    }
  };

  // Check admin status on mount
  useEffect(() => {
    const checkAdminStatus = async () => {
      const isAdmin = await isCurrentUserAdminAsync();
      setIsSuperUser(isAdmin);
    };
    checkAdminStatus();
  }, []);

  // Fetch companies for super user dropdown
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
        logger.error('DesignPortal', 'Failed to fetch companies:', error);
      }
    };

    fetchCompanies();
  }, [isSuperUser]);

  // Handle company filter change - navigate to dashboard with new filter
  const handleCompanyChange = (e) => {
    const newCompany = e.target.value;
    localStorage.setItem('dashboardCompanyFilter', newCompany);
    setSelectedCompany(newCompany);
    navigate('/dashboard');
  };

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const userData = JSON.parse(
          sessionStorage.getItem("userData") || "{}"
        );
        const companyId = userData?.company?.uuid;

        if (!projectUuid) {
          logger.error("Portal", "Missing projectUuid");
          return;
        }

        // Fetch project data
        const endpoint = companyId
          ? `/project/${projectUuid}?companyId=${companyId}`
          : `/project/${projectUuid}`;

        const response = await axios.get(endpoint);

        // Extract project data (API returns data nested in response.data.data)
        const projectData = response.data.data || response.data;

        if (projectData) {
          setProjectData(projectData);
        } else {
          logger.warn("Portal", "No project data found in response");
        }
      } catch (error) {
        logger.error("Portal", "Error fetching project data:", error);
        if (error.response?.data) {
          logger.error("Portal", "Error details:", error.response.data);
        }
      }
    };

    fetchProjectData();
  }, [projectUuid]);

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/login");
  };

  const handleFlameIconClick = (e) => {
    e.preventDefault();
    setShowMenuPanel(!showMenuPanel);
  };

  const handleQCPanelChange = (isOpen, projectId, checklistType = 'site') => {
    setShowQCPanel(isOpen);
    setQcProjectId(projectId);
    setQcChecklistType(checklistType || 'site');
  };

  const pageVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        when: "beforeChildren",
      },
    },
  };

  // Get customer name, address, and project ID from project data
  const customerName = projectData?.details
    ? `${projectData.details.customer_last_name || ""}, ${
        projectData.details.customer_first_name || ""
      }`
    : "Loading...";

  const address = projectData?.site
    ? `${projectData.site.address || ""}${
        projectData.site.city ? `, ${projectData.site.city}` : ""
      }${projectData.site.state ? `, ${projectData.site.state}` : ""}${
        projectData.site.zip ? ` ${projectData.site.zip}` : ""
      }`
    : "Loading...";

  const projectId =
    projectData?.details?.installer_project_id ||
    projectData?.uuid?.slice(0, 8) ||
    "Loading...";

  const ahj = projectData?.site?.ahj || '';
  const utility = projectData?.site?.utility || '';

  return (
    <motion.div
      className={styles.dashboardContainer}
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <div className={styles.dashboardHeader}>
        <div className={portalStyles.headerInfoContainer}>
          {/* Company Name for Superusers */}
          {isSuperUser && projectData?.details?.company_name && (
            <>
              <span className={portalStyles.companyName}>
                {projectData.details.company_name}
              </span>
              <span className={portalStyles.divider}>|</span>
            </>
          )}
          <span className={portalStyles.customerName}>
            {customerName}
          </span>
          <span className={portalStyles.divider}>|</span>
          <span className={portalStyles.address}>
            {address}
          </span>
          <span className={portalStyles.divider}>|</span>
          <span className={portalStyles.projectId}>
            {projectId}
          </span>
          {/* Super User Company Filter */}
          {isSuperUser && companies.length > 0 && (
            <>
              <span className={portalStyles.divider}>|</span>
              <FormSelect
                options={companies}
                value={selectedCompany}
                onChange={handleCompanyChange}
                fullWidth={false}
                size="sm"
              />
            </>
          )}
        </div>

        <div className={portalStyles.headerActions}>
          {/* Main Navigation */}
          <nav className={styles.topNav}>
            <Link
              to={`/project/${projectUuid}/sales`}
              className={styles.navLink}
            >
              Sales
            </Link>
            <Link
              to={`/project/${projectUuid}/design`}
              className={`${styles.navLink} ${styles.navLinkActive}`}
            >
              Design
            </Link>
            <Link
              to={`/project/${projectUuid}/permitting`}
              className={styles.navLink}
            >
              Permitting
            </Link>
            <Link
              to={`/project/${projectUuid}/install`}
              className={styles.navLink}
            >
              Install
            </Link>
            <Link
              to="/scheduling"
              className={styles.navLink}
            >
              Scheduling
            </Link>
            <Link
              to="/dashboard"
              className={styles.navLink}
            >
              Projects
            </Link>
            <a
              href="#"
              onClick={handleFlameIconClick}
              className={portalStyles.flameIconLink}
            >
              <img
                src={showMenuPanel ? require('../assets/images/fire-active.png') : require('../assets/images/appIcon.png')}
                alt="Skyfire"
                className={styles.flameIcon}
              />
            </a>
          </nav>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className={`${styles.section} ${portalStyles.errorSection}`}>
          <div className={portalStyles.errorContainer}>
            <div className={portalStyles.errorContent}>
              <h3 className={portalStyles.errorTitle}>
                ⚠️ Error Loading Data
              </h3>
              <p className={portalStyles.errorMessage}>{error}</p>
            </div>
            <button
              onClick={refetch}
              className={`${styles.button} ${styles.buttonSecondary}`}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Show either Menu Panel or Project Details */}
      {showMenuPanel ? (
        <div className={portalStyles.menuPanelContainer}>
          <TabbedPanel
            tabs={[
              { id: 'account', label: 'Account' },
              { id: 'support', label: 'Support' },
              { id: 'inventory', label: 'Inventory' },
              ...(showDevPortalTab ? [{ id: 'devportal', label: 'Dev Portal' }] : []),
              { id: 'logout', label: 'Logout' }
            ]}
            defaultTab="account"
            storageKey="designPortalMenuTab"
            tabContent={{
              account: (
                <Account />
              ),
              support: (
                <div className={portalStyles.menuContent}>
                  <SupportPanel />
                </div>
              ),
              inventory: (
                <div className={portalStyles.menuContent}>
                  <h3>Inventory</h3>
                  <p>Inventory management coming soon...</p>
                </div>
              ),
              devportal: (
                <div className={portalStyles.menuContent}>
                  <h3>Dev Portal</h3>
                  <p>Internal task tracking for the dev team.</p>
                  <button onClick={() => navigate('/dev-portal')} className={portalStyles.logoutButton}>
                    Open Dev Portal
                  </button>
                </div>
              ),
              logout: (
                <div className={portalStyles.menuContent}>
                  <h3>Logout</h3>
                  <p>Are you sure you want to logout?</p>
                  <button onClick={handleLogout} className={portalStyles.logoutButton}>
                    Confirm Logout
                  </button>
                </div>
              )
            }}
          />
        </div>
      ) : (
        <div className={`${styles.splitLayoutDashboard} ${portalStyles.splitLayoutRelative}`}>
          {/* QC Modal Overlay - Covers entire left column */}
          {showQCPanel && (
            <div className={portalStyles.qcPanelOverlay}>
              <QCChecklistPanel
                isOpen={showQCPanel}
                onClose={() => setShowQCPanel(false)}
                projectId={qcProjectId}
                checklistType={qcChecklistType}
              />
            </div>
          )}

          <ProjectDetailsTabs
            statusCounts={statusCounts}
            statusChanges={statusChanges}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            loading={loading}
            tabKeys={['equipment', 'electrical', 'structural', 'submit', 'chat']}
          >
            {selectedStatus === 'site' && (
              <SiteForm projectUuid={projectUuid} projectData={projectData} />
            )}
            {selectedStatus === 'equipment' && (
              <EquipmentForm
                projectUuid={projectUuid}
                projectData={projectData}
                onNavigateToTab={handleNavigateToTab}
                initialSubTab={equipmentInitialSubTab}
              />
            )}
            {selectedStatus === 'electrical' && (
              <ElectricalForm
                projectUuid={projectUuid}
                projectData={projectData}
                onNavigateToTab={handleNavigateToTab}
              />
            )}
            {selectedStatus === 'structural' && (
              <StructuralForm
                projectUuid={projectUuid}
                projectData={projectData}
                onNavigateToTab={handleNavigateToTab}
              />
            )}
            {selectedStatus === 'submit' && (
              <SubmitForm
                projectUuid={projectUuid}
                projectData={projectData}
                onNavigateToTab={handleNavigateToTab}
              />
            )}
            {selectedStatus === 'chat' && projectUuid && (
              <ProjectChatTab
                projectUuid={projectUuid}
                projectData={projectData}
              />
            )}
          </ProjectDetailsTabs>

          <ProjectOverviewTabs
            selectedTab={selectedOverviewTab}
            onTabChange={setSelectedOverviewTab}
            loading={loading}
            tabs={['survey', 'overview', 'planset', 'revisions', 'files']}
          >
            {selectedOverviewTab === 'overview' && projectUuid && (
              <SitePlanVersions
                projectUuid={projectUuid}
                projectName={projectId}
              />
            )}
            {selectedOverviewTab === 'survey' && projectUuid && (
              <SurveyPanel
                projectUuid={projectUuid}
                projectData={projectData}
                onSwitchToFilesTab={() => setSelectedOverviewTab('files')}
              />
            )}
            {selectedOverviewTab === 'planset' && (
              <PlanSetVersions
                projectUuid={projectUuid}
                onQCPanelChange={handleQCPanelChange}
              />
            )}
            {selectedOverviewTab === 'revisions' && projectUuid && (
              <RevisionsPanel
                projectUuid={projectUuid}
                projectData={projectData}
              />
            )}
            {selectedOverviewTab === 'files' && projectUuid && (
              <FilesPanel projectUuid={projectUuid} />
            )}
          </ProjectOverviewTabs>
        </div>
      )}
    </motion.div>
  );
};

export default DesignPortal;
