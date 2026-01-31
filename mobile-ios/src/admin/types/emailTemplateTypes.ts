// Email Template Management Types
// Comprehensive type definitions for the admin email template system

export interface EmailTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: TemplateVariable[];
  metadata: TemplateMetadata;
  analytics: TemplateAnalytics;
  versions: TemplateVersion[];
  status: TemplateStatus;
  permissions: TemplatePermissions;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface TemplateVariable {
  key: string;
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'url';
  required: boolean;
  defaultValue?: string;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    format?: string;
  };
  examples: string[];
}

export interface TemplateMetadata {
  tags: string[];
  purpose: string;
  audience: string;
  frequency: 'immediate' | 'scheduled' | 'triggered' | 'batch';
  importance: 'low' | 'medium' | 'high' | 'critical';
  estimatedSendVolume: number;
  lastReviewDate?: Date;
  nextReviewDate?: Date;
  approvalRequired: boolean;
  approvedBy?: string;
  approvedAt?: Date;
}

export interface TemplateAnalytics {
  totalSent: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  unsubscribeRate: number;
  spamRate: number;
  lastSent?: Date;
  topPerformingVariations?: string[];
  monthlyStats: MonthlyStats[];
  recentActivity: ActivityEvent[];
}

export interface MonthlyStats {
  month: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
}

export interface ActivityEvent {
  id: string;
  type: 'sent' | 'opened' | 'clicked' | 'bounced' | 'complained' | 'unsubscribed';
  timestamp: Date;
  recipient: string;
  metadata?: Record<string, any>;
}

export interface TemplateVersion {
  version: number;
  htmlContent: string;
  textContent: string;
  subject: string;
  changelog: string;
  createdAt: Date;
  createdBy: string;
  isActive: boolean;
  testResults?: TestResult[];
}

export interface TestResult {
  id: string;
  testDate: Date;
  testerEmail: string;
  testerName: string;
  deliveryStatus: 'delivered' | 'bounced' | 'failed';
  renderingIssues: string[];
  feedback: string;
  rating: number; // 1-5
  deviceTested: string;
  emailClient: string;
}

export type TemplateStatus = 'draft' | 'active' | 'disabled' | 'archived' | 'pending_approval';

export type TemplateCategory =
  | 'authentication'
  | 'booking'
  | 'user_management'
  | 'notifications'
  | 'admin_tools'
  | 'marketing'
  | 'transactional'
  | 'system';

export interface TemplatePermissions {
  canView: string[]; // user roles
  canEdit: string[]; // user roles
  canTest: string[]; // user roles
  canDelete: string[]; // user roles
  canApprove: string[]; // user roles
}

// Dashboard and UI Types
export interface TemplateDashboardStats {
  totalTemplates: number;
  activeTemplates: number;
  draftTemplates: number;
  totalEmailsSent: number;
  averageOpenRate: number;
  averageClickRate: number;
  topPerformingTemplates: TemplatePerformance[];
  recentActivity: DashboardActivity[];
  categoryBreakdown: CategoryStats[];
}

export interface TemplatePerformance {
  templateId: string;
  templateName: string;
  category: TemplateCategory;
  sent: number;
  openRate: number;
  clickRate: number;
  trend: 'up' | 'down' | 'stable';
}

