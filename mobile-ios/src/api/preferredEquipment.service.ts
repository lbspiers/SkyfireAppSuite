// src/api/preferredEquipment.service.ts
// Preferred Equipment API service functions

import apiEndpoints from "../config/apiEndPoint";
import axiosInstance from "./axiosInstance";

export interface PreferredEquipment {
  id: number;
  uuid: string;
  equipment_type: string;
  make: string;
  model: string;
  is_default: boolean;
  company_id: number;
  created_at: string;
  created_by: number;
  deleted_at?: string | null;
  deleted_by?: number | null;
}

export interface PreferredEquipmentCreateRequest {
  equipment_type: string;
  make: string;
  model: string;
  company_id: string | number; // Support both UUID and numeric ID
  created_by: string | number; // Support both UUID and numeric ID
  is_default?: boolean;
}

export interface PreferredEquipmentUpdateRequest {
  is_default?: boolean;
}

// GET /api/preferred-equipment?company_id=X&equipment_type=Y
export const getPreferredEquipment = async (
  company_id: string | number,
  equipment_type: string
) => {
  try {
    const URL = `${apiEndpoints.BASE_URL}/api/preferred-equipment?company_id=${company_id}&equipment_type=${encodeURIComponent(equipment_type)}`;
    const response = await axiosInstance.get(URL);
    return response;
  } catch (error) {
    console.error(
      `[PreferredEquipment] Error fetching equipment for company ${company_id}, type ${equipment_type}:`,
      error
    );
    return error?.response || null;
  }
};

// POST /api/preferred-equipment
export const createPreferredEquipment = async (
  data: PreferredEquipmentCreateRequest
) => {
  try {
    const URL = `${apiEndpoints.BASE_URL}/api/preferred-equipment`;
    const response = await axiosInstance.post(URL, data);
    return response;
  } catch (error) {
    console.error("[PreferredEquipment] Error creating equipment:", error);
    return error?.response || null;
  }
};

// PATCH /api/preferred-equipment/:uuid
export const updatePreferredEquipment = async (
  uuid: string,
  data: PreferredEquipmentUpdateRequest
) => {
  try {
    const URL = `${apiEndpoints.BASE_URL}/api/preferred-equipment/${uuid}`;
    const response = await axiosInstance.patch(URL, data);
    return response;
  } catch (error) {
    console.error(
      `[PreferredEquipment] Error updating equipment ${uuid}:`,
      error
    );
    return error?.response || null;
  }
};

// DELETE /api/preferred-equipment/:uuid
export const deletePreferredEquipment = async (uuid: string) => {
  try {
    const URL = `${apiEndpoints.BASE_URL}/api/preferred-equipment/${uuid}`;
    const response = await axiosInstance.delete(URL);
    return response;
  } catch (error) {
    console.error(
      `[PreferredEquipment] Error deleting equipment ${uuid}:`,
      error
    );
    return error?.response || null;
  }
};

// Helper: Get numeric company ID from UUID
export const getCompanyIdFromUuid = async (companyUuid: string) => {
  try {
    const URL = `${apiEndpoints.BASE_URL}/api/companies/${companyUuid}`;
    const response = await axiosInstance.get(URL);
    return response?.data?.data?.id || null;
  } catch (error) {
    console.error(
      `[PreferredEquipment] Error fetching company ID for UUID ${companyUuid}:`,
      error
    );
    return null;
  }
};

// Helper: Get numeric user ID from UUID
export const getUserIdFromUuid = async (userUuid: string) => {
  try {
    const URL = `${apiEndpoints.BASE_URL}/api/users/${userUuid}`;
    const response = await axiosInstance.get(URL);
    return response?.data?.data?.id || null;
  } catch (error) {
    console.error(
      `[PreferredEquipment] Error fetching user ID for UUID ${userUuid}:`,
      error
    );
    return null;
  }
};
