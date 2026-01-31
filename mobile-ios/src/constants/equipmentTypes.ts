// src/constants/equipmentTypes.ts
export const EQUIPMENT_TYPES = {
  AC_DISCONNECT: "AC Disconnect",
  BATTERY_STORAGE: "Battery",
  CONDUCTOR: "Conductor",
  CONDUIT: "Conduit",
  FUSED_AC_DISCONNECT: "Fused AC Disconnect",
  INVERTER: "Inverter",
  INVERTER_OPTIMIZER: "Inverter Optimizer",
  JUNCTION_BOX: "Junction Box",
  LOAD_CENTER: "Load Center",
  MICROINVERTER: "MicroInverter",
  MOUNTING_HARDWARE: "Mounting Hardware",
  PV_METER: "PV Meter",
  RAIL: "Rail",
  SMS: "SMS",
  SOLAR_PANEL: "Solar Panel",
  STRING_COMBINER_PANEL: "String Combiner Panel",
} as const;

export type EquipmentType =
  (typeof EQUIPMENT_TYPES)[keyof typeof EQUIPMENT_TYPES];

export const EQUIPMENT_TYPE_LIST: ReadonlyArray<EquipmentType> =
  Object.values(EQUIPMENT_TYPES);

/** Type guard */
export function isEquipmentType(v: unknown): v is EquipmentType {
  return (
    typeof v === "string" && EQUIPMENT_TYPE_LIST.includes(v as EquipmentType)
  );
}

/** Optional: coerce sloppy inputs (case/spacing/hyphens) to a valid EquipmentType */
export function coerceEquipmentType(
  raw: string | null | undefined
): EquipmentType | null {
  if (!raw) return null;
  const cleaned = raw
    .trim()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();

  // exact match first
  const exact = EQUIPMENT_TYPE_LIST.find((t) => t.toLowerCase() === cleaned);
  if (exact) return exact;

  // simple aliases
  const aliasMap: Record<string, EquipmentType> = {
    "micro inverter": "MicroInverter",
    microinverter: "MicroInverter",
    "string combiner": "String Combiner Panel",
    battery: "Battery",
    optimizer: "Inverter Optimizer",
  };

  return aliasMap[cleaned] ?? null;
}
