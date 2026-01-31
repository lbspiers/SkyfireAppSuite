import axios from "axios";

// Base URL for your backend server
const BASE_URL = process.env.API_BASE_URL || "https://api.skyfireapp.io";

/**
 * Fetch utilities by zipcode
 * @param zipcode - 5 digit US zipcode
 * @param token - User auth token
 * @returns Array of utility names (strings)
 */
export const fetchUtilitiesByZip = async (zipcode: string, token: string) => {
  if (!zipcode || zipcode.length !== 5) {
    throw new Error("Invalid zipcode. Must be exactly 5 digits.");
  }

  try {
    const response = await axios.get(`${BASE_URL}/equipment/utilities`, {
      params: { zipcode },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response?.data?.data) {
      return response.data.data; // ✅ Array of strings ["Utility 1", "Utility 2"]
    } else {
      return [];
    }
  } catch (error: any) {
    console.error(
      "💥 Error fetching utilities:",
      error.response || error.message
    );
    throw new Error(
      error?.response?.data?.message || "Failed to fetch utilities."
    );
  }
};

/**
 * 🔥 Fetch all utilities across all ZIP codes (for preload into Redux)
 * @param token - User auth token
 * @returns Array of utility records {zipcode, provider}
 */
export const fetchAllUtilities = async (token: string) => {
  try {
    const response = await axios.get(`${BASE_URL}/equipment/utilities`, {
      params: { all: true }, // ✅ Now it passes the new "all=true"
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (Array.isArray(response.data)) {
      return response.data; // ✅ [{ zipcode: '90210', provider: 'Utility Name' }, ...]
    } else {
      return [];
    }
  } catch (error: any) {
    console.error(
      "💥 Error fetching all utilities:",
      error.response || error.message
    );
    throw new Error(
      error?.response?.data?.message || "Failed to fetch all utilities."
    );
  }
};

/**
 * 🔥 Fetch utility requirements (BOS data, combination, notes, etc.)
 * @param state - 2-letter state code (e.g., "CA") - OPTIONAL, can be omitted
 * @param abbrev - Utility abbreviation (e.g., "PG&E", "SCE", "APS")
 * @param token - User auth token
 * @returns Utility requirements object (first item from array response)
 */
export const fetchUtilityRequirements = async (
  state: string,
  abbrev: string,
  token: string
) => {
  if (!abbrev) {
    throw new Error("Abbreviation is required.");
  }

  try {
    // State is optional - backend can search by abbrev alone
    const params: any = { abbrev };
    if (state) {
      params.state = state;
    }

    const response = await axios.get(`${BASE_URL}/utility-zipcodes/requirements`, {
      params,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("📋 Utility Requirements Raw Response:", response.data);

    // Backend returns an array, take the first item
    if (response?.data && Array.isArray(response.data) && response.data.length > 0) {
      const requirements = response.data[0];
      console.log("📋 Utility Requirements Parsed:", requirements);
      console.log("📋 Combination field:", requirements.combination);
      return requirements;
    } else {
      console.warn("📋 No utility requirements found for:", abbrev);
      return null;
    }
  } catch (error: any) {
    console.error(
      "💥 Error fetching utility requirements:",
      error.response || error.message
    );
    throw new Error(
      error?.response?.data?.message || "Failed to fetch utility requirements."
    );
  }
};
