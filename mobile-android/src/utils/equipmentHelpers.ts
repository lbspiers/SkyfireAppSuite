/**
 * Helper functions for Equipment Configuration
 */

export interface LandingOption {
  value: string;
  label: string;
  description?: string;
  highlight?: boolean;
  type: "panel" | "ac_couple" | "sms" | "combiner";
}

export interface Connection {
  from: string;
  to: string;
  type: "ac_couple" | "sms_connection" | "combine" | "direct";
}

export interface ConfigurationData {
  combine_systems: boolean | null;
  active_systems: number[];
  landing_configuration: {
    system_1?: string;
    system_2?: string;
    system_3?: string;
    system_4?: string;
  };
  connections: Connection[];
  combiner_panels: Array<{
    id: string;
    connects_to: string;
    systems_connected: string[];
  }>;
  ac_coupling: Array<{
    source: number;
    target: number;
    inverter: string;
  }>;
  sms_connections: Array<{
    source: number;
    target: number;
    sms: string;
  }>;
  subpanel_b: {
    bus_rating: string;
    main_breaker_rating: string;
    upstream_breaker_rating: string;
  } | null;
}

/**
 * Check if a system has AC coupling capability (PowerWall 3/+, SolarEdge Backup Interface, or Sol-Ark)
 */
export const hasACCouplingCapability = (
  systemNum: number,
  systemData: any
): { hasCapability: boolean; type?: string; model?: string } => {
  const prefix = `sys${systemNum}_`;

  // Check inverter for PowerWall 3/+
  const inverterModel = systemData?.[`${prefix}micro_inverter_model`];
  if (inverterModel) {
    const inverterStr = String(inverterModel).toLowerCase();
    if (
      inverterStr.includes("powerwall 3") ||
      inverterStr.includes("powerwall+")
    ) {
      return {
        hasCapability: true,
        type: "PowerWall",
        model: inverterModel,
      };
    }
  }

  // Check inverter make for Sol-Ark
  const inverterMake = systemData?.[`${prefix}micro_inverter_make`];
  if (inverterMake) {
    const makeStr = String(inverterMake).toLowerCase();
    if (makeStr.includes("sol-ark") || makeStr.includes("solark")) {
      return {
        hasCapability: true,
        type: "Sol-Ark",
        model: inverterModel || "Sol-Ark Inverter",
      };
    }
  }

  // Check SMS for SolarEdge Backup Interface
  const smsModel = systemData?.[`${prefix}sms_model`];
  if (smsModel) {
    const smsStr = String(smsModel).toLowerCase();
    if (smsStr.includes("backup interface")) {
      return {
        hasCapability: true,
        type: "SolarEdge Backup Interface",
        model: smsModel,
      };
    }
  }

  return { hasCapability: false };
};

/**
 * Check if a system has Storage Management System
 */
export const hasSMS = (
  systemNum: number,
  systemData: any
): { hasSMS: boolean; make?: string; model?: string } => {
  const prefix = `sys${systemNum}_`;
  const smsMake = systemData?.[`${prefix}sms_make`];
  const smsModel = systemData?.[`${prefix}sms_model`];

  if (smsMake || smsModel) {
    return {
      hasSMS: true,
      make: smsMake,
      model: smsModel,
    };
  }

  return { hasSMS: false };
};

/**
 * Generate dynamic landing options for a specific system
 */
export const getLandingOptions = (
  currentSystemNum: number,
  activeSystems: number[],
  systemData: any,
  systemLandings: Record<string, string>,
  hasSubPanelB: boolean
): LandingOption[] => {
  const options: LandingOption[] = [];

  // Standard Options
  options.push({
    value: "Main Panel",
    label: "Main Panel",
    description: "Connect to the main electrical panel",
    type: "panel",
  });

  if (hasSubPanelB) {
    options.push({
      value: "Sub Panel B",
      label: "Sub Panel B",
      description: "Connect to Sub Panel B",
      type: "panel",
    });
  } else {
    options.push({
      value: "Sub Panel B (Add)",
      label: "Sub Panel B",
      description: "Add and connect to Sub Panel B",
      type: "panel",
    });
  }

  // Combiner Panel Logic
  const previousSystems = activeSystems.filter((s) => s < currentSystemNum);
  const combinerUsedBySystem = previousSystems.find((s) => {
    const landing = systemLandings[`system${s}`];
    return landing?.includes("Combiner Panel");
  });

  if (combinerUsedBySystem) {
    options.push({
      value: `Combiner Panel (Same as System ${combinerUsedBySystem})`,
      label: `Combiner Panel (Shared)`,
      description: `Use same combiner as System ${combinerUsedBySystem}`,
      type: "combiner",
    });
  } else {
    options.push({
      value: "Combiner Panel (New)",
      label: "Combiner Panel (New)",
      description: "Create a new combiner panel",
      type: "combiner",
    });
  }

  // Dynamic AC Input Options
  const otherSystems = activeSystems.filter((s) => s !== currentSystemNum);
  otherSystems.forEach((sysNum) => {
    const acCapability = hasACCouplingCapability(sysNum, systemData);
    if (acCapability.hasCapability) {
      options.push({
        value: `AC Input: System ${sysNum} (${acCapability.type})`,
        label: `System ${sysNum} (${acCapability.type})`,
        description: `AC input to System ${sysNum}'s inverter`,
        highlight: true,
        type: "ac_couple",
      });
    }
  });

  // Dynamic SMS Connection Options
  otherSystems.forEach((sysNum) => {
    const smsInfo = hasSMS(sysNum, systemData);
    if (smsInfo.hasSMS) {
      options.push({
        value: `SMS: System ${sysNum} (${smsInfo.model || "Storage"})`,
        label: `System ${sysNum} SMS`,
        description: `Connect to System ${sysNum}'s storage`,
        highlight: true,
        type: "sms",
      });
    }
  });

  return options;
};

