// frontend/src/types/env.d.ts
declare module "@env" {
  export const API_BASE_URL: string;
  export const DEV_API_BASE_URL: string;
  export const AUTH_TOKEN: string;
  export const GOOGLE_MAPS_API_KEY: string;

  // NEW
  export const APP_LOCAL_TRIGGER_SECRET: string;
  export const APP_TRIGGER_COMPUTER_NAME: string;
}
