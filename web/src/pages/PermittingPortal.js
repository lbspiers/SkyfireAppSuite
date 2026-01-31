import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from '../config/axios';
import logger from '../services/devLogger';
import ProjectDetailsTabs from '../components/dashboard/ProjectDetailsTabs';
import ProjectOverviewTabs from '../components/dashboard/ProjectOverviewTabs';
import ProjectOverview from '../components/project/ProjectOverview';
import ChatterPanel from '../components/chatter/ChatterPanel';
import ChecklistPanel from '../components/checklist/ChecklistPanel';
import TasksPanel from '../components/tasks/TasksPanel';
import SolarAPPPanel from '../components/solarapp/SolarAPPPanel';
import RevisionsPanel from '../components/revisions/RevisionsPanel';
import PowerClerkPanel from '../components/powerclerk/PowerClerkPanel';
import FordjePanel from '../components/fordje/FordjePanel';
import { ProjectHeader, ErrorState, LoadingSpinner } from '../components/ui';
import FormSelect from '../components/ui/FormSelect';
import { isCurrentUserAdminAsync } from '../utils/adminUtils';
import useDashboardData from '../hooks/useDashboardData';
import { useSystemDetails } from '../hooks/useSystemDetails';
import styles from '../styles/Dashboard.module.css';
import portalStyles from '../styles/Portal.module.css';
import chatterStyles from '../styles/Chatter.module.css';

/**
 * Permitting Portal Page
 * Permitting team view of project information
 */
const PermittingPortal = () => {
  const { projectUuid } = useParams();
  const { stats, statusCounts, statusChanges, loading, error, refetch } = useDashboardData();
  const [selectedStatus, setSelectedStatus] = useState('overview');
  const [selectedOverviewTab, setSelectedOverviewTab] = useState('fordje');
  const [projectData, setProjectData] = useState(null);
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(() => {
    return localStorage.getItem('dashboardCompanyFilter') || 'All';
  });
  const [isSuperUser, setIsSuperUser] = useState(false);

  // Fetch system details for ProjectOverview component
  const { data: systemDetails } = useSystemDetails({
    projectUuid: projectUuid || '',
    autoFetch: !!projectUuid,
  });

  // Check if user is admin/superuser
  useEffect(() => {
    const checkAdmin = async () => {
      const isAdmin = await isCurrentUserAdminAsync();
      setIsSuperUser(isAdmin);
    };
    checkAdmin();
  }, []);

  // Fetch companies list if admin
  useEffect(() => {
    if (!isSuperUser) return;

    const fetchCompanies = async () => {
      try {
        const response = await axios.get('/companies');
        const companiesList = response.data?.data || response.data || [];
        const options = ['All', ...companiesList.map(c => c.name)];
        setCompanies(options);
      } catch (error) {
        logger.error('PermittingPortal', 'Failed to fetch companies:', error);
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

          // Auto-select this project's company in the filter
          if (isSuperUser && projectData.details?.company_name) {
            setSelectedCompany(projectData.details.company_name);
          }
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
  }, [projectUuid, isSuperUser]);

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/login");
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
          <nav className={styles.topNav}>
            <Link
              to={`/project/${projectUuid}/sales`}
              className={styles.navLink}
            >
              Sales
            </Link>
            <Link
              to={`/project/${projectUuid}/design`}
              className={styles.navLink}
            >
              Design
            </Link>
            <Link
              to={`/project/${projectUuid}/permitting`}
              className={`${styles.navLink} ${styles.navLinkActive}`}
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
          </nav>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className={`${styles.section} ${portalStyles.errorSection}`}>
          <ErrorState
            title="Error Loading Data"
            message={error}
            onRetry={refetch}
          />
        </div>
      )}

      {/* Project Details Tabs - Side by Side (30% / 70%) */}
      <div className={portalStyles.gridLayout}>
        <ChatterPanel
          projectUuid={projectUuid}
          projectInfo={projectData}
          isInline={true}
        />

        <ProjectOverviewTabs
          selectedTab={selectedOverviewTab}
          onTabChange={setSelectedOverviewTab}
          loading={loading}
          tabs={['fordje', 'solarapp', 'powerclerk', 'revisions']}
        >
          {selectedOverviewTab === 'fordje' && projectUuid && (
            <FordjePanel
              projectUuid={projectUuid}
              projectData={projectData}
            />
          )}
          {selectedOverviewTab === 'solarapp' && projectUuid && (
            <SolarAPPPanel
              projectUuid={projectUuid}
              projectData={projectData}
            />
          )}
          {selectedOverviewTab === 'powerclerk' && projectUuid && (
            <PowerClerkPanel
              projectUuid={projectUuid}
              projectData={projectData}
            />
          )}
          {selectedOverviewTab === 'revisions' && projectUuid && (
            <RevisionsPanel
              projectUuid={projectUuid}
              projectData={projectData}
            />
          )}
        </ProjectOverviewTabs>
      </div>
    </motion.div>
  );
};

export default PermittingPortal;
