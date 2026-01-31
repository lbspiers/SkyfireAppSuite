import apiEndpoints from "../config/apiEndPoint";
import axiosInstance from "./axiosInstance";

export const Update_Company_Address = async (companyId:any,data:any) => {
    console.log(data,companyId);
    console.log(`${apiEndpoints.BASE_URL}${apiEndpoints.INTRO_MODULE.UPDATE_ADDRESS}${companyId}/address`)
  const response = await axiosInstance.put(
    `${apiEndpoints.BASE_URL}${apiEndpoints.INTRO_MODULE.UPDATE_ADDRESS}${companyId}/address`,data
  );
  return response;
};

export const Add_Service_Territory = async (companyId:any,data:any) => {
  try {
    console.log(data,companyId);
    const serviceURL = `${apiEndpoints.BASE_URL}${apiEndpoints.INTRO_MODULE.ADD_TERRITORY(companyId)}`
  const response = await axiosInstance.post(`${serviceURL}`,data);
  console.log("responsedata",response)
  return response;
  } catch (error:any) {
    console.error("Error in Add_Service_Territory", error?.message);
    throw error;
  }

};

export const Delete_Service_Territory = async (companyId:any,uuid:any) => {
  console.log(companyId,uuid);
  try {
    const serviceURL = `${apiEndpoints.BASE_URL}${apiEndpoints.INTRO_MODULE.DELETE_TERRITORY(companyId,uuid)}`
    console.log(serviceURL);
    const response = await axiosInstance.delete(`${serviceURL}`);
    console.log("responsedata",response?.data)
    return response;
    
  } catch (error) {
    console.error("Error in Delete_Service_Territory", error?.message);
    throw error;
  }

};

