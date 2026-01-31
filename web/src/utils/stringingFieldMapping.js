/**
 * Stringing Field Mapping Utility
 * Maps frontend field names to backend API field names
 */

/**
 * Map frontend stringing fields to backend format for saving
 * @param {object} formData - Frontend form data
 * @param {string} systemPrefix - System prefix (default 'sys1')
 * @returns {object} - Backend formatted data
 */
export const mapStringingToBackend = (formData, systemPrefix = 'sys1') => {
  const mapped = {};

  // Determine if microinverter or string inverter
  const isMicroinverter = formData.inverter_type === 'microinverter';

  if (isMicroinverter) {
    // Microinverter stringing fields
    mapped[`${systemPrefix}_micro_stringing_type`] = formData.micro_stringing_type || 'auto';

    // Branch fields (up to 8)
    for (let i = 1; i <= 8; i++) {
      // Panel qty - try both new and old field names
      const panelQty = formData[`micro_branch_panel_qty_${i}`] || formData[`micro_branch_string_${i}`];
      if (panelQty) {
        mapped[`${systemPrefix}_micro_branch_panel_qty_${i}`] = parseInt(panelQty) || null;
      }

      // Micro qty (for Hoymiles/APSystems)
      const microQty = formData[`micro_branch_micro_qty_${i}`];
      if (microQty) {
        mapped[`${systemPrefix}_micro_branch_micro_qty_${i}`] = parseInt(microQty) || null;
      }

      // New/Existing (invert boolean: isnew=true → existing=false)
      const isNew = formData[`micro_branch_${i}_isnew`];
      if (isNew !== undefined && isNew !== null) {
        mapped[`${systemPrefix}_micro_branch_${i}_existing`] = !isNew;
      }
    }
  } else {
    // String inverter stringing fields
    mapped[`${systemPrefix}_stringing_type`] = formData.stringing_type || 'auto';

    // Input fields (up to 6)
    for (let i = 1; i <= 6; i++) {
      // Strings
      const strings = formData[`input_${i}_strings`];
      if (strings) {
        mapped[`${systemPrefix}_input_${i}_strings`] = parseInt(strings) || null;
      }

      // Panel qty
      const panelQty = formData[`input_${i}_panel_qty`];
      if (panelQty) {
        mapped[`${systemPrefix}_input_${i}_panel_qty`] = parseInt(panelQty) || null;
      }

      // New/Existing (invert boolean)
      const isNew = formData[`input_${i}_isnew`];
      if (isNew !== undefined && isNew !== null) {
        mapped[`${systemPrefix}_input_${i}_existing`] = !isNew;
      }
    }
  }

  // Solar panel electrical specs
  if (formData.solar_panel_voc) {
    mapped[`${systemPrefix}_panel_voc`] = parseFloat(formData.solar_panel_voc) || null;
  }
  if (formData.solar_panel_isc) {
    mapped[`${systemPrefix}_panel_isc`] = parseFloat(formData.solar_panel_isc) || null;
  }
  if (formData.solar_panel_vmp) {
    mapped[`${systemPrefix}_panel_vmp`] = parseFloat(formData.solar_panel_vmp) || null;
  }
  if (formData.solar_panel_imp) {
    mapped[`${systemPrefix}_panel_imp`] = parseFloat(formData.solar_panel_imp) || null;
  }
  if (formData.solar_panel_temp_coeff_voc) {
    mapped[`${systemPrefix}_panel_temp_coeff_voc`] = parseFloat(formData.solar_panel_temp_coeff_voc) || null;
  }

  // Inverter electrical specs
  if (formData.inverter_max_vdc) {
    mapped[`${systemPrefix}_inv_max_vdc`] = parseFloat(formData.inverter_max_vdc) || null;
  }
  if (formData.inverter_min_vdc) {
    mapped[`${systemPrefix}_inv_min_vdc`] = parseFloat(formData.inverter_min_vdc) || null;
  }
  if (formData.inverter_max_input_isc) {
    mapped[`${systemPrefix}_inv_max_input_isc`] = parseFloat(formData.inverter_max_input_isc) || null;
  }

  return mapped;
};

