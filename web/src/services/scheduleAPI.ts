/**
 * Schedule API Service
 * Real API implementation for scheduling functionality
 */

import axiosInstance from '../api/axiosInstance';
import apiEndpoints from '../config/apiEndpoints';
import { ApiResponse } from '../api/types';

// ============================================================================
// TYPES
// ============================================================================

export interface ScheduleEvent {
  id: number;
  uuid: string;
  companyId: number;
  projectId: number | null;
  projectUuid: string | null;
  projectName: string | null;
  type: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  allDay: boolean;
  timezone: string;
  recurrence: string;
  recurrenceEnd: string | null;
  parentEventId: number | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  priority: string;
  status: string;
  reminder: string;
  notes: string | null;
  createdBy: number;
  updatedBy: number;
  createdAt: string;
  updatedAt: string;
  attendees: EventAttendee[];
}

export interface EventAttendee {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  status: string;
  notifiedAt: string | null;
}

export interface CreateEventRequest {
  type: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  allDay?: boolean;
  timezone?: string;
  recurrence?: string;
  recurrenceEnd?: string;
  projectUuid?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  priority?: string;
  reminder?: string;
  notes?: string;
  attendeeIds?: number[];
}

export interface UpdateEventRequest extends Partial<CreateEventRequest> {
  status?: string;
}

export interface EventFilters {
  startDate: string;
  endDate: string;
  type?: string;
  status?: string;
  assignedTo?: number;
  projectUuid?: string;
}

