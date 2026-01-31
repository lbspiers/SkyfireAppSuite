// src/utils/electricalFieldMapping.ts

/**
 * Comprehensive mapping between frontend electrical form fields and database columns.
 * This ensures consistent data flow from UI → API → Database for AutoCAD drawing generation.
 */

export interface ElectricalFieldMapping {
  frontendField: string;
  databaseColumn: string;
  dataType: 'string' | 'number' | 'boolean' | 'date';
  required: boolean;
  section: string;
  description: string;
}

export const ELECTRICAL_FIELD_MAPPINGS: ElectricalFieldMapping[] = [
  // Service Entrance Section
  {
    frontendField: 'serviceEntranceType',
    databaseColumn: 'ele_ses_type',
    dataType: 'string',
    required: false,
    section: 'service_entrance',
    description: 'Type of service entrance (overhead, underground, etc.)'
  },
  {
    frontendField: 'mcbCount',
    databaseColumn: 'ele_main_circuit_breakers_qty',
    dataType: 'number',
    required: false,
    section: 'service_entrance',
    description: 'Number of main circuit breakers'
  },
  {
    frontendField: 'mpuSelection',
    databaseColumn: 'ele_main_panel_upgrade',
    dataType: 'string',
    required: false,
    section: 'service_entrance',
    description: 'Main panel upgrade selection (Yes/No/Help Me Decide)'
  },

  // Main Panel A Section
  {
    frontendField: 'mpaType',
    databaseColumn: 'mpa_bus_bar_existing',
    dataType: 'boolean',
    required: false,
    section: 'main_panel_a',
    description: 'Whether Main Panel A is existing (true) or new (false)'
  },
  {
    frontendField: 'mpaBus',
    databaseColumn: 'ele_bus_bar_rating',
    dataType: 'number',
    required: false,
    section: 'main_panel_a',
    description: 'Main Panel A bus bar rating in amps'
  },
  {
    frontendField: 'mpaMain',
    databaseColumn: 'ele_main_circuit_breaker_rating',
    dataType: 'number',
    required: false,
    section: 'main_panel_a',
    description: 'Main Panel A main circuit breaker rating in amps'
  },
  {
    frontendField: 'mpaFeeder',
    databaseColumn: 'ele_feeder_location_on_bus_bar',
    dataType: 'string',
    required: false,
    section: 'main_panel_a',
    description: 'Location of feeder on bus bar'
  },
  {
    frontendField: 'mpaDerated',
    databaseColumn: 'el_mpa_derated',
    dataType: 'boolean',
    required: false,
    section: 'main_panel_a',
    description: 'Whether Main Panel A is derated'
  },

  // Sub Panel B Section
  {
    frontendField: 'spbType',
    databaseColumn: 'spb_subpanel_existing',
    dataType: 'boolean',
    required: false,
    section: 'sub_panel_b',
    description: 'Whether Sub Panel B is existing (true) or new (false)'
  },
  {
    frontendField: 'spbBus',
    databaseColumn: 'spb_bus_bar_rating',
    dataType: 'number',
    required: false,
    section: 'sub_panel_b',
    description: 'Sub Panel B bus bar rating in amps'
  },
  {
    frontendField: 'spbMain',
    databaseColumn: 'spb_main_breaker_rating',
    dataType: 'number',
    required: false,
    section: 'sub_panel_b',
    description: 'Sub Panel B main breaker rating in amps'
  },
  {
    frontendField: 'spbFeeder',
    databaseColumn: 'spb_subpanel_b_feeder_location',
    dataType: 'string',
    required: false,
    section: 'sub_panel_b',
    description: 'Sub Panel B feeder location'
  },
  {
    frontendField: 'spbDerated',
    databaseColumn: 'el_spb_derated',
    dataType: 'boolean',
    required: false,
    section: 'sub_panel_b',
    description: 'Whether Sub Panel B is derated'
  },
  {
    frontendField: 'spbUpBreaker',
    databaseColumn: 'spb_upstream_breaker_rating',
    dataType: 'number',
    required: false,
    section: 'sub_panel_b',
    description: 'Sub Panel B upstream breaker rating in amps'
  },

  // Sub Panel C Section
  {
    frontendField: 'spcType',
    databaseColumn: 'el_spc_subpanel_existing',
    dataType: 'boolean',
    required: false,
    section: 'sub_panel_c',
    description: 'Whether Sub Panel C is existing (true) or new (false)'
  },
  {
    frontendField: 'spcBus',
    databaseColumn: 'el_spc_bus_bar_rating',
    dataType: 'number',
    required: false,
    section: 'sub_panel_c',
    description: 'Sub Panel C bus bar rating in amps'
  },
  {
    frontendField: 'spcMain',
    databaseColumn: 'el_spc_main_breaker_rating',
    dataType: 'number',
    required: false,
    section: 'sub_panel_c',
    description: 'Sub Panel C main breaker rating in amps'
  },
  {
    frontendField: 'spcFeeder',
    databaseColumn: 'el_spc_subpanel_c_feeder_location',
    dataType: 'string',
    required: false,
    section: 'sub_panel_c',
    description: 'Sub Panel C feeder location'
  },

  // Sub Panel D Section
  {
    frontendField: 'spdType',
    databaseColumn: 'el_spd_subpanel_existing',
    dataType: 'boolean',
    required: false,
    section: 'sub_panel_d',
    description: 'Whether Sub Panel D is existing (true) or new (false)'
  },
  {
    frontendField: 'spdBus',
    databaseColumn: 'el_spd_bus_bar_rating',
    dataType: 'number',
    required: false,
    section: 'sub_panel_d',
    description: 'Sub Panel D bus bar rating in amps'
  },
  {
    frontendField: 'spdMain',
    databaseColumn: 'el_spd_main_breaker_rating',
    dataType: 'number',
    required: false,
    section: 'sub_panel_d',
    description: 'Sub Panel D main breaker rating in amps'
  },
  {
    frontendField: 'spdFeeder',
    databaseColumn: 'el_spd_subpanel_d_feeder_location',
    dataType: 'string',
    required: false,
    section: 'sub_panel_d',
    description: 'Sub Panel D feeder location'
  },

  // Point of Interconnection Section
  {
    frontendField: 'poiType',
    databaseColumn: 'ele_method_of_interconnection',
    dataType: 'string',
    required: false,
    section: 'point_of_interconnection',
    description: 'Method of interconnection (Line side, Load side, etc.)'
  },
  {
    frontendField: 'poiBreaker',
    databaseColumn: 'el_poi_breaker_rating',
    dataType: 'number',
    required: false,
    section: 'point_of_interconnection',
    description: 'Point of interconnection breaker rating in amps'
  },
  {
    frontendField: 'poiDisconnect',
    databaseColumn: 'el_poi_disconnect_rating',
    dataType: 'number',
    required: false,
    section: 'point_of_interconnection',
    description: 'Point of interconnection disconnect rating in amps'
  },
  {
    frontendField: 'poiLocation',
    databaseColumn: 'ele_breaker_location',
    dataType: 'string',
    required: false,
    section: 'point_of_interconnection',
    description: 'POI breaker location on bus bar'
  },

  // MCA/Utility Section
  {
    frontendField: 'mcaBackfeed',
    databaseColumn: 'el_mca_system_back_feed',
    dataType: 'number',
    required: false,
    section: 'mca_utility',
    description: 'MCA system backfeed rating'
  },
  {
    frontendField: 'utilityServiceAmps',
    databaseColumn: 'utility_service_amps',
    dataType: 'number',
    required: false,
    section: 'mca_utility',
    description: 'Utility service amperage rating'
  },
  {
    frontendField: 'meterType',
    databaseColumn: 'meter_type',
    dataType: 'string',
    required: false,
    section: 'mca_utility',
    description: 'Type of electrical meter'
  },
  {
    frontendField: 'meterLocation',
    databaseColumn: 'meter_location',
    dataType: 'string',
    required: false,
    section: 'mca_utility',
    description: 'Location of electrical meter'
  }
];

