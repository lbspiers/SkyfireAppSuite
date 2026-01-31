/**
 * Combine Systems Helper Functions
 * Ported from mobile app's equipmentHelpers.ts
 */

/**
 * Check if a system has AC coupling capability
 * (PowerWall 3/+, SolarEdge Backup Interface, or Sol-Ark)
 */
export const hasACCouplingCapability = (systemNum, systemData) => {
  const prefix = `sys${systemNum}_`;

  // Check inverter for PowerWall 3/+
  const inverterModel = systemData?.[`${prefix}micro_inverter_model`];
  if (inverterModel) {
    const inverterStr = String(inverterModel).toLowerCase();
    if (inverterStr.includes('powerwall 3') || inverterStr.includes('powerwall+')) {
      return { hasCapability: true, type: 'PowerWall', model: inverterModel };
    }
  }

  // Check inverter make for Sol-Ark
  const inverterMake = systemData?.[`${prefix}micro_inverter_make`];
  if (inverterMake) {
    const makeStr = String(inverterMake).toLowerCase();
    if (makeStr.includes('sol-ark') || makeStr.includes('solark')) {
      return { hasCapability: true, type: 'Sol-Ark', model: inverterModel || 'Sol-Ark Inverter' };
    }
  }

  // Check SMS for SolarEdge Backup Interface
  const smsModel = systemData?.[`${prefix}sms_model`];
  if (smsModel) {
    const smsStr = String(smsModel).toLowerCase();
    if (smsStr.includes('backup interface')) {
      return { hasCapability: true, type: 'SolarEdge Backup Interface', model: smsModel };
    }
  }

  return { hasCapability: false };
};

/**
 * Check if a system has a String Inverter (NOT microinverter)
 * Only string inverters can be landing locations for other systems
 */
export const hasStringInverter = (systemNum, systemData) => {
  const prefix = `sys${systemNum}_`;
  const inverterType = systemData?.[`${prefix}inverter_type`];
  const inverterMake = systemData?.[`${prefix}micro_inverter_make`];
  const inverterModel = systemData?.[`${prefix}micro_inverter_model`];

  // Only return true if it's explicitly a string inverter (not microinverter)
  if ((inverterMake || inverterModel) && inverterType === 'inverter') {
    return { hasInverter: true, make: inverterMake, model: inverterModel };
  }

  return { hasInverter: false };
};

/**
 * Check if a system has a String Combiner Panel (for microinverter systems)
 */
export const hasStringCombinerPanel = (systemNum, systemData) => {
  const prefix = `sys${systemNum}_`;
  const inverterType = systemData?.[`${prefix}inverter_type`];
  const combinerMake = systemData?.[`${prefix}string_combiner_panel_make`];
  const combinerModel = systemData?.[`${prefix}string_combiner_panel_model`];

  // Only return true if it's a microinverter system with a string combiner panel
  if ((combinerMake || combinerModel) && inverterType === 'microinverter') {
    return { hasCombiner: true, make: combinerMake, model: combinerModel };
  }

  return { hasCombiner: false };
};

/**
 * Check if a system has Storage Management System
 */
export const hasSMS = (systemNum, systemData) => {
  const prefix = `sys${systemNum}_`;
  const smsMake = systemData?.[`${prefix}sms_make`];
  const smsModel = systemData?.[`${prefix}sms_model`];

  if (smsMake || smsModel) {
    return { hasSMS: true, make: smsMake, model: smsModel };
  }

  return { hasSMS: false };
};

/**
 * Generate dynamic landing options for a specific system
 */