export interface EventStats {
  scheduled: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  total: number;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Get events within a date range
 */
export const getEvents = async (filters: EventFilters): Promise<ScheduleEvent[]> => {
  try {
    const params = new URLSearchParams();
    params.append('startDate', filters.startDate);
    params.append('endDate', filters.endDate);
    if (filters.type) params.append('type', filters.type);
    if (filters.status) params.append('status', filters.status);
    if (filters.assignedTo) params.append('assignedTo', filters.assignedTo.toString());
    if (filters.projectUuid) params.append('projectUuid', filters.projectUuid);

    const response = await axiosInstance.get<ApiResponse<ScheduleEvent[]>>(
      `${apiEndpoints.SCHEDULE.EVENTS}?${params.toString()}`
    );

    if (response.data.status === 'SUCCESS' && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to fetch events');
  } catch (error: any) {
    console.error('[scheduleAPI] getEvents error:', error?.response?.data || error?.message);

    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error(error?.message || 'Unable to load events');
  }
};

/**
 * Get upcoming events
 */
export const getUpcomingEvents = async (limit: number = 10): Promise<ScheduleEvent[]> => {
  try {
    const response = await axiosInstance.get<ApiResponse<ScheduleEvent[]>>(
      `${apiEndpoints.SCHEDULE.UPCOMING}?limit=${limit}`
    );

    if (response.data.status === 'SUCCESS' && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to fetch upcoming events');
  } catch (error: any) {
    console.error('[scheduleAPI] getUpcomingEvents error:', error?.response?.data || error?.message);

    if (error?.response?.status === 404) {
      return []; // Endpoint not implemented yet
    }

    throw new Error(error?.message || 'Unable to load upcoming events');
  }
};

/**
 * Get single event by UUID
 */
export const getEventByUuid = async (uuid: string): Promise<ScheduleEvent | null> => {
  try {
    const response = await axiosInstance.get<ApiResponse<ScheduleEvent>>(
      apiEndpoints.SCHEDULE.EVENT(uuid)
    );

    if (response.data.status === 'SUCCESS' && response.data.data) {
      return response.data.data;
    }

    return null;
  } catch (error: any) {
    console.error('[scheduleAPI] getEventByUuid error:', error?.response?.data || error?.message);

    if (error?.response?.status === 404) {
      return null;
    }

    throw new Error(error?.message || 'Unable to load event');
  }
};

/**
 * Create a new event
 */
export const createEvent = async (data: CreateEventRequest): Promise<ScheduleEvent> => {
  try {
    const response = await axiosInstance.post<ApiResponse<ScheduleEvent>>(
      apiEndpoints.SCHEDULE.EVENTS,
      data
    );

    if (response.data.status === 'SUCCESS' && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to create event');
  } catch (error: any) {
    console.error('[scheduleAPI] createEvent error:', error?.response?.data || error?.message);

    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error(error?.message || 'Unable to create event');
  }
};

/**
 * Update an existing event
 */
export const updateEvent = async (uuid: string, data: UpdateEventRequest): Promise<ScheduleEvent> => {
  try {
    const response = await axiosInstance.put<ApiResponse<ScheduleEvent>>(
      apiEndpoints.SCHEDULE.EVENT(uuid),
      data
    );

    if (response.data.status === 'SUCCESS' && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to update event');
  } catch (error: any) {
    console.error('[scheduleAPI] updateEvent error:', error?.response?.data || error?.message);

    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error(error?.message || 'Unable to update event');
  }
};

/**
 * Delete an event
 */
export const deleteEvent = async (uuid: string): Promise<void> => {
  try {
    const response = await axiosInstance.delete<ApiResponse<void>>(
      apiEndpoints.SCHEDULE.EVENT(uuid)
    );

    if (response.data.status !== 'SUCCESS') {
      throw new Error(response.data.message || 'Failed to delete event');
    }
  } catch (error: any) {
    console.error('[scheduleAPI] deleteEvent error:', error?.response?.data || error?.message);

    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error(error?.message || 'Unable to delete event');
  }
};

/**
 * Get events for a specific project
 */
export const getProjectEvents = async (projectUuid: string): Promise<ScheduleEvent[]> => {
  try {
    const response = await axiosInstance.get<ApiResponse<ScheduleEvent[]>>(
      apiEndpoints.SCHEDULE.PROJECT_EVENTS(projectUuid)
    );

    if (response.data.status === 'SUCCESS' && response.data.data) {
      return response.data.data;
    }

    return [];
  } catch (error: any) {
    console.error('[scheduleAPI] getProjectEvents error:', error?.response?.data || error?.message);
    return [];
  }
};

/**
 * Search events by text
 */
export const searchEvents = async (searchTerm: string): Promise<ScheduleEvent[]> => {
  try {
    const response = await axiosInstance.get<ApiResponse<ScheduleEvent[]>>(
      `${apiEndpoints.SCHEDULE.SEARCH}?q=${encodeURIComponent(searchTerm)}`
    );

    if (response.data.status === 'SUCCESS' && response.data.data) {
      return response.data.data;
    }

    return [];
  } catch (error: any) {
    console.error('[scheduleAPI] searchEvents error:', error?.response?.data || error?.message);
    return [];
  }
};

/**
 * Get event statistics
 */
export const getEventStats = async (): Promise<EventStats> => {
  try {
    const response = await axiosInstance.get<ApiResponse<EventStats>>(
      apiEndpoints.SCHEDULE.STATS
    );

    if (response.data.status === 'SUCCESS' && response.data.data) {
      return response.data.data;
    }

    return { scheduled: 0, in_progress: 0, completed: 0, cancelled: 0, total: 0 };
  } catch (error: any) {
    console.error('[scheduleAPI] getEventStats error:', error?.response?.data || error?.message);
    return { scheduled: 0, in_progress: 0, completed: 0, cancelled: 0, total: 0 };
  }
};

/**
 * Add attendees to an event
 */
export const addAttendees = async (eventUuid: string, userIds: number[]): Promise<EventAttendee[]> => {
  try {
    const response = await axiosInstance.post<ApiResponse<EventAttendee[]>>(
      apiEndpoints.SCHEDULE.ATTENDEES(eventUuid),
      { userIds }
    );

    if (response.data.status === 'SUCCESS' && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to add attendees');
  } catch (error: any) {
    console.error('[scheduleAPI] addAttendees error:', error?.response?.data || error?.message);
    throw new Error(error?.message || 'Unable to add attendees');
  }
};

/**
 * Remove attendee from an event
 */
export const removeAttendee = async (eventUuid: string, userId: number): Promise<void> => {
  try {
    const response = await axiosInstance.delete<ApiResponse<void>>(
      apiEndpoints.SCHEDULE.REMOVE_ATTENDEE(eventUuid, userId)
    );

    if (response.data.status !== 'SUCCESS') {
      throw new Error(response.data.message || 'Failed to remove attendee');
    }
  } catch (error: any) {
    console.error('[scheduleAPI] removeAttendee error:', error?.response?.data || error?.message);
    throw new Error(error?.message || 'Unable to remove attendee');
  }
};
