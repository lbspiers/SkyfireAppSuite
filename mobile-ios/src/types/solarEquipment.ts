// src/types/solarEquipment.ts
// TypeScript interfaces for Solar Panel and Inverter equipment management

// Base equipment interface following existing patterns
export interface BaseEquipment {
  id: number;
  created_at?: string;
  updated_at?: string;
}

// Solar Panel interfaces based on database schema
// Using snake_case to match actual API response
export interface SolarPanel extends BaseEquipment {
  manufacturer_model: string;
  manufacturer: string;
  model_number: string;
  description?: string | null;
  nameplate_pmax: string;
  ptc?: string | null;
  nameplate_vpmax: string;
  nameplate_ipmax: string;
  nameplate_voc: string;
  nameplate_isc: string;
  average_noct?: string | null;
  n_s: number;
  short_ft: string;
  long_ft: string;
  weight_lbs: string;
  integrated_ac: boolean;
  integrated_micro_make?: string | null;
  integrated_micro_model?: string | null;
}

// Inverter interfaces based on database schema
export interface Inverter extends BaseEquipment {
  makeModel: string;
  manufacturerName?: string;
  modelNumber?: string;
  description?: string;
  maxContinuousOutputPowerKw?: number;
  nominalVoltageVac?: number;
  weightedEfficiencyPercent?: number;
  builtInMeter?: boolean;
  microinverter?: boolean;
  powerOptimizer?: boolean;
  nightTareLoss?: number;
  voltageMinimum?: number;
  voltageNominal?: number;
  voltageMaximum?: number;
  cecEfficiency?: number;
  maxContOutputAmps?: number;
  maxInputIsc1?: number;
  maxInputIsc2?: number;
  maxInputIsc3?: number;
  maxInputIsc4?: number;
  maxInputIsc5?: number;
  maxInputIsc6?: number;
  maxInputIsc7?: number;
  maxInputIsc8?: number;
  maxInputIsc9?: number;
  maxInputIsc10?: number;
  maxInputIsc11?: number;
  maxInputIsc12?: number;
  solaredgeSeries?: string;
  hybrid?: string;
  equipmentType?: string;
  maxStringsBranches?: number;
}

// API Request/Response interfaces following existing patterns
export interface SolarPanelCreateRequest {
  manufacturerModel: string;
  manufacturer?: string;
  modelNumber?: string;
  description?: string;
  nameplatePmax?: number;
  ptc?: number;
  nameplateVpmax?: number;
  nameplateIpmax?: number;
  nameplateVoc?: number;
  nameplateIsc?: number;
  averageNoct?: number;
  nS?: number;
  shortFt?: number;
  longFt?: number;
  weightLbs?: number;
}

export interface SolarPanelUpdateRequest extends Partial<SolarPanelCreateRequest> {
  id: number;
}

export interface InverterCreateRequest {
  makeModel: string;
  manufacturerName?: string;
  modelNumber?: string;
  description?: string;
  maxContinuousOutputPowerKw?: number;
  nominalVoltageVac?: number;
  weightedEfficiencyPercent?: number;
  builtInMeter?: boolean;
  microinverter?: boolean;
  powerOptimizer?: boolean;
  nightTareLoss?: number;
  voltageMinimum?: number;
  voltageNominal?: number;
  voltageMaximum?: number;
  cecEfficiency?: number;
  maxContOutputAmps?: number;
  maxInputIsc1?: number;
  maxInputIsc2?: number;
  maxInputIsc3?: number;
  maxInputIsc4?: number;
  maxInputIsc5?: number;
  maxInputIsc6?: number;
  maxInputIsc7?: number;
  maxInputIsc8?: number;
  maxInputIsc9?: number;
  maxInputIsc10?: number;
  maxInputIsc11?: number;
  maxInputIsc12?: number;
  solaredgeSeries?: string;
  hybrid?: string;
  equipmentType?: string;
  maxStringsBranches?: number;
}

export interface InverterUpdateRequest extends Partial<InverterCreateRequest> {
  id: number;
}

// API Response interfaces following existing patterns
export interface SolarPanelApiResponse {
  success: boolean;
  data?: SolarPanel;
  message?: string;
  error?: string;
}

