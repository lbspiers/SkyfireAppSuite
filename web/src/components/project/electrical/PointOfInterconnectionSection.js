import React, { useState, useEffect } from 'react';
import { POI_TYPE_OPTIONS, BREAKER_RATING_OPTIONS } from '../../../utils/constants';
import { usePCSCalculations } from '../../../hooks/usePCSCalculations';
import { Alert, EquipmentRow, TableDropdown, FormFieldRow, FormInput, TableRowButton, SectionClearModal, Modal, Button } from '../../ui';
import equipStyles from '../EquipmentForm.module.css';

// Wire Gauge Amp Ratings (for conductor sizing)
const WIRE_GAUGE_OPTIONS = [
  { label: '10 AWG', value: '10', ampRating: 35 },
  { label: '8 AWG', value: '8', ampRating: 50 },
  { label: '6 AWG', value: '6', ampRating: 65 },
  { label: '4 AWG', value: '4', ampRating: 85 },
  { label: '3 AWG', value: '3', ampRating: 100 },
  { label: '2 AWG', value: '2', ampRating: 115 },
  { label: '1 AWG', value: '1', ampRating: 130 },
  { label: '1/0 AWG', value: '1/0', ampRating: 150 },
  { label: '2/0 AWG', value: '2/0', ampRating: 175 },
  { label: '3/0 AWG', value: '3/0', ampRating: 200 },
  { label: '4/0 AWG', value: '4/0', ampRating: 230 },
];

/**
 * Point of Interconnection Section
 * Defines how solar/battery system connects to electrical service
 * Includes Power Control System (PCS) for battery-backed systems
 *
 * @param {Object} formData - Form state containing all field values
 * @param {Function} onChange - Handler for field changes
 * @param {number} systemNumber - System number (1-4)
 * @param {Object} batteryData - Battery configuration from equipment form
 * @param {Object} inverterData - Inverter configuration from equipment form
 * @param {Object} panelData - Electrical panel data (bus bar, main breaker)
 * @param {boolean} isCombinedSystem - Whether this is a combined system
 * @param {number} combinedSystemMaxOutput - Max output for combined systems
 * @param {string} sectionTitle - Optional title override for the section
 * @param {number} totalActiveSystems - Total number of active systems (for title logic)
 */
