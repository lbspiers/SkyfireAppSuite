import React, { useState, useMemo } from 'react';
import useBOSData from '../../../hooks/useBOSData';
import { shouldShowBOSSection } from '../../../utils/bosTriggerUtils';
import { BOS_FIELD_PATTERNS } from '../../../constants/bosFieldPatterns';
import EquipmentRow from '../../ui/EquipmentRow';
import BOSEquipmentModal from './BOSEquipmentModal';
import LoadingSpinner from '../../ui/LoadingSpinner';
import ConfirmDialog from '../../ui/ConfirmDialog';
import styles from './BOSPanel.module.css';

// Icons
const BoltIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
    <path d="M5.52.359A.5.5 0 0 1 6 0h4a.5.5 0 0 1 .474.658L8.694 6H12.5a.5.5 0 0 1 .395.807l-7 9a.5.5 0 0 1-.873-.454L6.823 9.5H3.5a.5.5 0 0 1-.48-.641l2.5-8.5z"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2z"/>
  </svg>
);

// ============================================
// HELPER: Get trigger equipment as individual items
// ============================================

const getTriggerEquipment = (section, triggers) => {
  if (!triggers) return [];
  const items = [];

  switch (section) {
    case 'utility':
      // Solar Panel
      if (triggers.solarPanel?.present) {
        items.push({
          label: 'Solar Panel',
          quantity: triggers.solarPanel.quantity,
          make: triggers.solarPanel.make,
          model: triggers.solarPanel.model,
          isNew: triggers.solarPanel.isNew,
        });
      }
      // Inverter/Microinverter
      if (triggers.inverter?.present) {
        items.push({
          label: triggers.inverter.type === 'microinverter' ? 'Microinverter' : 'Inverter',
          quantity: triggers.inverter.quantity,
          make: triggers.inverter.make,
          model: triggers.inverter.model,
          isNew: triggers.inverter.isNew,
        });
      }
      // String Combiner
      if (triggers.stringCombiner?.present) {
        items.push({
          label: 'String Combiner',
          quantity: null,
          make: triggers.stringCombiner.make,
          model: triggers.stringCombiner.model,
          isNew: triggers.stringCombiner.isNew,
        });
      }
      break;

    case 'battery1':
      if (triggers.battery1?.present) {
        items.push({
          label: 'Battery (Type 1)',
          quantity: triggers.battery1.quantity,
          make: triggers.battery1.make,
          model: triggers.battery1.model,
          isNew: triggers.battery1.isNew,
        });
      }
      break;

    case 'battery2':
      if (triggers.battery2?.present) {
        items.push({
          label: 'Battery (Type 2)',
          quantity: triggers.battery2.quantity,
          make: triggers.battery2.make,
          model: triggers.battery2.model,
          isNew: triggers.battery2.isNew,
        });
      }
      break;

    case 'backup':
      if (triggers.backupPanel?.present) {
        items.push({
          label: 'Backup Panel',
          quantity: null,
          make: triggers.backupPanel.make,
          model: triggers.backupPanel.model,
          isNew: triggers.backupPanel.isNew,
        });
      }
      break;

    case 'postSMS':
      if (triggers.sms?.present) {
        items.push({
          label: 'SMS',
          quantity: null,
          make: triggers.sms.make,
          model: triggers.sms.model,
          isNew: triggers.sms.isNew,
        });
      }
      break;

    default:
      break;
  }

  return items;
};

// ============================================
// MAIN COMPONENT
// ============================================

