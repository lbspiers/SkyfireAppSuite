// USAGE_EXAMPLE.ts
// Complete example of how to use the Universal Configuration Switchboard
// This demonstrates the full flow from equipment extraction to BOS auto-population

import {
  universalSwitchboard,
  extractEquipmentForSystem,
  extractEquipmentForAllSystems,
  BOSAutoPopulationService,
  ConfigurationMatch,
  EquipmentState,
} from './index';

// ============================================================================
// EXAMPLE 1: Single System Analysis
// ============================================================================

export async function analyzeSingleSystem(
  systemDetails: Record<string, any>,
  systemNumber: 1 | 2 | 3 | 4,
  utilityRequirements: any,
  projectUuid: string
): Promise<void> {
  console.log('=== EXAMPLE 1: Single System Analysis ===');

  // Step 1: Extract equipment state from database
  const equipment = extractEquipmentForSystem(
    systemDetails,
    systemNumber,
    utilityRequirements
  );

  if (!equipment) {
    console.log(`System ${systemNumber} has no equipment data`);
    return;
  }

  console.log('Equipment State:', equipment);

  // Step 2: Find matching configurations
  const bestMatch = await universalSwitchboard.getBestMatch(equipment);

  if (!bestMatch) {
    console.log('No configuration match found');
    return;
  }

  console.log('Best Match:', {
    configId: bestMatch.configId,
    configName: bestMatch.configName,
    confidence: bestMatch.confidence,
    bosItemsCount: bestMatch.bosEquipment.length,
  });

  // Step 3: Auto-populate BOS equipment
  const result = await BOSAutoPopulationService.autoPopulate({
    projectUuid,
    systemPrefix: equipment.systemPrefix,
    systemNumber: equipment.systemNumber,
    configurationMatch: bestMatch,
    autoSelectWhenPossible: true,
    skipExisting: true,
  });

  console.log('Auto-Population Result:', {
    success: result.success,
    message: result.message,
    addedCount: result.addedEquipment.length,
    skippedCount: result.skippedEquipment.length,
    requiresSelectionCount: result.requiresUserSelection.length,
  });

  // Step 4: Handle items that need user selection
  if (result.requiresUserSelection.length > 0) {
    console.log('User selection required for:', result.requiresUserSelection);
    // Show modal to user for selection
  }
}

// ============================================================================
// EXAMPLE 2: All Systems Analysis
// ============================================================================

export async function analyzeAllSystems(
  systemDetails: Record<string, any>,
  utilityRequirements: any
): Promise<void> {
  console.log('=== EXAMPLE 2: All Systems Analysis ===');

  // Step 1: Extract equipment for all 4 systems
  const allSystems = extractEquipmentForAllSystems(
    systemDetails,
    utilityRequirements
  );

  console.log('Systems with data:', {
    system1: !!allSystems.system1,
    system2: !!allSystems.system2,
    system3: !!allSystems.system3,
    system4: !!allSystems.system4,
  });

  // Step 2: Analyze all systems at once
  const results = await universalSwitchboard.analyzeAllSystems(allSystems);

  console.log('Analysis Results:', {
    totalSystemsAnalyzed: results.totalSystemsAnalyzed,
    totalMatchesFound: results.totalMatchesFound,
    recommendations: results.recommendations,
    warnings: results.warnings,
  });

  // Step 3: Show results per system
  Object.entries(results.bestMatches).forEach(([systemKey, match]) => {
    if (match) {
      console.log(`${systemKey} Best Match:`, {
        configId: match.configId,
        configName: match.configName,
        confidence: match.confidence,
      });
    }
  });
}

// ============================================================================
// EXAMPLE 3: Get Top Matches (Show User Options)
// ============================================================================

export async function getConfigurationOptions(
  equipment: EquipmentState
): Promise<ConfigurationMatch[]> {
  console.log('=== EXAMPLE 3: Get Configuration Options ===');

  // Get top 3 matching configurations
  const topMatches = await universalSwitchboard.getTopMatches(equipment, 3);

  console.log(`Found ${topMatches.length} matching configurations:`);
  topMatches.forEach((match, index) => {
    console.log(`${index + 1}. ${match.configName} (${match.confidence})`);
  });

  return topMatches;
}

// ============================================================================
// EXAMPLE 4: Franklin + APS Detection
// ============================================================================

