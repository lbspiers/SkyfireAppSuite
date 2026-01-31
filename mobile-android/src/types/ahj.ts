// src/types/ahj.ts

export interface AHJ {
  id: number;
  uuid: string;
  ahj_name: string;
  ahj_level_code?: string;
  building_code?: string;
  city?: string;
  county?: string;
  state?: string;
  country?: string;
  electric_code?: string;
  fire_code?: string;
  residential_code?: string;
  wind_code?: string;
  latitude?: number;
  longitude?: number;
  zip_code?: number;
  created_at: string;
  updated_at?: string;
}

export interface AHJDropdownOption {
  label: string;
  value: string;
  city?: string;
  state?: string;
  zip_code?: number;
}

export interface AHJLookupResponse {
  success: boolean;
  data?: AHJ[];
  message?: string;
}