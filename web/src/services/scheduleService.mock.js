/**
 * Schedule Service - Mock Data Service
 * This will be replaced with real API calls later
 */

import { EVENT_TYPES, EVENT_STATUS } from '../constants/scheduleConstants';

// Generate mock events for testing
const generateMockEvents = () => {
  const events = [];
  const today = new Date();

  // Helper to create date with specific time
  const createDateTime = (daysOffset, hour, minute = 0) => {
    const date = new Date(today);
    date.setDate(date.getDate() + daysOffset);
    date.setHours(hour, minute, 0, 0);
    return date.toISOString();
  };

  // Sample events for the next 2 weeks
  const mockEventData = [
    // Today
    {
      type: 'site_survey',
      title: 'Johnson Residence - Initial Survey',
      daysOffset: 0,
      startHour: 9,
      duration: 60,
      projectName: 'Johnson Solar Install',
      location: '1234 Solar Lane, Phoenix, AZ',
      priority: 'high'
    },
    {
      type: 'sales_consultation',
      title: 'Martinez Home - Sales Consultation',
      daysOffset: 0,
      startHour: 14,
      duration: 60,
      projectName: 'Martinez Residential',
      location: '5678 Sun Street, Phoenix, AZ',
      priority: 'medium'
    },
    // Tomorrow
    {
      type: 'design_review',
      title: 'Thompson Project - Design Presentation',
      daysOffset: 1,
      startHour: 10,
      duration: 45,
      projectName: 'Thompson Solar',
      location: 'Virtual Meeting',
      priority: 'high'
    },
    {
      type: 'installation',
      title: 'Davis Residence - Installation Day 1',
      daysOffset: 1,
      startHour: 8,
      duration: 480,
      projectName: 'Davis 10kW System',
      location: '9012 Energy Ave, Phoenix, AZ',
      priority: 'urgent'
    },
    // Day after tomorrow
    {
      type: 'installation',
      title: 'Davis Residence - Installation Day 2',
      daysOffset: 2,
      startHour: 8,
      duration: 480,
      projectName: 'Davis 10kW System',
      location: '9012 Energy Ave, Phoenix, AZ',
      priority: 'urgent'
    },
    {
      type: 'customer_followup',
      title: 'Chen Project - Post-Install Check-In',
      daysOffset: 2,
      startHour: 15,
      duration: 30,
      projectName: 'Chen Residential',
      location: 'Phone Call',
      priority: 'low'
    },
    // In 3 days
    {
      type: 'city_inspection',
      title: 'Rodriguez Home - City Electrical Inspection',
      daysOffset: 3,
      startHour: 11,
      duration: 60,
      projectName: 'Rodriguez Solar',
      location: '3456 Panel Parkway, Phoenix, AZ',
      priority: 'urgent'
    },
    {
      type: 'site_survey',
      title: 'Anderson Property - Site Assessment',
      daysOffset: 3,
      startHour: 9,
      duration: 60,
      projectName: 'Anderson Commercial',
      location: '7890 Business Blvd, Phoenix, AZ',
      priority: 'medium'
    },
    // In 4 days
    {
      type: 'utility_inspection',
      title: 'Rodriguez Home - Utility Interconnection',
      daysOffset: 4,
      startHour: 10,
      duration: 60,
      projectName: 'Rodriguez Solar',
      location: '3456 Panel Parkway, Phoenix, AZ',
      priority: 'high'
    },
    {
      type: 'team_meeting',
      title: 'Weekly Team Standup',
      daysOffset: 4,
      startHour: 16,
      duration: 60,
      projectName: null,
      location: 'Office Conference Room',
      priority: 'medium'
    },
    // In 5 days
    {
      type: 'permit_deadline',
      title: 'Williams Project - Permit Submission Deadline',
      daysOffset: 5,
      startHour: 0,
      duration: 0,
      projectName: 'Williams Residential',
      location: null,
      priority: 'urgent',
      allDay: true
    },
    // Next week
    {
      type: 'installation',
      title: 'Thompson Project - Installation',
      daysOffset: 7,
      startHour: 8,
      duration: 480,
      projectName: 'Thompson Solar',
      location: '2345 Voltage Dr, Phoenix, AZ',
      priority: 'high'
    },
    {
      type: 'service_call',
      title: 'Garcia System - Troubleshooting',
      daysOffset: 8,
      startHour: 13,
      duration: 90,
      projectName: 'Garcia Maintenance',
      location: '8901 Watt Way, Phoenix, AZ',
      priority: 'high'
    },
    {
      type: 'sales_consultation',
      title: 'Patel Residence - Initial Consultation',
      daysOffset: 9,
      startHour: 10,
      duration: 60,
      projectName: 'Patel Prospect',
      location: '4567 Sunbeam St, Phoenix, AZ',
      priority: 'medium'
    },
    {
      type: 'city_inspection',
      title: 'Thompson Project - Final Inspection',
      daysOffset: 10,
      startHour: 14,
      duration: 60,
      projectName: 'Thompson Solar',
      location: '2345 Voltage Dr, Phoenix, AZ',
      priority: 'urgent'
    },
  ];

  // Generate event objects
  mockEventData.forEach((data, index) => {
    const eventType = EVENT_TYPES.find(type => type.id === data.type);
    const startTime = data.allDay ? createDateTime(data.daysOffset, 0, 0) : createDateTime(data.daysOffset, data.startHour);
    const endTime = data.allDay ? createDateTime(data.daysOffset, 23, 59) : createDateTime(data.daysOffset, data.startHour, data.duration || eventType.defaultDuration);

    events.push({
      id: `evt_${index + 1}`,
      type: data.type,
      title: data.title,
      description: '',
      startTime,
      endTime,
      allDay: data.allDay || false,
      timezone: 'America/Phoenix',
      recurrence: 'none',
      recurrenceEnd: null,
      projectId: data.projectName ? `proj_${index}` : null,
      projectName: data.projectName,
      customerId: `cust_${index}`,
      customerName: data.projectName ? data.projectName.split(' ')[0] : null,
      assignedTo: ['user_1'],
      assignedNames: ['John Smith'],
      location: data.location,
      latitude: 33.4484 + (Math.random() - 0.5) * 0.1,
      longitude: -112.0740 + (Math.random() - 0.5) * 0.1,
      priority: data.priority || 'medium',
      status: EVENT_STATUS.SCHEDULED,
      reminder: '30',
      notes: '',
      createdAt: new Date().toISOString(),
      createdBy: 'user_1',
      updatedAt: new Date().toISOString(),
      updatedBy: 'user_1',
    });
  });

  return events;
};

