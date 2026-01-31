// Generation process constants for plan automation

export const PROCESS_NAMES = {
  PLAN_SET_FULL: 'GenerateProjects_Mobile',  // Full plan set (ReviewPage style from mobile)
  PLAN_SET_SIMPLE: 'generate_plan_set',       // Simple plan set (GeneratePage style from mobile)
  SURVEY_REPORT: 'generate_survey_report',    // Site survey report only
  NEW_PROJECT: 'NewProject',                   // New project creation automation
  AHJ_LOOKUP: 'AHJLookup',                     // AHJ lookup automation
};

export const GENERATION_STATUS = {
  IDLE: 'idle',
  SENDING: 'sending',
  SUCCESS: 'success',
  ERROR: 'error',
};

export const DOCUMENT_TYPES = {
  PLAN_SET: 'plan_set',
  SURVEY_REPORT: 'survey_report',
  BOTH: 'both',
};

export const DOCUMENT_TYPE_LABELS = {
  [DOCUMENT_TYPES.PLAN_SET]: 'Plan Set',
  [DOCUMENT_TYPES.SURVEY_REPORT]: 'Survey Report',
  [DOCUMENT_TYPES.BOTH]: 'Plan Set and Survey Report',
};
