// src/store/actions/utilityActions.ts
import { setFullUtilityList } from "../slices/utilitySlice";
import axios from "axios";
import { writeDebugLog } from "../../utils/debugTools"; // ✅ Add this import if you want better logging

export const loadUtilities = () => async (dispatch: any, getState: any) => {
  try {
    const token = getState().auth.accessToken;
    const baseUrl = process.env.API_BASE_URL || "https://api.skyfireapp.io";
    const response = await axios.get(
      `${baseUrl}/equipment/utilities-all`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status === 200) {
      const loadedData = response.data?.data || [];

      dispatch(setFullUtilityList(loadedData));

      console.log(`✅ Loaded ${loadedData.length} utilities into Redux!`);
      if (loadedData.length === 0) {
        console.error("⚠️ Warning: Loaded utilities list is EMPTY!");
      }

      if (loadedData.length > 0) {
        writeDebugLog(
          `🧩 First 10 utilities loaded: ${loadedData
            .slice(0, 10)
            .map(
              (u: { zipcode: string; provider: string }) =>
                `${u.zipcode}:${u.provider}`
            )
            .join(", ")}`
        );
      }
    } else {
      console.error("❌ Failed to load utilities:", response.status);
    }
  } catch (error: any) {
    console.error(
      "❌ Error loading utilities from server:",
      error?.message || error
    );
  }
};
