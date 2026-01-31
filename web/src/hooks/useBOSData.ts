/**
 * useBOSData Hook
 * Comprehensive state management for Balance of System (BOS) equipment
 * Handles trigger equipment parsing, slot management, and CRUD operations
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchSystemDetails, patchSystemDetails } from '../services/systemDetailsAPI';
import { useIsAuthenticated } from '../store';
import { BOS_SECTION_CONFIG, BOS_EQUIPMENT_CATALOG } from '../constants/bosConstants';
import api from '../config/axios';
import logger from '../services/devLogger';
import {
  parseBOSSlotFromData,
  buildBOSSavePayload,
  buildBOSClearPayload,
  getBOSTrigger,
  findNextAvailableSlot,
  getDefaultBlockName,
  calculateBOSAmpRating,
  findEquipmentByTypeAndMinAmp,
  generateAllAutoPopulateResults,
  hasAutoPopulateResults,
  getAutoPopulateCount,
  shouldShowBOSSection,
  detectSystemConfiguration,
  determineBOSTargetSection,
  getUtilityBOSBlockName,
  calculateAmpRatingInfo,
  autoSelectEquipment,
  type AutoPopulateContext,
  type AutoPopulateResult,
} from '../utils/bosUtils';
import {
  getUtilityBOSRequirements,
  resolveEquipmentTypeByPOI,
  type ParsedBOSRequirement,
} from '../services/utilityRequirementsService';
import { getUtilityBOSConfig, utilityHasRequirements } from '../constants/utilityBOSRequirements';
import type {
  BOSSlot,
  BOSSystemData,
  BOSTriggerEquipment,
  BOSSectionType,
  SystemNumber,
  BOSEquipmentCatalogItem,
  AmpCalculationContext,
  BOSSolarPanelTrigger,
  BOSInverterTrigger,
  BOSStringCombinerTrigger,
  BOSBatteryTrigger,
  BOSSMSTrigger,
  BOSBackupPanelTrigger,
  BOSGatewayTrigger,
} from '../types/bosTypes';

// ============================================
// Hook Options Interface
// ============================================

interface UseBOSDataOptions {
  projectUuid: string;
  autoFetch?: boolean; // Default true
}

// ============================================
// Hook Return Interface
// ============================================

interface UseBOSDataReturn {
  // Loading/Error State
  loading: boolean;
  saving: boolean;
  error: string | null;

  // Parsed Data
  triggerEquipment: Record<SystemNumber, BOSTriggerEquipment>;
  systems: Record<SystemNumber, BOSSystemData>;

  // Reference Data
  equipmentCatalog: BOSEquipmentCatalogItem[];

  // Actions
  refresh: () => Promise<void>;
  updateSlot: (slot: BOSSlot, updates: Partial<BOSSlot>) => Promise<void>;
  addEquipment: (
    section: BOSSectionType,
    systemNumber: SystemNumber,
    equipment: Partial<BOSSlot>
  ) => Promise<BOSSlot | null>;
  removeEquipment: (slot: BOSSlot) => Promise<void>;
  clearSystemBOS: (systemNumber: SystemNumber) => Promise<void>;

  // Calculation Helpers
  calculateMinAmp: (context: Partial<AmpCalculationContext>) => AmpCalculationContext;
  findEquipment: (
    equipmentType: string,
    minAmpRating?: number
  ) => BOSEquipmentCatalogItem[];

  // Auto-populate
  autoPopulateBOS: (systemNumber: SystemNumber, utilityAbbrev: string | null) => Promise<{ added: number; errors: string[]; section: BOSSectionType }>;
  canAutoPopulate: (systemNumber: SystemNumber, utilityName: string | null) => { canPopulate: boolean; count: number; hasUtilityConfig: boolean };
  getAutoPopulatePreview: (systemNumber: SystemNumber, utilityName: string | null) => AutoPopulateResult[];
}

// ============================================
// Helper Functions
// ============================================

/**
 * Create empty trigger equipment for a system
 */
