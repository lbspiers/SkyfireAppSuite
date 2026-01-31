// BOSAutoPopulationService.ts
// Service for automatically populating BOS equipment based on configuration matches
// Handles equipment catalog lookup, user selection requirements, and database persistence

import {
  BOSEquipment,
  BOSAutoPopulationRequest,
  BOSAutoPopulationResult,
  ConfigurationMatch,
} from './types/ConfigurationTypes';
import { EQUIPMENT_CATALOG, UTILITY_EQUIPMENT_TO_STANDARD } from '../constants';
import { saveSystemDetailsPartialExact, fetchSystemDetailsSafe } from '../../screens/Project/SystemDetails/services/equipmentService';
import {
  fetchPreferredEquipment,
  getEquipmentTypeForPreferred,
} from '../preferredEquipmentHelper';
import { PreferredEquipment } from '../../api/preferredEquipment.service';
import { findExistingSystemCoreEquipment, findEquipmentByTrigger } from '../bosSlotCompactor';

export class BOSAutoPopulationService {
  /**
   * Auto-populate BOS equipment for a system based on configuration match
   */
  static async autoPopulate(
    request: BOSAutoPopulationRequest
  ): Promise<BOSAutoPopulationResult> {
    console.log('[BOS Auto-Population] Starting auto-population...', {
      system: request.systemPrefix,
      configId: request.configurationMatch.configId,
    });

    const result: BOSAutoPopulationResult = {
      success: false,
      message: '',
      addedEquipment: [],
      skippedEquipment: [],
      requiresUserSelection: [],
      errors: [],
    };

    try {
      const { bosEquipment } = request.configurationMatch;

      // Process each BOS equipment item
      for (const bosItem of bosEquipment) {
        const processResult = await this.processBOSItem(
          bosItem,
          request
        );

        if (processResult.skipped) {
          result.skippedEquipment.push(bosItem);
          console.log(
            `[BOS Auto-Population] ⏭️  Skipped: ${bosItem.equipmentType} (already exists)`
          );
        } else if (processResult.requiresUserSelection) {
          result.requiresUserSelection.push({
            ...bosItem,
            ...processResult.catalogOptions,
          });
          console.log(
            `[BOS Auto-Population] ⚠️  Requires user selection: ${bosItem.equipmentType}`
          );
        } else if (processResult.populated) {
          result.addedEquipment.push({
            ...bosItem,
            make: processResult.make,
            model: processResult.model,
            ampRating: processResult.ampRating,
          });
          console.log(
            `[BOS Auto-Population] ✅ Auto-populated: ${bosItem.equipmentType}`
          );
        } else if (processResult.error) {
          result.errors?.push(processResult.error);
          console.error(
            `[BOS Auto-Population] ❌ Error: ${bosItem.equipmentType} - ${processResult.error}`
          );
        }
      }

      // Build database payload for ALL equipment (added + requiresUserSelection)
      const allEquipment = [
        ...result.addedEquipment,
        ...result.requiresUserSelection,
      ];

      result.databasePayload = this.buildDatabasePayload(
        allEquipment,
        request.systemPrefix
      );

      // Add system configuration if this is a multi-system configuration
      if (request.configurationMatch.multiSystemConfig) {
        const config = request.configurationMatch.multiSystemConfig;
        console.log('[BOS Auto-Population] Multi-system config detected - setting system landings:');
        console.log(`[BOS Auto-Population]   System 1 combines at: ${config.sys1CombinesAt}`);
        console.log(`[BOS Auto-Population]   System 2 combines at: ${config.sys2CombinesAt}`);

        // Map configuration values to database field values
        const landingMap: Record<string, string> = {
          'Sol-Ark': 'solArk',
          'Main Panel A': 'meterA',
          'Main Panel B': 'meterB',
          'Sub Panel B': 'subPanelB',
        };

        // Set system 1 landing
        if (config.sys1CombinesAt) {
          const sys1Landing = landingMap[config.sys1CombinesAt] || config.sys1CombinesAt;
          result.databasePayload['systemLandingSys1'] = sys1Landing;
          console.log(`[BOS Auto-Population]   Setting systemLandingSys1 = ${sys1Landing}`);
        }

        // Set system 2 landing
        if (config.sys2CombinesAt) {
          const sys2Landing = landingMap[config.sys2CombinesAt] || config.sys2CombinesAt;
          result.databasePayload['systemLandingSys2'] = sys2Landing;
          console.log(`[BOS Auto-Population]   Setting systemLandingSys2 = ${sys2Landing}`);
        }

        // Set system 3 landing if provided
        if (config.sys3CombinesAt) {
          const sys3Landing = landingMap[config.sys3CombinesAt] || config.sys3CombinesAt;
          result.databasePayload['systemLandingSys3'] = sys3Landing;
          console.log(`[BOS Auto-Population]   Setting systemLandingSys3 = ${sys3Landing}`);
        }

        // Set system 4 landing if provided
        if (config.sys4CombinesAt) {
          const sys4Landing = landingMap[config.sys4CombinesAt] || config.sys4CombinesAt;
          result.databasePayload['systemLandingSys4'] = sys4Landing;
          console.log(`[BOS Auto-Population]   Setting systemLandingSys4 = ${sys4Landing}`);
        }
      }

      // Save to database if we have any equipment to add or show
      if (allEquipment.length > 0 || request.configurationMatch.multiSystemConfig) {
        console.log('[BOS Auto-Population] Database payload:', result.databasePayload);
        console.log('[BOS Auto-Population] All equipment (added + requires selection):', allEquipment);

        console.log('[AUTO-BOS-DEBUG] ========================================');
        console.log('[AUTO-BOS-DEBUG] SAVING TO DATABASE');
        console.log('[AUTO-BOS-DEBUG] ========================================');
        console.log('[AUTO-BOS-DEBUG] Total fields to save:', Object.keys(result.databasePayload).length);
        console.log('[AUTO-BOS-DEBUG] Field names:', Object.keys(result.databasePayload).join(', '));
        console.log('[AUTO-BOS-DEBUG] Trigger fields:', Object.keys(result.databasePayload).filter(k => k.includes('trigger')));
        console.log('[AUTO-BOS-DEBUG] Active fields:', Object.keys(result.databasePayload).filter(k => k.includes('active')));
        console.log('[AUTO-BOS-DEBUG] Equipment type fields:', Object.keys(result.databasePayload).filter(k => k.includes('equipment_type')));

        const saveResponse = await saveSystemDetailsPartialExact(request.projectUuid, result.databasePayload);

        console.log('[AUTO-BOS-DEBUG] ========================================');
        console.log('[AUTO-BOS-DEBUG] SAVE RESPONSE');
        console.log('[AUTO-BOS-DEBUG] ========================================');
        console.log('[AUTO-BOS-DEBUG] Save response:', JSON.stringify(saveResponse, null, 2));

        result.success = true;

        if (result.addedEquipment.length > 0 && result.requiresUserSelection.length > 0) {
          result.message = `Added ${result.addedEquipment.length} BOS item(s), ${result.requiresUserSelection.length} require user selection`;
        } else if (result.addedEquipment.length > 0) {
          result.message = `Successfully added ${result.addedEquipment.length} BOS equipment item(s)`;
        } else {
          result.message = `${result.requiresUserSelection.length} BOS equipment item(s) require user selection`;
        }
      } else if (result.skippedEquipment.length > 0) {
        result.success = true;
        result.message = 'All required BOS equipment already exists';
      } else {
        result.success = false;
        result.message = 'No BOS equipment could be added';
      }

      console.log('[BOS Auto-Population] ✅ Auto-population complete:', result);
      return result;
    } catch (error: any) {
      console.error('[BOS Auto-Population] ❌ Fatal error:', error);
      result.success = false;
      result.message = `Auto-population failed: ${error.message}`;
      result.errors?.push(error.message);
      return result;
    }
  }

