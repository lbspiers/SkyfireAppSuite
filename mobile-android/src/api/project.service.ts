import apiEndpoints from "../config/apiEndPoint";
import axiosInstance from "./axiosInstance";

/** url-encode helper for query/path fragments */
const enc = encodeURIComponent;

/** POST /project — create a new project */
export const CreateNewProject = async (data: any) => {
  try {
    const URL = `${apiEndpoints.BASE_URL}${apiEndpoints.PROJECT.ADD_NEW_PROJECT}`;
    return await axiosInstance.post(URL, data);
  } catch (error: any) {
    return error?.response;
  }
};

/** PUT /project/:id/site — save site info */
export const SaveProjectSiteInfo = async (projectId: string, data: any) => {
  try {
    const URL = `${apiEndpoints.BASE_URL}${apiEndpoints.PROJECT.SAVE_SITE_INFO(
      projectId
    )}`;
    return await axiosInstance.put(URL, data);
  } catch (error: any) {
    return error?.response;
  }
};

/** PUT /project/:id — save/update project information */
export const SaveProjectInfo = async (projectId: string, companyId: string, data: any) => {
  try {
    // Using the general project endpoint with PUT to update project details
    const URL = `${apiEndpoints.BASE_URL}/project/${projectId}?companyId=${companyId}`;
    return await axiosInstance.put(URL, data);
  } catch (error: any) {
    return error?.response;
  }
};

/**
 * GET /project?companyId=... — list projects
 * If companyId is null/undefined, fetches ALL projects (superuser mode)
 */
export const ListProjects = async (companyId: any) => {
  try {
    // For superusers: Fetch all projects across all companies
    // For regular users: Fetch only their company's projects
    const URL = companyId
      ? `${apiEndpoints.BASE_URL}${apiEndpoints.PROJECT.LIST_PROJECT(companyId)}`
      : `${apiEndpoints.BASE_URL}/project`; // No companyId = all projects

    console.debug('[project.service] ListProjects URL:', URL);
    return await axiosInstance.get(URL);
  } catch (error: any) {
    return error?.response;
  }
};

/**
 * GET /equipment/manufacturers?type=...
 * Manufacturers by equipment type.
 * NOTE: encode `type` so values like "Solar Panel" & "String Combiner Panel" work.
 */
export const equipmentManufacturers = async (type: string) => {
  try {
    const URL = `${apiEndpoints.BASE_URL}${apiEndpoints.PROJECT.MANUFACTURER(
      enc(type)
    )}`;
    return await axiosInstance.get(URL);
  } catch (error: any) {
    return error?.response;
  }
};

/** GET /project/:id/equipment?companyId=... — equipment set list for a project */
export const EquipmentLists = async (projectId: any, companyId: any) => {
  try {
    const URL = `${apiEndpoints.BASE_URL}${apiEndpoints.PROJECT.Equipment(
      projectId,
      companyId
    )}`;
    return await axiosInstance.get(URL);
  } catch (error: any) {
    return error?.response;
  }
};

/** GET /project/:id?companyId=... — core project details */
export const GetProjectDetails = async (projectId: any, companyId: any) => {
  try {
    const URL = `${
      apiEndpoints.BASE_URL
    }${apiEndpoints.PROJECT.GET_PROJECT_INFO(projectId, companyId)}`;
    return await axiosInstance.get(URL);
  } catch (error: any) {
    return error?.response;
  }
};

/** GET /project/:id/equipment/:equipmentSetUuid — stored equipment blob for a set */
export const GetProjectEquipmentStorageData = async (
  projectId: any,
  companyId: string,
  equipmentSetUuid: string
) => {
  try {
    const URL = `${
      apiEndpoints.BASE_URL
    }${apiEndpoints.PROJECT.GET_EQUIPMENT_INFO(
      projectId,
      companyId,
      equipmentSetUuid
    )}`;
    return await axiosInstance.get(URL);
  } catch (error: any) {
    return error?.response;
  }
};