function createEmptyTriggerEquipment(systemNumber: SystemNumber): BOSTriggerEquipment {
  return {
    systemNumber,
    solarPanel: {
      present: false,
      make: null,
      model: null,
      quantity: null,
      isNew: null,
    },
    inverter: {
      present: false,
      type: null,
      make: null,
      model: null,
      quantity: null,
      isNew: null,
    },
    stringCombiner: {
      present: false,
      make: null,
      model: null,
      isNew: null,
      busRating: null,
      mainBreakerRating: null,
    },
    battery1: {
      present: false,
      make: null,
      model: null,
      quantity: null,
      isNew: null,
      tieInLocation: null,
    },
    battery2: {
      present: false,
      make: null,
      model: null,
      quantity: null,
      isNew: null,
      tieInLocation: null,
    },
    sms: {
      present: false,
      make: null,
      model: null,
      isNew: null,
      equipmentType: null,
      breakerRating: null,
      rsdEnabled: null,
    },
    backupPanel: {
      present: false,
      make: null,
      model: null,
      busRating: null,
      mainBreakerRating: null,
    },
    gateway: {
      present: false,
      type: null,
      extensions: null,
      backupSwitchLocation: null,
    },
    batteryConfiguration: null,
    combinationMethod: null,
    backupOption: null,
    batteryOnly: false,
  };
}

/**
 * Parse trigger equipment from raw system details data
 */
