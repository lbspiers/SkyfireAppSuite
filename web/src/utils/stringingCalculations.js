/**
 * Stringing Calculation Utilities
 * Auto-calculation logic for distributing panels across branches
 */

import {
  getStringingSpecs,
  getMaxBranches,
  isDualQtyManufacturer
} from './stringingConstants';

// ============================================
// STANDARD MICROINVERTER CALCULATIONS (Enphase)
// ============================================

/**
 * Calculate max panels per branch for standard microinverters
 * Based on 20A branch circuit / (max_cont_output_amps × 1.25 safety factor)
 *
 * @param {number} maxContOutputAmps - Microinverter max continuous output amps
 * @returns {number} - Maximum panels allowed per branch
 *
 * Example: IQ8PLUS-72-2-US has 1.21A
 * 20 / (1.21 × 1.25) = 20 / 1.5125 = 13.22 → 13 panels max
 */
export const calculateMaxPanelsPerBranch = (maxContOutputAmps) => {
  if (!maxContOutputAmps || maxContOutputAmps <= 0) {
    return 20; // Default fallback
  }
  return Math.floor(20 / (maxContOutputAmps * 1.25));
};

/**
 * Auto-distribute panels across branches for standard micros (1:1 ratio)
 *
 * @param {number} totalPanels - Total solar panels to distribute
 * @param {number} maxPanelsPerBranch - Max panels per branch
 * @param {number} maxBranches - Max available branches
 * @returns {Array} - Array of branch objects with panel quantities
 */
export const distributeStandardMicros = (totalPanels, maxPanelsPerBranch, maxBranches) => {
  const branches = [];
  let remainingPanels = totalPanels;

  for (let i = 0; i < maxBranches && remainingPanels > 0; i++) {
    const panelsThisBranch = Math.min(remainingPanels, maxPanelsPerBranch);

    branches.push({
      branchIndex: i + 1,
      panelQty: panelsThisBranch,
      microQty: panelsThisBranch, // 1:1 ratio
      isNew: true,
    });

    remainingPanels -= panelsThisBranch;
  }

  return {
    branches,
    totalPanelsAssigned: totalPanels - remainingPanels,
    remainingPanels,
    isComplete: remainingPanels === 0,
  };
};

// ============================================
// DUAL-QTY MICROINVERTER CALCULATIONS (Hoymiles/APSystems)
// ============================================

/**
 * Calculate microinverter distribution for Hoymiles/APSystems
 * These have multi-panel microinverters (2:1, 4:1 ratios)
 *
 * @param {number} totalPanels - Total solar panels
 * @param {object} specs - Stringing specs from constants
 * @param {number} maxBranches - Max branches from combiner panel
 * @returns {object} - Distribution object with branches and micro assignments
 *
 * Example: 26 panels with HMS-1600-4T-NA (4:1 ratio, max 4 micros/branch)
 * - Total micros needed: ceil(26 / 4) = 7 micros
 * - Branch 1: 4 micros (16 panels)
 * - Branch 2: 3 micros (10 panels)
 */
export const calculateDualQtyDistribution = (totalPanels, specs, maxBranches) => {
  if (!specs || !totalPanels || totalPanels <= 0) {
    return null;
  }

  // Parse ratio (e.g., "4:1" → 4)
  const ratio = parseInt(specs.panelRatio.split(':')[0], 10);
  const maxMicrosPerBranch = specs.maxUnitsBranch;
  const maxPanelsPerBranch = specs.maxPanelsBranch;

  // Step 1: Calculate total microinverters needed
  const totalMicros = Math.ceil(totalPanels / ratio);

  // Step 2: Distribute microinverters across branches
  const branches = [];
  let remainingMicros = totalMicros;
  let remainingPanels = totalPanels;

  for (let b = 0; b < maxBranches && remainingMicros > 0; b++) {
    const microsThisBranch = Math.min(remainingMicros, maxMicrosPerBranch);

    // Calculate panels for this branch (limited by max panels per branch)
    let panelsThisBranch = microsThisBranch * ratio;
    panelsThisBranch = Math.min(panelsThisBranch, remainingPanels, maxPanelsPerBranch);

    branches.push({
      branchIndex: b + 1,
      microQty: microsThisBranch,
      panelQty: panelsThisBranch,
      isNew: true,
    });

    remainingMicros -= microsThisBranch;
    remainingPanels -= panelsThisBranch;
  }

  // Step 3: Calculate individual micro panel assignments (granular tracking)
  const microAssignments = [];
  let panelsLeft = totalPanels;

  for (let m = 0; m < totalMicros && m < 25; m++) {
    const panelsThisMicro = Math.min(panelsLeft, ratio);
    microAssignments.push({
      microIndex: m + 1,
      panelCount: panelsThisMicro,
    });
    panelsLeft -= panelsThisMicro;
  }

  return {
    totalMicros,
    totalPanels,
    ratio,
    maxMicrosPerBranch,
    maxPanelsPerBranch,
    branches,
    microAssignments,
    totalPanelsAssigned: totalPanels - remainingPanels,
    remainingPanels,
    isComplete: remainingPanels === 0,
    specs,
  };
};

