/**
 * InlineBOSSection - Inline BOS equipment display
 *
 * Displays BOS equipment slots inline within the equipment form,
 * right after the trigger equipment (String Combiner, Battery, etc.)
 */

import React, { useState } from 'react';
import EquipmentRow from '../../ui/EquipmentRow';
import BOSEquipmentModal from './BOSEquipmentModal';
import ConfirmDialog from '../../ui/ConfirmDialog';
import { AddButton } from '../../ui';
import { BOS_FIELD_PATTERNS } from '../../../constants/bosFieldPatterns';
import { getPopulatedSlots } from '../../../utils/bosFieldUtils';
import api from '../../../config/axios';
import logger from '../../../services/devLogger';
import styles from './InlineBOSSection.module.css';

const PlusIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2z"/>
  </svg>
);

const InlineBOSSection = ({
  projectUuid,
  systemNumber,
  section,
  systemDetails,
  equipmentCatalog = [],
  onRefresh,
  onNavigateToTab,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [deletingSlot, setDeletingSlot] = useState(null);
  const [expandedSlots, setExpandedSlots] = useState({});
  const [saving, setSaving] = useState(false);

  const pattern = BOS_FIELD_PATTERNS[section];
  const slots = getPopulatedSlots(systemDetails || {}, section, systemNumber);

  const toggleSlot = (slotKey) => {
    setExpandedSlots(prev => ({ ...prev, [slotKey]: !prev[slotKey] }));
  };

  const handleAddClick = () => {
    setEditingSlot(null);
    setShowModal(true);
  };

  const handleEditClick = (slot) => {
    setEditingSlot(slot);
    setShowModal(true);
  };

  const handleDeleteClick = (slot) => {
    setDeletingSlot(slot);
  };

  const handleModalSave = async (equipmentData) => {
    setSaving(true);

    try {
      let slotNumber = 1;
      if (!editingSlot) {
        // Adding new - find next available slot
        slotNumber = slots.length + 1;
        if (slotNumber > pattern.maxSlots) {
          logger.error('BOS', 'All slots are full');
          return;
        }
      } else {
        slotNumber = editingSlot.slotNumber;
      }

      const prefix = pattern.slotPattern(systemNumber, slotNumber);
      const payload = {
        [`${prefix}_equipment_type`]: equipmentData.equipmentType,
        [`${prefix}_make`]: equipmentData.make,
        [`${prefix}_model`]: equipmentData.model,
        [`${prefix}_amp_rating`]: equipmentData.ampRating,
        [`${prefix}_is_new`]: equipmentData.isNew ?? true,
        [`${prefix}_block_name`]: equipmentData.blockName,
      };

      // Add trigger and active fields if needed
      if (pattern.hasTrigger) {
        payload[`${prefix}_trigger`] = true;
      }
      if (pattern.hasActive) {
        payload[`${prefix}_active`] = true;
      }

      await api.patch(`/project/${projectUuid}/system-details`, payload);

      setShowModal(false);
      setEditingSlot(null);

      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      logger.error('BOS', 'Failed to save BOS equipment:', err);
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
          [`${prefix}_is_new`]: null,
          [`${prefix}_block_name`]: null,
        };

        if (pattern.hasTrigger) {
          payload[`${prefix}_trigger`] = null;
        }
        if (pattern.hasActive) {
          payload[`${prefix}_active`] = null;
        }

        await api.patch(`/project/${projectUuid}/system-details`, payload);

        if (onRefresh) {
          onRefresh();
        }
      } catch (err) {
        logger.error('BOS', 'Failed to delete BOS equipment:', err);
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

  // Section labels
  const sectionLabels = {
    utility: 'BOS Equipment',
    battery1: 'BOS Equipment',
    battery2: 'BOS Equipment',
    backup: 'BOS Equipment',
    postSMS: 'BOS Equipment',
  };

  return (
    <div className={styles.container}>
      {/* BOS Equipment Rows */}
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
            onCamera={handleCameraClick}
            onEdit={() => handleEditClick(slot)}
            onDelete={() => handleDeleteClick(slot)}
          />
        );
      })}

      {/* Add Button - Only show if not full */}
      {slots.length < pattern.maxSlots && (
        <button
          type="button"
          className={styles.addButton}
          onClick={handleAddClick}
          disabled={saving}
        >
          <PlusIcon /> Add {sectionLabels[section]}
        </button>
      )}

      {/* Modal */}
      <BOSEquipmentModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingSlot(null);
        }}
        onSave={handleModalSave}
        section={section}
        systemNumber={systemNumber}
        existingSlot={editingSlot}
        equipmentCatalog={equipmentCatalog}
      />

      {/* Delete Confirmation */}
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

export default InlineBOSSection;