function parseTriggerEquipment(
  data: Record<string, any> | null,
  systemNumber: SystemNumber
): BOSTriggerEquipment {
  if (!data) return createEmptyTriggerEquipment(systemNumber);

  const prefix = `sys${systemNumber}_`;

  // Solar Panel
  const solarPanelMake = data[`${prefix}solar_panel_make`];
  const solarPanel: BOSSolarPanelTrigger = {
    present: !!solarPanelMake,
    make: solarPanelMake || null,
    model: data[`${prefix}solar_panel_model`] || null,
    quantity: data[`${prefix}solar_panel_qty`]
      ? parseInt(data[`${prefix}solar_panel_qty`], 10)
      : null,
    isNew: data[`${prefix}solar_panel_existing`] !== true, // existing=true means NOT new
    // Second panel type
    type2Present: !!data[`${prefix}show_second_panel_type`],
    type2Make: data[`${prefix}solar_panel_type2_manufacturer`] || null,
    type2Model: data[`${prefix}solar_panel_type2_model`] || null,
    type2Quantity: data[`${prefix}solar_panel_type2_quantity`]
      ? parseInt(data[`${prefix}solar_panel_type2_quantity`], 10)
      : null,
    type2IsNew: data[`${prefix}solar_panel_type2_is_new`] === true,
  };

  // Inverter/Microinverter
  const inverterMake = data[`${prefix}micro_inverter_make`];
  const inverter: BOSInverterTrigger = {
    present: !!inverterMake,
    type: data[`${prefix}stringing_type`] || null,
    make: inverterMake || null,
    model: data[`${prefix}micro_inverter_model`] || null,
    quantity: data[`${prefix}micro_inverter_qty`]
      ? parseInt(data[`${prefix}micro_inverter_qty`], 10)
      : null,
    isNew: data[`${prefix}micro_inverter_existing`] !== true,
  };

  // String Combiner Panel
  const combinerMake = data[`${prefix}combiner_panel_make`];
  const stringCombiner: BOSStringCombinerTrigger = {
    present: !!combinerMake,
    make: combinerMake || null,
    model: data[`${prefix}combiner_panel_model`] || null,
    isNew: data[`${prefix}combiner_existing`] !== true,
    busRating: data[`${prefix}combinerpanel_bus_rating`] || null,
    mainBreakerRating: data[`${prefix}combinerpanel_main_breaker_rating`] || null,
  };

  // Battery Type 1
  const battery1Make = data[`${prefix}battery_1_make`];
  const battery1: BOSBatteryTrigger = {
    present: !!battery1Make,
    make: battery1Make || null,
    model: data[`${prefix}battery_1_model`] || null,
    quantity: data[`${prefix}battery_1_qty`]
      ? parseInt(data[`${prefix}battery_1_qty`], 10)
      : null,
    isNew: data[`${prefix}battery1_existing`] !== true,
    tieInLocation: data[`${prefix}battery1_tie_in_location`] || null,
  };

  // Battery Type 2
  const battery2Make = data[`${prefix}battery_2_make`];
  const battery2: BOSBatteryTrigger = {
    present: !!battery2Make,
    make: battery2Make || null,
    model: data[`${prefix}battery_2_model`] || null,
    quantity: data[`${prefix}battery_2_qty`]
      ? parseInt(data[`${prefix}battery_2_qty`], 10)
      : null,
    isNew: data[`${prefix}battery2_existing`] !== true,
    tieInLocation: data[`${prefix}battery2_tie_in_location`] || null,
  };

  // SMS (Storage Management System)
  const smsMake = data[`${prefix}sms_make`];
  const noSMS = data[`${prefix}no_sms`] === true;
  const sms: BOSSMSTrigger = {
    present: !!smsMake && !noSMS,
    make: smsMake || null,
    model: data[`${prefix}sms_model`] || null,
    isNew: data[`${prefix}sms_existing`] !== true,
    equipmentType: data[`${prefix}sms_equipment_type`] || null,
    breakerRating: data[`${prefix}sms_breaker_rating`] || null,
    rsdEnabled: data[`${prefix}sms_rsd_enabled`] === true,
  };

  // Backup Panel (uses bls1_ prefix for panel details)
  const backupOption = data[`${prefix}backup_option`];
  const backupPanel: BOSBackupPanelTrigger = {
    present: !!backupOption && backupOption !== 'None',
    make: data['bls1_backup_load_sub_panel_make'] || null,
    model: data['bls1_backup_load_sub_panel_model'] || null,
    busRating: data['bls1_backuploader_bus_bar_rating'] || null,
    mainBreakerRating: data['bls1_backuploader_main_breaker_rating'] || null,
  };

  // Gateway (Tesla)
  const gatewayType = data[`${prefix}teslagatewaytype`];
  const gateway: BOSGatewayTrigger = {
    present: !!gatewayType,
    type: gatewayType || null,
    extensions: data[`${prefix}tesla_extensions`]
      ? parseInt(data[`${prefix}tesla_extensions`], 10)
      : null,
    backupSwitchLocation: data[`${prefix}backupswitch_location`] || null,
  };

  return {
    systemNumber,
    solarPanel,
    inverter,
    stringCombiner,
    battery1,
    battery2,
    sms,
    backupPanel,
    gateway,
    batteryConfiguration: data[`${prefix}battery_configuration`] || null,
    combinationMethod: data[`${prefix}combination_method`] || null,
    backupOption: backupOption || null,
    batteryOnly: data[`${prefix}batteryonly`] === true,
  };
}

/**
 * Parse BOS system data (all slots for one system)
 */
function parseBOSSystemData(
  data: Record<string, any> | null,
  systemNumber: SystemNumber
): BOSSystemData {
  if (!data) {
    return {
      systemNumber,
      utilitySlots: [],
      battery1Slots: [],
      battery2Slots: [],
      backupSlots: [],
      postSMSSlots: [],
    };
  }

  // Parse utility BOS (6 slots)
  const utilitySlots: BOSSlot[] = [];
  for (let i = 1; i <= 6; i++) {
    const slot = parseBOSSlotFromData(data, 'utility', systemNumber, i);
    if (slot) utilitySlots.push(slot);
  }

  // Parse battery1 BOS (3 slots)
  const battery1Slots: BOSSlot[] = [];
  for (let i = 1; i <= 3; i++) {
    const slot = parseBOSSlotFromData(data, 'battery1', systemNumber, i);
    if (slot) battery1Slots.push(slot);
  }

  // Parse battery2 BOS (3 slots)
  const battery2Slots: BOSSlot[] = [];
  for (let i = 1; i <= 3; i++) {
    const slot = parseBOSSlotFromData(data, 'battery2', systemNumber, i);
    if (slot) battery2Slots.push(slot);
  }

  // Parse backup BOS (3 slots)
  const backupSlots: BOSSlot[] = [];
  for (let i = 1; i <= 3; i++) {
    const slot = parseBOSSlotFromData(data, 'backup', systemNumber, i);
    if (slot) backupSlots.push(slot);
  }

  // Parse post-SMS BOS (3 slots)
  const postSMSSlots: BOSSlot[] = [];
  for (let i = 1; i <= 3; i++) {
    const slot = parseBOSSlotFromData(data, 'postSMS', systemNumber, i);
    if (slot) postSMSSlots.push(slot);
  }

  return {
    systemNumber,
    utilitySlots,
    battery1Slots,
    battery2Slots,
    backupSlots,
    postSMSSlots,
  };
}

