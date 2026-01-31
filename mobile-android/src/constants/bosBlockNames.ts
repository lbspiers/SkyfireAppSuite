/**
 * BOS Block Name Classifications
 *
 * These constants define how BOS equipment is classified for calculator/Excel output.
 * Block names indicate the logical location and purpose of BOS equipment in the system chain.
 *
 * Classification Rules:
 * - PRE COMBINE: Equipment on individual system chains BEFORE they are combined
 * - POST COMBINE: Equipment AFTER systems are combined (at combiner panel, inverter, or SMS)
 * - ESS: Equipment related to Energy Storage Systems (batteries)
 * - Equipment naming: [PRE/POST] COMBINE [ESS if battery-related] [EQUIPMENT TYPE]
 *
 * Trigger Mapping:
 * - sys{N}_stringCombiner → PRE COMBINE [TYPE]
 * - sys{N}_inverter → PRE COMBINE [TYPE]
 * - sys{N}_microinverter → PRE COMBINE [TYPE]
 * - sys{N}_battery1 → PRE COMBINE ESS [TYPE]
 * - sys{N}_battery2 → PRE COMBINE ESS [TYPE]
 * - sys{N}_backupSubpanel → BACKUP LOAD SUB PANEL
 * - sys{N}_postSMS → POST COMBINE [TYPE]
 * - Position/Combiner trigger → POSITION COMBINER PANEL
 */

export const BOS_BLOCK_NAMES = {
  // ===== PRE COMBINE - DC EQUIPMENT =====
  PRE_COMBINE_DC_DISCONNECT: 'PRE COMBINE DC DISCONNECT',

  // ===== PRE COMBINE - FUSED AC DISCONNECT =====
  PRE_COMBINE_FUSED_AC_DISCONNECT: 'PRE COMBINE FUSED AC DISCONNECT',

  // ===== PRE COMBINE - AC DISCONNECT =====
  PRE_COMBINE_AC_DISCONNECT: 'PRE COMBINE AC DISCONNECT',

  // ===== PRE COMBINE - PV METER =====
  PRE_COMBINE_PV_METER: 'PRE COMBINE PV METER',

  // ===== PRE COMBINE ESS (Battery-related) - DISCONNECT =====
  PRE_COMBINE_ESS_DISCONNECT: 'PRE COMBINE ESS DISCONNECT',

  // ===== PRE COMBINE ESS (Battery-related) - METER =====
  PRE_COMBINE_ESS_METER: 'PRE COMBINE ESS METER',

  // ===== POST COMBINE - FUSED AC DISCONNECT =====
  POST_COMBINE_FUSED_AC_DISCONNECT: 'POST COMBINE FUSED AC DISCONNECT',

  // ===== POST COMBINE - AC DISCONNECT =====
  POST_COMBINE_AC_DISCONNECT: 'POST COMBINE AC DISCONNECT',

  // ===== POST COMBINE - PV METER =====
  POST_COMBINE_PV_METER: 'POST COMBINE PV METER',

  // ===== POST COMBINE ESS - DISCONNECT =====
  POST_COMBINE_ESS_DISCONNECT: 'POST COMBINE ESS DISCONNECT',

  // ===== POST COMBINE ESS - METER =====
  POST_COMBINE_ESS_METER: 'POST COMBINE ESS METER',

  // ===== BACKUP LOAD SUB PANEL =====
  BACKUP_LOAD_SUB_PANEL: 'BACKUP LOAD SUB PANEL',

  // ===== BATTERY COMBINER PANEL =====
  BATTERY_COMBINER_PANEL: 'BATTERY COMBINER PANEL',

  // ===== ENPHASE COMBINER BOX =====
  ENPHASE_COMBINER_BOX: 'ENPHASE COMBINER BOX',

  // ===== STRING COMBINER PANEL =====
  STRING_COMBINER_PANEL: 'STRING COMBINER PANEL',

  // ===== POSITION COMBINER PANEL =====
  // This is for equipment added from the "Position Combiner Panel" trigger
  // (equipment that combines multiple systems together)
  POSITION_COMBINER_PANEL: 'POSITION COMBINER PANEL',
} as const;

export type BOSBlockName = typeof BOS_BLOCK_NAMES[keyof typeof BOS_BLOCK_NAMES];

