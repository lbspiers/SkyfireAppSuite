# Universal Configuration Switchboard System

## Overview

The Universal Configuration Switchboard is a centralized system for automatically detecting equipment configurations and populating Balance of System (BOS) equipment across all 4 systems in the Skyfire mobile app.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Equipment.tsx (UI Layer)                    │
│         "Add Utility Required Equipment" Button              │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│          EquipmentStateExtractor.ts (Data Layer)             │
│    Extracts equipment from database for sys1-sys4            │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│   UniversalConfigurationSwitchboard.ts (Orchestrator)        │
│         Routes to appropriate detector files                 │
└───────────────────────────┬─────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
┌──────────────────┐ ┌───────────────┐ ┌──────────────┐
│ FranklinAPS      │ │ APS Generic   │ │ SCE / SRP    │
│ Configs.ts       │ │ Configs.ts    │ │ Configs.ts   │
│ Priority 1-9     │ │ Priority 10-29│ │ Priority 30+ │
└──────────────────┘ └───────────────┘ └──────────────┘
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │
                            ▼
                   ConfigurationMatch
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│       BOSAutoPopulationService.ts (Persistence Layer)        │
│   Looks up equipment in catalog & saves to database          │
└─────────────────────────────────────────────────────────────┘
```

## File Structure

```
src/utils/configurations/
├── index.ts                                  ← Main exports
├── README.md                                 ← This file
│
├── UniversalConfigurationSwitchboard.ts      ← Orchestrator (master coordinator)
├── EquipmentStateExtractor.ts                ← Extracts equipment from DB
├── BOSAutoPopulationService.ts               ← Adds BOS to database
│
├── types/
│   └── ConfigurationTypes.ts                 ← All interfaces
│
└── configurations/
    ├── FranklinAPSConfigs.ts                 ← Priority 1-9: Franklin + APS
    ├── FranklinSRPConfigs.ts                 ← Priority 10-19: Franklin + SRP (future)
    ├── APSGenericConfigs.ts                  ← Priority 20-29: APS A-1 through D
    └── SCEConfigs.ts                         ← Priority 30+: SCE utility (future)
```

## Priority System

Configurations are checked in priority order (lower number = higher priority):

| Priority Range | Description | Example |
|---------------|-------------|---------|
| **1-9** | Hyper-specific configurations | Franklin aPower + APS + Whole Home |
| **10-29** | Utility-specific generic configs | APS A-1, A-2, B-1, etc. |
| **30-49** | Other utility configs | SCE, SRP specific |
| **50+** | Universal fallbacks | PV-only, No BOS |

## How It Works

### 1. Extract Equipment State

```typescript
import { extractEquipmentForSystem } from '@/utils/configurations';

// For a single system
const equipment = extractEquipmentForSystem(
  systemDetails,  // Raw database fields
  1,              // System number
  utilityRequirements
);

// For all 4 systems
const allSystems = extractEquipmentForAllSystems(
  systemDetails,
  utilityRequirements
);
```

### 2. Find Matching Configurations

```typescript
import { universalSwitchboard } from '@/utils/configurations';

// Get best match for one system
const bestMatch = await universalSwitchboard.getBestMatch(equipment);

// Get top 2 matches
const topMatches = await universalSwitchboard.getTopMatches(equipment, 2);

// Analyze all 4 systems
const results = await universalSwitchboard.analyzeAllSystems({
  system1: equipmentState1,
  system2: equipmentState2,
  system3: equipmentState3,
  system4: equipmentState4,
});
```

### 3. Auto-Populate BOS Equipment

```typescript
import { BOSAutoPopulationService } from '@/utils/configurations';

const result = await BOSAutoPopulationService.autoPopulate({
  projectUuid: 'abc-123',
  systemPrefix: 'sys1_',
  systemNumber: 1,
  configurationMatch: bestMatch,
  autoSelectWhenPossible: true,
  skipExisting: true,
});

if (result.success) {
  console.log(`Added ${result.addedEquipment.length} BOS items`);
}

if (result.requiresUserSelection.length > 0) {
  // Show modal for user to select make/model
}
```

## Adding New Configurations

### Example: Add Franklin + SRP Configuration

1. **Create new detector file:**

```typescript
// configurations/FranklinSRPConfigs.ts

import { ConfigurationDetector } from '../types/ConfigurationTypes';

