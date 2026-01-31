import axiosInstance from '../api/axiosInstance';

export interface TicketOption {
  label: string;
  value: string;
}

export interface CreateTicketRequest {
  subject: string;
  description: string;
  category: string;
  priority?: string;
  current_screen?: string;
  app_version?: string;
  user_id: number;
  company_id: number;
  user_info: {
    firstName: string;
    lastName: string;
    email: string;
    companyName: string;
  };
  screenshots?: string[];
  logs?: string;
  deviceInfo?: any;
  additionalData?: any;
}

export interface CreateTicketResponse {
  success: boolean;
  message: string;
  data?: {
    ticketNumber: string;
    ticketId: string;
    status: string;
    priority: string;
    category: string;
    subject: string;
    createdAt: string;
  };
  error?: string;
}

export interface TicketOptionsResponse {
  success: boolean;
  data?: {
    categories: TicketOption[];
    priorities: TicketOption[];
    statuses: TicketOption[];
  };
  message?: string;
  error?: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  currentScreen?: string;
  appVersion?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
  assignedTo?: {
    name: string;
    email: string;
  };
}

export interface UserTicketsResponse {
  success: boolean;
  tickets?: SupportTicket[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages?: number;
  };
  message?: string;
  error?: string;
}

export interface TicketDetailsResponse {
  success: boolean;
  data?: SupportTicket & {
    deviceInfo?: any;
    screenshots?: string[];
    logs?: string;
    additionalData?: any;
    resolutionNotes?: string;
    user: {
      name: string;
      email: string;
    };
    company: {
      name: string;
    };
  };
  message?: string;
  error?: string;
}

