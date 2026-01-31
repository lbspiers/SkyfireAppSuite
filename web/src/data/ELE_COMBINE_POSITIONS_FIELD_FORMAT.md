# ele_combine_positions Field Format Specification
**Exact JSON Structure for IntakeTable[ele_combine_positions]**

*Last Updated: 2026-01-15*

---

## Table of Contents
1. [Overview](#overview)
2. [Field Type](#field-type)
3. [Complete JSON Schema](#complete-json-schema)
4. [All Properties Explained](#all-properties-explained)
5. [Code That Builds It](#code-that-builds-it)
6. [Code That Parses It](#code-that-parses-it)
7. [Real-World Examples](#real-world-examples)
8. [Related Database Fields](#related-database-fields)
9. [Web App Integration](#web-app-integration)

---

## Overview

The `ele_combine_positions` field stores the **complete configuration** of how multiple systems are combined. It's saved in the `IntakeTable` (or `system_details` table) and contains:

- Which systems are active
- Where each system lands (connection points)
- How systems are connected to each other
- Combiner panel configurations
- AC coupling details
- SMS (Storage Management System) connections
- Sub Panel B configuration
- Configuration workflow state

---

## Field Type

**Database Column:** `ele_combine_positions`

**Type:** `TEXT` or `LONGTEXT`

**Format:** JSON string (requires `JSON.stringify()` to save, `JSON.parse()` to read)

**Nullable:** Yes (NULL means no combination configured)

---

## Complete JSON Schema

### Version 2.0 Structure (Current)

```json
{
  "version": "2.0",
  "combine_systems": true,
  "active_systems": [1, 2],
  "system_landings": {
    "system1": "AC Input: System 2 (PowerWall)",
    "system2": "Main Panel",
    "system3": null,
    "system4": null
  },
  "connections": [
    {
      "from": "System 1",
      "to": "AC Input: System 2 (PowerWall)",
      "type": "ac_couple"
    },
    {
      "from": "System 2",
      "to": "Main Panel",
      "type": "direct"
    }
  ],
  "combiner_panels": [],
  "ac_coupling": [
    {
      "source": 1,
      "target": 2,
      "inverter": "AC Input: System 2 (PowerWall)"
    }
  ],
  "sms_connections": [],
  "sub_panel_b": {
    "exists": false,
    "type": null,
    "bus_rating": "",
    "main_breaker_rating": "",
    "feeder_location": "",
    "derated": null,
    "upstream_breaker_rating": ""
  },
  "completed_systems": [1, 2],
  "current_step": 0,
  "timestamp": "2026-01-15T14:30:45.123Z"
}
```

---

## All Properties Explained

### Root Level Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `version` | `string` | Yes | Schema version (currently `"2.0"`) |
| `combine_systems` | `boolean` | Yes | `true` if systems are combined, `false` if not |
| `active_systems` | `number[]` | Yes | Array of active system numbers (e.g., `[1, 2]` or `[1, 2, 3, 4]`) |
| `system_landings` | `object` | Yes | Object mapping system IDs to landing destinations |
| `connections` | `array` | Yes | Array of connection objects describing how systems connect |
| `combiner_panels` | `array` | Yes | Array of combiner panel configurations (empty if none) |
| `ac_coupling` | `array` | Yes | Array of AC coupling relationships (empty if none) |
| `sms_connections` | `array` | Yes | Array of SMS connections (empty if none) |
| `sub_panel_b` | `object` | Yes | Sub Panel B configuration details |
| `completed_systems` | `number[]` | Yes | Systems that have completed configuration |
| `current_step` | `number` | Yes | Current step in configuration workflow (0 = complete) |
| `timestamp` | `string` | Yes | ISO 8601 timestamp of last update |

---

### system_landings Object

**Structure:**
```json
{
  "system1": "AC Input: System 2 (PowerWall)",
  "system2": "Main Panel",
  "system3": null,
  "system4": null
}
```

**Keys:** `"system1"`, `"system2"`, `"system3"`, `"system4"`

**Values:** String representing landing destination, or `null` if not configured

**Possible Values:**
- `"Main Panel"`
- `"Sub Panel B"`
- `"Sub Panel B (Add)"`
- `"Combiner Panel (New)"`
- `"Combiner Panel (Same as System {N})"`
- `"AC Input: System {N} ({Device Type})"`
- `"SMS: System {N} ({Model})"`
- `null` (not configured)

---

### connections Array

**Purpose:** Describes all electrical connections between systems

**Structure:**
```typescript
interface Connection {
  from: string;     // "System 1", "System 2", etc.
  to: string;       // Landing destination string
  type: string;     // "ac_couple" | "sms_connection" | "combine" | "direct"
}
```

**Example:**
```json
[
  {
    "from": "System 1",
    "to": "AC Input: System 2 (PowerWall)",
    "type": "ac_couple"
  },
  {
    "from": "System 2",
    "to": "Main Panel",
    "type": "direct"
  }
]
```

**Connection Types:**
- `"ac_couple"` - System connects via AC coupling to another system
- `"sms_connection"` - System connects through SMS of another system
- `"combine"` - System connects to a combiner panel
- `"direct"` - System connects directly to panel (no intermediate connection)

---

### combiner_panels Array

**Purpose:** Details about combiner panels used

**Structure:**
```typescript
interface CombinerPanel {
  id: string;                  // Unique identifier (e.g., "combiner_1_2")
  connects_to: string;         // Where the combiner connects (e.g., "Main Panel")
  systems_connected: string[]; // Array of system names (e.g., ["System 1", "System 2"])
}
```

**Example:**
```json
[
  {
    "id": "combiner_1_2",
    "connects_to": "Main Panel",
    "systems_connected": ["System 1", "System 2"]
  }
]
```

**Empty Array:** `[]` if no combiner panels used

---

### ac_coupling Array

**Purpose:** Tracks AC coupling relationships between systems

**Structure:**
```typescript
interface ACCoupling {
  source: number;  // Source system number (1-4)
  target: number;  // Target system number (1-4)
  inverter: string; // Full landing string (e.g., "AC Input: System 2 (PowerWall)")
}
```

**Example:**
```json
[
  {
    "source": 1,
    "target": 2,
    "inverter": "AC Input: System 2 (PowerWall)"
  },
  {
    "source": 3,
    "target": 2,
    "inverter": "AC Input: System 2 (PowerWall)"
  }
]
```

**Empty Array:** `[]` if no AC coupling

---

### sms_connections Array

**Purpose:** Tracks SMS (Storage Management System) connections

**Structure:**
```typescript
interface SMSConnection {
  source: number; // Source system number
  target: number; // Target system number
  sms: string;    // Full SMS string (e.g., "SMS: System 2 (Tesla Powerwall 3)")
}
```

**Example:**
```json
[
  {
    "source": 1,
    "target": 2,
    "sms": "SMS: System 2 (Tesla Powerwall 3)"
  }
]
```

**Empty Array:** `[]` if no SMS connections

---

### sub_panel_b Object

**Purpose:** Configuration details for Sub Panel B

**Structure:**
```typescript
interface SubPanelB {
  exists: boolean;              // Is Sub Panel B configured?
  type: "new" | "existing" | null; // Type of Sub Panel B
  bus_rating: string;           // Bus bar rating (e.g., "200")
  main_breaker_rating: string;  // Main breaker rating (e.g., "150")
  feeder_location: string;      // Physical location (e.g., "Garage")
  derated: boolean | null;      // Is it derated?
  upstream_breaker_rating: string; // Upstream breaker rating (e.g., "200")
}
```

**Example (Existing Sub Panel B):**
```json
{
  "exists": true,
  "type": "existing",
  "bus_rating": "200",
  "main_breaker_rating": "150",
  "feeder_location": "Garage",
  "derated": false,
  "upstream_breaker_rating": "200"
}
```

**Example (No Sub Panel B):**
```json
{
  "exists": false,
  "type": null,
  "bus_rating": "",
  "main_breaker_rating": "",
  "feeder_location": "",
  "derated": null,
  "upstream_breaker_rating": ""
}
```

---

### completed_systems Array

**Purpose:** Tracks which systems have completed the configuration workflow

**Type:** `number[]`

**Example:** `[1, 2]` means Systems 1 and 2 are configured

**All Complete:** `[1, 2, 3, 4]` if all 4 systems are configured

---

### current_step Number

**Purpose:** Tracks current position in configuration workflow

**Values:**
- `0` - Configuration complete (all systems configured)
- `1` - Currently configuring System 1
- `2` - Currently configuring System 2
- `3` - Currently configuring System 3
- `4` - Currently configuring System 4

---

### timestamp String

**Purpose:** Records when the configuration was last saved

**Format:** ISO 8601 timestamp

**Example:** `"2026-01-15T14:30:45.123Z"`

---

## Code That Builds It

### File: `src/screens/Project/Equipment.tsx`

#### Step 1: Generate Configuration Data

**Location:** Lines 1872-1904

```typescript
// Import helper function
import { generateConfigurationData } from '@/utils/equipmentHelpers';

// Generate connections, combiner panels, AC coupling, etc.
const configData = generateConfigurationData(
  combineSystems,           // true/false
  systemLandings,          // { system1: "Main Panel", system2: "..." }
  activeSystemsArray,      // [1, 2] or [1, 2, 3, 4]
  localSystemDetails || {}, // Full system details object
  hasSubPanelB,            // true/false
  subPanelBData            // Sub Panel B configuration object
);

// configData returns:
// {
//   connections: [...],
//   combiner_panels: [...],
//   ac_coupling: [...],
//   sms_connections: [...]
// }
```

---

#### Step 2: Build Complete Configuration Object

**Location:** Lines 1969-2006

```typescript
// Build the full configuration object
const fullConfig = {
  version: "2.0",
  combine_systems: combineSystems,           // boolean
  active_systems: activeSystemsArray,        // [1, 2, ...]
  system_landings: systemLandings,           // { system1: "...", ... }
  connections: configData.connections,       // Array of connection objects
  combiner_panels: configData.combiner_panels, // Array of combiner panel objects
  ac_coupling: configData.ac_coupling,       // Array of AC coupling objects
  sms_connections: configData.sms_connections, // Array of SMS connection objects
  sub_panel_b: {
    exists: hasSubPanelB,
    type: subPanelBData?.type || null,
    bus_rating: subPanelBData?.busAmps || "",
    main_breaker_rating: subPanelBData?.mainBreakerAmps || "",
    feeder_location: subPanelBData?.feederLocation || "",
    derated: subPanelBData?.derated || null,
    upstream_breaker_rating: subPanelBData?.upstreamBreakerAmps || "",
  },
  completed_systems: completedSystems,       // [1, 2]
  current_step: currentSystemConfig,         // 0, 1, 2, 3, or 4
  timestamp: new Date().toISOString(),       // ISO 8601 timestamp
};

// Stringify for database storage
const jsonString = JSON.stringify(fullConfig);
```

---

#### Step 3: Save to Database

```typescript
// Prepare database fields
const dbFields = {
  ele_combine_positions: JSON.stringify(fullConfig),  // ← JSON string
  ele_combine_systems: combineSystems,                // boolean
  ele_combine_active_systems: activeSystemsArray.join(","), // "1,2"
  ele_combine_system_desc: combineDesc,              // "Combine 1 & 2"

  // Also save individual landing destinations
  sys1_landing_destination: systemLandings.system1 || null,
  sys2_landing_destination: systemLandings.system2 || null,
  sys3_landing_destination: systemLandings.system3 || null,
  sys4_landing_destination: systemLandings.system4 || null,
};

// Save to database
await saveSystemDetails(projectUuid, dbFields);
```

---

### File: `src/utils/equipmentHelpers.ts`

#### Function: `generateConfigurationData()`

**Location:** Lines 221-335

```typescript
export const generateConfigurationData = (
  combineSystems: boolean,
  systemLandings: Record<string, string>,
  activeSystems: number[],
  systemDetails: any,
  hasSubPanelB: boolean,
  subPanelBData: any
) => {
  const connections = [];
  const combinerPanels = [];
  const acCoupling = [];
  const smsConnections = [];

  // Build connections array
  activeSystems.forEach((sysNum) => {
    const landing = systemLandings[`system${sysNum}`];
    if (!landing) return;

    const connection = {
      from: `System ${sysNum}`,
      to: landing,
      type: determineConnectionType(landing), // "ac_couple", "sms_connection", "combine", "direct"
    };

    connections.push(connection);

    // Track AC coupling
    if (landing.startsWith("AC Input: System")) {
      const targetSystem = extractSystemNumber(landing);
      acCoupling.push({
        source: sysNum,
        target: targetSystem,
        inverter: landing,
      });
    }

    // Track SMS connections
    if (landing.startsWith("SMS: System")) {
      const targetSystem = extractSystemNumber(landing);
      smsConnections.push({
        source: sysNum,
        target: targetSystem,
        sms: landing,
      });
    }

    // Track combiner panels
    if (landing.includes("Combiner Panel")) {
      // Build combiner panel object...
      // (Logic to create combiner panel entries)
    }
  });

  return {
    connections,
    combiner_panels: combinerPanels,
    ac_coupling: acCoupling,
    sms_connections: smsConnections,
  };
};
```

---

## Code That Parses It

### Load from Database

**File:** `src/screens/Project/Equipment.tsx` (Lines 1283-1310)

```typescript
// Step 1: Fetch system details from API
const systemData = await fetchSystemDetails(projectUuid);

// Step 2: Parse ele_combine_positions field
const combinePositions = systemData?.ele_combine_positions
  ? JSON.parse(systemData.ele_combine_positions)  // ← Parse JSON string
  : null;

// Step 3: Read properties
if (combinePositions) {
  const version = combinePositions.version;              // "2.0"
  const combineSystems = combinePositions.combine_systems; // true/false
  const activeSystems = combinePositions.active_systems;  // [1, 2]
  const systemLandings = combinePositions.system_landings; // {...}
  const connections = combinePositions.connections;       // [...]
  const combinerPanels = combinePositions.combiner_panels; // [...]
  const acCoupling = combinePositions.ac_coupling;        // [...]
  const smsConnections = combinePositions.sms_connections; // [...]
  const subPanelB = combinePositions.sub_panel_b;         // {...}
  const completedSystems = combinePositions.completed_systems; // [1, 2]
  const currentStep = combinePositions.current_step;      // 0
  const timestamp = combinePositions.timestamp;           // "2026-01-15T..."

  // Restore state from parsed data
  setCombineSystems(combineSystems);
  setSystemLandings(systemLandings);
  setCompletedSystems(completedSystems);
  // ... etc
}
```

---

### Backwards Compatibility (Legacy Format)

**Old Format (v1.0):** Plain string values like `"Combine System 1 & 2"`

```typescript
// Detect and handle legacy format
const combinePositionsRaw = systemData?.ele_combine_positions;

if (combinePositionsRaw) {
  // Try to parse as JSON
  try {
    const parsed = JSON.parse(combinePositionsRaw);

    // Check version
    if (parsed.version === "2.0") {
      // Modern format - use as-is
      setCombinePositions(parsed);
    } else {
      // Old JSON format - migrate if needed
      migrateToV2(parsed);
    }
  } catch (e) {
    // Legacy string format - convert to v2.0
    const migrated = convertLegacyStringToV2(combinePositionsRaw);
    setCombinePositions(migrated);
  }
}
```

---

## Real-World Examples

### Example 1: Simple AC Coupling (Solar + Tesla Powerwall 3)

**Scenario:**
- System 1: 10kW microinverter solar array
- System 2: Tesla Powerwall 3 battery
- System 1 feeds into System 2's AC input
- System 2 connects to Main Panel

**JSON Value:**
```json
{
  "version": "2.0",
  "combine_systems": true,
  "active_systems": [1, 2],
  "system_landings": {
    "system1": "AC Input: System 2 (PowerWall)",
    "system2": "Main Panel",
    "system3": null,
    "system4": null
  },
  "connections": [
    {
      "from": "System 1",
      "to": "AC Input: System 2 (PowerWall)",
      "type": "ac_couple"
    },
    {
      "from": "System 2",
      "to": "Main Panel",
      "type": "direct"
    }
  ],
  "combiner_panels": [],
  "ac_coupling": [
    {
      "source": 1,
      "target": 2,
      "inverter": "AC Input: System 2 (PowerWall)"
    }
  ],
  "sms_connections": [],
  "sub_panel_b": {
    "exists": false,
    "type": null,
    "bus_rating": "",
    "main_breaker_rating": "",
    "feeder_location": "",
    "derated": null,
    "upstream_breaker_rating": ""
  },
  "completed_systems": [1, 2],
  "current_step": 0,
  "timestamp": "2026-01-15T14:30:45.123Z"
}
```

---

### Example 2: Combiner Panel Configuration

**Scenario:**
- System 1: 8kW string inverter solar
- System 2: 6kW microinverter solar
- Both systems connect to a shared combiner panel
- Combiner panel connects to Main Panel

**JSON Value:**
```json
{
  "version": "2.0",
  "combine_systems": true,
  "active_systems": [1, 2],
  "system_landings": {
    "system1": "Combiner Panel (New)",
    "system2": "Combiner Panel (Same as System 1)",
    "system3": null,
    "system4": null
  },
  "connections": [
    {
      "from": "System 1",
      "to": "Combiner Panel (New)",
      "type": "combine"
    },
    {
      "from": "System 2",
      "to": "Combiner Panel (Same as System 1)",
      "type": "combine"
    }
  ],
  "combiner_panels": [
    {
      "id": "combiner_1_2",
      "connects_to": "Main Panel",
      "systems_connected": ["System 1", "System 2"]
    }
  ],
  "ac_coupling": [],
  "sms_connections": [],
  "sub_panel_b": {
    "exists": false,
    "type": null,
    "bus_rating": "",
    "main_breaker_rating": "",
    "feeder_location": "",
    "derated": null,
    "upstream_breaker_rating": ""
  },
  "completed_systems": [1, 2],
  "current_step": 0,
  "timestamp": "2026-01-15T15:20:10.789Z"
}
```

---

### Example 3: Complex Multi-System with SMS and Sub Panel B

**Scenario:**
- System 1: Solar → SMS of System 2
- System 2: LG Chem RESU battery with SMS → Main Panel
- System 3: Solar → Sub Panel B (new)
- System 4: Franklin aPower battery → Main Panel

**JSON Value:**
```json
{
  "version": "2.0",
  "combine_systems": true,
  "active_systems": [1, 2, 3, 4],
  "system_landings": {
    "system1": "SMS: System 2 (LG Chem RESU)",
    "system2": "Main Panel",
    "system3": "Sub Panel B (Add)",
    "system4": "Main Panel"
  },
  "connections": [
    {
      "from": "System 1",
      "to": "SMS: System 2 (LG Chem RESU)",
      "type": "sms_connection"
    },
    {
      "from": "System 2",
      "to": "Main Panel",
      "type": "direct"
    },
    {
      "from": "System 3",
      "to": "Sub Panel B (Add)",
      "type": "direct"
    },
    {
      "from": "System 4",
      "to": "Main Panel",
      "type": "direct"
    }
  ],
  "combiner_panels": [],
  "ac_coupling": [],
  "sms_connections": [
    {
      "source": 1,
      "target": 2,
      "sms": "SMS: System 2 (LG Chem RESU)"
    }
  ],
  "sub_panel_b": {
    "exists": true,
    "type": "new",
    "bus_rating": "200",
    "main_breaker_rating": "150",
    "feeder_location": "Garage",
    "derated": false,
    "upstream_breaker_rating": "200"
  },
  "completed_systems": [1, 2, 3, 4],
  "current_step": 0,
  "timestamp": "2026-01-15T16:45:30.456Z"
}
```

---

## Related Database Fields

When `ele_combine_positions` is saved, these companion fields are also set:

| Database Field | Type | Purpose | Example |
|----------------|------|---------|---------|
| `ele_combine_systems` | BOOLEAN | Simple boolean flag | `true` |
| `ele_combine_active_systems` | VARCHAR | Comma-separated list | `"1,2"` or `"1,2,3,4"` |
| `ele_combine_system_desc` | VARCHAR | Human-readable description | `"Combine 1 & 2"` |
| `sys1_landing_destination` | VARCHAR | System 1 landing | `"AC Input: System 2 (PowerWall)"` |
| `sys2_landing_destination` | VARCHAR | System 2 landing | `"Main Panel"` |
| `sys3_landing_destination` | VARCHAR | System 3 landing | `"SMS: System 4"` |
| `sys4_landing_destination` | VARCHAR | System 4 landing | `"Main Panel"` |

**Note:** The `sys{N}_landing_destination` fields are **duplicated** from the JSON for easier querying.

---

## Web App Integration

### Step 1: Build Configuration Object

```javascript
// equipmentUtils.js

export const buildCombinePositionsJSON = (
  combineSystems,
  systemLandings,
  activeSystems,
  systemDetails,
  hasSubPanelB,
  subPanelBData
) => {
  // Generate connections, combiner panels, etc.
  const configData = generateConfigurationData(
    combineSystems,
    systemLandings,
    activeSystems,
    systemDetails,
    hasSubPanelB,
    subPanelBData
  );

  // Build complete configuration object
  const fullConfig = {
    version: "2.0",
    combine_systems: combineSystems,
    active_systems: activeSystems,
    system_landings: systemLandings,
    connections: configData.connections,
    combiner_panels: configData.combiner_panels,
    ac_coupling: configData.ac_coupling,
    sms_connections: configData.sms_connections,
    sub_panel_b: {
      exists: hasSubPanelB,
      type: subPanelBData?.type || null,
      bus_rating: subPanelBData?.busAmps || "",
      main_breaker_rating: subPanelBData?.mainBreakerAmps || "",
      feeder_location: subPanelBData?.feederLocation || "",
      derated: subPanelBData?.derated || null,
      upstream_breaker_rating: subPanelBData?.upstreamBreakerAmps || "",
    },
    completed_systems: activeSystems,
    current_step: 0,
    timestamp: new Date().toISOString(),
  };

  return fullConfig;
};
```

---

### Step 2: Save to Database

```javascript
// Save combine positions to database
const saveCombineConfiguration = async (projectId, configData) => {
  // Build full configuration object
  const fullConfig = buildCombinePositionsJSON(
    configData.combineSystems,
    configData.systemLandings,
    configData.activeSystems,
    configData.systemDetails,
    configData.hasSubPanelB,
    configData.subPanelBData
  );

  // Stringify JSON
  const jsonString = JSON.stringify(fullConfig);

  // Prepare payload
  const payload = {
    ele_combine_positions: jsonString,  // ← JSON string
    ele_combine_systems: configData.combineSystems,
    ele_combine_active_systems: configData.activeSystems.join(","),
    ele_combine_system_desc: `Combine ${configData.activeSystems.join(" & ")}`,

    // Also save individual landing destinations
    sys1_landing_destination: configData.systemLandings.system1 || null,
    sys2_landing_destination: configData.systemLandings.system2 || null,
    sys3_landing_destination: configData.systemLandings.system3 || null,
    sys4_landing_destination: configData.systemLandings.system4 || null,
  };

  // API call
  const response = await fetch(`/api/project/${projectId}/system-details`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  return response.json();
};
```

---

### Step 3: Load from Database

```javascript
// Load combine positions from database
const loadCombineConfiguration = async (projectId) => {
  const response = await fetch(`/api/project/${projectId}/system-details`);
  const { data } = await response.json();

  // Parse JSON string
  if (data.ele_combine_positions) {
    try {
      const config = JSON.parse(data.ele_combine_positions);

      // Access all properties
      return {
        version: config.version,
        combineSystems: config.combine_systems,
        activeSystems: config.active_systems,
        systemLandings: config.system_landings,
        connections: config.connections,
        combinerPanels: config.combiner_panels,
        acCoupling: config.ac_coupling,
        smsConnections: config.sms_connections,
        subPanelB: config.sub_panel_b,
        completedSystems: config.completed_systems,
        currentStep: config.current_step,
        timestamp: config.timestamp,
      };
    } catch (e) {
      console.error('Failed to parse ele_combine_positions:', e);
      return null;
    }
  }

  return null;
};
```

---

## Summary

The `ele_combine_positions` field is a **JSON string** (version 2.0) that stores:

✅ **Format:** JSON object stringified with `JSON.stringify()`

✅ **Version:** `"2.0"` (always include version field)

✅ **Required Fields:** All root-level properties are required (use empty arrays `[]` or `null` as appropriate)

✅ **Companion Fields:** Always save alongside `ele_combine_systems`, `ele_combine_active_systems`, `ele_combine_system_desc`, and `sys{N}_landing_destination` fields

✅ **Parsing:** Use `JSON.parse()` when loading from database

✅ **Timestamp:** Always use ISO 8601 format (`new Date().toISOString()`)

✅ **Backwards Compatibility:** Handle legacy string formats gracefully

---

*This document is based on the mobile app codebase implementation as of January 2026.*