/** PATCH /project/:id/equipment — save equipment set(s) */
export const saveEquipmentDetails = async (
  projectId: any,
  companyId: any,
  data: any
) => {
  try {
    const URL = `${
      apiEndpoints.BASE_URL
    }${apiEndpoints.PROJECT.SAVE_EQUIPMENT_INFO(projectId, companyId)}`;
    return await axiosInstance.patch(URL, data);
  } catch (error: any) {
    return error?.response;
  }
};

/** PATCH /project/:id/equipment/storage — save energy system details */
export const saveEnergySystemDetails = async (
  projectId: any,
  companyId: any,
  data: any
) => {
  try {
    const URL = `${
      apiEndpoints.BASE_URL
    }${apiEndpoints.PROJECT.SAVE_EQUIPMENT_STORAGE_INFO(projectId, companyId)}`;
    return await axiosInstance.patch(URL, data);
  } catch (error: any) {
    return error?.response;
  }
};

/**
 * NEW: GET /project/:projectUuid/system-details
 * Returns the giant flat `system_details` object (≈804 keys).
 * Note: This endpoint (per your logs) does NOT require companyId.
 */
export const getSystemDetails = async (projectUuid: string) => {
  const URL = `${apiEndpoints.BASE_URL}/project/${projectUuid}/system-details`;
  try {
    // Keep a tiny breadcrumb for debugging
    console.debug("[project.service] GET", URL);
    const resp = await axiosInstance.get(URL);
    // Example success log (status + #keys if object)
    const k =
      resp?.data?.data && typeof resp.data.data === "object"
        ? Object.keys(resp.data.data).length
        : undefined;
    if (k != null) {
      console.debug(
        "[project.service] getSystemDetails →",
        resp.status,
        `keys:${k}`
      );
    } else {
      console.debug("[project.service] getSystemDetails →", resp.status);
    }
    return resp;
  } catch (error: any) {
    console.warn(
      "[project.service] getSystemDetails error:",
      error?.response?.status,
      error?.response?.data
    );
    return error?.response;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Location helpers
// ─────────────────────────────────────────────────────────────────────────────

export const getStates = async () => {
  try {
    const URL = `${apiEndpoints.BASE_URL}${apiEndpoints.LOCATION.GET_STATES}`;
    return await axiosInstance.get<string[]>(URL);
  } catch (error: any) {
    return error?.response;
  }
};

export const getZipCodes = async (stateCode: string) => {
  try {
    const URL = `${apiEndpoints.BASE_URL}${apiEndpoints.LOCATION.GET_ZIPCODES(
      stateCode
    )}`;
    return await axiosInstance.get<string[]>(URL);
  } catch (error: any) {
    return error?.response;
  }
};

export const getUtilities = async (zipCode: string) => {
  try {
    const URL = `${apiEndpoints.BASE_URL}${apiEndpoints.LOCATION.GET_UTILITIES(
      zipCode
    )}`;
    return await axiosInstance.get<string[]>(URL);
  } catch (error: any) {
    return error?.response;
  }
};

/**
 * PATCH /project/:projectId/status
 * Updates only the completed_step on an existing project.
 */
export const UpdateProjectStatus = async (
  projectId: string,
  companyId: string,
  completedStep: number
) => {
  const path = apiEndpoints.PROJECT.UPDATE_STATUS(projectId, companyId);
  const URL = `${apiEndpoints.BASE_URL}${path}`;

  console.debug("[project.service] PATCH", URL, {
    completed_step: completedStep,
  });

  try {
    const response = await axiosInstance.patch(URL, {
      completed_step: completedStep,
    });
    console.debug(
      "[project.service] UpdateProjectStatus response:",
      response.status,
      response.data
    );
    return response;
  } catch (error: any) {
    console.warn(
      "[project.service] UpdateProjectStatus error:",
      error?.response?.status,
      error?.response?.data
    );
    return error?.response;
  }
};

/** GET /project/:projectId/additional-services — get additional services */
export const GetProjectAdditionalServices = async (projectId: string, companyId: string) => {
  try {
    const URL = `${apiEndpoints.BASE_URL}${apiEndpoints.PROJECT.GET_ADDITIONAL_SERVICES(
      projectId,
      companyId
    )}`;
    return await axiosInstance.get(URL);
  } catch (error: any) {
    return error?.response;
  }
};

/** PATCH /project/:projectId/additional-services — save additional services */
export const SaveProjectAdditionalServices = async (projectId: string, companyId: string, data: any) => {
  try {
    const URL = `${apiEndpoints.BASE_URL}${apiEndpoints.PROJECT.SAVE_ADDITIONAL_SERVICES(
      projectId,
      companyId
    )}`;
    return await axiosInstance.patch(URL, data);
  } catch (error: any) {
    return error?.response;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Optimized Field-Specific API Functions
// Based on Field Usage Audit - Only fetch required fields for each screen
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET project info fields only (for ProjectInfo screen)
 * Fetches: companyName, installerProjectId, customerFirstName, customerLastName, projectNotes, siteSurveyDate
 */
export const getProjectInfoFields = async (projectId: string, companyId?: string) => {
  try {
    const fields = [
      'company_name',
      'installer_project_id', 
      'customer_first_name',
      'customer_last_name',
      'project_notes',
      'site_survey_date'
    ];
    
    const URL = `${apiEndpoints.BASE_URL}/project/${projectId}${
      companyId ? `?companyId=${companyId}` : ''
    }&fields=${fields.join(',')}`;
    
    console.debug('[project.service] getProjectInfoFields →', URL);
    
    const response = await axiosInstance.get(URL);
    
    // Transform the response to match UI field names
    if (response?.data?.data) {
      const data = response.data.data;
      return {
        ...response,
        data: {
          ...response.data,
          data: {
            companyName: data.company_name,
            installerProjectId: data.installer_project_id,
            customerFirstName: data.customer_first_name,
            customerLastName: data.customer_last_name,
            projectNotes: data.project_notes,
            siteSurveyDate: data.site_survey_date
          }
        }
      };
    }
    
    return response;
  } catch (error: any) {
    console.warn('[project.service] getProjectInfoFields error:', error?.response?.status);
    return error?.response;
  }
};

/**
 * GET site info fields only (for SiteInfo screen)
 * Fetches: address, city, state, zip, apn, jurisdiction, utility
 */
export const getSiteInfoFields = async (projectId: string) => {
  try {
    const fields = [
      'address',
      'city',
      'state',
      'zip_code',
      'apn',
      'jurisdiction',
      'utility'
    ];
    
    const URL = `${apiEndpoints.BASE_URL}/project/${projectId}/site-info?fields=${fields.join(',')}`;
    
    console.debug('[project.service] getSiteInfoFields →', URL);
    
    const response = await axiosInstance.get(URL);
    
    // Transform the response to match UI field names
    if (response?.data?.data) {
      const data = response.data.data;
      return {
        ...response,
        data: {
          ...response.data,
          data: {
            address: data.address,
            city: data.city,
            state: data.state,
            zip: data.zip_code,
            apn: data.apn,
            jurisdiction: data.jurisdiction,
            utility: data.utility
          }
        }
      };
    }
    
    return response;
  } catch (error: any) {
    console.warn('[project.service] getSiteInfoFields error:', error?.response?.status);
    return error?.response;
  }
};

/**
 * GET system-specific equipment fields (for EquipmentDetails screens)
 * Fetches only sys{N}_* fields for the specified system number (1-4)
 * 
 * @param projectId - Project UUID
 * @param systemNumber - System number (1, 2, 3, or 4)
 * @returns Fields for the specified system only
 */
export const getSystemEquipmentFields = async (projectId: string, systemNumber: 1 | 2 | 3 | 4) => {
  try {
    // Validate system number
    if (systemNumber < 1 || systemNumber > 4) {
      throw new Error(`Invalid system number: ${systemNumber}. Must be 1-4.`);
    }
    
    const prefix = `sys${systemNumber}_`;
    
    // Define all possible equipment fields for a system (matching useEquipmentDetails hook expectations)
    const systemFields = [
      // Solar Panel 1 fields
      `${prefix}solar_panel_qty`,
      `${prefix}solar_panel_make`,
      `${prefix}solar_panel_model`,
      `${prefix}solarpanel_existing`,
      `${prefix}batteryonly`,
      `${prefix}show_second_panel_type`,

      // Solar Panel Type 2 fields
      `${prefix}solar_panel_type2_qty`,
      `${prefix}solar_panel_type2_make`,
      `${prefix}solar_panel_type2_model`,
      `${prefix}solarpanel_type2_existing`,

      // System Selection
      `${prefix}selectedsystem`,
      `${prefix}backup_option`,

      // Inverter fields
      `${prefix}inverter_make`,
      `${prefix}inverter_model`,
      `${prefix}inverter_qty`,
      `${prefix}inverter_existing`,
      `${prefix}stringing_type`,
      `${prefix}stringing_configuration`,

      // Microinverter fields
      `${prefix}micro_inverter_make`,
      `${prefix}micro_inverter_model`,
      `${prefix}micro_inverter_qty`,
      `${prefix}microinverter_existing`,

      // Optimizer fields
      `${prefix}optimizer_make`,
      `${prefix}optimizer_model`,
      `${prefix}optimizer_qty`,
      `${prefix}optimizer_existing`,

      // String Combiner Panel fields
      `${prefix}string_combiner_panel_make`,
      `${prefix}string_combiner_panel_model`,
      `${prefix}string_combiner_panel_busamps`,
      `${prefix}string_combiner_panel_mainbreaker`,
      `${prefix}stringcombinerpanel_existing`,

      // Battery Type 1 fields (corrected naming to match hook)
      `${prefix}battery_1_make`,
      `${prefix}battery_1_model`,
      `${prefix}battery_1_qty`,
      `${prefix}battery1_existing`,

      // Battery Type 2 fields (corrected naming to match hook)
      `${prefix}battery_2_make`,
      `${prefix}battery_2_model`,
      `${prefix}battery_2_qty`,
      `${prefix}battery2_existing`,

      // SMS fields
      `${prefix}sms_make`,
      `${prefix}sms_model`,
      `${prefix}sms_existing`,
      `${prefix}sms_has_rsd`,
      `${prefix}sms_main_breaker`,
      `${prefix}sms_backup_panel`,
      `${prefix}sms_pv_breaker`,
      `${prefix}sms_ess_breaker`,
      `${prefix}sms_tie_in_breaker`,
      `${prefix}sms_activate_pcs`,

      // ESS Combiner fields
      `${prefix}ess_make`,
      `${prefix}ess_model`,
      `${prefix}ess_existing`,
      `${prefix}ess_upstream_breaker_rating`,
      `${prefix}ess_upstream_breaker_location`,
      `${prefix}ess_main_breaker_rating`,

      // String Combiner Panel detailed fields
      `${prefix}combinerpanel_bus_rating`,
      `${prefix}combinerpanel_main_breaker_rating`,

      // SMS detailed breaker fields
      `${prefix}sms_breaker_rating`,
      `${prefix}sms_backup_load_sub_panel_breaker_rating`,
      `${prefix}sms_pv_breaker_rating_override`,
      `${prefix}sms_ess_breaker_rating_override`,
      `${prefix}sms_tie_in_breaker_rating_override`,
      `${prefix}sms_rsd_enabled`,

      // Tesla/PowerWall specific fields
      `${prefix}teslagatewaytype`,
      `${prefix}gateway`,
      `${prefix}backupswitch_location`,
      `${prefix}tesla_extensions`,

      // Inverter advanced fields
      `${prefix}inverter_stringing_configuration`,


      // PCS Settings
      `${prefix}pcs_settings`,

      // Stringing branch fields (for custom stringing)
      `${prefix}branch_string_1`,
      `${prefix}branch_string_2`,
      `${prefix}branch_string_3`,
      `${prefix}branch_string_4`,
      `${prefix}branch_string_5`,
      `${prefix}branch_string_6`,
      `${prefix}branch_string_7`,
      `${prefix}branch_string_8`,

      // Backup Subpanel fields
      `${prefix}backup_subpanel_make`,
      `${prefix}backup_subpanel_model`,
      `${prefix}backup_subpanel_busamps`,
      `${prefix}backup_subpanel_mainbreaker`,
      `${prefix}backupsubpanel_existing`,

      // BOS Equipment fields (balance of system)
      `bos_${prefix}type1_equipment_type`,
      `bos_${prefix}type1_make`,
      `bos_${prefix}type1_model`,
      `bos_${prefix}type1_amp_rating`,
      `bos_${prefix}type1_active`,

      `bos_${prefix}type2_equipment_type`,
      `bos_${prefix}type2_make`,
      `bos_${prefix}type2_model`,
      `bos_${prefix}type2_amp_rating`,
      `bos_${prefix}type2_active`,

      `bos_${prefix}type3_equipment_type`,
      `bos_${prefix}type3_make`,
      `bos_${prefix}type3_model`,
      `bos_${prefix}type3_amp_rating`,
      `bos_${prefix}type3_active`
    ];
    
    const URL = `${apiEndpoints.BASE_URL}/project/${projectId}/system-details?fields=${systemFields.join(',')}`;

    // Suppress massive URL logs to keep console readable
    // console.debug(`[project.service] getSystemEquipmentFields(system ${systemNumber}) →`, URL);

    const response = await axiosInstance.get(URL);

    // Log the number of fields returned for this system
    // if (response?.data?.data) {
    //   const fieldCount = Object.keys(response.data.data).filter(key => key.startsWith(prefix) || key.startsWith(`bos_${prefix}`)).length;
    //   console.debug(`[project.service] System ${systemNumber} returned ${fieldCount} fields`);
    // }
    
    return response;
  } catch (error: any) {
    console.warn(`[project.service] getSystemEquipmentFields(system ${systemNumber}) error:`, error?.response?.status);
    return error?.response;
  }
};

/**
 * GET electrical configuration fields only (for ElectricalDetailsScreen)
 * Fetches: service_entrance_type, mcb_count, mpa_*, spb_*, poi_* fields
 */
export const getElectricalFields = async (projectId: string, companyId?: string) => {
  try {
    const electricalFields = [
      // Service entrance fields
      'service_entrance_type',
      'mcb_count',
      
      // Main Panel A fields
      'mpa_type',
      'mpa_bus',
      'mpa_main',
      'mpa_feeder',
      'mpa_location',
      'mpu_selection',
      
      // Sub Panel B fields (conditional)
      'spb_type',
      'spb_bus', 
      'spb_main',
      'spb_feeder',
      'spb_location',
      'show_sub_panel_b',
      
      // Point of Interconnection fields
      'poi_type',
      'poi_breaker',
      'poi_disconnect',
      'poi_location',
      
      // Additional electrical fields that might be needed
      'electrical_notes',
      'meter_type',
      'meter_location'
    ];
    
    // Use system-details endpoint (unified approach)
    const URL = `${apiEndpoints.BASE_URL}/project/${projectId}/system-details?fields=${electricalFields.join(',')}`;
    console.debug('[project.service] getElectricalFields (via system-details) →', URL);
    
    try {
      const response = await axiosInstance.get(URL);
      
      if (response?.data?.data) {
        // Filter to only return electrical fields
        const data = response.data.data;
        const filteredData: any = {};
        
        electricalFields.forEach(field => {
          if (data[field] !== undefined) {
            filteredData[field] = data[field];
          }
        });
        
        const fieldCount = Object.keys(filteredData).length;
        console.debug(`[project.service] Electrical fields returned: ${fieldCount}`);
        
        return {
          ...response,
          data: {
            ...response.data,
            data: filteredData
          }
        };
      }
      
      return response;
    } catch (error: any) {
      console.warn('[project.service] System-details endpoint failed for electrical fields');
      throw error;
    }
  } catch (error: any) {
    console.warn('[project.service] getElectricalFields error:', error?.response?.status);
    return error?.response;
  }
};

/**
 * GET Balance of System (BOS) fields only
 * Fetches BOS-related fields for all BOS types (1-10)
 */
export const getBOSFields = async (projectId: string) => {
  try {
    const bosFields: string[] = [];
    
    // Generate field names for BOS types 1-10
    for (let i = 1; i <= 10; i++) {
      const prefix = `bos_type_${i}_`;
      bosFields.push(
        `${prefix}equipment_type`,
        `${prefix}make`,
        `${prefix}model`,
        `${prefix}amp_rating`,
        `${prefix}is_new`,
        `${prefix}panel_note`,
        `${prefix}photo_count`,
        `${prefix}active`
      );
    }
    
    // Add general BOS fields
    bosFields.push(
      'bos_total_types',
      'bos_completed_types',
      'bos_notes'
    );
    
    const URL = `${apiEndpoints.BASE_URL}/project/${projectId}/system-details?fields=${bosFields.join(',')}`;
    
    console.debug('[project.service] getBOSFields →', URL);
    
    const response = await axiosInstance.get(URL);
    
    // Count active BOS types
    if (response?.data?.data) {
      const data = response.data.data;
      let activeTypes = 0;
      
      for (let i = 1; i <= 10; i++) {
        if (data[`bos_type_${i}_active`] || data[`bos_type_${i}_equipment_type`]) {
          activeTypes++;
        }
      }
      
      console.debug(`[project.service] BOS fields: ${activeTypes} active types found`);
      
      // Add computed field for UI convenience
      response.data.data._computed_active_bos_types = activeTypes;
    }
    
    return response;
  } catch (error: any) {
    console.warn('[project.service] getBOSFields error:', error?.response?.status);
    return error?.response;
  }
};

/**
 * GET minimal project summary (for Dashboard/List views)
 * Fetches only essential fields for project cards/lists
 */
export const getProjectSummaryFields = async (projectId: string, companyId?: string) => {
  try {
    const summaryFields = [
      'uuid',
      'installer_project_id',
      'customer_first_name',
      'customer_last_name',
      'address',
      'city',
      'state',
      'created_at',
      'updated_at',
      'completed_step',
      'project_status'
    ];
    
    const URL = `${apiEndpoints.BASE_URL}/project/${projectId}${
      companyId ? `?companyId=${companyId}` : ''
    }&fields=${summaryFields.join(',')}`;
    
    console.debug('[project.service] getProjectSummaryFields →', URL);
    
    const response = await axiosInstance.get(URL);
    
    return response;
  } catch (error: any) {
    console.warn('[project.service] getProjectSummaryFields error:', error?.response?.status);
    return error?.response;
  }
};

/**
 * Utility function to check if field selection is supported by the API
 * Returns the full data if field selection is not supported
 */
export const getFieldsWithFallback = async (
  fetchFunction: () => Promise<any>,
  fallbackFunction: () => Promise<any>
) => {
  try {
    const response = await fetchFunction();
    
    // Check if the response indicates field selection worked
    if (response?.status === 200 && response?.data?.data) {
      return response;
    }
    
    // If field selection didn't work, use fallback
    console.debug('[project.service] Field selection not supported, using fallback');
    return await fallbackFunction();
  } catch (error) {
    // Try fallback on error
    console.debug('[project.service] Primary fetch failed, trying fallback');
    return await fallbackFunction();
  }
};

/**
 * GET /project/installers?companyId=... — fetch unique list of installers
 * Returns a unique list of installer names from all projects
 */
export const getUniqueInstallers = async (companyId: string) => {
  try {
    const URL = `${apiEndpoints.BASE_URL}/project/installers?companyId=${companyId}`;
    console.debug('[project.service] getUniqueInstallers →', URL);
    const response = await axiosInstance.get(URL);

    // If the endpoint doesn't exist, fall back to getting all projects and extracting unique installers
    if (response?.status === 404) {
      console.debug('[project.service] Installers endpoint not found, using fallback');
      const projectsResponse = await ListProjects(companyId);
      if (projectsResponse?.status === 200 && projectsResponse?.data?.projects) {
        const installers = [...new Set(
          projectsResponse.data.projects
            .map((p: any) => p.installer_name)
            .filter((name: any) => name && name.trim())
        )].sort();

        return {
          ...projectsResponse,
          data: { installers }
        };
      }
    }

    return response;
  } catch (error: any) {
    console.warn('[project.service] getUniqueInstallers error:', error?.response?.status);

    // Fallback: Get all projects and extract unique installer names
    try {
      const projectsResponse = await ListProjects(companyId);
      if (projectsResponse?.status === 200 && projectsResponse?.data?.projects) {
        const installers = [...new Set(
          projectsResponse.data.projects
            .map((p: any) => p.installer_name)
            .filter((name: any) => name && name.trim())
        )].sort();

        return {
          status: 200,
          data: { installers }
        };
      }
    } catch (fallbackError) {
      console.error('[project.service] Fallback failed:', fallbackError);
    }

    return error?.response || { status: 500, data: { installers: [] } };
  }
};

/**
 * GET /project/companies — fetch unique list of company names (for super users)
 * Returns a unique list of company names from all projects across all companies
 */
export const getUniqueCompanies = async () => {
  try {
    const URL = `${apiEndpoints.BASE_URL}/project/companies`;
    console.debug('[project.service] getUniqueCompanies →', URL);
    const response = await axiosInstance.get(URL);

    // If the endpoint doesn't exist, fall back to getting all projects and extracting unique companies
    if (response?.status === 404) {
      console.debug('[project.service] Companies endpoint not found, using fallback');
      const projectsResponse = await ListProjects(null); // null = all projects for super users
      if (projectsResponse?.status === 200 && projectsResponse?.data?.projects) {
        const companies = [...new Set(
          projectsResponse.data.projects
            .map((p: any) => p.company_name)
            .filter((name: any) => name && name.trim())
        )].sort();

        return {
          ...projectsResponse,
          data: { companies }
        };
      }
    }

    return response;
  } catch (error: any) {
    console.warn('[project.service] getUniqueCompanies error:', error?.response?.status);

    // Fallback: Get all projects and extract unique company names
    try {
      const projectsResponse = await ListProjects(null); // null = all projects for super users
      if (projectsResponse?.status === 200 && projectsResponse?.data?.projects) {
        const companies = [...new Set(
          projectsResponse.data.projects
            .map((p: any) => p.company_name)
            .filter((name: any) => name && name.trim())
        )].sort();

        return {
          status: 200,
          data: { companies }
        };
      }
    } catch (fallbackError) {
      console.error('[project.service] Fallback failed:', fallbackError);
    }

    return error?.response || { status: 500, data: { companies: [] } };
  }
};

/** GET /equipment/specs?type=Inverter&make=...&model=... — get equipment specifications */
export const getEquipmentSpecs = async (type: string, make: string, model: string) => {
  try {
    const URL = `${apiEndpoints.BASE_URL}/equipment/specs?type=${enc(type)}&make=${enc(make)}&model=${enc(model)}`;
    console.debug("[project.service] getEquipmentSpecs:", { type, make, model });
    return await axiosInstance.get(URL);
  } catch (error: any) {
    console.warn("[project.service] getEquipmentSpecs error:", error?.message ?? error);
    return error?.response;
  }
};
