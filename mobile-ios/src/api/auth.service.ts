import apiEndpoints from "../config/apiEndPoint";
import { OTPPAYLOAD, RESET_PASSWORD_PAYLOAD, RegistrationPayload } from "../utils/models";
import axiosInstance from "./axiosInstance";

export const login = async (credentials: { email: string; password: string }) => {
  const response = await axiosInstance.post(`${apiEndpoints.BASE_URL}${apiEndpoints.AUTH.LOGIN}`, credentials);
  return response.data;
};

export const register = async (data:RegistrationPayload) => {
  console.log(`${apiEndpoints.BASE_URL}${apiEndpoints.AUTH.REGISTER}`)
  const response = await axiosInstance.post(`${apiEndpoints.BASE_URL}${apiEndpoints.AUTH.REGISTER}`, data);
  return response.data;
};

export const resetPassword = async (email: string) => {
  const response = await axiosInstance.post(`${apiEndpoints.BASE_URL}${apiEndpoints.AUTH.RESET_PASSWORD_GET_OTP}`,  email );
  return response.data;
};

export const VerifyOTP=async(data:OTPPAYLOAD)=>{
  const response = await axiosInstance.post(`${apiEndpoints.BASE_URL}${apiEndpoints.AUTH.VERIFY_OTP}`,  data );
  return response.data;

}

export const PasswordReset=async(data:RESET_PASSWORD_PAYLOAD)=>{
  const response = await axiosInstance.post(`${apiEndpoints.BASE_URL}${apiEndpoints.AUTH.RESET_PASSWORD}`,  data );
  return response.data;
} 

export const getUserOrCompanyDetails=async()=>{
  const response = await axiosInstance.post(`${apiEndpoints.BASE_URL}${apiEndpoints.AUTH.HANDLE_LOGIN_PROFILE}` );
  return response.data;
}
