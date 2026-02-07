// src/services/billingAPI.ts
// Billing & Invoicing Service - Bill.com Integration

import axiosInstance from '../api/axiosInstance';

// ============================================
// Type Definitions
// ============================================

export interface BillingProject {
  id: number;
  uuid: string;
  installer_project_id: string;
  customer_first_name: string;
  customer_last_name: string;
  company_id: number;
  company_uuid: string;
  company_name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  created_at: string;
  completed_step: number;
  billing_status: 'uninvoiced' | 'invoiced' | 'paid';
  invoice_id?: number;
  invoice_number?: string;
  invoiced_at?: string;
  paid_at?: string;
  amount?: number;
}

export interface BillingSummary {
  uninvoiced: { count: number; amount: number };
  invoiced: { count: number; amount: number };
  paid: { count: number; amount: number };
  total: { count: number; amount: number };
}

export interface BillingInvoice {
  id: number;
  invoice_number: string;
  company_id: number;
  company_name: string;
  billcom_invoice_id: string;
  status: 'draft' | 'sent' | 'viewed' | 'partial' | 'paid' | 'overdue' | 'void';
  subtotal: number;
  total: number;
  due_date: string;
  created_at: string;
  sent_at: string | null;
  paid_at: string | null;
  line_items: BillingLineItem[];
  payments: BillingPayment[];
}

export interface BillingLineItem {
  id: number;
  project_id: number;
  project_uuid: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface BillingPayment {
  id: number;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference_number: string;
}

export interface CreateInvoiceRequest {
  projectIds: number[];
  companyUuid: string;
  sendEmail?: boolean;
  dueDate?: string;
  notes?: string;
}

export interface CreateInvoiceResponse {
  invoice: BillingInvoice;
  billcomInvoiceId: string;
  emailSent: boolean;
}

// ============================================
// API Functions
// ============================================

const BILLING_BASE = '/api/billing';

/**
 * Health check - tests Bill.com API connectivity
 */
export const checkBillingHealth = async (): Promise<{ ok: boolean; userId?: string; orgId?: string }> => {
  const { data } = await axiosInstance.get(`${BILLING_BASE}/health`);
  return data;
};

/**
 * Get projects with billing status
 */
export const getBillingProjects = async (
  companyUuid?: string,
  status: 'uninvoiced' | 'invoiced' | 'paid' | 'all' = 'all'
): Promise<BillingProject[]> => {
  const params: Record<string, string> = { status };
  if (companyUuid) params.companyId = companyUuid;
  const { data } = await axiosInstance.get(`${BILLING_BASE}/projects`, { params });
  return data.projects || data.data || [];
};

/**
 * Get billing summary/dashboard stats
 */
export const getBillingSummary = async (companyUuid?: string): Promise<BillingSummary> => {
  const params: Record<string, string> = {};
  if (companyUuid) params.companyId = companyUuid;
  const { data } = await axiosInstance.get(`${BILLING_BASE}/summary`, { params });
  return data.summary || data;
};

/**
 * Create invoice for selected projects
 */
export const createInvoice = async (request: CreateInvoiceRequest): Promise<CreateInvoiceResponse> => {
  const { data } = await axiosInstance.post(`${BILLING_BASE}/invoices`, request);
  return data;
};

/**
 * Send invoice email
 */
export const sendInvoiceEmail = async (invoiceId: number): Promise<{ success: boolean }> => {
  const { data } = await axiosInstance.post(`${BILLING_BASE}/invoices/${invoiceId}/send`);
  return data;
};

/**
 * List invoices, optionally filtered by company
 */
export const getInvoices = async (companyUuid?: string): Promise<BillingInvoice[]> => {
  const params: Record<string, string> = {};
  if (companyUuid) params.companyId = companyUuid;
  const { data } = await axiosInstance.get(`${BILLING_BASE}/invoices`, { params });
  return data.invoices || data.data || [];
};

/**
 * Get invoice detail with line items and payments
 */
export const getInvoiceDetail = async (invoiceId: number): Promise<BillingInvoice> => {
  const { data } = await axiosInstance.get(`${BILLING_BASE}/invoices/${invoiceId}`);
  return data.invoice || data;
};

// Export all as default object for consistency with other services
const billingAPI = {
  checkHealth: checkBillingHealth,
  getProjects: getBillingProjects,
  getSummary: getBillingSummary,
  createInvoice,
  sendInvoiceEmail,
  getInvoices,
  getInvoiceDetail,
};

export default billingAPI;
