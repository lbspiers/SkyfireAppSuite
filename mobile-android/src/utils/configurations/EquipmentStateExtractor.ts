// EquipmentStateExtractor.ts
// Extract equipment state from system details for all 4 systems
// Converts raw database fields into EquipmentState interface

import {
  EquipmentState,
  SystemPrefix,
  UtilityRequirements,
} from './types/ConfigurationTypes';
import { GetBatteryModels } from '../../api/inventry.service';
import { getInverterModels } from '../../api/inverter.service';

export class EquipmentStateExtractor {
  /**
   * Extract equipment state for a specific system from system details
   * @param systemDetails - Raw system details from database
   * @param systemNumber - Which system (1, 2, 3, or 4)
   * @param utilityRequirements - Utility requirements from database
   */
  static async extractForSystem(
    systemDetails: Record<string, any>,
    systemNumber: 1 | 2 | 3 | 4,
    utilityRequirements?: UtilityRequirements
  ): Promise<EquipmentState | null> {
    const systemPrefix: SystemPrefix = `sys${systemNumber}_`;

    console.log(`[Equipment Extractor] Extracting equipment state for ${systemPrefix}...`);

    // Check if this system has any meaningful data
    if (!EquipmentStateExtractor.systemHasData(systemDetails, systemPrefix)) {
      console.log(`[Equipment Extractor] ${systemPrefix} has no data, skipping`);
      return null;
    }

    // Extract utility info
    const utilityName = utilityRequirements?.utility_name || utilityRequirements?.utility || 'Unknown';
    const utilityBOSCombination = utilityRequirements?.combination || '';

    console.log(`[Equipment Extractor] Utility info:`, {
      utilityRequirements,
      utilityName,
      utilityBOSCombination,
    });

    // Extract solar equipment
    const hasSolarPanels = !!(
      systemDetails[`${systemPrefix}solar_panel_make`] ||
      systemDetails[`${systemPrefix}solar_panel_model`] ||
      systemDetails[`${systemPrefix}solar_panel_qty`]
    );
    const solarMake = systemDetails[`${systemPrefix}solar_panel_make`];
    const solarModel = systemDetails[`${systemPrefix}solar_panel_model`];
    const solarQuantity = parseInt(systemDetails[`${systemPrefix}solar_panel_qty`]) || 0;
    const solarWattage = parseInt(systemDetails[`${systemPrefix}solar_panel_wattage`]) || 0;

    // Extract inverter/microinverter equipment
    const systemType = systemDetails[`${systemPrefix}selectedsystem`]; // 'microinverter' | 'inverter' | 'batteryonly'
    const microInverterMake = systemDetails[`${systemPrefix}micro_inverter_make`];
    const microInverterModel = systemDetails[`${systemPrefix}micro_inverter_model`];
    const inverterMake = microInverterMake; // In your system, both use same fields
    const inverterModel = microInverterModel;
    const inverterQuantity = parseInt(systemDetails[`${systemPrefix}micro_inverter_qty`]) || 0;

    // Extract new/existing status for inverters
    // The database stores as "inverter_existing" or "micro_inverter_existing" (boolean)
    // We convert to "isNew" (true = new equipment, false = existing)
    // inverter_existing = true means EXISTING, so isNew = false
    // inverter_existing = false means NEW, so isNew = true
    const inverterExisting = systemDetails[`${systemPrefix}inverter_existing`];
    const microInverterExisting = systemDetails[`${systemPrefix}micro_inverter_existing`];
    const inverterIsNew = inverterExisting !== true; // NOT existing = new (handles false, null, undefined as new)
    const microInverterIsNew = microInverterExisting !== true; // NOT existing = new (handles false, null, undefined as new)

    console.log(`[Equipment Extractor] ${systemPrefix} inverter status:`, {
      inverterExisting,
      inverterIsNew,
      microInverterExisting,
      microInverterIsNew
    });

    // Determine inverter type
    const inverterType = EquipmentStateExtractor.detectInverterType(inverterMake, inverterModel);

    // Extract battery equipment
    const batteryQuantity = parseInt(systemDetails[`${systemPrefix}battery_1_qty`]) || 0;
    const batteryMake = systemDetails[`${systemPrefix}battery_1_make`];
    const batteryModel = systemDetails[`${systemPrefix}battery_1_model`];
    const batteryMaxContinuousOutput = parseFloat(
      systemDetails[`${systemPrefix}battery_1_max_continuous_output`]
    ) || 0;

    // Battery charging source
    const batteryChargingSource: 'grid-only' | 'grid-or-renewable' =
      !hasSolarPanels || systemDetails[`${systemPrefix}battery_charging_source`] === 'grid-only'
        ? 'grid-only'
        : 'grid-or-renewable';

    // Battery 2 (different type)
    const battery2Quantity = parseInt(systemDetails[`${systemPrefix}battery_2_qty`]) || 0;
    const battery2Make = systemDetails[`${systemPrefix}battery_2_make`];
    const battery2Model = systemDetails[`${systemPrefix}battery_2_model`];

    // SMS (Storage Management System)
    const smsMake = systemDetails[`${systemPrefix}sms_make`];
    const smsModel = systemDetails[`${systemPrefix}sms_model`];
    // Treat "No SMS" as absence of SMS equipment
    const hasSMS = !!(smsMake || smsModel) &&
                   smsMake?.toLowerCase() !== 'no sms' &&
                   smsModel?.toLowerCase() !== 'no sms';

    // Gateway - NOTE: For Tesla PowerWall systems, Gateway (Gateway 3, Backup Gateway 2, etc.)
    // is stored in SMS fields, not separate gateway_make/gateway_model fields
    const gatewayMake = systemDetails[`${systemPrefix}gateway_make`];
    const gatewayModel = systemDetails[`${systemPrefix}gateway_model`];
    const gatewayValue = systemDetails[`${systemPrefix}gateway`]; // e.g., "gateway_3", "backup_gateway_2", "backup_switch"

    // Treat "No Gateway" as absence of gateway equipment
    // Check both traditional gateway fields (if they exist) and gateway value field
    const hasGateway = (
      (!!(gatewayMake || gatewayModel) &&
       gatewayMake?.toLowerCase() !== 'no gateway' &&
       gatewayModel?.toLowerCase() !== 'no gateway') ||
      !!(gatewayValue && gatewayValue.trim() !== '')
    );

    // Backup power
    const backupOption = systemDetails[`${systemPrefix}backup_option`]; // 'Whole Home' | 'Partial Home' | 'None'

    // Check for backup panel make/model fields (different field names for different systems)
    let backupPanelMake: string | undefined;
    let backupPanelModel: string | undefined;

    if (systemNumber === 1) {
      backupPanelMake = systemDetails['bls1_backup_load_sub_panel_make'];
      backupPanelModel = systemDetails['bls1_backup_load_sub_panel_model'];
    } else if (systemNumber === 2) {
      backupPanelMake = systemDetails['sys2_backup_load_sub_panel_make'];
      backupPanelModel = systemDetails['sys2_backup_load_sub_panel_model'];
    } else {
      // System 3 and 4 likely follow similar pattern to System 2
      backupPanelMake = systemDetails[`sys${systemNumber}_backup_load_sub_panel_make`];
      backupPanelModel = systemDetails[`sys${systemNumber}_backup_load_sub_panel_model`];
    }

    const hasBackupPanel = !!(
      backupOption &&
      backupOption !== 'None' &&
      (backupPanelMake || backupPanelModel)
    );

    // Backup panel sizing
    const backupPanelBusRatingField = systemNumber === 1
      ? 'bls1_backuploader_bus_bar_rating'
      : `sys${systemNumber}_backuploadsubpanel_bus_rating`;
    const backupPanelBusRating = parseInt(systemDetails[backupPanelBusRatingField]) || undefined;

    // Utility service amperage
    const utilityServiceAmps = parseInt(systemDetails.utility_service_amps) || undefined;

    // Determine coupling type from battery_data table via API lookup
    let couplingType: 'AC' | 'DC' = 'AC'; // default

    if (batteryQuantity > 0 && batteryMake && batteryModel) {
      try {
        console.log(`[Equipment Extractor] 🔍 Looking up couple_type for ${batteryMake} ${batteryModel}...`);
        const response = await GetBatteryModels(batteryMake);
        const batteries = response?.data?.data || [];
        const matchedBattery = batteries.find(
          (b: any) => b.model === batteryModel || b.model_number === batteryModel
        );

        if (matchedBattery?.couple_type) {
          couplingType = matchedBattery.couple_type.toUpperCase() === 'DC' ? 'DC' : 'AC';
          console.log(
            `[Equipment Extractor] ✅ Found couple_type from battery_data: ${couplingType} (raw: ${matchedBattery.couple_type})`
          );
        } else {
          console.log(
            `[Equipment Extractor] ⚠️ No couple_type found for battery, using inverter inference`
          );
          couplingType = inverterType === 'hybrid' ? 'DC' : 'AC';
        }
      } catch (error) {
        console.log(
          `[Equipment Extractor] ❌ Error looking up battery, using inverter inference:`,
          error
        );
        couplingType = inverterType === 'hybrid' ? 'DC' : 'AC';
      }
    } else {
      // No battery - use inverter-based inference
      couplingType = inverterType === 'hybrid' ? 'DC' : 'AC';
      console.log(
        `[Equipment Extractor] No battery present, inferred couplingType from inverter: ${couplingType} (inverterType: ${inverterType})`
      );
    }

    // Determine inverter max continuous output from inverter_data table via API lookup
    let inverterMaxContinuousOutput: number | undefined = undefined;

    if (inverterQuantity > 0 && inverterMake && inverterModel) {
      try {
        console.log(`[Equipment Extractor] 🔍 Looking up max_cont_output_amps for ${inverterMake} ${inverterModel}...`);
        const response = await getInverterModels(inverterMake);
        const inverters = response?.data?.data || [];
        const matchedInverter = inverters.find(
          (inv: any) => inv.model === inverterModel || inv.model_number === inverterModel || inv.name === inverterModel
        );

        if (matchedInverter?.max_cont_output_amps) {
          const ampsPerUnit = parseFloat(matchedInverter.max_cont_output_amps);
          // For microinverters, multiply by quantity. For string inverters, use as-is (quantity is usually 1)
          inverterMaxContinuousOutput = systemType === 'microinverter' ? ampsPerUnit * inverterQuantity : ampsPerUnit;
          console.log(
            `[Equipment Extractor] ✅ Found max_cont_output_amps from inverter_data: ${ampsPerUnit}A per unit, total: ${inverterMaxContinuousOutput}A (qty: ${inverterQuantity}, type: ${systemType})`
          );
        } else {
          console.log(
            `[Equipment Extractor] ⚠️ No max_cont_output_amps found for inverter`
          );
        }
      } catch (error) {
        console.log(
          `[Equipment Extractor] ❌ Error looking up inverter max output:`,
          error
        );
      }
    } else {
      console.log(
        `[Equipment Extractor] No inverter present, skipping max output lookup`
      );
    }

    const hasMultipleBatteries = batteryQuantity > 1; // Same type, quantity > 1
    const hasDifferentBatteryTypes = battery2Quantity > 0; // Battery1 + Battery2
    const isStandbyOnly = !hasSolarPanels && batteryChargingSource === 'grid-only';
    const requiresBackupPower = hasBackupPanel && backupOption !== 'None';
    const supportsPeakShaving = inverterType === 'hybrid';

    // Extract existing BOS equipment
    const existingBOS = EquipmentStateExtractor.extractExistingBOS(systemDetails, systemPrefix);

    const equipmentState: EquipmentState = {
      // Project context
      projectId: systemDetails.project_id || systemDetails.id,

      // System context
      systemPrefix,
      systemNumber,

      // Utility
      utilityName,
      utilityState: utilityRequirements?.state,
      utilityBOSCombination,
      utilityBOSRequirements: utilityRequirements ? {
        bos_1: utilityRequirements.bos_type_1,
        bos_2: utilityRequirements.bos_type_2,
        bos_3: utilityRequirements.bos_type_3,
        bos_4: utilityRequirements.bos_type_4,
        bos_5: utilityRequirements.bos_type_5,
        bos_6: utilityRequirements.bos_type_6,
      } : undefined,

      // Solar
      hasSolarPanels,
      solarMake,
      solarModel,
      solarQuantity,
      solarWattage,

      // Inverter
      inverterMake,
      inverterModel,
      inverterType,
      inverterQuantity,
      inverterMaxContinuousOutput,
      inverterIsNew,
      microInverterMake,
      microInverterModel,
      microInverterIsNew,

      // System type
      systemType,

      // Battery
      batteryQuantity,
      batteryMake,
      batteryModel,
      batteryChargingSource,
      batteryMaxContinuousOutput,

      // Battery 2
      battery2Quantity,
      battery2Make,
      battery2Model,

      // SMS
      hasSMS,
      smsMake,
      smsModel,

      // Gateway
      hasGateway,
      gatewayMake,
      gatewayModel,

      // Backup
      hasBackupPanel,
      backupOption,
      backupPanelBusRating,
      utilityServiceAmps,

      // Calculated attributes
      couplingType,
      hasMultipleBatteries,
      hasDifferentBatteryTypes,
      isStandbyOnly,
      requiresBackupPower,
      supportsPeakShaving,

      // Existing BOS
      existingBOS,
    };

    console.log(`[Equipment Extractor] ✅ ${systemPrefix} equipment state extracted:`, {
      solar: hasSolarPanels,
      battery: batteryQuantity,
      inverter: inverterType,
      inverterMaxOutput: inverterMaxContinuousOutput,
      batteryMaxOutput: batteryMaxContinuousOutput,
      sms: hasSMS,
      backup: backupOption,
      couplingType: couplingType,
    });

    return equipmentState;
  }