/**
 * Equipment type to block name mapping
 * Maps equipment_type field values to their corresponding block classification
 */
export const EQUIPMENT_TYPE_TO_BLOCK: Record<string, string> = {
  // DC Disconnects
  'DC Disconnect': BOS_BLOCK_NAMES.PRE_COMBINE_DC_DISCONNECT,
  'DC Combiner': BOS_BLOCK_NAMES.PRE_COMBINE_DC_DISCONNECT,

  // AC Disconnects (Fused)
  'Fused AC Disconnect': BOS_BLOCK_NAMES.PRE_COMBINE_FUSED_AC_DISCONNECT,
  'AC Combiner (Fused)': BOS_BLOCK_NAMES.PRE_COMBINE_FUSED_AC_DISCONNECT,

  // AC Disconnects (Non-Fused)
  'AC Disconnect': BOS_BLOCK_NAMES.PRE_COMBINE_AC_DISCONNECT,
  'AC Combiner': BOS_BLOCK_NAMES.PRE_COMBINE_AC_DISCONNECT,
  'Non-Fused AC Disconnect': BOS_BLOCK_NAMES.PRE_COMBINE_AC_DISCONNECT,

  // PV Meters
  'PV Meter': BOS_BLOCK_NAMES.PRE_COMBINE_PV_METER,
  'Production Meter': BOS_BLOCK_NAMES.PRE_COMBINE_PV_METER,

  // ESS Disconnects
  'ESS Disconnect': BOS_BLOCK_NAMES.PRE_COMBINE_ESS_DISCONNECT,
  'Battery Disconnect': BOS_BLOCK_NAMES.PRE_COMBINE_ESS_DISCONNECT,

  // ESS Meters
  'ESS Meter': BOS_BLOCK_NAMES.PRE_COMBINE_ESS_METER,
  'Battery Meter': BOS_BLOCK_NAMES.PRE_COMBINE_ESS_METER,

  // Special Panels
  'Backup Load Sub Panel': BOS_BLOCK_NAMES.BACKUP_LOAD_SUB_PANEL,
  'Battery Combiner Panel': BOS_BLOCK_NAMES.BATTERY_COMBINER_PANEL,
  'Enphase Combiner Box': BOS_BLOCK_NAMES.ENPHASE_COMBINER_BOX,
  'String Combiner Panel': BOS_BLOCK_NAMES.STRING_COMBINER_PANEL,
  'Position Combiner Panel': BOS_BLOCK_NAMES.POSITION_COMBINER_PANEL,
};

/**
 * Determine BOS block name based on trigger and equipment type
 * Now simplified to return just "PRE COMBINE" or "POST COMBINE"
 *
 * @param trigger - The trigger field value (e.g., "sys1_battery1", "sys1_postSMS")
 * @param equipmentType - The equipment_type field value (can be utility-specific or standard)
 * @returns Either "PRE COMBINE" or "POST COMBINE"
 */
export function getBOSBlockName(trigger: string | null, equipmentType: string): string {
  if (!trigger || !equipmentType) {
    return '';
  }

  // Extract the trigger type (remove system prefix)
  // "sys1_battery1" -> "battery1", "sys1_postSMS" -> "postSMS"
  const triggerType = trigger.replace(/^sys\d+_/, '');

  // Determine if this is PRE or POST combine based on trigger
  const isPostCombine = triggerType === 'postSMS' || triggerType === 'positionCombiner';

  // Return simplified block name - just PRE or POST COMBINE
  return isPostCombine ? 'POST COMBINE' : 'PRE COMBINE';
}

/**
 * Get all unique block names (for dropdowns, filters, etc.)
 */
export function getAllBlockNames(): string[] {
  return Object.values(BOS_BLOCK_NAMES);
}

/**
 * Check if a block name is ESS-related
 */
export function isESSBlock(blockName: string): boolean {
  return blockName.includes('ESS') || blockName.includes('BATTERY');
}

/**
 * Check if a block name is POST COMBINE
 */
export function isPostCombineBlock(blockName: string): boolean {
  return blockName.startsWith('POST COMBINE');
}

/**
 * Check if a block name is PRE COMBINE
 */
export function isPreCombineBlock(blockName: string): boolean {
  return blockName.startsWith('PRE COMBINE');
}
