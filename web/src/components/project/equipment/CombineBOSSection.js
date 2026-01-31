/**
 * CombineBOSSection - Multi-System Combination BOS
 *
 * CRITICAL differences from other BOS types:
 * - NO system prefix (applies to all combined systems)
 * - NO _trigger field
 * - NO _active field
 * - Uses _existing instead of _is_new
 * - Has _position field
 * - Uses postcombine_{position}_{slot} pattern
 * - Only shows when 2+ active systems
 */

import React, { useState, useMemo } from 'react';
import { BOS_FIELD_PATTERNS } from '../../../constants/bosFieldPatterns';
import { getPopulatedSlots, getNextSlotNumber, buildSlotPayload, buildClearPayload } from '../../../utils/bosFieldUtils';
import EquipmentRow from '../../ui/EquipmentRow';
import BOSEquipmentModal from './BOSEquipmentModal';
import ConfirmDialog from '../../ui/ConfirmDialog';
import api from '../../../config/axios';
import logger from '../../../services/devLogger';
import styles from './CombineBOSSection.module.css';

const PlusIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2z"/>
  </svg>
);

const CombineBOSSection = ({
  projectUuid,
  systemDetails,
  activeSystemCount,
  onNavigateToTab,
  onRefresh,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [deletingSlot, setDeletingSlot] = useState(null);
  const [activePosition, setActivePosition] = useState(1);
  const [expandedSlots, setExpandedSlots] = useState({});
  const [saving, setSaving] = useState(false);

  const pattern = BOS_FIELD_PATTERNS.combine;

  // Extract all combine BOS slots organized by position
  const combineSlots = useMemo(() => {
    const result = { 1: [], 2: [], 3: [] };

    for (let pos = 1; pos <= pattern.maxPositions; pos++) {
      for (let slot = 1; slot <= pattern.maxSlotsPerPosition; slot++) {
        const prefix = `postcombine_${pos}_${slot}`;
        const equipmentType = systemDetails?.[`${prefix}_equipment_type`];

        if (equipmentType) {
          result[pos].push({
            fieldPrefix: prefix,
            position: pos,
            slotNumber: slot,
            section: 'combine',
            equipment_type: equipmentType,
            make: systemDetails?.[`${prefix}_make`],
            model: systemDetails?.[`${prefix}_model`],
            amp_rating: systemDetails?.[`${prefix}_amp_rating`],
            existing: systemDetails?.[`${prefix}_existing`],
            isNew: !systemDetails?.[`${prefix}_existing`],
          });
        }
      }
    }

    return result;
  }, [systemDetails, pattern]);

  // Position labels
  const positionLabels = useMemo(() => ({
    1: 'DER Disconnect',
    2: 'Meter',
    3: 'Utility Disconnect',
  }), []);

  const toggleSlot = (slotKey) => {
    setExpandedSlots(prev => ({ ...prev, [slotKey]: !prev[slotKey] }));
  };

  const handleAddClick = (position) => {
    setActivePosition(position);
    setEditingSlot(null);
    setShowModal(true);
  };

  const handleEditClick = (slot) => {
    setActivePosition(slot.position);
    setEditingSlot(slot);
    setShowModal(true);
  };

  const handleDeleteClick = (slot) => {
    setDeletingSlot(slot);
  };

  const handleModalSave = async (equipmentData) => {
    setSaving(true);

    try {
      // Find next available slot for the position
      let slotNumber = 1;
      if (!editingSlot) {
        const positionSlots = combineSlots[activePosition];
        slotNumber = positionSlots.length + 1;
        if (slotNumber > pattern.maxSlotsPerPosition) {
          logger.error('BOS', 'Position is full');
          return;
        }
      } else {
        slotNumber = editingSlot.slotNumber;
      }

      const prefix = `postcombine_${activePosition}_${slotNumber}`;
      const payload = {
        [`${prefix}_equipment_type`]: equipmentData.equipmentType,
        [`${prefix}_make`]: equipmentData.make,
        [`${prefix}_model`]: equipmentData.model,
        [`${prefix}_amp_rating`]: equipmentData.ampRating,
        [`${prefix}_existing`]: !equipmentData.isNew,
        [`${prefix}_position`]: 'POST COMBINE',
      };

      await api.patch(`/project/${projectUuid}/system-details`, payload);

      setShowModal(false);
      setEditingSlot(null);

      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      logger.error('BOS', 'Failed to save combine BOS:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deletingSlot) {
      setSaving(true);

      try {
        const prefix = deletingSlot.fieldPrefix;
        const payload = {
          [`${prefix}_equipment_type`]: null,
          [`${prefix}_make`]: null,
          [`${prefix}_model`]: null,
          [`${prefix}_amp_rating`]: null,
          [`${prefix}_existing`]: null,
          [`${prefix}_position`]: null,
        };

        await api.patch(`/project/${projectUuid}/system-details`, payload);

        if (onRefresh) {
          onRefresh();
        }
      } catch (err) {
        logger.error('BOS', 'Failed to delete combine BOS:', err);
      } finally {
        setSaving(false);
        setDeletingSlot(null);
      }
    }
  };

  const handleCameraClick = () => {
    if (onNavigateToTab) {
      onNavigateToTab('survey', 'photos');
    }
  };

  // Don't render if less than 2 active systems
  if (activeSystemCount < 2) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h3 className={styles.title}>Post-Combine BOS</h3>
          <span className={styles.subtitle}>
            Multi-system equipment ({activeSystemCount} systems combined)
          </span>
        </div>
      </div>

      {/* Position Sections */}
      {[1, 2, 3].map(position => {
        const slots = combineSlots[position];
        const isFull = slots.length >= pattern.maxSlotsPerPosition;

        return (
          <div key={position} className={styles.positionSection}>
            <div className={styles.positionHeader}>
              <span className={styles.positionLabel}>
                Position {position}: {positionLabels[position]}
              </span>
              <span className={styles.slotCount}>
                {slots.length}/{pattern.maxSlotsPerPosition}
              </span>
            </div>

            {/* Equipment Slots */}
            {slots.map(slot => {
              const slotKey = slot.fieldPrefix;
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
                    { label: 'Status', value: slot.existing ? 'Existing' : 'New' },
                  ]}
                  onCamera={handleCameraClick}
                  onEdit={() => handleEditClick(slot)}
                  onDelete={() => handleDeleteClick(slot)}
                />
              );
            })}

            {/* Add Button */}
            {!isFull && (
              <button
                type="button"
                className={styles.addButton}
                onClick={() => handleAddClick(position)}
                disabled={saving}
              >
                <PlusIcon /> Add to Position {position}
              </button>
            )}
          </div>
        );
      })}

      {/* Modal */}
      <BOSEquipmentModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingSlot(null);
        }}
        onSave={handleModalSave}
        section="combine"
        systemNumber={null}
        existingSlot={editingSlot}
        equipmentCatalog={[]} // Combine uses same catalog as other BOS
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingSlot}
        onClose={() => setDeletingSlot(null)}
        onConfirm={handleDeleteConfirm}
        title="Remove Equipment"
        message={deletingSlot ? `Remove ${deletingSlot.make} ${deletingSlot.model} from Position ${deletingSlot.position}?` : ''}
        confirmText="Remove"
        variant="danger"
      />
    </div>
  );
};

export default CombineBOSSection;