/**
 * Generate complete configuration data for export
 */
export const generateConfigurationData = (
  combineSystems: boolean | null,
  systemLandings: Record<string, string>,
  activeSystems: number[],
  systemData: any,
  hasSubPanelB: boolean,
  subPanelBData: {
    type?: "new" | "existing" | null;
    busAmps?: string;
    mainBreakerAmps?: string;
    feederLocation?: string;
    derated?: boolean | null;
    upstreamBreakerAmps?: string;
  } | null
): ConfigurationData => {
  const connections: Connection[] = [];
  const combinerPanels: Array<{
    id: string;
    connects_to: string;
    systems_connected: string[];
  }> = [];
  const acCoupling: Array<{
    source: number;
    target: number;
    inverter: string;
  }> = [];
  const smsConnections: Array<{
    source: number;
    target: number;
    sms: string;
  }> = [];

  // Build landing configuration
  const landingConfig: Record<string, string> = {};
  activeSystems.forEach((sysNum) => {
    const landing = systemLandings[`system${sysNum}`];
    if (landing) {
      landingConfig[`system_${sysNum}`] = landing;

      // Determine connection type
      let connectionType: Connection["type"] = "direct";

      if (landing.includes("AC Input")) {
        connectionType = "ac_couple";
        // Extract target system number
        const match = landing.match(/System (\d+)/);
        if (match) {
          const targetSystem = parseInt(match[1]);
          acCoupling.push({
            source: sysNum,
            target: targetSystem,
            inverter: landing,
          });
        }
      } else if (landing.includes("SMS")) {
        connectionType = "sms_connection";
        // Extract target system number
        const match = landing.match(/System (\d+)/);
        if (match) {
          const targetSystem = parseInt(match[1]);
          smsConnections.push({
            source: sysNum,
            target: targetSystem,
            sms: landing,
          });
        }
      } else if (landing.includes("Combiner Panel")) {
        connectionType = "combine";
      }

      connections.push({
        from: `System ${sysNum}`,
        to: landing,
        type: connectionType,
      });
    }
  });

  // Track combiner panels
  const combinerMap: Record<string, string[]> = {};
  connections
    .filter((c) => c.type === "combine")
    .forEach((c) => {
      const destination = c.to.includes("Same as")
        ? c.to.match(/System (\d+)/)?.[0] || c.to
        : "Main Panel";
      if (!combinerMap[destination]) {
        combinerMap[destination] = [];
      }
      combinerMap[destination].push(c.from);
    });

  Object.entries(combinerMap).forEach(([destination, systems]) => {
    combinerPanels.push({
      id: `combiner_${systems.join("_")}`,
      connects_to: destination,
      systems_connected: systems,
    });
  });

  return {
    combine_systems: combineSystems,
    active_systems: activeSystems,
    landing_configuration: landingConfig,
    connections,
    combiner_panels: combinerPanels,
    ac_coupling: acCoupling,
    sms_connections: smsConnections,
    subpanel_b: hasSubPanelB && subPanelBData ? {
      bus_rating: subPanelBData.busAmps || "",
      main_breaker_rating: subPanelBData.mainBreakerAmps || "",
      upstream_breaker_rating: subPanelBData.upstreamBreakerAmps || "",
    } : null,
  };
};

/**
 * Check if all active systems have landing destinations configured
 */
export const isConfigurationComplete = (
  activeSystems: number[],
  systemLandings: Record<string, string>
): boolean => {
  return activeSystems.every((sysNum) => {
    const landing = systemLandings[`system${sysNum}`];
    return landing && landing.trim() !== "";
  });
};
