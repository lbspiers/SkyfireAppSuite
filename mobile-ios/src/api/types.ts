// src/api/types.ts
export interface ApiResponse<T = any> {
  status: number;
  data?: T;
  message?: string;
  error?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Password Reset Global Types
export interface PasswordResetData {
  email: string;
  resetCode: string;
  expiresAt: number;
  createdAt: number;
}

export interface PasswordResetToken {
  email: string;
  token: string;
  expiresAt: number;
  createdAt: number;
}

// Extend global object for password reset storage
declare global {
  var passwordResetData: PasswordResetData | null;
  var passwordResetToken: PasswordResetToken | null;
}

// Common API result wrapper
export interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  loading?: boolean;
}

// File upload related types
export interface FileUploadResponse {
  url: string;
  key: string;
  bucket?: string;
}

export interface PresignedUploadResponse {
  uploadUrl: string;
  fileUrl: string;
  key: string;
  fields?: Record<string, string>;
}