  /**
   * Process a single BOS equipment item
   * Now fetches and applies preferred equipment filtering
   */
  private static async processBOSItem(
    bosItem: BOSEquipment,
    request: BOSAutoPopulationRequest
  ): Promise<{
    skipped?: boolean;
    requiresUserSelection?: boolean;
    populated?: boolean;
    make?: string;
    model?: string;
    ampRating?: string;
    catalogOptions?: { availableMakes?: string[]; availableModels?: string[] };
    error?: string;
  }> {
    // Check if equipment already exists
    if (request.skipExisting) {
      const exists = await this.checkIfEquipmentExists(
        bosItem,
        request.configurationMatch,
        request.systemPrefix,
        request.projectUuid
      );
      if (exists) {
        return { skipped: true };
      }
    }

    // If make, model, and amp rating are already specified, use them directly
    if (bosItem.make && bosItem.model && bosItem.ampRating) {
      return {
        populated: true,
        make: bosItem.make,
        model: bosItem.model,
        ampRating: bosItem.ampRating,
      };
    }

    // Fetch preferred equipment for this equipment type
    let preferredEquipment: PreferredEquipment[] = [];
    if (request.companyUuid) {
      try {
        const equipmentTypeForAPI = getEquipmentTypeForPreferred(bosItem.equipmentType);
        console.log(`[BOS Auto-Population] Fetching preferred equipment for type: "${bosItem.equipmentType}" → "${equipmentTypeForAPI}"`);
        preferredEquipment = await fetchPreferredEquipment(request.companyUuid, equipmentTypeForAPI);
        console.log(`[BOS Auto-Population] Found ${preferredEquipment.length} preferred equipment items`);
      } catch (error) {
        console.error(`[BOS Auto-Population] Error fetching preferred equipment:`, error);
        // Continue without preferred equipment
      }
    }

    // Look up equipment in catalog (now with preferred equipment filtering)
    const catalogResult = this.lookupEquipmentInCatalog(bosItem, preferredEquipment);

    if (!catalogResult.found) {
      return {
        error: `Equipment type "${bosItem.equipmentType}" not found in catalog`,
      };
    }

    // If multiple options exist and auto-select is disabled, require user selection
    if (catalogResult.multipleOptions && !request.autoSelectWhenPossible) {
      return {
        requiresUserSelection: true,
        catalogOptions: {
          availableMakes: catalogResult.availableMakes,
          availableModels: catalogResult.availableModels,
        },
      };
    }

    // If only one option or auto-select enabled, use it
    if (catalogResult.make && catalogResult.model && catalogResult.ampRating) {
      return {
        populated: true,
        make: catalogResult.make,
        model: catalogResult.model,
        ampRating: catalogResult.ampRating,
      };
    }

    // Multiple options but couldn't auto-select
    return {
      requiresUserSelection: true,
      catalogOptions: {
        availableMakes: catalogResult.availableMakes,
        availableModels: catalogResult.availableModels,
      },
    };
  }

