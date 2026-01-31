import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ProjectInformationForm from '../components/project/ProjectInformationForm';
import ProjectPhotoGallery from '../components/project/ProjectPhotoGallery';
import styles from '../styles/ProjectAdd.module.css';
import pageStyles from './Project.module.css';

const TABS = [
  { id: 'info', label: 'Project Info' },
  { id: 'site', label: 'Site' },
  { id: 'electrical', label: 'Electrical' },
  { id: 'structural', label: 'Structural' },
];

const ProjectAdd = () => {
  const [activeTab, setActiveTab] = useState('info');
  const [projectUuid, setProjectUuid] = useState(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/login');
  };

  const handleProjectCreated = (uuid) => {
    setProjectUuid(uuid);
    // Optionally move to next tab
    setActiveTab('site');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'info':
        return <ProjectInformationForm onNext={handleProjectCreated} />;
      case 'site':
        return (
          <div>
            <h3>Site Information</h3>
            <p className={pageStyles.tabContentPlaceholder}>Site details form coming soon...</p>
          </div>
        );
      case 'electrical':
        return (
          <div>
            <h3>Electrical Information</h3>
            <p className={pageStyles.tabContentPlaceholder}>Electrical details form coming soon...</p>
          </div>
        );
      case 'structural':
        return (
          <div>
            <h3>Structural Information</h3>
            <p className={pageStyles.tabContentPlaceholder}>Structural details form coming soon...</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.projectContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>New Project</h1>
          <p>Create and manage solar installation projects</p>
        </div>

        <nav className={styles.topNav}>
          <Link to="/dashboard" className={styles.navLink}>Dashboard</Link>
          <Link to="/account" className={styles.navLink}>Account</Link>
          <Link to="/support" className={styles.navLink}>Support</Link>
          <Link to="/login" onClick={handleLogout} className={styles.navLink}>Logout</Link>
        </nav>
      </div>

      {/* Split Layout */}
      <div className={styles.splitLayout}>
        {/* Left Panel - Project Data Input (30%) */}
        <div className={styles.leftPanel}>
          {/* Tabs */}
          <div className={styles.tabsContainer}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <motion.div
            className={styles.tabContent}
            key={activeTab}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            {renderTabContent()}
          </motion.div>
        </div>

        {/* Right Panel - Photo Gallery (70%) */}
        <div className={styles.rightPanel}>
          <ProjectPhotoGallery projectUuid={projectUuid} />
        </div>
      </div>
    </div>
  );
};

export default ProjectAdd;
