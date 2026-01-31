import React, { useState } from 'react';
import CompactTabs from '../common/CompactTabs';
import CollapsibleSection from '../ui/CollapsibleSection';
import { FORDJE_DEMO_DATA, getItemsByCategory } from '../../data/fordjeTempData';
import styles from './FordjePanel.module.css';

/**
 * FordjePanel - Display AHJ and Utility data from Fordje
 *
 * DEMO COMPONENT - Static data display for meeting presentation
 * No API integration, just renders temp data in organized sections
 */
const FordjePanel = ({ projectUuid, projectData }) => {
  const [activeDataType, setActiveDataType] = useState('ahj');

  // Get current data based on active tab
  const currentData = activeDataType === 'ahj' ? FORDJE_DEMO_DATA.ahj : FORDJE_DEMO_DATA.utility;

  // Group items by category
  const groupedItems = getItemsByCategory(currentData.items);

  // Get unique categories in order they appear
  const categories = Object.keys(groupedItems);

  return (
    <div className={styles.container}>
      {/* Header with location info */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h2 className={styles.title}>Fordje Data</h2>
          <p className={styles.subtitle}>
            Authority Having Jurisdiction & Utility Requirements
          </p>
        </div>
        <div className={styles.locationBadge}>
          {currentData.name}, {currentData.state}
        </div>
      </div>

      {/* Sub-tabs for AHJ / Utility */}
      <CompactTabs
        tabs={[
          { id: 'ahj', label: 'AHJ' },
          { id: 'utility', label: 'Utility' }
        ]}
        defaultTab="ahj"
        activeTab={activeDataType}
        onTabChange={setActiveDataType}
        tabContent={{
          ahj: (
            <div className={styles.dataSection}>
              {categories.map((category) => (
                <CollapsibleSection
                  key={category}
                  title={category}
                  initiallyExpanded={true}
                >
                  <div className={styles.itemsList}>
                    {groupedItems[category].map((item, idx) => (
                      <div key={idx} className={styles.item}>
                        <div className={styles.itemName}>{item.name}</div>
                        <div className={styles.itemValue}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              ))}

              {/* Demo Notice */}
              <div className={styles.demoNotice}>
                <span className={styles.demoIcon}>ℹ️</span>
                <span className={styles.demoText}>
                  Demo data shown for presentation purposes. API integration coming soon.
                </span>
              </div>
            </div>
          ),
          utility: (
            <div className={styles.dataSection}>
              {categories.map((category) => (
                <CollapsibleSection
                  key={category}
                  title={category}
                  initiallyExpanded={true}
                >
                  <div className={styles.itemsList}>
                    {groupedItems[category].map((item, idx) => (
                      <div key={idx} className={styles.item}>
                        <div className={styles.itemName}>{item.name}</div>
                        <div className={styles.itemValue}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              ))}

              {/* Demo Notice */}
              <div className={styles.demoNotice}>
                <span className={styles.demoIcon}>ℹ️</span>
                <span className={styles.demoText}>
                  Demo data shown for presentation purposes. API integration coming soon.
                </span>
              </div>
            </div>
          )
        }}
      />
    </div>
  );
};

export default FordjePanel;
