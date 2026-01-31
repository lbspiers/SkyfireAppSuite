import apiEndpoints from "../config/apiEndPoint";
import axiosInstance from "./axiosInstance";

const enc = encodeURIComponent;

export const ListAllEquipmentsData = async () => {
  try {
    const URL = `${apiEndpoints.BASE_URL}${apiEndpoints.INVENTORY_MODULE.LIST_ALL_EQUIPMENT}`;
    const response = await axiosInstance.get(`${URL}`);
    return response;
  } catch (error) {
    console.error("Error fetching equipment data: ", error);
    return null;
  }
};

export const ListAllManufacturer = async (type: any) => {
  try {
    // Ensure type is encoded
    const URL = `${
      apiEndpoints.BASE_URL
    }${apiEndpoints.INVENTORY_MODULE.List_Manufacturer_by_Type(enc(type))}`;
    const response = await axiosInstance.get(`${URL}`);
    return response;
  } catch (error) {
    console.error("Error : ", error);
    return null;
  }
};

export const GetModelNumber = async (type: any, manufacturer: any) => {
  try {
    // Encode both
    const URL = `${
      apiEndpoints.BASE_URL
    }${apiEndpoints.INVENTORY_MODULE.GET_MODEL_NUMBER(
      enc(type),
      enc(manufacturer)
    )}`;
    const response = await axiosInstance.get(`${URL}`);
    return response;
  } catch (error) {
    console.error("Error : ", error);
    return null;
  }
};

export const GetBatteryModels = async (manufacturer: string) => {
  try {
    const URL = `${
      apiEndpoints.BASE_URL
    }${apiEndpoints.INVENTORY_MODULE.GET_BATTERY_MODELS(enc(manufacturer))}`;
    console.log(`[GetBatteryModels] 🔍 Fetching battery models for manufacturer: "${manufacturer}"`);
    console.log(`[GetBatteryModels] 📡 API URL: ${URL}`);
    const response = await axiosInstance.get(`${URL}`);
    const modelCount = response?.data?.data?.length || 0;
    console.log(`[GetBatteryModels] ✅ Response received: ${modelCount} models found`);

    // Log first model's structure to verify couple_type is included
    if (modelCount > 0) {
      const firstModel = response.data.data[0];
      console.log(`[GetBatteryModels] 📋 First model structure:`, firstModel);
      console.log(`[GetBatteryModels] 🔌 First model couple_type:`, firstModel.couple_type);
      console.log(`[GetBatteryModels] 📝 Available fields:`, Object.keys(firstModel).join(', '));
    }

    if (modelCount === 0) {
      console.warn(`[GetBatteryModels] ⚠️ No battery models found for "${manufacturer}" - this may indicate a backend data issue`);
    }
    return response;
  } catch (error) {
    console.error(`[GetBatteryModels] ❌ Error fetching battery models for "${manufacturer}":`, error);
    return null;
  }
};

export const AddToInventory = async (companyId: any, data: any) => {
  try {
    const URL = `${
      apiEndpoints.BASE_URL
    }${apiEndpoints.INVENTORY_MODULE.ADD_INVENTORY(companyId)}`;
    const response = await axiosInstance.post(`${URL}`, data);
    return response;
  } catch (error) {
    console.error("Error: ", error);
    return null;
  }
};

export const AddUnListedInventory = async (companyId: any, data: any) => {
  try {
    const URL = `${
      apiEndpoints.BASE_URL
    }${apiEndpoints.INVENTORY_MODULE.UNLIST_ADD_INVENTORY(companyId)}`;
    const response: any = await axiosInstance.post(`${URL}`, data);
    return response;
  } catch (error: any) {
    console.error("Error : ", error?.message);
    return null;
  }
};

export const GetListInventoryEquipment = async (
  companyId: any,
  equipmentType: any
) => {
  try {
    // encode equipmentType just to be safe
    const URL = `${
      apiEndpoints.BASE_URL
    }${apiEndpoints.INVENTORY_MODULE.LIST_INVENTORY_EQUIPMENT(
      companyId,
      enc(equipmentType)
    )}`;
    const response: any = await axiosInstance.get(`${URL}`);
    return response;
  } catch (error: any) {
    console.error("Error: ", error);
    return null;
  }
};

export const DeleteEquipment = async (companyId: any, equipmentUUID: any) => {
  try {
    const URL = `${
      apiEndpoints.BASE_URL
    }${apiEndpoints.INVENTORY_MODULE.DELETE_INVENTORY_EQUIPMENT(
      companyId,
      equipmentUUID
    )}`;
    const response: any = await axiosInstance.delete(`${URL}`);
    return response;
  } catch (error: any) {
    console.error("Error: ", error);
    return null;
  }
};
