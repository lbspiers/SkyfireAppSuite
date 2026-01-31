/**
 * InlineBOSSection Component
 *
 * Renders inline BOS (Balance of System) equipment sections that appear
 * directly after major equipment components (String Combiner, Battery, Backup Panel, SMS).
 *
 * Features:
 * - Collapsible accordion UI for each BOS slot
 * - Auto-sets trigger and block name based on section type
 * - Supports utility-specific equipment translations
 * - Handles cascade clearing (type → make → model)
 * - Optional NEC 1.25× amp rating filtering
 *
 * Props:
 * @param {string} section - BOS section type: 'utility' | 'battery1' | 'battery2' | 'backup' | 'postSMS'
 * @param {number} systemNumber - System number (1-4)
 * @param {number} maxSlots - Maximum number of BOS slots (3 or 6)
 * @param {object} projectData - Full project data object
 * @param {function} updateProject - Project update callback
 * @param {string} utility - Utility abbreviation (e.g., 'APS', 'SRP', 'TEP')
 * @param {number} necMinAmpRating - Optional minimum amp rating for NEC 1.25× filtering
 */

import React, { useState, useMemo } from 'react';
import BOSSlot from './BOSSlot';
import styles from './InlineBOS.module.css';

const InlineBOSSection = ({
  section,
  systemNumber,
  maxSlots,
  projectData,
  updateProject,
  utility,
  maxContinuousOutputAmps = null,
  loadingMaxOutput = false,
}) => {
  const [expandedSlots, setExpandedSlots] = useState(new Set());

  // Get trigger value and block name based on section type
  const { trigger, blockName } = useMemo(() => {
    const configs = {
      utility: {
        trigger: `sys${systemNumber}_stringCombiner`,
        blockName: 'PRE COMBINE',
      },
      battery1: {
        trigger: `sys${systemNumber}_battery1`,
        blockName: 'ESS',
      },
      battery2: {
        trigger: `sys${systemNumber}_battery2`,
        blockName: 'ESS',
      },
      backup: {
        trigger: `sys${systemNumber}_backup`,
        blockName: 'BACKUP LOAD SUB PANEL',
      },
      postSMS: {
        trigger: `sys${systemNumber}_postSMS`,
        blockName: 'POST SMS',
      },
    };
    return configs[section] || { trigger: '', blockName: '' };
  }, [section, systemNumber]);

  // Determine field prefix based on section type
  const fieldPrefix = useMemo(() => {
    // Battery sections use 'battery1' as prefix for both battery1 and battery2
    if (section === 'battery1' || section === 'battery2') {
      return `bos_sys${systemNumber}_battery1`;
    }

    // Utility section uses 'utility' prefix
    if (section === 'utility') {
      return `bos_sys${systemNumber}_utility`;
    }

    // Backup section uses 'backup' prefix
    if (section === 'backup') {
      return `bos_sys${systemNumber}_backup`;
    }

    // Post-SMS section uses 'postSMS' prefix
    if (section === 'postSMS') {
      return `bos_sys${systemNumber}_postSMS`;
    }

    return `bos_sys${systemNumber}_${section}`;
  }, [section, systemNumber]);

  // Get populated slots by checking which slots have equipment_type filled
  const populatedSlots = useMemo(() => {
    const slots = [];
    for (let i = 1; i <= maxSlots; i++) {
      const equipmentType = projectData[`${fieldPrefix}_type${i}_equipment_type`];
      if (equipmentType) {
        slots.push({
          slotNumber: i,
          equipmentType,
          make: projectData[`${fieldPrefix}_type${i}_make`] || '',
          model: projectData[`${fieldPrefix}_type${i}_model`] || '',
          ampRating: projectData[`${fieldPrefix}_type${i}_amp_rating`] || '',
          isNew: projectData[`${fieldPrefix}_type${i}_is_new`] !== false,
        });
      }
    }
    return slots;
  }, [projectData, fieldPrefix, maxSlots]);

  // Toggle slot expansion
  const toggleSlot = (slotNumber) => {
    setExpandedSlots((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(slotNumber)) {
        newSet.delete(slotNumber);
      } else {
        newSet.add(slotNumber);
      }
      return newSet;
    });
  };

  // Add new BOS equipment
  const handleAddEquipment = (slotNumber, equipmentData) => {
    const prefix = `${fieldPrefix}_type${slotNumber}`;

    // Set all fields
    updateProject(`${prefix}_equipment_type`, equipmentData.equipmentType);
    updateProject(`${prefix}_make`, equipmentData.make);
    updateProject(`${prefix}_model`, equipmentData.model);
    updateProject(`${prefix}_amp_rating`, equipmentData.ampRating);
    updateProject(`${prefix}_is_new`, equipmentData.isNew);
    updateProject(`${prefix}_trigger`, trigger);
    updateProject(`${prefix}_block_name`, blockName);

    // Collapse the slot after adding
    setExpandedSlots((prev) => {
      const newSet = new Set(prev);
      newSet.delete(slotNumber);
      return newSet;
    });
  };

  // Update existing BOS equipment
  const handleUpdateEquipment = (slotNumber, equipmentData) => {
    const prefix = `${fieldPrefix}_type${slotNumber}`;

    // Update all fields
    updateProject(`${prefix}_equipment_type`, equipmentData.equipmentType);
    updateProject(`${prefix}_make`, equipmentData.make);
    updateProject(`${prefix}_model`, equipmentData.model);
    updateProject(`${prefix}_amp_rating`, equipmentData.ampRating);
    updateProject(`${prefix}_is_new`, equipmentData.isNew);
    updateProject(`${prefix}_trigger`, trigger);
    updateProject(`${prefix}_block_name`, blockName);
  };

  // Delete BOS equipment
  const handleDeleteEquipment = (slotNumber) => {
    // Confirm deletion
    const confirmDelete = window.confirm(
      `Are you sure you want to delete BOS Type ${slotNumber}?`
    );

    if (confirmDelete) {
      const prefix = `${fieldPrefix}_type${slotNumber}`;

      // Clear all fields
      updateProject(`${prefix}_equipment_type`, '');
      updateProject(`${prefix}_make`, '');
      updateProject(`${prefix}_model`, '');
      updateProject(`${prefix}_amp_rating`, '');
      updateProject(`${prefix}_is_new`, true);
      updateProject(`${prefix}_trigger`, null);
      updateProject(`${prefix}_block_name`, '');

      // Remove from expanded slots
      setExpandedSlots((prev) => {
        const newSet = new Set(prev);
        newSet.delete(slotNumber);
        return newSet;
      });
    }
  };

  // Render all slots (1 to maxSlots)
  const renderSlots = () => {
    const slots = [];

    for (let slotNum = 1; slotNum <= maxSlots; slotNum++) {
      // Find existing data for this slot
      const slotData = populatedSlots.find((slot) => slot.slotNumber === slotNum);

      slots.push(
        <BOSSlot
          key={slotNum}
          slotNumber={slotNum}
          isPopulated={!!slotData}
          isExpanded={expandedSlots.has(slotNum)}
          equipmentData={slotData || null}
          onToggle={() => toggleSlot(slotNum)}
          onAdd={(data) => handleAddEquipment(slotNum, data)}
          onUpdate={(data) => handleUpdateEquipment(slotNum, data)}
          onDelete={() => handleDeleteEquipment(slotNum)}
          utility={utility}
          maxContinuousOutputAmps={maxContinuousOutputAmps}
          loadingMaxOutput={loadingMaxOutput}
          section={section}
          fieldPrefix={fieldPrefix}
        />
      );
    }

    return slots;
  };

  // Don't render if no trigger value (section not active)
  if (!trigger) {
    return null;
  }

  return (
    <div className={styles.inlineBOSSection}>
      <div className={styles.sectionHeader}>
        <h4 className={styles.sectionTitle}>
          {blockName} BOS Equipment
        </h4>
        <span className={styles.slotCount}>
          {populatedSlots.length} / {maxSlots} slots filled
        </span>
      </div>

      <div className={styles.slotsContainer}>
        {renderSlots()}
      </div>
    </div>
  );
};

export default InlineBOSSection;
