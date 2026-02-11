// src/services/billingAPI.ts
// Billing & Invoicing Service - Bill.com Integration v2

import axiosInstance from '../api/axiosInstance';

// ============================================
// Type Definitions
// ============================================

export interface BillingCompany {
  id: number;
  uuid: string;
  name: string;
  billing_enabled: boolean;
  is_test_company: boolean;
  total_projects: number;
  invoiced_projects: number;
  paid_projects: number;
}

export interface BillingProject {
  project_id: number;
  uuid: string;
  created_at: string;
  company_id: number;
  completed_step: number;
  is_draft: boolean;
  company_name: string;
  company_uuid: string;
  billing_enabled: boolean;
  address: string;
  city: string;
  state: string;
  utility: string;
  customer_first_name?: string;
  customer_last_name?: string;
  installer_project_id?: string;
  project_status: string | null;
  billing_status: string | null;
  billing_invoice_id: number | null;
  billed_amount: number | null;
  invoiced_at: string | null;
  billing_paid_at: string | null;
  billcom_invoice_id: string | null;
  invoice_number: string | null;
  total_amount: number | null;
  invoice_status: string | null;
  email_sent_at: string | null;
}

export interface BillingSummary {
  total_projects: number;
  uninvoiced_count: number;
  invoiced_count: number;
  paid_count: number;
  overdue_count: number;
  held_canceled_count: number;
  outstanding_amount: number;
  paid_amount: number;
  total_revenue: number;
  avg_project_value: number;
  projects_this_month: number;
  projects_last_month: number;
  revenue_this_month: number;
  revenue_last_month: number;
  avg_days_to_payment: number;
  oldest_uninvoiced_days: number;
}

export interface BillingInvoice {
  id: number;
  uuid: string;
  billing_customer_id: number;
  company_id: number;
  billcom_invoice_id: string;
  billcom_invoice_number: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  due_amount: number;
  paid_amount: number;
  status: string;
  email_sent_at: string | null;
  paid_at: string | null;
  customer_name: string;
  company_name: string;
  project_count: number;
  lineItems?: BillingLineItem[];
  payments?: BillingPayment[];
}

export interface BillingLineItem {
  id: number;
  billing_invoice_id: number;
  project_id: number;
  project_address: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  project_uuid?: string;
}

export interface BillingPayment {
  id: number;
  billing_invoice_id: number;
  billcom_payment_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  status: string;
}

export interface CreateInvoiceRequest {
  projectIds: number[];
  companyId: string;
  sendEmail?: boolean;
}

// ============================================
// API Functions
// ============================================

const BILLING_BASE = '/api/billing';

/** Health check - tests Bill.com API connectivity */
export const checkBillingHealth = async (): Promise<{ ok: boolean; userId?: string; orgId?: string }> => {
  const { data } = await axiosInstance.get(`${BILLING_BASE}/health`);
  return data;
};

/** List companies with billing stats (excludes test companies) */
export const getBillingCompanies = async (): Promise<BillingCompany[]> => {
  const { data } = await axiosInstance.get(`${BILLING_BASE}/companies`);
  return data.companies || [];
};

/** Toggle billing_enabled for a company */
export const toggleCompanyBilling = async (companyId: number, billingEnabled: boolean): Promise<{ success: boolean }> => {
  const { data } = await axiosInstance.put(`${BILLING_BASE}/companies/${companyId}/toggle`, {
    billing_enabled: billingEnabled,
  });
  return data;
};

/** Get projects with billing status, filtered by company/status/held/canceled */
export const getBillingProjects = async (
  companyUuid?: string,
  status: string = 'all',
  options?: { includeCanceled?: boolean; includeHeld?: boolean }
): Promise<{ projects: BillingProject[]; count: number }> => {
  const params: Record<string, string> = {};
  if (status !== 'all') params.status = status;
  if (companyUuid) params.companyId = companyUuid;
  if (options?.includeCanceled) params.includeCanceled = 'true';
  if (options?.includeHeld) params.includeHeld = 'true';
  const { data } = await axiosInstance.get(`${BILLING_BASE}/projects`, { params });
  return { projects: data.projects || [], count: data.count || 0 };
};

/** Get billing summary/dashboard stats */
export const getBillingSummary = async (companyUuid?: string): Promise<BillingSummary> => {
  const params: Record<string, string> = {};
  if (companyUuid) params.companyId = companyUuid;
  const { data } = await axiosInstance.get(`${BILLING_BASE}/summary`, { params });
  return data;
};

/** Create invoice for selected projects */
export const createInvoice = async (request: CreateInvoiceRequest): Promise<any> => {
  const { data } = await axiosInstance.post(`${BILLING_BASE}/invoices`, request);
  return data;
};

/** Send invoice email via Bill.com */
export const sendInvoiceEmail = async (invoiceId: number): Promise<{ success: boolean }> => {
  const { data } = await axiosInstance.post(`${BILLING_BASE}/invoices/${invoiceId}/send`);
  return data;
};

/** List invoices, optionally filtered by company */
export const getInvoices = async (companyUuid?: string): Promise<BillingInvoice[]> => {
  const params: Record<string, string> = {};
  if (companyUuid) params.companyId = companyUuid;
  const { data } = await axiosInstance.get(`${BILLING_BASE}/invoices`, { params });
  return data.invoices || [];
};

/** Get invoice detail with line items and payments */
export const getInvoiceDetail = async (invoiceId: number): Promise<BillingInvoice> => {
  const { data } = await axiosInstance.get(`${BILLING_BASE}/invoices/${invoiceId}`);
  return data;
};

const billingAPI = {
  checkHealth: checkBillingHealth,
  getCompanies: getBillingCompanies,
  toggleCompanyBilling,
  getProjects: getBillingProjects,
  getSummary: getBillingSummary,
  createInvoice,
  sendInvoiceEmail,
  getInvoices,
  getInvoiceDetail,
};

export default billingAPI;
