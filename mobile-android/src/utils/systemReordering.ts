// utils/systemReordering.ts

/**
 * Special scenario types for system data reordering
 * Expand this as new edge cases are discovered
 */
export type SpecialScenario =
  | "none"
  | "swap_2_systems" // Swap system 1 and 2
  | "rotate_3_systems"; // Rotate: 2→1, 3→2, 1→3
// Future scenarios can be added here
// | 'swap_1_3'
// | 'custom_battery_priority'

export interface SpecialScenarioResult {
  scenario: SpecialScenario;
  reason: string;
  affectedSystems: number[]; // Which systems are involved [1, 2, 3]
}

export interface SystemData {
  sys1_selectedsystem?: string | null;
  sys2_selectedsystem?: string | null;
  sys3_selectedsystem?: string | null;
  sys4_selectedsystem?: string | null;
  sys2_micro_inverter_model?: string | null;
  sys3_micro_inverter_model?: string | null;
  sys2_micro_inverter_make?: string | null;
  sys3_micro_inverter_make?: string | null;
  sys2_batteryonly?: boolean | null;
  sys3_batteryonly?: boolean | null;
  panelType?: string | null;
  panelModel?: string | null;
  batteryModel?: string | null;
  isBatteryOnly?: boolean | null;
  // ... other properties as needed
}

/**
 * Detects if systems need reordering based on special scenarios
 * Call this when user clicks Generate button, before triggering automation
 *
 * @param projectData - Object containing sys1-4_selectedsystem fields and micro_inverter_model fields
 */
export function detectSpecialScenario(
  projectData: SystemData
): SpecialScenarioResult {

  const sys1 = projectData.sys1_selectedsystem?.toLowerCase() || '';
  const sys2Model = projectData.sys2_micro_inverter_model || '';
  const sys3Model = projectData.sys3_micro_inverter_model || '';
  const sys2Make = projectData.sys2_micro_inverter_make || '';
  const sys3Make = projectData.sys3_micro_inverter_make || '';

  // Check if system 1 has microinverter (AC integrated solar)
  const sys1HasMicroinverter = sys1 === 'microinverter';

  // Check if systems 2 or 3 have PowerWall 3 (any version)
  const sys2HasPowerwall3 = sys2Model.includes('PowerWall 3');
  const sys3HasPowerwall3 = sys3Model.includes('PowerWall 3');

  // Check if systems 2 or 3 have Sol-Ark inverter
  const sys2HasSolArk = sys2Make.toLowerCase().includes('sol-ark') || sys2Make.toLowerCase().includes('solark');
  const sys3HasSolArk = sys3Make.toLowerCase().includes('sol-ark') || sys3Make.toLowerCase().includes('solark');

  // Check if systems 2 or 3 are battery-only
  const sys2IsBatteryOnly = projectData.sys2_batteryonly === true;
  const sys3IsBatteryOnly = projectData.sys3_batteryonly === true;

  // SCENARIO 1: Rotate 3 systems
  // System 1 is microinverter + System 2 has (PW3 or Sol-Ark) and is battery-only + System 3 has (PW3 or Sol-Ark) and is battery-only
  if (sys1HasMicroinverter &&
      (sys2HasPowerwall3 || sys2HasSolArk) && sys2IsBatteryOnly &&
      (sys3HasPowerwall3 || sys3HasSolArk) && sys3IsBatteryOnly) {
    return {
      scenario: 'rotate_3_systems',
      reason: 'System 1 is microinverter, Systems 2 & 3 have PowerWall 3 or Sol-Ark and are battery-only',
      affectedSystems: [1, 2, 3]
    };
  }

  // SCENARIO 2: Swap 2 systems
  // System 1 is microinverter + System 2 has (PW3 or Sol-Ark) and is battery-only (but System 3 does not meet criteria)
  if (sys1HasMicroinverter && (sys2HasPowerwall3 || sys2HasSolArk) && sys2IsBatteryOnly) {
    return {
      scenario: 'swap_2_systems',
      reason: 'System 1 is microinverter, System 2 has PowerWall 3 or Sol-Ark and is battery-only',
      affectedSystems: [1, 2]
    };
  }

  // SCENARIO 3: No special handling needed
  return {
    scenario: 'none',
    reason: 'Standard system ordering applies',
    affectedSystems: []
  };
}

/**
 * Example usage in your proposal submission flow
 */
export function prepareProposalForDB(
  systemData: SystemData,
  otherProposalData: any
) {
  // Detect special scenario
  const scenarioResult = detectSpecialScenario(systemData);

  // Prepare record for Airtable/DB
  const proposalRecord = {
    ...otherProposalData,

    // System data (original order)
    systemData: JSON.stringify(systemData),

    // Special scenario flags
    specialScenario: scenarioResult.scenario,
    specialScenarioReason: scenarioResult.reason,
    affectedSystems: scenarioResult.affectedSystems.join(","),

    // Metadata
    createdAt: new Date().toISOString(),
  };

  return proposalRecord;
}

/**
 * Add future scenarios here as they're discovered
 *
 * Example future scenario:
 *
 * // SCENARIO 4: Prioritize specific battery configuration
 * if (someOtherCondition) {
 *   return {
 *     scenario: 'custom_battery_priority',
 *     reason: 'Description of why this reorder is needed',
 *     affectedSystems: [1, 3]
 *   };
 * }
 */
