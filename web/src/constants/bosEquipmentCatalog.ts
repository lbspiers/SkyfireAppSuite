/**
 * BOS Equipment Catalog - Simplified for Web App
 *
 * Equipment types use STANDARD names in catalog
 * Utility-specific translations applied at runtime for display
 */

// Equipment type options for BOS dropdowns (General/Gen utility - standard names)
export const EQUIPMENT_TYPE_OPTIONS = [
  { label: "AC Disconnect", value: "AC Disconnect" },
  { label: "Fused AC Disconnect", value: "Fused AC Disconnect" },
  { label: "Combiner Panel", value: "Combiner Panel" },
  { label: "PV Meter", value: "PV Meter" },
  { label: "Bi-Directional Meter", value: "Bi-Directional Meter" },
  { label: "Bi-Directional Meter DER Side Disconnect", value: "Bi-Directional Meter DER Side Disconnect" },
  { label: "Bi-Directional Meter Line Side Disconnect", value: "Bi-Directional Meter Line Side Disconnect" },
  { label: "Junction Box", value: "Junction Box" },
] as const;

// Maps standard equipment types to utility-specific names per utility
// This is the SOURCE OF TRUTH for utility translations
export const BOS_EQUIPMENT_TRANSLATION: Record<string, Record<string, string>> = {
  Gen: {
    "AC Disconnect": "AC Disconnect",
    "Fused AC Disconnect": "Fused AC Disconnect",
    "Combiner Panel": "Combiner Panel",
    "PV Meter": "PV Meter",
    "Bi-Directional Meter": "Bi-Directional Meter",
    "Bi-Directional Meter DER Side Disconnect": "Bi-Directional Meter DER Side Disconnect",
    "Bi-Directional Meter Line Side Disconnect": "Bi-Directional Meter Line Side Disconnect",
    "Junction Box": "Junction Box",
  },
  APS: {
    "Fused AC Disconnect": "Utility Disconnect",  // FIXED: Utility-side lockable disconnect
    "AC Disconnect": "Uni-Directional Meter Line Side Disconnect",  // FIXED: DER-side non-fused disconnect
    "Combiner Panel": "Dedicated Photovoltaic System Combiner Panel",
    "PV Meter": "Uni-Directional Meter",  // FIXED: Production meter
    "Bi-Directional Meter": "Bi-Directional Meter",
    "Bi-Directional Meter DER Side Disconnect": "Bi-Directional Meter DER Side Disconnect",
    "Bi-Directional Meter Line Side Disconnect": "Bi-Directional Meter Line Side Disconnect",
    "Junction Box": "Junction Box",
  },
  SRP: {
    "AC Disconnect": "DER Meter Disconnect Switch",
    "Fused AC Disconnect": "Utility AC Disconnect Switch",
    "Combiner Panel": "Combiner Panel",
    "PV Meter": "Dedicated DER Meter",
    "Junction Box": "Junction Box",
  },
  TEP: {
    "AC Disconnect": "Utility DG Disconnect",
    "Fused AC Disconnect": "Fused AC Disconnect",
    "Combiner Panel": "Combiner Panel",
    "PV Meter": "Utility DG Meter",
    "Junction Box": "Junction Box",
  },
  TRICO: {
    "AC Disconnect": "Co-Generation System Utility Disconnect",
    "Fused AC Disconnect": "Fused AC Disconnect",
    "Combiner Panel": "Combiner Panel",
    "PV Meter": "PV Meter",
    "Junction Box": "Junction Box",
  },
  UniSource: {
    "AC Disconnect": "Utility DG Disconnect",
    "Fused AC Disconnect": "Fused AC Disconnect",
    "Combiner Panel": "Combiner Panel",
    "PV Meter": "Utility DG Meter",
    "Junction Box": "Junction Box",
  },
  "Sulphur Springs Valley Electric Cooperative": {
    "AC Disconnect": "DG Disconnect Switch",
    "Fused AC Disconnect": "Fused AC Disconnect",
    "Combiner Panel": "Combiner Panel",
    "PV Meter": "PV Meter",
    "Junction Box": "Junction Box",
  },
  // Xcel Energy - uses "Utility PV AC Disconnect" for both AC and Fused AC Disconnect
  // Actual equipment selected based on POI type (handled in catalog lookup)
  "Xcel Energy": {
    "AC Disconnect": "Utility PV AC Disconnect",
    "Fused AC Disconnect": "Utility PV AC Disconnect",
    "Combiner Panel": "Combiner Panel",
    "PV Meter": "PV Meter",
    "Junction Box": "Junction Box",
  },
  Oncor: {
    "AC Disconnect": "AC Disconnect",
    "Fused AC Disconnect": "Fused AC Disconnect",
    "Combiner Panel": "Combiner Panel",
    "PV Meter": "PV Meter",
    "Junction Box": "Junction Box",
  },
};