  /**
   * Check if BOS equipment already exists
   * Now properly checks the database using fetchSystemDetails
   */
  private static async checkIfEquipmentExists(
    bosItem: BOSEquipment,
    configMatch: ConfigurationMatch,
    systemPrefix: string,
    projectUuid: string
  ): Promise<boolean> {
    try {
      // Special handling for Gateway and SMS equipment types
      // These should only exist once per system regardless of position
      const isGateway = bosItem.equipmentType?.toLowerCase().includes('gateway');
      const isSMS = bosItem.equipmentType?.toLowerCase() === 'sms' ||
                    bosItem.equipmentType?.toLowerCase().includes('storage management');

      if (isGateway || isSMS) {
        const currentData = await fetchSystemDetailsSafe(projectUuid);
        if (!currentData) {
          console.warn('[BOS Auto-Population] Could not fetch system details - proceeding with addition');
          return false; // If we can't check, proceed with addition
        }

        const equipmentType = isSMS ? 'SMS' : 'Gateway';
        const existingSlot = findExistingSystemCoreEquipment(systemPrefix, currentData, equipmentType);

        if (existingSlot) {
          console.log(`[BOS Auto-Population] ${equipmentType} already exists in slot ${existingSlot} - skipping to prevent duplicate`);
          return true;
        }

        return false;
      }

      // For other equipment types, check if equipment exists at the specific position
      const currentData = await fetchSystemDetailsSafe(projectUuid);
      if (!currentData) {
        console.warn('[BOS Auto-Population] Could not fetch system details - proceeding with addition');
        return false; // If we can't check, proceed with addition
      }

      const systemNum = systemPrefix.replace('sys', '').replace('_', '');

      let fieldPrefix: string;
      if (bosItem.section === 'utility') {
        fieldPrefix = `bos_sys${systemNum}_type${bosItem.position}`;
      } else if (bosItem.section === 'post-sms') {
        fieldPrefix = `post_sms_bos_sys${systemNum}_type${bosItem.position}`;
      } else {
        // battery section
        fieldPrefix = `bos_sys${systemNum}_battery1_type${bosItem.position}`;
      }

      const existingEquipmentType = currentData[`${fieldPrefix}_equipment_type`];
      const existingMake = currentData[`${fieldPrefix}_make`];
      const existingModel = currentData[`${fieldPrefix}_model`];

      const exists = !!(existingEquipmentType || existingMake || existingModel);

      if (exists) {
        console.log(`[BOS Auto-Population] Equipment already exists at ${fieldPrefix}: ${existingEquipmentType || 'unknown'} - skipping`);
      }

      return exists;
    } catch (error) {
      console.error('[BOS Auto-Population] Error checking if equipment exists:', error);
      return false; // If we can't check, proceed with addition
    }
  }