// ============================================
// STRING INVERTER CALCULATIONS
// ============================================

/**
 * Calculate string distribution for standard inverters
 * Distributes panels across inputs (formerly MPPTs)
 *
 * DUAL CALLING CONVENTION SUPPORT:
 * 1. Object-based (with voltage/current validation):
 *    calculateInverterInputDistribution({ totalPanels, maxInputs, maxPanelsPerString, panelVoc, panelIsc, inverterMaxVdc, inverterMinVdc, inverterMaxIsc })
 *    Returns: { strings: [...], warnings: [...], totalPanelsAssigned, remainingPanels }
 *
 * 2. Positional args (legacy, no validation):
 *    calculateInverterInputDistribution(totalPanels, maxInputs, stringsPerInput, maxPanelsPerString)
 *    Returns: { inputs: [...], totalPanelsAssigned, remainingPanels, isComplete }
 *
 * @param {number|object} totalPanels - Total solar panels OR spec object
 * @param {number} maxInputs - Max inputs on the inverter (from max_strings_branches)
 * @param {number} stringsPerInput - Strings per input (1 or 2) - positional only
 * @param {number} maxPanelsPerString - Max panels per string (voltage limited) - positional only
 * @returns {object} - Distribution across inputs
 */
export const calculateInverterInputDistribution = (
  totalPanels,
  maxInputs,
  stringsPerInput = 1,
  maxPanelsPerString = 15
) => {
  // ============================================
  // DETECT CALLING CONVENTION
  // ============================================

  // Object-based call (spec-based with validation)
  if (typeof totalPanels === 'object' && totalPanels !== null) {
    const spec = totalPanels;
    return calculateSpecBasedDistribution(spec);
  }

  // ============================================
  // POSITIONAL ARGS (Legacy - InverterStringingSection)
  // ============================================

  const maxPanelsPerInput = stringsPerInput * maxPanelsPerString;
  const inputs = [];
  let remainingPanels = totalPanels;

  for (let i = 0; i < maxInputs && remainingPanels > 0; i++) {
    const panelsThisInput = Math.min(remainingPanels, maxPanelsPerInput);

    inputs.push({
      inputIndex: i + 1,
      strings: stringsPerInput,
      panelQty: panelsThisInput,
      isNew: true,
    });

    remainingPanels -= panelsThisInput;
  }

  return {
    inputs,
    totalPanelsAssigned: totalPanels - remainingPanels,
    remainingPanels,
    isComplete: remainingPanels === 0,
  };
};

/**
 * Spec-based distribution with voltage/current validation
 * Used by InverterMicroSection handleAutoCalculate
 *
 * @param {object} spec - Configuration object
 * @param {number} spec.totalPanels - Total panels to distribute
 * @param {number} spec.maxInputs - Max inputs on inverter
 * @param {number} spec.maxPanelsPerString - Voltage-limited max panels per string
 * @param {number} spec.panelVoc - Panel open circuit voltage
 * @param {number} spec.panelIsc - Panel short circuit current
 * @param {number} spec.inverterMaxVdc - Inverter max DC voltage (hard safety ceiling)
 * @param {number} spec.inverterMinVdc - Inverter min DC voltage (startup minimum)
 * @param {number} spec.inverterMaxIsc - Inverter max input short circuit current
 * @param {number} spec.inverterMpptVoltageMax - MPPT optimal voltage max (e.g., 480V)
 * @param {number} spec.inverterMpptVoltageMin - MPPT optimal voltage min (e.g., 60V)
 * @param {number|null} spec.correctionFactor - NEC 690.7 temperature correction factor (from API)
 * @returns {object} - { strings: [...], warnings: [...], totalPanelsAssigned, remainingPanels }
 */
