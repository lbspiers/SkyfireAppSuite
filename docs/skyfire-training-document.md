# Skyfire Solar Design - Developer Training Document
## Comprehensive Guide for Monorepo Implementation

**Version:** 1.0  
**Last Updated:** January 2026  
**Prepared for:** New Developer Onboarding & Monorepo Migration

---

# Table of Contents

1. [Company Overview & Mission](#1-company-overview--mission)
2. [Product Suite Overview](#2-product-suite-overview)
3. [Technical Architecture](#3-technical-architecture)
4. [Backend Deep Dive](#4-backend-deep-dive)
5. [Mobile App Architecture](#5-mobile-app-architecture)
6. [Database Schema & Data Models](#6-database-schema--data-models)
7. [Core Business Logic](#7-core-business-logic)
8. [UI/UX Standards & Components](#8-uiux-standards--components)
9. [API Reference](#9-api-reference)
10. [Development Workflow](#10-development-workflow)
11. [Deployment & DevOps](#11-deployment--devops)
12. [Monorepo Migration Strategy](#12-monorepo-migration-strategy)
13. [Common Patterns & Best Practices](#13-common-patterns--best-practices)
14. [Troubleshooting Guide](#14-troubleshooting-guide)

---

# 1. Company Overview & Mission

## About Skyfire Solar Design

Skyfire Solar Design is a Phoenix, Arizona-based company developing comprehensive software solutions for the solar installation industry. Founded by **Logan** (CEO/Technical Lead) and **Eli Escobedo** (Business Partner), the company aims to revolutionize how solar installers conduct site surveys, design systems, and generate permit-ready documentation.

## Core Mission

**Streamline the complex solar design and installation workflow** - from initial site surveys through equipment configuration to final electrical diagram generation via AutoCAD integration.

## The Problem We Solve

Solar installers face significant pain points:

1. **Unorganized Photo Documentation**: Field surveyors capture 100-250 photos per site, but deliver them as massive unorganized collections to downstream users
2. **Complex Equipment Configurations**: Installations can involve multiple systems, various inverters, battery storage, and utility-specific requirements
3. **Repetitive Data Entry**: Information needs to be entered multiple times across different platforms
4. **Design Errors**: Miscommunication between field techs and designers leads to costly return visits
5. **Permit Delays**: Manual processes slow down permit applications and PE stamp acquisition

## Our Solution

A unified platform that:
- Intelligently captures and organizes site survey data
- Auto-tags photos by equipment type and location
- Guides technicians through complex equipment configurations
- Validates data before submission
- Generates professional AutoCAD-ready electrical diagrams
- Integrates with Monday.com for project management
- Supports utility-specific requirements across Arizona

---

# 2. Product Suite Overview

## Platform Components

### 2.1 Mobile Application (React Native)
- **Target Users**: Field surveyors, site technicians
- **Primary Functions**: 
  - Site data collection
  - Photo/video capture with auto-tagging
  - Equipment configuration
  - Voice-to-text notes
  - GPS and Google Maps integration
- **Platforms**: iOS (App Store) and Android (Play Store)

### 2.2 Web Application (Planned Q1 2026)
- **Target Users**: Office staff, designers, project managers
- **Primary Functions**:
  - Project management dashboard
  - Detailed report generation
  - Multi-project oversight
  - Client communication
  - Advanced data analysis

### 2.3 Backend API Server
- **Technology**: Node.js/TypeScript with Express.js
- **Database**: PostgreSQL with TypeORM
- **Hosting**: AWS Lightsail
- **Functions**:
  - Authentication & authorization
  - Data persistence
  - File storage (S3)
  - Email notifications (SES)
  - External integrations

### 2.4 Automation Layer
- **Make.com Integration**: Triggers AutoCAD processes
- **Monday.com Integration**: Project management workflow
- **Excel Calculator**: Complex electrical calculations

## Key Features by Area

### Site Survey
- Address geocoding with Google Maps
- Street View integration for preliminary assessment
- AHJ (Authority Having Jurisdiction) identification
- Utility provider detection
- Site photo organization by section

### Equipment Configuration
- **30,000+ equipment database** (solar panels, inverters, batteries)
- Support for up to 4 independent systems per project
- Tesla PowerWall 3 special handling (extensions, integrated storage)
- Micro-inverter and string inverter configurations
- Custom stringing configuration
- Balance of System (BOS) equipment management

### Multi-System Support
- AC coupling
- DC coupling
- SMS (Storage Management System) integration
- System combination workflows
- Up to 70kW DC arrays, 600A service, 4 sub-panels

### Output Generation
- Automated electrical diagram generation
- PE stamp integration
- Permit application preparation
- Professional site survey reports

---

# 3. Technical Architecture

## High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐    ┌─────────────────────┐                         │
│  │   Mobile App        │    │   Web App           │                         │
│  │   (React Native)    │    │   (React - Planned) │                         │
│  │   iOS + Android     │    │   Q1 2026           │                         │
│  └──────────┬──────────┘    └──────────┬──────────┘                         │
└─────────────┼───────────────────────────┼───────────────────────────────────┘
              │                           │
              │         HTTPS             │
              ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API LAYER                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    Express.js / TypeScript                             │  │
│  │                    https://api.skyfireapp.io                           │  │
│  │                                                                        │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │  │
│  │  │ Controllers  │  │   Routes     │  │  Middleware  │                 │  │
│  │  │ - auth/      │  │ - /auth/*    │  │ - JWT Auth   │                 │  │
│  │  │ - project/   │  │ - /project/* │  │ - Validation │                 │  │
│  │  │ - company/   │  │ - /company/* │  │ - Logging    │                 │  │
│  │  │ - equipment/ │  │ - /api/*     │  │ - Error      │                 │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                 │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────┬───────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────┐    ┌────────────────────┐    ┌───────────────────┐ │
│  │    PostgreSQL      │    │      AWS S3        │    │     AWS SES       │ │
│  │    (AWS RDS)       │    │   (Media Files)    │    │     (Email)       │ │
│  │                    │    │                    │    │                   │ │
│  │  - Users           │    │  - Project Photos  │    │  - Notifications  │ │
│  │  - Companies       │    │  - Video Captures  │    │  - Confirmations  │ │
│  │  - Projects        │    │  - Documents       │    │  - Alerts         │ │
│  │  - Equipment       │    │                    │    │                   │ │
│  │  - System Details  │    │                    │    │                   │ │
│  └────────────────────┘    └────────────────────┘    └───────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           INTEGRATION LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────┐    ┌────────────────────┐    ┌───────────────────┐ │
│  │    Make.com        │    │    Monday.com      │    │    Google APIs    │ │
│  │   (Automation)     │    │   (Project Mgmt)   │    │                   │ │
│  │                    │    │                    │    │  - Maps           │ │
│  │  - AutoCAD Trigger │    │  - Board Sync      │    │  - Geocoding      │ │
│  │  - Excel Calc      │    │  - Status Updates  │    │  - Street View    │ │
│  │  - PDF Generation  │    │  - Notifications   │    │  - Calendar       │ │
│  └────────────────────┘    └────────────────────┘    └───────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Technology Stack Summary

| Layer | Technology | Version/Details |
|-------|-----------|-----------------|
| Mobile Frontend | React Native | 0.78.3 (recently upgraded from 0.74.3) |
| Mobile Build | EAS (Expo Application Services) | Production builds |
| State Management | Redux Toolkit | With typed hooks |
| Backend | Node.js + TypeScript | Express.js framework |
| ORM | TypeORM | Entity-based data modeling |
| Database | PostgreSQL | Hosted on AWS RDS |
| Web Server | AWS Lightsail | PM2 process management |
| File Storage | AWS S3 | us-west-1 region |
| Email | AWS SES | us-west-2 region |
| Maps | Google Maps Platform | Geocoding, Street View, Static Maps |

---

# 4. Backend Deep Dive

## Directory Structure

```
skyfire_backend_dev/
├── src/
│   ├── controller/           # Route handlers (TypeScript)
│   │   ├── auth/            # Authentication controllers
│   │   │   ├── login.ts
│   │   │   ├── register-complete.ts
│   │   │   ├── refresh-token.ts
│   │   │   └── delete-account.ts
│   │   ├── project/         # Project management
│   │   ├── company/         # Company management
│   │   ├── equipment/       # Equipment endpoints
│   │   ├── super-admin/     # Admin panel functions
│   │   └── user/            # User profile
│   │
│   ├── entity/              # TypeORM entities
│   │   ├── user/
│   │   ├── company/
│   │   ├── solar_project/
│   │   │   ├── solar_project.ts
│   │   │   ├── solar_project_details.ts
│   │   │   ├── solar_project_site_info.ts
│   │   │   ├── project-equipment-set.ts
│   │   │   └── project-equipment-section.ts
│   │   └── equipments/
│   │
│   ├── routes/              # Route definitions (JavaScript legacy + TypeScript)
│   │   ├── demoBooking.js
│   │   ├── emailRoutes.ts
│   │   ├── solarEquipmentRoutes.ts
│   │   ├── solarPanel.ts
│   │   ├── photos.routes.ts
│   │   └── upload.routes.ts
│   │
│   ├── db/                  # Database configuration
│   │   └── db.ts            # TypeORM connection setup
│   │
│   ├── util/                # Utilities
│   │   ├── entity-column-options.ts
│   │   ├── entity-templates.ts
│   │   └── types.ts
│   │
│   └── index.ts             # Main application entry
│
├── ecosystem.config.js      # PM2 configuration
├── package.json
├── tsconfig.json
└── .env                     # Environment variables
```

## Entity Patterns

### Base Entity Template (VersionedEntity)

```typescript
// src/util/entity-templates.ts
import { CreateDateColumn, UpdateDateColumn } from 'typeorm';

export abstract class VersionedEntity {
  @CreateDateColumn({ name: '_created_at' })
  _created_at: Date;

  @UpdateDateColumn({ name: '_updated_at' })
  _updated_at: Date;
}
```

### Example Entity: SolarProject

```typescript
// src/entity/solar_project/solar_project.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Generated,
  OneToOne,
  Relation,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { VersionedEntity } from '../../util/entity-templates';
import { Company } from '../company/company';

@Entity('solar_projects')
export class SolarProject extends VersionedEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid', unique: true })
  @Generated('uuid')
  uuid: string;

  @Column({ nullable: true })
  project_name: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  zip_code: string;

  @Column({ nullable: true })
  status: string;

  @Column({ nullable: true })
  completed_step: number;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Relation<Company>;

  @Column({ type: 'uuid', nullable: true })
  company_id: string;
}
```

## Controller Pattern

```typescript
// src/controller/project/index.ts
import { Router, Request, Response } from 'express';
import { getConnection } from 'typeorm';
import { SolarProject } from '../../entity/solar_project/solar_project';

const router = Router();

// GET project by ID
router.get('/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const connection = getConnection();
    const projectRepo = connection.getRepository(SolarProject);
    
    const project = await projectRepo.findOne({
      where: { uuid: projectId },
      relations: ['company']
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    return res.json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('[GET project] error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
```

## Authentication Flow

### User Status Enum
```typescript
enum UserStatusEnum {
  PENDING = 1,    // Awaiting admin approval
  ACTIVE = 2,     // Approved and can login
  INACTIVE = 0,   // Deactivated/anonymized
}
```

### Login Process
1. User submits email/password
2. Backend validates credentials
3. Checks user status (must be ACTIVE/2)
4. Returns JWT access token + refresh token
5. Frontend stores tokens in AsyncStorage
6. Subsequent requests include Bearer token

### Registration Flow
1. User submits registration form
2. Backend creates user with status=PENDING
3. Demo booking slot selection
4. Admin approval (status → ACTIVE)
5. User can now login

## Key Environment Variables

```bash
# Database
TYPEORM_HOST='your-rds-endpoint.rds.amazonaws.com'
TYPEORM_PORT=5432
TYPEORM_USERNAME=postgres
TYPEORM_PASSWORD=your_password
TYPEORM_DATABASE=skyfire_db

# AWS S3 (Photo Storage)
AWS_S3_BUCKET=skyfire-media-files
AWS_REGION=us-west-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...

# AWS SES (Email)
AWS_SES_REGION=us-west-2
AWS_SES_FROM_EMAIL=app@skyfiresd.com
AWS_SES_REPLY_TO=designs@skyfiresd.com
AWS_SES_ACCESS_KEY_ID=AKIA...
AWS_SES_SECRET_ACCESS_KEY=...

# Google Maps
GOOGLE_MAPS_API_KEY=AIza...

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=4d
```

---

# 5. Mobile App Architecture

## Directory Structure

```
skyfire_mobileapp_dev/
├── src/
│   ├── api/                      # API service layer
│   │   ├── auth.service.ts
│   │   ├── authguard.tsx
│   │   └── apiModules/
│   │       └── triggerPlanAutomation.ts
│   │
│   ├── components/               # Reusable components
│   │   ├── Button/
│   │   │   ├── index.tsx
│   │   │   ├── RadialButton.tsx
│   │   │   └── SystemButton.tsx
│   │   ├── Modals/
│   │   │   ├── PhotoNotesModal.tsx
│   │   │   ├── PhotoNotesModalEnhanced.tsx
│   │   │   └── AttestationModal.tsx
│   │   ├── camera/
│   │   │   └── QuickCapture.tsx
│   │   ├── Calculations/
│   │   │   └── AllowableBackfeed.tsx
│   │   ├── UI/
│   │   │   ├── CollapsibleSection.tsx
│   │   │   ├── ThemedDropdown.tsx
│   │   │   ├── ThemedTextInput.tsx
│   │   │   └── ThemedRadioButtonGroup.tsx
│   │   └── photos/
│   │       └── PhotoGallery.tsx
│   │
│   ├── config/
│   │   ├── apiEndPoint.tsx       # API base URL configuration
│   │   └── appConfig.ts
│   │
│   ├── constants/
│   │   └── equipmentTypes.ts     # Equipment type constants
│   │
│   ├── context/
│   │   ├── PhotoCaptureContext.tsx
│   │   └── ThemeContext.tsx
│   │
│   ├── hooks/
│   │   ├── useAutoSaveFormik.ts
│   │   ├── useDebounce.ts
│   │   ├── useEquipmentDetails.ts
│   │   ├── usePhotoCapture.ts
│   │   ├── useProjectContext.ts
│   │   ├── useSectionNotes.ts
│   │   └── useSpeechToText.ts
│   │
│   ├── navigation/
│   │   ├── router.tsx            # Main navigation configuration
│   │   └── types.ts              # Navigation type definitions
│   │
│   ├── screens/
│   │   ├── auth/                 # Authentication screens
│   │   │   ├── Login.tsx
│   │   │   ├── Registration.tsx
│   │   │   ├── ForgotPass.tsx
│   │   │   └── Welcome.tsx
│   │   │
│   │   ├── app/home/             # Dashboard & project list
│   │   │   ├── DashboardScreen.tsx
│   │   │   ├── DashboardComponent.tsx
│   │   │   └── ProjectsScreen/
│   │   │       ├── ProjectRecord.tsx
│   │   │       └── DashboardControls.tsx
│   │   │
│   │   ├── Project/              # Project screens
│   │   │   ├── Site.tsx          # Site information
│   │   │   ├── Electrical.tsx
│   │   │   ├── Submitted.tsx
│   │   │   │
│   │   │   ├── SystemDetails/    # Equipment configuration
│   │   │   │   ├── components/
│   │   │   │   │   └── EquipmentDetails.tsx
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── useEquipmentDetails.ts
│   │   │   │   │   └── useEquipmentSection.ts
│   │   │   │   ├── sections/
│   │   │   │   │   ├── SolarPanelSection.tsx
│   │   │   │   │   ├── InverterSection.tsx
│   │   │   │   │   ├── OptimizerSection.tsx
│   │   │   │   │   ├── EnergyStorageSection.tsx
│   │   │   │   │   ├── MicroinverterSection.tsx
│   │   │   │   │   ├── SystemSelectionSection.tsx
│   │   │   │   │   └── ESS_Subsections/
│   │   │   │   │       ├── sys1_BatteryType1Section.tsx
│   │   │   │   │       ├── sys1_BatteryType2Section.tsx
│   │   │   │   │       ├── sys1_SMS.tsx
│   │   │   │   │       └── sys1_BackuploadSubPanel.tsx
│   │   │   │   └── services/
│   │   │   │       └── equipmentService.ts
│   │   │   │
│   │   │   ├── BalanceOfSystem/  # BOS equipment
│   │   │   │   ├── BOSType1Section.tsx
│   │   │   │   ├── BOSType2Section.tsx
│   │   │   │   ├── BOSType3Section.tsx
│   │   │   │   ├── BOSType4Section.tsx
│   │   │   │   ├── BOSType5Section.tsx
│   │   │   │   └── BOSType6Section.tsx
│   │   │   │
│   │   │   └── structural/       # Structural assessment
│   │   │       └── StructuralScreen.tsx
│   │   │
│   │   ├── equipment/            # Equipment-specific screens
│   │   │   ├── InverterStringing.tsx
│   │   │   ├── Stringing.tsx
│   │   │   └── WholeHomeBackupOption.tsx
│   │   │
│   │   └── GeneratePage.tsx      # Plan generation
│   │
│   ├── store/                    # Redux store
│   │   ├── store.ts
│   │   ├── hooks.ts
│   │   └── slices/
│   │       ├── authSlice.ts
│   │       ├── themeSlice.ts
│   │       ├── profileDataSlice.ts
│   │       ├── projectSlice.ts
│   │       ├── googleMapSlice.ts
│   │       ├── stringingSlice.ts
│   │       └── inverterStringingSlice.ts
│   │
│   ├── styles/                   # Style definitions
│   │   ├── equipmentDetailsStyles.ts
│   │   ├── siteStyle.tsx
│   │   └── ...
│   │
│   ├── theme/
│   │   └── colors/
│   │       ├── dark.ts
│   │       └── light.ts
│   │
│   └── utils/
│       ├── constants.ts
│       └── systemReordering.ts
│
├── App.tsx                       # Application entry point
├── app.json                      # Expo configuration
├── package.json
├── metro.config.js
└── tsconfig.json
```

## Redux Store Configuration

```typescript
// src/store/store.ts
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import themeReducer from "./slices/themeSlice";
import profileReducer from "./slices/profileDataSlice";
import siteInfo from "./slices/googleMapSlice";
import projectReducer from "./slices/projectSlice";
import stringingReducer from './slices/stringingSlice';
import inverterstringingReducer from "./slices/inverterStringingSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    theme: themeReducer,
    profile: profileReducer,
    project: projectReducer,
    site: siteInfo,
    stringing: stringingReducer,
    inverterStringing: inverterstringingReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      immutableCheck: {
        warnAfter: 128,
        ignoredPaths: [
          'project.updateProjectDetails',
          'project.systemDetails',
          'project.projectDetails.data.system_details'
        ]
      },
      serializableCheck: {
        warnAfter: 128,
        ignoredActions: ['project/setUpdateProjectDetails'],
        ignoredPaths: ['project.currentProject.system_details']
      }
    }),
  // Safe __DEV__ check for iOS release builds
  devTools: (typeof __DEV__ !== 'undefined' && __DEV__) ? {
    actionSanitizer: (action: any) => ({
      ...action,
      payload: action.payload && JSON.stringify(action.payload).length > 10000
        ? '<<LARGE_PAYLOAD>>'
        : action.payload
    }),
    stateSanitizer: (state: any) => state
  } : false
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
```

## Navigation Structure

```typescript
// src/navigation/router.tsx - Simplified overview
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

// Auth Stack - Unauthenticated users
const AuthStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Welcome" component={WelcomeScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Registration" component={Registration} />
    <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
  </Stack.Navigator>
);

// Main App Stack - Authenticated users
const AppStack = () => (
  <Drawer.Navigator>
    <Drawer.Screen name="Dashboard" component={DashboardScreen} />
    <Drawer.Screen name="Projects" component={ProjectsTabNavigator} />
    <Drawer.Screen name="Settings" component={SettingsScreen} />
    {/* Super Admin only */}
    <Drawer.Screen name="AdminPanel" component={AdminPanelScreen} />
  </Drawer.Navigator>
);

// Project Tab Navigator
const ProjectTabNavigator = () => (
  <Tab.Navigator>
    <Tab.Screen name="Site" component={SiteScreen} />
    <Tab.Screen name="Electrical" component={ElectricalScreen} />
    <Tab.Screen name="Equipment" component={EquipmentDetailsScreen} />
    <Tab.Screen name="Gallery" component={PhotoGalleryScreen} />
  </Tab.Navigator>
);
```

## Key Hooks

### useEquipmentDetails
The core hook for managing equipment configuration state.

```typescript
// src/screens/Project/SystemDetails/hooks/useEquipmentDetails.ts
interface UseEquipmentDetailsProps {
  projectId: string;
  companyId: string;
  systemPrefix: 'sys1_' | 'sys2_' | 'sys3_' | 'sys4_';
}

export function useEquipmentDetails({
  projectId,
  companyId,
  systemPrefix
}: UseEquipmentDetailsProps) {
  // State for each equipment section
  const [solarSection, setSolarSection] = useState<SolarSectionState>(initialSolarState);
  const [inverterSection, setInverterSection] = useState<InverterSectionState>(initialInverterState);
  const [optimizerSection, setOptimizerSection] = useState<OptimizerSectionState>(initialOptimizerState);
  const [batterySection, setBatterySection] = useState<BatterySectionState>(initialBatteryState);
  
  // Tesla PowerWall 3 detection
  const isTeslaPowerwall3 = useMemo(() => {
    return inverterSection.selectedMake === 'Tesla' && 
           inverterSection.selectedModel?.includes('PowerWall 3');
  }, [inverterSection]);

  // Fetch data from database
  const fetchFromDb = useCallback(async () => {
    const response = await fetch(`${API_URL}/project/${projectId}/system-details`);
    const data = await response.json();
    // Hydrate state with database values using systemPrefix
    hydrateSections(data, systemPrefix);
  }, [projectId, systemPrefix]);

  // Build payload for saving
  const buildPayload = useCallback(() => {
    return {
      [`${systemPrefix}solar_panel_make`]: solarSection.selectedMake,
      [`${systemPrefix}solar_panel_model`]: solarSection.selectedModel,
      [`${systemPrefix}solar_panel_quantity`]: solarSection.quantity,
      [`${systemPrefix}inverter_make`]: inverterSection.selectedMake,
      [`${systemPrefix}inverter_model`]: inverterSection.selectedModel,
      // ... more fields
    };
  }, [solarSection, inverterSection, systemPrefix]);

  // Auto-save with debounce
  const debouncedSave = useDebouncedCallback(
    async (payload) => {
      await fetch(`${API_URL}/project/${projectId}/system-details`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
    },
    1000
  );

  return {
    solarSection,
    setSolarSection,
    inverterSection,
    setInverterSection,
    optimizerSection,
    setOptimizerSection,
    batterySection,
    setBatterySection,
    isTeslaPowerwall3,
    fetchFromDb,
    buildPayload,
    debouncedSave
  };
}
```

### useEquipmentSection
Generic hook for individual equipment section management.

```typescript
// src/screens/Project/SystemDetails/hooks/useEquipmentSection.ts
export function useEquipmentSection<T extends EquipmentSectionState>({
  initialState,
  projectId,
  companyId,
  sectionKey,
  systemPrefix
}: UseEquipmentSectionProps<T>) {
  const [state, setState] = useState<T>(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Update field with auto-save trigger
  const updateField = useCallback((field: keyof T, value: any) => {
    setState(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  }, []);

  // Save to database
  const save = useCallback(async () => {
    setIsLoading(true);
    try {
      const payload = buildSectionPayload(state, sectionKey, systemPrefix);
      await saveToDb(projectId, payload);
      setHasChanges(false);
      Toast.show({ type: 'success', text1: 'Saved successfully' });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Failed to save' });
    } finally {
      setIsLoading(false);
    }
  }, [state, projectId, sectionKey, systemPrefix]);

  return { state, updateField, save, isLoading, hasChanges };
}
```

## App Entry Point

```typescript
// App.tsx
import "react-native-gesture-handler";
import React, { useEffect } from "react";
import Router from "./src/navigation/router";
import { Provider, useDispatch } from "react-redux";
import store from "./src/store/store";
import { Appearance } from "react-native";
import { setSystemTheme } from "./src/store/slices/themeSlice";
import Toast from "react-native-toast-message";

const ThemeListener = () => {
  const dispatch = useDispatch();
  
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      dispatch(setSystemTheme(colorScheme));
    });
    return () => subscription.remove();
  }, [dispatch]);
  
  return null;
};

function App(): React.JSX.Element {
  return (
    <Provider store={store}>
      <ThemeListener />
      <Router />
      <Toast />
    </Provider>
  );
}

export default App;
```

---

# 6. Database Schema & Data Models

## Core Tables

### users
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  uuid UUID UNIQUE DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone_no VARCHAR(20),
  status INTEGER DEFAULT 1,  -- 1=pending, 2=active, 0=inactive
  company_id UUID REFERENCES companies(uuid),
  is_super_admin BOOLEAN DEFAULT false,
  _created_at TIMESTAMP DEFAULT NOW(),
  _updated_at TIMESTAMP DEFAULT NOW()
);
```

### companies
```sql
CREATE TABLE companies (
  id SERIAL PRIMARY KEY,
  uuid UUID UNIQUE DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  address VARCHAR(500),
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  phone VARCHAR(20),
  email VARCHAR(255),
  logo_url VARCHAR(500),
  utility VARCHAR(100),  -- Default utility for company
  _created_at TIMESTAMP DEFAULT NOW(),
  _updated_at TIMESTAMP DEFAULT NOW()
);
```

### solar_projects
```sql
CREATE TABLE solar_projects (
  id SERIAL PRIMARY KEY,
  uuid UUID UNIQUE DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(uuid),
  project_name VARCHAR(255),
  address VARCHAR(500),
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  country VARCHAR(50) DEFAULT 'US',
  utility VARCHAR(100),
  ahj VARCHAR(100),  -- Authority Having Jurisdiction
  status VARCHAR(50),
  completed_step INTEGER DEFAULT 0,
  _created_at TIMESTAMP DEFAULT NOW(),
  _updated_at TIMESTAMP DEFAULT NOW()
);
```

### project_system_details
This is the **massive table** containing all equipment configuration data. Key fields:

```sql
CREATE TABLE project_system_details (
  id SERIAL PRIMARY KEY,
  project_id UUID REFERENCES solar_projects(uuid) ON DELETE CASCADE,
  
  -- Site Information
  house_sqft INTEGER,
  roof_area_sqft INTEGER,
  site_description TEXT,
  
  -- System Selection (up to 4 systems)
  sys1_selectedsystem VARCHAR(50),  -- 'solar', 'battery', 'hybrid'
  sys2_selectedsystem VARCHAR(50),
  sys3_selectedsystem VARCHAR(50),
  sys4_selectedsystem VARCHAR(50),
  
  -- System 1 Solar Panels
  sys1_solar_panel_make VARCHAR(255),
  sys1_solar_panel_model VARCHAR(255),
  sys1_solar_panel_quantity INTEGER,
  sys1_solar_panel_wattage DECIMAL(10,2),
  sys1_solar_panel_new_existing VARCHAR(20),
  
  -- System 1 Inverter
  sys1_inverter_make VARCHAR(255),
  sys1_inverter_model VARCHAR(255),
  sys1_inverter_quantity INTEGER,
  sys1_inverter_type VARCHAR(50),  -- 'string', 'micro', 'hybrid'
  sys1_inverter_new_existing VARCHAR(20),
  sys1_inverter_stringing_configuration JSONB,
  
  -- System 1 Optimizer
  sys1_optimizer_make VARCHAR(255),
  sys1_optimizer_model VARCHAR(255),
  sys1_optimizer_quantity INTEGER,
  
  -- System 1 Battery (Type 1)
  sys1_battery1_make VARCHAR(255),
  sys1_battery1_model VARCHAR(255),
  sys1_battery1_quantity INTEGER,
  sys1_battery1_new_existing VARCHAR(20),
  
  -- System 1 Battery (Type 2)
  sys1_battery2_make VARCHAR(255),
  sys1_battery2_model VARCHAR(255),
  sys1_battery2_quantity INTEGER,
  
  -- System 1 SMS (Storage Management System)
  sys1_sms_make VARCHAR(255),
  sys1_sms_model VARCHAR(255),
  sys1_sms_backup_setting VARCHAR(50),  -- 'whole_home', 'partial', 'none'
  
  -- System 1 Tesla Extensions (for PowerWall 3)
  sys1_tesla_extensions INTEGER,
  
  -- System 1 BOS Types (Balance of System)
  sys1_bos_type1_make VARCHAR(255),
  sys1_bos_type1_model VARCHAR(255),
  sys1_bos_type1_type VARCHAR(100),
  sys1_bos_type1_visible BOOLEAN DEFAULT false,
  
  sys1_bos_type2_make VARCHAR(255),
  sys1_bos_type2_model VARCHAR(255),
  sys1_bos_type2_type VARCHAR(100),
  sys1_bos_type2_visible BOOLEAN DEFAULT false,
  
  -- ... types 3-6 follow same pattern
  
  -- System 2, 3, 4 follow same pattern with sys2_, sys3_, sys4_ prefixes
  
  -- Stringing Configuration
  sys1_stringing_type VARCHAR(50),  -- 'auto', 'custom'
  
  -- System Combination
  systems_combined BOOLEAN DEFAULT false,
  combination_point VARCHAR(100),  -- 'inverter', 'combiner_panel', 'dc_combiner'
  
  -- Swap Flags (for automation ordering)
  swap_scenario VARCHAR(50),  -- 'swap_2', 'swap_3', null
  
  _created_at TIMESTAMP DEFAULT NOW(),
  _updated_at TIMESTAMP DEFAULT NOW()
);
```

### project_photos
```sql
CREATE TABLE project_photos (
  id SERIAL PRIMARY KEY,
  uuid UUID UNIQUE DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES solar_projects(uuid) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(uuid),
  
  -- File Storage
  s3_key VARCHAR(500) NOT NULL,
  s3_bucket VARCHAR(100) DEFAULT 'skyfire-media-files',
  file_url VARCHAR(1000),
  thumbnail_url VARCHAR(1000),
  
  -- Metadata
  section VARCHAR(100),  -- 'Site', 'Electrical', 'System1_SolarPanels', etc.
  tag VARCHAR(100),
  notes TEXT,
  media_type VARCHAR(20) DEFAULT 'photo',  -- 'photo', 'video'
  
  -- Soft Delete
  deleted_at TIMESTAMP,
  
  _created_at TIMESTAMP DEFAULT NOW(),
  _updated_at TIMESTAMP DEFAULT NOW()
);
```

### solar_panels (Equipment Database)
```sql
CREATE TABLE solar_panels (
  id SERIAL PRIMARY KEY,
  manufacturer_model VARCHAR(500),  -- Combined make + model
  manufacturer VARCHAR(255),
  model_number VARCHAR(255),
  nameplate_pmax DECIMAL(10,2),  -- Wattage
  ptc DECIMAL(10,2),
  nameplate_vpmax DECIMAL(10,2),
  nameplate_ipmax DECIMAL(10,2),
  nameplate_voc DECIMAL(10,2),
  nameplate_isc DECIMAL(10,2),
  average_noct DECIMAL(10,2),
  n_s INTEGER,  -- Number of cells
  short_ft DECIMAL(10,2),  -- Physical dimensions
  long_ft DECIMAL(10,2),
  weight_lbs DECIMAL(10,2),
  integrated_ac BOOLEAN DEFAULT false,  -- AC module flag
  _created_at TIMESTAMP DEFAULT NOW(),
  _updated_at TIMESTAMP DEFAULT NOW()
);
```

### inverters
```sql
CREATE TABLE inverters (
  id SERIAL PRIMARY KEY,
  manufacturer VARCHAR(255),
  model_number VARCHAR(500),
  inverter_type VARCHAR(50),  -- 'string', 'micro', 'hybrid', 'battery'
  ac_output_watts DECIMAL(10,2),
  dc_input_watts DECIMAL(10,2),
  max_efficiency DECIMAL(5,2),
  mppt_channels INTEGER,
  max_strings_branches INTEGER,  -- For stringing configuration
  dc_input_voltage_max DECIMAL(10,2),
  dc_input_voltage_min DECIMAL(10,2),
  ac_voltage_nominal DECIMAL(10,2),
  integrated_battery BOOLEAN DEFAULT false,  -- For Tesla PowerWall, etc.
  _created_at TIMESTAMP DEFAULT NOW(),
  _updated_at TIMESTAMP DEFAULT NOW()
);
```

### utility_requirements
```sql
CREATE TABLE utility_requirements (
  id SERIAL PRIMARY KEY,
  utility_name VARCHAR(100) UNIQUE NOT NULL,  -- 'APS', 'SRP', 'TEP', etc.
  no_bos BOOLEAN DEFAULT false,  -- No BOS required flag
  bos_type_1 VARCHAR(255),
  bos_type_2 VARCHAR(255),
  bos_type_3 VARCHAR(255),
  bos_type_4 VARCHAR(255),
  bos_type_5 VARCHAR(255),
  bos_type_6 VARCHAR(255),
  notes TEXT,
  _created_at TIMESTAMP DEFAULT NOW(),
  _updated_at TIMESTAMP DEFAULT NOW()
);

-- Example data
INSERT INTO utility_requirements (utility_name, bos_type_1, bos_type_2) VALUES
('APS', 'PV Meter', 'Fused AC Disconnect'),
('SRP', 'Dedicated DER Meter', 'Utility AC Disconnect Switch'),
('TEP', 'Utility DG Meter', 'DG Disconnect Switch'),
('TRICO', 'PV Meter', 'Fused AC Disconnect'),
('UniSource', 'Uni-Directional Meter', 'Fused AC Disconnect');
```

### demo_bookings
```sql
CREATE TABLE demo_bookings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  arizona_datetime TIMESTAMP NOT NULL,
  confirmation_number VARCHAR(20) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'confirmed', 'completed', 'cancelled'
  notes TEXT,
  _created_at TIMESTAMP DEFAULT NOW(),
  _updated_at TIMESTAMP DEFAULT NOW()
);
```

### project_process_steps
```sql
CREATE TABLE project_process_steps (
  id SERIAL PRIMARY KEY,
  project_id UUID REFERENCES solar_projects(uuid) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  step_name VARCHAR(100) NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_by INTEGER REFERENCES users(id),
  completed_at TIMESTAMP,
  _created_at TIMESTAMP DEFAULT NOW(),
  _updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, step_number)
);

-- Standard steps
-- 1: Site Survey
-- 2: Site Survey QC
-- 3: Site Plan Generated
-- 4: Site Plan QC
-- 5: Plan Set Generated
-- 6: Plan Set QC
```

---

# 7. Core Business Logic

## Equipment Configuration Flow

### System Selection Hierarchy
```
Project
└── System 1-4
    ├── System Type Selection (solar, battery, hybrid)
    ├── Solar Panels
    │   ├── Make → Model → Quantity
    │   └── New/Existing Flag
    ├── Inverter
    │   ├── Make → Model → Quantity
    │   ├── Type (string/micro/hybrid)
    │   └── Stringing Configuration
    ├── Optimizer (optional)
    ├── Energy Storage (if applicable)
    │   ├── Battery Type 1
    │   ├── Battery Type 2
    │   ├── SMS (Storage Management System)
    │   └── Backup Load Sub-Panel
    └── Balance of System (BOS)
        └── Types 1-6 (utility-specific)
```

### Tesla PowerWall 3 Special Handling

When a user selects Tesla PowerWall 3 as their inverter:

```typescript
// Detection logic
const isTeslaPowerwall3 = 
  inverterSection.selectedMake === 'Tesla' && 
  inverterSection.selectedModel?.includes('PowerWall 3');

// UI Changes when detected:
// 1. Hide Optimizer section (Tesla handles optimization internally)
// 2. Hide Energy Storage section (battery is integrated)
// 3. Show "Tesla Extensions" section (0-3 extensions radio)
// 4. Auto-configure battery settings
```

### BOS (Balance of System) Chain Logic

BOS equipment positioning follows electrical flow:

```
Inverter/String Combiner BOS → SMS → Battery BOS
     (Category 1)           (Cat 2)   (Category 3)
```

**Category-Based Positioning:**
```typescript
const EQUIPMENT_FLOW_ORDER = {
  'string_combiner': 1,  // AC Disconnect, Meter
  'inverter': 2,         // Inverter-triggered BOS
  'sms': 3,              // Storage Management System
  'battery': 4,          // Battery-triggered BOS
  'gateway': 5,          // Gateway equipment
};
```

### APS Configuration Switchboard

For APS utility ESS (Energy Storage System) configurations:

```typescript
// Configuration IDs
'PV-UTILITY'  // PV only - uses utility requirements table
'A-1'         // Battery from Grid + Backup
'A-2'         // Battery from Grid + PCS/Curtailment
'B-1'         // PV + Battery with Backup
'B-2'         // PV + Battery with PCS
'B-3'         // PV + Battery Standard
'C-1'         // DC Coupled with Backup
'C-2'         // DC Coupled Standard
'D'           // Multiple DER systems

// Configuration evaluation
const evaluateConfiguration = (equipmentState: EquipmentState): ConfigId => {
  const { hasSolar, hasBattery, hasBackup, couplingType } = equipmentState;
  
  if (!hasBattery) return 'PV-UTILITY';
  if (!hasSolar && hasBattery && hasBackup) return 'A-1';
  if (!hasSolar && hasBattery && !hasBackup) return 'A-2';
  if (hasSolar && hasBattery && couplingType === 'AC') {
    if (hasBackup) return 'B-1';
    return 'B-3';
  }
  // ... etc
};
```

### Utility Equipment Translation

Different utilities use different terminology for the same equipment:

```typescript
export const UTILITY_EQUIPMENT_TO_STANDARD: Record<string, string> = {
  // APS Specific
  "Utility Disconnect": "AC Disconnect",
  "Photovoltaic System Disconnect Switch": "Fused AC Disconnect",
  "Bi-Directional Meter": "PV Meter",
  
  // SRP Specific
  "DER Storage Meter Disconnect Switch": "AC Disconnect",
  "Dedicated DER Meter": "PV Meter",
  
  // TEP Specific
  "DG Disconnect Switch": "AC Disconnect",
  "Utility DG Meter": "PV Meter",
  
  // TRICO Specific
  "Co-Generation System Utility Disconnect": "AC Disconnect",
};

export const STANDARD_TO_UTILITY_EQUIPMENT: Record<string, Record<string, string>> = {
  "APS": {
    "AC Disconnect": "Utility Disconnect",
    "Fused AC Disconnect": "Photovoltaic System Disconnect Switch",
    "PV Meter": "Bi-Directional Meter",
  },
  "SRP": {
    "AC Disconnect": "DER Storage Meter Disconnect Switch",
    "PV Meter": "Dedicated DER Meter",
  },
  // ... etc
};
```

### System Data Swapping (Automation)

When certain configurations exist (e.g., AC integrated panels in System 1, PowerWall 3 in System 2), the electrical diagram requires reordering:

```typescript
// Swap scenarios
interface SwapScenario {
  detectCondition: () => boolean;
  swapMapping: Record<string, string>;  // sys1 → sys3, sys2 → sys1, etc.
}

// Example: PowerWall 3 systems should be first
const swap2Scenario: SwapScenario = {
  detectCondition: () => {
    return sys1_type === 'ac_integrated' && 
           sys2_type === 'battery_only' && 
           sys2_inverter === 'Tesla PowerWall 3';
  },
  swapMapping: {
    'sys1_': 'sys2_',
    'sys2_': 'sys1_'
  }
};
```

### Photo Organization

Photos are auto-tagged and organized by section:

```typescript
const PHOTO_SECTIONS = [
  'Site',                    // General site photos
  'Electrical',              // Electrical panel, meter, etc.
  'Structural',              // Roof structure, mounting
  'System1_SolarPanels',     // System 1 solar array
  'System1_Inverter',        // System 1 inverter location
  'System1_Battery',         // System 1 battery location
  'System2_SolarPanels',     // System 2 solar array
  // ... etc
];

// Photo capture context
interface PhotoCaptureConfig {
  projectId: string;
  companyId: string;
  section: string;
  visible: boolean;
}
```

---

# 8. UI/UX Standards & Components

## Design System

### Color Palette

```typescript
// src/theme/colors/light.ts
export const lightColors = {
  // Brand Colors
  primary: '#FF6B35',      // Skyfire Orange
  primaryDark: '#E55A2B',
  primaryLight: '#FF8A5C',
  
  // Gradients
  gradientStart: '#FF6B35',
  gradientEnd: '#FF8A5C',
  
  // Backgrounds
  background: '#FFFFFF',
  surface: '#F5F5F5',
  card: '#FFFFFF',
  
  // Text
  textPrimary: '#1A1A1A',
  textSecondary: '#666666',
  textDisabled: '#999999',
  
  // Status
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#F44336',
  info: '#2196F3',
  
  // Borders
  border: '#E0E0E0',
  divider: '#EEEEEE',
};

// src/theme/colors/dark.ts
export const darkColors = {
  primary: '#FF6B35',
  background: '#121212',
  surface: '#1E1E1E',
  card: '#2C2C2C',
  textPrimary: '#FFFFFF',
  textSecondary: '#B0B0B0',
  // ... etc
};
```

### Typography

```typescript
const typography = {
  h1: { fontSize: 28, fontWeight: '700', lineHeight: 34 },
  h2: { fontSize: 24, fontWeight: '600', lineHeight: 30 },
  h3: { fontSize: 20, fontWeight: '600', lineHeight: 26 },
  h4: { fontSize: 18, fontWeight: '600', lineHeight: 24 },
  body1: { fontSize: 16, fontWeight: '400', lineHeight: 22 },
  body2: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
  button: { fontSize: 16, fontWeight: '600', lineHeight: 20 },
};
```

## Core Components

### Button Component

```typescript
// src/components/Button/index.tsx
interface ButtonProps {
  title: string;
  onPress: () => void;
  width?: number | string;
  height?: number;
  selected?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  width = '100%',
  height = 48,
  selected = false,
  disabled = false,
  variant = 'primary',
}) => {
  // Renders with gradient background when primary
  // Uses theme colors appropriately
};
```

### CollapsibleSection

```typescript
// src/components/UI/CollapsibleSection.tsx
interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  initiallyExpanded?: boolean;
  showPhotoButton?: boolean;
  onPhotoPress?: () => void;
  photoCount?: number;
  rightContent?: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  initiallyExpanded = false,
  showPhotoButton = false,
  onPhotoPress,
  photoCount = 0,
}) => {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.rightSection}>
            {showPhotoButton && (
              <PhotoCountBadge count={photoCount} onPress={onPhotoPress} />
            )}
            <ChevronIcon direction={expanded ? 'up' : 'down'} />
          </View>
        </View>
      </TouchableOpacity>
      {expanded && <View style={styles.content}>{children}</View>}
    </View>
  );
};
```

### ThemedDropdown

```typescript
// src/components/UI/ThemedDropdown.tsx
interface ThemedDropdownProps {
  label: string;
  placeholder: string;
  options: { label: string; value: string }[];
  value: string | null;
  onChange: (value: string) => void;
  searchable?: boolean;
  disabled?: boolean;
  error?: string;
}

const ThemedDropdown: React.FC<ThemedDropdownProps> = ({
  label,
  placeholder,
  options,
  value,
  onChange,
  searchable = true,
  disabled = false,
  error,
}) => {
  // Consistent dropdown styling across app
  // Search functionality for large lists (30,000+ equipment items)
  // Error state display
};
```

### ThemedTextInput

```typescript
// src/components/UI/ThemedTextInput.tsx
interface ThemedTextInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  numberOfLines?: number;
  error?: string;
  disabled?: boolean;
}
```

### RadioButtonGroup

```typescript
// src/components/UI/ThemedRadioButtonGroup.tsx
interface RadioOption {
  label: string;
  value: string;
}

interface ThemedRadioButtonGroupProps {
  options: RadioOption[];
  value: string | null;
  onChange: (value: string) => void;
  label?: string;
  direction?: 'horizontal' | 'vertical';
}
```

## Formatting Rules

### Lists & Bullets
- Avoid excessive bullet points in UI
- Use natural language for inline lists
- Bullet points should be 1-2 sentences minimum
- Headers only when content is multi-faceted

### Feedback & Toasts

```typescript
// Success toast
Toast.show({
  type: 'success',
  text1: 'Saved successfully',
  visibilityTime: 2000,
});

// Error toast
Toast.show({
  type: 'error',
  text1: 'Failed to save',
  text2: error.message,
  visibilityTime: 4000,
});

// Info toast
Toast.show({
  type: 'info',
  text1: 'Processing...',
});
```

### Loading States

```typescript
// Inline loading
<ActivityIndicator size="small" color={colors.primary} />

// Full screen loading
<View style={styles.loadingOverlay}>
  <ActivityIndicator size="large" color={colors.primary} />
  <Text>Loading project data...</Text>
</View>
```

### Error Handling in UI

```typescript
// Form field errors
{error && <Text style={styles.errorText}>{error}</Text>}

// Section-level errors
<ErrorBoundary fallback={<ErrorFallback onRetry={refetch} />}>
  <EquipmentSection />
</ErrorBoundary>
```

---

# 9. API Reference

## Base URL
```
Production: https://api.skyfireapp.io
Local Dev:  http://localhost:3000
```

## Authentication Endpoints

### POST /auth/login
```typescript
// Request
{
  email: string;
  password: string;
}

// Response (200 OK)
{
  success: true;
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    uuid: string;
    email: string;
    firstName: string;
    lastName: string;
    status: number;
  }
}

// Response (400 Bad Request)
{
  success: false;
  message: "Invalid email or password"
}
```

### POST /auth/register-complete
```typescript
// Request
{
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNo: string;
  companyName: string;
}

// Response (201 Created)
{
  success: true;
  message: "Registration successful. Awaiting approval."
  user: { id, uuid, email }
}
```

### POST /auth/refresh-token
```typescript
// Request
{
  refreshToken: string;
}

// Response
{
  success: true;
  accessToken: string;
  refreshToken: string;
}
```

### POST /auth/handle-login
Called after successful login to fetch user context.
```typescript
// Response
{
  success: true;
  user: { ... },
  company: { ... }
}
```

## Project Endpoints

### GET /project/:projectId
```typescript
// Response
{
  success: true;
  data: {
    uuid: string;
    project_name: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    utility: string;
    ahj: string;
    status: string;
    completed_step: number;
    company: { ... }
  }
}
```

### POST /project
```typescript
// Request
{
  project_name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  company_id: string;  // UUID
}

// Response
{
  success: true;
  data: { uuid, project_name, ... }
}
```

### PATCH /project/:projectId/status
```typescript
// Request
{
  completed_step: number;
}

// Response
{
  success: true;
  message: "Status updated"
}
```

### GET /project/:projectId/system-details
Fetch all equipment configuration data.

### PATCH /project/:projectId/system-details
Update equipment configuration (partial update).

```typescript
// Request - only send changed fields
{
  sys1_solar_panel_make: "LG",
  sys1_solar_panel_model: "NeON 2 400W",
  sys1_solar_panel_quantity: 20
}
```

## Photo Endpoints

### POST /project/:projectId/photos
```typescript
// Request
{
  s3_key: string;
  section: string;
  tag?: string;
  notes?: string;
  media_type: "photo" | "video";
}

// Response
{
  success: true;
  data: { uuid, file_url, ... }
}
```

### GET /project/:projectId/photos
```typescript
// Query params
?section=Site  // Optional filter

// Response
{
  success: true;
  data: [
    {
      uuid: string;
      file_url: string;
      thumbnail_url: string;
      section: string;
      tag: string;
      notes: string;
      media_type: string;
      _created_at: string;
    }
  ]
}
```

### DELETE /project/:projectId/photos/:photoId
Soft delete - sets deleted_at timestamp.

### DELETE /project/:projectId/photos/bulk-delete
```typescript
// Request
{
  photoIds: string[];  // Array of UUIDs
}
```

## Equipment Database Endpoints

### GET /api/solar-panels
```typescript
// Query params
?search=LG&limit=50&offset=0

// Response
{
  success: true;
  data: [...],
  total: 15322,
  page: 1,
  limit: 50
}
```

### GET /api/solar-panels/:id
### GET /api/inverters
### GET /api/inverters/:id

## File Upload

### GET /company/:companyId/file-upload-url
Get presigned S3 URL for direct upload.

```typescript
// Query params
?fileName=photo_001.jpg&contentType=image/jpeg

// Response
{
  success: true;
  uploadUrl: "https://skyfire-media-files.s3.us-west-1.amazonaws.com/...",
  key: "uploads/company-uuid/project-uuid/photo_001.jpg"
}
```

## Admin Endpoints

### GET /org/pending-users
List users awaiting approval.

### POST /org/approve-user/:userId
Approve a pending user (sets status to 2).

### GET /api/admin/companies/list-active
List all active companies (super admin only).

---

# 10. Development Workflow

## Local Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)
- PostgreSQL (local or remote access)

### Mobile App Setup

```bash
# Clone repository
git clone [repository-url]
cd skyfire_mobileapp_dev

# Install dependencies
npm install

# iOS specific (macOS only)
cd ios && pod install && cd ..

# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

### Backend Setup

```bash
cd skyfire_backend_dev

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials, AWS keys, etc.

# Build TypeScript
npm run build

# Run development server
npm run dev

# Or run with PM2
pm2 start ecosystem.config.js
```

## Git Workflow

### Branch Naming
```
feature/[feature-name]
bugfix/[bug-description]
hotfix/[critical-fix]
release/[version]
```

### Commit Messages
```
feat: Add Tesla PowerWall 3 extensions support
fix: Resolve photo upload S3 region mismatch
docs: Update API documentation
refactor: Simplify BOS chain positioning logic
style: Format equipment section components
test: Add unit tests for utility translations
chore: Update dependencies
```

### Deployment Process

1. **Local Testing**
   ```bash
   # Test build
   npm run build
   
   # Run linter
   npm run lint
   
   # Type check
   npm run type-check
   ```

2. **Push to GitHub**
   ```bash
   git add .
   git commit -m "feat: Description of changes"
   git push origin feature/branch-name
   ```

3. **Server Deployment (Backend)**
   ```bash
   # SSH into server
   ssh bitnami@ip-172-26-6-240
   
   # Navigate to project
   cd ~/opt/bitnami/projects/skyfire_backend_dev
   
   # Pull changes
   git pull origin main
   
   # Install dependencies if needed
   npm install
   
   # Build
   npm run build
   
   # Restart PM2
   pm2 restart skyfire-server
   ```

4. **Mobile App Deployment**
   ```bash
   # Build for iOS
   eas build --platform ios --profile production
   
   # Build for Android
   eas build --platform android --profile production
   
   # Submit to stores
   eas submit --platform ios
   eas submit --platform android
   ```

## Testing Strategy

### Manual Testing Checklist

```markdown
## Critical (Must Test Before Release):
- [ ] App Launch
- [ ] Photo Capture & Gallery
- [ ] Equipment Configuration
- [ ] Multi-System Management
- [ ] Data Persistence
- [ ] Maps Integration

## Important:
- [ ] Backend API
- [ ] Forms & Input
- [ ] Utility Features
- [ ] Authentication Flow

## Device Coverage:
- [ ] Android Phone
- [ ] Android Tablet
- [ ] iPhone
- [ ] iPad

## OS Versions:
- [ ] Android 11-15
- [ ] iOS 15-18
```

## Debugging Tips

### Metro Logs
```bash
# Clear cache and restart
npx react-native start --reset-cache

# Watch logs
adb logcat | grep -i react
```

### Backend Logs
```bash
# View PM2 logs
pm2 logs skyfire-server --lines 100

# Real-time monitoring
pm2 logs skyfire-server --raw | grep --line-buffered "ERROR\|DEBUG"
```

### Database Queries
```bash
# Connect to PostgreSQL
psql -h your-rds-endpoint -U postgres -d skyfire_db

# Useful queries
\d+ project_system_details  -- Show table schema
SELECT * FROM users WHERE email = 'test@example.com';
```

---

# 11. Deployment & DevOps

## AWS Infrastructure

### Lightsail Instance
- **Name**: skyfire-backend
- **Region**: us-west-2
- **OS**: Bitnami (Ubuntu-based)
- **Instance Size**: Small (2GB RAM, 1 vCPU)

### RDS PostgreSQL
- **Region**: us-west-2
- **Instance**: db.t3.micro
- **Storage**: 20GB SSD

### S3 Buckets
- **skyfire-media-files** (us-west-1): Project photos and videos
- **skyfire-streetview-analytics** (us-west-1): Street View captures

### SES (Simple Email Service)
- **Region**: us-west-2
- **Verified Domain**: skyfiresd.com
- **From Address**: app@skyfiresd.com

## PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'skyfire-server',
    script: 'dist/index.js',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      AWS_S3_BUCKET: 'skyfire-media-files',
      AWS_REGION: 'us-west-1',
      // ... other env vars
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/error.log',
    out_file: './logs/output.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

## SSL/HTTPS
- Domain: api.skyfireapp.io
- Certificate: Let's Encrypt (auto-renewed)
- Nginx reverse proxy on Lightsail

## Monitoring

### PM2 Commands
```bash
pm2 status              # Check process status
pm2 logs                # View logs
pm2 restart all         # Restart all processes
pm2 reload all          # Zero-downtime reload
pm2 monit               # Real-time monitoring
pm2 env [id]            # View environment variables
```

### Health Checks
```bash
# API health check
curl https://api.skyfireapp.io/health

# Database connection test
curl https://api.skyfireapp.io/db-status
```

---

# 12. Monorepo Migration Strategy

## Proposed Structure

```
skyfire-monorepo/
├── apps/
│   ├── mobile/                 # React Native app
│   │   ├── src/
│   │   ├── ios/
│   │   ├── android/
│   │   ├── app.json
│   │   └── package.json
│   │
│   ├── web/                    # React web app (Q1 2026)
│   │   ├── src/
│   │   ├── public/
│   │   └── package.json
│   │
│   └── api/                    # Backend server
│       ├── src/
│       └── package.json
│
├── packages/
│   ├── shared/                 # Shared code
│   │   ├── types/             # TypeScript interfaces
│   │   ├── utils/             # Utility functions
│   │   ├── constants/         # Shared constants
│   │   └── validators/        # Validation schemas
│   │
│   ├── ui/                     # Shared UI (future)
│   │   ├── components/
│   │   └── styles/
│   │
│   └── api-client/            # API client library
│       ├── auth.ts
│       ├── projects.ts
│       └── equipment.ts
│
├── tools/
│   ├── eslint-config/
│   └── typescript-config/
│
├── package.json               # Root package.json
├── turbo.json                 # Turborepo config
├── pnpm-workspace.yaml        # pnpm workspaces
└── tsconfig.base.json
```

## Shared Packages

### @skyfire/types
```typescript
// packages/shared/types/project.ts
export interface Project {
  uuid: string;
  project_name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  utility: string;
  ahj: string;
  status: ProjectStatus;
  completed_step: number;
}

export type ProjectStatus = 
  | 'draft'
  | 'survey_in_progress'
  | 'survey_complete'
  | 'design_in_progress'
  | 'design_complete'
  | 'submitted';
```

### @skyfire/utils
```typescript
// packages/shared/utils/equipment.ts
export function getUtilityEquipmentName(
  standardName: string, 
  utility: string
): string {
  return STANDARD_TO_UTILITY_EQUIPMENT[utility]?.[standardName] || standardName;
}

export function calculateSystemWattage(
  panelWattage: number, 
  quantity: number
): number {
  return panelWattage * quantity;
}
```

### @skyfire/api-client
```typescript
// packages/api-client/projects.ts
import { Project } from '@skyfire/types';

export class ProjectsAPI {
  constructor(private baseUrl: string, private token: string) {}

  async getProject(id: string): Promise<Project> {
    const response = await fetch(`${this.baseUrl}/project/${id}`, {
      headers: { Authorization: `Bearer ${this.token}` }
    });
    const data = await response.json();
    return data.data;
  }

  async updateSystemDetails(
    projectId: string, 
    updates: Partial<SystemDetails>
  ): Promise<void> {
    await fetch(`${this.baseUrl}/project/${projectId}/system-details`, {
      method: 'PATCH',
      headers: { 
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });
  }
}
```

## Migration Steps

### Phase 1: Setup (Week 1)
1. Create monorepo structure with Turborepo
2. Configure pnpm workspaces
3. Set up shared TypeScript configs
4. Configure ESLint for monorepo

### Phase 2: Extract Shared Code (Weeks 2-3)
1. Move TypeScript interfaces to @skyfire/types
2. Extract utility functions to @skyfire/utils
3. Create @skyfire/api-client from existing services
4. Update mobile app imports

### Phase 3: Mobile App Migration (Weeks 3-4)
1. Move mobile app to apps/mobile
2. Update import paths
3. Configure build tools for monorepo
4. Test thoroughly

### Phase 4: Web App Development (Weeks 5-12)
1. Create web app in apps/web
2. Reuse shared packages
3. Convert React Native components to React
4. Style with CSS/Tailwind

## Key Conversions (Mobile → Web)

```typescript
// React Native
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

// React Web
import { useNavigate } from 'react-router-dom';
// View → div
// Text → span/p/h1-h6
// TouchableOpacity → button
// ScrollView → div with overflow
// AsyncStorage → localStorage
```

---

# 13. Common Patterns & Best Practices

## State Management

### Local vs Global State
```typescript
// Local state - component-specific, temporary
const [isEditing, setIsEditing] = useState(false);
const [searchQuery, setSearchQuery] = useState('');

// Global state (Redux) - app-wide, persistent
// - User authentication
// - Theme preferences
// - Current project context
```

### Debounced Auto-Save
```typescript
// Pattern for equipment sections
const debouncedSave = useDebouncedCallback(
  async (payload: Partial<SystemDetails>) => {
    try {
      await api.updateSystemDetails(projectId, payload);
      Toast.show({ type: 'success', text1: 'Saved' });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Failed to save' });
    }
  },
  1000 // 1 second debounce
);

// Trigger on field changes
const handleFieldChange = (field: string, value: any) => {
  setState(prev => ({ ...prev, [field]: value }));
  debouncedSave({ [`${systemPrefix}${field}`]: value });
};
```

## API Calls

### Error Handling Pattern
```typescript
const fetchData = async () => {
  setLoading(true);
  setError(null);
  
  try {
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Request failed');
    }
    
    setData(data.data);
  } catch (error) {
    console.error('[fetchData] Error:', error);
    setError(error.message);
    Toast.show({ type: 'error', text1: error.message });
  } finally {
    setLoading(false);
  }
};
```

### Request Logging
```typescript
// Debug logging for API calls
console.debug('[API Request]', method, url, body);
console.debug('[API Response]', url, '→', status, data);
console.warn('[API Error]', url, '→', status, error);
```

## Component Patterns

### Equipment Section Pattern
```typescript
interface EquipmentSectionProps {
  projectId: string;
  companyId: string;
  systemPrefix: SystemPrefix;
  onPhotoCapture?: () => void;
}

const EquipmentSection: React.FC<EquipmentSectionProps> = ({
  projectId,
  companyId,
  systemPrefix,
  onPhotoCapture,
}) => {
  // Use section-specific hook
  const {
    state,
    updateField,
    save,
    isLoading,
  } = useEquipmentSection({
    projectId,
    companyId,
    systemPrefix,
    sectionKey: 'solar_panel',
  });

  return (
    <CollapsibleSection
      title="Solar Panels"
      showPhotoButton
      onPhotoPress={onPhotoCapture}
    >
      <ThemedDropdown
        label="Make"
        value={state.selectedMake}
        options={makeOptions}
        onChange={(value) => updateField('selectedMake', value)}
      />
      {/* More fields */}
    </CollapsibleSection>
  );
};
```

### Multi-System Component Pattern
```typescript
// Wrapper components for system isolation
const System1SolarSection = (props: Props) => (
  <SolarPanelSection {...props} systemPrefix="sys1_" key="sys1-solar" />
);

const System2SolarSection = (props: Props) => (
  <SolarPanelSection {...props} systemPrefix="sys2_" key="sys2-solar" />
);

// Usage in parent
{activeSystem === 1 && <System1SolarSection {...commonProps} />}
{activeSystem === 2 && <System2SolarSection {...commonProps} />}
```

## Database Operations

### Idempotent Updates
```typescript
// Always handle null/undefined gracefully
const updateField = (field: string, value: any) => {
  const sanitizedValue = value ?? null;  // Convert undefined to null
  
  // For numbers, ensure proper type
  if (typeof sanitizedValue === 'string' && !isNaN(Number(sanitizedValue))) {
    return { [field]: Number(sanitizedValue) };
  }
  
  return { [field]: sanitizedValue };
};
```

### Transaction Safety
```typescript
// For complex updates involving multiple tables
const updateProjectWithDetails = async (
  projectId: string, 
  projectData: Partial<Project>,
  systemDetails: Partial<SystemDetails>
) => {
  const queryRunner = connection.createQueryRunner();
  await queryRunner.startTransaction();
  
  try {
    await queryRunner.manager.update(Project, projectId, projectData);
    await queryRunner.manager.update(SystemDetails, { project_id: projectId }, systemDetails);
    await queryRunner.commitTransaction();
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
};
```

## Defensive Programming

### Null Safety
```typescript
// Always provide fallbacks
const displayName = project?.project_name || 'Untitled Project';
const quantity = parseInt(state.quantity, 10) || 0;
const items = response?.data?.items ?? [];
```

### Type Guards
```typescript
function isTeslaPowerWall(
  make: string | null | undefined, 
  model: string | null | undefined
): boolean {
  return (
    typeof make === 'string' &&
    typeof model === 'string' &&
    make.toLowerCase() === 'tesla' &&
    model.toLowerCase().includes('powerwall 3')
  );
}
```

---

# 14. Troubleshooting Guide

## Common Issues & Solutions

### 1. Photo Upload Fails (S3 Region Mismatch)
**Symptom**: "PermanentRedirect" error, photos fail to save

**Cause**: S3 bucket region doesn't match configuration

**Solution**:
```bash
# Check current PM2 environment
pm2 env [process-id] | grep AWS_REGION

# Fix ecosystem.config.js
AWS_REGION: 'us-west-1'  # Must match S3 bucket region

# Restart with environment update
pm2 restart skyfire-server --update-env
```

### 2. Login Fails After Approval
**Symptom**: User approved but can't login

**Cause**: User status not properly set to ACTIVE (2)

**Solution**:
```sql
-- Check user status
SELECT id, email, status FROM users WHERE email = 'user@example.com';

-- Fix if needed
UPDATE users SET status = 2 WHERE email = 'user@example.com';
```

### 3. Equipment State Contamination Between Systems
**Symptom**: System 1 and System 2 share configuration data

**Cause**: Missing system isolation in hooks/components

**Solution**:
- Use separate component instances with unique keys
- Ensure systemPrefix is properly passed through
- Deep copy objects before modifying
- Add unique React keys: `key={`${systemPrefix}-section`}`

### 4. App Crashes on iOS Release Build
**Symptom**: Works in debug, crashes in production

**Common Causes**:
1. `__DEV__` undefined in production
   ```typescript
   // Fix
   devTools: (typeof __DEV__ !== 'undefined' && __DEV__) ? {...} : false
   ```

2. Voice module not initialized
   ```typescript
   // Add safe initialization in shim
   setTimeout(() => {
     try {
       // Initialize voice module
     } catch (error) {
       console.warn('Voice init failed:', error);
     }
   }, 100);
   ```

### 5. Metro Bundler Issues
**Symptom**: "Unable to resolve module" errors

**Solutions**:
```bash
# Clear all caches
npx react-native start --reset-cache
cd ios && pod install && cd ..
rm -rf node_modules && npm install

# Clean Android build
cd android && ./gradlew clean && cd ..
```

### 6. TypeORM Connection Issues
**Symptom**: "Connection not found" errors

**Solution**:
```typescript
// Ensure connection is established before queries
import { getConnection, Connection } from 'typeorm';

let connection: Connection;

const ensureConnection = async () => {
  if (!connection || !connection.isConnected) {
    connection = getConnection();
  }
  return connection;
};
```

### 7. 16KB Page Size Compliance (Android)
**Symptom**: App rejected from Play Store

**Cause**: Native libraries not aligned for Android 15+

**Solution**:
- Upgrade React Native to 0.78.3+
- Run compliance check:
  ```bash
  unzip -l app-release.aab | grep '\.so$'
  ```
- Rebuild all native dependencies

## Debug Logging Locations

```typescript
// Frontend (Metro)
console.log('[ComponentName] Action:', data);
console.debug('[API Request]', url);
console.error('[Error]', error);

// Backend (PM2 logs)
console.log('[Endpoint] Processing request');
console.error('[Endpoint] Error:', error);

// View logs
pm2 logs skyfire-server --lines 100
```

## Emergency Contacts & Resources

- **Server SSH**: `ssh bitnami@ip-172-26-6-240`
- **AWS Console**: Check Lightsail, RDS, S3, SES dashboards
- **PM2 Dashboard**: `pm2 monit`
- **Database**: Access via pgAdmin or psql CLI

---

# Appendix A: Glossary

| Term | Definition |
|------|------------|
| **AHJ** | Authority Having Jurisdiction - local building authority |
| **BOS** | Balance of System - electrical equipment beyond panels/inverters |
| **DC Coupling** | Battery connected on DC side of inverter |
| **AC Coupling** | Battery connected on AC side (separate inverter) |
| **ESS** | Energy Storage System - battery storage installation |
| **MPPT** | Maximum Power Point Tracking - inverter input channels |
| **PCS** | Power Control System - grid interaction management |
| **SMS** | Storage Management System - battery controller |
| **PE Stamp** | Professional Engineer certification on plans |
| **Site Survey** | Initial data collection at installation site |
| **Stringing** | Configuration of solar panels to inverter inputs |

---

# Appendix B: Keyboard Shortcuts (Development)

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + Shift + P` | VS Code command palette |
| `Cmd/Ctrl + J` | Toggle terminal |
| `r` | Reload Metro bundler |
| `d` | Open developer menu (emulator) |
| `Cmd + D` (iOS sim) | Open developer menu |

---

*Document maintained by Skyfire Solar Design development team.*
*Last updated: January 2026*
