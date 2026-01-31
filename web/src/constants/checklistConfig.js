/**
 * Checklist configuration for solar project workflow
 * Defines the hierarchical structure of checklist items
 */

export const CHECKLIST_CONFIG = [
  {
    id: 'sales',
    label: 'Sales',
    icon: 'DollarSign',
    items: [
      { id: 'proposal', label: 'Proposal' },
      { id: 'signatures', label: 'Signatures' },
      { id: 'sales_survey', label: 'Sales Survey' },
      { id: 'welcome_call', label: 'Welcome Call' },
    ]
  },
  {
    id: 'site_survey',
    label: 'Site Survey',
    icon: 'Compass',
    items: [
      { id: 'survey_scheduled', label: 'Scheduled' },
      { id: 'survey_complete', label: 'Survey' },
      { id: 'survey_report', label: 'Survey Report' },
    ]
  },
  {
    id: 'design',
    label: 'Design',
    icon: 'PenTool',
    items: [
      {
        id: 'site_plan',
        label: 'Site Plan',
        subStatuses: ['pending', 'in_progress', 'complete']
      },
      {
        id: 'site_plan_qc',
        label: 'Site Plan QC',
        subStatuses: ['pending', 'in_progress', 'complete']
      },
      { id: 'plan_set', label: 'Plan Set' },
      { id: 'plan_set_qc', label: 'Plan Set QC' },
      { id: 'revision', label: 'Revision' },
      { id: 'revision_complete', label: 'Revision Complete' },
    ]
  },
  {
    id: 'permitting',
    label: 'Permitting',
    icon: 'FileText',
    items: [
      {
        id: 'building_permit',
        label: 'Building Permit Application',
        subStatuses: ['submitted', 'revisions', 'received']
      },
      {
        id: 'interconnection',
        label: 'Interconnection Application',
        subStatuses: ['submitted', 'revisions', 'received']
      },
    ]
  },
  {
    id: 'installation',
    label: 'Installation',
    icon: 'Wrench',
    items: [
      {
        id: 'install',
        label: 'Install',
        subStatuses: ['scheduled', 'in_progress', 'complete']
      },
      {
        id: 'commissioning',
        label: 'Commissioning',
        subStatuses: ['scheduled', 'in_progress', 'complete']
      },
      {
        id: 'inspection',
        label: 'Inspection',
        subStatuses: ['scheduled', 'in_progress', 'complete']
      },
      {
        id: 'pto',
        label: 'PTO',
        subStatuses: ['pending', 'received']
      },
    ]
  },
];

// Status options for toggle buttons
export const STATUS_OPTIONS = {
  pending: { label: 'Pending', color: 'var(--status-pending)', icon: 'Clock' },
  complete: { label: 'Complete', color: 'var(--color-success)', icon: 'CheckCircle' },
  revision: { label: 'Revision', color: 'var(--color-warning)', icon: 'AlertCircle' },
};

// Sub-status labels for items with custom statuses
export const SUB_STATUS_LABELS = {
  pending: 'Pending',
  in_progress: 'In Progress',
  complete: 'Complete',
  scheduled: 'Scheduled',
  submitted: 'Submitted',
  revisions: 'Revisions',
  received: 'Received',
};