  /**
   * Extract equipment state for ALL 4 systems
   */
  static async extractAllSystems(
    systemDetails: Record<string, any>,
    utilityRequirements?: UtilityRequirements
  ): Promise<{
    system1?: EquipmentState;
    system2?: EquipmentState;
    system3?: EquipmentState;
    system4?: EquipmentState;
  }> {
    console.log('[Equipment Extractor] Extracting all systems...');

    // Extract all systems in parallel for better performance
    const [system1, system2, system3, system4] = await Promise.all([
      EquipmentStateExtractor.extractForSystem(systemDetails, 1, utilityRequirements),
      EquipmentStateExtractor.extractForSystem(systemDetails, 2, utilityRequirements),
      EquipmentStateExtractor.extractForSystem(systemDetails, 3, utilityRequirements),
      EquipmentStateExtractor.extractForSystem(systemDetails, 4, utilityRequirements),
    ]);

    return {
      system1: system1 ?? undefined,
      system2: system2 ?? undefined,
      system3: system3 ?? undefined,
      system4: system4 ?? undefined,
    };
  }

  /**
   * Check if a system has any meaningful data
   */
  private static systemHasData(
    systemDetails: Record<string, any>,
    systemPrefix: SystemPrefix
  ): boolean {
    // Check key indicators of a configured system
    const hasSolar = !!(
      systemDetails[`${systemPrefix}solar_panel_make`] ||
      systemDetails[`${systemPrefix}solar_panel_model`] ||
      systemDetails[`${systemPrefix}solar_panel_qty`]
    );

    const hasInverter = !!(
      systemDetails[`${systemPrefix}micro_inverter_make`] ||
      systemDetails[`${systemPrefix}micro_inverter_model`]
    );

    // Battery is present if it has BOTH quantity AND (make OR model)
    const hasBattery = !!(
      (systemDetails[`${systemPrefix}battery_1_make`] || systemDetails[`${systemPrefix}battery_1_model`]) &&
      systemDetails[`${systemPrefix}battery_1_qty`] &&
      parseInt(systemDetails[`${systemPrefix}battery_1_qty`]) > 0
    );

    const hasSystemSelection = !!systemDetails[`${systemPrefix}selectedsystem`];

    return hasSolar || hasInverter || hasBattery || hasSystemSelection;
  }

