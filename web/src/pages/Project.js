import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from '../config/axios';
import TabbedPanel from '../components/common/TabbedPanel';
import Account from './Account';
import Inventory from './Inventory';
import SupportPanel from '../components/support/SupportPanel';
import { Button, FormSelect } from '../components/ui';
import styles from '../styles/Dashboard.module.css';
import projectStyles from '../styles/ProjectAdd.module.css';
import pageStyles from './Project.module.css';
import logger from '../services/devLogger';
import { isCurrentUserAdminAsync } from '../utils/adminUtils';

const TABS = [
  { key: 'site', label: 'Site' },
  { key: 'equipment', label: 'Equipment' },
  { key: 'electrical', label: 'Electrical' },
  { key: 'structural', label: 'Structural' },
];

/**
 * Project Details Page
 * Uses same layout as Dashboard with tabs for different project sections
 */
const Project = () => {
  const { projectUuid } = useParams();
  const [selectedTab, setSelectedTab] = useState('site');
  const [projectData, setProjectData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(() => {
    // Load from localStorage
    return localStorage.getItem('dashboardCompanyFilter') || 'All';
  });
  const [isSuperUser, setIsSuperUser] = useState(false);
  const navigate = useNavigate();

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
        logger.error('Project', 'Failed to fetch companies:', error);
      }
    };

    fetchCompanies();
  }, [isSuperUser]);

  // Save selected company to localStorage when changed
  useEffect(() => {
    localStorage.setItem('dashboardCompanyFilter', selectedCompany);
  }, [selectedCompany]);

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const companyData = JSON.parse(sessionStorage.getItem('companyData') || '{}');
        const companyId = companyData.uuid;

        if (!projectUuid || !companyId) {
          logger.error('Project', 'Missing projectUuid or companyId');
          return;
        }

        // Fetch project data
        const response = await axios.get(`/project/${projectUuid}?companyId=${companyId}`);
        if (response.data.status === 'SUCCESS' && response.data.project) {
          const project = response.data.project;
          setProjectData(project);

          // Set selected company to this project's company if superuser
          if (isSuperUser && project.company?.uuid) {
            setSelectedCompany(project.company.uuid);
          }
        }
      } catch (error) {
        logger.error('Project', 'Error fetching project data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [projectUuid, isSuperUser]);

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/login');
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

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'site':
        return (
          <div className={pageStyles.tabContent}>
            <h3 className={pageStyles.tabContentTitle}>Site Information</h3>
            <p className={pageStyles.tabContentPlaceholder}>Site details form coming soon...</p>
          </div>
        );
      case 'equipment':
        return (
          <div className={pageStyles.tabContent}>
            <h3 className={pageStyles.tabContentTitle}>Equipment</h3>
            <p className={pageStyles.tabContentPlaceholder}>Equipment details form coming soon...</p>
          </div>
        );
      case 'electrical':
        return (
          <div className={pageStyles.tabContent}>
            <h3 className={pageStyles.tabContentTitle}>Electrical Information</h3>
            <p className={pageStyles.tabContentPlaceholder}>Electrical details form coming soon...</p>
          </div>
        );
      case 'structural':
        return (
          <div className={pageStyles.tabContent}>
            <h3 className={pageStyles.tabContentTitle}>Structural Information</h3>
            <p className={pageStyles.tabContentPlaceholder}>Structural details form coming soon...</p>
          </div>
        );
      default:
        return null;
    }
  };

  const containerVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

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
            <img src={require('../assets/images/appIcon.png')} alt="Skyfire" className={styles.flameIcon} />
            {loading ? 'Loading...' : projectData ? `${projectData.customer_first_name} ${projectData.customer_last_name}` : 'Project'}
          </h1>
          {/* Company Name Display (for superusers) */}
          {isSuperUser && projectData?.company?.name && (
            <div className={pageStyles.companyHeader}>
              {projectData.company.name}
            </div>
          )}
        </div>

        <nav className={styles.topNav}>
          {/* Super User Company Filter */}
          {isSuperUser && companies.length > 0 && (
            <div className={styles.companyFilterWrapper}>
              <FormSelect
                options={companies}
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                fullWidth={false}
                size="md"
              />
            </div>
          )}
          <Link to="/dashboard" className={styles.navLink}>Dashboard</Link>
        </nav>
      </div>

      {/* Main Content */}
      <div className={styles.dashboardContent}>
        {/* Admin Tabs Panel (Account, Support, Inventory, Logout) */}
        <div className={pageStyles.menuPanel}>
          <TabbedPanel
            tabs={[
              { id: 'account', label: 'Account' },
              { id: 'support', label: 'Support' },
              { id: 'inventory', label: 'Inventory' },
              { id: 'logout', label: 'Logout' }
            ]}
            panels={{
              account: (
                <div className={pageStyles.panelNoPadding}>
                  <Account />
                </div>
              ),
              support: (
                <div className={pageStyles.panelNoPadding}>
                  <SupportPanel />
                </div>
              ),
              inventory: <Inventory />,
              logout: (
                <div className={pageStyles.logoutPanel}>
                  <h3 className={pageStyles.tabContentTitle}>Logout</h3>
                  <p className={pageStyles.logoutMessage}>Are you sure you want to logout?</p>
                  <Button variant="primary" onClick={handleLogout}>
                    Confirm Logout
                  </Button>
                </div>
              ),
            }}
          />
        </div>

        {/* Project Tabs with Content Panel */}
        <div className={styles.statusTabsWrapper}>
          {/* Tabs Row */}
          <motion.div
            className={styles.statusTabsContainer}
            variants={containerVariants}
            initial="initial"
            animate="animate"
          >
            {TABS.map((tab) => {
              const isSelected = selectedTab === tab.key;

              return (
                <button
                  key={tab.key}
                  onClick={() => setSelectedTab(tab.key)}
                  className={`${styles.statusTab} ${isSelected ? styles.statusTabSelected : ''} ${isSelected ? pageStyles.tabSelected : ''}`}
                >
                  <div className={`${styles.statusTabLabel} ${isSelected ? pageStyles.tabLabelSelected : pageStyles.tabLabelUnselected}`}>
                    {tab.label}
                  </div>
                </button>
              );
            })}
          </motion.div>

          {/* Content Panel - connects to selected tab */}
          <div
            className={`${styles.statusContentPanel} ${
              selectedTab === 'site' && selectedTab === 'structural'
                ? pageStyles.contentPanelBothSquare
                : selectedTab === 'site'
                ? pageStyles.contentPanelLeftSquare
                : selectedTab === 'structural'
                ? pageStyles.contentPanelRightSquare
                : pageStyles.contentPanelBothRounded
            }`}
          >
            {renderTabContent()}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Project;