export interface SolarPanelListApiResponse {
  success: boolean;
  data?: SolarPanel[];
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface InverterApiResponse {
  success: boolean;
  data?: Inverter;
  message?: string;
  error?: string;
}

export interface InverterListApiResponse {
  success: boolean;
  data?: Inverter[];
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Manufacturer and Model interfaces for dropdowns (following existing patterns)
export interface EquipmentManufacturer {
  label: string;
  value: string;
}

export interface EquipmentModel {
  label: string;
  value: string;
  manufacturer?: string;
}

// Query parameters for filtering and pagination
export interface SolarPanelQueryParams {
  page?: number;
  limit?: number;
  manufacturer?: string;
  modelNumber?: string;
  minWattage?: number;
  maxWattage?: number;
  search?: string;
  sortBy?: 'manufacturer' | 'modelNumber' | 'nameplatePmax' | 'createdAt';
  sortOrder?: 'ASC' | 'DESC';
}

export interface InverterQueryParams {
  page?: number;
  limit?: number;
  manufacturer?: string;
  modelNumber?: string;
  minPower?: number;
  maxPower?: number;
  microinverter?: boolean;
  powerOptimizer?: boolean;
  search?: string;
  sortBy?: 'manufacturerName' | 'modelNumber' | 'maxContinuousOutputPowerKw' | 'createdAt';
  sortOrder?: 'ASC' | 'DESC';
}

// API Error interface following existing patterns
export interface SolarEquipmentApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
  requestId?: string;
}

// Result interface for hooks and services
export interface SolarEquipmentApiResult<T> {
  success: boolean;
  data?: T;
  error?: SolarEquipmentApiError;
  loading?: boolean;
}

// Combined equipment types for unified handling
export type SolarEquipment = SolarPanel | Inverter;

export interface SolarEquipmentStats {
  totalSolarPanels: number;
  totalInverters: number;
  uniqueManufacturers: number;
  totalWattage: number;
  averageEfficiency: number;
  lastUpdated: string;
}

// Equipment type constants following existing patterns
export const SOLAR_EQUIPMENT_TYPES = {
  SOLAR_PANEL: 'Solar Panel',
  INVERTER: 'Inverter',
  MICROINVERTER: 'MicroInverter',
  POWER_OPTIMIZER: 'Power Optimizer',
} as const;

export type SolarEquipmentType = typeof SOLAR_EQUIPMENT_TYPES[keyof typeof SOLAR_EQUIPMENT_TYPES];

// Validation schemas for form handling (compatible with existing form patterns)
export interface SolarPanelFormData {
  manufacturerModel: string;
  manufacturer: string;
  modelNumber: string;
  description: string;
  nameplatePmax: string; // Forms use strings, convert to number in service
  ptc: string;
  nameplateVpmax: string;
  nameplateIpmax: string;
  nameplateVoc: string;
  nameplateIsc: string;
  averageNoct: string;
  nS: string;
  shortFt: string;
  longFt: string;
  weightLbs: string;
}

export interface InverterFormData {
  makeModel: string;
  manufacturerName: string;
  modelNumber: string;
  description: string;
  maxContinuousOutputPowerKw: string;
  nominalVoltageVac: string;
  weightedEfficiencyPercent: string;
  builtInMeter: boolean;
  microinverter: boolean;
  powerOptimizer: boolean;
  nightTareLoss: string;
  voltageMinimum: string;
  voltageNominal: string;
  voltageMaximum: string;
  cecEfficiency: string;
  maxContOutputAmps: string;
  maxInputIsc1: string;
  maxInputIsc2: string;
  maxInputIsc3: string;
  maxInputIsc4: string;
  maxInputIsc5: string;
  maxInputIsc6: string;
  maxInputIsc7: string;
  maxInputIsc8: string;
  maxInputIsc9: string;
  maxInputIsc10: string;
  maxInputIsc11: string;
  maxInputIsc12: string;
  solaredgeSeries: string;
  hybrid: string;
  equipmentType: string;
  maxStringsBranches: string;
}

// Form validation errors interface
export interface SolarEquipmentFormErrors {
  [key: string]: string | undefined;
}