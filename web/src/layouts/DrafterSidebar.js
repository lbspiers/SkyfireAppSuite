import { NavLink } from 'react-router-dom';
import { Home, DollarSign, Trophy, User, HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Tooltip } from '../components/ui';
import styles from './DrafterSidebar.module.css';

const DrafterSidebar = ({ collapsed, onToggleCollapse, isMobileMenuOpen, onCloseMobile }) => {
  const navItems = [
    { path: '/drafter-portal', label: 'Dashboard', icon: Home, exact: true },
    { path: '/drafter-portal/earnings', label: 'Earnings', icon: DollarSign },
    { path: '/drafter-portal/achievements', label: 'Achievements', icon: Trophy },
    { path: '/drafter-portal/profile', label: 'Profile', icon: User },
    { path: '/drafter-portal/help', label: 'Help & Support', icon: HelpCircle }
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className={styles.mobileOverlay} onClick={onCloseMobile} />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''} ${isMobileMenuOpen ? styles.mobileOpen : ''}`}>
        {/* Logo Section */}
        <div className={styles.logoSection}>
          {!collapsed && (
            <div className={styles.logo}>
              <span className={styles.logoIcon}>🔥</span>
              <span className={styles.logoText}>Skyfire</span>
            </div>
          )}
          {collapsed && (
            <div className={styles.logoCollapsed}>
              <span className={styles.logoIcon}>🔥</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const navLink = (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.navItemActive : ''} ${collapsed ? styles.navItemCollapsed : ''}`
                }
                onClick={onCloseMobile}
              >
                <Icon className={styles.navIcon} size={20} />
                {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
              </NavLink>
            );

            // Wrap in tooltip when collapsed
            if (collapsed) {
              return (
                <Tooltip key={item.path} content={item.label} position="right">
                  {navLink}
                </Tooltip>
              );
            }

            return navLink;
          })}
        </nav>

        {/* Collapse Toggle (Desktop Only) */}
        <button
          className={styles.collapseToggle}
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </aside>
    </>
  );
};

export default DrafterSidebar;
