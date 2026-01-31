/**
 * Authentication & Authorization Type Definitions
 * Comprehensive types for user, company, and session management
 */

// ============================================================================
// USER TYPES
// ============================================================================

export interface User {
  uuid: string;
  id?: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  approved?: boolean | number;
  created_at: string;
  updated_at?: string;
  company?: Company;
  companyUuid?: string;
  isSuperUser?: boolean;
  role?: UserRole;
}

export type UserRole = 'super_admin' | 'company_admin' | 'member' | 'viewer';

export interface UserProfile extends User {
  avatar?: string;
  timezone?: string;
  preferences?: Record<string, unknown>;
}

// ============================================================================
// COMPANY TYPES
// ============================================================================

export interface Company {
  uuid: string;
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  approved?: boolean | number;
  created_at: string;
  updated_at?: string;
}

export interface CompanyUser {
  uuid: string;
  user?: User;
  company?: Company;
  approved?: boolean | number;
}

// ============================================================================
// AUTHENTICATION TYPES
// ============================================================================

export interface LoginCredentials {
  userName: string; // email or username
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  status: 'SUCCESS' | 'ERROR';
  message: string;
  data?: {
    token: string;
    user: User;
    company?: Company;
  };
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
  companyName?: string;
  inviteCode?: string;
}

export interface RegisterResponse {
  status: 'SUCCESS' | 'ERROR';
  message: string;
  data?: {
    user: User;
    requiresApproval?: boolean;
  };
}

// ============================================================================
// SESSION TYPES
// ============================================================================

export interface SessionData {
  token: string;
  user: User;
  company?: Company;
  expiresAt: number; // Unix timestamp
  refreshToken?: string;
}

export interface StoredUserData {
  userData: User;
  companyData?: Company;
  token: string;
  timestamp: number;
}

// ============================================================================
// TEAM MANAGEMENT TYPES
// ============================================================================

export interface TeamMember {
  uuid: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role?: UserRole;
  status: 'active' | 'pending' | 'suspended';
  inviteCode?: string;
  inviteCodeExpires?: string;
  created_at: string;
  updated_at?: string;
  lastLogin?: string;
}

export interface AddTeamMemberData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role?: UserRole;
}

export interface AddTeamMemberResponse {
  status: 'SUCCESS' | 'ERROR';
  message: string;
  data?: {
    user: TeamMember;
    inviteCode: string;
    inviteCodeExpires: string;
  };
}

export interface ResendInviteResponse {
  status: 'SUCCESS' | 'ERROR';
  message: string;
  data?: {
    inviteCode: string;
    expiresAt: string;
  };
}

export interface DeleteTeamMemberResponse {
  status: 'SUCCESS' | 'ERROR';
  message: string;
}

export interface GetTeamMembersResponse {
  status: 'SUCCESS' | 'ERROR';
  message: string;
  data?: TeamMember[];
}

// ============================================================================
// INVITE CODE TYPES
// ============================================================================

export interface InviteCode {
  code: string; // Format: SKY-XXXX-XXXX
  email: string;
  expiresAt: string;
  used: boolean;
  createdAt: string;
}

export interface ValidateInviteCodeResponse {
  status: 'SUCCESS' | 'ERROR';
  message: string;
  data?: {
    valid: boolean;
    email?: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
  };
}

export interface RedeemInviteCodeData {
  inviteCode: string;
  password: string;
  confirmPassword: string;
}

export interface RedeemInviteCodeResponse {
  status: 'SUCCESS' | 'ERROR';
  message: string;
  data?: {
    token: string;
    user: User;
    company?: Company;
  };
}

// ============================================================================
// ADMIN VERIFICATION TYPES
// ============================================================================

export interface AdminVerificationResponse {
  status: 'SUCCESS' | 'ERROR';
  message: string;
  data?: {
    isAdmin: boolean;
    isSuperUser: boolean;
    role: UserRole;
    permissions: string[];
  };
}

export interface Permission {
  resource: string; // 'team', 'inventory', 'projects', etc.
  action: 'read' | 'create' | 'update' | 'delete' | 'manage';
  scope: 'own' | 'company' | 'all';
}

// ============================================================================
// API ERROR TYPES
// ============================================================================

export type ApiErrorType =
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'NOT_FOUND'
  | 'DUPLICATE_ENTRY'
  | 'RATE_LIMIT'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'UNKNOWN_ERROR';

export interface ApiError {
  type: ApiErrorType;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
  statusCode?: number;
}

export interface ValidationError {
  field: string;
  message: string;
  rule?: string;
}

export interface ApiResponse<T = unknown> {
  status: 'SUCCESS' | 'ERROR';
  message: string;
  data?: T;
  error?: ApiError;
  errors?: ValidationError[];
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
};

export type FormState<T> = {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
};
