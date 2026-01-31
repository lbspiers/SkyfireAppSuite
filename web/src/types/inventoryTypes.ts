/**
 * Inventory & Equipment Type Definitions
 * Types for preferred equipment management system
 */

// ============================================================================
// EQUIPMENT CATEGORY TYPES
// ============================================================================

export type EquipmentCategoryId =
  | 'solar-panels'
  | 'inverters'
  | 'micro-inverters'
  | 'batteries'
  | 'storage-management'
  | 'ac-disconnects'
  | 'pv-meters'
  | 'load-centers'
  | 'rails'
  | 'attachments'
  | 'ev-chargers';

export type EquipmentType =
  | 'Solar Panel'
  | 'Inverter'
  | 'Microinverter'
  | 'Battery'
  | 'Storage Management System'
  | 'AC Disconnect'
  | 'PV Meter'
  | 'Load Center'
  | 'Rail'
  | 'Attachment'
  | 'EV Charger';

export interface EquipmentCategory {
  id: EquipmentCategoryId;
  label: string;
  disabled?: boolean;
  comingSoon?: boolean;
}

// ============================================================================
// PREFERRED EQUIPMENT TYPES
// ============================================================================

export interface PreferredEquipment {
  uuid: string;
  equipment_type: EquipmentCategoryId;
  make: string;
  model: string;
  company_id: string;
  created_by: string;
  is_default: boolean;
  created_at: string;
  updated_at?: string;
  // Optional metadata
  wattage?: number;
  specs?: EquipmentSpecs;
}

export interface EquipmentSpecs {
  manufacturer?: string;
  modelNumber?: string;
  description?: string;
  dataSheetUrl?: string;
  [key: string]: unknown;
}

export interface CreatePreferredEquipmentData {
  equipmentType: EquipmentCategoryId;
  make: string;
  model: string;
  companyId: string;
  createdBy: string;
  isDefault?: boolean;
  wattage?: number;
  specs?: EquipmentSpecs;
}

export interface UpdatePreferredEquipmentData {
  is_default?: boolean;
  model?: string;
  specs?: EquipmentSpecs;
}

// ============================================================================
// MANUFACTURER & MODEL TYPES
// ============================================================================

export interface Manufacturer {
  manufacturer?: string;
  manufacturerName?: string;
  name?: string;
  label?: string;
  value?: string;
}

export interface ManufacturerOption {
  label: string;
  value: string;
}

export interface EquipmentModel {
  model?: string;
  modelNumber?: string;
  name?: string;
  label?: string;
  value?: string;
  // Solar panel specific
  pmax?: number;
  wattage?: number;
  voltage?: number;
  current?: number;
}

export interface ModelOption {
  label: string;
  value: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface GetPreferredEquipmentResponse {
  status: 'SUCCESS' | 'ERROR';
  message?: string;
  data?: PreferredEquipment[];
}

export interface CreatePreferredEquipmentResponse {
  status: 'SUCCESS' | 'ERROR';
  message: string;
  data?: PreferredEquipment;
}

export interface UpdatePreferredEquipmentResponse {
  status: 'SUCCESS' | 'ERROR';
  message: string;
  data?: PreferredEquipment;
}

export interface DeletePreferredEquipmentResponse {
  status: 'SUCCESS' | 'ERROR';
  message: string;
}

export interface GetManufacturersResponse {
  status?: 'SUCCESS' | 'ERROR';
  message?: string;
  data?: (Manufacturer | string)[];
}

export interface GetModelsResponse {
  status?: 'SUCCESS' | 'ERROR';
  message?: string;
  data?: (EquipmentModel | string)[];
}

export interface GetAllCompaniesResponse {
  status?: 'SUCCESS' | 'ERROR';
  message?: string;
  data?: CompanyListItem[];
}

export interface CompanyListItem {
  uuid: string;
  name: string;
  email?: string;
  approved?: boolean | number;
  user?: {
    email?: string;
    approved?: boolean | number;
  };
  company?: {
    uuid: string;
    name: string;
    approved?: boolean | number;
  };
}

// ============================================================================
// INVENTORY STATE TYPES
// ============================================================================

export interface InventoryState {
  categoriesWithEquipment: Set<EquipmentCategoryId>;
  loading: boolean;
  error: string | null;
  // Super user state
  companies: CompanyOption[];
  selectedCompanyId: string | null;
  selectedCompanyName: string | null;
  loadingCompanies: boolean;
}

export interface CompanyOption {
  uuid: string;
  name: string;
  email?: string;
}

export interface EquipmentCategoryState {
  // Dropdowns
  makes: ManufacturerOption[];
  models: ModelOption[];
  selectedMake: string;
  selectedModel: string;
  loadingMakes: boolean;
  loadingModels: boolean;
  // Saved equipment
  savedEquipment: PreferredEquipment[];
  loadingEquipment: boolean;
  savingEquipment: boolean;
  // Filters
  watts: string;
  // Modal state
  showDeleteConfirm: boolean;
  equipmentToDelete: PreferredEquipment | null;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type ModelOptionalCategory =
  | 'ac-disconnects'
  | 'pv-meters'
  | 'load-centers';

export interface EquipmentCategoryConfig {
  id: EquipmentCategoryId;
  equipmentType: EquipmentType;
  modelOptional: boolean;
  allowWattageFilter: boolean;
  requiredFields: Array<'make' | 'model' | 'wattage'>;
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface EquipmentValidationRules {
  make: {
    required: boolean;
    minLength?: number;
    maxLength?: number;
  };
  model: {
    required: boolean;
    minLength?: number;
    maxLength?: number;
  };
  wattage?: {
    required: boolean;
    min?: number;
    max?: number;
  };
}

export interface EquipmentFormErrors {
  make?: string;
  model?: string;
  wattage?: string;
  general?: string;
}
