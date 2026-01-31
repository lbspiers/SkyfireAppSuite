const BASE_URL = process.env.API_BASE_URL || "https://api.skyfireapp.io";

const AUTH = {
  LOGIN: "/auth/login",
  REGISTER: "/auth/sign-up",
  RESET_PASSWORD_GET_OTP: "/auth/request-reset-password",
  VERIFY_OTP: "/auth/verify-otp",
  RESET_PASSWORD: "/auth/reset-password",
  HANDLE_LOGIN_PROFILE: "/auth/profile",
};

const apiEndpoints = {
  BASE_URL,
  AUTH,
};

export default apiEndpoints;