  /**
   * Detect inverter type from make and model
   * Uses pattern matching - can be enhanced with database lookup
   */
  private static detectInverterType(
    make?: string,
    model?: string
  ): 'grid-following' | 'grid-forming-following' | 'hybrid' | null {
    if (!make && !model) return null;

    const makeStr = (make || '').toLowerCase();
    const modelStr = (model || '').toLowerCase();
    const combined = `${makeStr} ${modelStr}`;

    // Hybrid inverters
    if (
      combined.includes('hybrid') ||
      makeStr.includes('solaredge') && modelStr.includes('hd-wave') ||
      makeStr.includes('goodwe') ||
      makeStr.includes('growatt') ||
      makeStr.includes('sol-ark') ||
      makeStr.includes('solark')
    ) {
      return 'hybrid';
    }

    // Grid forming/following (battery inverters)
    if (
      combined.includes('forming') ||
      combined.includes('powerwall') ||
      combined.includes('backup interface') ||
      combined.includes('agate') ||
      makeStr.includes('franklin') ||
      makeStr.includes('tesla')
    ) {
      return 'grid-forming-following';
    }

    // Default to grid-following
    return 'grid-following';
  }

  /**
   * Extract existing BOS equipment to avoid duplicates
   */
  private static extractExistingBOS(
    systemDetails: Record<string, any>,
    systemPrefix: SystemPrefix
  ): EquipmentState['existingBOS'] {
    const bosPrefix = `bos_${systemPrefix}`;

    const utilityBOS = [];
    const batteryBOS = [];
    const postSMSBOS = [];

    // Check BOS Type 1-6
    for (let i = 1; i <= 6; i++) {
      const equipmentType = systemDetails[`${bosPrefix}type${i}_equipment_type`];
      if (equipmentType) {
        utilityBOS.push({
          equipmentType,
          make: systemDetails[`${bosPrefix}type${i}_make`],
          model: systemDetails[`${bosPrefix}type${i}_model`],
          ampRating: systemDetails[`${bosPrefix}type${i}_amp_rating`],
          position: i,
        });
      }
    }

    // Check Post-SMS BOS Type 1-3
    for (let i = 1; i <= 3; i++) {
      const equipmentType = systemDetails[`${systemPrefix}post_sms_bos_type_${i}_equipment_type`];
      if (equipmentType) {
        postSMSBOS.push({
          equipmentType,
          make: systemDetails[`${systemPrefix}post_sms_bos_type_${i}_make`],
          model: systemDetails[`${systemPrefix}post_sms_bos_type_${i}_model`],
          ampRating: systemDetails[`${systemPrefix}post_sms_bos_type_${i}_amp_rating`],
          position: i,
        });
      }
    }

    return {
      utilityBOS: utilityBOS.length > 0 ? utilityBOS : undefined,
      batteryBOS: batteryBOS.length > 0 ? batteryBOS : undefined,
      postSMSBOS: postSMSBOS.length > 0 ? postSMSBOS : undefined,
    };
  }
}

// Export convenience functions
export const extractEquipmentForSystem = EquipmentStateExtractor.extractForSystem;
export const extractEquipmentForAllSystems = EquipmentStateExtractor.extractAllSystems;