export const supportTicketAPI = {
  /**
   * Create a new support ticket
   */
  createTicket: async (ticketData: CreateTicketRequest): Promise<CreateTicketResponse> => {
    try {
      console.log('🎫 [SUPPORT_API] Creating support ticket:', {
        subject: ticketData.subject,
        category: ticketData.category,
        priority: ticketData.priority,
      });

      const response = await axiosInstance.post('/api/support/tickets', ticketData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('✅ [SUPPORT_API] Ticket created successfully:', {
        status: response.status,
        ticketNumber: response.data.data?.ticketNumber,
      });

      return response.data;
    } catch (error: any) {
      console.error('[supportTicketAPI] createTicket error:', error?.response?.data || error?.message || error);

      return {
        success: false,
        message: error?.response?.data?.message || error?.message || 'Failed to create support ticket',
        error: error?.response?.data?.error || 'TICKET_CREATION_FAILED',
      };
    }
  },

  /**
   * Get current user's support tickets
   */
  getUserTickets: async (page: number = 1, limit: number = 10): Promise<UserTicketsResponse> => {
    try {
      console.log('📋 [SUPPORT_API] Fetching user tickets:', { page, limit });

      const response = await axiosInstance.get('/api/support/tickets/my', {
        params: { page, limit },
      });

      console.log('✅ [SUPPORT_API] User tickets fetched successfully:', {
        status: response.status,
        totalTickets: response.data.data?.pagination?.total || 0,
      });

      return response.data;
    } catch (error: any) {
      console.error('[supportTicketAPI] getUserTickets error:', error?.response?.data || error?.message || error);

      return {
        success: false,
        message: error?.response?.data?.message || error?.message || 'Failed to fetch support tickets',
        error: error?.response?.data?.error || 'TICKETS_FETCH_FAILED',
      };
    }
  },

  /**
   * Get a specific support ticket by ticket number
   */
  getTicketDetails: async (ticketNumber: string): Promise<TicketDetailsResponse> => {
    try {
      console.log('🔍 [SUPPORT_API] Fetching ticket details:', { ticketNumber });

      const response = await axiosInstance.get(`/api/support/tickets/${ticketNumber}`);

      console.log('✅ [SUPPORT_API] Ticket details fetched successfully:', {
        status: response.status,
        ticketNumber: response.data.data?.ticketNumber,
      });

      return response.data;
    } catch (error: any) {
      console.error('[supportTicketAPI] getTicketDetails error:', error?.response?.data || error?.message || error);

      return {
        success: false,
        message: error?.response?.data?.message || error?.message || 'Failed to fetch ticket details',
        error: error?.response?.data?.error || 'TICKET_DETAILS_FAILED',
      };
    }
  },

  /**
   * Get available ticket options (categories, priorities, statuses)
   * Returns hardcoded options since backend doesn't have /options endpoint
   */
  getTicketOptions: async (): Promise<TicketOptionsResponse> => {
    console.log('⚙️ [SUPPORT_API] Using hardcoded ticket options (backend endpoint not available)');

    return {
      success: true,
      data: {
        categories: [
          { label: 'Bug Report', value: 'bug' },
          { label: 'Feature Request', value: 'feature_request' },
          { label: 'General Support', value: 'general_support' },
          { label: 'Account Issue', value: 'account_issue' },
        ],
        priorities: [
          { label: 'Low', value: 'low' },
          { label: 'Medium', value: 'medium' },
          { label: 'High', value: 'high' },
          { label: 'Urgent', value: 'urgent' },
        ],
        statuses: [
          { label: 'Open', value: 'open' },
          { label: 'In Progress', value: 'in_progress' },
          { label: 'Waiting Response', value: 'waiting_response' },
          { label: 'Resolved', value: 'resolved' },
          { label: 'Closed', value: 'closed' },
        ],
      },
    };
  },

  /**
   * Search tickets by text
   */
  searchTickets: async (searchTerm: string, page: number = 1, limit: number = 10): Promise<UserTicketsResponse> => {
    try {
      console.log('🔍 [SUPPORT_API] Searching tickets:', { searchTerm, page, limit });

      const response = await axiosInstance.get('/api/support/tickets/my', {
        params: { search: searchTerm, page, limit },
      });

      console.log('✅ [SUPPORT_API] Ticket search completed:', {
        status: response.status,
        resultsCount: response.data.data?.pagination?.total || 0,
      });

      return response.data;
    } catch (error: any) {
      console.error('[supportTicketAPI] searchTickets error:', error?.response?.data || error?.message || error);

      return {
        success: false,
        message: error?.response?.data?.message || error?.message || 'Failed to search support tickets',
        error: error?.response?.data?.error || 'TICKET_SEARCH_FAILED',
      };
    }
  },

  /**
   * Get ticket status display text
   */
  getStatusDisplayText: (status: string): string => {
    const statusMap: Record<string, string> = {
      'open': 'Open',
      'in_progress': 'In Progress',
      'waiting_response': 'Waiting for Response',
      'resolved': 'Resolved',
      'closed': 'Closed',
    };

    return statusMap[status] || status;
  },

  /**
   * Get priority color for UI
   */
  getPriorityColor: (priority: string): string => {
    const colorMap: Record<string, string> = {
      'low': '#28A745',
      'medium': '#FFC107',
      'high': '#FD7332',
      'urgent': '#DC3545',
    };

    return colorMap[priority.toLowerCase()] || '#FFC107';
  },

  /**
   * Get priority display text
   */
  getPriorityDisplayText: (priority: string): string => {
    const priorityMap: Record<string, string> = {
      'low': 'Low',
      'medium': 'Medium',
      'high': 'High',
      'urgent': 'Urgent',
    };

    return priorityMap[priority.toLowerCase()] || priority;
  },

  /**
   * Get category display text
   */
  getCategoryDisplayText: (category: string): string => {
    const categoryMap: Record<string, string> = {
      'bug': 'Bug Report',
      'feature_request': 'Feature Request',
      'general_support': 'General Support',
      'account_issue': 'Account Issue',
    };

    return categoryMap[category] || category;
  },

  /**
   * Format error message for display
   */
  formatErrorMessage: (error: any): string => {
    if (typeof error === 'string') return error;

    if (error?.response?.data?.message) {
      return error.response.data.message;
    }

    if (error?.message) {
      return error.message;
    }

    return 'An unexpected error occurred. Please try again.';
  },

  /**
   * Check if user can create tickets (rate limiting)
   */
  canCreateTicket: (): boolean => {
    // Simple client-side rate limiting check
    // In a real app, this would be more sophisticated
    const lastTicketTime = localStorage?.getItem('lastSupportTicketTime');
    if (lastTicketTime) {
      const timeSinceLastTicket = Date.now() - parseInt(lastTicketTime);
      const cooldownPeriod = 5 * 60 * 1000; // 5 minutes

      return timeSinceLastTicket > cooldownPeriod;
    }
    return true;
  },

  /**
   * Update last ticket creation time
   */
  updateLastTicketTime: (): void => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('lastSupportTicketTime', Date.now().toString());
    }
  },
};