// UniversalConfigurationSwitchboard.ts
// Master orchestrator for all configuration detection logic
// Handles all 4 systems (sys1, sys2, sys3, sys4) and all utilities

import {
  EquipmentState,
  ConfigurationMatch,
  ConfigurationDetector,
  MultiSystemConfigurationResult,
  SystemPrefix,
} from './types/ConfigurationTypes';

export class UniversalConfigurationSwitchboard {
  private detectors: ConfigurationDetector[] = [];
  private initialized: boolean = false;

  constructor() {
    // Detectors are registered via registerDetectors() method
    // This allows lazy loading of configuration files
  }

  /**
   * Initialize the switchboard with all detectors
   * This is called once when first needed
   */
  private async initialize() {
    if (this.initialized) return;

    console.log('[Universal Switchboard] Initializing configuration detectors...');

    try {
      // Import all configuration files
      // Using dynamic imports to avoid circular dependencies and improve performance
      const [
        franklinAPSModule,
        franklinSRPModule,
        enphaseAPSModule,
        apsPVOnlyModule,
        storzAPSModule,
        teslaPW3APSModule,
        apsDCCoupledModule,
        apsACCoupledModule,
        apsGenericModule,
        // sceModule,
        // Add more as needed
      ] = await Promise.all([
        import('./configurations/FranklinAPSConfigs'),
        import('./configurations/FranklinSRPConfigs'),
        import('./configurations/EnphaseAPSConfigs'),
        import('./configurations/APSPVOnlyConfigs'),
        import('./configurations/StorzAPSConfigs'),
        import('./configurations/TeslaPowerwall3APSConfigs'),
        import('./configurations/APSDCCoupledConfigs'),
        import('./configurations/APSACCoupledConfigs'),
        import('./configurations/APSGenericConfigs'),
        // import('./configurations/SCEConfigs'),
      ]);

      // Register all detectors in priority order (specific → generic)
      this.registerDetectors([
        // Priority 1-9: Hyper-specific configurations (exact equipment combos)
        ...franklinAPSModule.franklinAPSDetectors, // Priority 1-3: Franklin + APS configurations
        ...franklinSRPModule.franklinSRPDetectors, // Priority 1-3: Franklin + SRP configurations
        ...enphaseAPSModule.enphaseAPSDetectors, // Priority 1-3: Enphase + APS configurations
        ...storzAPSModule.storzAPSDetectors, // Priority 2: Multi-system Storz configuration
        ...apsPVOnlyModule.apsPVOnlyDetectors, // Priority 3: Standard APS PV-Only (string inverter & microinverter, no battery) - MUST run before AC/DC coupled
        ...teslaPW3APSModule.teslaPW3APSDetectors, // Priority 3-5: Multi-system & single-system Tesla PW3 configurations
        ...apsDCCoupledModule.apsDCCoupledDetectors, // Priority 4-5: Generic DC-coupled configurations (equipment-agnostic)
        ...apsACCoupledModule.apsACCoupledDetectors, // Priority 4-5: Generic AC-coupled configurations (equipment-agnostic)

        // Priority 10-49: Utility-specific configurations
        ...apsGenericModule.apsGenericDetectors, // Priority 10-19: Generic APS configurations (A-1, A-2, B-1 through B-5, C-1, C-2, D)

        // Priority 50+: Universal fallbacks
        // Add universal detectors here
      ]);

      // Sort by priority (lower number = higher priority)
      this.detectors.sort((a, b) => a.priority - b.priority);

      this.initialized = true;
      console.log(`[Universal Switchboard] ✅ Initialized with ${this.detectors.length} detectors`);
    } catch (error) {
      console.error('[Universal Switchboard] ❌ Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Register configuration detectors
   */
  private registerDetectors(detectors: ConfigurationDetector[]) {
    this.detectors.push(...detectors);
    console.log(`[Universal Switchboard] Registered ${detectors.length} detectors`);
  }

  /**
   * Find ALL matching configurations for a single system
   * Returns sorted by priority and confidence
   */
  public async findMatchingConfigurations(
    equipment: EquipmentState
  ): Promise<ConfigurationMatch[]> {
    await this.initialize();

    const matches: ConfigurationMatch[] = [];

    console.log(`[Universal Switchboard] Analyzing ${equipment.systemPrefix} for configuration matches...`);
    console.log(`[Universal Switchboard] Utility: ${equipment.utilityName}`);
    console.log(`[Universal Switchboard] Solar: ${equipment.hasSolarPanels}, Battery: ${equipment.batteryQuantity}, SMS: ${equipment.hasSMS}`);

    // Run through all detectors
    for (const detector of this.detectors) {
      try {
        // Check if this detector applies to this utility
        if (!this.detectorAppliesToUtility(detector, equipment.utilityName)) {
          continue;
        }

        // Quick check (if provided) for performance optimization
        if (detector.quickCheck && !detector.quickCheck(equipment)) {
          continue;
        }

        // Run full detection (support both sync and async detectors)
        const match = await Promise.resolve(detector.detect(equipment));

        if (match) {
          console.log(
            `[Universal Switchboard] ✅ Match found: ${match.configName} (${detector.name}) - Priority: ${match.priority}, Confidence: ${match.confidence}`
          );
          matches.push(match);
        }
      } catch (error) {
        console.error(
          `[Universal Switchboard] ❌ Error in detector "${detector.name}":`,
          error
        );
      }
    }

    console.log(`[Universal Switchboard] Found ${matches.length} matching configuration(s) for ${equipment.systemPrefix}`);

    // Sort by priority first, then confidence
    return this.sortMatches(matches);
  }

  /**
   * Get the BEST matching configuration for a single system (highest priority + confidence)
   */
  public async getBestMatch(
    equipment: EquipmentState
  ): Promise<ConfigurationMatch | null> {
    const matches = await this.findMatchingConfigurations(equipment);
    return matches.length > 0 ? matches[0] : null;
  }

  /**
   * Get top N matching configurations for a single system
   */
  public async getTopMatches(
    equipment: EquipmentState,
    count: number = 2
  ): Promise<ConfigurationMatch[]> {
    const matches = await this.findMatchingConfigurations(equipment);
    return matches.slice(0, count);
  }

  /**
   * Analyze ALL 4 systems at once
   * Returns configuration matches for each active system
   *
   * Detection Strategy:
   * 1. Check System 2 first for multi-system configurations
   * 2. If multi-system config found, apply to both systems and skip System 1 detection
   * 3. Otherwise, detect each system independently
   */
  public async analyzeAllSystems(
    systemsData: {
      system1?: EquipmentState;
      system2?: EquipmentState;
      system3?: EquipmentState;
      system4?: EquipmentState;
    }
  ): Promise<MultiSystemConfigurationResult> {
    await this.initialize();

    console.log('[Universal Switchboard] Analyzing all systems...');
    console.log('[Universal Switchboard] Strategy: Check System 2 first for multi-system configs');

    const result: MultiSystemConfigurationResult = {
      systems: {},
      bestMatches: {},
      totalSystemsAnalyzed: 0,
      totalMatchesFound: 0,
      recommendations: [],
      warnings: [],
    };

    // Track which systems have been handled by multi-system configs
    const handledSystems = new Set<string>();

    // STEP 1: Check System 2 first for multi-system configurations
    if (systemsData.system2) {
      console.log('[Universal Switchboard] 🔍 Step 1: Analyzing System 2 for multi-system configs...');
      result.totalSystemsAnalyzed++;

      try {
        const sys2Matches = await this.findMatchingConfigurations(systemsData.system2);

        // Check if ANY match is a multi-system configuration
        const multiSystemMatch = sys2Matches.find(m => {
          const detector = this.detectors.find(d => d.configId === m.configId);
          return detector?.isMultiSystem === true;
        });

        if (multiSystemMatch) {
          console.log(`[Universal Switchboard] ✅ Multi-system config found: ${multiSystemMatch.configName}`);

          // Get the detector to find affected systems
          const detector = this.detectors.find(d => d.configId === multiSystemMatch.configId);
          const affectedSystems = detector?.affectedSystems || [];

          console.log(`[Universal Switchboard] 📦 This config affects systems: ${affectedSystems.join(', ')}`);

          // Apply this configuration to System 2
          result.systems['system2'] = [multiSystemMatch];
          result.bestMatches['system2'] = multiSystemMatch;
          result.totalMatchesFound++;
          handledSystems.add('system2');

          // Apply this configuration to System 1 if it's affected
          if (affectedSystems.includes('sys1_') && systemsData.system1) {
            console.log('[Universal Switchboard] 📋 Applying multi-system config to System 1');

            // Create a match for System 1 with updated context
            const sys1Match: ConfigurationMatch = {
              ...multiSystemMatch,
              systemPrefix: 'sys1_',
              systemNumber: 1,
              notes: [
                ...multiSystemMatch.notes,
                '⚠️ Part of multi-system configuration (detected from System 2)',
              ],
            };

            result.systems['system1'] = [sys1Match];
            result.bestMatches['system1'] = sys1Match;
            result.totalMatchesFound++;
            handledSystems.add('system1');
            result.totalSystemsAnalyzed++;
          }

          // Apply to System 3 if affected
          if (affectedSystems.includes('sys3_') && systemsData.system3) {
            console.log('[Universal Switchboard] 📋 Applying multi-system config to System 3');
            const sys3Match: ConfigurationMatch = {
              ...multiSystemMatch,
              systemPrefix: 'sys3_',
              systemNumber: 3,
              notes: [
                ...multiSystemMatch.notes,
                '⚠️ Part of multi-system configuration (detected from System 2)',
              ],
            };
            result.systems['system3'] = [sys3Match];
            result.bestMatches['system3'] = sys3Match;
            result.totalMatchesFound++;
            handledSystems.add('system3');
            result.totalSystemsAnalyzed++;
          }

          // Apply to System 4 if affected
          if (affectedSystems.includes('sys4_') && systemsData.system4) {
            console.log('[Universal Switchboard] 📋 Applying multi-system config to System 4');
            const sys4Match: ConfigurationMatch = {
              ...multiSystemMatch,
              systemPrefix: 'sys4_',
              systemNumber: 4,
              notes: [
                ...multiSystemMatch.notes,
                '⚠️ Part of multi-system configuration (detected from System 2)',
              ],
            };
            result.systems['system4'] = [sys4Match];
            result.bestMatches['system4'] = sys4Match;
            result.totalMatchesFound++;
            handledSystems.add('system4');
            result.totalSystemsAnalyzed++;
          }

          result.recommendations.push(
            `🔗 Multi-system configuration detected: ${multiSystemMatch.configName}`
          );
          result.recommendations.push(
            `Systems ${affectedSystems.map(s => s.replace('sys', '').replace('_', '')).join(' & ')} are configured together`
          );
        } else {
          // No multi-system config - store System 2 matches normally
          console.log('[Universal Switchboard] No multi-system config found, using standard System 2 matches');
          result.systems['system2'] = sys2Matches;
          result.totalMatchesFound += sys2Matches.length;

          if (sys2Matches.length > 0) {
            result.bestMatches['system2'] = sys2Matches[0];
          } else {
            result.warnings.push('No configuration match found for System 2');
          }
        }
      } catch (error) {
        console.error('[Universal Switchboard] Error analyzing System 2:', error);
        result.warnings.push(`Error analyzing System 2: ${error}`);
      }
    }

    // STEP 2: Analyze remaining systems (skip ones handled by multi-system configs)
    console.log('[Universal Switchboard] 🔍 Step 2: Analyzing remaining systems independently...');

    for (const [key, equipment] of Object.entries(systemsData)) {
      if (!equipment) continue;
      if (handledSystems.has(key)) {
        console.log(`[Universal Switchboard] ⏭️  Skipping ${key} (already handled by multi-system config)`);
        continue;
      }

      const systemKey = key as keyof typeof result.systems;
      result.totalSystemsAnalyzed++;

      try {
        const matches = await this.findMatchingConfigurations(equipment);
        result.systems[systemKey] = matches;
        result.totalMatchesFound += matches.length;

        if (matches.length > 0) {
          result.bestMatches[systemKey] = matches[0];
        } else {
          result.warnings.push(
            `No configuration match found for System ${equipment.systemNumber}`
          );
        }
      } catch (error) {
        console.error(
          `[Universal Switchboard] Error analyzing ${equipment.systemPrefix}:`,
          error
        );
        result.warnings.push(
          `Error analyzing System ${equipment.systemNumber}: ${error}`
        );
      }
    }

    // Generate recommendations
    if (result.totalMatchesFound === 0) {
      result.recommendations.push(
        'No configurations matched your equipment. Consider adding major equipment (solar, battery, inverter) first.'
      );
    } else if (result.totalSystemsAnalyzed > 1) {
      result.recommendations.push(
        `Analyzed ${result.totalSystemsAnalyzed} systems and found ${result.totalMatchesFound} configuration matches.`
      );
    }

    console.log(
      `[Universal Switchboard] ✅ Analysis complete: ${result.totalSystemsAnalyzed} systems, ${result.totalMatchesFound} matches`
    );

    return result;
  }

  /**
   * Get all registered detectors (for debugging)
   */
  public async getDetectors(): Promise<ConfigurationDetector[]> {
    await this.initialize();
    return [...this.detectors];
  }

  /**
   * Get detector by config ID
   */
  public async getDetectorById(configId: string): Promise<ConfigurationDetector | undefined> {
    await this.initialize();
    return this.detectors.find((d) => d.configId === configId);
  }

  /**
   * Sort matches by priority and confidence
   */
  private sortMatches(matches: ConfigurationMatch[]): ConfigurationMatch[] {
    const confidenceOrder = { exact: 0, high: 1, medium: 2, low: 3 };

    return matches.sort((a, b) => {
      // First sort by priority (lower = better)
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }

      // Then sort by confidence (exact > high > medium > low)
      return confidenceOrder[a.confidence] - confidenceOrder[b.confidence];
    });
  }

  /**
   * Check if detector applies to the given utility
   */
  private detectorAppliesToUtility(
    detector: ConfigurationDetector,
    utilityName: string
  ): boolean {
    // Wildcard means applies to all utilities
    if (detector.utilities.includes('*')) {
      return true;
    }

    // Check if utility is in the list
    return detector.utilities.some(
      (u) => u.toLowerCase() === utilityName.toLowerCase()
    );
  }

  /**
   * Reset the switchboard (for testing)
   */
  public reset() {
    this.detectors = [];
    this.initialized = false;
    console.log('[Universal Switchboard] Reset complete');
  }
}

// Export singleton instance
export const universalSwitchboard = new UniversalConfigurationSwitchboard();

// Export class for testing
export default UniversalConfigurationSwitchboard;
