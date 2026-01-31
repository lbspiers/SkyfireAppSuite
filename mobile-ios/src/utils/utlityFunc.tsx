import AsyncStorage from "@react-native-async-storage/async-storage";
import logger from "./logger";

function toCamelCase(str: any) {
  return str.replace(/_([a-z])/g, (match: any, letter: any) => letter.toUpperCase());
}

const capitalize = (str: string) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export function debugLogJson(obj: any, spaces = 2) {
  return logger.info(JSON.stringify(obj, null, spaces));
}
export function omitNullValues(obj: any) {
  if (obj === null || obj === "" || obj === undefined || typeof obj !== "object") {
    return obj;
  }
 
  return Object.entries(obj).reduce(
    (acc: any, [key, value]) => {
      const cleanedValue = omitNullValues(value);
 
      if (cleanedValue !== null && cleanedValue !== "" && cleanedValue !== undefined) {
        acc[key] = cleanedValue;
      }
 
      return acc;
    },
    Array.isArray(obj) ? [] : {}
  );
}
// Save tokens to AsyncStorage
export const saveTokensToStorage = async (accessToken: string, refreshToken: string) => {
  try {
    await AsyncStorage.setItem("accessToken", accessToken);
    await AsyncStorage.setItem("refreshToken", refreshToken);
  } catch (error) {
    console.error("Error saving tokens to storage:", error);
  }
};

// Retrieve tokens from AsyncStorage
export const getTokensFromStorage = async () => {
  try {
    const accessToken = await AsyncStorage.getItem("accessToken");
    const refreshToken = await AsyncStorage.getItem("refreshToken");
    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Error retrieving tokens from storage:", error);
    return { accessToken: null, refreshToken: null };
  }
};

export function convertKeysToCamelCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map((item: any) => convertKeysToCamelCase(item));
  } else if (obj !== null && typeof obj === "object") {
    return Object.entries(obj).reduce((acc: any, [key, value]) => {
      const camelCaseKey = toCamelCase(key);
      acc[camelCaseKey] = convertKeysToCamelCase(value);
      return acc;
    }, {});
  }
  return obj;
}

export const ampsRatings = [
  { label: "5 Amps", value: "5" },
  { label: "10 Amps", value: "10" },
  { label: "15 Amps", value: "15" },
  { label: "20 Amps", value: "20" },
  { label: "25 Amps", value: "25" },
  { label: "30 Amps", value: "30" },
  { label: "40 Amps", value: "40" },
  { label: "50 Amps", value: "50" },
  { label: "60 Amps", value: "60" },
  { label: "70 Amps", value: "70" },
  { label: "80 Amps", value: "80" },
  { label: "90 Amps", value: "90" },
  { label: "100 Amps", value: "100" },
  { label: "125 Amps", value: "125" },
  { label: "150 Amps", value: "150" },
  { label: "175 Amps", value: "175" },
  { label: "200 Amps", value: "200" },
  { label: "225 Amps", value: "225" },
  { label: "250 Amps", value: "250" },
  { label: "300 Amps", value: "300" },
  { label: "350 Amps", value: "350" },
  { label: "400 Amps", value: "400" },
  { label: "450 Amps", value: "450" },
  { label: "500 Amps", value: "500" },
  { label: "600 Amps", value: "600" },
];
/*
"Lighting circuits",
  "Refrigerators",
  "Air conditioning units",
  "Water heaters",
  "Electric dryers",
  "Electric ovens or stoves",
  "General-purpose outlets"
*/
export const loadType = [
  { label:"Lighting circuits", value: "Lighting circuits" },
  { label:"Refrigerators", value: "Refrigerators" },
  { label: "Air conditioning units", value: "Air conditioning units"},
  { label: "Water heaters", value: "Water heaters"},
  { label: "Electric dryers", value: "Electric dryers"},
  { label: "Electric ovens or stoves", value: "Electric ovens or stoves"},
  { label: "General-purpose outlets", value: "General-purpose outlets"}
]

export const breakerLocations = [
  { label: "Main Panel", value: "main_panel" },
  { label: "Sub Panel", value: "sub_panel" },
  { label: "Service Entrance", value: "service_entrance" },
  { label: "Meter Base", value: "meter_base" },
  { label: "Switchgear", value: "switchgear" },
  { label: "Transfer Switch", value: "transfer_switch" },
  { label: "Generator Panel", value: "generator_panel" },
  { label: "Transformer", value: "transformer" },
  { label: "Distribution Panel", value: "distribution_panel" },
  { label: "Utility Room", value: "utility_room" },
  { label: "Motor Control Center (MCC)", value: "motor_control_center" },
  { label: "Electrical Room", value: "electrical_room" },
  { label: "Outdoor Panel", value: "outdoor_panel" },
  { label: "Battery Backup Panel", value: "battery_backup_panel" },
  { label: "Emergency Panel", value: "emergency_panel" },
];
