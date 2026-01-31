import { useState, useCallback } from 'react';
import { isSectionDirty, getSectionClearFields } from '../utils/sectionDirtyCheck';

/**
 * Section delete behavior types
 */
export const DELETE_BEHAVIOR = {
  CLEAR_ONLY: 'CLEAR_ONLY',         // Can only clear, never remove (e.g., System 1 Solar Panel, Inverter)
  CLEAR_AND_RESET: 'CLEAR_RESET',   // Clear and reset to default state (future use)
  CLEAR_AND_REMOVE: 'CLEAR_REMOVE', // Clear first, then can remove (most sections)
};

/**
 * Custom hook for managing section delete flow
 *
 * Provides state and handlers for the two-step clear/remove process:
 * 1. If section has data → show clear modal
 * 2. If section is empty → show remove modal (or do nothing for CLEAR_ONLY)
 *
 * @param {Object} config - Configuration object
 * @param {string} config.sectionName - Name of the section (from SECTION_FIELDS)
 * @param {Object} config.formData - Current form data
 * @param {Function} config.onChange - Single field change handler
 * @param {Function} [config.onBatchChange] - Batch change handler (preferred, falls back to onChange)
 * @param {string} [config.behavior=CLEAR_AND_REMOVE] - DELETE_BEHAVIOR type
 * @param {string} [config.visibilityFlag] - Form field that controls section visibility (e.g., 'show_solar_panel_2')
 * @param {Array<[string, any]>} [config.additionalClearFields=[]] - Extra fields to clear beyond standard section fields
 * @param {Array<string>} [config.cascadeSections=[]] - Names of sections that will also be cleared (for display in modal)
 *
 * @returns {Object} Hook state and handlers
 */
export const useSectionDelete = ({
  sectionName,
  formData,
  onChange,
  onBatchChange,
  behavior = DELETE_BEHAVIOR.CLEAR_AND_REMOVE,
  visibilityFlag = null,
  additionalClearFields = [],
  cascadeSections = [],
}) => {
  const [showClearModal, setShowClearModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);

  // Check if section has data
  const isDirty = isSectionDirty(sectionName, formData);

  /**
   * Clear all section data
   * Sends empty strings to frontend (will be converted to null on save)
   */
  const clearSectionData = useCallback(() => {
    const clearFields = getSectionClearFields(sectionName);

    // Add any additional fields specified (e.g., cascade fields)
    const allFields = [...clearFields, ...additionalClearFields];

    // Prefer batch update for performance (one re-render)
    if (onBatchChange) {
      onBatchChange(allFields);
    } else {
      // Fallback to individual onChange calls
      allFields.forEach(([field, value]) => onChange(field, value));
    }

    setShowClearModal(false);
  }, [sectionName, additionalClearFields, onChange, onBatchChange]);

  /**
   * Remove section (hide it)
   * Clears data first, then hides section if visibility flag exists
   */
  const removeSection = useCallback(() => {
    // First clear all data
    clearSectionData();

    // Then hide the section if there's a visibility flag
    if (visibilityFlag) {
      onChange(visibilityFlag, false);
    }

    setShowRemoveModal(false);
  }, [clearSectionData, visibilityFlag, onChange]);

  /**
   * Handle trash button click - determines which modal to show
   * This is the main entry point called by the section's onDelete prop
   */
  const handleTrashClick = useCallback((e) => {
    // Stop event propagation to prevent EquipmentRow collapse/expand
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }

    switch (behavior) {
      case DELETE_BEHAVIOR.CLEAR_ONLY:
        // Always show clear modal if dirty, do nothing if clean
        if (isDirty) {
          setShowClearModal(true);
        }
        // If not dirty, do nothing (nothing to clear, can't remove)
        break;

      case DELETE_BEHAVIOR.CLEAR_AND_RESET:
        // Show clear modal if dirty, otherwise do nothing
        // (Reset handled by clear operation)
        if (isDirty) {
          setShowClearModal(true);
        }
        break;

      case DELETE_BEHAVIOR.CLEAR_AND_REMOVE:
        if (isDirty) {
          // Has data - show clear modal first
          setShowClearModal(true);
        } else {
          // No data - skip straight to remove modal
          setShowRemoveModal(true);
        }
        break;

      default:
        console.warn('Unknown delete behavior:', behavior);
    }
  }, [behavior, isDirty]);

  /**
   * Handle confirmation from clear modal
   */
  const handleClearConfirm = useCallback(() => {
    clearSectionData();
    // For CLEAR_AND_REMOVE, after clearing, next trash click will show remove modal
    // For CLEAR_ONLY and CLEAR_AND_RESET, we're done
  }, [clearSectionData]);

  /**
   * Handle confirmation from remove modal
   */
  const handleRemoveConfirm = useCallback(() => {
    removeSection();
  }, [removeSection]);

  return {
    // State
    isDirty,
    showClearModal,
    showRemoveModal,

    // Handlers for trash button and modal confirmations
    handleTrashClick,
    handleClearConfirm,
    handleRemoveConfirm,

    // Modal controls
    closeClearModal: () => setShowClearModal(false),
    closeRemoveModal: () => setShowRemoveModal(false),

    // Direct actions (for programmatic use)
    clearSectionData,
    removeSection,

    // Cascade info (for displaying in modals)
    cascadeSections,
  };
};