// Maps utility-specific names back to their standard equipment type
// Auto-generated from BOS_EQUIPMENT_TRANSLATION for reverse lookup
export const UTILITY_EQUIPMENT_TO_STANDARD: Record<string, string> = (() => {
  const reverseMap: Record<string, string> = {};

  // Add all standard names mapping to themselves
  EQUIPMENT_TYPE_OPTIONS.forEach(opt => {
    reverseMap[opt.value] = opt.value;
  });

  // Add all utility-specific names mapping to standard names
  Object.values(BOS_EQUIPMENT_TRANSLATION).forEach(translations => {
    Object.entries(translations).forEach(([standardName, utilityName]) => {
      reverseMap[utilityName] = standardName;
    });
  });

  return reverseMap;
})();

// BOS Equipment Catalog - Standard equipment types only
export const BOS_EQUIPMENT_CATALOG = [
  // AC Disconnect
  { type: "AC Disconnect", make: "CUTLER HAMMER", model: "DG221URB", amp: "30" },
  { type: "AC Disconnect", make: "CUTLER HAMMER", model: "DG222URB", amp: "60" },
  { type: "AC Disconnect", make: "CUTLER HAMMER", model: "DG323UGB", amp: "100" },
  { type: "AC Disconnect", make: "CUTLER HAMMER", model: "DG324URK", amp: "200" },
  { type: "AC Disconnect", make: "EATON", model: "DG221URB", amp: "30" },
  { type: "AC Disconnect", make: "EATON", model: "DG222URB", amp: "60" },
  { type: "AC Disconnect", make: "EATON", model: "DG223URB", amp: "100" },
  { type: "AC Disconnect", make: "EATON", model: "DG324URK", amp: "200" },
  { type: "AC Disconnect", make: "SIEMENS", model: "LNF221R", amp: "30" },
  { type: "AC Disconnect", make: "SIEMENS", model: "LNF222R", amp: "60" },
  { type: "AC Disconnect", make: "SIEMENS", model: "GNF323R", amp: "100" },
  { type: "AC Disconnect", make: "SIEMENS", model: "DU324RB", amp: "200" },
  { type: "AC Disconnect", make: "SQUARE D", model: "DU221RB", amp: "30" },
  { type: "AC Disconnect", make: "SQUARE D", model: "DU222RB", amp: "60" },
  { type: "AC Disconnect", make: "SQUARE D", model: "DTU223RB", amp: "100" },
  { type: "AC Disconnect", make: "SQUARE D", model: "DU324RB", amp: "200" },

  // Fused AC Disconnect
  { type: "Fused AC Disconnect", make: "CUTLER HAMMER", model: "DG221NRB", amp: "30" },
  { type: "Fused AC Disconnect", make: "CUTLER HAMMER", model: "DG222NRB", amp: "60" },
  { type: "Fused AC Disconnect", make: "CUTLER HAMMER", model: "DG223NRB", amp: "100" },
  { type: "Fused AC Disconnect", make: "CUTLER HAMMER", model: "DG324NRK", amp: "200" },
  { type: "Fused AC Disconnect", make: "EATON", model: "DG221NRB", amp: "30" },
  { type: "Fused AC Disconnect", make: "EATON", model: "DG222NRB", amp: "60" },
  { type: "Fused AC Disconnect", make: "EATON", model: "DG223NRB", amp: "100" },
  { type: "Fused AC Disconnect", make: "EATON", model: "DG324NRK", amp: "200" },
  { type: "Fused AC Disconnect", make: "SIEMENS", model: "LF221R", amp: "30" },
  { type: "Fused AC Disconnect", make: "SIEMENS", model: "LF222R", amp: "60" },
  { type: "Fused AC Disconnect", make: "SIEMENS", model: "GF323", amp: "100" },
  { type: "Fused AC Disconnect", make: "SIEMENS", model: "GF224NR", amp: "200" },
  { type: "Fused AC Disconnect", make: "SIEMENS", model: "GNF324R", amp: "200" },
  { type: "Fused AC Disconnect", make: "SQUARE D", model: "D221NRB", amp: "30" },
  { type: "Fused AC Disconnect", make: "SQUARE D", model: "D222NRB", amp: "60" },

  // Combiner Panel
  { type: "Combiner Panel", make: "EATON", model: "BR816L100RP", amp: "100" },
  { type: "Combiner Panel", make: "EATON", model: "BR816L125RP", amp: "125" },
  { type: "Combiner Panel", make: "EATON", model: "BR816L200RP", amp: "200" },
  { type: "Combiner Panel", make: "SIEMENS", model: "W0816ML1125CU", amp: "125" },

  // PV Meter
  { type: "PV Meter", make: "EATON", model: "011", amp: "125" },
  { type: "PV Meter", make: "EATON", model: "1004455BCH", amp: "200" },
  { type: "PV Meter", make: "MILBANK", model: "U5929XL", amp: "100" },
  { type: "PV Meter", make: "MILBANK", model: "U4015-0", amp: "200" },
  { type: "PV Meter", make: "MILBANK", model: "U4518-XL-W", amp: "200" },
  { type: "PV Meter", make: "MILBANK", model: "U1104-RL-PG-KK", amp: "200" },
  { type: "PV Meter", make: "SIEMENS", model: "UAT111-BPCC", amp: "135" },

  // Bi-Directional Meter (for ESS/Battery systems)
  { type: "Bi-Directional Meter", make: "ITRON", model: "C1SR", amp: "200" },
  { type: "Bi-Directional Meter", make: "LANDIS+GYR", model: "FOCUS AXE-SD", amp: "200" },
  { type: "Bi-Directional Meter", make: "SENSUS", model: "iCon A", amp: "200" },

  // Bi-Directional Meter DER Side Disconnect (AC Disconnect on DER side of bi-di meter)
  { type: "Bi-Directional Meter DER Side Disconnect", make: "EATON", model: "DG221URB", amp: "30" },
  { type: "Bi-Directional Meter DER Side Disconnect", make: "EATON", model: "DG222URB", amp: "60" },
  { type: "Bi-Directional Meter DER Side Disconnect", make: "EATON", model: "DG223URB", amp: "100" },
  { type: "Bi-Directional Meter DER Side Disconnect", make: "EATON", model: "DG324URK", amp: "200" },

  // Bi-Directional Meter Line Side Disconnect (AC Disconnect on line side of bi-di meter)
  { type: "Bi-Directional Meter Line Side Disconnect", make: "EATON", model: "DG221URB", amp: "30" },
  { type: "Bi-Directional Meter Line Side Disconnect", make: "EATON", model: "DG222URB", amp: "60" },
  { type: "Bi-Directional Meter Line Side Disconnect", make: "EATON", model: "DG223URB", amp: "100" },
  { type: "Bi-Directional Meter Line Side Disconnect", make: "EATON", model: "DG324URK", amp: "200" },

  // Junction Box
  { type: "Junction Box", make: "VYNCKIER", model: "RU2LP", amp: "" },
  { type: "Junction Box", make: "WILEY", model: "BR816L100RP", amp: "100" },
];
