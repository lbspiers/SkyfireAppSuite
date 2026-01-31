/**
 * BOS Auto-Population Service
 * Handles catalog lookup and database field preparation for detected BOS
 */

import { BOSEquipmentItem, ProjectConfigurationResult } from '../types/bosConfigurationTypes';
import axiosInstance from '../api/axiosInstance';
import { BOS_EQUIPMENT_CATALOG, UTILITY_EQUIPMENT_TO_STANDARD } from '../constants/bosEquipmentCatalog';

/**
 * Map utility-specific equipment names to standard catalog types
 * Uses the centralized translation map from bosEquipmentCatalog
 */
function getStandardEquipmentType(utilityType: string): string {
  return UTILITY_EQUIPMENT_TO_STANDARD[utilityType] || utilityType;
}

/**
 * Find matching equipment from LOCAL catalog
 * No API call needed - uses imported BOS_EQUIPMENT_CATALOG
 */
async function findCatalogMatches(
  bosItems: BOSEquipmentItem[]
): Promise<BOSEquipmentItem[]> {
  const enrichedItems: BOSEquipmentItem[] = [];

  for (const item of bosItems) {
    try {
      // Get the standard equipment type for catalog lookup
      const standardType = getStandardEquipmentType(item.equipmentType);

      console.log('[BOS Catalog] Looking up:', item.equipmentType, '-> standard:', standardType);

      // Find matching items in LOCAL catalog
      const matchingItems = BOS_EQUIPMENT_CATALOG.filter(catalogItem => {
        const typeMatch = catalogItem.type.toLowerCase() === standardType.toLowerCase();
        const ampMatch = !item.minAmpRating ||
                         parseInt(catalogItem.amp) >= item.minAmpRating;
        return typeMatch && ampMatch;
      });

      console.log('[BOS Catalog] Found', matchingItems.length, 'matches for', standardType, 'minAmp:', item.minAmpRating);

      if (matchingItems.length > 0) {
        // Sort by amp rating (ascending) and pick smallest that meets requirement
        const sorted = matchingItems.sort((a, b) =>
          parseInt(a.amp) - parseInt(b.amp)
        );
        const bestMatch = sorted[0];

        console.log('[BOS Catalog] Selected:', bestMatch.make, bestMatch.model, bestMatch.amp + 'A');

        enrichedItems.push({
          ...item,
          make: bestMatch.make,
          model: bestMatch.model,
          ampRating: bestMatch.amp,
        });
      } else {
        // No catalog match - keep for manual selection
        console.log('[BOS Catalog] No match found for', standardType, 'minAmp:', item.minAmpRating);
        enrichedItems.push({
          ...item,
          make: '',
          model: '',
          ampRating: '',
        });
      }
    } catch (error) {
      console.error(`Error finding catalog match for ${item.equipmentType}:`, error);
      enrichedItems.push({
        ...item,
        make: '',
        model: '',
        ampRating: '',
      });
    }
  }

  return enrichedItems;
}

/**
 * Build database field payload from BOS items
 * Maps BOS items to correct database field names
 */
function buildBOSFieldPayload(bosItems: BOSEquipmentItem[]): Record<string, any> {
  const payload: Record<string, any> = {};

  for (const item of bosItems) {
    const { section, systemNumber, position } = item;
    const sysNum = systemNumber || 1;

    let fieldPrefix = '';
    let triggerValue = '';
    let blockName = item.blockName || '';

    // Determine field prefix and trigger based on section
    if (section === 'utility') {
      fieldPrefix = `bos_sys${sysNum}_type${position}`;
      triggerValue = `sys${sysNum}_stringCombiner`;
    } else if (section === 'battery1') {
      fieldPrefix = `bos_sys${sysNum}_battery1_type${position}`;
      triggerValue = `sys${sysNum}_battery1`;
    } else if (section === 'battery2') {
      fieldPrefix = `bos_sys${sysNum}_battery2_type${position}`;
      triggerValue = `sys${sysNum}_battery2`;
    } else if (section === 'backup') {
      fieldPrefix = `bos_sys${sysNum}_backup_type${position}`;
      triggerValue = `sys${sysNum}_backupSubPanel`;
    } else if (section === 'postSMS') {
      fieldPrefix = `post_sms_bos_sys${sysNum}_type${position}`;
      triggerValue = `sys${sysNum}_postSMS`;
    } else if (section === 'combine') {
      fieldPrefix = `postcombine_${position}_1`;
      triggerValue = ''; // Combine has no trigger
    }

    // Equipment fields
    payload[`${fieldPrefix}_equipment_type`] = item.equipmentType;
    payload[`${fieldPrefix}_make`] = item.make || '';
    payload[`${fieldPrefix}_model`] = item.model || '';
    payload[`${fieldPrefix}_amp_rating`] = item.ampRating || '';

    // is_new vs existing (combine section uses _existing)
    if (section === 'combine') {
      payload[`${fieldPrefix}_existing`] = !(item.isNew ?? true);
      payload[`${fieldPrefix}_position`] = 'POST COMBINE';
    } else {
      payload[`${fieldPrefix}_is_new`] = item.isNew ?? true;
    }

    // Active field (NOT for battery sections)
    if (section !== 'battery1' && section !== 'battery2') {
      payload[`${fieldPrefix}_active`] = true;
    }

    // Trigger field (NOT for combine section)
    if (section !== 'combine' && triggerValue) {
      payload[`${fieldPrefix}_trigger`] = triggerValue;
    }

    // Block name field (NOT for combine section)
    if (section !== 'combine' && blockName) {
      payload[`${fieldPrefix}_block_name`] = blockName;
    }
  }

  return payload;
}

