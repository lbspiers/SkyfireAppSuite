// src/services/UtilityConfigurationRegistry.ts
// Registry for managing multiple utility configurations

export interface UtilityConfig {
  supportsESS: boolean;
  essConfigurationPrefix: string | null;
  configurations: string[];
}

export class UtilityConfigurationRegistry {
  private static utilityConfigs: Record<string, UtilityConfig> = {
    'APS': {
      supportsESS: true,
      essConfigurationPrefix: 'APS',
      configurations: ['A-1', 'A-2', 'B-1', 'B-2', 'B-3', 'B-4', 'B-5', 'C-1', 'C-2', 'D']
    },
    'SCE': {
      supportsESS: false, // Will be true when SCE configs are added
      essConfigurationPrefix: 'SCE',
      configurations: []
    },
    'PGE': {
      supportsESS: false,
      essConfigurationPrefix: 'PGE',
      configurations: []
    },
    'SDGE': {
      supportsESS: false,
      essConfigurationPrefix: 'SDGE',
      configurations: []
    }
    // Add more utilities as needed
  };

  /**
   * Get configuration for a specific utility
   * Returns default config if utility not found
   */
  static getUtilityConfig(utilityName: string): UtilityConfig {
    return this.utilityConfigs[utilityName] || {
      supportsESS: false,
      essConfigurationPrefix: null,
      configurations: []
    };
  }

  /**
   * Check if a utility has ESS support
   */
  static hasESSSupport(utilityName: string): boolean {
    const config = this.getUtilityConfig(utilityName);
    return config.supportsESS && config.configurations.length > 0;
  }

  /**
   * Get all supported utilities
   */
  static getSupportedUtilities(): string[] {
    return Object.keys(this.utilityConfigs);
  }

  /**
   * Get utilities with ESS support
   */
  static getESSUtilities(): string[] {
    return Object.keys(this.utilityConfigs).filter(
      utility => this.hasESSSupport(utility)
    );
  }

  /**
   * Register a new utility configuration
   * Useful for future dynamic utility additions
   */
  static registerUtility(utilityName: string, config: UtilityConfig): void {
    this.utilityConfigs[utilityName] = config;
  }
}
