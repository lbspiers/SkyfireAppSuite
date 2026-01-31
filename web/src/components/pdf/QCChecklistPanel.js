import React, { useState, useEffect } from 'react';
import { qcSitePlanChecklist, getSitePlanChecklistTotal } from '../../data/qcSitePlanChecklist';
import { qcDesignChecklist, getDesignChecklistTotal } from '../../data/qcDesignChecklist';
import styles from './QCChecklistPanel.module.css';

/**
 * QCChecklistPanel - Dual QC checklist for solar PV plan sets
 *
 * Features:
 * - Site Plan QC (~85 items) - physical layout, structural, mounting
 * - Design QC (~95 items) - electrical, calculations, documentation
 * - Collapsible sections and subsections
 * - Progress tracking with percentage
 * - Session-based state persistence
 * - Visual feedback for completed items
 * - Reset functionality
 */
const QCChecklistPanel = React.forwardRef(({ isOpen, onClose, projectId, checklistType = 'site', onProgressChange }, ref) => {
  const [checkedItems, setCheckedItems] = useState({});
  const [expandedSections, setExpandedSections] = useState({});
  const [expandedSubsections, setExpandedSubsections] = useState({});

  // Expose reset function to parent via ref
  React.useImperativeHandle(ref, () => ({
    reset: () => {
      setCheckedItems({});
    }
  }));

  // Select the appropriate checklist based on type
  const checklist = checklistType === 'site' ? qcSitePlanChecklist : qcDesignChecklist;
  const totalItems = checklistType === 'site' ? getSitePlanChecklistTotal() : getDesignChecklistTotal();
  const title = checklistType === 'site' ? 'Site Plan QC' : 'Design QC';
  const accentColor = checklistType === 'site' ? 'var(--color-success)' : 'var(--color-info)'; // Green for site, Blue for design

  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const progressPercent = Math.round((checkedCount / totalItems) * 100);

  // Notify parent of progress changes
  React.useEffect(() => {
    if (onProgressChange) {
      onProgressChange(progressPercent);
    }
  }, [progressPercent, onProgressChange]);

  // Toggle checkbox
  const toggleItem = (itemId) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  // Toggle section expand/collapse
  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Toggle subsection expand/collapse
  const toggleSubsection = (subsectionId) => {
    setExpandedSubsections(prev => ({
      ...prev,
      [subsectionId]: !prev[subsectionId]
    }));
  };

  // Initialize all sections as collapsed - re-initialize when checklist type changes
  useEffect(() => {
    const sections = {};
    const subsections = {};
    checklist.forEach(section => {
      sections[section.id] = false;
      section.subsections.forEach(sub => {
        subsections[sub.id] = false;
      });
    });
    setExpandedSections(sections);
    setExpandedSubsections(subsections);
    // Reset checked items when switching checklist type
    setCheckedItems({});
  }, [checklistType]);

  if (!isOpen) return null;

  return (
    <div className={styles.container}>
      {/* Progress Bar - Compact Header */}
      <div className={styles.progressHeader}>
        <div className={styles.progressStats}>
          <span className={styles.progressCount}>
            {checkedCount} / {totalItems} Complete
          </span>
          <span className={`${styles.progressPercent} ${
            progressPercent === 100
              ? styles.progressPercentComplete
              : checklistType === 'site'
                ? styles.progressPercentSite
                : styles.progressPercentDesign
          }`}>
            {progressPercent}%
          </span>
        </div>
        <div className={styles.progressBar}>
          <div
            className={`${styles.progressFill} ${
              progressPercent === 100
                ? styles.progressFillComplete
                : checklistType === 'site'
                  ? styles.progressFillSite
                  : styles.progressFillDesign
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Checklist */}
      <div className={styles.checklistContainer}>
        {checklist.map(section => {
          const sectionExpanded = expandedSections[section.id];

          // Count checked items in this section
          let sectionTotal = 0;
          let sectionChecked = 0;
          section.subsections.forEach(sub => {
            sub.items.forEach(item => {
              sectionTotal++;
              if (checkedItems[item.id]) sectionChecked++;
            });
          });

          return (
            <div key={section.id} className={styles.section}>
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className={styles.sectionHeader}
              >
                <div className={styles.sectionHeaderContent}>
                  <span className={`${styles.sectionArrow} ${
                    sectionExpanded ? styles.sectionArrowExpanded : styles.sectionArrowCollapsed
                  } ${
                    checklistType === 'site' ? styles.sectionArrowSite : styles.sectionArrowDesign
                  }`}>
                    ▼
                  </span>
                  {section.title}
                </div>
                <span className={`${styles.sectionCount} ${
                  sectionChecked === sectionTotal ? styles.sectionCountComplete : styles.sectionCountIncomplete
                }`}>
                  {sectionChecked}/{sectionTotal}
                </span>
              </button>

              {/* Subsections */}
              {sectionExpanded && (
                <div className={styles.subsectionsContainer}>
                  {section.subsections.map(subsection => {
                    const subExpanded = expandedSubsections[subsection.id];

                    // Count checked in subsection
                    const subChecked = subsection.items.filter(item => checkedItems[item.id]).length;

                    return (
                      <div key={subsection.id} className={styles.subsection}>
                        {/* Subsection Header */}
                        <button
                          onClick={() => toggleSubsection(subsection.id)}
                          className={styles.subsectionHeader}
                        >
                          <div className={styles.subsectionHeaderContent}>
                            <span className={`${styles.subsectionArrow} ${
                              subExpanded ? styles.subsectionArrowExpanded : styles.subsectionArrowCollapsed
                            }`}>
                              ▼
                            </span>
                            {subsection.title}
                          </div>
                          <span className={`${styles.subsectionCount} ${
                            subChecked === subsection.items.length ? styles.subsectionCountComplete : styles.subsectionCountIncomplete
                          }`}>
                            {subChecked}/{subsection.items.length}
                          </span>
                        </button>

                        {/* Checklist Items */}
                        {subExpanded && (
                          <div className={styles.itemsContainer}>
                            {subsection.items.map(item => (
                              <label
                                key={item.id}
                                className={`${styles.itemLabel} ${
                                  checkedItems[item.id] ? styles.itemLabelChecked : styles.itemLabelUnchecked
                                }`}
                                onMouseEnter={(e) => {
                                  if (!checkedItems[item.id]) {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = checkedItems[item.id]
                                    ? 'rgba(16, 185, 129, 0.1)'
                                    : 'transparent';
                                }}
                              >
                                {/* Custom Checkbox */}
                                <div
                                  onClick={() => toggleItem(item.id)}
                                  className={`${styles.checkbox} ${
                                    checkedItems[item.id] ? styles.checkboxChecked : styles.checkboxUnchecked
                                  }`}
                                >
                                  {checkedItems[item.id] && (
                                    <span className={styles.checkmark}>✓</span>
                                  )}
                                </div>

                                <div className={styles.itemContent}>
                                  <div className={`${styles.itemText} ${
                                    checkedItems[item.id] ? styles.itemTextChecked : styles.itemTextUnchecked
                                  }`}>
                                    {item.label}
                                  </div>
                                  <div className={styles.itemDetail}>
                                    {item.detail}
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

QCChecklistPanel.displayName = 'QCChecklistPanel';

export default QCChecklistPanel;