/**
 * Prepare BOS population data for project
 * Main entry point for BOS auto-population
 */
export async function prepareBOSPopulation(
  projectId: string,
  detectionResult: ProjectConfigurationResult
): Promise<{
  success: boolean;
  payload: Record<string, any>;
  summary: string;
  itemCount: number;
}> {
  try {
    const { allBOSItems } = detectionResult;

    if (allBOSItems.length === 0) {
      return {
        success: false,
        payload: {},
        summary: 'No BOS equipment detected',
        itemCount: 0,
      };
    }

    // Enrich BOS items with catalog data
    const enrichedItems = await findCatalogMatches(allBOSItems);

    // Build database payload
    const payload = buildBOSFieldPayload(enrichedItems);

    // Build summary
    const summary = buildPopulationSummary(enrichedItems);

    return {
      success: true,
      payload,
      summary,
      itemCount: enrichedItems.length,
    };
  } catch (error) {
    console.error('Error preparing BOS population:', error);
    return {
      success: false,
      payload: {},
      summary: 'Error preparing BOS equipment',
      itemCount: 0,
    };
  }
}

/**
 * Build human-readable summary of BOS population
 */
function buildPopulationSummary(bosItems: BOSEquipmentItem[]): string {
  const lines: string[] = [];

  // Group by block name
  const byBlock: Record<string, BOSEquipmentItem[]> = {};
  for (const item of bosItems) {
    if (!byBlock[item.blockName]) {
      byBlock[item.blockName] = [];
    }
    byBlock[item.blockName].push(item);
  }

  // Build summary by block
  for (const [blockName, items] of Object.entries(byBlock)) {
    lines.push(`\n${blockName}:`);
    for (const item of items) {
      const catalogInfo = item.make && item.model
        ? `${item.make} ${item.model} (${item.ampRating}A)`
        : 'Manual selection required';
      lines.push(`  • ${item.equipmentType}: ${catalogInfo}`);
    }
  }

  return lines.join('\n');
}

/**
 * Save BOS population to database
 * Uses the correct endpoint pattern: /project/{id}/system-details (no /api prefix)
 */
export async function saveBOSPopulation(
  projectId: string,
  payload: Record<string, any>
): Promise<{ success: boolean; message: string }> {
  try {
    console.log('[BOS Save] Saving to project:', projectId);
    console.log('[BOS Save] Payload fields:', Object.keys(payload).length);

    // Use the correct endpoint pattern (matches working GET endpoint)
    try {
      const response = await axiosInstance.patch(
        `/project/${projectId}/system-details`,
        payload
      );

      console.log('[BOS Save] Success via system-details endpoint');

      return {
        success: true,
        message: 'BOS equipment saved successfully',
      };
    } catch (error: any) {
      console.log('[BOS Save] system-details endpoint failed, trying alternate...');

      // Fallback: Try PUT to project endpoint
      const altResponse = await axiosInstance.put(
        `/project/${projectId}`,
        { systemDetails: payload }
      );

      console.log('[BOS Save] Success via alternate endpoint');

      return {
        success: true,
        message: 'BOS equipment saved successfully',
      };
    }
  } catch (error: any) {
    console.error('Error saving BOS population:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to save BOS equipment',
    };
  }
}
