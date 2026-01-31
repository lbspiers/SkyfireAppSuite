import React from 'react';
import { Link } from 'react-router-dom';
import styles from './PortalNavigationPill.module.css';

const PortalNavigationPill = ({ to, children, isActive = false }) => (
  <Link
    to={to}
    className={`${styles.pill} ${isActive ? styles.active : ''}`}
  >
    {children}
  </Link>
);

export default PortalNavigationPill;
