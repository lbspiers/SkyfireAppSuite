import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import DrafterSidebar from './DrafterSidebar';
import DrafterMobileHeader from './DrafterMobileHeader';
import styles from './DrafterPortalLayout.module.css';

const DrafterPortalLayout = () => {
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('drafterSidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Persist sidebar collapse state to localStorage
  useEffect(() => {
    localStorage.setItem('drafterSidebarCollapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className={styles.layout}>
      {/* Mobile Header */}
      <DrafterMobileHeader onMenuToggle={toggleMobileMenu} isMenuOpen={isMobileMenuOpen} />

      {/* Sidebar */}
      <DrafterSidebar
        collapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content */}
      <main className={`${styles.main} ${isSidebarCollapsed ? styles.mainCollapsed : ''}`}>
        <Outlet />
      </main>
    </div>
  );
};

export default DrafterPortalLayout;
