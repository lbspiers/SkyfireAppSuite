# Solar Equipment API Implementation Guide

## Overview

This document provides a comprehensive guide for implementing solar panel and inverter APIs in the Skyfire Solar Project Management System. It includes both backend patterns analysis and complete frontend implementation.

## Table of Contents

1. [Backend Patterns Analysis](#backend-patterns-analysis)
2. [File Structure Map](#file-structure-map)
3. [Code Templates and Examples](#code-templates-and-examples)
4. [Frontend API Infrastructure](#frontend-api-infrastructure)
5. [Configuration Requirements](#configuration-requirements)
6. [Database Schema Reference](#database-schema-reference)
7. [Implementation Checklist](#implementation-checklist)

---

## 1. Backend Patterns Analysis

### Technology Stack
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with TypeORM
- **Validation**: @sinclair/typebox with AJV
- **Authentication**: JWT with refresh tokens
- **File Storage**: AWS S3
- **Email**: Mailjet
- **Logging**: Pino

### Project Structure
```
src/
├── controller/           # API route handlers
├── entity/              # TypeORM database entities
├── repository/          # Data access layer
├── routes/             # Route definitions
├── middlewares/        # Express middleware
├── util/               # Utility functions
├── db/                 # Database configuration
├── logger/             # Logging setup
├── cron-jobs/          # Scheduled tasks
└── index.ts            # Main application entry point
```

### Entity Patterns
- Use TypeORM decorators with proper column options
- Implement UUID generation for external references
- Use `VersionedEntity` base class for auditing
- Moment.js for date handling with UTC conversion
- Snake_case for database columns, camelCase for TypeScript

### Controller Patterns
- Use `handleAsync` wrapper for error handling
- TypeBox schemas for validation
- Descriptive function and type names
- Transaction-based operations when needed
- Consistent response format

### Response Format Standards
```typescript
// Success Response
{
  success: true,
  data: {...},
  message: "Operation completed successfully"
}

// Error Response
{
  success: false,
  message: "Error description",
  error: "Detailed error (dev only)",
  requestId: "uuid"
}
```

### Error Handling Approaches
- Global error handler middleware
- `handleAsync` wrapper for controllers
- Structured error responses
- Logging with context
- Development vs production error details

---

## 2. File Structure Map

### Backend Files to Create

#### Entities
```
/src/entity/solar/
├── solar-panel.ts          # Solar panel entity
└── inverter.ts             # Inverter entity
```

#### Controllers
```
/src/controller/solar-panels/
├── index.ts                # Main router
├── create-solar-panel.ts   # POST /solar-panels
├── get-solar-panels.ts     # GET /solar-panels
├── get-solar-panel.ts      # GET /solar-panels/:id
├── update-solar-panel.ts   # PUT /solar-panels/:id
├── delete-solar-panel.ts   # DELETE /solar-panels/:id
├── search-solar-panels.ts  # GET /solar-panels/search
├── bulk-solar-panels.ts    # POST/PUT /solar-panels/bulk
├── import-solar-panels.ts  # POST /solar-panels/import
├── export-solar-panels.ts  # GET /solar-panels/export
└── solar-panel-stats.ts    # GET /solar-panels/stats

/src/controller/inverters/
├── index.ts                # Main router
├── create-inverter.ts      # POST /inverters
├── get-inverters.ts        # GET /inverters
├── get-inverter.ts         # GET /inverters/:id
├── update-inverter.ts      # PUT /inverters/:id
├── delete-inverter.ts      # DELETE /inverters/:id
├── search-inverters.ts     # GET /inverters/search
├── bulk-inverters.ts       # POST/PUT /inverters/bulk
├── import-inverters.ts     # POST /inverters/import
├── export-inverters.ts     # GET /inverters/export
└── inverter-stats.ts       # GET /inverters/stats
```

#### Repository
```
/src/repository/
├── solar-panel.ts          # Solar panel data access
└── inverter.ts             # Inverter data access
```

### Frontend Files Created

#### Types
- `/src/types/solarEquipment.ts` - Complete TypeScript interfaces

#### API Services
- `/src/api/solarPanel.service.ts` - Solar panel API functions
- `/src/api/inverter.service.ts` - Inverter API functions

#### Hooks
- `/src/hooks/useSolarEquipment.ts` - Custom React hooks for state management

#### Utilities
- `/src/utils/solarEquipmentUtils.ts` - Validation, transformation, and utility functions

#### Configuration
- `/src/config/apiEndPoint.tsx` - Updated with new endpoints

---

## 3. Code Templates and Examples

### Entity Template
```typescript
import { Entity, PrimaryGeneratedColumn, Column, Generated } from 'typeorm';
import { VersionedEntity } from '../../util/entity-templates';
import { STRING, DECIMAL, INTEGER, BOOLEAN } from '../../util/entity-column-options';

@Entity('solar_panels')
export class SolarPanel extends VersionedEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid', unique: true })
  @Generated('uuid')
  uuid: string;

  @Column({ ...STRING })
  manufacturer_model: string;

  @Column({ ...STRING, nullable: true })
  manufacturer: string;

  @Column({ ...STRING, nullable: true })
  model_number: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ ...DECIMAL, nullable: true })
  nameplate_pmax: number;

  @Column({ ...DECIMAL, nullable: true })
  ptc: number;

  @Column({ ...BOOLEAN, default: true })
  is_active: boolean;
}
```

### Controller Method Template
```typescript
import { Request, Response } from 'express';
import { Static, Type } from '@sinclair/typebox';
import { getConnection } from '../../db/db';
import handleAsync from '../../util/handle-async';

const CreateSolarPanelSchema = Type.Object({
  manufacturerModel: Type.String(),
  manufacturer: Type.Optional(Type.String()),
  modelNumber: Type.Optional(Type.String()),
  nameplatePmax: Type.Optional(Type.Number()),
});

type CreateSolarPanelType = Static<typeof CreateSolarPanelSchema>;

const CreateSolarPanel = handleAsync(
  async (req: Request, res: Response): Promise<any> => {
    const data = req.body as CreateSolarPanelType;

    return getConnection().transaction(async (manager) => {
      const panel = manager.create(SolarPanel, {
        ...data,
        created_by: req.user.id,
      });

      const savedPanel = await manager.save(panel);

      return res.status(201).json({
        success: true,
        data: savedPanel,
        message: 'Solar panel created successfully'
      });
    });
  }
);

export { CreateSolarPanel, CreateSolarPanelSchema };
```

### Repository Method Template
```typescript
import { getConnection } from '../db/db';
import { SolarPanel } from '../entity/solar/solar-panel';

export async function getSolarPanelByUuid(uuid: string) {
  return getConnection()
    .getRepository(SolarPanel)
    .findOne({
      where: { uuid },
      cache: {
        id: `solar_panel_${uuid}`,
        milliseconds: 300000,
      }
    });
}

export async function listSolarPanelsByManufacturer(manufacturer: string) {
  return getConnection()
    .getRepository(SolarPanel)
    .find({
      where: { manufacturer, is_active: true },
      order: { model_number: 'ASC' },
      cache: {
        id: `solar_panels_${manufacturer}`,
        milliseconds: 600000,
      }
    });
}
```

### Route Configuration Template
```typescript
import { Router } from 'express';
import { verifyUserExistance } from '../../middlewares/authenticate-user';
import { validate } from '../../middlewares/validate-schema';
import { CreateSolarPanel, CreateSolarPanelSchema } from './create-solar-panel';
import { GetSolarPanels } from './get-solar-panels';

const router = Router();

router.post('/',
  verifyUserExistance,
  validate(CreateSolarPanelSchema),
  CreateSolarPanel
);

router.get('/',
  verifyUserExistance,
  GetSolarPanels
);

export default router;
```

---

## 4. Frontend API Infrastructure

### Complete Implementation Delivered

#### TypeScript Interfaces (`/src/types/solarEquipment.ts`)
- `SolarPanel` - Solar panel entity interface
- `Inverter` - Inverter entity interface
- `SolarPanelCreateRequest` - API request interfaces
- `InverterCreateRequest` - API request interfaces
- `SolarPanelFormData` - Form handling interfaces
- `InverterFormData` - Form handling interfaces
- Query parameter interfaces for filtering and pagination
- Error handling interfaces
- API response interfaces

#### API Service Functions

**Solar Panel Service (`/src/api/solarPanel.service.ts`)**
- `getSolarPanels(params?)` - List solar panels with filtering
- `getSolarPanelById(id)` - Get single solar panel
- `getSolarPanelManufacturers()` - Get manufacturers list
- `getSolarPanelModels(manufacturer)` - Get models by manufacturer
- `createSolarPanel(data)` - Create new solar panel
- `updateSolarPanel(id, data)` - Update solar panel
- `deleteSolarPanel(id)` - Delete solar panel
- `searchSolarPanels(query)` - Search functionality
- `bulkCreateSolarPanels(panels)` - Bulk operations
- `importSolarPanels(file)` - File import
- `exportSolarPanels(params?)` - Data export
- Utility functions for data transformation

**Inverter Service (`/src/api/inverter.service.ts`)**
- Complete set of CRUD operations
- Specialized functions for microinverters and power optimizers
- Power range filtering
- String configuration recommendations
- Efficiency curve data
- Compatibility checking with solar panels
- All utility functions for data transformation

#### Custom React Hooks (`/src/hooks/useSolarEquipment.ts`)
- `useSolarPanels(enabled)` - Solar panel data management
- `useInverters(enabled)` - Inverter data management
- `useSolarPanelSection(enabled)` - Manufacturer/model dropdowns
- `useInverterSection(enabled)` - Manufacturer/model dropdowns
- `useSolarPanelCrud()` - Create/Update/Delete operations
- `useInverterCrud()` - Create/Update/Delete operations

#### Utility Functions (`/src/utils/solarEquipmentUtils.ts`)
- Form validation functions
- Data transformation between API and forms
- Calculation utilities (efficiency, power ratios, etc.)
- Search and filtering utilities
- Sorting utilities
- Formatting functions for display
- Type conversion helpers

### Error Handling and Loading States

#### Error Management
- Consistent error interface (`SolarEquipmentApiError`)
- Service-level error handling with detailed logging
- Hook-level error state management
- Form validation with specific error messages

#### Loading State Management
- Individual loading states for different operations
- Debounced operations to prevent multiple API calls
- Cancel token support for component unmounting
- Loading indicators for long-running operations

---

## 5. Configuration Requirements

### API Endpoint Configuration
✅ **COMPLETED** - Added `SOLAR_EQUIPMENT` section to `/src/config/apiEndPoint.tsx` with all necessary endpoints.

### Route Configuration (Backend - To Be Implemented)
Add to main router in `index.ts`:
```typescript
import solarPanelRoutes from './controller/solar-panels';
import inverterRoutes from './controller/inverters';

app.use('/solar-panels', solarPanelRoutes);
app.use('/inverters', inverterRoutes);
```

### Database Configuration
Update TypeORM entity list to include:
- `SolarPanel` entity
- `Inverter` entity

### Environment Variables
No additional environment variables required - uses existing API configuration.

### CORS Configuration
Existing CORS configuration should handle new endpoints automatically.

---

## 6. Database Schema Reference

### Solar Panels Table Schema
```sql
CREATE TABLE solar_panels (
  id SERIAL PRIMARY KEY,
  manufacturer_model VARCHAR NOT NULL,
  manufacturer VARCHAR,
  model_number VARCHAR,
  description TEXT,
  nameplate_pmax NUMERIC,
  ptc NUMERIC,
  nameplate_vpmax NUMERIC,
  nameplate_ipmax NUMERIC,
  nameplate_voc NUMERIC,
  nameplate_isc NUMERIC,
  average_noct NUMERIC,
  n_s INTEGER,
  short_ft NUMERIC,
  long_ft NUMERIC,
  weight_lbs NUMERIC,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Inverters Table Schema
```sql
CREATE TABLE inverters (
  id SERIAL PRIMARY KEY,
  make_model VARCHAR NOT NULL,
  manufacturer_name VARCHAR,
  model_number VARCHAR,
  description TEXT,
  max_continuous_output_power_kw NUMERIC,
  nominal_voltage_vac INTEGER,
  weighted_efficiency_percent NUMERIC,
  built_in_meter BOOLEAN,
  microinverter BOOLEAN,
  power_optimizer BOOLEAN,
  night_tare_loss NUMERIC,
  voltage_minimum NUMERIC,
  voltage_nominal NUMERIC,
  voltage_maximum NUMERIC,
  cec_efficiency NUMERIC,
  max_cont_output_amps NUMERIC,
  max_input_isc_1 NUMERIC,
  max_input_isc_2 NUMERIC,
  -- ... max_input_isc_3 through max_input_isc_12
  solaredge_series VARCHAR,
  hybrid VARCHAR,
  equipment_type VARCHAR,
  max_strings_branches INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 7. Implementation Checklist

### Frontend Implementation ✅ COMPLETED
- [x] TypeScript interfaces and types
- [x] API service functions for solar panels
- [x] API service functions for inverters
- [x] Custom React hooks for state management
- [x] Error handling utilities
- [x] Loading state management
- [x] Form validation utilities
- [x] Data transformation utilities
- [x] API endpoint configuration
- [x] Comprehensive documentation

### Backend Implementation 🔄 TO BE IMPLEMENTED
- [ ] Create database entities (SolarPanel, Inverter)
- [ ] Implement repository functions
- [ ] Create controller endpoints for solar panels
- [ ] Create controller endpoints for inverters
- [ ] Add route configurations
- [ ] Implement validation schemas
- [ ] Add error handling middleware
- [ ] Create database migrations
- [ ] Add unit tests
- [ ] Update main application router

### Integration Tasks 🔄 PENDING
- [ ] Test API endpoints with frontend services
- [ ] Implement UI components using hooks
- [ ] Add search and filtering functionality
- [ ] Implement bulk operations UI
- [ ] Add file import/export features
- [ ] Performance optimization
- [ ] Error boundary implementation
- [ ] Loading state UI components

---

## Usage Examples

### Basic Solar Panel Management
```typescript
import { useSolarPanels, useSolarPanelCrud } from '../hooks/useSolarEquipment';

function SolarPanelManager() {
  const { panels, loading, error, refresh } = useSolarPanels();
  const { createPanel, updatePanel, deletePanel } = useSolarPanelCrud();

  const handleCreate = async (data) => {
    const result = await createPanel(data);
    if (result.success) {
      refresh();
    }
  };

  return (
    <div>
      {loading && <div>Loading...</div>}
      {error && <div>Error: {error.message}</div>}
      {panels.map(panel => (
        <div key={panel.id}>{panel.manufacturer} {panel.modelNumber}</div>
      ))}
    </div>
  );
}
```

### Equipment Selection Dropdowns
```typescript
import { useSolarPanelSection } from '../hooks/useSolarEquipment';

function EquipmentSelector() {
  const { makes, models, loadingMakes, loadMakes, loadModels } = useSolarPanelSection();

  useEffect(() => {
    loadMakes();
  }, [loadMakes]);

  return (
    <div>
      <select onChange={(e) => loadModels(e.target.value)}>
        {makes.map(make => (
          <option key={make.value} value={make.value}>{make.label}</option>
        ))}
      </select>

      <select>
        {models.map(model => (
          <option key={model.value} value={model.value}>{model.label}</option>
        ))}
      </select>
    </div>
  );
}
```

## Conclusion

This implementation provides a complete frontend API infrastructure for solar equipment management while maintaining consistency with existing project patterns. The backend implementation should follow the documented patterns and templates to ensure seamless integration.

The delivered frontend infrastructure includes:
- **Type-safe API interactions** with comprehensive TypeScript interfaces
- **Reusable React hooks** for state management following existing patterns
- **Error handling and loading states** consistent with project standards
- **Utility functions** for validation, transformation, and calculations
- **Comprehensive documentation** for backend implementation

All code follows the project's established patterns for maintainability and consistency.