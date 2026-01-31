import React, { useState } from 'react';
import styles from './Alert.module.css';
import flameIcon from '../../assets/images/Skyfire Flame Icon.png';

const ICONS = {
  success: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-5l5-5-1.4-1.4L9 10.2 7.4 8.6 6 10l3 3z" fill="currentColor"/>
    </svg>
  ),
  error: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 9V5h2v4H9zm0 4v-2h2v2H9z" fill="currentColor"/>
    </svg>
  ),
  warning: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 2L1 18h18L10 2zm0 4l6.5 11h-13L10 6zm-1 4v3h2v-3H9zm0 5v2h2v-2H9z" fill="currentColor"/>
    </svg>
  ),
  info: (
    <img
      src={flameIcon}
      alt=""
      className={styles.flameIcon}
    />
  ),
};

const Alert = ({
  variant = 'info',  // success, error, warning, info
  title,
  children,
  icon,              // Override default icon
  dismissible = false,
  onDismiss,
  action,            // React node for action button
  className = '',
  collapsible = true, // New prop to enable/disable collapse functionality
}) => {
  const [dismissed, setDismissed] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) onDismiss();
  };

  const handleToggleCollapse = () => {
    if (collapsible) {
      setIsCollapsed(!isCollapsed);
    }
  };

  // Extract the label before the colon from children
  const getCollapsedLabel = () => {
    // Handle direct children array (most common case)
    const childrenArray = React.Children.toArray(children);

    // Look for a strong tag in the children
    for (const child of childrenArray) {
      if (React.isValidElement(child) && child.type === 'strong') {
        const text = child.props.children;
        if (typeof text === 'string') {
          // Remove colon and return label
          const label = text.replace(':', '').trim();
          return `${label} Note`;
        }
      }
    }

    // Fallback: check if children is a string
    if (typeof children === 'string') {
      const match = children.match(/^([^:]+):/);
      if (match) {
        return `${match[1].trim()} Note`;
      }
    }

    return 'Note';
  };

  if (dismissed) return null;

  const displayIcon = icon !== undefined ? icon : ICONS[variant];

  return (
    <div
      className={`${styles.alert} ${styles[variant]} ${isCollapsed ? styles.collapsed : ''} ${collapsible ? styles.alertClickable : styles.alertDefault} ${className}`}
      role="alert"
      onClick={handleToggleCollapse}
    >
      {displayIcon && <div className={styles.icon}>{displayIcon}</div>}

      <div className={styles.content}>
        {isCollapsed ? (
          <div className={styles.collapsedLabel}>{getCollapsedLabel()}</div>
        ) : (
          <>
            {title && <div className={styles.title}>{title}</div>}
            {children && <div className={styles.message}>{children}</div>}
          </>
        )}
      </div>

      {action && !isCollapsed && <div className={styles.action}>{action}</div>}

      {dismissible && !isCollapsed && (
        <button
          className={styles.dismiss}
          onClick={(e) => {
            e.stopPropagation();
            handleDismiss();
          }}
          aria-label="Dismiss alert"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      )}
    </div>
  );
};

export default Alert;
