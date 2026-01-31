// Get base URL from environment
const getBaseURL = () => {
  // Use CRA env variable
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  // Default
  return 'https://api.skyfireapp.io';
};

const apiEndpoints = {
  BASE_URL: getBaseURL(),

  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/sign-up",
    RESET_PASSWORD_GET_OTP: "/auth/request-reset-password",
    RESET_PASSWORD: "/auth/reset-password",
    VERIFY_OTP: "/auth/verify-otp",
    HANDLE_LOGIN_PROFILE: "/auth/handle-login",
    VALIDATE_EMAIL: "/auth/validate-email",
    REGISTER_COMPLETE: "/auth/register-complete",
    RESEND_VERIFICATION: "/auth/resend-verification",
    VALIDATE_INVITE_CODE: "/auth/validate-invite-code",
    REDEEM_INVITE_CODE: "/auth/redeem-invite-code",
  },

  INVENTORY_MODULE: {
    LIST_ALL_EQUIPMENT: "/equipment/types",
    List_Manufacturer_by_Type: (type: string) => `/equipment/manufacturers?type=${type}`,
    GET_MODEL_NUMBER: (type: string, manufacturer: string) => `/equipment/models?type=${type}&manufacturer=${manufacturer}`,
    GET_BATTERY_MODELS: (manufacturer: string) => `/api/batteries/models?manufacturer=${manufacturer}`,
    ADD_INVENTORY: (companyId: string) => `/company/${companyId}/inventory`,
    UNLIST_ADD_INVENTORY: (companyId: string) => `/company/${companyId}/inventory/unlisted`,
    LIST_INVENTORY_EQUIPMENT: (companyId: string, equipmentType: string) => `/company/${companyId}/inventory?equipmentType=${equipmentType}`,
    DELETE_INVENTORY_EQUIPMENT: (companyId: string, equipmentUuid: string) => `/company/${companyId}/inventory/${equipmentUuid}`,
    UTILITY_REQUIREMENTS: {
      BY_ABBREV: (abbrev: string) => `/equipment/utility-requirements?abbrev=${encodeURIComponent(abbrev)}`,
      BY_STATE: (state: string) => `/equipment/utility-requirements?state=${encodeURIComponent(state)}`,
    },
  },

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
    Equipment: (projectId: string, companyId: string) => `/project/${projectId}/equipment?companyId=${companyId}`,
    GET_PROJECT_INFO: (projectId: string, companyId: string) => `/project/${projectId}?companyId=${companyId}`,
    GET_EQUIPMENT_INFO: (projectId: string, companyId: string, equipmentSetUuid: string) => `/project/${projectId}/equipment-storage?companyId=${companyId}&equipmentSetUuid=${equipmentSetUuid}`,
    SAVE_EQUIPMENT_INFO: (projectId: string, companyId: string) => `/project/${projectId}/equipment?companyId=${companyId}`,
    SAVE_EQUIPMENT_STORAGE_INFO: (projectId: string, companyId: string) => `/project/${projectId}/equipment-storage?companyId=${companyId}`,
    GET_ADDITIONAL_SERVICES: (projectId: string, companyId: string) => `/project/${projectId}/additional-services?companyId=${companyId}`,
    SAVE_ADDITIONAL_SERVICES: (projectId: string, companyId: string) => `/project/${projectId}/additional-services?companyId=${companyId}`,
    SYSTEM_DETAILS: {
      GET: (projectId: string) => `/project/${projectId}/system-details`,
      UPSERT: (projectId: string) => `/project/${projectId}/system-details`,
    },
    UPDATE_STATUS: (projectId: string, companyId: string) => `/project/${projectId}/status?companyId=${companyId}`,
    PHOTOS: {
      LIST: (projectId: string) => `/project/${projectId}/photos`,
      CREATE: (projectId: string) => `/project/${projectId}/photos`,
      BULK_DELETE: (projectId: string) => `/project/${projectId}/photos/bulk-delete`,
      DELETE_ONE: (projectId: string, photoId: string) => `/project/${projectId}/photos/${photoId}`,
      SECTION_NOTES_UPSERT: (projectId: string) => `/project/${projectId}/section-notes`,
      SECTION_NOTES_CLEAR: (projectId: string) => `/project/${projectId}/section-notes`,
    },
  },

  COMPANY: {
    FILE_UPLOAD_URL: (companyId: string) => `/company/${companyId}/file-upload-url`,
  },

  INTRO_MODULE: {
    UPDATE_ADDRESS: "/company/",
    ADD_TERRITORY: (companyId: string) => `/company/${companyId}/service-territory`,
    DELETE_TERRITORY: (companyId: string, uuid: string) => `/company/${companyId}/service-territory/${uuid}`,
  },

  LOCATION: {
    GET_STATES: "/utility-zipcodes/states",
    GET_ZIPCODES: (stateCode: string) => `/utility-zipcodes/states/${stateCode}/zips`,
    GET_UTILITIES: (zipCode: string) => `/utility-zipcodes/zips/${zipCode}/utilities`,
  },

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

  TEAM: {
    GET_USERS: "/company/users",
    ADD_USER: "/company/users",
    DELETE_USER: (userUuid: string) => `/company/users/${userUuid}`,
    RESEND_INVITE: "/company/users/resend-invite",
  },

  DEMO: {
    AVAILABLE_SLOTS: "/demo/available-slots",
    CHECK_AVAILABILITY: "/demo/check-availability",
    GET_BOOKING: (userId: string) => `/demo/booking/${userId}`,
    UPCOMING_BOOKINGS: "/demo/upcoming-bookings",
    RESCHEDULE: "/demo/reschedule",
  },

  ADMIN: {
    PENDING_REGISTRATIONS: "/api/admin/pending-users",
    APPROVE_REGISTRATION: (userId: string | number) => `/api/admin/approve-user/${userId}`,
    REJECT_REGISTRATION: (userId: string | number) => `/api/admin/reject-user/${userId}`,
    VERIFY_ACCESS: "/api/admin/verify-access",
    NOTIFICATIONS: "/notify/notifications",
    MARK_NOTIFICATION_READ: (notificationId: string) => `/notify/notifications/${notificationId}/read`,
  },

  ANALYTICS: {
    // Session management
    SESSION_START: "/analytics/session/start",
    SESSION_HEARTBEAT: "/analytics/session/heartbeat",
    SESSION_END: "/analytics/session/end",

    // Event tracking
    EVENTS_BATCH: "/analytics/events/batch",

    // Page view tracking
    PAGEVIEW: "/analytics/pageview",
    PAGEVIEW_EXIT: "/analytics/pageview/exit",

    // Performance tracking
    PERFORMANCE: "/analytics/performance",

    // Error tracking
    ERROR: "/analytics/error",

    // Feature usage
    FEATURE: "/analytics/feature",

    // Real-time dashboard (Socket.io namespace)
    SOCKET_NAMESPACE: "/analytics",
  },

  SCHEDULE: {
    EVENTS: '/schedule/events',
    EVENT: (uuid: string) => `/schedule/events/${uuid}`,
    UPCOMING: '/schedule/events/upcoming',
    SEARCH: '/schedule/events/search',
    STATS: '/schedule/events/stats',
    PROJECT_EVENTS: (projectUuid: string) => `/schedule/events/project/${projectUuid}`,
    ATTENDEES: (eventUuid: string) => `/schedule/events/${eventUuid}/attendees`,
    REMOVE_ATTENDEE: (eventUuid: string, userId: number) => `/schedule/events/${eventUuid}/attendees/${userId}`,
  },

  SPEC_SHEETS: {
    SEARCH: '/api/spec-sheets/search',
    GET_BY_ID: (uuid: string) => `/api/spec-sheets/${uuid}`,
    STATS: '/api/spec-sheets/stats',
    PROJECT_ATTACHMENTS: (projectUuid: string) => `/api/spec-sheets/project/${projectUuid}/attachments`,
    ATTACH_TO_PROJECT: (projectUuid: string) => `/api/spec-sheets/project/${projectUuid}/attach`,
    AUTO_MATCH: (projectUuid: string) => `/api/spec-sheets/project/${projectUuid}/auto-match`,
    REMOVE_ATTACHMENT: (projectUuid: string, attachmentUuid: string) => `/api/spec-sheets/project/${projectUuid}/attachments/${attachmentUuid}`,
  },
};

export default apiEndpoints;
