/**
 * BOSSlot Component
 *
 * Individual collapsible slot for BOS equipment.
 *
 * States:
 * - Empty: Shows "+ Add BOS Type N" button
 * - Populated (collapsed): Shows header with equipment summary and edit/delete icons
 * - Populated (expanded): Shows full equipment form for editing
 *
 * Features:
 * - Collapsible accordion behavior (initially expanded when created per mobile app confirmation)
 * - Equipment summary in header (Type, Make, Model, Amp Rating)
 * - Edit and delete icons
 * - Integration with BOSEquipmentForm
 */

import React from 'react';
import BOSEquipmentForm from './BOSEquipmentForm';
import styles from './InlineBOS.module.css';

const BOSSlot = ({
  slotNumber,
  isPopulated,
  isExpanded,
  equipmentData,
  onToggle,
  onAdd,
  onUpdate,
  onDelete,
  utility,
  maxContinuousOutputAmps,
  loadingMaxOutput,
  section,
  fieldPrefix,
}) => {
  // Render empty slot (shows "+ Add BOS Type N" button)
  if (!isPopulated) {
    return (
      <div className={styles.bosSlot}>
        <div className={styles.emptySlotContainer}>
          {isExpanded ? (
            // Show form when button clicked
            <div className={styles.slotContent}>
              <div className={styles.slotHeader} onClick={onToggle}>
                <span className={styles.slotLabel}>BOS Type {slotNumber}</span>
                <span className={styles.chevronIcon}>▲</span>
              </div>
              <div className={styles.slotFormContainer}>
                <BOSEquipmentForm
                  equipmentData={null}
                  onSave={onAdd}
                  onCancel={onToggle}
                  utility={utility}
                  maxContinuousOutputAmps={maxContinuousOutputAmps}
                  loadingMaxOutput={loadingMaxOutput}
                  section={section}
                />
              </div>
            </div>
          ) : (
            // Show "+ Add BOS Type N" button (initial state)
            <button
              type="button"
              className={styles.addBOSButton}
              onClick={onToggle}
            >
              <span className={styles.addIcon}>+</span>
              Add BOS Type {slotNumber}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Render populated slot
  const {
    equipmentType = '',
    make = '',
    model = '',
    ampRating = '',
  } = equipmentData;

  // Build equipment summary for header
  const buildSummary = () => {
    const parts = [];
    if (equipmentType) parts.push(equipmentType);
    if (make) parts.push(make);
    if (model) parts.push(model);
    if (ampRating) parts.push(`${ampRating}A`);

    return parts.length > 0 ? parts.join(' • ') : 'No equipment selected';
  };

  return (
    <div className={styles.bosSlot}>
      <div className={styles.populatedSlotContainer}>
        {/* Slot Header (always visible) */}
        <div
          className={`${styles.slotHeader} ${isExpanded ? styles.expanded : ''}`}
          onClick={onToggle}
        >
          <div className={styles.slotHeaderLeft}>
            <span className={styles.slotLabel}>BOS Type {slotNumber}</span>
            <span className={styles.slotSummary}>{buildSummary()}</span>
          </div>

          <div className={styles.slotHeaderRight}>
            {/* Edit icon */}
            <button
              type="button"
              className={styles.iconButton}
              onClick={(e) => {
                e.stopPropagation();
                if (!isExpanded) {
                  onToggle(); // Expand to edit
                }
              }}
              title="Edit"
            >
              ✏️
            </button>

            {/* Delete icon */}
            <button
              type="button"
              className={styles.iconButton}
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              title="Delete"
            >
              🗑️
            </button>

            {/* Chevron icon */}
            <span className={styles.chevronIcon}>
              {isExpanded ? '▲' : '▼'}
            </span>
          </div>
        </div>

        {/* Slot Form (expanded state) */}
        {isExpanded && (
          <div className={styles.slotFormContainer}>
            <BOSEquipmentForm
              equipmentData={equipmentData}
              onSave={onUpdate}
              onCancel={onToggle}
              utility={utility}
              maxContinuousOutputAmps={maxContinuousOutputAmps}
              loadingMaxOutput={loadingMaxOutput}
              section={section}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default BOSSlot;
