import React from 'react';
import styles from './Breadcrumbs.module.css';

const Breadcrumbs = ({
  items = [],          // [{ label, href, onClick, icon }]
  separator = '/',
  maxItems,            // Collapse if more than this
  className = '',
}) => {
  const renderItems = () => {
    let displayItems = items;

    if (maxItems && items.length > maxItems) {
      const start = items.slice(0, 1);
      const end = items.slice(-Math.max(maxItems - 1, 1));
      displayItems = [...start, { collapsed: true }, ...end];
    }

    return displayItems.map((item, index) => {
      const isLast = index === displayItems.length - 1;

      if (item.collapsed) {
        return (
          <React.Fragment key="collapsed">
            <span className={styles.separator}>{separator}</span>
            <span className={styles.collapsed}>...</span>
          </React.Fragment>
        );
      }

      return (
        <React.Fragment key={index}>
          {index > 0 && <span className={styles.separator}>{separator}</span>}
          {isLast ? (
            <span className={styles.current}>
              {item.icon && <span className={styles.icon}>{item.icon}</span>}
              {item.label}
            </span>
          ) : item.href ? (
            <a href={item.href} className={styles.link}>
              {item.icon && <span className={styles.icon}>{item.icon}</span>}
              {item.label}
            </a>
          ) : item.onClick ? (
            <button onClick={item.onClick} className={styles.link}>
              {item.icon && <span className={styles.icon}>{item.icon}</span>}
              {item.label}
            </button>
          ) : (
            <span className={styles.item}>
              {item.icon && <span className={styles.icon}>{item.icon}</span>}
              {item.label}
            </span>
          )}
        </React.Fragment>
      );
    });
  };

  return (
    <nav aria-label="Breadcrumb" className={`${styles.breadcrumbs} ${className}`}>
      {renderItems()}
    </nav>
  );
};

export default Breadcrumbs;