export async function detectFranklinAPSConfiguration(
  systemDetails: Record<string, any>,
  utilityRequirements: any
): Promise<ConfigurationMatch | null> {
  console.log('=== EXAMPLE 4: Franklin + APS Detection ===');

  // Extract equipment for system 1
  const equipment = extractEquipmentForSystem(systemDetails, 1, utilityRequirements);

  if (!equipment) {
    console.log('No equipment data');
    return null;
  }

  // Check if it's Franklin + APS
  const isFranklin =
    equipment.utilityName === 'APS' &&
    equipment.hasSolarPanels &&
    equipment.smsMake?.toLowerCase().includes('franklin') &&
    equipment.smsModel?.toLowerCase().includes('agate') &&
    equipment.batteryMake?.toLowerCase().includes('franklin') &&
    equipment.batteryModel?.toLowerCase().includes('apower');

  console.log('Is Franklin + APS?', isFranklin);

  if (isFranklin) {
    // Should match one of the Franklin-specific configs (priority 1-3)
    const match = await universalSwitchboard.getBestMatch(equipment);

    if (match && match.configId.startsWith('FRANKLIN_APS')) {
      console.log('Matched Franklin-specific configuration:', match.configName);
      return match;
    }
  }

  return null;
}

// ============================================================================
// EXAMPLE 5: Equipment Screen Integration
// ============================================================================

export async function handleAddUtilityRequiredEquipmentButton(
  projectUuid: string,
  systemDetails: Record<string, any>,
  utilityRequirements: any,
  activeSystemNumber: 1 | 2 | 3 | 4
): Promise<{
  success: boolean;
  message: string;
  configMatch?: ConfigurationMatch;
  needsUserInput?: boolean;
}> {
  console.log('=== EXAMPLE 5: Equipment Screen Button Handler ===');

  try {
    // Step 1: Extract equipment state
    const equipment = extractEquipmentForSystem(
      systemDetails,
      activeSystemNumber,
      utilityRequirements
    );

    if (!equipment) {
      return {
        success: false,
        message: 'No equipment data found. Please add major equipment first.',
      };
    }

    // Step 2: Validate that major equipment exists
    const validation = BOSAutoPopulationService.validateRequiredEquipment(
      { ...equipment } as any,
      systemDetails
    );

    if (!validation.valid) {
      return {
        success: false,
        message: `Missing required equipment: ${validation.missingEquipment.join(', ')}`,
      };
    }

    // Step 3: Find matching configurations
    const matches = await universalSwitchboard.findMatchingConfigurations(equipment);

    if (matches.length === 0) {
      return {
        success: false,
        message: 'No matching configuration found for your equipment setup.',
      };
    }

    // Step 4: Use best match
    const bestMatch = matches[0];

    console.log('Best Match:', bestMatch.configName);

    // Step 5: Auto-populate BOS
    const result = await BOSAutoPopulationService.autoPopulate({
      projectUuid,
      systemPrefix: equipment.systemPrefix,
      systemNumber: equipment.systemNumber,
      configurationMatch: bestMatch,
      autoSelectWhenPossible: true,
      skipExisting: true,
    });

    if (result.requiresUserSelection.length > 0) {
      // Need to show modal for user to select equipment
      return {
        success: true,
        message: 'Some equipment requires your selection',
        configMatch: bestMatch,
        needsUserInput: true,
      };
    }

    return {
      success: result.success,
      message: result.message,
      configMatch: bestMatch,
    };
  } catch (error: any) {
    console.error('Error in button handler:', error);
    return {
      success: false,
      message: `Error: ${error.message}`,
    };
  }
}

// ============================================================================
// EXAMPLE 6: Multi-System Batch Processing
// ============================================================================