  /**
   * Look up equipment in catalog and find best match
   * Now integrates preferred equipment filtering
   */
  private static lookupEquipmentInCatalog(
    bosItem: BOSEquipment,
    preferredEquipment: PreferredEquipment[] = []
  ): {
    found: boolean;
    multipleOptions: boolean;
    make?: string;
    model?: string;
    ampRating?: string;
    availableMakes?: string[];
    availableModels?: string[];
  } {
    // Translate equipment type to standard catalog name
    const catalogEquipmentType = UTILITY_EQUIPMENT_TO_STANDARD[bosItem.equipmentType] || bosItem.equipmentType;

    console.log(`[BOS Auto-Population] Looking up equipment: "${bosItem.equipmentType}" → "${catalogEquipmentType}"`);

    // Filter catalog by equipment type
    let matchingItems = EQUIPMENT_CATALOG.filter(
      (item) => item.type.toLowerCase() === catalogEquipmentType.toLowerCase()
    );

    if (matchingItems.length === 0) {
      console.error(`[BOS Auto-Population] No catalog items found for type: "${catalogEquipmentType}"`);
      return { found: false, multipleOptions: false };
    }

    console.log(`[BOS Auto-Population] Found ${matchingItems.length} catalog items for "${catalogEquipmentType}"`);

    // STEP 1: Apply preferred equipment filtering (if any preferred equipment exists)
    if (preferredEquipment.length > 0) {
      const preferredMakes = new Set(preferredEquipment.map(p => p.make.toLowerCase()));
      const filteredByPreferred = matchingItems.filter(item =>
        preferredMakes.has(item.make.toLowerCase())
      );

      if (filteredByPreferred.length > 0) {
        console.log(`[BOS Auto-Population] Filtered to ${filteredByPreferred.length} preferred items (from ${matchingItems.length} total)`);
        matchingItems = filteredByPreferred;
      } else {
        console.log(`[BOS Auto-Population] No preferred equipment matches found, using all ${matchingItems.length} items`);
      }
    }

    // STEP 2: If minimum amp rating specified, filter by that
    if (bosItem.minAmpRating) {
      const filteredByAmps = matchingItems.filter(
        (item) => parseFloat(item.amp) >= bosItem.minAmpRating!
      );

      if (filteredByAmps.length > 0) {
        // Get the smallest amp rating that meets requirement
        const minAmp = Math.min(...filteredByAmps.map((item) => parseFloat(item.amp)));
        const itemsWithMinAmp = filteredByAmps.filter(
          (item) => parseFloat(item.amp) === minAmp
        );

        return this.selectFromCatalogItems(itemsWithMinAmp, bosItem.preferredMake, preferredEquipment);
      }
    }

    // No amp rating filter or no matches, use all items
    return this.selectFromCatalogItems(matchingItems, bosItem.preferredMake, preferredEquipment);
  }

