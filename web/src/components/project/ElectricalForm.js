import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import MainCircuitBreakersSection from './electrical/MainCircuitBreakersSection';
import MainPanelASection from './electrical/MainPanelASection';
import SubPanelBSection from './electrical/SubPanelBSection';
import SubPanelCSection from './electrical/SubPanelCSection';
import SubPanelDSection from './electrical/SubPanelDSection';
import BackupConfigurationSection from './electrical/BackupConfigurationSection';
import PointOfInterconnectionSection from './electrical/PointOfInterconnectionSection';
import FormNavigationFooter from './FormNavigationFooter';
import { SectionHeader } from '../ui';
import equipStyles from './EquipmentForm.module.css';
import { useSystemDetails } from '../../hooks/useSystemDetails';
import { calculateMaxContinuousOutput } from '../../utils/pcsUtils';

/**
 * ElectricalForm - Electrical configuration component
 * Handles all electrical panel and POI configurations
 */
const ElectricalForm = ({ projectUuid, projectData, onNavigateToTab }) => {
  console.debug('[ElectricalForm] Rendering with projectUuid:', projectUuid);

  // ============================================
  // SYSTEM DETAILS HOOK (API INTEGRATION)
  // ============================================

  const {
    data: systemDetails,
    loading,
    error,
    updateField,
    updateFields,
    clearFields,
    getField,
  } = useSystemDetails({ projectUuid });

  // ============================================
  // NAVIGATION HANDLERS
  // ============================================

  const handlePrev = () => {
    if (onNavigateToTab) {
      onNavigateToTab('equipment', { subTab: 'bos' });
    }
  };

  const handleNext = () => {
    if (onNavigateToTab) {
      onNavigateToTab('structural');
    }
  };

  // ============================================
  // FIELD CHANGE HANDLER
  // ============================================

  const handleFieldChange = async (field, value) => {
    console.debug(`[ElectricalForm] Field change: ${field} =`, value);

    try {
      await updateField(field, value);
    } catch (err) {
      console.error(`[ElectricalForm] Failed to update field ${field}:`, err);
    }
  };

  // ============================================
  // CLEAR HANDLERS
  // ============================================

  const handleClearMainCircuitBreakers = async () => {
    console.debug('[ElectricalForm] Clearing Main Circuit Breakers');
    try {
      await clearFields(['ele_ses_type', 'ele_main_circuit_breakers_qty']);
    } catch (err) {
      console.error('[ElectricalForm] Failed to clear Main Circuit Breakers:', err);
    }
  };

  const handleClearMainPanelA = async () => {
    console.debug('[ElectricalForm] Clearing Main Panel A');
    try {
      await clearFields([
        'ele_bus_bar_rating',
        'ele_main_circuit_breaker_rating',
        'ele_feeder_location_on_bus_bar',
        'el_mpa_derated',
        'mpa_bus_bar_existing',
        'mpa_main_circuit_breaker_existing',
      ]);
    } catch (err) {
      console.error('[ElectricalForm] Failed to clear Main Panel A:', err);
    }
  };

  const handleClearSubPanelB = async () => {
    console.debug('[ElectricalForm] Clearing Sub Panel B');
    try {
      await clearFields([
        'show_sub_panel_b',
        'spb_activated',
        'spb_subpanel_existing',
        'spb_subpanelb_mcbexisting',
        'spb_bus_bar_rating',
        'spb_main_breaker_rating',
        'spb_subpanel_b_feeder_location',
        'spb_upstream_breaker_rating',
        'spb_conductor_sizing',
        'spb_tie_in_location',
        'el_spb_derated',
      ]);
    } catch (err) {
      console.error('[ElectricalForm] Failed to clear Sub Panel B:', err);
    }
  };

  const handleClearPOI = async () => {
    console.debug('[ElectricalForm] Clearing Point of Interconnection');
    try {
      await clearFields([
        'ele_method_of_interconnection',
        'el_poi_breaker_rating',
        'el_poi_disconnect_rating',
        'ele_breaker_location',
        'sys1_pcs_amps',
        'sys1_pcs_settings',
        'sys2_ele_method_of_interconnection',
        'sys2_ele_breaker_location',
        'sys2_pcs_amps',
        'sys2_pcs_settings',
        'sys3_ele_method_of_interconnection',
        'sys3_ele_breaker_location',
        'sys3_pcs_amps',
        'sys3_pcs_settings',
        'sys4_ele_method_of_interconnection',
        'sys4_ele_breaker_location',
        'sys4_pcs_amps',
        'sys4_pcs_settings',
      ]);
    } catch (err) {
      console.error('[ElectricalForm] Failed to clear POI:', err);
    }
  };

  // ============================================
  // PCS DATA EXTRACTION (SYSTEM 1)
  // ============================================

  // Extract battery data for System 1
  const batteryData = useMemo(() => {
    if (!systemDetails) return {};

    return {
      battery1_make: getField('sys1_battery_1_make'), // Fixed: Matches EquipmentForm mapping
      battery1_model: getField('sys1_battery_1_model'), // Fixed: Matches EquipmentForm mapping
      battery1_qty: getField('sys1_battery_1_qty'), // Fixed: Matches EquipmentForm mapping
      battery2_make: getField('sys1_battery_2_make'), // Fixed: Matches EquipmentForm mapping
      battery2_model: getField('sys1_battery_2_model'), // Fixed: Matches EquipmentForm mapping
      battery2_qty: getField('sys1_battery_2_qty'), // Fixed: Matches EquipmentForm mapping
    };
  }, [systemDetails, getField]);

  // Extract inverter data for System 1
  const inverterData = useMemo(() => {
    if (!systemDetails) return {};

    return {
      inverter_make: getField('sys1_inverter_make'),
      inverter_model: getField('sys1_inverter_model'),
      inverter_type: getField('sys1_inverter_type'),
      microinverter_qty: getField('sys1_inverter_quantity'),
      max_cont_output_amps: getField('sys1_inv_max_continuous_output'), // Fixed: Matches EquipmentForm mapping
    };
  }, [systemDetails, getField]);

  // Extract panel data for System 1
  const panelData = useMemo(() => {
    if (!systemDetails) return {};

    return {
      bus_bar_rating: getField('ele_bus_bar_rating'),
      main_breaker_rating: getField('ele_main_circuit_breaker_rating'),
    };
  }, [systemDetails, getField]);

  // ============================================
  // COMBINED SYSTEMS DETECTION
  // ============================================

  // Extract field values (these are stable primitive values)
  const eleCombinePositionsValue = getField('ele_combine_positions');
  const sys1InvMaxOutput = getField('sys1_inv_max_continuous_output');
  const sys2InvMaxOutput = getField('sys2_inv_max_continuous_output');
  const sys3InvMaxOutput = getField('sys3_inv_max_continuous_output');
  const sys4InvMaxOutput = getField('sys4_inv_max_continuous_output');

  // Extract equipment presence indicators for active system detection
  const sys1InverterMake = getField('sys1_inverter_make');
  const sys1SolarPanelMake = getField('sys1_solar_panel_make');
  const sys2InverterMake = getField('sys2_inverter_make');
  const sys2SolarPanelMake = getField('sys2_solar_panel_make');
  const sys3InverterMake = getField('sys3_inverter_make');
  const sys3SolarPanelMake = getField('sys3_solar_panel_make');
  const sys4InverterMake = getField('sys4_inverter_make');
  const sys4SolarPanelMake = getField('sys4_solar_panel_make');

  // Detection: Are systems combined?
  const isCombinedSystem = useMemo(() => {
    // NULL/empty/"Do Not" = NOT combined, Has JSON = combined
    if (!eleCombinePositionsValue || !eleCombinePositionsValue.trim) return false;
    const trimmed = eleCombinePositionsValue.trim();
    if (trimmed.length === 0 || trimmed === 'Do Not') return false;

    const combined = true; // Has a value that's not "Do Not"
    console.debug('[ElectricalForm] isCombinedSystem:', combined, 'ele_combine_positions:', eleCombinePositionsValue);
    return combined;
  }, [eleCombinePositionsValue]);

  // Parse active systems array
  const combinePositions = useMemo(() => {
    if (!eleCombinePositionsValue) return null;
    try {
      const parsed = JSON.parse(eleCombinePositionsValue);
      console.debug('[ElectricalForm] Parsed combine positions:', parsed);
      return parsed;
    } catch (err) {
      console.warn('[ElectricalForm] Failed to parse ele_combine_positions:', err);
      return null;
    }
  }, [eleCombinePositionsValue]);

  // Detect active systems based on equipment presence
  const activeSystems = useMemo(() => {
    // If systems are combined, use the active_systems from ele_combine_positions
    if (isCombinedSystem && combinePositions?.active_systems) {
      console.debug('[ElectricalForm] Active systems (from combine config):', combinePositions.active_systems);
      return combinePositions.active_systems;
    }

    // If NOT combined, detect active systems from equipment presence
    const systems = [];

    // System 1: Check for any equipment
    if (sys1InverterMake || sys1SolarPanelMake) {
      systems.push(1);
    }

    // System 2: Check for any equipment
    if (sys2InverterMake || sys2SolarPanelMake) {
      systems.push(2);
    }

    // System 3: Check for any equipment
    if (sys3InverterMake || sys3SolarPanelMake) {
      systems.push(3);
    }

    // System 4: Check for any equipment
    if (sys4InverterMake || sys4SolarPanelMake) {
      systems.push(4);
    }

    console.debug('[ElectricalForm] Active systems (detected from equipment):', systems);
    return systems;
  }, [
    isCombinedSystem,
    combinePositions,
    sys1InverterMake,
    sys1SolarPanelMake,
    sys2InverterMake,
    sys2SolarPanelMake,
    sys3InverterMake,
    sys3SolarPanelMake,
    sys4InverterMake,
    sys4SolarPanelMake,
  ]);

  // Calculate combined max output for merged systems
  const combinedSystemMaxOutput = useMemo(() => {
    if (!isCombinedSystem || activeSystems.length === 0) {
      return null;
    }

    let totalOutput = 0;

    // Sum System 1 output
    if (activeSystems.includes(1)) {
      const sys1Output = parseFloat(sys1InvMaxOutput) || 0;
      totalOutput += sys1Output;
      console.debug('[ElectricalForm] System 1 output:', sys1Output);
    }

    // Sum System 2 output
    if (activeSystems.includes(2)) {
      const sys2Output = parseFloat(sys2InvMaxOutput) || 0;
      totalOutput += sys2Output;
      console.debug('[ElectricalForm] System 2 output:', sys2Output);
    }

    // Sum System 3 output (future expansion)
    if (activeSystems.includes(3)) {
      const sys3Output = parseFloat(sys3InvMaxOutput) || 0;
      totalOutput += sys3Output;
      console.debug('[ElectricalForm] System 3 output:', sys3Output);
    }

    // Sum System 4 output (future expansion)
    if (activeSystems.includes(4)) {
      const sys4Output = parseFloat(sys4InvMaxOutput) || 0;
      totalOutput += sys4Output;
      console.debug('[ElectricalForm] System 4 output:', sys4Output);
    }

    const result = totalOutput > 0 ? totalOutput : null;
    console.debug('[ElectricalForm] Combined system max output:', result);
    return result;
  }, [isCombinedSystem, activeSystems, sys1InvMaxOutput, sys2InvMaxOutput, sys3InvMaxOutput, sys4InvMaxOutput]);

  // ============================================
  // HELPER FUNCTIONS FOR MULTI-SYSTEM POI
  // ============================================

  /**
   * Get battery data for a specific system number
   */
  const getSystemBatteryData = useCallback((systemNum) => {
    if (!systemDetails) return {};

    const prefix = `sys${systemNum}_`;
    return {
      battery1_make: getField(`${prefix}battery_1_make`) || getField(`${prefix}battery1_make`),
      battery1_model: getField(`${prefix}battery_1_model`) || getField(`${prefix}battery1_model`),
      battery1_qty: getField(`${prefix}battery_1_qty`) || getField(`${prefix}battery1_qty`),
      battery2_make: getField(`${prefix}battery_2_make`) || getField(`${prefix}battery2_make`),
      battery2_model: getField(`${prefix}battery_2_model`) || getField(`${prefix}battery2_model`),
      battery2_qty: getField(`${prefix}battery_2_qty`) || getField(`${prefix}battery2_qty`),
    };
  }, [systemDetails, getField]);

  /**
   * Get inverter data for a specific system number
   */
  const getSystemInverterData = useCallback((systemNum) => {
    if (!systemDetails) return {};

    const prefix = `sys${systemNum}_`;
    return {
      inverter_make: getField(`${prefix}inverter_make`),
      inverter_model: getField(`${prefix}inverter_model`),
      inverter_type: getField(`${prefix}inverter_type`),
      microinverter_qty: getField(`${prefix}inverter_quantity`),
      max_cont_output_amps: getField(`${prefix}inv_max_continuous_output`),
    };
  }, [systemDetails, getField]);

  /**
   * Handle field changes for specific system
   * Maps field names to correct system-prefixed database fields
   */
  const handleSystemFieldChange = useCallback(async (systemNum, field, value) => {
    console.debug(`[ElectricalForm] System ${systemNum} field change: ${field} =`, value);

    // Map generic field names to system-specific database fields
    const fieldMapping = {
      1: {
        'ele_breaker_location': 'ele_breaker_location',
        'pcs_amps': 'sys1_pcs_amps',
        'pcs_settings': 'sys1_pcs_settings',
      },
      2: {
        'ele_breaker_location': 'sys2_ele_breaker_location',
        'pcs_amps': 'sys2_pcs_amps',
        'pcs_settings': 'sys2_pcs_settings',
      },
      3: {
        'ele_breaker_location': 'sys3_ele_breaker_location',
        'pcs_amps': 'sys3_pcs_amps',
        'pcs_settings': 'sys3_pcs_settings',
      },
      4: {
        'ele_breaker_location': 'sys4_ele_breaker_location',
        'pcs_amps': 'sys4_pcs_amps',
        'pcs_settings': 'sys4_pcs_settings',
      },
    };

    const dbField = fieldMapping[systemNum]?.[field] || field;

    try {
      await updateField(dbField, value);
    } catch (err) {
      console.error(`[ElectricalForm] Failed to update system ${systemNum} field ${dbField}:`, err);
    }
  }, [updateField]);

  // ============================================
  // CLEANUP EFFECT: Clear System 2+ POI fields when combining
  // ============================================

  const prevIsCombined = useRef(isCombinedSystem);

  useEffect(() => {
    const wasCombined = prevIsCombined.current;
    const nowCombined = isCombinedSystem;

    // ONLY clear fields when going FROM separate TO combined
    if (!wasCombined && nowCombined) {
      console.debug('[ElectricalForm] Systems combined - clearing System 2+ POI fields');

      const clearPromises = [];
      if (activeSystems.includes(2)) {
        clearPromises.push(
          updateField('sys2_ele_breaker_location', null),
          updateField('sys2_pcs_amps', null),
          updateField('sys2_pcs_settings', null)
        );
      }
      if (activeSystems.includes(3)) {
        clearPromises.push(
          updateField('sys3_ele_breaker_location', null),
          updateField('sys3_pcs_amps', null),
          updateField('sys3_pcs_settings', null)
        );
      }
      if (activeSystems.includes(4)) {
        clearPromises.push(
          updateField('sys4_ele_breaker_location', null),
          updateField('sys4_pcs_amps', null),
          updateField('sys4_pcs_settings', null)
        );
      }

      Promise.all(clearPromises).catch((err) => {
        console.error('[ElectricalForm] Failed to clear System 2+ POI fields:', err);
      });
    }

    // When going FROM combined TO separate - do nothing
    // System 2+ POI sections will render with empty fields for user to configure
    if (wasCombined && !nowCombined) {
      console.debug('[ElectricalForm] Systems un-combined - System 2+ POI sections will render for configuration');
      // Don't auto-populate - let user configure manually
    }

    prevIsCombined.current = nowCombined;
  }, [isCombinedSystem, activeSystems, updateField]);

  // ============================================
  // SUB PANEL VISIBILITY LOGIC
  // ============================================

  // Sub Panel B visible if user clicked to show it OR if there's any data
  const subPanelBVisible = useMemo(() => {
    if (!systemDetails) return false;
    const showFlag = getField('show_sub_panel_b', false);
    const hasData = !!(
      getField('spb_bus_bar_rating') ||
      getField('spb_subpanel_b_feeder_location') ||
      getField('spb_upstream_breaker_rating') ||
      getField('spb_conductor_sizing') ||
      getField('spb_tie_in_location')
    );
    return showFlag || hasData;
  }, [systemDetails, getField]);

  // Sub Panel C visible if user clicked to show it OR if there's any data
  const subPanelCVisible = useMemo(() => {
    if (!systemDetails) return false;
    const showFlag = getField('show_sub_panel_c', false);
    const hasData = !!(
      getField('spc_bus_bar_rating') ||
      getField('spc_feeder_location') ||
      getField('spc_upstream_breaker_rating') ||
      getField('spc_conductor_sizing') ||
      getField('spc_tie_in_location')
    );
    return showFlag || hasData;
  }, [systemDetails, getField]);

  // Sub Panel D visible if user clicked to show it OR if there's any data
  const subPanelDVisible = useMemo(() => {
    if (!systemDetails) return false;
    const showFlag = getField('show_sub_panel_d', false);
    const hasData = !!(
      getField('spd_bus_bar_rating') ||
      getField('spd_feeder_location') ||
      getField('spd_upstream_breaker_rating') ||
      getField('spd_conductor_sizing') ||
      getField('spd_tie_in_location')
    );
    return showFlag || hasData;
  }, [systemDetails, getField]);

  // ============================================
  // FORM DATA HELPER (for child components)
  // ============================================

  // Create formData object for child components that expect it
  const formData = useMemo(() => {
    if (!systemDetails) {
      return {
        // Default values
        ele_ses_type: '',
        ele_main_circuit_breakers_qty: 0,
        utility_service_amps: '',
        utility_company: '',
        mpa_bus_bar_existing: true, // Default to "Existing"
        mpa_main_circuit_breaker_existing: true, // Default to "Existing"
        ele_bus_bar_rating: '',
        ele_main_circuit_breaker_rating: 'MLO',
        ele_feeder_location_on_bus_bar: '',
        el_mpa_derated: false,
        backup_option: '',
        backup_loads_landing: '',
        backup_panel_selection: '',
        backup_system_size: '',
        backup_panel_make: '',
        backup_panel_model: '',
        backup_panel_bus_amps: '',
        backup_panel_main_breaker: 'MLO',
        backup_panel_tie_in_breaker: '',
        backup_panel_isnew: true,
        backup_sp_tie_in_breaker_location: '',
        combiner_panel_make: '',
        combiner_panel_model: '',
        sms_equipment_type: '',
        sms_make: '',
        sms_model: '',
        sms_isnew: true,
        show_sub_panel_b: false,
        spb_activated: false,
        spb_subpanel_existing: false,
        spb_subpanelb_mcbexisting: false,
        spb_bus_bar_rating: '',
        spb_main_breaker_rating: 'MLO',
        spb_subpanel_b_feeder_location: '',
        spb_upstream_breaker_rating: '',
        spb_conductor_sizing: '',
        spb_tie_in_location: '',
        el_spb_derated: false,
        show_sub_panel_c: false,
        spc_subpanel_existing: false,
        spc_subpanelc_mcbexisting: false,
        spc_bus_bar_rating: '',
        spc_main_breaker_rating: 'MLO',
        spc_feeder_location: '',
        spc_upstream_breaker_rating: '',
        spc_conductor_sizing: '',
        spc_tie_in_location: '',
        el_spc_derated: false,
        show_sub_panel_d: false,
        spd_subpanel_existing: false,
        spd_subpaneld_mcbexisting: false,
        spd_bus_bar_rating: '',
        spd_main_breaker_rating: 'MLO',
        spd_feeder_location: '',
        spd_upstream_breaker_rating: '',
        spd_conductor_sizing: '',
        spd_tie_in_location: '',
        el_spd_derated: false,
        ele_method_of_interconnection: '',
        el_poi_breaker_rating: '',
        el_poi_disconnect_rating: '',
        ele_breaker_location: '',
        sys1_pcs_amps: '',
        sys1_pcs_settings: false,
        sys1_poi_breaker_conductor_mode: 'auto',
        sys1_poi_breaker_size: '',
        sys1_poi_conductor_size: '',
        sys2_ele_method_of_interconnection: '',
        sys2_ele_breaker_location: '',
        sys2_pcs_amps: '',
        sys2_pcs_settings: false,
        sys2_poi_breaker_conductor_mode: 'auto',
        sys2_poi_breaker_size: '',
        sys2_poi_conductor_size: '',
        sys3_ele_method_of_interconnection: '',
        sys3_ele_breaker_location: '',
        sys3_pcs_amps: '',
        sys3_pcs_settings: false,
        sys4_ele_method_of_interconnection: '',
        sys4_ele_breaker_location: '',
        sys4_pcs_amps: '',
        sys4_pcs_settings: false,
      };
    }

    return {
      // Main Circuit Breakers
      ele_ses_type: getField('ele_ses_type', ''),
      ele_main_circuit_breakers_qty: getField('ele_main_circuit_breakers_qty', 0),
      utility_service_amps: getField('utility_service_amps', ''),
      utility_company: getField('utility_company', ''),

      // Main Panel A
      mpa_bus_bar_existing: getField('mpa_bus_bar_existing', true),
      mpa_main_circuit_breaker_existing: getField('mpa_main_circuit_breaker_existing', true),
      ele_bus_bar_rating: getField('ele_bus_bar_rating', ''),
      ele_main_circuit_breaker_rating: getField('ele_main_circuit_breaker_rating', 'MLO'),
      ele_feeder_location_on_bus_bar: getField('ele_feeder_location_on_bus_bar', ''),
      el_mpa_derated: getField('el_mpa_derated', false),

      // Backup Configuration
      backup_option: getField('sys1_backup_option', ''),
      backup_loads_landing: getField('backup_loads_landing', ''),
      backup_panel_selection: getField('backup_panel_selection', ''),
      backup_system_size: getField('utility_service_amps', ''),
      backup_panel_make: getField('backup_panel_make', ''),
      backup_panel_model: getField('backup_panel_model', ''),
      backup_panel_bus_amps: getField('backup_panel_bus_amps', ''),
      backup_panel_main_breaker: getField('backup_panel_main_breaker', 'MLO'),
      backup_panel_tie_in_breaker: getField('backup_panel_tie_in_breaker', ''),
      backup_panel_isnew: getField('backup_panel_isnew', true),
      backup_sp_tie_in_breaker_location: getField('backup_sp_tie_in_breaker_location', ''),
      combiner_panel_make: getField('combiner_panel_make', ''),
      combiner_panel_model: getField('combiner_panel_model', ''),
      sms_equipment_type: getField('sms_equipment_type', ''),
      sms_make: getField('sms_make', ''),
      sms_model: getField('sms_model', ''),
      sms_isnew: getField('sms_isnew', true),

      // Sub Panel B
      show_sub_panel_b: getField('show_sub_panel_b', false),
      spb_activated: getField('spb_activated', false),
      spb_subpanel_existing: getField('spb_subpanel_existing', false),
      spb_subpanelb_mcbexisting: getField('spb_subpanelb_mcbexisting', false),
      spb_bus_bar_rating: getField('spb_bus_bar_rating', ''),
      spb_main_breaker_rating: getField('spb_main_breaker_rating', 'MLO'),
      spb_subpanel_b_feeder_location: getField('spb_subpanel_b_feeder_location', ''),
      spb_upstream_breaker_rating: getField('spb_upstream_breaker_rating', ''),
      spb_conductor_sizing: getField('spb_conductor_sizing', ''),
      spb_tie_in_location: getField('spb_tie_in_location', ''),
      el_spb_derated: getField('el_spb_derated', false),

      // Sub Panel C
      show_sub_panel_c: getField('show_sub_panel_c', false),
      spc_subpanel_existing: getField('spc_subpanel_existing', false),
      spc_subpanelc_mcbexisting: getField('spc_subpanelc_mcbexisting', false),
      spc_bus_bar_rating: getField('spc_bus_bar_rating', ''),
      spc_main_breaker_rating: getField('spc_main_breaker_rating', 'MLO'),
      spc_feeder_location: getField('spc_feeder_location', ''),
      spc_upstream_breaker_rating: getField('spc_upstream_breaker_rating', ''),
      spc_conductor_sizing: getField('spc_conductor_sizing', ''),
      spc_tie_in_location: getField('spc_tie_in_location', ''),
      el_spc_derated: getField('el_spc_derated', false),

      // Sub Panel D
      show_sub_panel_d: getField('show_sub_panel_d', false),
      spd_subpanel_existing: getField('spd_subpanel_existing', false),
      spd_subpaneld_mcbexisting: getField('spd_subpaneld_mcbexisting', false),
      spd_bus_bar_rating: getField('spd_bus_bar_rating', ''),
      spd_main_breaker_rating: getField('spd_main_breaker_rating', 'MLO'),
      spd_feeder_location: getField('spd_feeder_location', ''),
      spd_upstream_breaker_rating: getField('spd_upstream_breaker_rating', ''),
      spd_conductor_sizing: getField('spd_conductor_sizing', ''),
      spd_tie_in_location: getField('spd_tie_in_location', ''),
      el_spd_derated: getField('el_spd_derated', false),

      // Point of Interconnection (shared fields)
      ele_method_of_interconnection: getField('ele_method_of_interconnection', ''),
      el_poi_breaker_rating: getField('el_poi_breaker_rating', ''),
      el_poi_disconnect_rating: getField('el_poi_disconnect_rating', ''),

      // System 1 POI fields
      ele_breaker_location: getField('ele_breaker_location', ''),
      sys1_pcs_amps: getField('sys1_pcs_amps', ''),
      sys1_pcs_settings: getField('sys1_pcs_settings', false),
      sys1_poi_breaker_conductor_mode: getField('sys1_poi_breaker_conductor_mode', 'auto'),
      sys1_poi_breaker_size: getField('sys1_poi_breaker_size', ''),
      sys1_poi_conductor_size: getField('sys1_poi_conductor_size', ''),

      // System 2 POI fields
      sys2_ele_method_of_interconnection: getField('sys2_ele_method_of_interconnection', ''),
      sys2_ele_breaker_location: getField('sys2_ele_breaker_location', ''),
      sys2_pcs_amps: getField('sys2_pcs_amps', ''),
      sys2_pcs_settings: getField('sys2_pcs_settings', false),
      sys2_poi_breaker_conductor_mode: getField('sys2_poi_breaker_conductor_mode', 'auto'),
      sys2_poi_breaker_size: getField('sys2_poi_breaker_size', ''),
      sys2_poi_conductor_size: getField('sys2_poi_conductor_size', ''),

      // System 3 POI fields
      sys3_ele_method_of_interconnection: getField('sys3_ele_method_of_interconnection', ''),
      sys3_ele_breaker_location: getField('sys3_ele_breaker_location', ''),
      sys3_pcs_amps: getField('sys3_pcs_amps', ''),
      sys3_pcs_settings: getField('sys3_pcs_settings', false),

      // System 4 POI fields
      sys4_ele_method_of_interconnection: getField('sys4_ele_method_of_interconnection', ''),
      sys4_ele_breaker_location: getField('sys4_ele_breaker_location', ''),
      sys4_pcs_amps: getField('sys4_pcs_amps', ''),
      sys4_pcs_settings: getField('sys4_pcs_settings', false),
    };
  }, [systemDetails, getField]);

  // ============================================
  // LOADING & ERROR STATES
  // ============================================

  if (loading) {
    return (
      <div style={{ padding: 'var(--spacing-lg)', textAlign: 'center' }}>
        Loading electrical data...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 'var(--spacing-lg)', color: 'var(--color-error)' }}>
        Error loading electrical data: {error}
      </div>
    );
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <form onSubmit={(e) => e.preventDefault()} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Scrollable Content */}
      <div className={equipStyles.scrollableContent}>
        {/* Main Circuit Breakers (Electrical Service) */}
        <MainCircuitBreakersSection
          formData={formData}
          onChange={handleFieldChange}
          projectData={projectData}
        />

        {/* Backup Configuration - Only show when backup option is Whole Home or Partial Home */}
        {(formData.backup_option === 'Whole Home' || formData.backup_option === 'Partial Home') && (
          <BackupConfigurationSection
            formData={formData}
            onChange={handleFieldChange}
            onActivateSubPanelB={() => {
              handleFieldChange('show_sub_panel_b', true);
              handleFieldChange('spb_activated', true);
            }}
            backupSystemSize={getField('utility_service_amps')}
            maxContinuousOutputAmps={combinedSystemMaxOutput || sys1InvMaxOutput}
            loadingMaxOutput={loading}
          />
        )}

        {/* Main Panel A */}
        <MainPanelASection
          formData={formData}
          onChange={handleFieldChange}
          onShowSubPanelB={() => handleFieldChange('show_sub_panel_b', true)}
          subPanelBVisible={subPanelBVisible}
        />

        {/* Sub Panel B - Conditionally visible based on data or user action */}
        {subPanelBVisible && (
          <SubPanelBSection
            formData={formData}
            onChange={handleFieldChange}
            onShowSubPanelC={() => handleFieldChange('show_sub_panel_c', true)}
            subPanelCVisible={subPanelCVisible}
          />
        )}

        {/* Sub Panel C - Conditionally visible based on data or user action */}
        {subPanelCVisible && (
          <SubPanelCSection
            formData={formData}
            onChange={handleFieldChange}
            onShowSubPanelD={() => handleFieldChange('show_sub_panel_d', true)}
            subPanelDVisible={subPanelDVisible}
          />
        )}

        {/* Sub Panel D - Conditionally visible based on data or user action */}
        {subPanelDVisible && (
          <SubPanelDSection
            formData={formData}
            onChange={handleFieldChange}
          />
        )}

        {/* Point of Interconnection - Conditional based on combined state */}
        {(() => {
          // Debug logging
          console.log('[POI Debug] isCombinedSystem:', isCombinedSystem);
          console.log('[POI Debug] activeSystems:', activeSystems);
          console.log('[POI Debug] ele_combine_positions:', systemDetails?.ele_combine_positions);

          // No active systems → Single legacy POI
          if (activeSystems.length === 0) {
            return (
              <PointOfInterconnectionSection
                key="poi-legacy"
                formData={formData}
                onChange={handleFieldChange}
                systemNumber={1}
                batteryData={batteryData}
                inverterData={inverterData}
                panelData={panelData}
                isCombinedSystem={false}
                totalActiveSystems={1}
              />
            );
          }

          // Systems ARE Combined → ONE combined section
          if (isCombinedSystem && activeSystems.includes(1) && activeSystems.includes(2)) {
            // For combined systems, merge battery data from both systems for detection
            const combinedBatteryData = {
              ...batteryData,
              // Include System 2 battery data for detection
              sys2_battery1_make: getField('sys2_battery_1_make') || getField('sys2_battery1_make'),
              sys2_battery1_model: getField('sys2_battery_1_model') || getField('sys2_battery1_model'),
            };

            // Build combined title with equipment info from both systems
            const sys1SolarMake = getField('sys1_solar_panel_make');
            const sys1SolarModel = getField('sys1_solar_panel_model');
            const sys2SolarMake = getField('sys2_solar_panel_make');
            const sys2SolarModel = getField('sys2_solar_panel_model');

            let combinedTitle = 'POI - Combined Systems 1 & 2';
            if (sys1SolarMake && sys1SolarModel && sys2SolarMake && sys2SolarModel) {
              combinedTitle = `POI - Combined Systems 1 & 2 - ${sys1SolarMake} ${sys1SolarModel} + ${sys2SolarMake} ${sys2SolarModel}`;
            } else if (sys1SolarMake && sys1SolarModel) {
              combinedTitle = `POI - Combined Systems 1 & 2 - ${sys1SolarMake} ${sys1SolarModel}`;
            }

            return (
              <PointOfInterconnectionSection
                key="poi-combined-1-2"
                formData={formData}
                onChange={handleFieldChange}
                systemNumber={1}  // Uses System 1 fields
                batteryData={combinedBatteryData}
                inverterData={inverterData}
                panelData={panelData}
                isCombinedSystem={true}
                combinedSystemMaxOutput={combinedSystemMaxOutput}
                sectionTitle={combinedTitle}
                totalActiveSystems={activeSystems.length}
              />
            );
          }

          // Systems NOT Combined → One section per active system
          return activeSystems.map((systemNum, index) => {
            // Get system-specific data
            const systemBatteryData = getSystemBatteryData(systemNum);
            const systemInverterData = getSystemInverterData(systemNum);

            // Build descriptive title with equipment info
            const prefix = `sys${systemNum}_`;
            const solarPanelMake = getField(`${prefix}solar_panel_make`);
            const solarPanelModel = getField(`${prefix}solar_panel_model`);
            const inverterMake = getField(`${prefix}inverter_make`);
            const inverterModel = getField(`${prefix}inverter_model`);
            const batteryMake = getField(`${prefix}battery_1_make`) || getField(`${prefix}battery1_make`);
            const batteryModel = getField(`${prefix}battery_1_model`) || getField(`${prefix}battery1_model`);

            // Determine equipment description
            let equipmentDesc = '';
            if (solarPanelMake && solarPanelModel) {
              equipmentDesc = `${solarPanelMake} ${solarPanelModel}`;
            } else if (batteryMake && batteryModel) {
              equipmentDesc = `${batteryMake} ${batteryModel} (Battery Only)`;
            } else if (inverterMake && inverterModel) {
              equipmentDesc = `${inverterMake} ${inverterModel}`;
            }

            // Only include equipment description if there are multiple systems
            const sectionTitle = (activeSystems.length > 1 && equipmentDesc)
              ? `POI - System ${systemNum} - ${equipmentDesc}`
              : `POI - System ${systemNum}`;

            // Add top margin for System 2+ sections
            const sectionStyle = index > 0 ? { marginTop: 'var(--spacing-md)' } : undefined;

            return (
              <div key={`poi-system-${systemNum}`} style={sectionStyle}>
                <PointOfInterconnectionSection
                  formData={formData}
                  onChange={handleFieldChange}
                  systemNumber={systemNum}
                  batteryData={systemBatteryData}
                  inverterData={systemInverterData}
                  panelData={panelData}
                  isCombinedSystem={false}
                  sectionTitle={sectionTitle}
                  totalActiveSystems={activeSystems.length}
                />
              </div>
            );
          });
        })()}
      </div>

      {/* Footer Navigation */}
      <FormNavigationFooter
        onPrev={handlePrev}
        onNext={handleNext}
        prevLabel="Prev"
        nextLabel="Next"
      />
    </form>
  );
};

export default ElectricalForm;
