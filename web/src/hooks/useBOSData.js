/**
 * useBOSData Hook - Enhanced Version
 *
 * Features:
 * - All 5 BOS section types (utility, battery1, battery2, backup, postSMS)
 * - Trigger-based visibility
 * - Slot compaction on delete
 * - Chain reordering for Battery/Backup (when drag-drop is implemented)
 * - Auto-population support (placeholder for future implementation)
 * - Multi-system support (sys1-sys4)
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { BOS_EQUIPMENT_CATALOG, NEC_CONSTANTS, STANDARD_AMP_RATINGS } from '../constants/bosConstants';
import {
  generateSlotFields,
  extractSlotData,
  getPopulatedSlots,
  getNextSlotNumber,
  buildSlotPayload,
  buildClearPayload,
} from '../utils/bosFieldUtils';
import { compactBOSSlots, reorderChainItems } from '../utils/bosSlotCompactor';
import {
  shouldShowBOSSection,
  getActiveSystemCount,
  getTriggerEquipmentDetails,
  getVisibleSections,
} from '../utils/bosTriggerUtils';
import api from '../config/axios';
import logger from '../services/devLogger';

const useBOSData = ({ projectUuid }) => {
  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [systemDetails, setSystemDetails] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch system details
  useEffect(() => {
    const fetchSystemDetails = async () => {
      if (!projectUuid) return;

      setLoading(true);
      setError(null);

      try {
        const response = await api.get(`/project/${projectUuid}/system-details`);

        // Handle successful response
        if (response.status === 200 && (response.data?.success || response.data?.status === 'SUCCESS')) {
          setSystemDetails(response.data.data || {});
        } else {
          setSystemDetails({});
        }
      } catch (err) {
        // 404 is normal - new projects don't have system details yet
        if (err?.response?.status === 404) {
          logger.info('BOS', 'No system details yet (404)');
          setSystemDetails({});
        } else {
          logger.error('BOS', 'Failed to fetch system details:', err);
          setError(err.message || 'Failed to load system details');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSystemDetails();
  }, [projectUuid, refreshKey]);

  // Extract data for all 4 systems
  const systems = useMemo(() => {
    const result = {};

    for (let sysNum = 1; sysNum <= 4; sysNum++) {
      result[sysNum] = {
        utilitySlots: getPopulatedSlots(systemDetails, 'utility', sysNum),
        battery1Slots: getPopulatedSlots(systemDetails, 'battery1', sysNum),
        battery2Slots: getPopulatedSlots(systemDetails, 'battery2', sysNum),
        backupSlots: getPopulatedSlots(systemDetails, 'backup', sysNum),
        postSMSSlots: getPopulatedSlots(systemDetails, 'postSMS', sysNum),
      };
    }

    // Combine BOS (no system prefix)
    result.combine = {
      slots: getPopulatedSlots(systemDetails, 'combine', null),
    };

    return result;
  }, [systemDetails]);

  // Trigger equipment for each system
  const triggerEquipment = useMemo(() => {
    const result = {};

    for (let sysNum = 1; sysNum <= 4; sysNum++) {
      result[sysNum] = {
        utility: getTriggerEquipmentDetails(systemDetails, 'utility', sysNum),
        battery1: getTriggerEquipmentDetails(systemDetails, 'battery1', sysNum),
        battery2: getTriggerEquipmentDetails(systemDetails, 'battery2', sysNum),
        backup: getTriggerEquipmentDetails(systemDetails, 'backup', sysNum),
        postSMS: getTriggerEquipmentDetails(systemDetails, 'postSMS', sysNum),
      };
    }

    return result;
  }, [systemDetails]);

  // Visible sections per system
  const visibleSections = useMemo(() => {
    const result = {};

    for (let sysNum = 1; sysNum <= 4; sysNum++) {
      result[sysNum] = getVisibleSections(systemDetails, sysNum);
    }

    // Combine visibility
    result.combine = shouldShowBOSSection(systemDetails, 'combine', null);

    return result;
  }, [systemDetails]);

  // Add equipment to a section
  const addEquipment = useCallback(async (section, systemNumber, equipmentData, position = null) => {
    setSaving(true);
    setError(null);

    try {
      let slotNumber;

      if (section === 'combine') {
        // For combine BOS, check slot within position
        slotNumber = getNextSlotNumber(systemDetails, section, position, position);
        if (!slotNumber) {
          throw new Error('All slots in this position are full');
        }
        systemNumber = position; // For combine, systemNumber param becomes position
      } else {
        slotNumber = getNextSlotNumber(systemDetails, section, systemNumber);
        if (!slotNumber) {
          throw new Error('All slots are full');
        }
      }

      const payload = buildSlotPayload(section, systemNumber, slotNumber, equipmentData);

      await api.patch(`/project/${projectUuid}/system-details`, payload);

      // Refresh data
      setRefreshKey(prev => prev + 1);

      return { success: true, slotNumber };
    } catch (err) {
      logger.error('BOS', 'Failed to add equipment:', err);
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [projectUuid, systemDetails]);

  // Update existing slot
  const updateSlot = useCallback(async (slot, equipmentData) => {
    setSaving(true);
    setError(null);

    try {
      const payload = buildSlotPayload(
        slot.section,
        slot.systemNumber,
        slot.slotNumber,
        equipmentData
      );

      await api.patch(`/project/${projectUuid}/system-details`, payload);

      setRefreshKey(prev => prev + 1);

      return { success: true };
    } catch (err) {
      logger.error('BOS', 'Failed to update slot:', err);
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [projectUuid]);

  // Remove equipment and compact slots
  const removeEquipment = useCallback(async (slot) => {
    setSaving(true);
    setError(null);

    try {
      // Clear the slot
      const clearPayload = buildClearPayload(slot.section, slot.systemNumber, slot.slotNumber);
      await api.patch(`/project/${projectUuid}/system-details`, clearPayload);

      // Compact remaining slots (skip for combine BOS)
      if (slot.section !== 'combine') {
        // Refetch system details for accurate compaction
        const response = await api.get(`/project/${projectUuid}/system-details`);
        const updatedDetails = response.data?.data || response.data || {};

        const compactPayload = compactBOSSlots(updatedDetails, slot.section, slot.systemNumber);
        if (Object.keys(compactPayload).length > 0) {
          await api.patch(`/project/${projectUuid}/system-details`, compactPayload);
        }
      }

      setRefreshKey(prev => prev + 1);

      return { success: true };
    } catch (err) {
      logger.error('BOS', 'Failed to remove equipment:', err);
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [projectUuid]);

  // Reorder chain items (for Battery/Backup BOS)
  const reorderChain = useCallback(async (section, systemNumber, reorderedItems) => {
    setSaving(true);
    setError(null);

    try {
      const payload = reorderChainItems(reorderedItems, section, systemNumber);

      if (Object.keys(payload).length === 0) {
        logger.warn('BOS', `Section ${section} is not draggable or payload is empty`);
        return { success: false };
      }

      await api.patch(`/project/${projectUuid}/system-details`, payload);

      setRefreshKey(prev => prev + 1);

      return { success: true };
    } catch (err) {
      logger.error('BOS', 'Failed to reorder chain:', err);
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [projectUuid]);

  // Calculate minimum amp rating based on NEC 1.25x rule
  const calculateMinAmp = useCallback((context) => {
    // NEC 1.25x rule: BOS must be rated at >= max continuous output × 1.25
    const { inverterAmperage, batteryMaxChargeCurrent } = context;

    let baseAmperage = 0;
    if (inverterAmperage) baseAmperage = Math.max(baseAmperage, parseFloat(inverterAmperage));
    if (batteryMaxChargeCurrent) baseAmperage = Math.max(baseAmperage, parseFloat(batteryMaxChargeCurrent));

    const minimumRating = Math.ceil(baseAmperage * NEC_CONSTANTS.CONTINUOUS_LOAD_MULTIPLIER);

    // Find next standard amp rating
    const recommendedRating = STANDARD_AMP_RATINGS.find(r => r >= minimumRating) || minimumRating;

    return {
      minimumAmpRating: minimumRating,
      recommendedAmpRating: recommendedRating,
      calculation: `${baseAmperage}A × 1.25 = ${minimumRating}A`,
    };
  }, []);

  // Find equipment in catalog
  const findEquipment = useCallback((type, make, model) => {
    return BOS_EQUIPMENT_CATALOG.find(item =>
      item.type === type && item.make === make && item.model === model
    );
  }, []);

  // Auto-populate BOS (stub - will be enhanced with utility requirements)
  const autoPopulateBOS = useCallback(async (systemNumber, utilityName) => {
    // Placeholder for configuration-based auto-population
    logger.info('BOS', 'Auto-populate called for system', systemNumber, 'utility', utilityName);
    return { added: 0, errors: [] };
  }, []);

  // Check if auto-populate is available
  const canAutoPopulate = useCallback((systemNumber, utilityName) => {
    // Placeholder - will check against configuration database
    return { canPopulate: false, count: 0, reason: 'Not implemented' };
  }, []);

  // Refresh data
  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  return {
    loading,
    saving,
    error,
    systems,
    triggerEquipment,
    visibleSections,
    equipmentCatalog: BOS_EQUIPMENT_CATALOG,
    addEquipment,
    updateSlot,
    removeEquipment,
    reorderChain,
    calculateMinAmp,
    findEquipment,
    autoPopulateBOS,
    canAutoPopulate,
    refresh,
    activeSystemCount: getActiveSystemCount(systemDetails),
  };
};

export default useBOSData;
