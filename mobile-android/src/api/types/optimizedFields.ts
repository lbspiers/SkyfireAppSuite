/**
 * Type definitions for optimized field-specific API responses
 * Based on the field usage audit to ensure type safety
 */

// Project Info Fields
export interface ProjectInfoFields {
  companyName: string;
  installerProjectId: string;
  customerFirstName: string;
  customerLastName: string;
  projectNotes?: string;
  siteSurveyDate?: string;
}

// Site Info Fields
export interface SiteInfoFields {
  address: string;
  city: string;
  state: string;
  zip: string;
  apn?: string;
  jurisdiction?: string;
  utility?: string;
}

// System Equipment Fields
export interface SystemEquipmentFields {
  // Solar Panel
  solar_panel_quantity?: number;
  solar_panel_manufacturer?: string;
  solar_panel_model?: string;
  solar_panel_is_new?: boolean;
  
  // Inverter
  inverter_manufacturer?: string;
  inverter_model?: string;
  inverter_quantity?: number;
  inverter_is_new?: boolean;
  
  // Microinverter
  microinverter_manufacturer?: string;
  microinverter_model?: string;
  microinverter_quantity?: number;
  microinverter_is_new?: boolean;
  
  // Optimizer
  optimizer_manufacturer?: string;
  optimizer_model?: string;
  optimizer_quantity?: number;
  
  // String Combiner Panel
  string_combiner_panel_manufacturer?: string;
  string_combiner_panel_model?: string;
  string_combiner_panel_quantity?: number;
  
  // Energy Storage
  energy_storage_manufacturer?: string;
  energy_storage_model?: string;
  energy_storage_quantity?: number;
  energy_storage_is_new?: boolean;
  
  // System Metadata
  system_type?: 'microinverter' | 'inverter' | 'hybrid';
  system_active?: boolean;
}

// Electrical Configuration Fields
export interface ElectricalFields {
  // Service Entrance
  service_entrance_type?: 'overhead' | 'underground';
  mcb_count?: number;
  
  // Main Panel A
  mpa_type?: 'new' | 'existing';
  mpa_bus?: number;
  mpa_main?: number;
  mpa_feeder?: string;
  mpa_location?: string;
  mpu_selection?: 'Yes' | 'No' | 'Help Me Decide';
  
  // Sub Panel B (conditional)
  show_sub_panel_b?: boolean;
  spb_type?: 'new' | 'existing';
  spb_bus?: number;
  spb_main?: number;
  spb_feeder?: string;
  spb_location?: string;
  
  // Point of Interconnection
  poi_type?: 'main_panel' | 'sub_panel' | 'meter';
  poi_breaker?: number;
  poi_disconnect?: number;
  poi_location?: string;
  
  // Additional
  electrical_notes?: string;
  meter_type?: string;
  meter_location?: string;
}

// Balance of System Fields
export interface BOSTypeFields {
  equipment_type?: string;
  make?: string;
  model?: string;
  amp_rating?: number;
  is_new?: boolean;
  panel_note?: string;
  photo_count?: number;
  active?: boolean;
}

export interface BOSFields {
  bos_type_1?: BOSTypeFields;
  bos_type_2?: BOSTypeFields;
  bos_type_3?: BOSTypeFields;
  bos_type_4?: BOSTypeFields;
  bos_type_5?: BOSTypeFields;
  bos_type_6?: BOSTypeFields;
  bos_type_7?: BOSTypeFields;
  bos_type_8?: BOSTypeFields;
  bos_type_9?: BOSTypeFields;
  bos_type_10?: BOSTypeFields;
  bos_total_types?: number;
  bos_completed_types?: number;
  bos_notes?: string;
  _computed_active_bos_types?: number; // Added by our API function
}

// Project Summary Fields (for Dashboard)
export interface ProjectSummaryFields {
  uuid: string;
  installer_project_id: string;
  customer_first_name: string;
  customer_last_name: string;
  address?: string;
  city?: string;
  state?: string;
  created_at: string;
  updated_at: string;
  completed_step: number;
  project_status: 'draft' | 'in_progress' | 'completed' | 'cancelled';
}

// API Response Wrappers
export interface OptimizedAPIResponse<T> {
  status: number;
  data: {
    success: boolean;
    data: T;
    message?: string;
  };
}

// System-specific type with prefix
export type SystemSpecificFields = {
  [key: `sys${1 | 2 | 3 | 4}_${string}`]: any;
};

// Helper type for extracting fields with a specific prefix
export type ExtractSystemFields<N extends 1 | 2 | 3 | 4> = {
  [K in keyof SystemEquipmentFields as `sys${N}_${K}`]: SystemEquipmentFields[K];
};

// Usage examples for typed API functions
export type GetProjectInfoFieldsResponse = OptimizedAPIResponse<ProjectInfoFields>;
export type GetSiteInfoFieldsResponse = OptimizedAPIResponse<SiteInfoFields>;
export type GetSystemEquipmentFieldsResponse = OptimizedAPIResponse<SystemSpecificFields>;
export type GetElectricalFieldsResponse = OptimizedAPIResponse<ElectricalFields>;
export type GetBOSFieldsResponse = OptimizedAPIResponse<BOSFields>;
export type GetProjectSummaryFieldsResponse = OptimizedAPIResponse<ProjectSummaryFields>;