export interface DashboardActivity {
  id: string;
  type: 'template_created' | 'template_updated' | 'template_tested' | 'email_sent' | 'template_approved';
  templateId: string;
  templateName: string;
  userName: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface CategoryStats {
  category: TemplateCategory;
  count: number;
  sent: number;
  openRate: number;
  clickRate: number;
}

// Preview and Testing Types
export interface PreviewOptions {
  viewMode: 'desktop' | 'mobile' | 'tablet';
  emailClient: 'gmail' | 'outlook' | 'apple' | 'generic';
  darkMode: boolean;
  showImages: boolean;
  sampleData?: Record<string, any>;
}

export interface TestEmailRequest {
  templateId: string;
  recipients: TestRecipient[];
  sampleData?: Record<string, any>;
  notes?: string;
  sendImmediately: boolean;
  scheduledFor?: Date;
}

export interface TestRecipient {
  email: string;
  name: string;
  role: string;
  personalizedData?: Record<string, any>;
}

export interface BulkTestRequest {
  templateIds: string[];
  recipientGroups: RecipientGroup[];
  sampleData?: Record<string, any>;
  notes?: string;
}

export interface RecipientGroup {
  name: string;
  recipients: TestRecipient[];
}

// Email Logs and History
export interface EmailLog {
  id: string;
  templateId: string;
  templateName: string;
  templateVersion: number;
  recipient: string;
  subject: string;
  sentAt: Date;
  deliveryStatus: 'queued' | 'sent' | 'delivered' | 'bounced' | 'failed' | 'complained';
  openedAt?: Date;
  clickedAt?: Date;
  errorMessage?: string;
  metadata: {
    messageId?: string;
    ipAddress?: string;
    userAgent?: string;
    variables?: Record<string, any>;
    campaignId?: string;
  };
}

export interface LogFilter {
  templateIds?: string[];
  categories?: TemplateCategory[];
  recipients?: string[];
  status?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery?: string;
  limit?: number;
  offset?: number;
}

// Search and Filter Types
export interface TemplateSearch {
  query: string;
  categories: TemplateCategory[];
  status: TemplateStatus[];
  tags: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  sortBy: 'name' | 'updated' | 'created' | 'usage' | 'performance';
  sortOrder: 'asc' | 'desc';
}

export interface SearchResult {
  templates: EmailTemplate[];
  total: number;
  facets: {
    categories: { category: TemplateCategory; count: number }[];
    statuses: { status: TemplateStatus; count: number }[];
    tags: { tag: string; count: number }[];
  };
}

// Import/Export Types
export interface TemplateExport {
  templates: EmailTemplate[];
  exportedAt: Date;
  exportedBy: string;
  version: string;
  metadata: {
    includeAnalytics: boolean;
    includeVersionHistory: boolean;
    includeTestResults: boolean;
  };
}

export interface TemplateImport {
  file: File;
  options: {
    overwriteExisting: boolean;
    preserveIds: boolean;
    importAnalytics: boolean;
    importVersionHistory: boolean;
  };
}

// Validation and Error Types
export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  line?: number;
  column?: number;
}

export interface TemplateValidation {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  suggestions: ValidationError[];
  htmlIssues: {
    brokenLinks: string[];
    missingImages: string[];
    unsupportedTags: string[];
    accessibilityIssues: string[];
  };
  variableIssues: {
    undefinedVariables: string[];
    unusedVariables: string[];
    invalidReferences: string[];
  };
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  };
}

export type TemplateApiResponse<T> = ApiResponse<T>;

// Notification Types
export interface AdminNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  actions?: NotificationAction[];
  autoHide?: boolean;
  duration?: number;
}

export interface NotificationAction {
  label: string;
  action: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

// User and Permission Types
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'superuser' | 'admin' | 'editor' | 'viewer';
  permissions: string[];
  lastActive: Date;
  avatar?: string;
}

// Component Props Types
export interface BaseComponentProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export interface TemplateCardProps extends BaseComponentProps {
  template: EmailTemplate;
  onEdit: (template: EmailTemplate) => void;
  onPreview: (template: EmailTemplate) => void;
  onTest: (template: EmailTemplate) => void;
  onDelete: (template: EmailTemplate) => void;
  onClone: (template: EmailTemplate) => void;
  showAnalytics?: boolean;
  compact?: boolean;
}

export interface PreviewModalProps extends BaseComponentProps {
  template: EmailTemplate;
  isOpen: boolean;
  onClose: () => void;
  options: PreviewOptions;
  onOptionsChange: (options: PreviewOptions) => void;
}

// Constants
export const TEMPLATE_CATEGORIES: Record<TemplateCategory, { name: string; icon: string; color: string }> = {
  authentication: { name: 'Authentication', icon: '🔐', color: '#4F46E5' },
  booking: { name: 'Booking & Demos', icon: '📅', color: '#059669' },
  user_management: { name: 'User Management', icon: '👤', color: '#DC2626' },
  notifications: { name: 'Notifications', icon: '🔔', color: '#D97706' },
  admin_tools: { name: 'Admin Tools', icon: '🛠️', color: '#7C2D12' },
  marketing: { name: 'Marketing', icon: '📢', color: '#7C3AED' },
  transactional: { name: 'Transactional', icon: '💳', color: '#0891B2' },
  system: { name: 'System', icon: '⚙️', color: '#6B7280' },
};

export const TEMPLATE_STATUSES: Record<TemplateStatus, { name: string; color: string; icon: string }> = {
  draft: { name: 'Draft', color: '#6B7280', icon: '📝' },
  active: { name: 'Active', color: '#059669', icon: '✅' },
  disabled: { name: 'Disabled', color: '#DC2626', icon: '🚫' },
  archived: { name: 'Archived', color: '#78716C', icon: '📦' },
  pending_approval: { name: 'Pending Approval', color: '#D97706', icon: '⏳' },
};