/**
 * Map backend stringing fields to frontend format for loading
 * @param {object} backendData - Backend API response data
 * @param {string} systemPrefix - System prefix (default 'sys1')
 * @returns {object} - Frontend formatted data
 */
export const mapStringingToFrontend = (backendData, systemPrefix = 'sys1') => {
  const mapped = {};

  if (!backendData) return mapped;

  // Detect inverter type from backend data
  const hasMicroStringing = backendData[`${systemPrefix}_micro_stringing_type`];
  const hasInverterStringing = backendData[`${systemPrefix}_stringing_type`];

  if (hasMicroStringing) {
    // Microinverter stringing
    mapped.micro_stringing_type = backendData[`${systemPrefix}_micro_stringing_type`] || 'auto';

    for (let i = 1; i <= 8; i++) {
      // Panel qty
      const panelQty = backendData[`${systemPrefix}_micro_branch_panel_qty_${i}`];
      if (panelQty !== null && panelQty !== undefined) {
        mapped[`micro_branch_panel_qty_${i}`] = String(panelQty);
        // Also set old field name for backward compatibility
        mapped[`micro_branch_string_${i}`] = String(panelQty);
      }

      // Micro qty
      const microQty = backendData[`${systemPrefix}_micro_branch_micro_qty_${i}`];
      if (microQty !== null && microQty !== undefined) {
        mapped[`micro_branch_micro_qty_${i}`] = String(microQty);
      }

      // Existing → isNew (invert)
      const existing = backendData[`${systemPrefix}_micro_branch_${i}_existing`];
      if (existing !== null && existing !== undefined) {
        mapped[`micro_branch_${i}_isnew`] = !existing;
      }
    }
  }

  if (hasInverterStringing) {
    // String inverter stringing
    mapped.stringing_type = backendData[`${systemPrefix}_stringing_type`] || 'auto';

    for (let i = 1; i <= 6; i++) {
      // Strings
      const strings = backendData[`${systemPrefix}_input_${i}_strings`];
      if (strings !== null && strings !== undefined) {
        mapped[`input_${i}_strings`] = String(strings);
      }

      // Panel qty
      const panelQty = backendData[`${systemPrefix}_input_${i}_panel_qty`];
      if (panelQty !== null && panelQty !== undefined) {
        mapped[`input_${i}_panel_qty`] = String(panelQty);
      }

      // Existing → isNew (invert)
      const existing = backendData[`${systemPrefix}_input_${i}_existing`];
      if (existing !== null && existing !== undefined) {
        mapped[`input_${i}_isnew`] = !existing;
      }
    }
  }

  // Solar panel electrical specs
  const panelVoc = backendData[`${systemPrefix}_panel_voc`];
  if (panelVoc) mapped.solar_panel_voc = String(panelVoc);

  const panelIsc = backendData[`${systemPrefix}_panel_isc`];
  if (panelIsc) mapped.solar_panel_isc = String(panelIsc);

  const panelVmp = backendData[`${systemPrefix}_panel_vmp`];
  if (panelVmp) mapped.solar_panel_vmp = String(panelVmp);

  const panelImp = backendData[`${systemPrefix}_panel_imp`];
  if (panelImp) mapped.solar_panel_imp = String(panelImp);

  const tempCoeff = backendData[`${systemPrefix}_panel_temp_coeff_voc`];
  if (tempCoeff) mapped.solar_panel_temp_coeff_voc = String(tempCoeff);

  // Inverter electrical specs
  const maxVdc = backendData[`${systemPrefix}_inv_max_vdc`];
  if (maxVdc) mapped.inverter_max_vdc = String(maxVdc);

  const minVdc = backendData[`${systemPrefix}_inv_min_vdc`];
  if (minVdc) mapped.inverter_min_vdc = String(minVdc);

  const maxIsc = backendData[`${systemPrefix}_inv_max_input_isc`];
  if (maxIsc) mapped.inverter_max_input_isc = String(maxIsc);

  return mapped;
};