export const franklinSRPWholeHomeDetector: ConfigurationDetector = {
  name: 'Franklin aPower + SRP (Whole Home)',
  configId: 'FRANKLIN_SRP_WHOLE_HOME',
  priority: 5, // Higher priority than generic
  utilities: ['SRP'],

  quickCheck: (equipment) => {
    return (
      equipment.utilityName === 'SRP' &&
      equipment.hasSolarPanels &&
      equipment.batteryQuantity > 0
    );
  },

  detect: (equipment) => {
    // Implement detection logic
    // Return ConfigurationMatch or null
  },
};

export const franklinSRPDetectors = [
  franklinSRPWholeHomeDetector,
  // Add more...
];
```

2. **Register in switchboard:**

```typescript
// UniversalConfigurationSwitchboard.ts

const franklinSRPModule = await import('./configurations/FranklinSRPConfigs');

this.registerDetectors([
  ...franklinAPSModule.franklinAPSDetectors,
  ...franklinSRPModule.franklinSRPDetectors, // ← Add here
  ...apsGenericModule.apsGenericDetectors,
]);
```

## Configuration Match Structure

When a configuration is detected, it returns:

```typescript
{
  configId: 'FRANKLIN_APS_WHOLE_HOME',
  configName: 'Franklin aPower + APS (Whole Home Backup)',
  description: '...',
  priority: 1,
  confidence: 'exact', // exact | high | medium | low

  requiredEquipment: {
    solarPanels: true,
    batteryQuantity: 1,
    inverterTypes: ['Grid Following'],
    // ...
  },

  bosEquipment: [
    {
      equipmentType: 'Uni-Directional Meter',
      make: 'Milbank',
      model: 'U5929XL',
      ampRating: '100',
      isNew: true,
      position: 1,
      section: 'utility',
    },
    // More BOS items...
  ],

  notes: ['Important info for user'],
  warnings: ['Potential issues'],
}
```

## Testing

```typescript
// Test extraction
const equipment = extractEquipmentForSystem(mockSystemDetails, 1);
console.log(equipment);

// Test detection
const match = await universalSwitchboard.getBestMatch(equipment);
console.log(match?.configName);

// Test all systems
const results = await universalSwitchboard.analyzeAllSystems({
  system1: equipment1,
  system2: equipment2,
});
console.log(`Found ${results.totalMatchesFound} matches`);
```

## Database Field Mapping

### BOS Equipment Fields

For each BOS item, the following fields are saved:

**Utility BOS (Type 1-6):**
- `bos_sys1_type_1_equipment_type`
- `bos_sys1_type_1_make`
- `bos_sys1_type_1_model`
- `bos_sys1_type_1_amp_rating`
- `bos_sys1_type_1_existing`
- `bos_sys1_type_1_active`
- `bos_sys1_show_type_1`

**Post-SMS BOS (Type 1-3):**
- `sys1_post_sms_bos_type_1_equipment_type`
- `sys1_post_sms_bos_type_1_make`
- `sys1_post_sms_bos_type_1_model`
- `sys1_post_sms_bos_type_1_amp_rating`
- `sys1_post_sms_bos_type_1_existing`
- `sys1_post_sms_bos_type_1_active`

## Current Configurations

### Franklin + APS (Priority 1-3)
1. **FRANKLIN_APS_WHOLE_HOME** - Whole home backup
2. **FRANKLIN_APS_PARTIAL_HOME** - Partial home backup
3. **FRANKLIN_APS_NO_BACKUP** - Grid-tied only

### APS Generic (Priority 10-19)
1. **APS_A1** - Grid-only battery + backup
2. **APS_A2** - Grid-only battery + PCS
3. **APS_B1** - Solar + multiple batteries + backup
4. **APS_B2** - Solar + battery + PCS
5. **APS_B3** - Solar + single battery + backup
6. **APS_B4** - Solar + battery (standard)
7. **APS_B5** - Solar + multiple batteries + PCS
8. **APS_C1** - DC coupled hybrid (peak shaving)
9. **APS_C2** - DC coupled hybrid + backup
10. **APS_D** - Standby battery only

## Future Enhancements

- [ ] Add SCE utility configurations
- [ ] Add SRP utility configurations
- [ ] Add Franklin + SRP configurations
- [ ] Add Enphase specific configurations
- [ ] Add Tesla Powerwall specific configurations
- [ ] Add configuration comparison tool
- [ ] Add configuration versioning
- [ ] Add configuration import/export

## Support

For questions or issues, contact the development team.

---

**Last Updated:** January 2025
**Version:** 1.0.0
