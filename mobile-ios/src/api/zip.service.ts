// src/api/zip.service.ts
import axiosInstance from "./axiosInstance";
import { DEBUG_MODE, writeDebugLog } from "../utils/debugTools";

export const getZipCodesByState = async (state: string, token: string) => {
  try {
    const response = await axiosInstance.get(
      `/location/zip-codes?state=${state}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const zips = response.data?.zipCodes;

    if (DEBUG_MODE) {
      writeDebugLog(
        `🌐 Received zip code response for ${state}: ${
          Array.isArray(zips) ? zips.length : "Invalid"
        }`
      );
    }

    return Array.isArray(zips) ? zips : [];
  } catch (error) {
    if (DEBUG_MODE) {
      writeDebugLog(`❗ ZIP fetch error for ${state}: ${error}`);
    }
    return [];
  }
};
