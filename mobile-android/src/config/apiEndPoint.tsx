// src/config/apiEndPoint.ts

import { API_BASE_URL, GOOGLE_MAPS_API_KEY } from "@env";

const apiEndpoints = {
  // Fallback to production URL if env var is undefined (happens in production builds)
  BASE_URL: API_BASE_URL || "https://api.skyfireapp.io",

  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/sign-up",
    RESET_PASSWORD_GET_OTP: "/auth/request-reset-password",
    RESET_PASSWORD: "/auth/reset-password",
    VERIFY_OTP: "/auth/verify-otp",
    HANDLE_LOGIN_PROFILE: "/auth/handle-login",
    // 3-Step Registration Endpoints
    VALIDATE_EMAIL: "/auth/validate-email",
    REGISTER_COMPLETE: "/auth/register-complete",
  },

  // Legacy placeholder (kept for compatibility). Prefer COMPANY.FILE_UPLOAD_URL below.
  UPLOAD_FILES: {
    UPLOAD_FILES: "/company/",
  },

  INTRO_MODULE: {
    UPDATE_ADDRESS: "/company/",
    ADD_TERRITORY: (companyId: string) =>
      `/company/${companyId}/service-territory`,
    DELETE_TERRITORY: (companyId: string, uuid: string) =>
      `/company/${companyId}/service-territory/${uuid}`,
  },

  INVENTORY_MODULE: {
    LIST_ALL_EQUIPMENT: "/equipment/types",
    List_Manufacturer_by_Type: (type: string) =>
      `/equipment/manufacturers?type=${type}`,
    GET_MODEL_NUMBER: (type: string, manufacturer: string) =>
      `/equipment/models?type=${type}&manufacturer=${manufacturer}`,
    GET_BATTERY_MODELS: (manufacturer: string) =>
      `/api/batteries/models?manufacturer=${manufacturer}`,
    ADD_INVENTORY: (companyId: string) => `/company/${companyId}/inventory`,
    UNLIST_ADD_INVENTORY: (companyId: string) =>
      `/company/${companyId}/inventory/unlisted`,
    LIST_INVENTORY_EQUIPMENT: (companyId: string, equipmentType: string) =>
      `/company/${companyId}/inventory?equipmentType=${equipmentType}`,
    DELETE_INVENTORY_EQUIPMENT: (companyId: string, equipmentUuid: string) =>
      `/company/${companyId}/inventory/${equipmentUuid}`,
  },

  // Solar Equipment Module - New endpoints for solar panels and inverters
  SOLAR_EQUIPMENT: {
    // Solar Panel endpoints
    SOLAR_PANELS: "/solar-panels",
    SOLAR_PANEL_BY_ID: (id: number) => `/solar-panels/${id}`,
    SOLAR_PANELS_SEARCH: "/solar-panels/search",
    SOLAR_PANELS_STATS: "/solar-panels/stats",
    SOLAR_PANELS_BULK: "/solar-panels/bulk",
    SOLAR_PANELS_IMPORT: "/solar-panels/import",
    SOLAR_PANELS_EXPORT: "/solar-panels/export",
    SOLAR_PANELS_VALIDATE: "/solar-panels/validate",
    SOLAR_PANELS_EXISTS: "/solar-panels/exists",
    SOLAR_PANELS_POPULAR: "/solar-panels/popular",
    SOLAR_PANELS_COMPATIBLE: (inverterId: number) => `/solar-panels/compatible/${inverterId}`,
    SOLAR_PANELS_SPECIFICATIONS: "/solar-panels/specifications",

    // Inverter endpoints
    INVERTERS: "/inverters",
    INVERTER_BY_ID: (id: number) => `/inverters/${id}`,
    INVERTERS_SEARCH: "/inverters/search",
    INVERTERS_STATS: "/inverters/stats",
    INVERTERS_BULK: "/inverters/bulk",
    INVERTERS_IMPORT: "/inverters/import",
    INVERTERS_EXPORT: "/inverters/export",
    INVERTERS_VALIDATE: "/inverters/validate",
    INVERTERS_EXISTS: "/inverters/exists",
    INVERTERS_POPULAR: "/inverters/popular",
    INVERTERS_COMPATIBLE: (solarPanelId: number) => `/inverters/compatible/${solarPanelId}`,
    INVERTERS_SPECIFICATIONS: "/inverters/specifications",
    INVERTERS_CALCULATE_OPTIMAL_SIZE: "/inverters/calculate-optimal-size",
    INVERTERS_EFFICIENCY_CURVE: (id: number) => `/inverters/${id}/efficiency-curve`,
    INVERTERS_STRING_RECOMMENDATIONS: (id: number) => `/inverters/${id}/string-recommendations`,
  },

  PROJECT: {
    ADD_NEW_PROJECT: "/project",
    LIST_PROJECT: (companyId: string) => `/project?companyId=${companyId}`,
    SAVE_SITE_INFO: (projectId: string) => `/project/${projectId}/site-info`,
    MANUFACTURER: (type: string) => `/equipment/manufacturers?type=${type}`,
    Equipment: (projectId: string, companyId: string) =>
      `/project/${projectId}/equipment?companyId=${companyId}`,
    GET_PROJECT_INFO: (projectId: string, companyId: string) =>
      `/project/${projectId}?companyId=${companyId}`,
    // Deprecated: Use SYSTEM_DETAILS.GET instead
    // GET_ELECTRICAL_INFO: (projectId: string, companyId: string) =>
    //   `/project/${projectId}/electrical?companyId=${companyId}`,
    GET_EQUIPMENT_INFO: (
      projectId: string,
      companyId: string,
      equipmentSetUuid: string
    ) =>
      `/project/${projectId}/equipment-storage?companyId=${companyId}&equipmentSetUuid=${equipmentSetUuid}`,
    SAVE_EQUIPMENT_INFO: (projectId: string, companyId: string) =>
      `/project/${projectId}/equipment?companyId=${companyId}`,
    SAVE_EQUIPMENT_STORAGE_INFO: (projectId: string, companyId: string) =>
      `/project/${projectId}/equipment-storage?companyId=${companyId}`,
    // Deprecated: Use SYSTEM_DETAILS.UPSERT instead
    // SAVE_ELECTRICAL_INFO: (projectId: string, companyId: string) =>
    //   `/project/${projectId}/electrical?companyId=${companyId}`,
    
    // Additional Services endpoints
    GET_ADDITIONAL_SERVICES: (projectId: string, companyId: string) =>
      `/project/${projectId}/additional-services?companyId=${companyId}`,
    SAVE_ADDITIONAL_SERVICES: (projectId: string, companyId: string) =>
      `/project/${projectId}/additional-services?companyId=${companyId}`,

    // new system details endpoints
    SYSTEM_DETAILS: {
      GET: (projectId: string) => `/project/${projectId}/system-details`,
      UPSERT: (projectId: string) => `/project/${projectId}/system-details`,
    },

    // <— updated to singular “project” here:
    UPDATE_STATUS: (projectId: string, companyId: string) =>
      `/project/${projectId}/status?companyId=${companyId}`,

    // Photos / Videos / Notes
    PHOTOS: {
      LIST: (projectId: string) => `/project/${projectId}/photos`,
      CREATE: (projectId: string) => `/project/${projectId}/photos`,
      BULK_DELETE: (projectId: string) =>
        `/project/${projectId}/photos/bulk-delete`,
      DELETE_ONE: (projectId: string, photoId: string) =>
        `/project/${projectId}/photos/${photoId}`,
      // Section notes (used by PhotoNotesModal)
      SECTION_NOTES_UPSERT: (projectId: string) =>
        `/project/${projectId}/section-notes`,
      SECTION_NOTES_CLEAR: (projectId: string) =>
        `/project/${projectId}/section-notes`, // DELETE with body
    },
  },

  // Company-scoped utilities
  COMPANY: {
    // S3 presigned PUT URL for direct uploads from device
    FILE_UPLOAD_URL: (companyId: string) =>
      `/company/${companyId}/file-upload-url`,
  },

  LOCATION: {
    GET_STATES: "/utility-zipcodes/states",
    GET_ZIPCODES: (stateCode: string) =>
      `/utility-zipcodes/states/${stateCode}/zips`,
    GET_UTILITIES: (zipCode: string) =>
      `/utility-zipcodes/zips/${zipCode}/utilities`,
  },

  // Demo Booking Endpoints
  DEMO: {
    AVAILABLE_SLOTS: "/demo/available-slots",
    CHECK_AVAILABILITY: "/demo/check-availability",
    GET_BOOKING: (userId: string) => `/demo/booking/${userId}`,
    UPCOMING_BOOKINGS: "/demo/upcoming-bookings",
    RESCHEDULE: "/demo/reschedule",
  },

  // Account Management Endpoints
  ACCOUNT: {
    GET_PROFILE: "/user/profile",
    UPDATE_PROFILE: "/user/profile",
    UPDATE_EMAIL: "/user/email",
    UPDATE_PHONE: "/user/phone",
    CHANGE_PASSWORD: "/user/password",
    UPLOAD_COMPANY_LOGO: "/user/company-logo",
    REMOVE_COMPANY_LOGO: "/user/company-logo",
    DELETE_ACCOUNT: "/auth/account",
  },

  // Team Management Endpoints
  TEAM: {
    GET_USERS: "/company/users",
    ADD_USER: "/company/users",
    DELETE_USER: (userUuid: string) => `/company/users/${userUuid}`,
    RESEND_INVITE: "/company/users/resend-invite",
  },
};

export default apiEndpoints;
