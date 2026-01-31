import React, { useState } from 'react';
import styles from './SolarAPPEligibilitySection.module.css';

/**
 * SolarAPPEligibilitySection - Collapsible section showing field-by-field eligibility
 *
 * @param {string} title - Section title
 * @param {Array} fields - Array of field objects with status
 * @param {boolean} complete - Whether all fields in section are complete
 * @param {function} onNavigate - Callback when user clicks to navigate to a field
 * @param {node} children - Optional custom content to render instead of field list
 */
const SolarAPPEligibilitySection = ({
  title,
  fields = [],
  complete = false,
  onNavigate,
  children,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'complete':
        return <span className={styles.iconComplete}>✓</span>;
      case 'missing':
        return <span className={styles.iconMissing}>✕</span>;
      case 'warning':
        return <span className={styles.iconWarning}>⚠</span>;
      default:
        return <span className={styles.iconMissing}>?</span>;
    }
  };

  const handleFieldClick = (field) => {
    if (field.navigateTo && onNavigate) {
      onNavigate(field.navigateTo);
    }
  };

  return (
    <div className={styles.section}>
      <button
        className={`${styles.header} ${complete ? styles.headerComplete : styles.headerIncomplete}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className={styles.headerContent}>
          <span className={`${styles.arrow} ${isExpanded ? styles.arrowExpanded : ''}`}>
            ▼
          </span>
          <span className={styles.title}>{title}</span>
          {complete && <span className={styles.completeIcon}>✓</span>}
        </div>
        <span className={`${styles.count} ${complete ? styles.countComplete : ''}`}>
          {fields.filter(f => f.status === 'complete').length}/{fields.length}
        </span>
      </button>

      {isExpanded && (
        <div className={styles.content}>
          {children ? (
            // Render custom children (e.g., AttestationForm)
            children
          ) : (
            // Render default field list
            fields.map((field) => {
              const canNavigate = field.navigateTo && field.status !== 'complete';

              return (
                <div
                  key={field.key}
                  className={`${styles.field} ${canNavigate ? styles.fieldClickable : ''}`}
                  onClick={() => canNavigate && handleFieldClick(field)}
                >
                  <div className={styles.fieldMain}>
                    {getStatusIcon(field.status)}
                    <div className={styles.fieldInfo}>
                      <span className={styles.fieldLabel}>{field.label}</span>
                      {field.value && (
                        <span className={styles.fieldValue}>{field.value}</span>
                      )}
                      {field.message && (
                        <span className={styles.fieldMessage}>{field.message}</span>
                      )}
                    </div>
                  </div>
                  {canNavigate && (
                    <span className={styles.navigateIcon}>→</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default SolarAPPEligibilitySection;
