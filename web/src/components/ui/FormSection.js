import React, { useState } from 'react';
import styles from './FormSection.module.css';

const FormSection = ({
  title,
  children,
  collapsible = false,
  defaultCollapsed = false,
  onClear,
  clearLabel = 'Clear',
  badge,
  className = '',
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <div className={`${styles.section} ${className}`}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          {collapsible && (
            <button
              className={styles.collapseBtn}
              onClick={() => setIsCollapsed(!isCollapsed)}
              aria-expanded={!isCollapsed}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className={`${styles.chevron} ${isCollapsed ? styles.collapsed : ''}`}
              >
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          )}
          <h3 className={styles.title}>{title}</h3>
          {badge !== undefined && <span className={styles.badge}>{badge}</span>}
        </div>

        {onClear && (
          <button className={styles.clearBtn} onClick={onClear}>
            {clearLabel}
          </button>
        )}
      </div>

      {(!collapsible || !isCollapsed) && (
        <div className={styles.content}>
          {children}
        </div>
      )}
    </div>
  );
};

export default FormSection;