export const getLandingOptions = (
  currentSystemNum,
  activeSystems,
  systemData,
  systemLandings,
  hasSubPanelB
) => {
  const options = [];

  // Standard Panel Options
  options.push({
    value: 'Main Panel',
    label: 'Main Panel',
    description: 'Connect to the main electrical panel',
    type: 'panel',
  });

  if (hasSubPanelB) {
    options.push({
      value: 'Sub Panel B',
      label: 'Sub Panel B',
      description: 'Connect to Sub Panel B',
      type: 'panel',
    });
  } else {
    options.push({
      value: 'Sub Panel B (Add)',
      label: 'Sub Panel B',
      description: 'Add and connect to Sub Panel B',
      type: 'panel',
    });
  }

  // Combiner Panel Logic and Dynamic Landing Options (from previous systems)
  const previousSystems = activeSystems.filter(s => s < currentSystemNum);
  const combinerUsedBySystem = previousSystems.find(s => {
    const landing = systemLandings[`system${s}`];
    return landing?.includes('Combiner Panel');
  });

  if (combinerUsedBySystem) {
    options.push({
      value: `Combiner Panel (Same as System ${combinerUsedBySystem})`,
      label: 'Combiner Panel (Shared)',
      description: `Use same combiner as System ${combinerUsedBySystem}`,
      type: 'combiner',
    });
  } else {
    options.push({
      value: 'Combiner Panel',
      label: 'Combiner Panel',
      description: 'Connect to a combiner panel',
      type: 'combiner',
    });
  }

  // Dynamic String Inverter Landing Options (from previous systems only)
  // Only string inverters can be landing locations (NOT microinverters)
  previousSystems.forEach(sysNum => {
    const inverterInfo = hasStringInverter(sysNum, systemData);
    if (inverterInfo.hasInverter) {
      // Build display string with make and model
      let displayText = 'Inverter';
      if (inverterInfo.make && inverterInfo.model) {
        displayText = `${inverterInfo.make} ${inverterInfo.model}`;
      } else if (inverterInfo.model) {
        displayText = inverterInfo.model;
      } else if (inverterInfo.make) {
        displayText = inverterInfo.make;
      }

      options.push({
        value: `Inverter: System ${sysNum}`,
        label: `Inverter`,
        description: `Sys ${sysNum} - ${displayText}`,
        highlighted: true,
        type: 'inverter',
        displayText: displayText, // Store for collapsed view
      });
    }
  });

  // Dynamic String Combiner Panel Landing Options (for microinverter systems)
  previousSystems.forEach(sysNum => {
    const combinerInfo = hasStringCombinerPanel(sysNum, systemData);
    if (combinerInfo.hasCombiner) {
      // Build display string with make and model
      let displayText = 'String Combiner Panel';
      if (combinerInfo.make && combinerInfo.model) {
        displayText = `${combinerInfo.make} ${combinerInfo.model}`;
      } else if (combinerInfo.model) {
        displayText = combinerInfo.model;
      } else if (combinerInfo.make) {
        displayText = combinerInfo.make;
      }

      options.push({
        value: `String Combiner Panel: System ${sysNum}`,
        label: `String Combiner Panel`,
        description: `Sys ${sysNum} - ${displayText}`,
        highlighted: true,
        type: 'string_combiner',
        displayText: displayText, // Store for collapsed view
      });
    }
  });

  // Dynamic SMS Landing Options (from previous systems only)
  previousSystems.forEach(sysNum => {
    const smsInfo = hasSMS(sysNum, systemData);
    if (smsInfo.hasSMS) {
      // Build display string with make and model
      let displayText = 'Storage';
      if (smsInfo.make && smsInfo.model) {
        displayText = `${smsInfo.make} ${smsInfo.model}`;
      } else if (smsInfo.model) {
        displayText = smsInfo.model;
      } else if (smsInfo.make) {
        displayText = smsInfo.make;
      }

      options.push({
        value: `SMS: System ${sysNum}`,
        label: `Storage Management System`,
        description: `Sys ${sysNum} - ${displayText}`,
        highlighted: true,
        type: 'sms',
        displayText: displayText, // Store for collapsed view
      });
    }
  });

  // Dynamic AC Input Options (from other systems)
  const otherSystems = activeSystems.filter(s => s !== currentSystemNum);
  otherSystems.forEach(sysNum => {
    const acCapability = hasACCouplingCapability(sysNum, systemData);
    if (acCapability.hasCapability) {
      options.push({
        value: `AC Input: System ${sysNum} (${acCapability.type})`,
        label: `System ${sysNum} (${acCapability.type})`,
        description: `AC input to System ${sysNum}'s inverter`,
        highlighted: true,
        type: 'ac_couple',
      });
    }
  });

  return options;
};

/**
 * Generate complete configuration data for database storage
 */