const calculateSpecBasedDistribution = (spec) => {
  const {
    totalPanels,
    maxInputs,
    maxPanelsPerString = 15,
    panelVoc = 0,
    panelIsc = 0,
    inverterMaxVdc = 600,
    inverterMinVdc = 0,
    inverterMaxIsc = 15,
    inverterMpptVoltageMax = 0,
    inverterMpptVoltageMin = 0,
    correctionFactor = null,
  } = spec;

  const strings = [];
  const warnings = [];

  // ============================================
  // CALCULATE VOLTAGE-LIMITED MAX/MIN PANELS PER STRING
  // Uses MPPT optimal range when available (NEC 690.7 compliance)
  // ============================================

  let calculatedMaxPanels = maxPanelsPerString;
  let calculatedMinPanels = 1;
  let hardMaxPanels = maxPanelsPerString; // Safety ceiling

  if (panelVoc > 0) {
    // Calculate corrected Voc for NEC 690.7 compliance
    const vocCorrected = correctionFactor !== null && correctionFactor > 0
      ? panelVoc * correctionFactor
      : panelVoc * 1.18; // Fallback to 1.18 if correction factor not available

    // Hard safety ceiling - strings must NEVER exceed this
    hardMaxPanels = Math.floor(inverterMaxVdc / vocCorrected);

    // MPPT optimal max - strings SHOULD stay within this for efficiency
    // Use mpptVoltageMax if available (e.g., 480V), otherwise fall back to voltage_maximum (e.g., 600V)
    const optimalVoltageMax = inverterMpptVoltageMax > 0 ? inverterMpptVoltageMax : inverterMaxVdc;
    const optimalMaxPerString = Math.floor(optimalVoltageMax / vocCorrected);

    // Use the MPPT-based limit for sizing (it's always <= hard max)
    calculatedMaxPanels = optimalMaxPerString;

    // Min panels per string (for MPPT tracking minimum)
    // Use mpptVoltageMin if available, otherwise fall back to voltage_minimum
    const optimalVoltageMin = inverterMpptVoltageMin > 0 ? inverterMpptVoltageMin : inverterMinVdc;
    if (optimalVoltageMin > 0) {
      calculatedMinPanels = Math.ceil(optimalVoltageMin / vocCorrected);
    }
  }

  // ============================================
  // CALCULATE MINIMUM INPUTS NEEDED (Industry Best Practice)
  // ============================================

  // Use minimum number of inputs needed rather than all available inputs
  // This maximizes string length which improves efficiency
  const minInputsNeeded = Math.ceil(totalPanels / calculatedMaxPanels);
  const inputsToUse = Math.min(minInputsNeeded, maxInputs);

  // If no panels can fit, return empty
  if (inputsToUse === 0 || totalPanels === 0) {
    return {
      strings: [],
      warnings: ['No panels to distribute'],
      totalPanelsAssigned: 0,
      remainingPanels: totalPanels,
      isComplete: false,
    };
  }

  // ============================================
  // DISTRIBUTE PANELS EVENLY ACROSS MINIMUM INPUTS
  // ============================================

  const basePanelsPerString = Math.floor(totalPanels / inputsToUse);
  const extraPanels = totalPanels % inputsToUse;

  for (let i = 0; i < inputsToUse; i++) {
    // Distribute extra panels to first inputs (e.g., 28 panels / 3 inputs = 10/9/9)
    const panelsThisString = basePanelsPerString + (i < extraPanels ? 1 : 0);

    // Voltage validation
    let stringVoltage = 0;
    let voltageValid = true;
    let minVoltageWarning = false;

    if (panelVoc > 0) {
      stringVoltage = calculateStringVoltage(panelsThisString, panelVoc, correctionFactor);
      const voltageCheck = validateStringVoltage(stringVoltage, inverterMaxVdc);
      voltageValid = voltageCheck.isValid;

      if (!voltageValid) {
        warnings.push(`Input ${i + 1}: ${voltageCheck.message}`);
      }

      // Check minimum voltage
      if (panelsThisString < calculatedMinPanels) {
        minVoltageWarning = true;
        warnings.push(`Input ${i + 1}: ${panelsThisString} panels (${Math.round(panelsThisString * panelVoc)}V) below minimum ${calculatedMinPanels} panels (${Math.round(calculatedMinPanels * panelVoc)}V)`);
      }
    }

    // Current validation
    let stringCurrent = 0;
    let currentValid = true;

    if (panelIsc > 0) {
      stringCurrent = calculateStringCurrent(panelIsc, 1); // 1 string per input
      const currentCheck = validateStringCurrent(stringCurrent, inverterMaxIsc);
      currentValid = currentCheck.isValid;

      if (!currentValid) {
        warnings.push(`Input ${i + 1}: ${currentCheck.message}`);
      }
    }

    strings.push({
      inputIndex: i + 1,
      numStrings: 1, // Fixed to 1 string per input
      panelsPerString: panelsThisString,
      stringVoltage: Math.round(stringVoltage * 10) / 10,
      stringCurrent: Math.round(stringCurrent * 100) / 100,
      voltageValid: voltageValid && !minVoltageWarning,
      currentValid,
      isNew: true,
    });
  }

  return {
    strings,
    warnings,
    totalPanelsAssigned: totalPanels,
    remainingPanels: 0,
    isComplete: true,
    inputsUsed: inputsToUse,
    inputsAvailable: maxInputs,
  };
};

