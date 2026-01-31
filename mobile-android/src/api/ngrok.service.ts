import axios from "axios";

const BASE_URL = process.env.API_BASE_URL || "https://api.skyfireapp.io";

export const getNgrokUrl = async () => {
  return axios.get(`${BASE_URL}/ngrok-url`);
};