const PointOfInterconnectionSection = ({
  formData,
  onChange,
  systemNumber = 1,
  batteryData = {},
  inverterData = {},
  panelData = {},
  isCombinedSystem = false,
  combinedSystemMaxOutput = null,
  sectionTitle = null,
  totalActiveSystems = 1,
  utilityRequirements = null,
}) => {
  // ============================================
  // LOCAL STATE
  // ============================================

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showTapDisconnectPrompt, setShowTapDisconnectPrompt] = useState(false);
  const [showAddTapDisconnectPrompt, setShowAddTapDisconnectPrompt] = useState(false);
  const [existingDisconnect, setExistingDisconnect] = useState(null);

  // ============================================
  // DYNAMIC FIELD NAMES (System-aware)
  // ============================================

  /**
   * Get the correct database field name based on system number and combined state
   * Combined systems use sys1_ prefix for POI fields (shared between systems)
   */
  const getFieldName = (baseField) => {
    // Tap disconnect field mappings (always system-specific)
    const tapFields = [
      'tap_disconnect_detected',
      'tap_disconnect_use_existing',
      'tap_disconnect_source',
      'tap_disconnect_linked_bos_slot',
      'tap_disconnect_make',
      'tap_disconnect_model',
      'tap_disconnect_amp_rating',
      'tap_disconnect_wattage',
      'tap_disconnect_is_new',
      'tap_disconnect_sizing_mode',
      'tap_disconnect_equipment_id'
    ];

    if (tapFields.includes(baseField)) {
      const sysNum = isCombinedSystem ? 1 : systemNumber;
      return `sys${sysNum}_${baseField}`;
    }

    // Combined systems always use System 1 fields
    if (isCombinedSystem) {
      if (baseField === 'ele_breaker_location') return 'ele_breaker_location';
      if (baseField === 'ele_method_of_interconnection') return 'ele_method_of_interconnection';
      if (baseField === 'pcs_amps') return 'sys1_pcs_amps';
      if (baseField === 'pcs_settings') return 'sys1_pcs_settings';
      if (baseField === 'poi_breaker_conductor_mode') return 'sys1_poi_breaker_conductor_mode';
      if (baseField === 'poi_breaker_size') return 'sys1_poi_breaker_size';
      if (baseField === 'poi_conductor_size') return 'sys1_poi_conductor_size';
    }

    // Separate systems use system-specific fields
    if (systemNumber === 1) {
      if (baseField === 'ele_breaker_location') return 'ele_breaker_location';
      if (baseField === 'ele_method_of_interconnection') return 'ele_method_of_interconnection';
      if (baseField === 'pcs_amps') return 'sys1_pcs_amps';
      if (baseField === 'pcs_settings') return 'sys1_pcs_settings';
      if (baseField === 'poi_breaker_conductor_mode') return 'sys1_poi_breaker_conductor_mode';
      if (baseField === 'poi_breaker_size') return 'sys1_poi_breaker_size';
      if (baseField === 'poi_conductor_size') return 'sys1_poi_conductor_size';
    }

    // System 2-4 use prefixed fields
    const prefix = `sys${systemNumber}_`;
    if (baseField === 'ele_breaker_location') return `${prefix}ele_breaker_location`;
    if (baseField === 'ele_method_of_interconnection') return `${prefix}ele_method_of_interconnection`;
    if (baseField === 'pcs_amps') return `${prefix}pcs_amps`;
    if (baseField === 'pcs_settings') return `${prefix}pcs_settings`;
    if (baseField === 'poi_breaker_conductor_mode') return `${prefix}poi_breaker_conductor_mode`;
    if (baseField === 'poi_breaker_size') return `${prefix}poi_breaker_size`;
    if (baseField === 'poi_conductor_size') return `${prefix}poi_conductor_size`;

    return baseField;
  };

  const pcsFieldName = getFieldName('pcs_amps');
  const pcsSettingsFieldName = getFieldName('pcs_settings'); // Syncs with GatewayConfigurationSection
  const locationFieldName = getFieldName('ele_breaker_location');
  const poiTypeFieldName = getFieldName('ele_method_of_interconnection');
  const breakerConductorModeFieldName = getFieldName('poi_breaker_conductor_mode');
  const breakerSizeFieldName = getFieldName('poi_breaker_size');
  const conductorSizeFieldName = getFieldName('poi_conductor_size');

  // ============================================
  // DYNAMIC SECTION TITLE
  // ============================================

  /**
   * Generate section title based on context
   * Rules:
   * - If sectionTitle prop provided → use it
   * - If combined systems → "POI - Combined Systems 1 & 2"
   * - If only 1 system total → "POI" (no system number)
   * - If 2+ systems, separate → "POI - System N"
   */
  const getSectionTitle = () => {
    if (sectionTitle) return sectionTitle;  // Use override if provided
    if (isCombinedSystem) return "POI - Combined Systems 1 & 2";

    // Single system - no number needed
    if (totalActiveSystems <= 1) {
      return "POI";
    }

    // Multiple separate systems - show system number
    return `POI - System ${systemNumber}`;
  };

  const displayTitle = getSectionTitle();

  // ============================================
  // PCS ACTIVATION STATE (from formData)
  // ============================================

  // Read manual PCS activation from formData instead of local state
  // This syncs with gatewayConfigActivatePCS in Equipment form
  const manualPcsActivated = formData[pcsSettingsFieldName] === true || formData[pcsSettingsFieldName] === 'true';

  // ============================================
  // CURRENT FORM VALUES
  // ============================================

  const poiType = formData[poiTypeFieldName] || '';
  const breakerConductorMode = formData[breakerConductorModeFieldName] || 'auto';
  const selectedBreakerSize = formData[breakerSizeFieldName] || '';
  const selectedConductorSize = formData[conductorSizeFieldName] || '';

  // ============================================
  // PCS CALCULATIONS HOOK
  // ============================================

  const pcsCalculations = usePCSCalculations({
    systemNumber,
    batteryMake1: batteryData.battery1_make,
    batteryModel1: batteryData.battery1_model,
    batteryQty1: batteryData.battery1_qty, // Fixed: Use battery1_qty (not battery1_quantity)
    batteryMake2: batteryData.battery2_make,
    batteryModel2: batteryData.battery2_model,
    batteryQty2: batteryData.battery2_qty, // Fixed: Use battery2_qty (not battery2_quantity)
    inverterMake: inverterData.inverter_make,
    inverterModel: inverterData.inverter_model,
    inverterType: inverterData.inverter_type,
    microinverterQty: inverterData.microinverter_qty,
    maxContOutputAmps: inverterData.max_cont_output_amps, // Fixed: Use max_cont_output_amps (not inverter_max_cont_output_amps)
    busBarRating: panelData.bus_bar_rating ? parseFloat(panelData.bus_bar_rating) : null, // Fixed: Use bus_bar_rating
    mainBreakerRating: panelData.main_breaker_rating, // Fixed: Use main_breaker_rating
    currentPcsAmps: formData[pcsFieldName],
    isCombinedSystem,
    combinedSystemMaxOutput,
  });

  console.log('[POI] PCS Field Debug:', {
    pcsFieldName,
    formDataValue: formData[pcsFieldName],
    recommendedPcsAmps: pcsCalculations.recommendedPcsAmps,
    optionsCount: pcsCalculations.filteredPcsAmpsOptions?.length || 0,
    options: pcsCalculations.filteredPcsAmpsOptions,
  });

  console.debug('[POI] PCS Calculations:', {
    systemNumber,
    hasBattery: pcsCalculations.hasBattery,
    maxContinuousOutputAmps: pcsCalculations.maxContinuousOutputAmps,
    maxContinuousOutput125: pcsCalculations.maxContinuousOutput125,
    allowableBackfeed: pcsCalculations.allowableBackfeed,
    shouldAutoTriggerPCS: pcsCalculations.shouldAutoTriggerPCS,
    canManualTriggerPCS: pcsCalculations.canManualTriggerPCS,
    violates120Rule: pcsCalculations.violates120Rule,
  });

  // ============================================
  // AUTO-SELECT RECOMMENDED PCS SETTING
  // ============================================

  // Auto-select and save recommended PCS amps if available and not already set
  // ONLY for battery systems that should auto-trigger PCS
  useEffect(() => {
    if (pcsCalculations.shouldAutoTriggerPCS && pcsCalculations.recommendedPcsAmps && !formData[pcsFieldName]) {
      const pcsSettingsField = systemNumber === 1 ? 'sys1_pcs_settings' : 'sys2_pcs_settings';
      console.log('[POI] Auto-selecting recommended PCS amps - Saving to BOTH fields:', {
        field1: pcsFieldName,
        field2: pcsSettingsField,
        ampValue: pcsCalculations.recommendedPcsAmps,
        booleanValue: true
      });
      // Save amp value to pcs_amps (integer field)
      onChange(pcsFieldName, pcsCalculations.recommendedPcsAmps);
      // Save true to pcs_settings (boolean field) to indicate PCS is active
      onChange(pcsSettingsField, true);
    }
  }, [pcsCalculations.shouldAutoTriggerPCS, pcsCalculations.recommendedPcsAmps, formData[pcsFieldName], pcsFieldName, onChange, systemNumber]);

  // ============================================
  // DERIVED STATE
  // ============================================

  const showPowerControl = pcsCalculations.shouldAutoTriggerPCS || manualPcsActivated;
  const showBreakerRating = poiType === 'PV Breaker (OCPD)' || poiType === 'Lug Kit';
  const showDisconnectRating = poiType === 'Line (Supply) Side Tap' || poiType === 'Load Side Tap' || poiType === 'Meter Collar Adapter';

  // Show breaker/conductor sizing controls when POI type is PV Breaker or Lug Kit
  const showBreakerConductorControls = poiType === 'PV Breaker (OCPD)' || poiType === 'Lug Kit';
  const showCustomBreakerFields = showBreakerConductorControls && breakerConductorMode === 'custom';

  // ============================================
  // BREAKER SIZE OPTIONS (Filter out MLO)
  // ============================================

  const breakerSizeOptions = BREAKER_RATING_OPTIONS
    .filter(opt => opt.value !== 'MLO')
    .map(opt => ({ label: `${opt.value}A`, value: opt.value }));

  // ============================================
  // FILTERED CONDUCTOR SIZE OPTIONS
  // ============================================

  /**
   * Filter wire gauge options based on selected breaker size
   * Only show wire gauges that meet or exceed the breaker's amp rating
   */
  const getFilteredConductorOptions = () => {
    if (!selectedBreakerSize) return WIRE_GAUGE_OPTIONS;

    const breakerAmps = parseInt(selectedBreakerSize);

    // Filter to show only wire gauges that can handle the breaker amperage
    return WIRE_GAUGE_OPTIONS.filter(wire => wire.ampRating >= breakerAmps);
  };

  const filteredConductorOptions = getFilteredConductorOptions();

  // ============================================
  // POI LOCATION OPTIONS
  // ============================================

  /**
   * Get POI location options based on POI type
   * NOTE: Location options are the same for combined and separate systems.
   * Combined systems tie into a single physical location, so the options
   * don't need to be restricted or modified based on isCombinedSystem.
   */
  const getLocationOptions = () => {
    const baseOptions = [
      { label: 'Main Panel (A) Bus', value: 'Main Panel (A) Bus' },
      { label: 'Sub Panel (B) Bus', value: 'Sub Panel (B) Bus' },
    ];

    if (poiType === 'Line (Supply) Side Tap') {
      return [{ label: 'Between Main Panel (A) MCB & Utility Meter', value: 'Between Main Panel (A) MCB & Utility Meter' }];
    }

    if (poiType === 'Line Side Connection') {
      return [{ label: 'Utility Meter', value: 'Utility Meter' }];
    }

    if (poiType === 'Load Side Tap') {
      return [
        { label: 'Between Main Panel (A) Bus & MCB', value: 'Between Main Panel (A) Bus & MCB' },
        { label: 'Between Main Panel (A) & Sub Panel (B)', value: 'Between Main Panel (A) & Sub Panel (B)' },
      ];
    }

    if (poiType === 'Meter Collar Adapter') {
      return [
        { label: 'Utility Meter', value: 'Utility Meter' },
        { label: 'Detached Meter Enclosure', value: 'Detached Meter Enclosure' },
      ];
    }

    if (poiType === 'Solar Ready') {
      return [
        { label: '60A Dedicated PV Input', value: '60A Dedicated PV Input' },
        { label: '100A Dedicated PV Input', value: '100A Dedicated PV Input' },
        { label: '200A Dedicated PV Input', value: '200A Dedicated PV Input' },
      ];
    }

    return baseOptions;
  };

  const locationOptions = getLocationOptions();

  // ============================================
  // TAP DISCONNECT HELPER FUNCTIONS
  // ============================================

  /**
   * Check if utility requires a fused AC disconnect based on bos_1 through bos_5
   */
  const utilityRequiresFusedDisconnect = (utilityReqs) => {
    if (!utilityReqs) return false;

    const bosFields = ['bos_1', 'bos_2', 'bos_3', 'bos_4', 'bos_5'];
    return bosFields.some(field => {
      const value = utilityReqs[field];
      if (!value) return false;
      const normalized = value.toLowerCase();
      return normalized.includes('fused') && normalized.includes('disconnect');
    });
  };

  /**
   * Check if tap disconnect scenario is triggered
   */
  const isTapDisconnectScenario = () => {
    const sesType = formData.ele_ses_type || '';
    const poiType = formData[poiTypeFieldName] || '';

    const isDetachedService = sesType.toLowerCase().includes('detached');
    const isLineSideTap = poiType === 'Line (Supply) Side Tap' || poiType === 'Line Side Connection';
    const utilityRequiresFused = utilityRequiresFusedDisconnect(utilityRequirements);

    return isDetachedService && isLineSideTap && utilityRequiresFused;
  };

  /**
   * Search BOS slots for existing fused AC disconnect
   */
  const findExistingFusedDisconnect = () => {
    const sysNum = isCombinedSystem ? 1 : systemNumber;
    const slots = ['type1', 'type2', 'type3', 'type4', 'type5', 'type6'];

    for (const slot of slots) {
      const prefix = `bos_sys${sysNum}_${slot}`;
      const equipType = formData[`${prefix}_equipment_type`] || '';
      const isActive = formData[`${prefix}_active`] === 'true' || formData[`${prefix}_active`] === true;

      const normalizedType = equipType.toLowerCase();
      const isFusedDisconnect = normalizedType.includes('fused') && normalizedType.includes('disconnect');

      if (isActive && isFusedDisconnect) {
        return {
          found: true,
          slot: prefix,
          make: formData[`${prefix}_make`] || '',
          model: formData[`${prefix}_model`] || '',
          ampRating: formData[`${prefix}_amp_rating`] || '',
          wattage: formData[`${prefix}_wattage`] || '',
          isNew: formData[`${prefix}_is_new`] === 'New' || formData[`${prefix}_is_new`] === true
        };
      }
    }

    return { found: false };
  };

  /**
   * Find next available BOS slot for new tap disconnect
   */
  const findNextAvailableBosSlot = () => {
    const sysNum = isCombinedSystem ? 1 : systemNumber;
    const slots = ['type1', 'type2', 'type3', 'type4', 'type5', 'type6'];

    for (const slot of slots) {
      const prefix = `bos_sys${sysNum}_${slot}`;
      const isActive = formData[`${prefix}_active`];
      const equipType = formData[`${prefix}_equipment_type`];

      if (!isActive && !equipType) {
        return prefix;
      }
    }
    return null;
  };

  // ============================================
  // FILTERED POI OPTIONS (120% RULE)
  // ============================================

  const getFilteredPoiOptions = () => {
    if (pcsCalculations.violates120Rule) {
      return POI_TYPE_OPTIONS.filter(opt => opt.value !== 'PV Breaker (OCPD)');
    }
    return POI_TYPE_OPTIONS;
  };

  const filteredPoiOptions = getFilteredPoiOptions();

  // ============================================
  // AUTO-CLEAR POI TYPE IF VIOLATES 120% RULE
  // ============================================

  useEffect(() => {
    if (pcsCalculations.violates120Rule && poiType === 'PV Breaker (OCPD)') {
      console.debug('[POI] Clearing PV Breaker (OCPD) due to 120% rule violation');
      onChange(poiTypeFieldName, '');
    }
  }, [pcsCalculations.violates120Rule, poiType, onChange, poiTypeFieldName]);

  // ============================================
  // AUTO-SELECT CONDUCTOR SIZE WHEN BREAKER CHANGES
  // ============================================

  useEffect(() => {
    if (showCustomBreakerFields && selectedBreakerSize && !selectedConductorSize) {
      // Auto-select the minimum valid wire gauge (first option)
      const validOptions = getFilteredConductorOptions();
      if (validOptions.length > 0) {
        console.debug('[POI] Auto-selecting conductor size:', validOptions[0].value);
        onChange(conductorSizeFieldName, validOptions[0].value);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBreakerSize, showCustomBreakerFields]);

  // ============================================
  // AUTO-SELECT POI LOCATION WHEN ONLY ONE OPTION
  // ============================================

  useEffect(() => {
    // Only auto-select if POI type is selected and location is not already set
    if (poiType && !formData[locationFieldName] && locationOptions.length === 1) {
      console.debug('[POI] Auto-selecting location (only option):', locationOptions[0].value);
      onChange(locationFieldName, locationOptions[0].value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poiType, locationOptions.length]);

  // ============================================
  // AUTO-CLEAR PCS WHEN CONDITIONS NO LONGER MET
  // ============================================

  const prevShowPowerControlRef = React.useRef(showPowerControl);

  useEffect(() => {
    // Only clear if power control was previously active and is now being deactivated
    // Don't run on initial mount
    const currentPcsValue = formData[pcsFieldName];
    const wasActive = prevShowPowerControlRef.current;
    const isNowInactive = !showPowerControl;

    if (wasActive && isNowInactive && currentPcsValue) {
      const pcsSettingsField = systemNumber === 1 ? 'sys1_pcs_settings' : 'sys2_pcs_settings';
      console.debug('[POI] Power Control deactivated - clearing BOTH fields:', {
        field1: pcsFieldName,
        field2: pcsSettingsField
      });
      // Clear pcs_amps (set to empty) and pcs_settings (set to false)
      onChange(pcsFieldName, '');
      onChange(pcsSettingsField, false);
    }

    // Update ref for next render
    prevShowPowerControlRef.current = showPowerControl;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPowerControl, formData[pcsFieldName], pcsFieldName, systemNumber]);

  // ============================================
  // AUTO-SELECT RECOMMENDED PCS VALUE
  // ============================================

  useEffect(() => {
    // Only auto-select PCS amps when Power Control is actually active (battery present)
    if (showPowerControl && pcsCalculations.recommendedPcsAmps) {
      const currentPcsAmps = parseInt(formData[pcsFieldName]) || 0;
      const recommended = parseInt(pcsCalculations.recommendedPcsAmps) || 0;

      // Auto-select if not set or exceeds allowable
      if (currentPcsAmps === 0 || currentPcsAmps > (pcsCalculations.allowableBackfeed ?? 0)) {
        console.debug('[POI] Auto-selecting recommended PCS amps:', recommended);
        onChange(pcsFieldName, pcsCalculations.recommendedPcsAmps);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPowerControl, pcsCalculations.recommendedPcsAmps, pcsCalculations.allowableBackfeed, formData[pcsFieldName], pcsFieldName]);

  // ============================================
  // TAP DISCONNECT DETECTION
  // ============================================

  useEffect(() => {
    const scenarioActive = isTapDisconnectScenario();

    if (!scenarioActive) {
      // Clear detection if scenario no longer applies
      if (formData[getFieldName('tap_disconnect_detected')]) {
        onChange(getFieldName('tap_disconnect_detected'), false);
      }
      return;
    }

    // Mark as detected
    if (!formData[getFieldName('tap_disconnect_detected')]) {
      onChange(getFieldName('tap_disconnect_detected'), true);
    }

    // Check if user already made a choice
    const useExisting = formData[getFieldName('tap_disconnect_use_existing')];
    if (useExisting !== null && useExisting !== undefined) {
      return;
    }

    // Search for existing fused disconnect in System BOS
    const existing = findExistingFusedDisconnect();

    if (existing.found) {
      setExistingDisconnect(existing);
      setShowTapDisconnectPrompt(true);
    } else {
      setShowAddTapDisconnectPrompt(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData[poiTypeFieldName], formData.ele_ses_type, utilityRequirements]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleActivatePcs = () => {
    console.debug('[POI] Manually activating PCS');
    onChange(pcsSettingsFieldName, true);
  };

  const handleDeactivatePcs = () => {
    console.debug('[POI] Deactivating PCS');
    onChange(pcsSettingsFieldName, false);
    onChange(pcsFieldName, '');
  };

  /**
   * User chooses to use existing BOS disconnect as tap disconnect
   */
  const handleUseExistingDisconnect = () => {
    if (!existingDisconnect) return;

    onChange(getFieldName('tap_disconnect_use_existing'), true);
    onChange(getFieldName('tap_disconnect_source'), 'system_bos');
    onChange(getFieldName('tap_disconnect_linked_bos_slot'), existingDisconnect.slot);
    onChange(getFieldName('tap_disconnect_make'), existingDisconnect.make);
    onChange(getFieldName('tap_disconnect_model'), existingDisconnect.model);
    onChange(getFieldName('tap_disconnect_amp_rating'), existingDisconnect.ampRating);
    onChange(getFieldName('tap_disconnect_wattage'), existingDisconnect.wattage);
    onChange(getFieldName('tap_disconnect_is_new'), existingDisconnect.isNew);

    // Mark BOS slot as tap disconnect
    onChange(`${existingDisconnect.slot}_trigger`, 'tap_disconnect');

    setShowTapDisconnectPrompt(false);
    setExistingDisconnect(null);
  };

  /**
   * User chooses to add a new tap disconnect via POI
   */
  const handleAddNewDisconnect = () => {
    onChange(getFieldName('tap_disconnect_use_existing'), false);
    onChange(getFieldName('tap_disconnect_source'), 'poi');

    // Create BOS slot for the new tap disconnect
    const newSlot = findNextAvailableBosSlot();
    if (newSlot) {
      onChange(`${newSlot}_equipment_type`, 'Fused AC Disconnect');
      onChange(`${newSlot}_active`, 'true');
      onChange(`${newSlot}_trigger`, 'tap_disconnect');
      onChange(`${newSlot}_show`, 'true');
      onChange(getFieldName('tap_disconnect_linked_bos_slot'), newSlot);
    }

    setShowTapDisconnectPrompt(false);
    setShowAddTapDisconnectPrompt(false);
    setExistingDisconnect(null);
  };

  /**
   * Handle tap disconnect field changes - mirror to BOS
   */
  const handleTapDisconnectChange = (field, value) => {
    const fullFieldName = getFieldName(field);
    onChange(fullFieldName, value);

    // Mirror to linked BOS slot
    const linkedSlot = formData[getFieldName('tap_disconnect_linked_bos_slot')];
    if (linkedSlot) {
      const bosFieldMap = {
        'tap_disconnect_make': 'make',
        'tap_disconnect_model': 'model',
        'tap_disconnect_amp_rating': 'amp_rating',
        'tap_disconnect_wattage': 'wattage',
        'tap_disconnect_is_new': 'is_new'
      };

      if (bosFieldMap[field]) {
        const bosValue = field === 'tap_disconnect_is_new' ? (value ? 'New' : 'Existing') : value;
        onChange(`${linkedSlot}_${bosFieldMap[field]}`, bosValue);
      }
    }
  };

  /**
   * Allow user to change their tap disconnect choice
   */
  const handleChangeTapDisconnect = () => {
    onChange(getFieldName('tap_disconnect_use_existing'), null);
    const existing = findExistingFusedDisconnect();
    if (existing.found) {
      setExistingDisconnect(existing);
      setShowTapDisconnectPrompt(true);
    } else {
      setShowAddTapDisconnectPrompt(true);
    }
  };

  // ============================================
  // EXPANDED STATE
  // ============================================

  const [isExpanded, setIsExpanded] = useState(false);

  // ============================================
  // DELETE HANDLER
  // ============================================

  const handleDelete = () => {
    setShowClearConfirm(true);
  };

  const handleConfirmClear = () => {
    onChange(poiTypeFieldName, '');
    onChange('el_poi_breaker_rating', '');
    onChange('el_poi_disconnect_rating', '');
    onChange(locationFieldName, '');
    onChange(pcsFieldName, '');
    onChange(pcsSettingsFieldName, false); // Clear PCS settings to sync with Gateway Config
    onChange(breakerConductorModeFieldName, 'auto');
    onChange(breakerSizeFieldName, '');
    onChange(conductorSizeFieldName, '');

    // Clear tap disconnect fields
    onChange(getFieldName('tap_disconnect_detected'), false);
    onChange(getFieldName('tap_disconnect_use_existing'), null);
    onChange(getFieldName('tap_disconnect_source'), null);
    onChange(getFieldName('tap_disconnect_linked_bos_slot'), null);
    onChange(getFieldName('tap_disconnect_make'), '');
    onChange(getFieldName('tap_disconnect_model'), '');
    onChange(getFieldName('tap_disconnect_amp_rating'), '');
    onChange(getFieldName('tap_disconnect_wattage'), '');
    onChange(getFieldName('tap_disconnect_is_new'), true);
    onChange(getFieldName('tap_disconnect_sizing_mode'), 'auto');
    onChange(getFieldName('tap_disconnect_equipment_id'), null);

    setShowClearConfirm(false);
  };

  // ============================================
  // DERIVED VALUES FOR EQUIPMENT ROW
  // ============================================

  const isComplete = !!(poiType && formData[locationFieldName]);

  // Build subtitle with POI type, location, and PCS Amps if active
  const subtitleParts = [];
  if (poiType) subtitleParts.push(poiType);
  if (formData[locationFieldName]) subtitleParts.push(formData[locationFieldName]);
  if (showPowerControl && formData[pcsFieldName]) {
    subtitleParts.push(`PCS: ${formData[pcsFieldName]}A`);
  }
  const subtitle = subtitleParts.join(' | ') || undefined;

  const fields = [
    { label: 'Method', value: poiType },
    showBreakerRating && { label: 'Breaker Rating', value: formData.el_poi_breaker_rating },
    showDisconnectRating && { label: 'Disconnect Rating', value: formData.el_poi_disconnect_rating },
    { label: 'Location', value: formData[locationFieldName] },
    pcsCalculations.maxContinuousOutputAmps !== null && {
      label: 'Max Output (125%)',
      value: pcsCalculations.maxContinuousOutput125 ? `${pcsCalculations.maxContinuousOutput125.toFixed(1)} Amps` : '—'
    },
    showPowerControl && { label: 'PCS Setting', value: formData[pcsFieldName] },
  ].filter(Boolean);

  // ============================================
  // RENDER
  // ============================================

  return (
    <>
    <EquipmentRow
      title={displayTitle}
      subtitle={subtitle}
      isComplete={isComplete}
      expanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
      fields={fields}
      onDelete={handleDelete}
    >
      {/* POI Type */}
      <TableDropdown
        label="POI Type"
        value={poiType}
        onChange={(value) => onChange(poiTypeFieldName, value)}
        options={filteredPoiOptions}
        placeholder="Select type..."
      />

      {/* Breaker/Conductor Sizing Mode - Auto/Custom */}
      {showBreakerConductorControls && (
        <FormFieldRow label="Breaker/Conductor Sizing">
          <TableRowButton
            label="Auto"
            variant="outline"
            active={breakerConductorMode === 'auto'}
            onClick={() => {
              onChange(breakerConductorModeFieldName, 'auto');
              // Clear custom fields when switching to auto
              onChange(breakerSizeFieldName, '');
              onChange(conductorSizeFieldName, '');
            }}
          />
          <TableRowButton
            label="Custom"
            variant="outline"
            active={breakerConductorMode === 'custom'}
            onClick={() => onChange(breakerConductorModeFieldName, 'custom')}
          />
        </FormFieldRow>
      )}

      {/* Custom Breaker Size */}
      {showCustomBreakerFields && (
        <TableDropdown
          label="Breaker Size"
          value={selectedBreakerSize}
          onChange={(value) => {
            onChange(breakerSizeFieldName, value);
            // Clear conductor size when breaker size changes
            onChange(conductorSizeFieldName, '');
          }}
          options={breakerSizeOptions}
          placeholder="Select breaker size..."
        />
      )}

      {/* Custom Conductor Size - Only show after breaker size is selected */}
      {showCustomBreakerFields && selectedBreakerSize && (
        <TableDropdown
          label="Conductor Size"
          value={selectedConductorSize}
          onChange={(value) => onChange(conductorSizeFieldName, value)}
          options={filteredConductorOptions}
          placeholder="Select conductor size..."
        />
      )}

      {/* Fused AC Disconnect - For Tap types and Meter Collar */}
      {showDisconnectRating && (
        <TableDropdown
          label="Fused AC Disconnect (Amps)"
          value={formData.el_poi_disconnect_rating || ''}
          onChange={(value) => onChange('el_poi_disconnect_rating', value)}
          options={[20, 30, 40, 50, 60, 80, 100, 125, 150, 175, 200].map(v => ({ value: v.toString(), label: v.toString() }))}
          placeholder="Select rating..."
        />
      )}

      {/* POI Location */}
      {poiType && (
        <TableDropdown
          label="POI Location"
          value={formData[locationFieldName] || ''}
          onChange={(value) => onChange(locationFieldName, value)}
          options={locationOptions}
          placeholder="Select location..."
        />
      )}

      {/* 120% Rule Violation Warning (Non-Battery Systems) */}
      {pcsCalculations.violates120Rule && (
        <div style={{ padding: '0 var(--spacing) var(--spacing)' }}>
          <Alert variant="warning" collapsible={false}>
            <strong>120% Rule Violation:</strong> PV Breaker violates the 120% rule.
            Derate the main breaker to activate PV Breaker as an option.
          </Alert>
        </div>
      )}

      {/* Manual PCS Activation Button */}
      {pcsCalculations.canManualTriggerPCS && !showPowerControl && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: 'var(--spacing-tight) var(--spacing)',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <TableRowButton
            label="Activate PCS"
            variant="outline"
            onClick={handleActivatePcs}
            style={{ width: '100%' }}
          />
        </div>
      )}

      {/* PCS Active State (Auto-triggered or Manual) */}
      {showPowerControl && (
        <>
          {/* Alert Message */}
          <div style={{ padding: '0 var(--spacing) var(--spacing-tight)' }}>
            {pcsCalculations.shouldAutoTriggerPCS ? (
              <Alert variant="warning" collapsible={false}>
                <strong>Power Control System Activated:</strong> System output exceeds
                allowable backfeed. PCS will throttle current to {pcsCalculations.allowableBackfeed} Amps.
              </Alert>
            ) : (
              <Alert variant="info" collapsible={false}>
                <strong>Power Control System Active:</strong> Manual activation enabled.
              </Alert>
            )}
          </div>

          {/* PCS Amps Dropdown */}
          <TableDropdown
            label="PCS Setting (Amps)"
            value={formData[pcsFieldName]?.toString() || pcsCalculations.recommendedPcsAmps || ''}
            onChange={(value) => {
              const pcsSettingsField = systemNumber === 1 ? 'sys1_pcs_settings' : 'sys2_pcs_settings';
              console.log('[POI] PCS Setting onChange - Saving to BOTH fields:', {
                field1: pcsFieldName,
                field2: pcsSettingsField,
                ampValue: value,
                booleanValue: true,
              });
              // Save amp value to pcs_amps (integer field)
              onChange(pcsFieldName, value);
              // Save true to pcs_settings (boolean field) to indicate PCS is active
              onChange(pcsSettingsField, true);
            }}
            options={pcsCalculations.filteredPcsAmpsOptions}
            placeholder="Select amps..."
          />

          {/* PCS Note */}
          <div style={{
            padding: 'var(--spacing-tight) var(--spacing)',
            color: 'var(--text-muted)',
            fontSize: 'var(--text-xs)',
          }}>
            PCS Settings only throttle the current (amps). To change the SMS breaker
            rating, see the SMS Section.
          </div>

          {/* Deactivate Button (Manual PCS only) */}
          {manualPcsActivated && !pcsCalculations.shouldAutoTriggerPCS && (
            <div style={{ padding: '0 var(--spacing) var(--spacing)' }}>
              <button
                type="button"
                onClick={handleDeactivatePcs}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  padding: 'var(--spacing-tight)',
                  background: 'transparent',
                  border: 'var(--border-thin) solid var(--color-error)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-error)',
                  fontSize: 'var(--text-sm)',
                  cursor: 'pointer',
                  transition: 'var(--transition-base)',
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'var(--color-error-light)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                Deactivate Power Control System
              </button>
            </div>
          )}
        </>
      )}

      {/* Tap Disconnect Section - shown when scenario is triggered */}
      {isTapDisconnectScenario() && (
        <>
          {formData[getFieldName('tap_disconnect_use_existing')] === true ? (
            // Using existing BOS disconnect - show info banner
            <div style={{ padding: '0 var(--spacing) var(--spacing)' }}>
              <Alert variant="success" collapsible={false}>
                <strong>Tap Disconnect:</strong> Using {formData[getFieldName('tap_disconnect_make')]} {formData[getFieldName('tap_disconnect_model')]} ({formData[getFieldName('tap_disconnect_amp_rating')]}A) from System BOS
              </Alert>
              <div style={{ marginTop: 'var(--spacing-tight)' }}>
                <TableRowButton
                  label="Change Tap Disconnect"
                  variant="ghost"
                  onClick={handleChangeTapDisconnect}
                />
              </div>
            </div>
          ) : formData[getFieldName('tap_disconnect_source')] === 'poi' ? (
            // Input fields for new tap disconnect entered via POI
            <>
              <div style={{ padding: 'var(--spacing-tight) var(--spacing)', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 'var(--font-size-small)', color: 'var(--text-secondary)', fontWeight: 'var(--font-weight-medium)' }}>
                  Tap Disconnect (Fused AC) - Required per utility
                </span>
              </div>

              <TableDropdown
                label="Sizing Mode"
                value={formData[getFieldName('tap_disconnect_sizing_mode')] || 'auto'}
                onChange={(value) => handleTapDisconnectChange('tap_disconnect_sizing_mode', value)}
                options={[
                  { value: 'auto', label: 'Auto-size' },
                  { value: 'custom', label: 'Custom' }
                ]}
              />

              {formData[getFieldName('tap_disconnect_sizing_mode')] === 'custom' && (
                <>
                  <TableDropdown
                    label="Manufacturer"
                    value={formData[getFieldName('tap_disconnect_make')] || ''}
                    onChange={(value) => handleTapDisconnectChange('tap_disconnect_make', value)}
                    options={[
                      { value: 'Eaton', label: 'Eaton' },
                      { value: 'Square D', label: 'Square D' },
                      { value: 'Siemens', label: 'Siemens' },
                      { value: 'Leviton', label: 'Leviton' },
                      { value: 'MidNite Solar', label: 'MidNite Solar' },
                      { value: 'OutBack Power', label: 'OutBack Power' },
                      { value: 'Other', label: 'Other' }
                    ]}
                    placeholder="Select manufacturer..."
                  />

                  <TableDropdown
                    label="Model"
                    value={formData[getFieldName('tap_disconnect_model')] || ''}
                    onChange={(value) => handleTapDisconnectChange('tap_disconnect_model', value)}
                    options={[
                      { value: 'DPF222R', label: 'DPF222R' },
                      { value: 'DPF223R', label: 'DPF223R' },
                      { value: 'HF361R', label: 'HF361R' },
                      { value: 'HF362R', label: 'HF362R' },
                      { value: 'Other', label: 'Other' }
                    ]}
                    placeholder="Select model..."
                  />
                </>
              )}

              <TableDropdown
                label="Amp Rating"
                value={formData[getFieldName('tap_disconnect_amp_rating')]?.toString() || ''}
                onChange={(value) => handleTapDisconnectChange('tap_disconnect_amp_rating', value)}
                options={[30, 60, 100, 200, 400].map(v => ({ value: v.toString(), label: `${v}A` }))}
                placeholder="Select rating..."
              />

              <FormFieldRow label="Wattage">
                <FormInput
                  type="number"
                  value={formData[getFieldName('tap_disconnect_wattage')] || ''}
                  onChange={(e) => handleTapDisconnectChange('tap_disconnect_wattage', e.target.value)}
                  placeholder="Enter wattage..."
                />
              </FormFieldRow>

              <TableDropdown
                label="New/Existing"
                value={formData[getFieldName('tap_disconnect_is_new')] === true ? 'New' : formData[getFieldName('tap_disconnect_is_new')] === false ? 'Existing' : ''}
                onChange={(value) => handleTapDisconnectChange('tap_disconnect_is_new', value === 'New')}
                options={[
                  { value: 'New', label: 'New' },
                  { value: 'Existing', label: 'Existing' }
                ]}
              />

              <div style={{ marginTop: 'var(--spacing-tight)', padding: '0 var(--spacing)' }}>
                <TableRowButton
                  label="Change Tap Disconnect"
                  variant="ghost"
                  onClick={handleChangeTapDisconnect}
                />
              </div>
            </>
          ) : null}
        </>
      )}
    </EquipmentRow>

    {/* Modal: Use existing fused disconnect from System BOS? */}
    <Modal
      isOpen={showTapDisconnectPrompt && existingDisconnect !== null}
      onClose={() => setShowTapDisconnectPrompt(false)}
      title="Tap Disconnect Found"
    >
      <div style={{ padding: 'var(--spacing)' }}>
        <p style={{ marginBottom: 'var(--spacing)' }}>
          A fused AC disconnect was found in your System BOS equipment:
        </p>
        <p style={{
          fontWeight: 'var(--font-weight-semibold)',
          margin: 'var(--spacing) 0',
          padding: 'var(--spacing)',
          backgroundColor: 'var(--surface-secondary)',
          borderRadius: 'var(--radius-md)'
        }}>
          {existingDisconnect?.make} {existingDisconnect?.model} ({existingDisconnect?.ampRating}A)
        </p>
        <p style={{ marginBottom: 'var(--spacing-loose)' }}>
          Would you like to use this as your tap disconnect for the Line Side Tap?
        </p>
        <div style={{ display: 'flex', gap: 'var(--spacing)', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={handleAddNewDisconnect}>
            No, add new
          </Button>
          <Button variant="primary" onClick={handleUseExistingDisconnect}>
            Yes, use this
          </Button>
        </div>
      </div>
    </Modal>

    {/* Modal: No existing disconnect - prompt to add */}
    <Modal
      isOpen={showAddTapDisconnectPrompt}
      onClose={() => setShowAddTapDisconnectPrompt(false)}
      title="Fused AC Disconnect Required"
    >
      <div style={{ padding: 'var(--spacing)' }}>
        <p style={{ marginBottom: 'var(--spacing)' }}>
          This utility requires a <strong>Fused AC Disconnect</strong> for Line Side Tap interconnection.
        </p>
        <p style={{ marginBottom: 'var(--spacing-loose)' }}>
          No fused AC disconnect was found in your System BOS. Would you like to add one now?
        </p>
        <div style={{ display: 'flex', gap: 'var(--spacing)', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setShowAddTapDisconnectPrompt(false)}>
            Later
          </Button>
          <Button variant="primary" onClick={handleAddNewDisconnect}>
            Add Tap Disconnect
          </Button>
        </div>
      </div>
    </Modal>

    <SectionClearModal
      isOpen={showClearConfirm}
      onClose={() => setShowClearConfirm(false)}
      onConfirm={handleConfirmClear}
      sectionName="Point of Interconnection"
      fieldCount={5}
    />
    </>
  );
};

export default PointOfInterconnectionSection;