// ============================================
// VALIDATION UTILITIES
// ============================================

/**
 * Validate branch/input configuration
 * @param {Array} branches - Array of branch configurations
 * @param {number} totalPanels - Expected total panels
 * @returns {object} - Validation result
 */
export const validateStringingConfig = (branches, totalPanels) => {
  const assignedPanels = branches.reduce((sum, b) => sum + (parseInt(b.panelQty) || 0), 0);
  const remaining = totalPanels - assignedPanels;

  return {
    isValid: remaining === 0,
    assignedPanels,
    remainingPanels: remaining,
    overAssigned: remaining < 0,
    underAssigned: remaining > 0,
    message: remaining === 0
      ? 'All panels assigned'
      : remaining > 0
        ? `${remaining} panels remaining`
        : `${Math.abs(remaining)} panels over-assigned`,
  };
};

/**
 * Get stringing mode based on inverter type and manufacturer
 * @param {string} inverterType - 'microinverter' or 'inverter'
 * @param {string} manufacturer - Manufacturer name
 * @returns {string} - 'standard', 'dual-qty', or 'inverter-input'
 */
export const getStringingMode = (inverterType, manufacturer) => {
  if (inverterType === 'inverter') {
    return 'inverter-input';
  }

  if (isDualQtyManufacturer(manufacturer)) {
    return 'dual-qty';
  }

  return 'standard';
};

// ============================================
// VOLTAGE AND CURRENT VALIDATION
// ============================================

/**
 * Calculate string voltage at coldest temperature (NEC 690.7 compliant)
 * @param {number} panelsPerString - Number of panels in string
 * @param {number} panelVoc - Panel open circuit voltage (STC)
 * @param {number|null} correctionFactor - NEC 690.7 temperature correction factor (from API), or null to use fallback
 * @param {number} tempCoeffVoc - Temperature coefficient of Voc (%/°C), fallback only
 * @param {number} minTemp - Minimum expected temperature (°C), fallback only
 * @returns {number} - String Voc at coldest temp
 */
export const calculateStringVoltage = (panelsPerString, panelVoc, correctionFactor = null, tempCoeffVoc = -0.3, minTemp = -10) => {
  let vocCold;

  if (correctionFactor !== null && correctionFactor > 0) {
    // NEC 690.7 method: use correction factor from API
    vocCold = panelVoc * correctionFactor;
  } else {
    // Fallback method: calculate from temperature coefficient
    const tempDelta = minTemp - 25; // STC is 25°C
    vocCold = panelVoc * (1 + (tempCoeffVoc / 100) * tempDelta);
  }

  return panelsPerString * vocCold;
};

/**
 * Validate string voltage against inverter max
 * @param {number} stringVoltage - Calculated string voltage
 * @param {number} inverterMaxVdc - Inverter maximum DC voltage
 * @returns {object} - Validation result
 */
export const validateStringVoltage = (stringVoltage, inverterMaxVdc) => {
  const isValid = stringVoltage <= inverterMaxVdc;
  const margin = inverterMaxVdc - stringVoltage;
  const percentUsed = (stringVoltage / inverterMaxVdc) * 100;

  return {
    isValid,
    stringVoltage: Math.round(stringVoltage * 10) / 10,
    maxVoltage: inverterMaxVdc,
    margin: Math.round(margin * 10) / 10,
    percentUsed: Math.round(percentUsed),
    message: isValid
      ? `${Math.round(percentUsed)}% of max voltage`
      : `Exceeds max by ${Math.abs(Math.round(margin))}V`,
  };
};

/**
 * Calculate string current
 * @param {number} panelIsc - Panel short circuit current
 * @param {number} stringsParallel - Number of parallel strings (1 or 2)
 * @returns {number} - Combined string current with 125% safety factor
 */
export const calculateStringCurrent = (panelIsc, stringsParallel = 1) => {
  return panelIsc * stringsParallel * 1.25;
};

/**
 * Validate string current against input max
 * @param {number} stringCurrent - Calculated string current
 * @param {number} inputMaxIsc - Input maximum short circuit current
 * @returns {object} - Validation result
 */
export const validateStringCurrent = (stringCurrent, inputMaxIsc) => {
  const isValid = stringCurrent <= inputMaxIsc;

  return {
    isValid,
    stringCurrent: Math.round(stringCurrent * 100) / 100,
    maxCurrent: inputMaxIsc,
    message: isValid
      ? `${Math.round((stringCurrent / inputMaxIsc) * 100)}% of max current`
      : `Exceeds max by ${(stringCurrent - inputMaxIsc).toFixed(2)}A`,
  };
};
