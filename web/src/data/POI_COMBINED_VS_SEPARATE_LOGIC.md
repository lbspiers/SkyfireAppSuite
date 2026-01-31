# Point of Interconnection (POI) Logic - Combined vs. Separate Systems
**Complete Implementation Guide for Electrical POI Sections**

*Last Updated: 2026-01-15*

---

## Table of Contents
1. [Overview](#overview)
2. [Detection Logic](#detection-logic)
3. [Scenario 1: Systems NOT Combined](#scenario-1-systems-not-combined)
4. [Scenario 2: Systems ARE Combined](#scenario-2-systems-are-combined)
5. [Database Fields](#database-fields)
6. [Component Props](#component-props)
7. [Complete Decision Tree](#complete-decision-tree)
8. [Code Implementation](#code-implementation)
9. [Real-World Examples](#real-world-examples)

---

## Overview

The mobile app's Point of Interconnection (POI) sections are **conditionally rendered** based on whether multiple systems are combined or kept separate. The rendering logic determines:

- **How many POI sections to show** (1 combined vs. multiple separate)
- **What title each section displays**
- **Which database fields are used** for each section
- **What props are passed** to the POI component

---

## Detection Logic

### Primary Detection Field

**Database Field:** `ele_combine_positions`

**Type:** TEXT (JSON string or "Do Not")

**Detection Logic:**
```typescript
const isCombined = useMemo(() => {
  const combineStatus = systemDetails?.ele_combine_positions;
  if (!combineStatus || !combineStatus.trim) return false;
  const trimmed = combineStatus.trim();
  // Systems are combined if ele_combine_positions has JSON (not null/empty/"Do Not")
  return trimmed.length > 0 && trimmed !== 'Do Not';
}, [systemDetails]);
```

**How It Works:**
- `ele_combine_positions` is **NULL, empty, or "Do Not"** → Systems are **NOT combined**
- `ele_combine_positions` has a **JSON string** → Systems **ARE combined**

**Three States:**
- `null` or empty: No systems configured yet (< 2 systems)
- `"Do Not"`: Default when 2+ systems exist, or user explicitly chose "Do Not Combine"
- JSON string: User chose "Combine" and configured it

**Auto-Save Behavior:**
- When 2+ systems are detected, `ele_combine_positions` is automatically set to `"Do Not"` if it's currently null/empty
- This provides a clear default state that can be overwritten when user clicks "Combine"

---

### Active Systems Detection

**Field:** Active systems are detected by parsing `ele_combine_positions` JSON or checking for equipment data

```typescript
// Parse active systems from combine positions
const combinePositions = systemDetails?.ele_combine_positions
  ? JSON.parse(systemDetails.ele_combine_positions)
  : null;

const activeSystems = combinePositions?.active_systems || [];
// Example: [1, 2] or [1, 2, 3, 4]
```

---

## Scenario 1: Systems NOT Combined

### When Does This Occur?

- `isCombined === false` (ele_combine_positions is NULL/empty or "Do Not")
- Multiple systems have equipment configured
- User clicked "Do Not Combine" button (sets `ele_combine_positions = "Do Not"`)

---

### Rendering Behavior

**Number of POI Sections:** **One per active system**

**Section Titles:**
- System 1: `"POI - System 1"`
- System 2: `"POI - System 2"`
- System 3: `"POI - System 3"`
- System 4: `"POI - System 4"`

---

### Code Implementation

**File:** `src/screens/Project/electrical/Electrical.tsx` (Lines 411-494)

```typescript
// ── SCENARIO: Multiple systems NOT combined ──
activeSystems.map((systemNumber) => {
  // Map system number to POI location field
  const poiLocations = [
    poiLocation,   // ele_breaker_location (System 1)
    poiLocation2,  // sys2_ele_breaker_location (System 2)
    poiLocation3,  // sys3_ele_breaker_location (System 3)
    poiLocation4   // sys4_ele_breaker_location (System 4)
  ];
  const currentPoiLocation = poiLocations[systemNumber - 1] || "";

  // Map system number to PCS amps field
  const pcsAmpsValues = [
    pcsAmps,   // sys1_pcs_amps
    pcsAmps2,  // sys2_pcs_amps
    pcsAmps3,  // sys3_pcs_amps
    pcsAmps4   // sys4_pcs_amps
  ];
  const currentPcsAmps = pcsAmpsValues[systemNumber - 1] || "";

  return (
    <PointOfInterconnectionSection
      key={`poi-system-${systemNumber}`}
      systemNumber={systemNumber}        // 1, 2, 3, or 4
      isCombinedSystem={false}          // ← NOT combined
      poiType={poiType}                 // Shared POI type
      poiLocation={currentPoiLocation}  // Per-system location
      pcsAmps={currentPcsAmps}          // Per-system PCS
      breakerRating={breakerRating}     // Shared breaker rating
      disconnectRating={disconnectRating} // Shared disconnect rating
      onPoiLocationChange={(v) => {
        // Save to correct field based on systemNumber
        if (systemNumber === 1) setPoiLocation(v);
        if (systemNumber === 2) setPoiLocation2(v);
        if (systemNumber === 3) setPoiLocation3(v);
        if (systemNumber === 4) setPoiLocation4(v);
      }}
      onPcsAmpsChange={(v) => {
        // Save to correct PCS field based on systemNumber
        if (systemNumber === 1) setPcsAmps(v);
        if (systemNumber === 2) setPcsAmps2(v);
        if (systemNumber === 3) setPcsAmps3(v);
        if (systemNumber === 4) setPcsAmps4(v);
      }}
      // ... other props
    />
  );
})
```

---

### Database Fields Used

#### POI Location (Per System):
| System | Database Field | State Variable |
|--------|----------------|----------------|
| System 1 | `ele_breaker_location` | `poiLocation` |
| System 2 | `sys2_ele_breaker_location` | `poiLocation2` |
| System 3 | `sys3_ele_breaker_location` | `poiLocation3` |
| System 4 | `sys4_ele_breaker_location` | `poiLocation4` |

#### PCS Amps (Per System):
| System | Database Field | State Variable |
|--------|----------------|----------------|
| System 1 | `sys1_pcs_amps` | `pcsAmps` |
| System 2 | `sys2_pcs_amps` | `pcsAmps2` |
| System 3 | `sys3_pcs_amps` | `pcsAmps3` |
| System 4 | `sys4_pcs_amps` | `pcsAmps4` |

#### POI Type (Per System or Shared):
| System | Database Field | State Variable | Notes |
|--------|----------------|----------------|-------|
| System 1 | `ele_method_of_interconnection` | `poiType` | Also used when systems are combined |
| System 2 | `sys2_ele_method_of_interconnection` | `poiType2` | Only used when NOT combined |
| System 3 | `sys3_ele_method_of_interconnection` | `poiType3` | Only used when NOT combined |
| System 4 | `sys4_ele_method_of_interconnection` | `poiType4` | Only used when NOT combined |

#### Shared Breaker/Disconnect Ratings (Used by All Systems):
| Purpose | Database Field | State Variable |
|---------|----------------|----------------|
| Breaker Rating | `el_poi_breaker_rating` | `breakerRating` |
| Disconnect Rating | `el_poi_disconnect_rating` | `disconnectRating` |

---

### Visual Example

**Two Systems, NOT Combined:**
```
┌────────────────────────────────────────────┐
│ POI - System 1                             │
├────────────────────────────────────────────┤
│ POI Type: [PV Breaker (OCPD) ▼]          │  ← ele_method_of_interconnection
│ POI Location: [Main Panel ▼]              │  ← ele_breaker_location
│ Breaker Rating: [60A ▼]                   │
│ Disconnect Rating: [60A ▼]                │
│ PCS Amps: [48 ▼]                          │  ← sys1_pcs_amps
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│ POI - System 2                             │
├────────────────────────────────────────────┤
│ POI Type: [Line Side Tap ▼]              │  ← sys2_ele_method_of_interconnection
│ POI Location: [Sub Panel B ▼]             │  ← sys2_ele_breaker_location
│ Breaker Rating: [60A ▼]                   │
│ Disconnect Rating: [60A ▼]                │
│ PCS Amps: [40 ▼]                          │  ← sys2_pcs_amps
└────────────────────────────────────────────┘
```

---

## Scenario 2: Systems ARE Combined

### When Does This Occur?

- `isCombined === true` (ele_combine_positions contains JSON string)
- Systems 1 AND 2 are both active
- User clicked "Combine Systems" button

---

### Rendering Behavior

**Number of POI Sections:** **One combined section** (replaces System 1 & 2 individual sections)

**Section Title:** `"POI - Combined Systems 1 & 2"`

**Important:** Only System 1's database fields are used for the combined POI

---

### Code Implementation

**File:** `src/screens/Project/electrical/Electrical.tsx` (Lines 319-410)

```typescript
// ── SCENARIO: Systems 1 & 2 are COMBINED ──
isCombined && activeSystems.includes(1) && activeSystems.includes(2) ? (
  (() => {
    // Detect battery in either system
    const hasBatterySys1 = !!(
      systemDetails?.sys1_battery1_make ||
      systemDetails?.sys1_battery1_model
    );
    const hasBatterySys2 = !!(
      systemDetails?.sys2_battery1_make ||
      systemDetails?.sys2_battery1_model
    );
    const hasBattery = hasBatterySys1 || hasBatterySys2;

    return (
      <PointOfInterconnectionSection
        key="poi-combined-1-2"
        systemNumber={1}                     // Set to 1 (but labeled as combined)
        isCombinedSystem={true}              // ← IS combined
        combineMethod={systemDetails?.ele_combine_positions || ""} // Pass full JSON
        poiType={poiType}                    // Shared POI type
        poiLocation={poiLocation}            // ← Uses System 1 field (ele_breaker_location)
        pcsAmps={pcsAmps}                    // ← Uses System 1 field (sys1_pcs_amps)
        breakerRating={breakerRating}        // Shared breaker rating
        disconnectRating={disconnectRating}  // Shared disconnect rating
        hasBattery={hasBattery}              // OR'd from both systems
        onPoiLocationChange={setPoiLocation} // Saves to System 1 field
        onPcsAmpsChange={setPcsAmps}         // Saves to System 1 field
        mpaAllowableBackfeed={mpaAllowableBackfeed}
        spbAllowableBackfeed={spbAllowableBackfeed}
        // ... other props
      />
    );
  })()
) : null
```

---

### Database Fields Used

**All Combined POI Data Uses System 1 Fields:**

| Purpose | Database Field | State Variable | Notes |
|---------|----------------|----------------|-------|
| POI Type | `ele_method_of_interconnection` | `poiType` | System 1 field stores combined POI type |
| POI Location | `ele_breaker_location` | `poiLocation` | System 1 field stores combined location |
| PCS Amps | `sys1_pcs_amps` | `pcsAmps` | System 1 field stores combined PCS |
| Breaker Rating | `el_poi_breaker_rating` | `breakerRating` | Shared field |
| Disconnect Rating | `el_poi_disconnect_rating` | `disconnectRating` | Shared field |
| Combine Config | `ele_combine_positions` | (JSON) | Passed as `combineMethod` prop |

**Important:** System 2's fields (`sys2_ele_method_of_interconnection`, `sys2_ele_breaker_location`, `sys2_pcs_amps`) are **NOT used** when systems are combined.

---

### Visual Example

**Two Systems, Combined:**
```
┌────────────────────────────────────────────┐
│ POI - Combined Systems 1 & 2               │
├────────────────────────────────────────────┤
│ POI Type: Utility                          │
│ POI Location: [Main Panel ▼]              │  ← ele_breaker_location (System 1 field)
│ Breaker Rating: [100A ▼]                  │
│ Disconnect Rating: [100A ▼]               │
│ PCS Amps: [88 ▼]                          │  ← sys1_pcs_amps (System 1 field)
│                                            │
│ Combined Max Continuous Output: 138A      │  ← Calculated from both systems
└────────────────────────────────────────────┘

(No separate System 2 POI section)
```

---

## Database Fields

### Complete Field Reference

#### Shared Breaker/Disconnect Fields (Used by All Configurations):
```
el_poi_breaker_rating            (INTEGER) - Main breaker rating in amps
el_poi_disconnect_rating         (INTEGER) - Fused AC disconnect rating
el_mca_system_back_feed          (INTEGER) - MCA system backfeed
```

#### Per-System POI Type:
```
ele_method_of_interconnection         (TEXT) - System 1 POI type (or combined if combined)
sys2_ele_method_of_interconnection    (TEXT) - System 2 POI type (only if NOT combined)
sys3_ele_method_of_interconnection    (TEXT) - System 3 POI type (only if NOT combined)
sys4_ele_method_of_interconnection    (TEXT) - System 4 POI type (only if NOT combined)

Values: "PV Breaker (OCPD)", "Line (Supply) Side Tap", "Load Side Tap",
        "Lug Kit", "Meter Collar Adapter", "Solar Ready"
```

#### Per-System POI Location:
```
ele_breaker_location             (TEXT)    - System 1 POI location (or combined if combined)
sys2_ele_breaker_location        (TEXT)    - System 2 POI location (only if NOT combined)
sys3_ele_breaker_location        (TEXT)    - System 3 POI location
sys4_ele_breaker_location        (TEXT)    - System 4 POI location
```

#### Per-System PCS (Power Control System) Amps:
```
sys1_pcs_amps                    (INTEGER) - System 1 PCS amps (or combined if combined)
sys2_pcs_amps                    (INTEGER) - System 2 PCS amps (only if NOT combined)
sys3_pcs_amps                    (INTEGER) - System 3 PCS amps
sys4_pcs_amps                    (INTEGER) - System 4 PCS amps
```

#### Per-System PCS Settings Flags:
```
sys1_pcs_settings                (BOOLEAN) - System 1 PCS enabled
sys2_pcs_settings                (BOOLEAN) - System 2 PCS enabled
sys3_pcs_settings                (BOOLEAN) - System 3 PCS enabled
sys4_pcs_settings                (BOOLEAN) - System 4 PCS enabled
```

#### Combination Configuration:
```
ele_combine_positions            (TEXT)    - JSON string with complete combination config
ele_combine_systems              (BOOLEAN) - Simple boolean flag (true if combined)
ele_combine_active_systems       (VARCHAR) - Comma-separated list (e.g., "1,2")
```

---

## Component Props

### PointOfInterconnectionSection Props

**File:** `src/screens/Project/electrical/sections/PointOfInterconnection.tsx`

```typescript
export interface PointOfInterconnectionSectionProps {
  systemNumber?: number;                    // 1-4 (or undefined for legacy/single system)
  isCombinedSystem?: boolean;               // true = combined, false = separate
  combineMethod?: string;                   // JSON string from ele_combine_positions

  // POI Configuration
  poiType: string;                          // "Utility", "Generator", etc.
  onPoiTypeChange: (value: string) => void;

  // POI Location
  poiLocation: string;                      // Landing location string
  onPoiLocationChange: (value: string) => void;

  // Breaker & Disconnect
  breakerRating: string;
  onBreakerRatingChange: (value: string) => void;
  disconnectRating: string;
  onDisconnectRatingChange: (value: string) => void;

  // PCS (Power Control System)
  pcsAmps?: string;                         // PCS setting in amps
  onPcsAmpsChange?: (value: string) => void;

  // Backfeed Calculations
  mpaAllowableBackfeed?: number;            // Main Panel A allowable backfeed
  spbAllowableBackfeed?: number;            // Sub Panel B allowable backfeed

  // System Details
  hasBattery?: boolean;                     // Determines PCS visibility
  solarPanelMake?: string;
  solarPanelModel?: string;
  inverterMake?: string;
  inverterModel?: string;
  systemType?: string;                      // "microinverter" or "inverter"

  // UI Control
  totalActiveSystems?: number;              // Hide system labels if only 1 system
  errors?: { poiType?: string };

  // Additional
  projectId?: string;
  companyId?: string;
  onOpenGallery?: (sectionLabel: string) => void;
}
```

---

### Section Title Logic

**File:** `src/screens/Project/electrical/sections/PointOfInterconnection.tsx` (Lines 117-122)

```typescript
// Dynamic section label based on props
const sectionLabel = isCombinedSystem
  ? "POI - Combined Systems 1 & 2"          // Combined scenario
  : systemNumber
  ? `POI - System ${systemNumber}`          // Separate systems (1, 2, 3, 4)
  : "Point of Interconnection";             // Legacy/single system
```

---

## Complete Decision Tree

**File:** `src/screens/Project/electrical/Electrical.tsx` (Lines 300-494)

```
START: Determine POI Rendering
       ↓
┌──────────────────────────────────────────┐
│ Check: activeSystems.length              │
└──────────────────────────────────────────┘
       ↓
    length === 0?
       │
       ├─ YES → Render Single POI (No System Number)
       │        ├─ Title: "Point of Interconnection"
       │        ├─ isCombinedSystem: undefined
       │        ├─ systemNumber: undefined
       │        └─ Uses: ele_breaker_location, sys1_pcs_amps
       │
       └─ NO → Continue...
              ↓
       ┌──────────────────────────────────────────┐
       │ Check: isCombined && activeSystems       │
       │        includes(1) && includes(2)        │
       └──────────────────────────────────────────┘
              ↓
           YES?
              │
              ├─ YES → Render ONE Combined POI Section
              │        ├─ Title: "POI - Combined Systems 1 & 2"
              │        ├─ isCombinedSystem: true
              │        ├─ systemNumber: 1
              │        ├─ combineMethod: ele_combine_positions JSON
              │        ├─ Uses: ele_breaker_location (System 1)
              │        ├─ Uses: sys1_pcs_amps (System 1)
              │        ├─ Battery: hasBatterySys1 || hasBatterySys2
              │        └─ System 2 fields NOT used
              │
              └─ NO → Render Multiple POI Sections (One Per System)
                     ↓
                  For each systemNumber in activeSystems:
                     │
                     ├─ System 1:
                     │  ├─ Title: "POI - System 1"
                     │  ├─ isCombinedSystem: false
                     │  ├─ systemNumber: 1
                     │  ├─ Uses: ele_breaker_location
                     │  └─ Uses: sys1_pcs_amps
                     │
                     ├─ System 2:
                     │  ├─ Title: "POI - System 2"
                     │  ├─ isCombinedSystem: false
                     │  ├─ systemNumber: 2
                     │  ├─ Uses: sys2_ele_breaker_location
                     │  └─ Uses: sys2_pcs_amps
                     │
                     ├─ System 3:
                     │  ├─ Title: "POI - System 3"
                     │  ├─ isCombinedSystem: false
                     │  ├─ systemNumber: 3
                     │  ├─ Uses: sys3_ele_breaker_location
                     │  └─ Uses: sys3_pcs_amps
                     │
                     └─ System 4:
                        ├─ Title: "POI - System 4"
                        ├─ isCombinedSystem: false
                        ├─ systemNumber: 4
                        ├─ Uses: sys4_ele_breaker_location
                        └─ Uses: sys4_pcs_amps
```

---

## Code Implementation

### Save POI Data

**File:** `src/screens/Project/electrical/services/electricalPersistence.ts` (Lines 205-261)

```typescript
export async function savePOI(
  projectUuid: string,
  args: {
    // Shared POI fields
    poiType?: string;                   // → ele_method_of_interconnection
    breakerRating?: number | string;    // → el_poi_breaker_rating
    disconnectRating?: number | string; // → el_poi_disconnect_rating

    // Per-system POI locations
    poiLocation?: string;               // → ele_breaker_location (System 1)
    poiLocation2?: string;              // → sys2_ele_breaker_location (System 2)
    poiLocation3?: string;              // → sys3_ele_breaker_location (System 3)
    poiLocation4?: string;              // → sys4_ele_breaker_location (System 4)

    // Per-system PCS amps
    pcsAmps?: number | string;          // → sys1_pcs_amps (System 1)
    pcsAmps2?: number | string;         // → sys2_pcs_amps (System 2)
    pcsAmps3?: number | string;         // → sys3_pcs_amps (System 3)
    pcsAmps4?: number | string;         // → sys4_pcs_amps (System 4)
  }
) {
  const payload = {
    ele_method_of_interconnection: args.poiType,
    el_poi_breaker_rating: args.breakerRating,
    el_poi_disconnect_rating: args.disconnectRating,
    ele_breaker_location: args.poiLocation,
    sys2_ele_breaker_location: args.poiLocation2,
    sys3_ele_breaker_location: args.poiLocation3,
    sys4_ele_breaker_location: args.poiLocation4,
    sys1_pcs_amps: args.pcsAmps,
    sys2_pcs_amps: args.pcsAmps2,
    sys3_pcs_amps: args.pcsAmps3,
    sys4_pcs_amps: args.pcsAmps4,
  };

  await updateProject(projectUuid, payload);
}
```

---

## Real-World Examples

### Example 1: Two Separate Systems

**Configuration:**
- System 1: 10kW solar on Main Panel
- System 2: 8kW solar on Sub Panel B
- NOT combined

**Database Values:**
```json
{
  "ele_combine_positions": null,
  "ele_method_of_interconnection": "PV Breaker (OCPD)",
  "sys2_ele_method_of_interconnection": "Line (Supply) Side Tap",
  "ele_breaker_location": "Main Panel",
  "sys2_ele_breaker_location": "Sub Panel B",
  "el_poi_breaker_rating": 60,
  "el_poi_disconnect_rating": 60,
  "sys1_pcs_amps": 48,
  "sys2_pcs_amps": 40
}
```

**UI Rendering:**
- **Section 1:** "POI - System 1" → PV Breaker (OCPD), Main Panel, PCS 48A
- **Section 2:** "POI - System 2" → Line (Supply) Side Tap, Sub Panel B, PCS 40A

---

### Example 2: Two Combined Systems

**Configuration:**
- System 1: 10kW microinverters
- System 2: Tesla Powerwall 3
- System 1 feeds into System 2's AC input
- Combined at Main Panel

**Database Values:**
```json
{
  "ele_combine_positions": "{\"version\":\"2.0\",\"combine_systems\":true,\"active_systems\":[1,2],...}",
  "ele_method_of_interconnection": "PV Breaker (OCPD)",
  "sys2_ele_method_of_interconnection": null,
  "ele_breaker_location": "Main Panel",
  "sys2_ele_breaker_location": null,
  "el_poi_breaker_rating": 100,
  "el_poi_disconnect_rating": 100,
  "sys1_pcs_amps": 88,
  "sys2_pcs_amps": null
}
```

**UI Rendering:**
- **Section 1 (Combined):** "POI - Combined Systems 1 & 2" → Main Panel, PCS 88A
- **(No System 2 section)**

---

### Example 3: Four Separate Systems

**Configuration:**
- System 1: Solar on Main Panel
- System 2: Solar on Sub Panel B
- System 3: Battery on Main Panel
- System 4: Battery on Sub Panel B
- NOT combined

**Database Values:**
```json
{
  "ele_combine_positions": null,
  "ele_method_of_interconnection": "PV Breaker (OCPD)",
  "sys2_ele_method_of_interconnection": "PV Breaker (OCPD)",
  "sys3_ele_method_of_interconnection": "Load Side Tap",
  "sys4_ele_method_of_interconnection": "Load Side Tap",
  "ele_breaker_location": "Main Panel",
  "sys2_ele_breaker_location": "Sub Panel B",
  "sys3_ele_breaker_location": "Main Panel",
  "sys4_ele_breaker_location": "Sub Panel B",
  "el_poi_breaker_rating": 60,
  "el_poi_disconnect_rating": 60,
  "sys1_pcs_amps": 40,
  "sys2_pcs_amps": 35,
  "sys3_pcs_amps": 48,
  "sys4_pcs_amps": 48
}
```

**UI Rendering:**
- **Section 1:** "POI - System 1" → Main Panel, PCS 40A
- **Section 2:** "POI - System 2" → Sub Panel B, PCS 35A
- **Section 3:** "POI - System 3" → Main Panel, PCS 48A
- **Section 4:** "POI - System 4" → Sub Panel B, PCS 48A

---

## Summary Table

| Aspect | NOT Combined | Combined (Sys 1 & 2) |
|--------|-------------|----------------------|
| **Detection** | `ele_combine_positions` is NULL/empty | `ele_combine_positions` has JSON string |
| **Sections Rendered** | 1-4 sections (one per system) | 1 combined section |
| **Section Titles** | "POI - System 1/2/3/4" | "POI - Combined Systems 1 & 2" |
| **isCombinedSystem Flag** | `false` | `true` |
| **POI Type Field** | `ele_method_of_interconnection`, `sys2_ele_method_of_interconnection`, etc. | `ele_method_of_interconnection` only (System 1) |
| **POI Location Field** | `ele_breaker_location`, `sys2_ele_breaker_location`, etc. | `ele_breaker_location` only (System 1) |
| **PCS Amps Field** | `sys1_pcs_amps`, `sys2_pcs_amps`, etc. | `sys1_pcs_amps` only (System 1) |
| **Battery Detection** | Per-system | OR'd from both systems |
| **System 2 Fields Used** | Yes (sys2_ele_method_of_interconnection, sys2_ele_breaker_location, sys2_pcs_amps) | No (ignored when combined) |

---

## Web App Implementation Checklist

### ✅ Detection Logic
- [ ] Check `ele_combine_positions` field (NULL/empty = not combined)
- [ ] Parse `ele_combine_positions` JSON to get `active_systems` array
- [ ] Set `isCombined` flag based on field presence

### ✅ NOT Combined Scenario
- [ ] Render one POI section per active system
- [ ] Set `isCombinedSystem={false}` for each section
- [ ] Use correct database field per system:
  - [ ] System 1: `ele_method_of_interconnection`, `ele_breaker_location`, `sys1_pcs_amps`
  - [ ] System 2: `sys2_ele_method_of_interconnection`, `sys2_ele_breaker_location`, `sys2_pcs_amps`
  - [ ] System 3: `sys3_ele_method_of_interconnection`, `sys3_ele_breaker_location`, `sys3_pcs_amps`
  - [ ] System 4: `sys4_ele_method_of_interconnection`, `sys4_ele_breaker_location`, `sys4_pcs_amps`
- [ ] Display titles: "POI - System 1", "POI - System 2", etc.

### ✅ Combined Scenario
- [ ] Render ONE combined POI section
- [ ] Set `isCombinedSystem={true}`
- [ ] Pass `combineMethod={ele_combine_positions}` JSON string
- [ ] Use System 1 fields only:
  - [ ] `ele_method_of_interconnection` for POI type
  - [ ] `ele_breaker_location` for POI location
  - [ ] `sys1_pcs_amps` for PCS amps
- [ ] Display title: "POI - Combined Systems 1 & 2"
- [ ] Detect battery from BOTH systems (OR'd)

### ✅ Shared Fields (Both Scenarios)
- [ ] `el_poi_breaker_rating` (breaker rating)
- [ ] `el_poi_disconnect_rating` (disconnect rating)

---

*This document is based on the mobile app codebase implementation as of January 2026.*