  /**
   * Select best match from catalog items
   * Enhanced with preferred equipment auto-selection logic
   */
  private static selectFromCatalogItems(
    items: Array<{ type: string; make: string; model: string; amp: string }>,
    preferredMake?: string,
    preferredEquipment: PreferredEquipment[] = []
  ): {
    found: boolean;
    multipleOptions: boolean;
    make?: string;
    model?: string;
    ampRating?: string;
    availableMakes?: string[];
    availableModels?: string[];
  } {
    // Get unique makes
    const uniqueMakes = [...new Set(items.map((item) => item.make))];

    // PRIORITY 1: Check if there's a default preferred equipment
    const defaultPreferred = preferredEquipment.find(p => p.is_default);
    if (defaultPreferred) {
      // Find matching item in catalog
      const matchingItem = items.find(
        item => item.make.toLowerCase() === defaultPreferred.make.toLowerCase() &&
                item.model.toLowerCase() === defaultPreferred.model.toLowerCase()
      );
      if (matchingItem) {
        console.log(`[BOS Auto-Population] Auto-selecting default preferred equipment: ${defaultPreferred.make} ${defaultPreferred.model}`);
        return {
          found: true,
          multipleOptions: false,
          make: matchingItem.make,
          model: matchingItem.model,
          ampRating: matchingItem.amp,
        };
      }
    }

    // PRIORITY 2: If only one preferred equipment item, auto-select it
    if (preferredEquipment.length === 1) {
      const singlePreferred = preferredEquipment[0];

      // Check if this is make-only preferred equipment (model is "N/A" or empty)
      const isMakeOnly = !singlePreferred.model ||
                         singlePreferred.model === 'N/A' ||
                         singlePreferred.model.trim() === '';

      if (isMakeOnly) {
        // For make-only preferred equipment, just filter by make
        // Items are already filtered by make at this point (from lookupEquipmentInCatalog)
        // So we indicate that user needs to select from available models
        console.log(`[BOS Auto-Population] Make-only preferred equipment (${singlePreferred.make}) - no specific model to auto-select`);
        // Don't return here - let it fall through to check if only one model exists
      } else {
        // For make+model preferred equipment, try to find exact match
        const matchingItem = items.find(
          item => item.make.toLowerCase() === singlePreferred.make.toLowerCase() &&
                  item.model.toLowerCase() === singlePreferred.model.toLowerCase()
        );
        if (matchingItem) {
          console.log(`[BOS Auto-Population] Auto-selecting only preferred equipment: ${singlePreferred.make} ${singlePreferred.model}`);
          return {
            found: true,
            multipleOptions: false,
            make: matchingItem.make,
            model: matchingItem.model,
            ampRating: matchingItem.amp,
          };
        }
      }
    }

    // PRIORITY 3: If preferred make specified in config and available, filter by it
    let filteredItems = items;
    if (preferredMake && uniqueMakes.includes(preferredMake)) {
      filteredItems = items.filter((item) => item.make === preferredMake);
      console.log(`[BOS Auto-Population] Filtered by config preferredMake: ${preferredMake}`);
    }

    // Get unique makes and models from filtered items
    const makes = [...new Set(filteredItems.map((item) => item.make))];
    const models = [...new Set(filteredItems.map((item) => item.model))];

    // If only one unique combination after filtering, auto-select it
    if (makes.length === 1 && models.length === 1) {
      const selectedItem = filteredItems[0];
      console.log(`[BOS Auto-Population] Auto-selecting single option: ${selectedItem.make} ${selectedItem.model}`);
      return {
        found: true,
        multipleOptions: false,
        make: selectedItem.make,
        model: selectedItem.model,
        ampRating: selectedItem.amp,
      };
    }

    // Multiple options available - require user selection
    console.log(`[BOS Auto-Population] Multiple options available (${makes.length} makes, ${models.length} models) - requires user selection`);
    return {
      found: true,
      multipleOptions: true,
      availableMakes: makes,
      availableModels: models,
    };
  }