export const generateConfigurationData = (
  combineSystems,
  systemLandings,
  activeSystems,
  systemData,
  hasSubPanelB,
  subPanelBData,
  combinerPanelData = null
) => {
  const connections = [];
  const combinerPanels = [];
  const acCoupling = [];
  const smsConnections = [];

  // Build landing configuration
  const landingConfig = {}; // For database storage (system_1, system_2)
  const systemLandingsForUI = {}; // For UI state (system1, system2)
  const inverterConnections = [];

  activeSystems.forEach(sysNum => {
    const landing = systemLandings[`system${sysNum}`];
    if (landing) {
      landingConfig[`system_${sysNum}`] = landing; // Database format with underscore
      systemLandingsForUI[`system${sysNum}`] = landing; // UI format without underscore

      // Determine connection type
      let connectionType = 'direct';

      if (landing.includes('Inverter: System')) {
        connectionType = 'inverter_landing';
        const match = landing.match(/System (\d+)/);
        if (match) {
          inverterConnections.push({
            source: sysNum,
            target: parseInt(match[1]),
            inverter: landing,
          });
          connections.push({
            from: `System ${sysNum}`,
            to: landing,
            type: connectionType,
            target: parseInt(match[1]),
          });
        }
      } else if (landing.includes('String Combiner Panel: System')) {
        connectionType = 'string_combiner_landing';
        const match = landing.match(/System (\d+)/);
        if (match) {
          connections.push({
            from: `System ${sysNum}`,
            to: landing,
            type: connectionType,
            target: parseInt(match[1]),
          });
        }
      } else if (landing.includes('SMS: System')) {
        connectionType = 'sms_landing';
        const match = landing.match(/System (\d+)/);
        if (match) {
          smsConnections.push({
            source: sysNum,
            target: parseInt(match[1]),
            sms: landing,
          });
          connections.push({
            from: `System ${sysNum}`,
            to: landing,
            type: connectionType,
          });
        }
      } else if (landing.includes('AC Input')) {
        connectionType = 'ac_couple';
        const match = landing.match(/System (\d+)/);
        if (match) {
          acCoupling.push({
            source: sysNum,
            target: parseInt(match[1]),
            inverter: landing,
          });
          connections.push({
            from: `System ${sysNum}`,
            to: landing,
            type: connectionType,
          });
        }
      } else {
        if (landing.includes('Combiner Panel')) {
          connectionType = 'combine';
        }
        connections.push({
          from: `System ${sysNum}`,
          to: landing,
          type: connectionType,
        });
      }
    }
  });

  // Build v2.0 compliant JSON structure (matches mobile app spec)
  return {
    version: "2.0",
    combine_systems: combineSystems,
    active_systems: activeSystems,
    system_landings: systemLandingsForUI, // { "system1": "...", "system2": "...", ... }
    connections,
    combiner_panels: combinerPanels,
    ac_coupling: acCoupling,
    sms_connections: smsConnections,
    sub_panel_b: {
      exists: hasSubPanelB || false,
      type: (hasSubPanelB && subPanelBData?.type) || null,
      bus_rating: (subPanelBData?.busAmps) || "",
      main_breaker_rating: (subPanelBData?.mainBreakerAmps) || "",
      feeder_location: (subPanelBData?.feederLocation) || "",
      derated: (subPanelBData?.derated) || null,
      upstream_breaker_rating: (subPanelBData?.upstreamBreakerAmps) || "",
    },
    completed_systems: activeSystems, // All configured systems
    current_step: 0, // 0 = complete
    timestamp: new Date().toISOString(),
  };
};

/**
 * Get formatted display text for collapsed view
 * Takes the landing value and systemData to build "Sys X - Make Model" format
 */
export const getCollapsedDisplayText = (landing, systemData) => {
  if (!landing) return '';

  // Parse the landing value to extract system number and type
  if (landing.includes('Inverter: System')) {
    const match = landing.match(/System (\d+)/);
    if (match) {
      const sysNum = parseInt(match[1]);
      const inverterInfo = hasStringInverter(sysNum, systemData);
      if (inverterInfo.hasInverter) {
        let displayText = 'Inverter';
        if (inverterInfo.make && inverterInfo.model) {
          displayText = `${inverterInfo.make} ${inverterInfo.model}`;
        } else if (inverterInfo.model) {
          displayText = inverterInfo.model;
        } else if (inverterInfo.make) {
          displayText = inverterInfo.make;
        }
        return `Sys ${sysNum} - ${displayText}`;
      }
    }
  } else if (landing.includes('String Combiner Panel: System')) {
    const match = landing.match(/System (\d+)/);
    if (match) {
      const sysNum = parseInt(match[1]);
      const combinerInfo = hasStringCombinerPanel(sysNum, systemData);
      if (combinerInfo.hasCombiner) {
        let displayText = 'String Combiner Panel';
        if (combinerInfo.make && combinerInfo.model) {
          displayText = `${combinerInfo.make} ${combinerInfo.model}`;
        } else if (combinerInfo.model) {
          displayText = combinerInfo.model;
        } else if (combinerInfo.make) {
          displayText = combinerInfo.make;
        }
        return `Sys ${sysNum} - ${displayText}`;
      }
    }
  } else if (landing.includes('SMS: System')) {
    const match = landing.match(/System (\d+)/);
    if (match) {
      const sysNum = parseInt(match[1]);
      const smsInfo = hasSMS(sysNum, systemData);
      if (smsInfo.hasSMS) {
        let displayText = 'Storage';
        if (smsInfo.make && smsInfo.model) {
          displayText = `${smsInfo.make} ${smsInfo.model}`;
        } else if (smsInfo.model) {
          displayText = smsInfo.model;
        } else if (smsInfo.make) {
          displayText = smsInfo.make;
        }
        return `Sys ${sysNum} - ${displayText}`;
      }
    }
  }

  // For other landing types, return as-is
  return landing;
};

/**
 * Check if all active systems have landing destinations configured
 */
export const isConfigurationComplete = (activeSystems, systemLandings) => {
  return activeSystems.every(sysNum => {
    const landing = systemLandings[`system${sysNum}`];
    return landing && landing.trim() !== '';
  });
};
