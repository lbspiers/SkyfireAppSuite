// Equipment type options for BOS dropdowns (General/Gen utility)
export const EQUIPMENT_TYPE_OPTIONS = [
  { label: "AC Disconnect", value: "AC Disconnect" },
  { label: "Fused AC Disconnect", value: "Fused AC Disconnect" },
  { label: "Combiner Panel", value: "Combiner Panel" },
  { label: "Position Combiner Panel", value: "Position Combiner Panel" },
  { label: "String Combiner Panel", value: "String Combiner Panel" },
  { label: "PV Meter", value: "PV Meter" },
  { label: "Bi-Directional Meter", value: "Bi-Directional Meter" },
  {
    label: "Bi-Directional Meter DER Side Disconnect",
    value: "Bi-Directional Meter DER Side Disconnect",
  },
  {
    label: "Bi-Directional Meter Line Side Disconnect",
    value: "Bi-Directional Meter Line Side Disconnect",
  },
  { label: "Uni-Directional Meter", value: "Uni-Directional Meter" },
  {
    label: "Uni-Directional Meter Line Side Disconnect",
    value: "Uni-Directional Meter Line Side Disconnect",
  },
  { label: "DER Storage Meter", value: "DER Storage Meter" },
] as const;

/**
 * Get utility-specific equipment type options for BOS dropdowns
 * @param utilityAbbrev - Utility abbreviation (e.g., "APS", "SRP", "TEP", "Gen")
 * @returns Array of equipment type options with utility-specific naming
 */
