# Skyfire Solar Design Platform
## Complete Developer Training & Architecture Document

**Version:** 1.0  
**Date:** January 30, 2026  
**Author:** Claude (for Logan, Lead Developer)  
**Purpose:** Comprehensive onboarding document for the unified Skyfire Apps project

---

# Table of Contents

1. [Company & Product Overview](#1-company--product-overview)
2. [The Unified Apps Initiative](#2-the-unified-apps-initiative)
3. [Web Application Architecture](#3-web-application-architecture)
4. [Mobile Application Context](#4-mobile-application-context)
5. [Database Architecture](#5-database-architecture)
6. [Design System & Tokens](#6-design-system--tokens)
7. [Component Patterns](#7-component-patterns)
8. [BOS (Balance of System) Engine](#8-bos-balance-of-system-engine)
9. [Real-Time Features (Socket.io)](#9-real-time-features-socketio)
10. [API Architecture](#10-api-architecture)
11. [Key Business Logic](#11-key-business-logic)
12. [Development Standards](#12-development-standards)
13. [The 30-Hour Migration Plan](#13-the-30-hour-migration-plan)
14. [Known Issues & Technical Debt](#14-known-issues--technical-debt)
15. [Future Roadmap](#15-future-roadmap)

---

# 1. Company & Product Overview

## What is Skyfire Solar Design?

Skyfire is a **comprehensive solar project management platform** designed to be a "one platform to rule them all" solution for solar installers. The core mission is to **collapse the time from point of sale to installation and permit-to-operate (PTO)** by integrating:

- Sales tools
- Project management
- Messaging/collaboration (Chatter)
- Site survey capture (mobile app)
- Plan set design & generation
- Permit submission workflows
- Utility interconnection management
- Equipment catalog & BOS auto-population
- Drafter portal for outsourced design work

## Core Design Philosophy

> **"Fewest clicks from A to B"** and **"Only show what's needed when it's needed"**

The goal is to create the **easiest plan set design tool in the industry** where complex solar configurations can be entered quickly and accurately.

## Key Stakeholders

### Business Partners (via webhook integrations)
- Universal Solar Direct
- EnergyAid  
- Inty Power
- Contact: Yama (webhook integrations), Richie (data partnerships)

### Utility Companies (drive BOS requirements)
- **APS** - Arizona Public Service
- **SRP** - Salt River Project
- **TEP** - Tucson Electric Power
- **TRICO** - Trico Electric Cooperative
- **Xcel Energy** (Colorado)
- **Oncor** (Texas)

### User Roles
- **Super Admin** - Full system access (Logan, Eli Escobedo)
- **Company Admin** - Manages company users and projects
- **Member** - Standard user with project access
- **Drafter** - External contractors who design plan sets
- **Viewer** - Read-only access

---

# 2. The Unified Apps Initiative

## The Problem

The mobile app (React Native) and web app (React) have been maintained as completely separate codebases. After Android's push for 16kb pages, a massive React Native upgrade was required along with ~60 library updates. This broke Android, and iOS is now out of sync.

## The Solution: Restructured Monorepo

Instead of rebuilding from scratch, we're **restructuring and reskinning** existing working code:

```
/skyfire-apps/
├── web/                    # Existing React web app (move here)
├── mobile-android/         # Existing RN app, Android-focused
├── mobile-ios/             # Fork of RN app, iOS-focused  
├── shared/                 # Extracted shared code
│   ├── tokens/             # Design tokens (colors, spacing)
│   ├── types/              # TypeScript interfaces
│   ├── constants/          # Equipment types, BOS constants
│   └── utils/              # Pure validation/calculation functions
└── docs/
    └── component-mapping.md
```

## Why Separate Android/iOS?

1. **Platform-specific builds eliminate conditional hell** - No more `Platform.OS === 'ios' ? ... : ...` scattered everywhere
2. **Independent stabilization** - Fix Android without breaking iOS
3. **Optimized for each platform** - Android gets Material Design, iOS gets native feel
4. **Simpler CI/CD** - Three separate pipelines, clear separation

## The 30-Hour Sprint Approach

This is NOT a rebuild. It's:
1. **Hour 1-2:** Restructure folders, update git remotes
2. **Hour 3-6:** Fix Android build post-upgrade
3. **Hour 7-12:** Reskin Android to match current web design tokens
4. **Hour 13-18:** Fork to iOS, adjust iOS-specific configs
5. **Hour 19-30:** Sync features using Claude Code to translate web → mobile

## Claude Code Workflow

With all apps in one workspace, you can prompt:

```
"Review web/src/components/project/equipment/BOSPanel.js and implement 
equivalent functionality in mobile-android/src/screens/equipment/BOSScreen.tsx.
Use shared/tokens for styling. Match the behavior exactly but optimize 
for Android UI patterns."
```

---

# 3. Web Application Architecture

## Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18+ with TypeScript |
| Routing | React Router v6 |
| State | React Hooks (useState, useEffect, useCallback, useReducer) |
| HTTP Client | Axios with JWT interceptors |
| Real-time | Socket.io Client |
| Data Grid | AG Grid Community |
| Styling | CSS Modules exclusively |
| Design Tokens | CSS Custom Properties (tokens.css) |
| Animations | Framer Motion + CSS transitions |
| Build | Create React App (with config-overrides.js) |
| PWA | Service Worker at skyfireapp.io |

## Directory Structure

```
src/
├── api/                    # TypeScript API layer
│   ├── axiosInstance.ts    # Configured axios with auth
│   └── types.ts            # API response types
│
├── assets/
│   └── icons/              # Custom SVG icons
│
├── components/
│   ├── account/            # User profile, settings
│   ├── Admin/              # Super admin panels
│   ├── auth/               # Login, register, invite redemption
│   ├── chatter/            # Messaging system (21+ files)
│   ├── checklist/          # QC checklists
│   ├── common/             # Shared UI components
│   ├── dashboard/          # Main dashboard views
│   ├── dev/                # Developer portal
│   ├── equipment/          # Equipment modals
│   ├── fordje/             # Fordje integration
│   ├── maps/               # Google Maps, azimuth finder
│   ├── modals/             # Global modals
│   ├── pdf/                # PDF viewer, annotations
│   ├── powerclerk/         # PowerClerk integration (coming)
│   ├── project/            # Main project forms (largest section)
│   │   ├── electrical/     # Electrical form sections
│   │   ├── equipment/      # Equipment form sections
│   │   │   ├── inline-bos/ # Inline BOS components
│   │   │   └── storage/    # Battery/SMS sections
│   │   ├── structural/     # Structural form sections
│   │   ├── submit/         # Order submission
│   │   └── survey/         # Site survey report
│   ├── revisions/          # Revision request system
│   ├── scheduling/         # Calendar/scheduling
│   ├── solarapp/           # SolarAPP+ integration
│   ├── support/            # Help/support panels
│   ├── survey/             # Survey tools
│   ├── tasks/              # Task management
│   ├── Team/               # Team management
│   └── ui/                 # 31+ reusable UI components
│
├── config/
│   ├── api.js              # API base URL config
│   ├── axios.js            # Axios instance setup
│   ├── google.js           # Google Maps API config
│   └── keyboardShortcuts.js
│
├── constants/
│   ├── bosConstants.ts     # BOS equipment constants
│   ├── bosEquipmentCatalog.ts  # 200+ equipment items
│   ├── bosFieldPatterns.js # Database field patterns
│   ├── equipmentCategories.js
│   ├── photoSections.js    # Survey photo categories
│   ├── pricing.js          # Service pricing
│   ├── scheduleConstants.js
│   └── utilityBOSRequirements.ts  # Per-utility BOS rules
│
├── contexts/
│   ├── DevNotesContext.js
│   └── UploadContext.js
│
├── hooks/
│   ├── useBOSData.ts       # BOS equipment management
│   ├── useChatter.js       # Messaging data
│   ├── useDashboardData.js
│   ├── useEquipmentCatalog.js
│   ├── useEquipmentData.ts
│   ├── useEquipmentForm.ts
│   ├── useGoogleMaps.js
│   ├── useMediaSocket.js   # Real-time media uploads
│   ├── usePCSCalculations.ts
│   ├── useProject.ts
│   ├── useProjects.ts
│   ├── useServiceWorker.js
│   ├── useSMSForm.ts
│   ├── useSocket.js        # Main socket connection
│   ├── useSystemDetails.ts
│   └── useUserProfile.ts
│
├── layouts/
│   ├── DrafterPortalLayout.js
│   ├── DrafterSidebar.js
│   └── DrafterMobileHeader.js
│
├── pages/
│   ├── Account.js
│   ├── Admin/              # Admin pages
│   ├── Auth/               # Auth pages
│   ├── Companies.js
│   ├── Dashboard.js        # Main dashboard
│   ├── DesignPortal.js
│   ├── DevPortal.js
│   ├── DrafterPortal/      # Drafter workspace
│   ├── ExistingProjects.js
│   ├── Home.js
│   ├── InstallPortal.js
│   ├── Inventory/
│   ├── PermittingPortal.js
│   ├── Project.js          # Single project view
│   ├── ProjectAdd.js
│   ├── SalesPortal.js
│   ├── SchedulingPortal.js
│   ├── Team/
│   └── Support.js
│
├── services/
│   ├── accountAPI.ts
│   ├── analyticsService.ts
│   ├── authService.js
│   ├── bosAutoPopulationService.ts
│   ├── chatterService.js
│   ├── devLogger.js
│   ├── documentService.js
│   ├── drafterAssignmentService.js
│   ├── equipmentService.ts
│   ├── inventoryAPI.ts
│   ├── notificationService.js
│   ├── projectAPI.ts
│   ├── projectService.js
│   ├── scheduleAPI.ts
│   ├── systemDetailsAPI.ts
│   └── utilityRequirementsService.ts
│
├── store/                  # Redux store (minimal use)
│   ├── authInitializer.ts
│   ├── hooks.ts
│   ├── slices/
│   │   └── authSlice.ts
│   └── store.ts
│
├── styles/
│   ├── tokens.css          # Design tokens (CRITICAL)
│   ├── utilities.css       # Utility classes
│   ├── Dashboard_module.css
│   ├── Chatter_module.css
│   └── [component]_module.css  # Per-component styles
│
├── types/
│   ├── authTypes.ts
│   ├── bosTypes.ts
│   ├── bosConfigurationTypes.ts
│   └── inventoryTypes.ts
│
├── utils/
│   ├── bosUtils.ts                 # BOS helper functions
│   ├── bosEquipmentUtils.ts        # Equipment catalog helpers
│   ├── bosEquipmentStateExtractor.ts
│   ├── bosConfigurationSwitchboard.ts
│   ├── configurations/
│   │   ├── apsConfigurations.ts    # APS-specific BOS logic
│   │   └── genericConfigurations.ts
│   ├── errorHandling.ts
│   ├── inverterTypeDetection.ts
│   ├── pcsUtils.ts
│   ├── stringingUtils.js
│   ├── systemFieldMapping.ts
│   └── triggerPlanAutomation.js
│
├── App.js                  # Main app with routing
├── index.js                # Entry point
└── index.css               # Global styles (imports tokens.css)
```

## Key Files to Understand

### App.js
Main routing configuration. Uses React Router v6 with protected routes via `PrivateRoute` component.

### tokens.css
**CRITICAL** - All design values must come from here. Never hardcode colors, spacing, or typography.

### useSocket.js
Singleton Socket.io connection with reference counting. All real-time features use this.

### useBOSData.ts
Complex hook managing Balance of System equipment. Handles auto-population, utility requirements, and database saves.

---

# 4. Mobile Application Context

## Current State

The mobile app is a **React Native** application that was built as a unified iOS/Android codebase. It's primarily used for:

1. **Site Surveys** - Field crews capture photos, notes, measurements
2. **Project Status Updates** - Update project status on the go
3. **Photo Upload** - High-resolution photos uploaded to S3
4. **Basic Project Viewing** - View project details

## What Broke

Android 16kb page alignment requirements triggered:
- React Native upgrade to 0.76.x
- ~60 library upgrades
- Native module recompilation
- Build configuration changes

iOS is still on older versions and now incompatible with shared native modules.

## Mobile → Web Field Mapping

**CRITICAL:** Mobile apps save data to the same database as web. Field names MUST match exactly.

Example issue discovered: Mobile was trying to save to fields that didn't exist in `project_system_details`, causing silent failures.

The web app's `project_system_details` table has **1,400+ columns** and mobile must use exact field names.

## Shared Data Flow

```
Mobile App → API → PostgreSQL ← API ← Web App
     ↓                              ↓
   S3 Photos                   Plan Generation
```

---

# 5. Database Architecture

## PostgreSQL on AWS RDS

### Primary Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `solar_projects` | Project header info | uuid, company_id, status, customer info |
| `solar_project_sites` | Site/location data | address, utility, AHJ, lat/lng |
| `project_system_details` | Equipment & config | **1,400+ columns** - all system data |
| `users` | User accounts | uuid, email, company associations |
| `company` | Company entities | name, address, license info |
| `company_users` | User-company mapping | role_id, permissions |
| `roles` | Role definitions | permissions JSON |
| `equipments` | Equipment catalog | 19,000+ items |
| `spec_sheets` | Equipment spec PDFs | 487 sheets with S3 keys |

### The 1,400-Column Challenge

`project_system_details` is a **wide table** that stores all equipment configuration. This exists because:

1. Mobile app compatibility (simple flat structure)
2. Excel calculator compatibility (downstream automation)
3. Historical reasons

**PostgreSQL limit:** 1,600 columns max. We're at 1,400+.

**Solution in progress:** Normalizing sys3/sys4 system data into separate tables while maintaining backward compatibility.

### Field Naming Conventions

```
sys1_solar_panel_make        # System 1, Solar Panel, Make field
sys1_solar_panel_model       # System 1, Solar Panel, Model field
sys2_micro_inverter_qty      # System 2, Microinverter, Quantity

ele_bus_bar_rating           # Electrical, Main Panel, Bus Bar Rating
ele_main_circuit_breaker_rating

bos_sys1_type1_equipment_type  # BOS, System 1, Slot 1, Equipment Type
bos_sys1_type1_make
bos_sys1_type1_model
bos_sys1_type1_amp_rating
bos_sys1_type1_is_new
bos_sys1_type1_block_name

mp1_roof_type                # Mounting Plane 1, Roof Type
mp1_pitch
mp1_azimuth

rta_roofing_material         # Roof Type A, Roofing Material
rta_framing_size
rta_framing_spacing
```

### System Numbering

- **sys1** - Primary solar/battery system
- **sys2** - Secondary system (for split systems)
- **sys3/sys4** - Future expansion (being normalized out)

---

# 6. Design System & Tokens

## The Nuclear Option

We eliminated **2,700+ hardcoded styling violations** by:
1. Converting everything to standard tokens first
2. Selectively adjusting exceptions after

## tokens.css Structure

```css
:root {
  /* ========================================
     COLORS
     ======================================== */

  /* Brand */
  --color-primary: #FD7332;          /* Skyfire orange */
  --color-primary-dark: #B92011;
  --color-primary-light: #FF8C42;

  /* Backgrounds (Dark theme) */
  --bg-page: #0C1F3F;                /* Main page background */
  --bg-panel: #0A1628;               /* Panel/card background */
  --bg-surface: #111C2E;             /* Elevated surface */
  --bg-elevated: #213454;            /* Hover/active states */
  --bg-input: #0C1F3F;               /* Input backgrounds */
  --bg-input-hover: #2E4161;

  /* Text */
  --text-primary: #F9FAFB;           /* Main text */
  --text-secondary: #D1D5DB;         /* Secondary text */
  --text-muted: #9CA3AF;             /* Muted/disabled */

  /* Status Colors */
  --color-success: #10B981;
  --color-info: #3B82F6;
  --color-warning: #F59E0B;
  --color-error: #EF4444;

  /* Project Status Colors (match mobile) */
  --status-sales: #E6C800;
  --status-site-survey: #FFA300;
  --status-design: #FD7332;
  --status-revisions: #FF0000;
  --status-permits: #7FDB51;
  --status-install: #00E5A0;
  --status-commissioning: #00BFFF;
  --status-inspection: #9370DB;
  --status-pto: #32CD32;
  --status-on-hold: #FFD700;
  --status-canceled: #DC143C;

  /* ========================================
     SPACING (USE THESE)
     ======================================== */
  --spacing-xs: 0.25rem;             /* 4px */
  --spacing-tight: 0.5rem;           /* 8px - tabs, labels */
  --spacing-sm: 0.75rem;             /* 12px */
  --spacing: 1rem;                   /* 16px - DEFAULT */
  --spacing-md: 1.25rem;             /* 20px */
  --spacing-loose: 1.5rem;           /* 24px - sections */
  --spacing-wide: 2rem;              /* 32px - major sections */

  /* ========================================
     BORDERS
     ======================================== */
  --radius-sm: 0.25rem;              /* 4px */
  --radius-md: 0.5rem;               /* 8px - DEFAULT */
  --radius-lg: 0.75rem;              /* 12px */
  --radius-xl: 1rem;                 /* 16px */
  --radius-pill: 9999px;

  --border-subtle: rgba(255, 255, 255, 0.1);
  --border-default: rgba(255, 255, 255, 0.15);
  --border-focus: #FD7332;

  /* ========================================
     SHADOWS
     ======================================== */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.2);
  --shadow-lg: 0 10px 25px rgba(0, 0, 0, 0.3);

  --glow-blue: 0 0 20px rgba(14, 165, 233, 0.3);
  --glow-orange: 0 0 20px rgba(253, 115, 50, 0.3);

  /* ========================================
     TYPOGRAPHY
     ======================================== */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;

  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
}
```

## CSS Modules Pattern

Every component has a corresponding `.module.css` file:

```jsx
// BOSPanel.js
import styles from './BOSPanel.module.css';

function BOSPanel() {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>BOS Equipment</h2>
    </div>
  );
}
```

```css
/* BOSPanel.module.css */
.container {
  padding: var(--spacing);
  background: var(--bg-panel);
  border-radius: var(--radius-md);
}

.title {
  color: var(--text-primary);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
}
```

## NEVER DO THIS

```css
/* ❌ WRONG - Hardcoded values */
.container {
  padding: 16px;
  background: #0A1628;
  border-radius: 8px;
  color: white;
}

/* ✅ CORRECT - Design tokens */
.container {
  padding: var(--spacing);
  background: var(--bg-panel);
  border-radius: var(--radius-md);
  color: var(--text-primary);
}
```

---

# 7. Component Patterns

## UI Component Library (31+ components)

Located in `src/components/ui/`:

| Component | Purpose |
|-----------|---------|
| `Button` | Primary action button |
| `FormInput` | Text input with label |
| `FormSelect` | Dropdown select |
| `Modal` | Dialog overlay |
| `Card` | Content container |
| `Tabs` | Tab navigation |
| `Toggle` | Boolean switch |
| `Checkbox` | Multi-select |
| `Radio` | Single-select |
| `LoadingSpinner` | Loading state |
| `Alert` | Status messages |
| `Tooltip` | Hover info |
| `Drawer` | Side panel |
| `Dropdown` | Menu dropdown |
| `StatusBadge` | Status indicator |
| `Avatar` | User avatar |
| `Skeleton` | Loading placeholder |
| `Progress` | Progress bar |
| `Toast` | Notification toast |
| `EmptyState` | No data state |
| `ErrorState` | Error display |
| `ConfirmDialog` | Confirmation modal |
| `SearchableDropdown` | Searchable select |
| `CollapsibleSection` | Expandable section |
| `FormSection` | Form grouping |
| `SectionHeader` | Section title |
| `ActionButton` | Icon action |
| `AddButton` | Add item button |
| `LaunchButton` | External link button |
| `PillButton` | Pill-shaped button |
| `TripleToggle` | Three-state toggle |

## Form Pattern

```jsx
import { FormInput, FormSelect, FormSection } from '../ui';

function EquipmentForm({ data, onChange }) {
  return (
    <FormSection title="Solar Panels">
      <FormSelect
        label="Manufacturer"
        value={data.sys1_solar_panel_make}
        onChange={(e) => onChange('sys1_solar_panel_make', e.target.value)}
        options={manufacturers}
      />
      <FormInput
        label="Model"
        value={data.sys1_solar_panel_model}
        onChange={(e) => onChange('sys1_solar_panel_model', e.target.value)}
      />
      <FormInput
        type="number"
        label="Quantity"
        value={data.sys1_solar_panel_qty}
        onChange={(e) => onChange('sys1_solar_panel_qty', e.target.value)}
      />
    </FormSection>
  );
}
```

## Hook Pattern

```jsx
// Custom hook for data fetching
function useProjectData(projectUuid) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!projectUuid) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await projectAPI.getProject(projectUuid);
        setData(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectUuid]);

  return { data, loading, error, refetch: () => fetchData() };
}
```

---

# 8. BOS (Balance of System) Engine

## What is BOS?

Balance of System (BOS) equipment includes everything between the solar panels and the utility grid:
- AC Disconnects
- Fused AC Disconnects
- PV Meters (Uni-Directional)
- Bi-Directional Meters
- Load Centers
- Utility Disconnects

## Utility-Specific Requirements

Each utility (APS, SRP, TEP, etc.) has different BOS requirements. The system automatically populates BOS based on:
1. Selected utility
2. System configuration (PV-only, battery, backup)
3. Inverter type (string vs microinverter)
4. SMS (Storage Management System) presence

### APS Example

**PV-Only String Inverter:**
1. Uni-Directional Meter (production meter)
2. Uni-Directional Meter Line Side Disconnect

**AC-Coupled with Battery + SMS + Backup:**
1. Bi-Directional Meter DER Side Disconnect
2. Bi-Directional Meter
3. Utility Disconnect
4. Battery AC Disconnect
5. Backup Load Sub Panel equipment

## BOS Data Flow

```
User selects utility → detectSystemConfiguration()
                            ↓
                    determineBOSTargetSection()
                            ↓
                    getUtilityBOSRequirements()
                            ↓
                    calculateAmpRating() (NEC 1.25× rule)
                            ↓
                    Match equipment from catalog
                            ↓
                    Save to database (bos_sys1_type1_*, etc.)
```

## Key Files

- `src/constants/bosEquipmentCatalog.ts` - 200+ equipment items
- `src/constants/utilityBOSRequirements.ts` - Per-utility rules
- `src/hooks/useBOSData.ts` - Main hook
- `src/utils/bosUtils.ts` - Helper functions
- `src/utils/configurations/apsConfigurations.ts` - APS-specific logic

## Equipment Catalog Structure

```typescript
export const BOS_EQUIPMENT_CATALOG: BOSEquipmentCatalogItem[] = [
  // AC Disconnects
  { type: 'AC Disconnect', make: 'EATON', model: 'DG221NRB', amp: '30' },
  { type: 'AC Disconnect', make: 'EATON', model: 'DG222NRB', amp: '60' },
  { type: 'AC Disconnect', make: 'EATON', model: 'DG223NRB', amp: '100' },
  { type: 'AC Disconnect', make: 'SIEMENS', model: 'GNF321R', amp: '30' },
  // ... 200+ more
  
  // Fused AC Disconnects
  { type: 'Fused AC Disconnect', make: 'EATON', model: 'DH221NRK', amp: '30' },
  { type: 'Fused AC Disconnect', make: 'EATON', model: 'DH222NRK', amp: '60' },
  // ...
];
```

## Amp Sizing Rules

```typescript
// NEC requires 125% of inverter max continuous output
const minAmpRating = Math.ceil(inverterMaxContOutput * 1.25);

// Round up to standard sizes
const standardAmps = [30, 60, 100, 200, 400];
const selectedAmp = standardAmps.find(amp => amp >= minAmpRating);
```

---

# 9. Real-Time Features (Socket.io)

## Connection Architecture

```
Frontend (useSocket.js)
        ↓
    Socket.io Client
        ↓
    WebSocket / Polling
        ↓
Backend (Node.js + Socket.io Server)
        ↓
    Room-based messaging
```

## Singleton Pattern

```javascript
// useSocket.js
let socketInstance = null;
let connectionCount = 0;

const getSocket = () => {
  if (!socketInstance) {
    socketInstance = io('https://api.skyfireapp.io', {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });
  }
  connectionCount++;
  return socketInstance;
};

const releaseSocket = () => {
  connectionCount--;
  if (connectionCount <= 0) {
    // Grace period before disconnect
    setTimeout(() => {
      if (connectionCount <= 0 && socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
      }
    }, 5000);
  }
};
```

## Event Types

### Listening Events
| Event | Purpose |
|-------|---------|
| `notification:new` | New notification |
| `pdf-ready` | PDF generation complete |
| `app:update` | App update available |
| `task:update` | Task status change |
| `project:update` | Project data change |
| `automation:complete` | Webhook automation done |
| `photo:uploaded` | New survey photo |
| `media:uploaded` | New media file |

### Emitting Events
| Event | Purpose |
|-------|---------|
| `join:user` | Join user notification room |
| `join:superadmin` | Join admin room |
| `join-project` | Join project collaboration room |
| `leave-project` | Leave project room |

## Usage Pattern

```javascript
import { useSocket } from '../hooks/useSocket';

function ProjectDetails({ projectUuid }) {
  const { joinProject, leaveProject, onProjectUpdate } = useSocket();

  useEffect(() => {
    joinProject(projectUuid);
    
    const unsubscribe = onProjectUpdate((data) => {
      if (data.projectUuid === projectUuid) {
        // Refresh data
      }
    });

    return () => {
      leaveProject(projectUuid);
      unsubscribe();
    };
  }, [projectUuid]);
}
```

---

# 10. API Architecture

## Backend Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js |
| Framework | Express.js |
| Language | TypeScript |
| ORM | TypeORM |
| Database | PostgreSQL (AWS RDS) |
| Storage | AWS S3 |
| Hosting | AWS Lightsail |
| Process Manager | PM2 |
| Proxy | Apache (WebSocket support) |

## API Base URL

- Production: `https://api.skyfireapp.io`
- Web App: `https://skyfireapp.io`

## Authentication

JWT-based authentication with tokens stored in localStorage/sessionStorage.

```typescript
// axiosInstance.ts
const axiosInstance = axios.create({
  baseURL: 'https://api.skyfireapp.io',
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## Key Endpoints

### Projects
```
GET    /project                     # List projects
GET    /project/:uuid               # Get project
POST   /project                     # Create project
PUT    /project/:uuid               # Update project
DELETE /project/:uuid               # Delete project
```

### System Details
```
GET    /project/:uuid/system-details           # Get all system details
GET    /project/:uuid/system-details?fields=   # Get specific fields
PUT    /project/:uuid/system-details           # Update system details
```

### Equipment
```
GET    /equipments                  # List equipment catalog
GET    /equipments/search           # Search equipment
GET    /equipment/utility-requirements  # BOS requirements by utility
```

### Chatter
```
GET    /chatter/project/:uuid       # Get threads
POST   /chatter/thread              # Create thread
POST   /chatter/thread/:id/reply    # Add reply
PUT    /chatter/thread/:id          # Update thread
DELETE /chatter/thread/:id          # Delete thread
```

## Response Format

```typescript
interface ApiResponse<T> {
  status: 'SUCCESS' | 'ERROR';
  message: string;
  data?: T;
  error?: {
    type: string;
    message: string;
    field?: string;
  };
}
```

---

# 11. Key Business Logic

## Project Status Flow

```
Sales → Site Survey → Design → Revisions → Permits → Install → Commissioning → Inspection → PTO
                                  ↓
                              On Hold
                                  ↓
                              Canceled
```

Status is stored as `completed_step` (0-10) in database.

## System Configuration Detection

```typescript
interface SystemConfiguration {
  hasSolarPanels: boolean;
  hasInverter: boolean;
  hasMicroinverter: boolean;
  hasBattery: boolean;
  hasSMS: boolean;
  hasBackupPanel: boolean;
  couplingType: 'AC' | 'DC' | null;
  backupOption: 'Whole Home' | 'Partial Home' | 'No Backup';
}

function detectSystemConfiguration(data, systemNumber): SystemConfiguration {
  const prefix = `sys${systemNumber}_`;
  return {
    hasSolarPanels: !!data[`${prefix}solar_panel_make`],
    hasInverter: !!data[`${prefix}micro_inverter_make`] && 
                 data[`${prefix}stringing_type`] === 'string',
    hasMicroinverter: data[`${prefix}stringing_type`] === 'micro',
    hasBattery: (data[`${prefix}battery_1_qty`] || 0) > 0,
    hasSMS: !!data[`${prefix}sms_make`],
    hasBackupPanel: data[`${prefix}backup_option`]?.includes('Home'),
    // ... etc
  };
}
```

## Stringing Calculations

For string inverters, calculate optimal panel distribution:

```typescript
function calculateStringing(panelCount: number, stringsPerMPPT: number): number[] {
  const strings: number[] = [];
  let remaining = panelCount;
  
  while (remaining > 0 && strings.length < 10) {
    const panelsPerString = Math.min(remaining, stringsPerMPPT);
    strings.push(panelsPerString);
    remaining -= panelsPerString;
  }
  
  return strings;
}
```

## PCS (Power Conditioning System) Settings

Tesla-specific configuration for PowerWall systems:

```typescript
interface PCSSettings {
  gridForming: boolean;
  backupReserve: number;  // Percentage
  stormWatch: boolean;
  touPeakShaving: boolean;
}
```

---

# 12. Development Standards

## MANDATORY Rules

### 1. No Inline Styles
```jsx
// ❌ NEVER
<div style={{ padding: '16px', color: 'white' }}>

// ✅ ALWAYS
<div className={styles.container}>
```

### 2. Use Design Tokens
```css
/* ❌ NEVER */
.container {
  padding: 16px;
  background: #0A1628;
}

/* ✅ ALWAYS */
.container {
  padding: var(--spacing);
  background: var(--bg-panel);
}
```

### 3. CSS Modules Only
Every component gets a `.module.css` file. No global CSS except `tokens.css` and `utilities.css`.

### 4. TypeScript for New Code
New services, hooks, and utils should be TypeScript (`.ts` / `.tsx`).

### 5. Git Commits Before/After Major Changes
Always commit before starting significant work. Commit after each working milestone.

## File Naming

- Components: `PascalCase.js` or `PascalCase.tsx`
- Hooks: `useCamelCase.js` or `useCamelCase.ts`
- Services: `camelCaseService.js` or `camelCaseService.ts`
- Utils: `camelCase.js` or `camelCase.ts`
- Styles: `ComponentName.module.css` or `ComponentName_module.css`

## Import Order

```javascript
// 1. React
import React, { useState, useEffect } from 'react';

// 2. Third-party libraries
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';

// 3. Internal components
import { Button, Modal, FormInput } from '../ui';
import { useSocket } from '../../hooks/useSocket';

// 4. Services/utils
import { projectAPI } from '../../services/projectAPI';
import { formatDate } from '../../utils/formatting';

// 5. Types
import type { Project, SystemDetails } from '../../types';

// 6. Styles
import styles from './ComponentName.module.css';
```

---

# 13. The 30-Hour Migration Plan

## Hour 1-2: Restructure

```bash
# Create monorepo structure
mkdir skyfire-apps
cd skyfire-apps

# Move web app
mv /path/to/skyfire-web ./web

# Copy mobile app (don't move - keep backup)
cp -r /path/to/skyfire-mobile ./mobile-android

# Create shared directory
mkdir -p shared/{tokens,types,constants,utils}

# Initialize workspace
npm init -y
# Add workspaces to package.json
```

## Hour 3-6: Fix Android Build

Focus areas:
- `android/gradle.properties` - 16kb page alignment
- `android/app/build.gradle` - SDK versions
- Native module compatibility
- Metro bundler configuration

## Hour 7-12: Reskin Android

1. Extract tokens from web `tokens.css` to `shared/tokens/`
2. Create React Native token equivalent
3. Update Android app to use shared tokens
4. Match colors, spacing, typography to web

## Hour 13-18: iOS Fork

```bash
cp -r mobile-android mobile-ios
cd mobile-ios

# Update package.json name
# Update iOS-specific configs
# Remove Android directory
# Test on iOS simulator
```

## Hour 19-30: Feature Sync

Use Claude Code to translate features:

```
"The web app's EquipmentForm at web/src/components/project/EquipmentForm.js 
has these new fields: [list fields]. 

Add equivalent functionality to mobile-android/src/screens/EquipmentScreen.tsx.
Use the same field names for database compatibility."
```

---

# 14. Known Issues & Technical Debt

## Current Issues

### 1. Rate Limiting False Positives
**Problem:** Authenticated users were hitting unauthenticated rate limits.  
**Root Cause:** JWT check was looking for `req.user.id` but token has `uuid`.  
**Fix Applied:** Modified early-auth-extract middleware to check `decoded.uuid`.

### 2. Infinite API Retry Loops
**Problem:** Equipment forms triggering 100s of API calls.  
**Root Cause:** Unmemoized callbacks causing re-renders, incorrect useEffect dependencies.  
**Fix:** Proper useCallback memoization, dependency array fixes.

### 3. Photo Compression Bottleneck
**Problem:** Projects with 250+ photos cause performance issues.  
**Status:** Compression scripts written, need deployment.

### 4. PostgreSQL Column Limit
**Problem:** project_system_details approaching 1,600 column limit.  
**Plan:** Normalize sys3/sys4 into separate tables.

### 5. Mobile/Web Field Mismatch
**Problem:** Mobile saving to non-existent database fields.  
**Fix:** Field audit and mobile app update required.

## Technical Debt

1. **Analytics disabled** (`ANALYTICS_ENABLED = false`)
2. **PowerClerk integration** - Coming Soon placeholder
3. **SolarAPP+ integration** - Partial implementation
4. **Customer Portal** - Not built
5. **Limited test coverage** - No automated tests
6. **Some components using Redux** - Inconsistent state management

---

# 15. Future Roadmap

## Q1 2026 (Current)

- ✅ Design system standardization
- ✅ PWA deployment (skyfireapp.io)
- 🔄 Unified Apps restructure
- 🔄 Mobile app resurrection
- ⬜ Enable analytics
- ⬜ PowerClerk integration (top 5 utilities)

## Q2 2026

- ⬜ AI Design Copilot (Claude integration)
- ⬜ Intelligent scheduling
- ⬜ Drafter gamification expansion
- ⬜ Customer portal MVP

## Q3-Q4 2026

- ⬜ Full SolarAPP+ certification
- ⬜ AutoCAD integration
- ⬜ Equipment marketplace
- ⬜ Public API

## Holy Grail Features

1. **AI Design Copilot** - Analyze roofs, suggest layouts, draft permit narratives
2. **Unified Customer Portal** - Tesla app-level experience
3. **Intelligent Scheduling** - Route optimization, skill-based crew matching
4. **Complete Permit Pipeline** - End-to-end automation
5. **Financial Modeling** - Cash/loan/PPA comparisons

---

# Appendix A: Quick Reference

## URLs

| Environment | URL |
|-------------|-----|
| Web App | https://skyfireapp.io |
| API | https://api.skyfireapp.io |
| Socket.io | wss://api.skyfireapp.io |

## Key Contacts

- **Logan** - Lead Developer (super admin)
- **Eli Escobedo** - Business Partner (super admin)
- **Yama** - Webhook integrations
- **Richie** - Data partnerships

## Database Access

- **Tool:** pgAdmin (not psql command line)
- **Host:** AWS RDS PostgreSQL
- **Backup:** Before any migrations

## Deployment

```bash
# Web (handled by CI/CD)
git push origin main

# Backend (SSH to Lightsail)
pm2 restart all
```

---

# Appendix B: Glossary

| Term | Definition |
|------|------------|
| **AHJ** | Authority Having Jurisdiction - local permit authority |
| **BOS** | Balance of System - equipment between panels and grid |
| **DC-Coupled** | Battery connected to DC side of inverter |
| **AC-Coupled** | Battery with own inverter on AC side |
| **ESS** | Energy Storage System (battery) |
| **SMS** | Storage Management System (e.g., Enphase IQ Combiner) |
| **PCS** | Power Conditioning System (Tesla gateway settings) |
| **MPPT** | Maximum Power Point Tracker - inverter input |
| **NEC** | National Electrical Code |
| **PTO** | Permission to Operate (final utility approval) |
| **SolarAPP+** | Solar Automated Permit Processing |
| **PowerClerk** | Utility interconnection portal |

---

**Document End**

*This document should be provided to any new Claude instance working on the Skyfire Apps project. It contains everything needed to understand the architecture, make informed decisions, and maintain consistency across all platforms.*