export async function autoPopulateAllActiveSystems(
  projectUuid: string,
  systemDetails: Record<string, any>,
  utilityRequirements: any
): Promise<{
  results: Array<{
    systemNumber: number;
    success: boolean;
    message: string;
    configName?: string;
  }>;
}> {
  console.log('=== EXAMPLE 6: Batch Process All Systems ===');

  // Extract all systems
  const allSystems = extractEquipmentForAllSystems(
    systemDetails,
    utilityRequirements
  );

  const results = [];

  // Process each active system
  for (const [key, equipment] of Object.entries(allSystems)) {
    if (!equipment) continue;

    console.log(`Processing ${equipment.systemPrefix}...`);

    try {
      // Find best match
      const match = await universalSwitchboard.getBestMatch(equipment);

      if (!match) {
        results.push({
          systemNumber: equipment.systemNumber,
          success: false,
          message: 'No configuration match found',
        });
        continue;
      }

      // Auto-populate
      const result = await BOSAutoPopulationService.autoPopulate({
        projectUuid,
        systemPrefix: equipment.systemPrefix,
        systemNumber: equipment.systemNumber,
        configurationMatch: match,
        autoSelectWhenPossible: true,
        skipExisting: true,
      });

      results.push({
        systemNumber: equipment.systemNumber,
        success: result.success,
        message: result.message,
        configName: match.configName,
      });
    } catch (error: any) {
      results.push({
        systemNumber: equipment.systemNumber,
        success: false,
        message: `Error: ${error.message}`,
      });
    }
  }

  return { results };
}

// ============================================================================
// EXAMPLE 7: Debug Mode - Show All Detectors
// ============================================================================

export async function debugShowAllDetectors(): Promise<void> {
  console.log('=== EXAMPLE 7: Debug - All Detectors ===');

  const detectors = await universalSwitchboard.getDetectors();

  console.log(`Total detectors: ${detectors.length}`);

  detectors.forEach((detector, index) => {
    console.log(`${index + 1}. [Priority ${detector.priority}] ${detector.name}`);
    console.log(`   ConfigID: ${detector.configId}`);
    console.log(`   Utilities: ${detector.utilities.join(', ')}`);
  });
}

// ============================================================================
// MOCK DATA FOR TESTING
// ============================================================================

export const mockSystemDetails = {
  // System 1: Franklin + APS + Whole Home
  sys1_solar_panel_make: 'Canadian Solar',
  sys1_solar_panel_model: 'CS6K-300MS',
  sys1_solar_panel_qty: '20',
  sys1_micro_inverter_make: 'SolarEdge',
  sys1_micro_inverter_model: 'SE7600H-US',
  sys1_battery1_make: 'Franklin',
  sys1_battery1_model: 'aPower 13.6kWh',
  sys1_battery1_qty: '1',
  sys1_battery1_max_continuous_output: '100',
  sys1_sms_make: 'Franklin',
  sys1_sms_model: 'Agate Gateway',
  sys1_gateway_make: 'Franklin',
  sys1_gateway_model: 'Agate',
  sys1_backup_option: 'Whole Home',
  sys1_selectedsystem: 'inverter',

  // System 2: APS B-3 Configuration
  sys2_solar_panel_make: 'REC',
  sys2_solar_panel_model: 'REC400AA',
  sys2_solar_panel_qty: '15',
  sys2_micro_inverter_make: 'Enphase',
  sys2_micro_inverter_model: 'IQ8PLUS',
  sys2_battery1_make: 'Enphase',
  sys2_battery1_model: 'IQ Battery 10T',
  sys2_battery1_qty: '1',
  sys2_backup_option: 'Partial Home',
  sys2_selectedsystem: 'microinverter',
};

export const mockUtilityRequirements = {
  utility_name: 'APS',
  state: 'AZ',
  combination: 'ESS',
  bos_type_1: 'Disconnect Switch',
  bos_type_2: 'Bi-Directional Meter',
  bos_type_3: 'Automatic Transfer Switch',
};

// ============================================================================
// RUN EXAMPLES (For testing)
// ============================================================================

export async function runAllExamples() {
  console.log('\n========================================');
  console.log('Universal Configuration Switchboard Examples');
  console.log('========================================\n');

  const projectUuid = 'test-project-123';

  // Example 1
  await analyzeSingleSystem(
    mockSystemDetails,
    1,
    mockUtilityRequirements,
    projectUuid
  );

  console.log('\n');

  // Example 2
  await analyzeAllSystems(mockSystemDetails, mockUtilityRequirements);

  console.log('\n');

  // Example 4
  await detectFranklinAPSConfiguration(
    mockSystemDetails,
    mockUtilityRequirements
  );

  console.log('\n');

  // Example 7
  await debugShowAllDetectors();

  console.log('\n========================================\n');
}

// Uncomment to run examples:
// runAllExamples();