const BOSPanel = ({
  projectUuid,
  systemNumber = 1,
  formData = {},
  projectData = {},
  onNavigateToTab,
  maxContinuousOutputAmps = null,
  batteryMaxContinuousOutputAmps = null,
  postSMSMinAmpFilter = null,
  loadingMaxOutput = false,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [activeSection, setActiveSection] = useState(null);
  const [deletingSlot, setDeletingSlot] = useState(null);
  const [expandedSlots, setExpandedSlots] = useState({});
  const [isAutoPopulating, setIsAutoPopulating] = useState(false);
  const [autoPopulateResult, setAutoPopulateResult] = useState(null);

  // Extract utility from projectData.site (the correct source!)
  const utilityName = projectData?.site?.utility || null;

  // Extract zip code from projectData.site
  const zipCode = projectData?.site?.zip || null;

  const {
    loading,
    saving,
    error,
    triggerEquipment,
    systems,
    equipmentCatalog,
    addEquipment,
    updateSlot,
    removeEquipment,
    calculateMinAmp,
    findEquipment,
    refresh,
    autoPopulateBOS,
    canAutoPopulate,
  } = useBOSData({ projectUuid });

  const systemTriggers = triggerEquipment[systemNumber];
  const systemBOS = systems[systemNumber];

  // Always show all BOS sections for manual entry
  const visibleSections = useMemo(() => {
    return ['utility', 'battery1', 'battery2', 'backup', 'postSMS'];
  }, []);

  // Helper: Get the appropriate maxContinuousOutputAmps for a given section
  const getMaxOutputForSection = (section) => {
    switch (section) {
      case 'utility':
        return maxContinuousOutputAmps;
      case 'battery1':
      case 'battery2':
        return batteryMaxContinuousOutputAmps;
      case 'postSMS':
      case 'backup':
        return postSMSMinAmpFilter;
      default:
        return null;
    }
  };

  const autoPopulateStatus = useMemo(
    () => canAutoPopulate(systemNumber, utilityName),
    [canAutoPopulate, systemNumber, utilityName]
  );

  // Toggle slot expansion
  const toggleSlot = (slotKey) => {
    setExpandedSlots(prev => ({ ...prev, [slotKey]: !prev[slotKey] }));
  };

  const handleAddClick = (section) => {
    setActiveSection(section);
    setEditingSlot(null);
    setShowModal(true);
  };

  const handleEditClick = (slot) => {
    setActiveSection(slot.section);
    setEditingSlot(slot);
    setShowModal(true);
  };

  const handleDeleteClick = (slot) => {
    setDeletingSlot(slot);
  };

  const handleModalSave = async (equipmentData) => {
    try {
      if (editingSlot) {
        await updateSlot(editingSlot, equipmentData);
      } else {
        await addEquipment(activeSection, systemNumber, equipmentData);
      }
      setShowModal(false);
      setEditingSlot(null);
      setActiveSection(null);
    } catch (err) {
      console.error('Failed to save:', err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deletingSlot) {
      try {
        await removeEquipment(deletingSlot);
      } catch (err) {
        console.error('Failed:', err);
      }
    }
    setDeletingSlot(null);
  };

  const handleCameraClick = (slot) => {
    if (onNavigateToTab) {
      onNavigateToTab('survey', 'photos');
    }
  };

  const handleAutoPopulate = async () => {
    setIsAutoPopulating(true);
    setAutoPopulateResult(null);

    try {
      const { added, errors } = await autoPopulateBOS(systemNumber, utilityName);
      setAutoPopulateResult({
        success: errors.length === 0,
        added,
        message: added > 0 ? `Added ${added}` : 'All set',
      });
      setTimeout(() => setAutoPopulateResult(null), 3000);
    } catch (err) {
      setAutoPopulateResult({ success: false, message: 'Failed' });
    } finally {
      setIsAutoPopulating(false);
    }
  };

  const getSlotsForSection = (section) => {
    const map = {
      utility: 'utilitySlots',
      battery1: 'battery1Slots',
      battery2: 'battery2Slots',
      backup: 'backupSlots',
      postSMS: 'postSMSSlots',
    };
    return systemBOS?.[map[section]] || [];
  };

  if (loading) {
    return (
      <div className={styles.centered}>
        <LoadingSpinner size="medium" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.centered}>
        <p className={styles.error}>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Utility Bar - Now properly displays utility from projectData */}
      <div className={styles.utilityBar}>
        <div className={styles.utilityInfo}>
          <span className={styles.utilityLabel}>Utility:</span>
          <span className={styles.utilityValue}>{utilityName || 'Not selected'}</span>
          {zipCode && (
            <>
              <span className={styles.utilityLabel} style={{ marginLeft: '16px' }}>Zip:</span>
              <span className={styles.utilityValue}>{zipCode}</span>
            </>
          )}
        </div>

        {autoPopulateResult ? (
          <span className={autoPopulateResult.success ? styles.successBadge : styles.errorBadge}>
            {autoPopulateResult.message}
          </span>
        ) : autoPopulateStatus.canPopulate ? (
          <button className={styles.autoBtn} onClick={handleAutoPopulate} disabled={isAutoPopulating}>
            {isAutoPopulating ? <span className={styles.spinner} /> : <BoltIcon />}
            <span>{isAutoPopulating ? 'Adding...' : `Add Required (${autoPopulateStatus.count})`}</span>
          </button>
        ) : utilityName ? (
          <span className={styles.allSet}>All requirements met</span>
        ) : null}
      </div>

      {/* BOS Equipment List with Section Headers */}
      <div className={styles.equipmentList}>
        {visibleSections.map(section => {
          const pattern = BOS_FIELD_PATTERNS[section];
          const slots = getSlotsForSection(section);

          // Section labels
          const sectionLabels = {
            utility: 'Utility BOS',
            battery1: 'Battery Type 1 BOS',
            battery2: 'Battery Type 2 BOS',
            backup: 'Backup BOS',
            postSMS: 'Post-SMS BOS',
          };

          return (
            <div key={section} className={styles.bosSection}>
              {/* Section Header */}
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>{sectionLabels[section]}</h3>
                <span className={styles.slotCount}>
                  {slots.length}/{pattern.maxSlots}
                </span>
              </div>

              {/* BOS Slots - Each is an EquipmentRow */}
              {slots.map(slot => {
                const slotKey = `${slot.fieldPrefix}-${slot.slotNumber}`;
                const isExpanded = expandedSlots[slotKey] || false;

                return (
                  <EquipmentRow
                    key={slotKey}
                    title={slot.equipment_type || 'BOS Equipment'}
                    subtitle={`${slot.make || ''} ${slot.model || ''}`.trim() || undefined}
                    badge={slot.amp_rating}
                    isComplete={!!(slot.make && slot.model)}
                    expanded={isExpanded}
                    onToggle={() => toggleSlot(slotKey)}
                    fields={[
                      { label: 'Type', value: slot.equipment_type },
                      { label: 'Make', value: slot.make },
                      { label: 'Model', value: slot.model },
                      { label: 'Amp Rating', value: slot.amp_rating },
                      { label: 'Status', value: slot.isNew ? 'New' : 'Existing' },
                    ]}
                    onCamera={() => handleCameraClick(slot)}
                    onEdit={() => handleEditClick(slot)}
                    onDelete={() => handleDeleteClick(slot)}
                  />
                );
              })}

              {/* Add Button */}
              {slots.length < pattern.maxSlots && (
                <button type="button" className={styles.addBtn} onClick={() => handleAddClick(section)}>
                  <PlusIcon /> Add BOS Equipment
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <BOSEquipmentModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingSlot(null);
        }}
        onSave={handleModalSave}
        section={activeSection}
        systemNumber={systemNumber}
        existingSlot={editingSlot}
        equipmentCatalog={equipmentCatalog}
        findEquipment={findEquipment}
        calculateMinAmp={calculateMinAmp}
        triggerEquipment={systemTriggers}
        maxContinuousOutputAmps={getMaxOutputForSection(activeSection)}
        loadingMaxOutput={loadingMaxOutput}
      />

      <ConfirmDialog
        isOpen={!!deletingSlot}
        onClose={() => setDeletingSlot(null)}
        onConfirm={handleDeleteConfirm}
        title="Remove Equipment"
        message={deletingSlot ? `Remove ${deletingSlot.make} ${deletingSlot.model}?` : ''}
        confirmText="Remove"
        variant="danger"
      />
    </div>
  );
};

export default BOSPanel;