/**
 * Get section key for accessing BOSSystemData
 */
function getSectionKey(
  section: BOSSectionType
): keyof Omit<BOSSystemData, 'systemNumber' | 'lastSlot' | 'combineSlots'> {
  switch (section) {
    case 'utility':
      return 'utilitySlots';
    case 'battery1':
      return 'battery1Slots';
    case 'battery2':
      return 'battery2Slots';
    case 'backup':
      return 'backupSlots';
    case 'postSMS':
      return 'postSMSSlots';
    default:
      return 'utilitySlots';
  }
}

// ============================================
// Main Hook
// ============================================

export function useBOSData(options: UseBOSDataOptions): UseBOSDataReturn {
  const { projectUuid, autoFetch = true } = options;
  const isAuthenticated = useIsAuthenticated();

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawData, setRawData] = useState<Record<string, any> | null>(null);

  // ============================================
  // Data Fetching
  // ============================================

  const fetch = useCallback(async () => {
    if (!isAuthenticated || !projectUuid) {
      setRawData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchSystemDetails(projectUuid);
      setRawData(result);
    } catch (err: any) {
      console.error('[useBOSData] Fetch error:', err);
      setError(err.message || 'Failed to load BOS data');
      setRawData(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, projectUuid]);

  // Initial fetch
  useEffect(() => {
    if (autoFetch) {
      fetch();
    }
  }, [fetch, autoFetch]);

  // Refresh handler
  const refresh = useCallback(async () => {
    await fetch();
  }, [fetch]);

  // ============================================
  // Memoized Parsed Data
  // ============================================

  const triggerEquipment = useMemo<Record<SystemNumber, BOSTriggerEquipment>>(
    () => ({
      1: parseTriggerEquipment(rawData, 1),
      2: parseTriggerEquipment(rawData, 2),
      3: parseTriggerEquipment(rawData, 3),
      4: parseTriggerEquipment(rawData, 4),
    }),
    [rawData]
  );

  const systems = useMemo<Record<SystemNumber, BOSSystemData>>(
    () => ({
      1: parseBOSSystemData(rawData, 1),
      2: parseBOSSystemData(rawData, 2),
      3: parseBOSSystemData(rawData, 3),
      4: parseBOSSystemData(rawData, 4),
    }),
    [rawData]
  );

  // ============================================
  // Actions
  // ============================================

  /**
   * Update an existing BOS slot
   */
  const updateSlot = useCallback(
    async (slot: BOSSlot, updates: Partial<BOSSlot>) => {
      if (!projectUuid) return;

      setSaving(true);
      setError(null);

      try {
        const updatedSlot: BOSSlot = { ...slot, ...updates };
        const payload = buildBOSSavePayload(updatedSlot);

        await patchSystemDetails(projectUuid, payload);

        // Update local state optimistically
        setRawData((prev) => (prev ? { ...prev, ...payload } : payload));
      } catch (err: any) {
        console.error('[useBOSData] updateSlot error:', err);
        setError(err.message || 'Failed to update BOS slot');
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [projectUuid]
  );

  /**
   * Add new equipment to a BOS section
   */
  const addEquipment = useCallback(
    async (
      section: BOSSectionType,
      systemNumber: SystemNumber,
      equipment: Partial<BOSSlot>
    ): Promise<BOSSlot | null> => {
      if (!projectUuid) return null;

      // Get existing slots for this section
      const sectionKey = getSectionKey(section);
      const existingSlots = systems[systemNumber][sectionKey];

      // Find next available slot
      const nextSlot = findNextAvailableSlot(existingSlots, section);
      if (nextSlot === null) {
        const config = BOS_SECTION_CONFIG[section];
        setError(`Maximum slots (${config.maxSlots}) reached for ${section}`);
        return null;
      }

      // Build new slot with defaults
      const newSlot: BOSSlot = {
        section,
        systemNumber,
        slotNumber: nextSlot,
        fieldPrefix: '', // Will be set by buildBOSSavePayload
        equipmentType: equipment.equipmentType || null,
        make: equipment.make || null,
        model: equipment.model || null,
        ampRating: equipment.ampRating || null,
        isNew: equipment.isNew ?? true,
        active: equipment.active ?? true,
        trigger: equipment.trigger ?? null,
        blockName: equipment.blockName || getDefaultBlockName(section),
      };

      setSaving(true);
      setError(null);

      try {
        const payload = buildBOSSavePayload(newSlot);
        await patchSystemDetails(projectUuid, payload);

        // Update local state
        setRawData((prev) => (prev ? { ...prev, ...payload } : payload));

        return newSlot;
      } catch (err: any) {
        console.error('[useBOSData] addEquipment error:', err);
        setError(err.message || 'Failed to add BOS equipment');
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [projectUuid, systems]
  );

  /**
   * Remove equipment from a BOS slot
   */
  const removeEquipment = useCallback(
    async (slot: BOSSlot) => {
      if (!projectUuid) return;

      setSaving(true);
      setError(null);

      try {
        const payload = buildBOSClearPayload(slot);
        await patchSystemDetails(projectUuid, payload);

        // Update local state - set fields to null
        setRawData((prev) => {
          if (!prev) return null;
          const updated = { ...prev };
          Object.keys(payload).forEach((key) => {
            updated[key] = null;
          });
          return updated;
        });
      } catch (err: any) {
        console.error('[useBOSData] removeEquipment error:', err);
        setError(err.message || 'Failed to remove BOS equipment');
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [projectUuid]
  );

  /**
   * Clear all BOS equipment for a system
   */
  const clearSystemBOS = useCallback(
    async (systemNumber: SystemNumber) => {
      if (!projectUuid) return;

      setSaving(true);
      setError(null);

      try {
        const clearPayload: Record<string, null> = {};
        const systemData = systems[systemNumber];

        // Collect all slots to clear
        const allSlots = [
          ...systemData.utilitySlots,
          ...systemData.battery1Slots,
          ...systemData.battery2Slots,
          ...systemData.backupSlots,
          ...systemData.postSMSSlots,
        ];

        allSlots.forEach((slot) => {
          const slotClearPayload = buildBOSClearPayload(slot);
          Object.assign(clearPayload, slotClearPayload);
        });

        if (Object.keys(clearPayload).length > 0) {
          await patchSystemDetails(projectUuid, clearPayload);
        }

        // Update local state
        setRawData((prev) => {
          if (!prev) return null;
          const updated = { ...prev };
          Object.keys(clearPayload).forEach((key) => {
            updated[key] = null;
          });
          return updated;
        });
      } catch (err: any) {
        console.error('[useBOSData] clearSystemBOS error:', err);
        setError(err.message || 'Failed to clear system BOS');
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [projectUuid, systems]
  );

  // ============================================
  // Helper Functions
  // ============================================

  const calculateMinAmp = useCallback(
    (context: Partial<AmpCalculationContext>) => {
      return calculateBOSAmpRating(context);
    },
    []
  );

  const findEquipment = useCallback(
    (equipmentType: string, minAmpRating?: number) => {
      return findEquipmentByTypeAndMinAmp(equipmentType, minAmpRating);
    },
    []
  );

  // ============================================
  // Auto-Populate Functions
  // ============================================

  /**
   * Build auto-populate context from trigger equipment
   */
  const buildAutoPopulateContext = useCallback(
    (systemNumber: SystemNumber, utilityName: string | null): AutoPopulateContext => {
      const triggers = triggerEquipment[systemNumber];

      // For inverter amps, we'd need to look up the model in equipment catalog
      // For now, use a reasonable default or null
      let inverterAmps: number | null = null;
      if (triggers?.inverter?.present && triggers.inverter.make && triggers.inverter.model) {
        // Would lookup from catalog here - for now use null, calculation will handle it
        inverterAmps = null;
      }

      // For battery amps, same approach
      let batteryAmps: number | null = null;
      if (triggers?.battery1?.present && triggers.battery1.make && triggers.battery1.model) {
        // Would lookup from catalog here - for now use null
        batteryAmps = null;
      }

      return {
        utilityName,
        systemNumber,
        inverterAmps,
        batteryAmps,
        batteryQuantity: triggers?.battery1?.quantity || null,
        backupPanelRating: triggers?.backupPanel?.busRating
          ? parseFloat(String(triggers.backupPanel.busRating))
          : null,
      };
    },
    [triggerEquipment]
  );

  /**
   * Helper to fetch inverter max_cont_output_amps from inverter API
   */
  const fetchInverterMaxContinuousOutput = async (systemNumber: SystemNumber): Promise<number | null> => {
    const prefix = `sys${systemNumber}_`;
    const make = rawData?.[`${prefix}micro_inverter_make`];
    const model = rawData?.[`${prefix}micro_inverter_model`];

    if (!make || !model) return null;

    try {
      // Get inverter list
      const listRes = await api.get(`/inverters/models?manufacturer=${encodeURIComponent(make)}`);
      if (!listRes.data?.success) return null;

      const matched = listRes.data.data?.find(
        (inv: any) => inv.model_number === model || inv.make_model === `${make} ${model}`
      );
      if (!matched?.id) return null;

      // Get full details
      const detailRes = await api.get(`/inverters/${matched.id}`);
      const amps = parseFloat(detailRes.data?.data?.max_cont_output_amps);
      return isNaN(amps) ? null : amps;
    } catch (err) {
      logger.error('BOS', 'Failed to fetch inverter specs:', err);
      return null;
    }
  };

  /**
   * Auto-populate BOS equipment based on utility requirements from database
   * Uses utility-requirements table to determine what equipment to add
   * Intelligently places equipment based on system configuration
   */
  const autoPopulateBOS = useCallback(
    async (
      systemNumber: SystemNumber,
      utilityAbbrev: string | null  // Pass utility abbreviation (e.g., "APS", "SRP")
    ): Promise<{ added: number; errors: string[]; section: BOSSectionType }> => {
      if (!projectUuid) {
        return { added: 0, errors: ['No project UUID'], section: 'utility' };
      }

      setSaving(true);
      setError(null);
      const errors: string[] = [];
      let addedCount = 0;

      try {
        // Step 1: Detect system configuration
        const config = detectSystemConfiguration(rawData || {}, systemNumber);
        const targetSection = determineBOSTargetSection(config);
        const blockName = getUtilityBOSBlockName(config);

        logger.log('BOS', `Auto-populate: System ${systemNumber}, Target: ${targetSection}`, config);

        // Step 2: Get utility requirements from database
        const requirements = await getUtilityBOSRequirements(utilityAbbrev);

        if (requirements.length === 0) {
          logger.log('BOS', `No BOS requirements for utility: ${utilityAbbrev}`);
          return { added: 0, errors: [], section: targetSection };
        }

        logger.log('BOS', `Found ${requirements.length} requirements for ${utilityAbbrev}:`,
          requirements.map(r => r.equipmentType));

        // Step 3: Calculate amp rating from inverter
        const inverterMaxAmps = await fetchInverterMaxContinuousOutput(systemNumber);
        const ampInfo = calculateAmpRatingInfo(
          inverterMaxAmps,
          config.inverterType,
          config.microinverterQty
        );

        logger.log('BOS', `Amp calculation:`, ampInfo);

        // Step 4: Get existing equipment to avoid duplicates
        const systemBOS = systems[systemNumber];
        const existingTypes = new Set<string>();

        const sectionSlots = systemBOS?.[`${targetSection}Slots` as keyof typeof systemBOS] as any[] || [];
        sectionSlots.forEach(slot => {
          if (slot.equipmentType) existingTypes.add(slot.equipmentType.toLowerCase());
        });

        // Step 5: Get POI type for conditional equipment selection (Xcel Energy)
        const poiType = rawData?.['ele_method_of_interconnection'] || null;

        // Step 6: Add required equipment
        for (const req of requirements) {
          // Resolve equipment type based on POI if needed (e.g., Xcel Energy)
          const resolvedType = req.requiresPOICheck
            ? resolveEquipmentTypeByPOI(req.equipmentType, poiType)
            : req.standardType;

          // Skip if already exists
          if (existingTypes.has(req.equipmentType.toLowerCase()) ||
              existingTypes.has(resolvedType.toLowerCase())) {
            logger.log('BOS', `Skipping ${req.equipmentType} - already exists`);
            continue;
          }

          // Auto-select equipment from catalog
          const selected = autoSelectEquipment(
            resolvedType,
            ampInfo.minimumRequired,
            null // No preferred make from this data source
          );

          if (!selected.make || !selected.model) {
            errors.push(`No equipment found for ${req.equipmentType}`);
            continue;
          }

          // Add to section
          try {
            await addEquipment(targetSection, systemNumber, {
              equipmentType: req.equipmentType,
              make: selected.make,
              model: selected.model,
              ampRating: selected.amp || '',
              isNew: true,
              blockName: blockName,
            });
            addedCount++;
            logger.log('BOS', `Added: ${req.equipmentType} (${resolvedType}) → ${selected.make} ${selected.model}${poiType && req.requiresPOICheck ? ` [POI: ${poiType}]` : ''}`);
          } catch (err: any) {
            errors.push(`Failed to add ${req.equipmentType}: ${err.message}`);
          }
        }

        return { added: addedCount, errors, section: targetSection };
      } catch (err: any) {
        setError(err.message);
        return { added: 0, errors: [err.message], section: 'utility' };
      } finally {
        setSaving(false);
      }
    },
    [projectUuid, systems, rawData, addEquipment]
  );

  /**
   * Check if auto-populate would add equipment for a system
   */
  const canAutoPopulate = useCallback(
    (
      systemNumber: SystemNumber,
      utilityName: string | null
    ): { canPopulate: boolean; count: number; hasUtilityConfig: boolean } => {
      const context = buildAutoPopulateContext(systemNumber, utilityName);
      const systemBOS = systems[systemNumber];

      const count = getAutoPopulateCount(context, systemBOS);
      const hasUtilityConfig = utilityHasRequirements(utilityName);

      return {
        canPopulate: count > 0,
        count,
        hasUtilityConfig,
      };
    },
    [systems, buildAutoPopulateContext]
  );

  /**
   * Get preview of what would be auto-populated
   */
  const getAutoPopulatePreview = useCallback(
    (systemNumber: SystemNumber, utilityName: string | null): AutoPopulateResult[] => {
      const context = buildAutoPopulateContext(systemNumber, utilityName);
      const systemBOS = systems[systemNumber];
      const results = generateAllAutoPopulateResults(context, systemBOS);

      return [
        ...results.utility,
        ...results.battery1,
        ...results.battery2,
        ...results.backup,
        ...results.postSMS,
      ];
    },
    [systems, buildAutoPopulateContext]
  );

  // ============================================
  // Return
  // ============================================

  return {
    // State
    loading,
    saving,
    error,

    // Data
    triggerEquipment,
    systems,

    // Reference
    equipmentCatalog: BOS_EQUIPMENT_CATALOG,

    // Actions
    refresh,
    updateSlot,
    addEquipment,
    removeEquipment,
    clearSystemBOS,

    // Helpers
    calculateMinAmp,
    findEquipment,

    // Auto-populate
    autoPopulateBOS,
    canAutoPopulate,
    getAutoPopulatePreview,
  };
}

export default useBOSData;
