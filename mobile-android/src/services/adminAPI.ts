import axiosInstance from "../api/axiosInstance";

/** Type definitions for Admin API */
export interface ApiResponse<T = any> {
  status: "SUCCESS" | "ERROR";
  message: string;
  data?: T;
}

export interface AdminMetrics {
  userStats: {
    totalActive: number;
    pendingApproval: number;
    newRegistrationsToday: number;
    newRegistrationsWeek: number;
    newRegistrationsMonth: number;
  };
  projectStats: {
    totalProjects: number;
    avgProjectsPerDay: number;
    recentActivity: number;
  };
  pipelineMetrics: {
    avgTimeToApproval: string;
    avgTimeInPipeline: string;
    conversionRate: string;
  };
}

export interface PendingUser {
  id: string;
  uuid: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_no: string;
  company_name: string;
  created_at: string;
  status?: number;
}

export interface DemoRequest {
  id: string;
  confirmationNumber: string;
  customerName: string;
  companyName: string;
  email: string;
  phone: string;
  demoDate: string;
  demoTime: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  assignedTo?: string;
}

export interface RegisterUserRequest {
  company: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

export type ExceptionType = 'specific_date' | 'date_range' | 'recurring_weekly' | 'recurring_daily';

export interface DemoException {
  id: number;
  exception_type: ExceptionType;
  specific_date?: string;
  start_date?: string;
  end_date?: string;
  day_of_week?: number;
  start_time?: string;
  end_time?: string;
  reason: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExceptionStats {
  total: number;
  active: number;
  inactive: number;
  byType: {
    specific_date: number;
    date_range: number;
    recurring_weekly: number;
    recurring_daily: number;
  };
}

export interface CreateExceptionRequest {
  exceptionType: ExceptionType;
  specificDate?: string;
  startDate?: string;
  endDate?: string;
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  reason: string;
  isActive?: boolean;
}

/** Admin API service */
export const adminAPI = {
  /** Verify admin access */
  verifyAdminAccess: async (): Promise<ApiResponse<{isAdmin: boolean}>> => {
    console.log('🌐 [API] Making request to /org/verify-access');

    try {
      const response = await axiosInstance.get("/org/verify-access");
      
      console.log('🌐 [API] Response received:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });
      
      if (response.data.status === "SUCCESS") {
        console.log('🌐 [API] Admin verification successful');
        return response.data;
      } else {
        console.log('🌐 [API] Admin verification failed - non-success status');
        throw new Error(response.data.message || "Access denied");
      }
    } catch (error: any) {
      console.log('🌐 [API] Request failed:', {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        message: error?.message,
        data: error?.response?.data,
        config: {
          url: error?.config?.url,
          method: error?.config?.method,
          headers: error?.config?.headers?.Authorization ? 'Bearer [PRESENT]' : 'No Authorization'
        }
      });
      
      console.error("[adminAPI] verifyAdminAccess error:", error?.response?.data || error?.message || error);
      
      if (error?.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw new Error(error?.message || "Unable to verify admin access.");
    }
  },

  /** Get dashboard metrics */
  getMetrics: async (): Promise<ApiResponse<AdminMetrics>> => {
    try {
      const response = await axiosInstance.get("/org/metrics");
      
      if (response.data.status === "SUCCESS") {
        return response.data;
      } else {
        throw new Error(response.data.message || "Failed to load metrics");
      }
    } catch (error: any) {
      console.error("[adminAPI] getMetrics error:", error?.response?.data || error?.message || error);
      
      if (error?.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw new Error(error?.message || "Unable to load metrics.");
    }
  },

  /** Get pending users (status = 1) */
  getPendingUsers: async (): Promise<ApiResponse<PendingUser[]>> => {
    try {
      const response = await axiosInstance.get("/org/pending-users");
      
      if (response.data.status === "SUCCESS") {
        return response.data;
      } else {
        throw new Error(response.data.message || "Failed to load pending users");
      }
    } catch (error: any) {
      console.error("[adminAPI] getPendingUsers error:", error?.response?.data || error?.message || error);
      
      if (error?.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw new Error(error?.message || "Unable to load pending users.");
    }
  },

  /** Approve user (set status to 2) */
  approveUser: async (userId: string): Promise<ApiResponse> => {
    try {
      const response = await axiosInstance.put(`/org/approve-user/${userId}`);
      
      if (response.data.status === "SUCCESS") {
        return response.data;
      } else {
        throw new Error(response.data.message || "Failed to approve user");
      }
    } catch (error: any) {
      console.error("[adminAPI] approveUser error:", error?.response?.data || error?.message || error);
      
      if (error?.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw new Error(error?.message || "Unable to approve user.");
    }
  },

  /** Reject user (set status to 0) */
  rejectUser: async (userId: string): Promise<ApiResponse> => {
    try {
      const response = await axiosInstance.put(`/org/reject-user/${userId}`);
      
      if (response.data.status === "SUCCESS") {
        return response.data;
      } else {
        throw new Error(response.data.message || "Failed to reject user");
      }
    } catch (error: any) {
      console.error("[adminAPI] rejectUser error:", error?.response?.data || error?.message || error);
      
      if (error?.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw new Error(error?.message || "Unable to reject user.");
    }
  },

  /** Get demo requests */
  getDemoRequests: async (): Promise<ApiResponse<DemoRequest[]>> => {
    try {
      const response = await axiosInstance.get("/org/demo-requests");
      
      if (response.data.status === "SUCCESS") {
        return response.data;
      } else {
        throw new Error(response.data.message || "Failed to load demo requests");
      }
    } catch (error: any) {
      console.error("[adminAPI] getDemoRequests error:", error?.response?.data || error?.message || error);
      
      if (error?.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw new Error(error?.message || "Unable to load demo requests.");
    }
  },

  /** Update demo status */
  updateDemoStatus: async (
    demoId: string,
    status: DemoRequest['status']
  ): Promise<ApiResponse> => {
    try {
      const response = await axiosInstance.put(`/org/demo-requests/${demoId}/status`, {
        status
      });
      
      if (response.data.status === "SUCCESS") {
        return response.data;
      } else {
        throw new Error(response.data.message || "Failed to update demo status");
      }
    } catch (error: any) {
      console.error("[adminAPI] updateDemoStatus error:", error?.response?.data || error?.message || error);
      
      if (error?.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw new Error(error?.message || "Unable to update demo status.");
    }
  },

  /** Register new user */
  registerUser: async (userData: RegisterUserRequest): Promise<ApiResponse> => {
    try {
      const response = await axiosInstance.post("/org/register-user", userData);

      if (response.data.status === "SUCCESS") {
        return response.data;
      } else {
        throw new Error(response.data.message || "Failed to register user");
      }
    } catch (error: any) {
      console.error("[adminAPI] registerUser error:", error?.response?.data || error?.message || error);

      if (error?.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      throw new Error(error?.message || "Unable to register user.");
    }
  },

  /** Get all demo exceptions */
  getDemoExceptions: async (): Promise<ApiResponse<DemoException[]>> => {
    try {
      const response = await axiosInstance.get("/org/demo-exceptions");

      if (response.data.status === "SUCCESS") {
        return response.data;
      } else {
        throw new Error(response.data.message || "Failed to load demo exceptions");
      }
    } catch (error: any) {
      console.error("[adminAPI] getDemoExceptions error:", error?.response?.data || error?.message || error);

      if (error?.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      throw new Error(error?.message || "Unable to load demo exceptions.");
    }
  },

  /** Get demo exception statistics */
  getDemoExceptionStats: async (): Promise<ApiResponse<ExceptionStats>> => {
    try {
      const response = await axiosInstance.get("/org/demo-exceptions/stats");

      if (response.data.status === "SUCCESS") {
        return response.data;
      } else {
        throw new Error(response.data.message || "Failed to load exception stats");
      }
    } catch (error: any) {
      console.error("[adminAPI] getDemoExceptionStats error:", error?.response?.data || error?.message || error);

      if (error?.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      throw new Error(error?.message || "Unable to load exception statistics.");
    }
  },

  /** Create new demo exception */
  createDemoException: async (data: CreateExceptionRequest): Promise<ApiResponse<DemoException>> => {
    try {
      const response = await axiosInstance.post("/org/demo-exceptions", data);

      if (response.data.status === "SUCCESS") {
        return response.data;
      } else {
        throw new Error(response.data.message || "Failed to create exception");
      }
    } catch (error: any) {
      console.error("[adminAPI] createDemoException error:", error?.response?.data || error?.message || error);

      if (error?.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      throw new Error(error?.message || "Unable to create exception.");
    }
  },

  /** Update demo exception */
  updateDemoException: async (
    exceptionId: number,
    data: CreateExceptionRequest
  ): Promise<ApiResponse<DemoException>> => {
    try {
      const response = await axiosInstance.put(`/org/demo-exceptions/${exceptionId}`, data);

      if (response.data.status === "SUCCESS") {
        return response.data;
      } else {
        throw new Error(response.data.message || "Failed to update exception");
      }
    } catch (error: any) {
      console.error("[adminAPI] updateDemoException error:", error?.response?.data || error?.message || error);

      if (error?.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      throw new Error(error?.message || "Unable to update exception.");
    }
  },

  /** Toggle demo exception active status */
  toggleDemoException: async (exceptionId: number): Promise<ApiResponse> => {
    try {
      const response = await axiosInstance.patch(`/org/demo-exceptions/${exceptionId}/toggle`);

      if (response.data.status === "SUCCESS") {
        return response.data;
      } else {
        throw new Error(response.data.message || "Failed to toggle exception");
      }
    } catch (error: any) {
      console.error("[adminAPI] toggleDemoException error:", error?.response?.data || error?.message || error);

      if (error?.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      throw new Error(error?.message || "Unable to toggle exception.");
    }
  },

  /** Delete demo exception (soft delete) */
  deleteDemoException: async (exceptionId: number): Promise<ApiResponse> => {
    try {
      const response = await axiosInstance.delete(`/org/demo-exceptions/${exceptionId}`);

      if (response.data.status === "SUCCESS") {
        return response.data;
      } else {
        throw new Error(response.data.message || "Failed to delete exception");
      }
    } catch (error: any) {
      console.error("[adminAPI] deleteDemoException error:", error?.response?.data || error?.message || error);

      if (error?.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      throw new Error(error?.message || "Unable to delete exception.");
    }
  },
};