export const getUtilityEquipmentTypeOptions = (
  utilityAbbrev?: string
): Array<{ label: string; value: string }> => {
  // Default to "Gen" if no utility specified
  const utility = utilityAbbrev || "Gen";

  // If utility doesn't have translations, return general options
  if (!BOS_EQUIPMENT_TRANSLATION[utility]) {
    return Array.from(EQUIPMENT_TYPE_OPTIONS);
  }

  // Get the translation map for this utility
  const translations = BOS_EQUIPMENT_TRANSLATION[utility];

  // Build set of input names that have a DIFFERENT translation (not self-referential)
  const standardNamesToExclude = new Set<string>();
  Object.entries(translations).forEach(([inputName, outputName]) => {
    if (inputName !== outputName) {
      // This is a real translation (e.g., "AC Disconnect" -> "Utility Disconnect")
      // We should exclude the input name from appearing in dropdown
      standardNamesToExclude.add(inputName);
    }
  });

  // Extract unique output equipment types (the values in the translation map)
  const uniqueTypes = new Set<string>();
  Object.values(translations).forEach((translatedName) => {
    uniqueTypes.add(translatedName);
  });

  // Filter out any standard names that were translated to something else
  const filteredTypes = Array.from(uniqueTypes).filter(
    (type) => !standardNamesToExclude.has(type)
  );

  // Convert to dropdown options, sorted alphabetically
  const options = filteredTypes
    .map((type) => ({ label: type, value: type }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return options;
};

// Maps utility-specific names back to their standard equipment type
export const UTILITY_EQUIPMENT_TO_STANDARD: Record<string, string> = {
  // Standard Names (map to themselves)
  "AC Disconnect": "AC Disconnect",
  "Fused AC Disconnect": "Fused AC Disconnect",
  "Combiner Panel": "Combiner Panel",
  "PV Meter": "PV Meter",

  // APS Specific Names
  "Utility Disconnect": "AC Disconnect",
  "Photovoltaic System Disconnect Switch": "Fused AC Disconnect",
  "Photovoltaic System Disconnect": "Fused AC Disconnect",
  "Photovoltaic System Service Disconnect": "Fused AC Disconnect",
  "Bi-Directional Meter": "PV Meter",
  "Uni-Directional Meter": "PV Meter",
  "Bi-Directional Meter DER Side Disconnect": "AC Disconnect",
  "Bi-Directional Meter Line Side Disconnect": "AC Disconnect",
  "Uni-Directional Meter Line Side Disconnect": "AC Disconnect",

  // SRP Specific Names
  "DER Meter Disconnect Switch": "AC Disconnect",
  "Utility AC Disconnect Switch": "Fused AC Disconnect",
  "Fused Utility Disconnect Switch": "Fused AC Disconnect",
  "Dedicated DER Meter": "PV Meter",
  "DER Storage Meter": "PV Meter",

  // TEP Specific Names
  "DG Disconnect Switch": "AC Disconnect",
  "Utility DG Meter": "PV Meter",

  // TRICO Specific Names
  "Co-Generation System Utility Disconnect": "AC Disconnect",
};

// Maps standard equipment types to utility-specific names per utility
export const STANDARD_TO_UTILITY_EQUIPMENT: Record<
  string,
  Record<string, string>
> = {
  Gen: {
    "AC Disconnect": "AC Disconnect",
    "Fused AC Disconnect": "Fused AC Disconnect",
    "Combiner Panel": "Combiner Panel",
    "PV Meter": "PV Meter",
  },
  APS: {
    "AC Disconnect": "Utility Disconnect",
    "Fused AC Disconnect": "Photovoltaic System Disconnect Switch",
    "Combiner Panel": "Combiner Panel",
    "PV Meter": "Uni-Directional Meter",
  },
  SRP: {
    "AC Disconnect": "DER Meter Disconnect Switch",
    "Fused AC Disconnect": "Utility AC Disconnect Switch",
    "Combiner Panel": "Combiner Panel",
    "PV Meter": "Dedicated DER Meter",
  },
  TEP: {
    "AC Disconnect": "DG Disconnect Switch",
    "Fused AC Disconnect": "Photovoltaic System Disconnect",
    "Combiner Panel": "Combiner Panel",
    "PV Meter": "Utility DG Meter",
  },
  TRICO: {
    "AC Disconnect": "Co-Generation System Utility Disconnect",
    "Fused AC Disconnect": "Fused AC Disconnect",
    "Combiner Panel": "Combiner Panel",
    "PV Meter": "PV Meter",
  },
  UniSource: {
    "AC Disconnect": "AC Disconnect",
    "Fused AC Disconnect": "Fused AC Disconnect",
    "Combiner Panel": "Combiner Panel",
    "PV Meter": "Utility DG Meter",
  },
  "Sulphur Springs Valley Electric Cooperative": {
    "AC Disconnect": "DG Disconnect Switch",
    "Fused AC Disconnect": "Fused AC Disconnect",
    "Combiner Panel": "Combiner Panel",
    "PV Meter": "PV Meter",
  },
};

// BOS Equipment Catalog - Standard equipment types only
export const BOS_EQUIPMENT_CATALOG = [
  // AC Disconnects
  {
    type: "AC Disconnect",
    make: "CUTLER HAMMER",
    model: "DG221URB",
    amp: "30",
  },
  {
    type: "AC Disconnect",
    make: "CUTLER HAMMER",
    model: "DG222URB",
    amp: "60",
  },
  {
    type: "AC Disconnect",
    make: "CUTLER HAMMER",
    model: "DG323UGB",
    amp: "100",
  },
  {
    type: "AC Disconnect",
    make: "CUTLER HAMMER",
    model: "DG324URK",
    amp: "200",
  },
  { type: "AC Disconnect", make: "EATON", model: "DG221URB", amp: "30" },
  { type: "AC Disconnect", make: "EATON", model: "DG222URB", amp: "60" },
  { type: "AC Disconnect", make: "EATON", model: "DG223URB", amp: "100" },
  { type: "AC Disconnect", make: "EATON", model: "DG324URK", amp: "200" },
  { type: "AC Disconnect", make: "SIEMENS", model: "DU324RB", amp: "200" },
  { type: "AC Disconnect", make: "SIEMENS", model: "GNF323R", amp: "100" },
  { type: "AC Disconnect", make: "SIEMENS", model: "LNF221R", amp: "30" },
  { type: "AC Disconnect", make: "SIEMENS", model: "LNF222R", amp: "60" },
  { type: "AC Disconnect", make: "SQUARE D", model: "DU221RB", amp: "30" },
  { type: "AC Disconnect", make: "SQUARE D", model: "DU222RB", amp: "60" },
  { type: "AC Disconnect", make: "SQUARE D", model: "DTU223RB", amp: "100" },
  { type: "AC Disconnect", make: "SQUARE D", model: "DU324RB", amp: "200" },

  // Fused AC Disconnects
  {
    type: "Fused AC Disconnect",
    make: "CUTLER HAMMER",
    model: "DG221NRB",
    amp: "30",
  },
  {
    type: "Fused AC Disconnect",
    make: "CUTLER HAMMER",
    model: "DG222NRB",
    amp: "60",
  },
  {
    type: "Fused AC Disconnect",
    make: "CUTLER HAMMER",
    model: "DG223NRB",
    amp: "100",
  },
  {
    type: "Fused AC Disconnect",
    make: "CUTLER HAMMER",
    model: "DG324NRK",
    amp: "200",
  },
  { type: "Fused AC Disconnect", make: "EATON", model: "DG221NRB", amp: "30" },
  { type: "Fused AC Disconnect", make: "EATON", model: "DG222NRB", amp: "60" },
  { type: "Fused AC Disconnect", make: "EATON", model: "DG223NRB", amp: "100" },
  { type: "Fused AC Disconnect", make: "EATON", model: "DG324NRK", amp: "200" },
  {
    type: "Fused AC Disconnect",
    make: "SIEMENS",
    model: "GF224NR",
    amp: "200",
  },
  { type: "Fused AC Disconnect", make: "SIEMENS", model: "GF323", amp: "100" },
  { type: "Fused AC Disconnect", make: "SIEMENS", model: "LF221R", amp: "30" },
  { type: "Fused AC Disconnect", make: "SIEMENS", model: "LF222R", amp: "60" },
  {
    type: "Fused AC Disconnect",
    make: "SQUARE D",
    model: "D221NRB",
    amp: "30",
  },

  // Combiner Panels
  { type: "Combiner Panel", make: "EATON", model: "BR816L100RP", amp: "100" },
  { type: "Combiner Panel", make: "EATON", model: "BR816L125RP", amp: "125" },
  { type: "Combiner Panel", make: "EATON", model: "BR816L200RP", amp: "200" },
  {
    type: "Combiner Panel",
    make: "SIEMENS",
    model: "W0816ML1125CU",
    amp: "125",
  },

  // PV Meters
  { type: "PV Meter", make: "EATON", model: "011", amp: "125" },
  { type: "PV Meter", make: "EATON", model: "1004455BCH", amp: "200" },
  { type: "PV Meter", make: "MILBANK", model: "U4015-0", amp: "200" },
  { type: "PV Meter", make: "MILBANK", model: "U4518-XL-W", amp: "200" },
  { type: "PV Meter", make: "MILBANK", model: "U5929XL", amp: "100" },
  { type: "PV Meter", make: "SIEMENS", model: "UAT111-BPCC", amp: "135" },

  // Cutler Hammer Dedicated DER Meters - 125 Amp
  { type: "PV Meter", make: "CUTLER HAMMER", model: "Dedicated DER Meter Cutler Hammer 125", amp: "125" },

  // Cutler Hammer Dedicated DER Meters - 200 Amp
  { type: "PV Meter", make: "CUTLER HAMMER", model: "Dedicated DER Meter Cutler Hammer 200", amp: "200" },

  // Milbank Dedicated DER Meters - 100 Amp
  { type: "PV Meter", make: "MILBANK", model: "Dedicated DER Meter Milbank 100", amp: "100" },

  // Milbank Dedicated DER Meters - 125 Amp
  { type: "PV Meter", make: "MILBANK", model: "Dedicated DER Meter Milbank 125", amp: "125" },

  // Milbank Dedicated DER Meters - 200 Amp
  { type: "PV Meter", make: "MILBANK", model: "Dedicated DER Meter Milbank 200", amp: "200" },
];

export const MAIN_CIRCUIT_BREAKER_RATINGS = [
  { value: "MLO", label: "MLO" },
  { value: "100", label: "100 Amps" },
  { value: "110", label: "110 Amps" },
  { value: "125", label: "125 Amps" },
  { value: "150", label: "150 Amps" },
  { value: "175", label: "175 Amps" },
  { value: "200", label: "200 Amps" },
  { value: "225", label: "225 Amps" },
  { value: "250", label: "250 Amps" },
  { value: "300", label: "300 Amps" },
  { value: "350", label: "350 Amps" },
  { value: "400", label: "400 Amps" },
  { value: "450", label: "450 Amps" },
  { value: "500", label: "500 Amps" },
  { value: "600", label: "600 Amps" },
];

export const BUS_BAR_RATING = [
  { value: "60", label: "60 Amps" },
  { value: "70", label: "70 Amps" },
  { value: "80", label: "80 Amps" },
  { value: "90", label: "90 Amps" },
  { value: "100", label: "100 Amps" },
  { value: "110", label: "110 Amps" },
  { value: "125", label: "125 Amps" },
  { value: "150", label: "150 Amps" },
  { value: "175", label: "175 Amps" },
  { value: "200", label: "200 Amps" },
  { value: "225", label: "225 Amps" },
  { value: "250", label: "250 Amps" },
  { value: "300", label: "300 Amps" },
  { value: "350", label: "350 Amps" },
  { value: "400", label: "400 Amps" },
  { value: "450", label: "450 Amps" },
  { value: "500", label: "500 Amps" },
  { value: "600", label: "600 Amps" },
];

export const FEEDER_LOCATIONS = [
  { value: "Top", label: "Top" },
  { value: "Center", label: "Center" },
  { value: "Bottom", label: "Bottom" },
];

export const TIE_IN_LOCATIONS = [
  { value: "Main Panel (A) Bus", label: "Main Panel (A) Bus" },
  { value: "Sub Panel (B) MCB Spot (M2)", label: "Sub Panel (B) MCB Spot (M2)" },
  { value: "Sub Panel (B) MCB Spot (M3)", label: "Sub Panel (B) MCB Spot (M3)" },
];

// Conductor Sizing (Wire Gauge) Options
export const CONDUCTOR_SIZING = [
  { value: "14", label: "14" },
  { value: "12", label: "12" },
  { value: "10", label: "10" },
  { value: "8", label: "8" },
  { value: "6", label: "6" },
  { value: "4", label: "4" },
  { value: "3", label: "3" },
  { value: "2", label: "2" },
  { value: "1", label: "1" },
  { value: "1/0", label: "1/0" },
  { value: "2/0", label: "2/0" },
  { value: "3/0", label: "3/0" },
  { value: "4/0", label: "4/0" },
];

// String Combiner Panel Models by Make
export const STRING_COMBINER_MODELS = {
  "Cutler-Hammer": [
    { label: "100 Amp", value: "100 Amp" },
    { label: "100 Amp", value: "100 Amp" },
    { label: "125 Amps", value: "125 Amps" },
    { label: "150 Amps", value: "150 Amps" },
    { label: "175 Amps", value: "175 Amps" },
    { label: "200 Amps", value: "200 Amps" },
    { label: "60 Amp", value: "60 Amp" },
  ],
  "Eaton": [
    { label: "100 Amp", value: "100 Amp" },
    { label: "125 Amps", value: "125 Amps" },
    { label: "150 Amps", value: "150 Amps" },
    { label: "175 Amps", value: "175 Amps" },
    { label: "200 Amps", value: "200 Amps" },
    { label: "60 Amp", value: "60 Amp" },
  ],
  "Enphase": [
    { label: "AC COMBINER BOX XAM1-120", value: "AC COMBINER BOX XAM1-120" },
    { label: "AC COMBINER BOX XAM1-120-B", value: "AC COMBINER BOX XAM1-120-B" },
    { label: "IQ COMBINER 3C X-IQ-AM1-240-3C", value: "IQ COMBINER 3C X-IQ-AM1-240-3C" },
    { label: "IQ COMBINER 3C-ES X-IQ-AM1-240-3C", value: "IQ COMBINER 3C-ES X-IQ-AM1-240-3C" },
    { label: "IQ COMBINER 3-ES X-IQ-AM1-240-3", value: "IQ COMBINER 3-ES X-IQ-AM1-240-3" },
    { label: "IQ COMBINER 4 X-IQAM1-240-4", value: "IQ COMBINER 4 X-IQAM1-240-4" },
    { label: "IQ COMBINER 4C-ES X-IQ-AM1-240-4C", value: "IQ COMBINER 4C-ES X-IQ-AM1-240-4C" },
    { label: "IQ COMBINER 4-ES X-IQ-AM1-240-4", value: "IQ COMBINER 4-ES X-IQ-AM1-240-4" },
    { label: "IQ Combiner 5C X-A-M1-240-5C", value: "IQ Combiner 5C X-A-M1-240-5C" },
    { label: "IQ COMBINER X-IQ-AM1-240-3", value: "IQ COMBINER X-IQ-AM1-240-3" },
    { label: "IQ COMBINER X-IQ-AM1-240-3C", value: "IQ COMBINER X-IQ-AM1-240-3C" },
    { label: "IQ COMBINER X-IQ-AM1-240-3C", value: "IQ COMBINER X-IQ-AM1-240-3C" },
    { label: "IQ COMBINER X-IQ-AM1-240-3C", value: "IQ COMBINER X-IQ-AM1-240-3C" },
    { label: "IQ COMBINER X-IQ-AM1-240-3C", value: "IQ COMBINER X-IQ-AM1-240-3C" },
    { label: "IQ COMBINER X-IQ-AM1-240-4", value: "IQ COMBINER X-IQ-AM1-240-4" },
    { label: "IQ COMBINER X-IQ-AM1-240-4C", value: "IQ COMBINER X-IQ-AM1-240-4C" },
    { label: "IQ COMBINER X-IQ-AM1-240-4C", value: "IQ COMBINER X-IQ-AM1-240-4C" },
    { label: "X2-IQ-AM1-240-4C", value: "X2-IQ-AM1-240-4C" },
    { label: "X-IQ-AM1-240-2", value: "X-IQ-AM1-240-2" },
  ],
  "Siemens": [
    { label: "100 Amp", value: "100 Amp" },
    { label: "125 Amps", value: "125 Amps" },
    { label: "150 Amps", value: "150 Amps" },
    { label: "175 Amps", value: "175 Amps" },
    { label: "200 Amps", value: "200 Amps" },
    { label: "60 Amp", value: "60 Amp" },
  ],
  "Square D": [
    { label: "100 Amp", value: "100 Amp" },
    { label: "125 Amps", value: "125 Amps" },
    { label: "150 Amps", value: "150 Amps" },
    { label: "175 Amps", value: "175 Amps" },
    { label: "200 Amps", value: "200 Amps" },
    { label: "60 Amp", value: "60 Amp" },
  ],
};

export const BREAKER_LOCATIONS = [
  { value: "Top", label: "Top" },
  { value: "Center", label: "Center" },
  { value: "Bottom", label: "Bottom" },
];

export const ROOFING_MATERIAL = [
  { label: "Comp Shingle", value: "Comp Shingle" },
  { label: "W Tile", value: "W Tile" },
  { label: "F Tile", value: "F Tile" },
  { label: "S Tile", value: "S Tile" },
  { label: "Clay Tile", value: "Clay Tile" },
  { label: "Slate", value: "Slate" },
  { label: "Spanish Tile", value: "Spanish Tile" },
  { label: "Tar & Gravel", value: "Tar & Gravel" },
  { label: "Carport", value: "Carport" },
  { label: "Foam", value: "Foam" },
  { label: "Ground Mount", value: "Ground Mount" },
  { label: "Mod Bit", value: "Mod Bit" },
  { label: "Metal Seam, 12in", value: "Metal Seam, 12in" },
  { label: "Metal Seam, 18in", value: "Metal Seam, 18in" },
  { label: "Metal Seam, 16in", value: "Metal Seam, 16in" },
  { label: "Metal Corrugated", value: "Metal Corrugated" },
  { label: "Metal Shingles", value: "Metal Shingles" },
  { label: "Wood Shake", value: "Wood Shake" },
  { label: "Wood Shingle", value: "Wood Shingle" },
  { label: "Metal Seam, 24in", value: "Metal Seam, 24in" },
];

export const FRAMING_MEMBER_SIZE = [
  { label: "2x4", value: "2x4" },
  { label: "2x8", value: "2x8" },
  { label: "2x10", value: "2x10" },
  { label: "2x6", value: "2x6" },
  { label: "4x4", value: "4x4" },
  { label: "4x6", value: "4x6" },
  { label: "4x8", value: "4x8" },
  { label: "2x12", value: "2x12" },
  { label: "4x12", value: "4x12" },
  { label: "4x10", value: "4x10" },
  { label: "4x14", value: "4x14" },
  { label: "4x16", value: "4x16" },
];

export const FRAMING_MEMBER_SPACING = [
  { label: '12"', value: '12"' },
  { label: '16"', value: '16"' },
  { label: '24"', value: '24"' },
  { label: '32"', value: '32"' },
  { label: '72"', value: '72"' },
  { label: '64"', value: '64"' },
  { label: '48"', value: '48"' },
];
// Project Status Mapping (backend enum -> readable label)
export const STATUS_OPTIONS: Record<number, string> = {
  0: "Sales",
  1: "Site Survey",
  2: "Design",
  3: "Revisions",
  4: "Permits",
  5: "Install",
  6: "Commissioning",
  7: "Inspection",
  8: "PTO",
  9: "Canceled",
  10: "On Hold",
};
// Pills Filter UI
export const STATUS_FILTERS = ["All", ...Object.values(STATUS_OPTIONS)];
// Sorting Options
export const SORT_OPTIONS = [
  "Last Name (A → Z)",
  "Last Name (Z → A)",
  "Created Date (Newest → Oldest)",
  "Created Date (Oldest → Newest)",
];
export const STATUS_GRADIENTS: Record<string, [string, string]> = {
  Sales: ["#E6C800", "#A68D00"],
  "Site Survey": ["#32BCFD", "#1E7097"],
  Design: ["#FD7332", "#EF3826"],
  Revisions: ["#FF0000", "#8B0000"],
  Permits: ["#1F51A5", "#0C1F3F"],
  Install: ["#00B140", "#006B26"],
  Commissioning: ["#00B7C2", "#006D75"],
  Inspection: ["#0057B7", "#00274D"],
  PTO: ["#6A0DAD", "#3F0071"],
  Canceled: ["#979797", "#555555"],
  "On Hold": ["#000000", "#333333"],
};
export const STATUS_COLORS: Record<string, string> = {
  All: "#2E4161", // fallback/default if you like
  Sales: "#E6C800",
  "Site Survey": "#FFA300",
  Design: "#FD7332",
  Revisions: "#FF0000",
  Permits: "#7FDB51",
  Install: "#00B140",
  Commissioning: "#00B7C2",
  Inspection: "#00B7C2",
  PTO: "#6A0DAD",
  "On Hold": "#979797",
  Canceled: "#000000",
};

export const ADMIN_INSTALLERS = [
  "Inty Power",
  "EnergyAid",
  "Stephen Griffin Construction",
  "Sun Energy Today",
  "Skyfire Solar Design",
  "Universal Solar Direct",
];

export const US_STATES: { label: string; value: string }[] = [
  { label: "Alabama", value: "AL" },
  { label: "Alaska", value: "AK" },
  { label: "Arizona", value: "AZ" },
  { label: "Arkansas", value: "AR" },
  { label: "California", value: "CA" },
  { label: "Colorado", value: "CO" },
  { label: "Connecticut", value: "CT" },
  { label: "Delaware", value: "DE" },
  { label: "Florida", value: "FL" },
  { label: "Georgia", value: "GA" },
  { label: "Hawaii", value: "HI" },
  { label: "Idaho", value: "ID" },
  { label: "Illinois", value: "IL" },
  { label: "Indiana", value: "IN" },
  { label: "Iowa", value: "IA" },
  { label: "Kansas", value: "KS" },
  { label: "Kentucky", value: "KY" },
  { label: "Louisiana", value: "LA" },
  { label: "Maine", value: "ME" },
  { label: "Maryland", value: "MD" },
  { label: "Massachusetts", value: "MA" },
  { label: "Michigan", value: "MI" },
  { label: "Minnesota", value: "MN" },
  { label: "Mississippi", value: "MS" },
  { label: "Missouri", value: "MO" },
  { label: "Montana", value: "MT" },
  { label: "Nebraska", value: "NE" },
  { label: "Nevada", value: "NV" },
  { label: "New Hampshire", value: "NH" },
  { label: "New Jersey", value: "NJ" },
  { label: "New Mexico", value: "NM" },
  { label: "New York", value: "NY" },
  { label: "North Carolina", value: "NC" },
  { label: "North Dakota", value: "ND" },
  { label: "Ohio", value: "OH" },
  { label: "Oklahoma", value: "OK" },
  { label: "Oregon", value: "OR" },
  { label: "Pennsylvania", value: "PA" },
  { label: "Rhode Island", value: "RI" },
  { label: "South Carolina", value: "SC" },
  { label: "South Dakota", value: "SD" },
  { label: "Tennessee", value: "TN" },
  { label: "Texas", value: "TX" },
  { label: "Utah", value: "UT" },
  { label: "Vermont", value: "VT" },
  { label: "Virginia", value: "VA" },
  { label: "Washington", value: "WA" },
  { label: "West Virginia", value: "WV" },
  { label: "Wisconsin", value: "WI" },
  { label: "Wyoming", value: "WY" },
];
export const SERVICE_TYPE_OPTIONS = [
  {
    label: "Meter & Main Panel All-in-One",
    value: "Meter & Main Panel All-in-One",
  },
  {
    label: "Meter & Main Panel Detached",
    value: "Meter & Main Panel Detached",
  },
  {
    label: "Hot Bus Panel",
    value: "Hot Bus Panel",
  },
  {
    label: "Pedestal",
    value: "Pedestal",
  },
  {
    label: "Solar Ready",
    value: "Solar Ready",
  },
];

export const POI_TYPE_OPTIONS = [
  { label: "PV Breaker (OCPD)", value: "PV Breaker (OCPD)" },
  { label: "Line (Supply) Side Tap", value: "Line (Supply) Side Tap" },
  { label: "Load Side Tap", value: "Load Side Tap" },
  { label: "Lug Kit", value: "Lug Kit" },
  { label: "Meter Collar Adapter", value: "Meter Collar Adapter" },
  { label: "Solar Ready", value: "Solar Ready" },
] as const;

// 2) POI Location, per type
export const POI_LOCATION_MAP: Record<
  string,
  { label: string; value: string }[]
> = {
  "PV Breaker (OCPD)": [
    { label: "Main Panel (A) Bus", value: "Main Panel (A) Bus" },
    { label: "Sub Panel (B) Bus", value: "Sub Panel (B) Bus" },
    {
      label: "Sub Panel (B) MCB Spot (M2)",
      value: "Sub Panel (B) MCB Spot (M2)",
    },
    { label: "Sub Panel (C) Bus", value: "Sub Panel (C) Bus" },
    {
      label: "Sub Panel (C) MCB Spot (M3)",
      value: "Sub Panel (C) MCB Spot (M3)",
    },
    { label: "Sub Panel (D) Bus", value: "Sub Panel (D) Bus" },
  ],
  "Line (Supply) Side Tap": [
    {
      label: "Between Main Panel (A) MCB & Utility Meter",
      value: "Between Main Panel (A) MCB & Utility Meter",
    },
  ],
  "Load Side Tap": [
    {
      label: "Between Main Panel (A) Bus & MCB",
      value: "Between Main Panel (A) Bus & MCB",
    },
    {
      label: "Between Main Panel (A) & Sub Panel (B)",
      value: "Between Main Panel (A) & Sub Panel (B)",
    },
  ],
  "Lug Kit": [
    { label: "Main Panel (A) Bus", value: "Main Panel (A) Bus" },
    { label: "Sub Panel (B) Bus", value: "Sub Panel (B) Bus" },
    {
      label: "Sub Panel (B) MCB Spot (M2)",
      value: "Sub Panel (B) MCB Spot (M2)",
    },
    { label: "Sub Panel (C) Bus", value: "Sub Panel (C) Bus" },
    {
      label: "Sub Panel (C) MCB Spot (M3)",
      value: "Sub Panel (C) MCB Spot (M3)",
    },
    { label: "Sub Panel (D) Bus", value: "Sub Panel (D) Bus" },
  ],
  "Meter Collar Adapter": [
    { label: "Utility Meter", value: "Utility Meter" },
    {
      label: "Detatched Meter Enclosure",
      value: "Detatched Meter Enclosure",
    },
  ],
  "Solar Ready": [
    { label: "60A Dedicated PV Input", value: "60A Dedicated PV Input" },
    { label: "100A Dedicated PV Input", value: "100A Dedicated PV Input" },
    { label: "200A Dedicated PV Input", value: "200A Dedicated PV Input" },
  ],
};

export const BREAKER_RATING_OPTIONS = [
  { label: "MLO", value: "MLO" },
  { label: "20", value: "20" },
  { label: "30", value: "30" },
  { label: "40", value: "40" },
  { label: "50", value: "50" },
  { label: "60", value: "60" },
  { label: "80", value: "80" },
  { label: "100", value: "100" },
  { label: "110", value: "110" },
  { label: "125", value: "125" },
  { label: "150", value: "150" },
  { label: "175", value: "175" },
  { label: "200", value: "200" },
  { label: "225", value: "225" },
  { label: "250", value: "250" },
  { label: "300", value: "300" },
  { label: "350", value: "350" },
  { label: "400", value: "400" },
  { label: "450", value: "450" },
  { label: "500", value: "500" },
  { label: "600", value: "600" },
] as const;

export const LOADCALCS_BREAKER_RATING_OPTIONS = [
  { label: "15", value: "15" },
  { label: "20", value: "20" },
  { label: "25", value: "25" },
  { label: "30", value: "30" },
  { label: "40", value: "40" },
  { label: "60", value: "60" },
  { label: "80", value: "80" },
  { label: "100", value: "100" },
  { label: "110", value: "110" },
  { label: "125", value: "125" },
  { label: "150", value: "150" },
  { label: "175", value: "175" },
] as const;

// Power Control System (PCS) Amps - 15 to 200 by 5's
export const PCS_AMPS_OPTIONS = Array.from({ length: 38 }, (_, i) => {
  const value = String(15 + i * 5);
  return { label: value, value };
});

export const FUSE_OPTIONS = [
  { label: "20", value: "20" },
  { label: "30", value: "30" },
  { label: "40", value: "40" },
  { label: "60", value: "60" },
  { label: "80", value: "80" },
  { label: "100", value: "100" },
  { label: "110", value: "110" },
  { label: "125", value: "125" },
  { label: "150", value: "150" },
  { label: "175", value: "175" },
  { label: "200", value: "200" },
] as const;

// BOS Equipment Name Translation Table
// Maps standard equipment catalog names to utility-specific variation names
// Direction: Standard Name (from DB) → Utility-Specific Variation (for display)
//
// Structure: Record<UtilityName, Record<InputEquipmentName, OutputEquipmentName>>
// - First level keys: Utility company names (e.g., "APS", "SRP", "TEP", "TRICO", "UniSource", "Sulphur Springs Valley Electric Cooperative", "Gen")
// - Second level: Maps equipment input variations to utility-specific output names
// - Self-referential mappings (e.g., "Utility Disconnect": "Utility Disconnect") handle cases where input already matches desired output
// - "Gen" utility acts as comprehensive fallback with generic mappings
export const BOS_EQUIPMENT_TRANSLATION: Record<
  string,
  Record<string, string>
> = {
  APS: {
    // AC Disconnects
    "AC Disconnect": "Utility Disconnect",
    "Utility Disconnect": "Utility Disconnect",
    "Bi-Directional Meter DER Side Disconnect":
      "Bi-Directional Meter DER Side Disconnect",
    "Bi-Directional Meter Line Side Disconnect":
      "Bi-Directional Meter Line Side Disconnect",
    "Uni-Directional Meter Line Side Disconnect":
      "Uni-Directional Meter Line Side Disconnect",
    "DER Meter Disconnect Switch": "Utility Disconnect",

    // Fused AC Disconnects
    "Fused AC Disconnect": "Photovoltaic System Disconnect Switch",
    "Photovoltaic System Disconnect Switch":
      "Photovoltaic System Disconnect Switch",
    "Photovoltaic System Disconnect": "Photovoltaic System Disconnect Switch",
    "Photovoltaic System Service Disconnect":
      "Photovoltaic System Disconnect Switch",
    "Utility AC Disconnect Switch": "Photovoltaic System Disconnect Switch", // Old name, maps to correct one
    "Uitlity AC Disconnect Switch": "Photovoltaic System Disconnect Switch", // Keep typo for compatibility

    // Meters (PV-only default is Uni-Directional, storage/battery uses Bi-Directional)
    "PV Meter": "Uni-Directional Meter",
    "Uni-Directional Meter": "Uni-Directional Meter",
    "Bi-Directional Meter": "Bi-Directional Meter",
    "DER Storage Meter": "Bi-Directional Meter",
    "Dedicated DER Meter": "Uni-Directional Meter",

    // Combiner Panels
    "Combiner Panel": "Dedicated Photovoltaic System Combiner Panel",
    "Position Combiner Panel": "Dedicated Photovoltaic System Combiner Panel",
    "Dedicated Photovoltaic System Combiner Panel":
      "Dedicated Photovoltaic System Combiner Panel",
    "String Combiner Panel": "String Combiner Panel",
  },

  SRP: {
    // AC Disconnects
    "AC Disconnect": "DER Meter Disconnect Switch",
    "DER Meter Disconnect Switch": "DER Meter Disconnect Switch",
    "Bi-Directional Meter DER Side Disconnect":
      "DER Meter Disconnect Switch",
    "Uni-Directional Meter Line Side Disconnect":
      "DER Meter Disconnect Switch",

    // Fused AC Disconnects
    "Fused AC Disconnect": "Fused Utility Disconnect Switch",
    "Utility AC Disconnect Switch": "Utility AC Disconnect Switch",
    "Photovoltaic System Disconnect": "Utility AC Disconnect Switch",
    "Photovoltaic System Disconnect Switch": "Utility AC Disconnect Switch",
    "Photovoltaic System Service Disconnect": "Utility AC Disconnect Switch",

    // Meters
    "PV Meter": "Dedicated DER Meter",
    "Dedicated DER Meter": "Dedicated DER Meter",
    "Bi-Directional Meter": "Dedicated DER Meter",
    "Uni-Directional Meter": "Dedicated DER Meter",
    "DER Storage Meter": "Dedicated DER Meter",

    // Combiner Panels
    "Combiner Panel": "Combiner Panel",
    "Position Combiner Panel": "Position Combiner Panel",
    "String Combiner Panel": "String Combiner Panel",
  },

  TEP: {
    // AC Disconnects
    "AC Disconnect": "DG Disconnect Switch",
    "DG Disconnect Switch": "DG Disconnect Switch",
    "Bi-Directional Meter DER Side Disconnect": "DG Disconnect Switch",
    "Uni-Directional Meter Line Side Disconnect": "DG Disconnect Switch",
    "DER Meter Disconnect Switch": "DG Disconnect Switch",
    "DER Storage Meter Disconnect Switch": "DG Disconnect Switch",

    // Fused AC Disconnects
    "Fused AC Disconnect": "Photovoltaic System Disconnect",
    "Photovoltaic System Disconnect": "Photovoltaic System Disconnect",
    "Photovoltaic System Disconnect Switch": "Photovoltaic System Disconnect",
    "Photovoltaic System Service Disconnect": "Photovoltaic System Disconnect",
    "Utility AC Disconnect Switch": "Photovoltaic System Disconnect",

    // Meters
    "PV Meter": "Utility DG Meter",
    "Utility DG Meter": "Utility DG Meter",
    "Bi-Directional Meter": "Utility DG Meter",
    "Uni-Directional Meter": "Utility DG Meter",
    "DER Storage Meter": "Utility DG Meter",
    "Dedicated DER Meter": "Utility DG Meter",

    // Combiner Panels
    "Combiner Panel": "Combiner Panel",
    "Position Combiner Panel": "Position Combiner Panel",
    "String Combiner Panel": "String Combiner Panel",
  },

  TRICO: {
    // AC Disconnects
    "AC Disconnect": "Co-Generation System Utility Disconnect",
    "Co-Generation System Utility Disconnect":
      "Co-Generation System Utility Disconnect",
    "Bi-Directional Meter DER Side Disconnect":
      "Co-Generation System Utility Disconnect",
    "Uni-Directional Meter Line Side Disconnect":
      "Co-Generation System Utility Disconnect",
    "DER Meter Disconnect Switch": "Co-Generation System Utility Disconnect",
    "DER Storage Meter Disconnect Switch":
      "Co-Generation System Utility Disconnect",

    // Fused AC Disconnects
    "Fused AC Disconnect": "Fused AC Disconnect",
    "Photovoltaic System Disconnect": "Fused AC Disconnect",
    "Photovoltaic System Disconnect Switch": "Fused AC Disconnect",
    "Photovoltaic System Service Disconnect": "Fused AC Disconnect",
    "Utility AC Disconnect Switch": "Fused AC Disconnect",

    // Meters
    "PV Meter": "PV Meter",
    "Bi-Directional Meter": "PV Meter",
    "Uni-Directional Meter": "PV Meter",
    "DER Storage Meter": "PV Meter",
    "Dedicated DER Meter": "PV Meter",
    "Utility DG Meter": "PV Meter",

    // Combiner Panels
    "Combiner Panel": "Combiner Panel",
    "Position Combiner Panel": "Position Combiner Panel",
    "String Combiner Panel": "String Combiner Panel",
  },

  UniSource: {
    // AC Disconnects (Note: Original had "Uni-Directional Meter" mapped to AC Disconnect - this seems incorrect)
    "AC Disconnect": "AC Disconnect",
    "Bi-Directional Meter DER Side Disconnect": "AC Disconnect",
    "Uni-Directional Meter Line Side Disconnect": "AC Disconnect",
    "DER Meter Disconnect Switch": "AC Disconnect",
    "DER Storage Meter Disconnect Switch": "AC Disconnect",

    // Fused AC Disconnects
    "Fused AC Disconnect": "Fused AC Disconnect",
    "Photovoltaic System Disconnect": "Fused AC Disconnect",
    "Photovoltaic System Disconnect Switch": "Fused AC Disconnect",
    "Photovoltaic System Service Disconnect": "Fused AC Disconnect",
    "Utility AC Disconnect Switch": "Fused AC Disconnect",

    // Meters
    "PV Meter": "Uni-Directional Meter",
    "Uni-Directional Meter": "Uni-Directional Meter",
    "Bi-Directional Meter": "Uni-Directional Meter",
    "DER Storage Meter": "Uni-Directional Meter",
    "Dedicated DER Meter": "Uni-Directional Meter",
    "Utility DG Meter": "Uni-Directional Meter",

    // Combiner Panels
    "Combiner Panel": "Combiner Panel",
    "Position Combiner Panel": "Position Combiner Panel",
    "String Combiner Panel": "String Combiner Panel",
  },

  "Sulphur Springs Valley Electric Cooperative": {
    // AC Disconnects
    "AC Disconnect": "DG Disconnect Switch",
    "DG Disconnect Switch": "DG Disconnect Switch",
    "Bi-Directional Meter DER Side Disconnect": "DG Disconnect Switch",
    "Uni-Directional Meter Line Side Disconnect": "DG Disconnect Switch",
    "DER Meter Disconnect Switch": "DG Disconnect Switch",
    "DER Storage Meter Disconnect Switch": "DG Disconnect Switch",

    // Fused AC Disconnects
    "Fused AC Disconnect": "Fused AC Disconnect",
    "Photovoltaic System Disconnect": "Fused AC Disconnect",
    "Photovoltaic System Disconnect Switch": "Fused AC Disconnect",
    "Photovoltaic System Service Disconnect": "Fused AC Disconnect",
    "Utility AC Disconnect Switch": "Fused AC Disconnect",

    // Meters
    "PV Meter": "PV Meter",
    "Bi-Directional Meter": "PV Meter",
    "Uni-Directional Meter": "PV Meter",
    "DER Storage Meter": "PV Meter",
    "Dedicated DER Meter": "PV Meter",
    "Utility DG Meter": "PV Meter",

    // Combiner Panels
    "Combiner Panel": "Combiner Panel",
    "Position Combiner Panel": "Position Combiner Panel",
    "String Combiner Panel": "String Combiner Panel",
  },

  Gen: {
    // AC Disconnects - All variations
    "AC Disconnect": "AC Disconnect",
    "Utility Disconnect": "AC Disconnect",
    "Bi-Directional Meter DER Side Disconnect": "AC Disconnect",
    "Uni-Directional Meter Line Side Disconnect": "AC Disconnect",
    "DER Storage Meter Disconnect Switch": "AC Disconnect",
    "DER Meter Disconnect Switch": "AC Disconnect",
    "DG Disconnect Switch": "AC Disconnect",
    "Co-Generation System Utility Disconnect": "AC Disconnect",

    // Fused AC Disconnects - All variations
    "Fused AC Disconnect": "Fused AC Disconnect",
    "Utility AC Disconnect Switch": "Fused AC Disconnect",
    "Photovoltaic System Disconnect": "Fused AC Disconnect",
    "Photovoltaic System Disconnect Switch": "Fused AC Disconnect",
    "Photovoltaic System Service Disconnect": "Fused AC Disconnect",
    "Uitlity AC Disconnect Switch": "Fused AC Disconnect", // Keep typo for compatibility

    // Combiner Panels - All types
    "Combiner Panel": "Combiner Panel",
    "Position Combiner Panel": "Position Combiner Panel",
    "Dedicated Photovoltaic System Combiner Panel": "Position Combiner Panel",
    "String Combiner Panel": "String Combiner Panel",

    // Meters - All variations
    "PV Meter": "PV Meter",
    "Bi-Directional Meter": "Bi-Directional Meter",
    "Uni-Directional Meter": "Uni-Directional Meter",
    "DER Storage Meter": "DER Storage Meter",
    "Dedicated DER Meter": "Dedicated DER Meter",
    "Utility DG Meter": "Utility DG Meter",
  },
};

// AC-Integrated Solar Panels with Built-in Microinverters
// Maps solar panel make/model to their corresponding built-in microinverter
export const AC_INTEGRATED_SOLAR_PANELS: Record<
  string,
  {
    microinverterMake: string;
    microinverterModel: string;
  }
> = {
  // Hanwha Q CELLS Q.TRON BLK M-G2+/AC series (all wattage ratings)
  "Hanwha Q CELLS|Q.TRON BLK M-G2+/AC 430": {
    microinverterMake: "Hanwha Q CELLS",
    microinverterModel: "Q.MI.349B-G1",
  },
};

// Helper function to check if a solar panel is AC-integrated
// Uses partial matching to support different wattage ratings (e.g., 430, 440, 450)
export const isACIntegratedPanel = (make: string, model: string): boolean => {
  const makeModelStr = `${make}|${model}`;

  // Check for exact match first
  if (makeModelStr in AC_INTEGRATED_SOLAR_PANELS) {
    return true;
  }

  // Check for partial matches (supports different wattage ratings)
  for (const key of Object.keys(AC_INTEGRATED_SOLAR_PANELS)) {
    const [keyMake, keyModel] = key.split("|");

    // Check if make contains the key make (or vice versa)
    const makeMatches = make.includes(keyMake) || keyMake.includes(make);

    // Check if model contains the base model name (e.g., "Q.TRON BLK M-G2+/AC")
    const modelBase = keyModel.replace(/\s+\d+$/, ""); // Remove wattage from end
    const modelMatches = model.includes(modelBase);

    if (makeMatches && modelMatches) {
      return true;
    }
  }

  return false;
};

// Helper function to get microinverter info for AC-integrated panel
// Uses partial matching to support different wattage ratings
export const getACIntegratedMicroinverter = (make: string, model: string) => {
  const makeModelStr = `${make}|${model}`;

  // Check for exact match first
  if (makeModelStr in AC_INTEGRATED_SOLAR_PANELS) {
    return AC_INTEGRATED_SOLAR_PANELS[makeModelStr];
  }

  // Check for partial matches
  for (const key of Object.keys(AC_INTEGRATED_SOLAR_PANELS)) {
    const [keyMake, keyModel] = key.split("|");

    // Check if make contains the key make (or vice versa)
    const makeMatches = make.includes(keyMake) || keyMake.includes(make);

    // Check if model contains the base model name
    const modelBase = keyModel.replace(/\s+\d+$/, ""); // Remove wattage from end
    const modelMatches = model.includes(modelBase);

    if (makeMatches && modelMatches) {
      return AC_INTEGRATED_SOLAR_PANELS[key];
    }
  }

  return null;
};

// Full "Gen"-only catalog
export const EQUIPMENT_CATALOG = [
  // AC Disconnect
  {
    type: "AC Disconnect",
    make: "CUTLER HAMMER",
    model: "DG221URB",
    amp: "30",
  },
  {
    type: "AC Disconnect",
    make: "CUTLER HAMMER",
    model: "DG222URB",
    amp: "60",
  },
  {
    type: "AC Disconnect",
    make: "CUTLER HAMMER",
    model: "DG323UGB",
    amp: "100",
  },
  {
    type: "AC Disconnect",
    make: "CUTLER HAMMER",
    model: "DG324URK",
    amp: "200",
  },
  { type: "AC Disconnect", make: "EATON", model: "DG221URB", amp: "30" },
  { type: "AC Disconnect", make: "EATON", model: "DG222URB", amp: "60" },
  { type: "AC Disconnect", make: "EATON", model: "DG223URB", amp: "100" },
  { type: "AC Disconnect", make: "EATON", model: "DG324URK", amp: "200" },
  { type: "AC Disconnect", make: "GE", model: "TG3221R", amp: "30" },
  { type: "AC Disconnect", make: "GE", model: "TG3222R", amp: "60" },
  { type: "AC Disconnect", make: "GE", model: "TG3223R", amp: "100" },
  { type: "AC Disconnect", make: "GE", model: "TG4324R", amp: "200" },
  { type: "AC Disconnect", make: "SIEMENS", model: "GNF324R", amp: "200" },
  { type: "AC Disconnect", make: "SIEMENS", model: "GNF323R", amp: "100" },
  { type: "AC Disconnect", make: "SIEMENS", model: "LNF221R", amp: "30" },
  { type: "AC Disconnect", make: "SIEMENS", model: "LNF222R", amp: "60" },
  { type: "AC Disconnect", make: "SQUARE D", model: "D221NRB", amp: "30" },
  { type: "AC Disconnect", make: "SQUARE D", model: "D222NRB", amp: "60" },
  { type: "AC Disconnect", make: "SQUARE D", model: "D223NRB", amp: "100" },
  { type: "AC Disconnect", make: "SQUARE D", model: "D324NRB", amp: "200" },
  { type: "AC Disconnect", make: "SQUARE D", model: "DU221RB", amp: "30" },
  { type: "AC Disconnect", make: "SQUARE D", model: "DU222RB", amp: "60" },
  { type: "AC Disconnect", make: "SQUARE D", model: "DTU223RB", amp: "100" },
  { type: "AC Disconnect", make: "SQUARE D", model: "DU324RB", amp: "200" },

  // Fused AC Disconnect
  {
    type: "Fused AC Disconnect",
    make: "CUTLER HAMMER",
    model: "DG221NRB",
    amp: "30",
  },
  {
    type: "Fused AC Disconnect",
    make: "CUTLER HAMMER",
    model: "DG222NRB",
    amp: "60",
  },
  {
    type: "Fused AC Disconnect",
    make: "CUTLER HAMMER",
    model: "DG223NRB",
    amp: "100",
  },
  {
    type: "Fused AC Disconnect",
    make: "CUTLER HAMMER",
    model: "DG324NRK",
    amp: "200",
  },
  { type: "Fused AC Disconnect", make: "EATON", model: "DG221NRB", amp: "30" },
  { type: "Fused AC Disconnect", make: "EATON", model: "DG222NRB", amp: "60" },
  { type: "Fused AC Disconnect", make: "EATON", model: "DG223NRB", amp: "100" },
  { type: "Fused AC Disconnect", make: "EATON", model: "DG324NRK", amp: "200" },
  { type: "Fused AC Disconnect", make: "GE", model: "TG3221R", amp: "30" },
  { type: "Fused AC Disconnect", make: "GE", model: "TG3222R", amp: "60" },
  { type: "Fused AC Disconnect", make: "GE", model: "TG3223R", amp: "100" },
  { type: "Fused AC Disconnect", make: "GE", model: "TG4324R", amp: "200" },
  {
    type: "Fused AC Disconnect",
    make: "SIEMENS",
    model: "GF224NR",
    amp: "200",
  },
  { type: "Fused AC Disconnect", make: "SIEMENS", model: "GF323", amp: "100" },
  {
    type: "Fused AC Disconnect",
    make: "SIEMENS",
    model: "GF323NR",
    amp: "100",
  },
  { type: "Fused AC Disconnect", make: "SIEMENS", model: "LF221R", amp: "30" },
  { type: "Fused AC Disconnect", make: "SIEMENS", model: "LF222R", amp: "60" },
  {
    type: "Fused AC Disconnect",
    make: "SQUARE D",
    model: "D221NRB",
    amp: "30",
  },
  {
    type: "Fused AC Disconnect",
    make: "SQUARE D",
    model: "D222NRB",
    amp: "60",
  },
  {
    type: "Fused AC Disconnect",
    make: "SQUARE D",
    model: "D223NRB",
    amp: "100",
  },
  {
    type: "Fused AC Disconnect",
    make: "SQUARE D",
    model: "D324NRB",
    amp: "200",
  },

  // Combiner Panel
  {
    type: "Combiner Panel",
    make: "CUTLER HAMMER",
    model: "BR816L125RP",
    amp: "125",
  },
  {
    type: "Combiner Panel",
    make: "CUTLER HAMMER",
    model: "BR816L125RP",
    amp: "125",
  },
  {
    type: "Combiner Panel",
    make: "CUTLER HAMMER",
    model: "BR816L200RP",
    amp: "200",
  },
  { type: "Combiner Panel", make: "EATON", model: "BR816L125RP", amp: "125" },
  { type: "Combiner Panel", make: "EATON", model: "BR816L200RP", amp: "200" },
  { type: "Combiner Panel", make: "GE", model: "TLM1212RCU", amp: "125" },
  {
    type: "Combiner Panel",
    make: "SIEMENS",
    model: "W0816ML1125CU",
    amp: "125",
  },
  {
    type: "Combiner Panel",
    make: "SQUARE D",
    model: "QO816L100RB",
    amp: "100",
  },
  {
    type: "Combiner Panel",
    make: "SQUARE D",
    model: "QO816L125RB",
    amp: "125",
  },
  {
    type: "Combiner Panel",
    make: "SQUARE D",
    model: "QO816L200RB",
    amp: "200",
  },

  // PV Meter
  { type: "PV Meter", make: "EATON", model: "011", amp: "125" },
  { type: "PV Meter", make: "EATON", model: "1004455BCH", amp: "200" },
  { type: "PV Meter", make: "MILBANK", model: "U1104-RL-PG-KK", amp: "200" },
  { type: "PV Meter", make: "MILBANK", model: "U1104-XL-570", amp: "200" },
  { type: "PV Meter", make: "MILBANK", model: "U1787-XL-PG-KK", amp: "125" },
  {
    type: "PV Meter",
    make: "MILBANK",
    model: "U1787-XL-TG-RINGSKT",
    amp: "125",
  },
  { type: "PV Meter", make: "MILBANK", model: "U4015-0", amp: "200" },
  { type: "PV Meter", make: "MILBANK", model: "U4518-XL-W", amp: "200" },
  {
    type: "PV Meter",
    make: "MILBANK",
    model: "U5929-XL-PG-RINGSKT",
    amp: "100",
  },
  { type: "PV Meter", make: "MILBANK", model: "U5929XL", amp: "100" },
  { type: "PV Meter", make: "SIEMENS", model: "MC0816B1200RLM", amp: "200" },
  { type: "PV Meter", make: "SIEMENS", model: "MC1624B1200RLTS", amp: "200" }, // TODO: Verify model - not found in manufacturer catalogs
  { type: "PV Meter", make: "SIEMENS", model: "UAT111-BPCC", amp: "135" },
  { type: "PV Meter", make: "SQUARE D", model: "SC816M200PQCSWB", amp: "200" },

  // Cutler Hammer Dedicated DER Meters - 125 Amp
  { type: "PV Meter", make: "CUTLER HAMMER", model: "Dedicated DER Meter Cutler Hammer 125", amp: "125" },

  // Cutler Hammer Dedicated DER Meters - 200 Amp
  { type: "PV Meter", make: "CUTLER HAMMER", model: "Dedicated DER Meter Cutler Hammer 200", amp: "200" },

  // Milbank Dedicated DER Meters - 100 Amp
  { type: "PV Meter", make: "MILBANK", model: "Dedicated DER Meter Milbank 100", amp: "100" },

  // Milbank Dedicated DER Meters - 125 Amp
  { type: "PV Meter", make: "MILBANK", model: "Dedicated DER Meter Milbank 125", amp: "125" },

  // Milbank Dedicated DER Meters - 200 Amp
  { type: "PV Meter", make: "MILBANK", model: "Dedicated DER Meter Milbank 200", amp: "200" },

  // System Controller
  {
    type: "System Controller",
    make: "Enphase",
    model: "Enphase System Controller",
    amp: "N/A",
  },
  {
    type: "System Controller",
    make: "SolarEdge",
    model: "SolarEdge Backup Interface",
    amp: "N/A",
  },
  {
    type: "System Controller",
    make: "Tesla",
    model: "Backup Gateway 2",
    amp: "N/A",
  },
  { type: "System Controller", make: "Tesla", model: "Gateway 3", amp: "N/A" },
];

export const ROOFING_MATERIAL_TYPES = [
  "Comp Shingle",
  "S Tile",
  "F Tile",
  "W Tile",
  "Clay Tile",
  "Slate",
  "Spanish Tile",
  "Tar & Gravel",
  "Mod Bit",
  "Foam",
  "Ground Mount",
  "Carport",
  "Metal Corrugated",
  "Metal Seam, 12in",
  "Metal Seam, 16in",
  "Metal Seam, 18in",
  "Metal Seam, 24in",
  "Metal Shingles",
  "Wood Shake",
];

export const FRAMING_MEMBER_SIZES = [
  "2x4",
  "2x6",
  "2x8",
  "2x10",
  "2x12",
  "4x4",
  "4x6",
  "4x8",
  "4x10",
  "4x12",
  "4x14",
  "4x16",
];

export const FRAMING_MEMBER_SPACINGS = [
  '12"',
  '16"',
  '24"',
  '32"',
  '48"',
  '64"',
  '72"',
];

export const RAIL_CATALOG = [
  { make: "Dual Rack", model: "Lite" },
  { make: "EcoFasten", model: "ClickFit" },
  { make: "EcoFasten", model: "Rockit" },
  { make: "IronRidge", model: "XR10" },
  { make: "IronRidge", model: "XR100" },
  { make: "K2", model: "CrossRail 44-X" },
  { make: "K2", model: "CrossRail 44-X (172 in)" },
  { make: "K2", model: "CrossRail 48-X" },
  { make: "K2", model: "CrossRail 48-XL" },
  { make: "K2", model: 'CrossRail 48-XL (166")' },
  { make: "K2", model: "CrossRail 48-XL (172 in)" },
  { make: "K2", model: "CrossRail 80" },
  { make: "K2", model: "CrossRail 80 (172 in)" },
  { make: "K2", model: 'CrossRail 80 (216")' },
  { make: "Pegasus Solar", model: "Max Rail System" },
  { make: "Pegasus Solar", model: "Rail System" },
  { make: "SnapNRack", model: "UR-40" },
  { make: "Unirac", model: "Light" },
  { make: "Unirac", model: "NXT UMOUNT" },
  { make: "Unirac", model: "Standard" },
];

export const MOUNT_CATALOG = [
  { make: "ChemLink", model: 'F1354GR 4" Round Grey' },
  { make: "Dual Rack", model: "Lite Flash L Kit" },
  { make: "EcoFasten", model: "CF Tile Hook" },
  { make: "EcoFasten", model: "Comp Slide" },
  { make: "EcoFasten", model: "L-Foot" },
  { make: "EcoFasten", model: "L-Foot with SimpleBlock-U" },
  { make: "EcoFasten", model: "Smart Foot" },
  { make: "EcoFasten", model: "Smart Slide" },
  { make: "IronRidge", model: "All Tile Hook" },
  { make: "IronRidge", model: "FlashFoot2" },
  { make: "IronRidge", model: "L Mount" },
  { make: "IronRidge", model: "QBase" },
  { make: "IronRidge", model: "Tilt Leg" },
  { make: "K2", model: "Big Foot X (ChemLink)" },
  { make: "K2", model: 'Big Foot X 6"' },
  { make: "K2", model: "Flash Comp Kit" },
  { make: "K2", model: "Flex Foot" },
  { make: "K2", model: "L Foot" },
  { make: "K2", model: "Power Clamp (Corrugated)" },
  { make: "K2", model: "Power Clamp (Trapezoidal)" },
  { make: "K2", model: "Splice Foot X" },
  { make: "K2", model: "Splice Foot X (Tilt up)" },
  { make: "K2", model: "Splice Foot XL" },
  { make: "K2", model: "Splice Foot XL (Tilt up)" },
  { make: "K2", model: "Tile Hook" },
  { make: "K2", model: "Universal Standard Hook" },
  { make: "Pegasus Solar", model: "Tile Replacement Kit" },
  { make: "PV Quickmount", model: "QM-QBB-01-M1" },
  { make: "PV Quickmount", model: "QM-QBP-3.25-M1" },
  { make: "PV Quickmount", model: "QM-QBP-6.25-M1" },
  { make: "S-5!", model: "Proteabracket" },
  { make: "S-5!", model: "RibBracket" },
  { make: "S-5!", model: "S-5-H Clamp" },
  { make: "S-5!", model: "S-5-N CLAMP" },
  { make: "S-5!", model: "S-5-NH 1.5 Clamp" },
  { make: "S-5!", model: "S-5-S CLAMP" },
  { make: "SnapNRack", model: "L Foot" },
  { make: "SnapNRack", model: "Ultra Rail Comp Kit" },
  { make: "SnapNRack", model: "Universal Tile Hook" },
  { make: "Unirac", model: "004085D-FlashLoc Comp" },
  { make: "Unirac", model: "FlashKit Pro" },
  { make: "Unirac", model: "FlashLoc" },
  { make: "Unirac", model: "L Foot" },
  { make: "Unirac", model: "Solarhook" },
  { make: "Unirac", model: "Tilt Leg" },
];
/** How many stories the building has */
export const STORIES_OPTIONS: string[] = ["1", "2", "3"];

/** Roof pitch in degrees from 0° up to 50° */
export const PITCH_OPTIONS: string[] = Array.from(
  { length: 51 },
  (_, i) => `${i}`
);
export const PHOTO_NOTE_MAX_CHARS = 500;

// Feature flags for A/B testing and gradual feature rollout
export const FEATURE_FLAGS = {
  USE_ENHANCED_PHOTO_MODAL: true, // Toggle for PhotoNotesModalEnhanced with batch capture
};

export type PhotoTagOption = { label: string; value: string };

export const DEFAULT_PANEL_PHOTO_TAGS = [
  { label: "Panel Label", value: "panel_label" },
  { label: "Installation", value: "installation" },
  { label: "Wiring", value: "wiring" },
  { label: "Closeup", value: "closeup" },
  { label: "Overview", value: "overview" },
  { label: "Before", value: "before" },
  { label: "After", value: "after" },
  { label: "Issue", value: "issue" },
  { label: "Complete", value: "complete" },
];

export const DEFAULT_INVERTER_PHOTO_TAGS = [
  { label: "Unit Label", value: "unit_label" },
  { label: "Installation", value: "installation" },
  { label: "Connections", value: "connections" },
  { label: "Display", value: "display" },
  { label: "Closeup", value: "closeup" },
  { label: "Overview", value: "overview" },
  { label: "Complete", value: "complete" },
];

export const DEFAULT_ELECTRICAL_PHOTO_TAGS = [
  { label: "Panel", value: "panel" },
  { label: "Connections", value: "connections" },
  { label: "Wiring", value: "wiring" },
  { label: "Meter", value: "meter" },
  { label: "Breakers", value: "breakers" },
  { label: "Overview", value: "overview" },
  { label: "Complete", value: "complete" },
];

export const DEFAULT_STRUCTURAL_PHOTO_TAGS = [
  { label: "Roof Assessment", value: "roof_assessment" },
  { label: "Load Analysis", value: "load_analysis" },
  { label: "Structural Integrity", value: "structural_integrity" },
  { label: "Mounting Hardware", value: "mounting_hardware" },
  { label: "Framing", value: "framing" },
  { label: "Foundation", value: "foundation" },
  { label: "Overview", value: "overview" },
  { label: "Concern", value: "concern" },
  { label: "Complete", value: "complete" },
];

export const DEFAULT_BOS_PHOTO_TAGS = [
  { label: "Monitoring System", value: "monitoring_system" },
  { label: "Safety Equipment", value: "safety_equipment" },
  { label: "Rapid Shutdown", value: "rapid_shutdown" },
  { label: "Performance Check", value: "performance_check" },
  { label: "Communication", value: "communication" },
  { label: "Weather Station", value: "weather_station" },
  { label: "Overview", value: "overview" },
  { label: "Issue", value: "issue" },
  { label: "Complete", value: "complete" },
];

export const TESLA_POWERWALL_GATEWAYS = [
  { label: "Backup Gateway 2", value: "backup_gateway_2" },
  { label: "Gateway 3", value: "gateway_3" },
  { label: "Backup Switch", value: "backup_switch" },
];

export const UTILITY_SERVICE_AMPS_OPTIONS = [
  { label: "100", value: "100" },
  { label: "200", value: "200" },
  { label: "400", value: "400" },
  { label: "600", value: "600" },
];

// Backup System Size options - Whole Home (100A and up)
export const BACKUP_SYSTEM_SIZE_WHOLE_HOME_OPTIONS = [
  { label: "100", value: "100" },
  { label: "125", value: "125" },
  { label: "150", value: "150" },
  { label: "175", value: "175" },
  { label: "200", value: "200" },
  { label: "225", value: "225" },
];

// Backup System Size options - Partial Home (includes 30A and 60A)
export const BACKUP_SYSTEM_SIZE_PARTIAL_HOME_OPTIONS = [
  { label: "30", value: "30" },
  { label: "60", value: "60" },
  { label: "100", value: "100" },
  { label: "125", value: "125" },
  { label: "150", value: "150" },
  { label: "175", value: "175" },
  { label: "200", value: "200" },
  { label: "225", value: "225" },
];

export const COMBINE_METHOD_OPTIONS = [
  { label: "SolarEdge Backup Interface", value: "SolarEdge Backup Interface" },
  { label: "Combiner Panel", value: "Combiner Panel" },
];

// Inverter manufacturers that support optimizers
export const INVERTER_MANUFACTURERS_WITH_OPTIMIZERS = [
  "SolarEdge",
  "SOL-ARK",
  "TIGO Energy",
];

// Tesla Powerwall 3 kilowatt rating options
export const POWERWALL_3_KILOWATT_OPTIONS = [
  { label: "5.8", value: "5.8" },
  { label: "7.6", value: "7.6" },
  { label: "10.0", value: "10.0" },
  { label: "11.5", value: "11.5" },
];

// Hoymiles microinverter stringing specifications
export interface HoymilesStringingSpec {
  modelNumber: string;
  panelRatio: string;
  maxUnitsBranch: number;
  maxPanelsPerBranch: number;
}

export const HOYMILES_STRINGING_SPECS: Record<string, HoymilesStringingSpec> = {
  "MIS-350-1A/1NA": {
    modelNumber: "MIS-350-1A/1NA",
    panelRatio: "1:1",
    maxUnitsBranch: 18,
    maxPanelsPerBranch: 18,
  },
  "MIS-400-1A/1NA": {
    modelNumber: "MIS-400-1A/1NA",
    panelRatio: "1:1",
    maxUnitsBranch: 15,
    maxPanelsPerBranch: 15,
  },
  "MIS-450-1A/1NA": {
    modelNumber: "MIS-450-1A/1NA",
    panelRatio: "1:1",
    maxUnitsBranch: 16,
    maxPanelsPerBranch: 16,
  },
  "MIS-500-1A/1NA": {
    modelNumber: "MIS-500-1A/1NA",
    panelRatio: "1:1",
    maxUnitsBranch: 14,
    maxPanelsPerBranch: 14,
  },
  "HM-300NT": {
    modelNumber: "HM-300NT",
    panelRatio: "1:1",
    maxUnitsBranch: 19,
    maxPanelsPerBranch: 19,
  },
  "HM-350NT": {
    modelNumber: "HM-350NT",
    panelRatio: "1:1",
    maxUnitsBranch: 16,
    maxPanelsPerBranch: 16,
  },
  "HM-400NT": {
    modelNumber: "HM-400NT",
    panelRatio: "1:1",
    maxUnitsBranch: 15,
    maxPanelsPerBranch: 15,
  },
  "HM-600NT": {
    modelNumber: "HM-600NT",
    panelRatio: "2:1",
    maxUnitsBranch: 9,
    maxPanelsPerBranch: 18,
  },
  "HM-700N": {
    modelNumber: "HM-700N",
    panelRatio: "2:1",
    maxUnitsBranch: 5,
    maxPanelsPerBranch: 10,
  },
  "HM-700NT": {
    modelNumber: "HM-700NT",
    panelRatio: "2:1",
    maxUnitsBranch: 8,
    maxPanelsPerBranch: 16,
  },
  "HM-800NT": {
    modelNumber: "HM-800NT",
    panelRatio: "2:1",
    maxUnitsBranch: 7,
    maxPanelsPerBranch: 14,
  },
  "HM-1200NT": {
    modelNumber: "HM-1200NT",
    panelRatio: "4:1",
    maxUnitsBranch: 4,
    maxPanelsPerBranch: 16,
  },
  "HM-1500NT": {
    modelNumber: "HM-1500NT",
    panelRatio: "4:1",
    maxUnitsBranch: 4,
    maxPanelsPerBranch: 16,
  },
  "HMS-350-1T-NA": {
    modelNumber: "HMS-350-1T-NA",
    panelRatio: "1:1",
    maxUnitsBranch: 18,
    maxPanelsPerBranch: 18,
  },
  "HMS-400-1T-NA": {
    modelNumber: "HMS-400-1T-NA",
    panelRatio: "1:1",
    maxUnitsBranch: 15,
    maxPanelsPerBranch: 15,
  },
  "HMS-450-1T-NA": {
    modelNumber: "HMS-450-1T-NA",
    panelRatio: "1:1",
    maxUnitsBranch: 14,
    maxPanelsPerBranch: 14,
  },
  "HMS-500-1T-NA": {
    modelNumber: "HMS-500-1T-NA",
    panelRatio: "1:1",
    maxUnitsBranch: 12,
    maxPanelsPerBranch: 12,
  },
  "HMS-700-2T-NA": {
    modelNumber: "HMS-700-2T-NA",
    panelRatio: "2:1",
    maxUnitsBranch: 9,
    maxPanelsPerBranch: 18,
  },
  "HMS-800-2T-NA": {
    modelNumber: "HMS-800-2T-NA",
    panelRatio: "2:1",
    maxUnitsBranch: 7,
    maxPanelsPerBranch: 14,
  },
  "HMS-900-2T-NA": {
    modelNumber: "HMS-900-2T-NA",
    panelRatio: "2:1",
    maxUnitsBranch: 6,
    maxPanelsPerBranch: 12,
  },
  "HMS-1000-2T-NA": {
    modelNumber: "HMS-1000-2T-NA",
    panelRatio: "2:1",
    maxUnitsBranch: 6,
    maxPanelsPerBranch: 12,
  },
  "HMS-1600-4T-NA": {
    modelNumber: "HMS-1600-4T-NA",
    panelRatio: "4:1",
    maxUnitsBranch: 4,
    maxPanelsPerBranch: 16,
  },
  "HMS-1800-4T-NA": {
    modelNumber: "HMS-1800-4T-NA",
    panelRatio: "4:1",
    maxUnitsBranch: 3,
    maxPanelsPerBranch: 12,
  },
  "HMS-2000-4T-NA": {
    modelNumber: "HMS-2000-4T-NA",
    panelRatio: "4:1",
    maxUnitsBranch: 2,
    maxPanelsPerBranch: 8,
  },
  "HMT-1600-4T-208-NA": {
    modelNumber: "HMT-1600-4T-208-NA",
    panelRatio: "4:1",
    maxUnitsBranch: 6,
    maxPanelsPerBranch: 24,
  },
  "HMT-1800-4T-208-NA": {
    modelNumber: "HMT-1800-4T-208-NA",
    panelRatio: "4:1",
    maxUnitsBranch: 5,
    maxPanelsPerBranch: 20,
  },
  "HMT-2000-4T-208-NA": {
    modelNumber: "HMT-2000-4T-208-NA",
    panelRatio: "4:1",
    maxUnitsBranch: 4,
    maxPanelsPerBranch: 16,
  },
};
