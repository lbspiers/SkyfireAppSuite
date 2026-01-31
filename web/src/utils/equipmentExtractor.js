/**
 * Equipment Extractor Utility
 *
 * Shared helper function to extract ALL equipment from systemDetails.
 * Used by both the Spec Sheets tab and Review tab for consistent equipment display.
 */

/**
 * Extract all equipment from systemDetails
 * @param {object} systemDetails - System details object from useSystemDetails hook
 * @returns {Array} Array of equipment objects with type, manufacturer, model, quantity, systemNumber, and key
 */
export const extractAllEquipment = (systemDetails) => {
  if (!systemDetails) return [];

  const equipment = [];

  // ===== PER SYSTEM EQUIPMENT (sys1, sys2, sys3, sys4) =====
  const systems = [
    { prefix: 'sys1', number: 1 },
    { prefix: 'sys2', number: 2 },
    { prefix: 'sys3', number: 3 },
    { prefix: 'sys4', number: 4 }
  ];

  systems.forEach(({ prefix, number }) => {
    // Solar Panel - Primary
    const panelMake = systemDetails[`${prefix}_solar_panel_make`];
    const panelModel = systemDetails[`${prefix}_solar_panel_model`];
    const panelQty = systemDetails[`${prefix}_solar_panel_quantity`];
    if (panelMake && panelModel) {
      equipment.push({
        type: 'Solar Panel',
        manufacturer: panelMake,
        model: panelModel,
        quantity: panelQty,
        systemNumber: number,
        key: `${prefix}_solar_panel`
      });
    }

    // Solar Panel Type 2 (mixed panel systems)
    const panel2Make = systemDetails[`${prefix}_solar_panel_type2_manufacturer`];
    const panel2Model = systemDetails[`${prefix}_solar_panel_type2_model`];
    const panel2Qty = systemDetails[`${prefix}_solar_panel_type2_quantity`];
    if (panel2Make && panel2Model) {
      equipment.push({
        type: 'Solar Panel',
        manufacturer: panel2Make,
        model: panel2Model,
        quantity: panel2Qty,
        systemNumber: number,
        key: `${prefix}_solar_panel_type2`
      });
    }

    // Inverter
    const inverterMake = systemDetails[`${prefix}_inverter_make`];
    const inverterModel = systemDetails[`${prefix}_inverter_model`];
    const inverterQty = systemDetails[`${prefix}_inverter_quantity`];
    const inverterType = systemDetails[`${prefix}_inverter_type`];
    if (inverterMake && inverterModel) {
      equipment.push({
        type: inverterType === 'microinverter' ? 'Microinverter' : 'Inverter',
        manufacturer: inverterMake,
        model: inverterModel,
        quantity: inverterQty,
        systemNumber: number,
        key: `${prefix}_inverter`
      });
    }

    // Microinverter (legacy field)
    const microMake = systemDetails[`${prefix}_micro_inverter_make`];
    const microModel = systemDetails[`${prefix}_micro_inverter_model`];
    const microQty = systemDetails[`${prefix}_micro_inverter_qty`];
    if (microMake && microModel) {
      equipment.push({
        type: 'Microinverter',
        manufacturer: microMake,
        model: microModel,
        quantity: microQty,
        systemNumber: number,
        key: `${prefix}_micro_inverter`
      });
    }

    // Optimizer
    const optimizerMake = systemDetails[`${prefix}_optimizer_make`];
    const optimizerModel = systemDetails[`${prefix}_optimizer_model`];
    if (optimizerMake && optimizerModel) {
      equipment.push({
        type: 'Optimizer',
        manufacturer: optimizerMake,
        model: optimizerModel,
        systemNumber: number,
        key: `${prefix}_optimizer`
      });
    }

    // String Combiner Panel
    const combinerMake = systemDetails[`${prefix}_combiner_panel_make`];
    const combinerModel = systemDetails[`${prefix}_combiner_panel_model`];
    if (combinerMake && combinerModel) {
      equipment.push({
        type: 'String Combiner Panel',
        manufacturer: combinerMake,
        model: combinerModel,
        systemNumber: number,
        key: `${prefix}_combiner_panel`
      });
    }

    // ESS (Energy Storage System)
    const essMake = systemDetails[`${prefix}_ess_make`];
    const essModel = systemDetails[`${prefix}_ess_model`];
    if (essMake && essModel) {
      equipment.push({
        type: 'Storage Management System',
        manufacturer: essMake,
        model: essModel,
        systemNumber: number,
        key: `${prefix}_ess`
      });
    }

    // Battery 1
    const battery1Make = systemDetails[`${prefix}_battery_1_make`];
    const battery1Model = systemDetails[`${prefix}_battery_1_model`];
    const battery1Qty = systemDetails[`${prefix}_battery_1_qty`];
    if (battery1Make && battery1Model) {
      equipment.push({
        type: 'Battery',
        manufacturer: battery1Make,
        model: battery1Model,
        quantity: battery1Qty,
        systemNumber: number,
        key: `${prefix}_battery_1`
      });
    }

    // Battery 2
    const battery2Make = systemDetails[`${prefix}_battery_2_make`];
    const battery2Model = systemDetails[`${prefix}_battery_2_model`];
    const battery2Qty = systemDetails[`${prefix}_battery_2_qty`];
    if (battery2Make && battery2Model) {
      equipment.push({
        type: 'Battery',
        manufacturer: battery2Make,
        model: battery2Model,
        quantity: battery2Qty,
        systemNumber: number,
        key: `${prefix}_battery_2`
      });
    }

    // SMS (Storage Management System - alternative field)
    const smsMake = systemDetails[`${prefix}_sms_make`];
    const smsModel = systemDetails[`${prefix}_sms_model`];
    if (smsMake && smsModel) {
      equipment.push({
        type: 'Storage Management System',
        manufacturer: smsMake,
        model: smsModel,
        systemNumber: number,
        key: `${prefix}_sms`
      });
    }

    // Backup Load Sub Panel (per-system)
    const backupPanelMake = systemDetails[`${prefix}_backup_load_sub_panel_make`];
    const backupPanelModel = systemDetails[`${prefix}_backup_load_sub_panel_model`];
    if (backupPanelMake && backupPanelModel) {
      equipment.push({
        type: 'Backup Load Sub Panel',
        manufacturer: backupPanelMake,
        model: backupPanelModel,
        systemNumber: number,
        key: `${prefix}_backup_load_sub_panel`
      });
    }

    // Battery Combiner Panel (per-system)
    const batteryCombinerMake = systemDetails[`${prefix}_battery_combiner_panel_make`];
    const batteryCombinerModel = systemDetails[`${prefix}_battery_combiner_panel_model`];
    if (batteryCombinerMake && batteryCombinerModel) {
      equipment.push({
        type: 'Battery Combiner Panel',
        manufacturer: batteryCombinerMake,
        model: batteryCombinerModel,
        systemNumber: number,
        key: `${prefix}_battery_combiner_panel`
      });
    }
  });

  // ===== SHARED/GLOBAL EQUIPMENT (NOT per-system) =====

  // SMS (Global)
  if (systemDetails.sms_make && systemDetails.sms_model) {
    equipment.push({
      type: 'Storage Management System',
      manufacturer: systemDetails.sms_make,
      model: systemDetails.sms_model,
      systemNumber: null,
      key: 'sms'
    });
  }

  // Battery Type 1 (Global)
  if (systemDetails.battery1_make && systemDetails.battery1_model) {
    equipment.push({
      type: 'Battery',
      manufacturer: systemDetails.battery1_make,
      model: systemDetails.battery1_model,
      quantity: systemDetails.battery1_quantity,
      systemNumber: null,
      key: 'battery1'
    });
  }

  // Battery Type 2 (Global)
  if (systemDetails.battery2_make && systemDetails.battery2_model) {
    equipment.push({
      type: 'Battery',
      manufacturer: systemDetails.battery2_make,
      model: systemDetails.battery2_model,
      quantity: systemDetails.battery2_quantity,
      systemNumber: null,
      key: 'battery2'
    });
  }

  // Backup Load Sub Panel (Global)
  if (systemDetails.backup_panel_make && systemDetails.backup_panel_model) {
    equipment.push({
      type: 'Backup Load Sub Panel',
      manufacturer: systemDetails.backup_panel_make,
      model: systemDetails.backup_panel_model,
      systemNumber: null,
      key: 'backup_panel'
    });
  }

  // Battery Combiner Panel (Global)
  if (systemDetails.battery_combiner_panel_make && systemDetails.battery_combiner_panel_model) {
    equipment.push({
      type: 'Battery Combiner Panel',
      manufacturer: systemDetails.battery_combiner_panel_make,
      model: systemDetails.battery_combiner_panel_model,
      systemNumber: null,
      key: 'battery_combiner_panel'
    });
  }

  // ===== ROOF/MOUNTING EQUIPMENT =====

  // Roof Type A - Rails
  if (systemDetails.rta_rail_make && systemDetails.rta_rail_model) {
    equipment.push({
      type: 'Rail',
      manufacturer: systemDetails.rta_rail_make,
      model: systemDetails.rta_rail_model,
      systemNumber: null,
      key: 'rta_rail'
    });
  }

  // Roof Type A - Attachment
  if (systemDetails.rta_attachment_make && systemDetails.rta_attachment_model) {
    equipment.push({
      type: 'Roof Attachment',
      manufacturer: systemDetails.rta_attachment_make,
      model: systemDetails.rta_attachment_model,
      systemNumber: null,
      key: 'rta_attachment'
    });
  }

  // Roof Type B - Rails
  if (systemDetails.rtb_rail_make && systemDetails.rtb_rail_model) {
    equipment.push({
      type: 'Rail',
      manufacturer: systemDetails.rtb_rail_make,
      model: systemDetails.rtb_rail_model,
      systemNumber: null,
      key: 'rtb_rail'
    });
  }

  // Roof Type B - Attachment
  if (systemDetails.rtb_attachment_make && systemDetails.rtb_attachment_model) {
    equipment.push({
      type: 'Roof Attachment',
      manufacturer: systemDetails.rtb_attachment_make,
      model: systemDetails.rtb_attachment_model,
      systemNumber: null,
      key: 'rtb_attachment'
    });
  }

  // ===== ELECTRICAL PANELS =====

  // Sub Panel B
  if (systemDetails.spb_sub_panel_make && systemDetails.spb_sub_panel_model) {
    equipment.push({
      type: 'Sub Panel',
      manufacturer: systemDetails.spb_sub_panel_make,
      model: systemDetails.spb_sub_panel_model,
      systemNumber: null,
      key: 'spb_sub_panel'
    });
  }

  // Backup Load Sub Panel (bls1)
  if (systemDetails.bls1_backup_load_sub_panel_make && systemDetails.bls1_backup_load_sub_panel_model) {
    equipment.push({
      type: 'Backup Load Sub Panel',
      manufacturer: systemDetails.bls1_backup_load_sub_panel_make,
      model: systemDetails.bls1_backup_load_sub_panel_model,
      systemNumber: null,
      key: 'bls1_backup_load_sub_panel'
    });
  }

  // Battery Combiner Panel (bls2)
  if (systemDetails.bls2_battery_combiner_panel_make && systemDetails.bls2_battery_combiner_panel_model) {
    equipment.push({
      type: 'Battery Combiner Panel',
      manufacturer: systemDetails.bls2_battery_combiner_panel_make,
      model: systemDetails.bls2_battery_combiner_panel_model,
      systemNumber: null,
      key: 'bls2_battery_combiner_panel'
    });
  }

  // Battery Combiner Panel (bcp1)
  if (systemDetails.bcp1_make && systemDetails.bcp1_model) {
    equipment.push({
      type: 'Battery Combiner Panel',
      manufacturer: systemDetails.bcp1_make,
      model: systemDetails.bcp1_model,
      systemNumber: null,
      key: 'bcp1'
    });
  }

  // System Combiner Panel 1
  if (systemDetails.system_combiner_panel_1_make && systemDetails.system_combiner_panel_1_model) {
    equipment.push({
      type: 'System Combiner Panel',
      manufacturer: systemDetails.system_combiner_panel_1_make,
      model: systemDetails.system_combiner_panel_1_model,
      systemNumber: null,
      key: 'system_combiner_panel_1'
    });
  }

  // System Combiner Panel 2
  if (systemDetails.system_combiner_panel_2_make && systemDetails.system_combiner_panel_2_model) {
    equipment.push({
      type: 'System Combiner Panel',
      manufacturer: systemDetails.system_combiner_panel_2_make,
      model: systemDetails.system_combiner_panel_2_model,
      systemNumber: null,
      key: 'system_combiner_panel_2'
    });
  }

  // ===== BOS EQUIPMENT (Balance of System) =====
  const bosSystems = ['sys1', 'sys2', 'sys3', 'sys4'];
  const bosTypes = ['type1', 'type2', 'type3', 'type4', 'type5', 'type6'];

  bosSystems.forEach((sys, sysIndex) => {
    bosTypes.forEach((type) => {
      const prefix = `bos_${sys}_${type}_`;
      const equipType = systemDetails[`${prefix}equipment_type`];
      const make = systemDetails[`${prefix}make`];
      const model = systemDetails[`${prefix}model`];
      const isActive = systemDetails[`bos_${sys}_${type}_active`];

      if (isActive && make && model) {
        equipment.push({
          type: equipType || 'BOS Equipment',
          manufacturer: make,
          model: model,
          systemNumber: sysIndex + 1,
          key: `bos_${sys}_${type}`
        });
      }
    });
  });

  // ===== PRE-COMBINE EQUIPMENT =====
  for (let pos = 1; pos <= 3; pos++) {
    for (let sys = 1; sys <= 3; sys++) {
      const prePrefix = `precombine_${pos}_${sys}_`;
      const preType = systemDetails[`${prePrefix}equipment_type`];
      const preMake = systemDetails[`${prePrefix}make`];
      const preModel = systemDetails[`${prePrefix}model`];

      if (preMake && preModel) {
        equipment.push({
          type: preType || 'Pre-Combine Equipment',
          manufacturer: preMake,
          model: preModel,
          systemNumber: sys,
          key: `precombine_${pos}_${sys}`
        });
      }
    }
  }

  // ===== POST-COMBINE EQUIPMENT =====
  for (let pos = 1; pos <= 3; pos++) {
    for (let sys = 1; sys <= 3; sys++) {
      const postPrefix = `postcombine_${pos}_${sys}_`;
      const postType = systemDetails[`${postPrefix}equipment_type`];
      const postMake = systemDetails[`${postPrefix}make`];
      const postModel = systemDetails[`${postPrefix}model`];

      if (postMake && postModel) {
        equipment.push({
          type: postType || 'Post-Combine Equipment',
          manufacturer: postMake,
          model: postModel,
          systemNumber: sys,
          key: `postcombine_${pos}_${sys}`
        });
      }
    }
  }

  // ===== DEDUPLICATE =====
  // Remove duplicates based on manufacturer + model combination
  const seen = new Set();
  return equipment.filter(item => {
    const key = `${item.manufacturer?.toLowerCase()}-${item.model?.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

/**
 * Group equipment by category for organized display
 * @param {Array} equipment - Array of equipment objects from extractAllEquipment
 * @returns {Object} Object with equipment grouped by category
 */
export const groupEquipmentByCategory = (equipment) => {
  const groups = {
    'Solar': [],
    'Inverters & Optimizers': [],
    'Energy Storage': [],
    'Electrical Panels': [],
    'Mounting': [],
    'BOS Equipment': [],
    'Other': []
  };

  equipment.forEach(item => {
    if (item.type === 'Solar Panel') {
      groups['Solar'].push(item);
    } else if (['Inverter', 'Microinverter', 'Optimizer'].includes(item.type)) {
      groups['Inverters & Optimizers'].push(item);
    } else if (['Battery', 'Storage Management System', 'SMS'].includes(item.type)) {
      groups['Energy Storage'].push(item);
    } else if (
      item.type.includes('Panel') ||
      item.type.includes('Sub Panel') ||
      item.type.includes('Combiner')
    ) {
      groups['Electrical Panels'].push(item);
    } else if (['Rail', 'Roof Attachment'].includes(item.type)) {
      groups['Mounting'].push(item);
    } else if (item.type === 'BOS Equipment' || item.type.includes('BOS')) {
      groups['BOS Equipment'].push(item);
    } else {
      groups['Other'].push(item);
    }
  });

  // Filter out empty groups
  return Object.fromEntries(
    Object.entries(groups).filter(([_, items]) => items.length > 0)
  );
};