  /**
   * Build database payload from BOS equipment list
   *
   * IMPORTANT: Each BOS item has its own systemPrefix field that determines
   * which system it belongs to. This is critical for multi-system configurations
   * where BOS equipment is distributed across multiple systems.
   */
  private static buildDatabasePayload(
    bosEquipment: BOSEquipment[],
    systemPrefix: string  // Fallback system prefix if item doesn't specify one
  ): Record<string, any> {
    const payload: Record<string, any> = {};

    for (const item of bosEquipment) {
      // CRITICAL: Use the BOS item's own systemPrefix if specified
      // This allows multi-system configurations to distribute BOS across systems
      const itemSystemPrefix = item.systemPrefix || systemPrefix;

      // Extract system number from prefix (sys1_ -> 1, sys2_ -> 2, etc.)
      const systemNum = itemSystemPrefix.replace('sys', '').replace('_', '');

      console.log(`[BOS Auto-Population] Processing ${item.equipmentType} for ${itemSystemPrefix} (position ${item.position})`);

      let fieldPrefix: string;
      let triggerValue: string;

      // Determine field prefix and trigger value based on section
      // SCHEMA PATTERN:
      // - Utility BOS: bos_sys1_type1_*, bos_sys1_type2_*
      //   Fields: _equipment_type, _make, _model, _amp_rating, _is_new, _active, _trigger, _block_name
      // - Battery BOS: bos_sys1_battery1_type1_*, bos_sys1_battery1_type2_*, bos_sys1_battery1_type3_*
      //   Fields: _equipment_type, _make, _model, _amp_rating, _is_new, _trigger, _block_name (NO _active)
      // - Backup BOS: bos_sys1_backup_type1_*, bos_sys1_backup_type2_*, bos_sys1_backup_type3_*
      //   Fields: _equipment_type, _make, _model, _amp_rating, _is_new, _active, _trigger, _block_name
      // - Post-SMS BOS: post_sms_bos_sys1_type1_*, post_sms_bos_sys1_type2_*, post_sms_bos_sys1_type3_*
      //   Fields: _equipment_type, _make, _model, _amp_rating, _is_new, _active, _trigger, _block_name
      // - Combine BOS: postcombine_1_1_*, postcombine_2_1_*, postcombine_3_1_* (NO system prefix!)
      //   Fields: _equipment_type, _make, _model, _amp_rating, _existing (NO _is_new, _active, _trigger, or _block_name)
      //
      // TRIGGER VALUES:
      // - Utility BOS: 'sys1_stringCombiner' (triggered from String Combiner Panel section)
      // - Battery BOS: 'sys1_battery1' (triggered from battery1 section)
      // - Backup BOS: 'sys1_backup' (triggered from Backup Load Sub Panel section)
      // - Post-SMS BOS: 'sys1_postSMS' (triggered from post-SMS section)
      // - Combine BOS: No trigger (always visible on Equipment page when populated)
      if (item.section === 'utility') {
        fieldPrefix = `bos_sys${systemNum}_type${item.position}`;
        triggerValue = `sys${systemNum}_stringCombiner`; // Utility BOS triggered AFTER String Combiner Panel
      } else if (item.section === 'backup') {
        fieldPrefix = `bos_sys${systemNum}_backup_type${item.position}`;
        triggerValue = `sys${systemNum}_backup`; // Backup BOS triggered from Backup Load Sub Panel
      } else if (item.section === 'post-sms') {
        fieldPrefix = `post_sms_bos_sys${systemNum}_type${item.position}`;
        triggerValue = `sys${systemNum}_postSMS`; // Post-SMS BOS has its own trigger
      } else if (item.section === 'combine') {
        // Combine BOS uses a different schema: postcombine_${position}_1_*
        // NO system prefix, as these appear on Equipment page and combine all systems
        fieldPrefix = `postcombine_${item.position}_1`;
        triggerValue = ''; // No trigger for combine BOS - always visible when populated
      } else {
        // battery section
        fieldPrefix = `bos_sys${systemNum}_battery1_type${item.position}`;
        triggerValue = `sys${systemNum}_battery1`; // Battery BOS triggered from battery1 section
      }

      // Add fields (using correct schema field names)
      payload[`${fieldPrefix}_equipment_type`] = item.equipmentType;
      payload[`${fieldPrefix}_make`] = item.make || '';
      payload[`${fieldPrefix}_model`] = item.model || '';

      // All BOS sections have amp_rating field
      payload[`${fieldPrefix}_amp_rating`] = item.ampRating || '';

      // Combine BOS uses different field name for is_new: _existing (boolean)
      // Other sections use _is_new (boolean)
      if (item.section === 'combine') {
        payload[`${fieldPrefix}_existing`] = item.isNew === false; // true if existing, false if new
        payload[`${fieldPrefix}_position`] = 'POST COMBINE'; // Combine BOS position field
        // SPECIAL: Also set _active for combine BOS to make the button appear on Equipment screen
        payload[`${fieldPrefix}_active`] = true; // Make button visible
      } else {
        payload[`${fieldPrefix}_is_new`] = item.isNew !== false; // Default to true
      }

      // Only utility BOS, backup BOS, and post-SMS BOS have _active field in original schema
      // Battery BOS sections do NOT have _active field in schema
      // NOTE: We're also setting _active for combine BOS above to activate the button
      if (item.section === 'utility' || item.section === 'backup' || item.section === 'post-sms') {
        payload[`${fieldPrefix}_active`] = true; // Make section visible
      }

      // Set trigger (except for combine BOS which has no trigger)
      if (item.section !== 'combine') {
        payload[`${fieldPrefix}_trigger`] = triggerValue; // Set trigger to show the section in the correct location
      }

      // Set block_name based on section:
      // - Utility BOS (pre-combine) → "PRE COMBINE"
      // - Battery BOS → "ESS"
      // - Backup BOS → "ESS" (backup panel is part of energy storage system)
      // - Post-SMS BOS → "POST COMBINE"
      // - Combine BOS → No block_name (Equipment page doesn't use block names)
      let blockName: string;
      if (item.section === 'utility') {
        blockName = 'PRE COMBINE';
      } else if (item.section === 'battery' || item.section === 'backup') {
        blockName = 'ESS';
      } else if (item.section === 'post-sms') {
        blockName = 'POST COMBINE';
      } else {
        blockName = ''; // Combine BOS has no block_name
      }

      if (item.section !== 'combine' && blockName) {
        payload[`${fieldPrefix}_block_name`] = blockName;
      }
    }

    // Log summary of BOS equipment distribution across systems
    const systemDistribution = bosEquipment.reduce((acc, item) => {
      const itemSystemPrefix = item.systemPrefix || systemPrefix;
      if (!acc[itemSystemPrefix]) {
        acc[itemSystemPrefix] = [];
      }
      acc[itemSystemPrefix].push(item.equipmentType);
      return acc;
    }, {} as Record<string, string[]>);

    console.log('[BOS Auto-Population] ========================================');
    console.log('[BOS Auto-Population] BOS EQUIPMENT DISTRIBUTION');
    console.log('[BOS Auto-Population] ========================================');
    Object.entries(systemDistribution).forEach(([sys, items]) => {
      console.log(`[BOS Auto-Population] ${sys}: ${items.length} items`);
      items.forEach((item, idx) => {
        console.log(`[BOS Auto-Population]   ${idx + 1}. ${item}`);
      });
    });
    console.log('[BOS Auto-Population] ========================================');

    console.log('[BOS Auto-Population] Built database payload with correct field names:', payload);
    return payload;
  }

