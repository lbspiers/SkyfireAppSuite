/**
 * Stringing Utility Functions
 * Shared calculations for stringing logic across components
 */

/**
 * Calculate total panels assigned and panels remaining
 * Used by both EquipmentForm.js and InverterMicroSection.js
 *
 * @param {Object} formData - Form data containing solar panel quantities and stringing data
 * @param {boolean} isMicroinverter - Whether the inverter type is microinverter
 * @returns {Object} { totalPanelQty, totalPanelsAssigned, panelsRemaining }
 */
export const calculatePanelsRemaining = (formData, isMicroinverter) => {
  // Calculate total panel quantity (Type 1 + Type 2)
  const totalPanelQty =
    (parseInt(formData.solar_panel_quantity) || 0) +
    (parseInt(formData.solar_panel_type2_quantity) || 0);

  // Calculate total panels assigned across all branches/strings
  let totalAssigned = 0;

  if (isMicroinverter) {
    // Microinverters: use branch_string_X (direct panel quantity)
    for (let i = 1; i <= 10; i++) {
      const panelQty = parseInt(formData[`branch_string_${i}`]) || 0;
      totalAssigned += panelQty;
    }
  } else {
    // String inverters: branch_string_X stores panels per string directly
    // (1 string per MPPT input)
    for (let i = 1; i <= 10; i++) {
      const panelsPerString = parseInt(formData[`branch_string_${i}`]) || 0;
      totalAssigned += panelsPerString;
    }
  }

  return {
    totalPanelQty,
    totalPanelsAssigned: totalAssigned,
    panelsRemaining: totalPanelQty - totalAssigned,
  };
};

/**
 * Check if custom stringing is complete (all panels assigned)
 *
 * @param {Object} formData - Form data containing solar panel quantities and stringing data
 * @param {boolean} isMicroinverter - Whether the inverter type is microinverter
 * @returns {Object} { isComplete, panelsRemaining, message }
 */
export const validateCustomStringing = (formData, isMicroinverter) => {
  const { panelsRemaining } = calculatePanelsRemaining(formData, isMicroinverter);

  const isComplete = panelsRemaining === 0;
  const absRemaining = Math.abs(panelsRemaining);

  let message = '';
  if (!isComplete) {
    if (panelsRemaining > 0) {
      message = `You have ${absRemaining} solar panel${absRemaining !== 1 ? 's' : ''} remaining to assign. Please complete stringing before proceeding.`;
    } else {
      message = `You have ${absRemaining} solar panel${absRemaining !== 1 ? 's' : ''} over-assigned. Please adjust stringing before proceeding.`;
    }
  }

  return {
    isComplete,
    panelsRemaining,
    message,
  };
};
