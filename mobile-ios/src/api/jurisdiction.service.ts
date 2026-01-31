// src/api/jurisdiction.service.ts
import API from "./axiosInstance";
import { AxiosResponse } from "axios";
import { AHJ, AHJDropdownOption } from "../types/ahj";

/**
 * Fetch jurisdictions filtered by zip code
 */
export const fetchJurisdictionsByZip = async (
  zipCode: string
): Promise<AHJDropdownOption[]> => {
  try {
    console.log(`Fetching AHJs for zip code: ${zipCode}`);
    
    const response: AxiosResponse = await API.get("/ahj/by-zip", { 
      params: { zip_code: zipCode }
    });
    
    if (response.data && response.data.data) {
      // Format AHJ data for dropdown
      const ahjList = response.data.data as AHJ[];
      
      // Remove duplicates and format
      const uniqueAHJs = new Map<string, AHJDropdownOption>();
      
      ahjList.forEach((ahj: AHJ) => {
        if (ahj.ahj_name && !uniqueAHJs.has(ahj.ahj_name)) {
          uniqueAHJs.set(ahj.ahj_name, {
            label: formatAHJLabel(ahj),
            value: ahj.ahj_name,
            city: ahj.city,
            state: ahj.state,
            zip_code: ahj.zip_code,
          });
        }
      });
      
      return Array.from(uniqueAHJs.values()).sort((a, b) => 
        a.label.localeCompare(b.label)
      );
    }
    
    // Return empty array if no results
    return [];
  } catch (error) {
    console.error("Error fetching jurisdictions by zip:", error);
    // Try fallback method
    return getDefaultJurisdictionsByZip(zipCode);
  }
};

/**
 * Format AHJ for display in dropdown - using only ahj_name
 */
const formatAHJLabel = (ahj: AHJ): string => {
  return ahj.ahj_name;
};

/**
 * Fetch all jurisdictions (fallback method)
 */
export const fetchJurisdictions = async (
  state?: string
): Promise<AHJDropdownOption[]> => {
  try {
    const params: any = {};
    if (state) params.state = state;

    const response: AxiosResponse = await API.get("/ahj", { params });
    
    if (response.data && response.data.data) {
      const ahjList = response.data.data as AHJ[];
      
      return ahjList
        .filter(ahj => ahj.ahj_name)
        .map((ahj: AHJ) => ({
          label: formatAHJLabel(ahj),
          value: ahj.ahj_name,
          city: ahj.city,
          state: ahj.state,
          zip_code: ahj.zip_code,
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
    }
    
    return getDefaultJurisdictions(state);
  } catch (error) {
    console.error("Error fetching jurisdictions:", error);
    return getDefaultJurisdictions(state);
  }
};

/**
 * Get default jurisdictions by zip code (fallback)
 */
const getDefaultJurisdictionsByZip = (zipCode: string): AHJDropdownOption[] => {
  // Arizona zip codes (850xx, 852xx, 853xx, 855xx, 856xx, 857xx, 859xx, 860xx, 863xx, 864xx)
  if (zipCode.startsWith("850") || zipCode.startsWith("852") || 
      zipCode.startsWith("853") || zipCode.startsWith("855") ||
      zipCode.startsWith("856") || zipCode.startsWith("857") ||
      zipCode.startsWith("859") || zipCode.startsWith("860") ||
      zipCode.startsWith("863") || zipCode.startsWith("864")) {
    return [
      { label: "Phoenix", value: "Phoenix" },
      { label: "Scottsdale", value: "Scottsdale" },
      { label: "Tempe", value: "Tempe" },
      { label: "Mesa", value: "Mesa" },
      { label: "Chandler", value: "Chandler" },
    ];
  }
  
  // California zip codes (900xx - 961xx)
  if (zipCode.startsWith("90") || zipCode.startsWith("91") || 
      zipCode.startsWith("92") || zipCode.startsWith("93") ||
      zipCode.startsWith("94") || zipCode.startsWith("95") ||
      zipCode.startsWith("96")) {
    return [
      { label: "Los Angeles", value: "Los Angeles" },
      { label: "San Diego", value: "San Diego" },
      { label: "San Francisco", value: "San Francisco" },
      { label: "San Jose", value: "San Jose" },
    ];
  }
  
  // Default fallback
  return [
    { label: "County Jurisdiction", value: "County Jurisdiction" },
    { label: "City Jurisdiction", value: "City Jurisdiction" },
  ];
};

/**
 * Get default jurisdictions based on state
 */
const getDefaultJurisdictions = (state?: string): AHJDropdownOption[] => {
  // Arizona jurisdictions as default
  const arizonaJurisdictions = [
    "Phoenix",
    "Scottsdale",
    "Tempe",
    "Mesa",
    "Chandler",
    "Gilbert",
    "Glendale",
    "Peoria",
    "Surprise",
    "Avondale",
    "Goodyear",
    "Buckeye",
    "Queen Creek",
    "Maricopa",
    "Casa Grande",
    "Flagstaff",
    "Tucson",
    "Yuma",
    "Prescott",
    "Sedona",
  ];

  const californiaJurisdictions = [
    "Los Angeles",
    "San Diego",
    "San Francisco",
    "San Jose",
    "Fresno",
    "Sacramento",
    "Long Beach",
    "Oakland",
    "Bakersfield",
    "Anaheim",
    "Santa Ana",
    "Riverside",
    "Stockton",
    "Irvine",
    "Chula Vista",
  ];

  let jurisdictions = arizonaJurisdictions;
  
  if (state?.toLowerCase() === "ca" || state?.toLowerCase() === "california") {
    jurisdictions = californiaJurisdictions;
  }

  return jurisdictions.map((name) => ({
    label: name,
    value: name,
  }));
};

/**
 * Check if a project has received its AHJ lookup result
 * The ahj field in the project site should match the ahj_name from the AHJ table
 */
export const checkAHJLookupStatus = async (
  projectId: string,
  companyId: string
): Promise<string | null> => {
  try {
    const response: AxiosResponse = await API.get(
      `/project/${projectId}`,
      {
        params: { company_id: companyId },
      }
    );

    // The ahj field should contain the ahj_name value
    if (response.data?.data?.site?.ahj) {
      return response.data.data.site.ahj; // This should be the ahj_name
    }
    
    return null;
  } catch (error) {
    console.error("Error checking AHJ status:", error);
    return null;
  }
};