  /**
   * Validate that required equipment exists before adding BOS
   */
  static validateRequiredEquipment(
    configMatch: ConfigurationMatch,
    systemDetails: Record<string, any>
  ): { valid: boolean; missingEquipment: string[] } {
    const missing: string[] = [];
    const prefix = configMatch.systemPrefix;
    const req = configMatch.requiredEquipment;

    // Check solar
    if (req.solarPanels) {
      const hasSolar = !!(
        systemDetails[`${prefix}solar_panel_make`] ||
        systemDetails[`${prefix}solar_panel_model`]
      );
      if (!hasSolar) {
        missing.push('Solar Panels');
      }
    }

    // Check battery
    if (req.batteryQuantity > 0) {
      const batteryQty = parseInt(systemDetails[`${prefix}battery1_qty`]) || 0;
      if (batteryQty === 0) {
        missing.push('Battery');
      }
    }

    // Check inverter
    if (req.inverterTypes.length > 0) {
      const hasInverter = !!(
        systemDetails[`${prefix}micro_inverter_make`] ||
        systemDetails[`${prefix}micro_inverter_model`]
      );
      if (!hasInverter) {
        missing.push('Inverter');
      }
    }

    // Check SMS
    if (req.sms) {
      const hasSMS = !!(
        systemDetails[`${prefix}sms_make`] || systemDetails[`${prefix}sms_model`]
      );
      if (!hasSMS) {
        missing.push('Storage Management System (SMS)');
      }
    }

    return {
      valid: missing.length === 0,
      missingEquipment: missing,
    };
  }
}

// Export convenience function
export const autoPopulateBOS = BOSAutoPopulationService.autoPopulate;
export const validateRequiredEquipment = BOSAutoPopulationService.validateRequiredEquipment;
