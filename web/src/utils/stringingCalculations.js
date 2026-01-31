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
 * @param {number} totalPanels - Total solar panels
 * @param {number} maxInputs - Max inputs on the inverter (from max_strings_branches)
 * @param {number} stringsPerInput - Strings per input (1 or 2)
 * @param {number} maxPanelsPerString - Max panels per string (voltage limited)
 * @returns {object} - Distribution across inputs
 */
export const calculateInverterInputDistribution = (
  totalPanels,
  maxInputs,
  stringsPerInput = 1,
  maxPanelsPerString = 15
) => {
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
 * Calculate string voltage at coldest temperature
 * @param {number} panelsPerString - Number of panels in string
 * @param {number} panelVoc - Panel open circuit voltage (STC)
 * @param {number} tempCoeffVoc - Temperature coefficient of Voc (%/°C), typically negative
 * @param {number} minTemp - Minimum expected temperature (°C), default -10
 * @returns {number} - String Voc at coldest temp
 */
export const calculateStringVoltage = (panelsPerString, panelVoc, tempCoeffVoc = -0.3, minTemp = -10) => {
  // Voc increases as temperature decreases (tempCoeff is negative)
  const tempDelta = minTemp - 25; // STC is 25°C
  const vocCold = panelVoc * (1 + (tempCoeffVoc / 100) * tempDelta);
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