/**
 * Get database column name for a frontend field
 */
export function getDatabaseColumn(frontendField: string): string | null {
  const mapping = ELECTRICAL_FIELD_MAPPINGS.find(m => m.frontendField === frontendField);
  return mapping?.databaseColumn || null;
}

/**
 * Get frontend field name for a database column
 */
export function getFrontendField(databaseColumn: string): string | null {
  const mapping = ELECTRICAL_FIELD_MAPPINGS.find(m => m.databaseColumn === databaseColumn);
  return mapping?.frontendField || null;
}

/**
 * Get all fields for a specific section
 */
export function getFieldsBySection(section: string): ElectricalFieldMapping[] {
  return ELECTRICAL_FIELD_MAPPINGS.filter(m => m.section === section);
}

/**
 * Get all required fields
 */
export function getRequiredFields(): ElectricalFieldMapping[] {
  return ELECTRICAL_FIELD_MAPPINGS.filter(m => m.required);
}

/**
 * Validate field data type
 */
export function validateFieldType(frontendField: string, value: any): boolean {
  const mapping = ELECTRICAL_FIELD_MAPPINGS.find(m => m.frontendField === frontendField);
  if (!mapping) return true; // Unknown fields pass validation
  
  switch (mapping.dataType) {
    case 'string':
      return typeof value === 'string' || value === null || value === undefined;
    case 'number':
      return typeof value === 'number' || value === null || value === undefined || 
             (typeof value === 'string' && !isNaN(Number(value)));
    case 'boolean':
      return typeof value === 'boolean' || value === null || value === undefined;
    case 'date':
      return value instanceof Date || typeof value === 'string' || value === null || value === undefined;
    default:
      return true;
  }
}

/**
 * Convert frontend payload to database payload
 */
export function mapFrontendToDatabase(frontendPayload: Record<string, any>): Record<string, any> {
  const databasePayload: Record<string, any> = {};
  
  Object.entries(frontendPayload).forEach(([frontendField, value]) => {
    const databaseColumn = getDatabaseColumn(frontendField);
    if (databaseColumn) {
      databasePayload[databaseColumn] = value;
    } else {
      // Keep unmapped fields as-is (might be direct database field names)
      databasePayload[frontendField] = value;
    }
  });
  
  return databasePayload;
}

/**
 * Convert database payload to frontend payload
 */
export function mapDatabaseToFrontend(databasePayload: Record<string, any>): Record<string, any> {
  const frontendPayload: Record<string, any> = {};
  
  Object.entries(databasePayload).forEach(([databaseColumn, value]) => {
    const frontendField = getFrontendField(databaseColumn);
    if (frontendField) {
      frontendPayload[frontendField] = value;
    } else {
      // Keep unmapped fields as-is
      frontendPayload[databaseColumn] = value;
    }
  });
  
  return frontendPayload;
}