// Standard API response wrapper
export interface ApiResponse<T = any> {
  status: "SUCCESS" | "ERROR";
  success?: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Auth tokens
export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

// User profile
export interface UserProfile {
  id: string;
  uuid: string;
  username: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  profilePhotoUrl: string | null;
  companyId?: string;
  companyName?: string;
  created_at?: string;
  updated_at?: string;
}