// Store events in memory (will be replaced with database)
let mockEvents = generateMockEvents();

/**
 * Get events within a date range
 */
export const getEvents = async (startDate, endDate) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));

  const start = new Date(startDate);
  const end = new Date(endDate);

  return mockEvents.filter(event => {
    const eventStart = new Date(event.startTime);
    return eventStart >= start && eventStart <= end;
  });
};

/**
 * Get upcoming events (next N events from now)
 */
export const getUpcomingEvents = async (limit = 10) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));

  const now = new Date();

  return mockEvents
    .filter(event => new Date(event.startTime) >= now)
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
    .slice(0, limit);
};

/**
 * Get a single event by ID
 */
export const getEventById = async (eventId) => {
  await new Promise(resolve => setTimeout(resolve, 100));

  return mockEvents.find(event => event.id === eventId) || null;
};

/**
 * Create a new event
 */
export const createEvent = async (eventData) => {
  await new Promise(resolve => setTimeout(resolve, 400));

  const newEvent = {
    id: `evt_${Date.now()}`,
    ...eventData,
    createdAt: new Date().toISOString(),
    createdBy: 'user_1',
    updatedAt: new Date().toISOString(),
    updatedBy: 'user_1',
  };

  mockEvents.push(newEvent);
  return newEvent;
};

/**
 * Update an existing event
 */
export const updateEvent = async (eventId, eventData) => {
  await new Promise(resolve => setTimeout(resolve, 400));

  const index = mockEvents.findIndex(event => event.id === eventId);

  if (index === -1) {
    throw new Error('Event not found');
  }

  mockEvents[index] = {
    ...mockEvents[index],
    ...eventData,
    updatedAt: new Date().toISOString(),
    updatedBy: 'user_1',
  };

  return mockEvents[index];
};

/**
 * Delete an event
 */
export const deleteEvent = async (eventId) => {
  await new Promise(resolve => setTimeout(resolve, 300));

  const index = mockEvents.findIndex(event => event.id === eventId);

  if (index === -1) {
    throw new Error('Event not found');
  }

  mockEvents.splice(index, 1);
  return { success: true };
};

/**
 * Get events for a specific project
 */
export const getProjectEvents = async (projectId) => {
  await new Promise(resolve => setTimeout(resolve, 200));

  return mockEvents.filter(event => event.projectId === projectId);
};

/**
 * Search events by text
 */
export const searchEvents = async (searchTerm) => {
  await new Promise(resolve => setTimeout(resolve, 250));

  const term = searchTerm.toLowerCase();

  return mockEvents.filter(event =>
    event.title.toLowerCase().includes(term) ||
    event.description?.toLowerCase().includes(term) ||
    event.projectName?.toLowerCase().includes(term) ||
    event.location?.toLowerCase().includes(term)
  );
};

/**
 * Get events count by status
 */
export const getEventsCountByStatus = async () => {
  await new Promise(resolve => setTimeout(resolve, 150));

  const counts = {
    scheduled: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
  };

  mockEvents.forEach(event => {
    counts[event.status] = (counts[event.status] || 0) + 1;
  });

  return counts;
};

/**
 * Reset mock data (for testing)
 */
export const resetMockData = () => {
  mockEvents = generateMockEvents();
  return mockEvents;
};
