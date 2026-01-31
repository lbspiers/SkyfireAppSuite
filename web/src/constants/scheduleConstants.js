/**
 * Scheduling Module Constants
 * Defines event types, recurrence options, and other scheduling-related constants
 */

export const EVENT_TYPES = [
  {
    id: 'demo',
    label: 'Demo Call',
    icon: null,
    color: 'var(--color-accent-orange)',
    defaultDuration: 30
  },
  {
    id: 'site_survey',
    label: 'Site Survey',
    icon: null,
    color: 'var(--color-accent-blue)',
    defaultDuration: 60 // minutes
  },
  {
    id: 'design_review',
    label: 'Design Review',
    icon: null,
    color: 'var(--color-accent-purple)',
    defaultDuration: 45
  },
  {
    id: 'installation',
    label: 'Installation',
    icon: null,
    color: 'var(--color-success)',
    defaultDuration: 480 // 8 hours
  },
  {
    id: 'city_inspection',
    label: 'City Inspection',
    icon: null,
    color: 'var(--color-warning)',
    defaultDuration: 60
  },
  {
    id: 'utility_inspection',
    label: 'Utility Inspection',
    icon: null,
    color: 'var(--color-warning)',
    defaultDuration: 60
  },
  {
    id: 'permit_deadline',
    label: 'Permit Deadline',
    icon: null,
    color: 'var(--color-error)',
    defaultDuration: 0 // all day
  },
  {
    id: 'customer_followup',
    label: 'Customer Follow-up',
    icon: null,
    color: 'var(--color-accent-indigo)',
    defaultDuration: 30
  },
  {
    id: 'service_call',
    label: 'Service Call',
    icon: null,
    color: 'var(--color-accent-pink)',
    defaultDuration: 90
  },
  {
    id: 'sales_consultation',
    label: 'Sales Consultation',
    icon: null,
    color: 'var(--color-accent-cyan)',
    defaultDuration: 60
  },
  {
    id: 'team_meeting',
    label: 'Team Meeting',
    icon: null,
    color: 'var(--gray-500)',
    defaultDuration: 60
  },
  {
    id: 'other',
    label: 'Other',
    icon: null,
    color: 'var(--text-disabled)',
    defaultDuration: 60
  },
];

export const RECURRENCE_OPTIONS = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'custom', label: 'Custom...' },
];

export const REMINDER_OPTIONS = [
  { value: 'none', label: 'No reminder' },
  { value: '15', label: '15 minutes before' },
  { value: '30', label: '30 minutes before' },
  { value: '60', label: '1 hour before' },
  { value: '1440', label: '1 day before' },
];

export const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: 'var(--text-disabled)' },
  { value: 'medium', label: 'Medium', color: 'var(--color-accent-blue)' },
  { value: 'high', label: 'High', color: 'var(--color-warning)' },
  { value: 'urgent', label: 'Urgent', color: 'var(--color-error)' },
];

export const VIEW_TYPES = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
  LIST: 'list',
};

export const EVENT_STATUS = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// Working hours configuration
export const WORKING_HOURS = {
  START: 8, // 8 AM
  END: 18,  // 6 PM
  INTERVAL: 30, // 30 minute intervals
};

// Helper function to get event type by ID
export const getEventType = (typeId) => {
  return EVENT_TYPES.find(type => type.id === typeId) || EVENT_TYPES[EVENT_TYPES.length - 1];
};

// Helper function to get priority by value
export const getPriority = (priorityValue) => {
  return PRIORITY_OPTIONS.find(p => p.value === priorityValue) || PRIORITY_OPTIONS[1];
};
