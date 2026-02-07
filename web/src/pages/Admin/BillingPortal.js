// src/pages/Admin/BillingPortal.js
// Billing & Invoicing Admin Portal - Bill.com Integration
// Admin-only page for managing project invoicing, viewing billing status, generating invoices

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DollarSign, FileText, Send, Search, Check, Clock, AlertCircle,
  ChevronDown, ChevronUp, RefreshCw, Download, Eye, X, Zap, Receipt
} from 'lucide-react';
import { toast } from 'react-toastify';
import billingAPI from '../../services/billingAPI';
import { PROJECT_PRICING, formatPrice } from '../../constants/pricing';
import styles from './BillingPortal.module.css';

// ============================================
// Helper Functions
// ============================================

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount || 0);
};

const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'uninvoiced': return styles.badgeUninvoiced;
    case 'invoiced': case 'sent': case 'viewed': return styles.badgeInvoiced;
    case 'paid': return styles.badgePaid;
    case 'draft': return styles.badgeDraft;
    case 'overdue': return styles.badgeOverdue;
    default: return styles.badgeDraft;
  }
};

const getDotClass = (status) => {
  switch (status) {
    case 'uninvoiced': return styles.dotUninvoiced;
    case 'invoiced': case 'sent': return styles.dotInvoiced;
    case 'paid': return styles.dotPaid;
    default: return '';
  }
};

// Default per-project price
const DEFAULT_PRICE = PROJECT_PRICING.SINGLE.pricePerProject; // $150

// ============================================
// Main Component
// ============================================

const BillingPortal = () => {
  // --- State ---
  const [activeTab, setActiveTab] = useState('projects'); // 'projects' | 'invoices'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'uninvoiced' | 'invoiced' | 'paid'
  const [companyFilter, setCompanyFilter] = useState(''); // company UUID
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [sortField, setSortField] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');

  // Data state
  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [healthStatus, setHealthStatus] = useState('checking'); // 'connected' | 'disconnected' | 'checking'

  // Modal state
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceCreating, setInvoiceCreating] = useState(false);
  const [sendEmailOnCreate, setSendEmailOnCreate] = useState(true);

  // --- Data Fetching ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [projectsRes, summaryRes] = await Promise.all([
        billingAPI.getProjects(companyFilter || undefined, 'all'),
        billingAPI.getSummary(companyFilter || undefined),
      ]);

      setProjects(projectsRes);
      setSummary(summaryRes);

      // Extract unique companies
      const companyMap = new Map();
      projectsRes.forEach(p => {
        if (p.company_uuid && !companyMap.has(p.company_uuid)) {
          companyMap.set(p.company_uuid, { uuid: p.company_uuid, name: p.company_name });
        }
      });
      setCompanies(Array.from(companyMap.values()).sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      console.error('[Billing] Failed to fetch data:', err);
      toast.error('Failed to load billing data');
    } finally {
      setLoading(false);
    }
  }, [companyFilter]);

  const fetchInvoices = useCallback(async () => {
    try {
      const res = await billingAPI.getInvoices(companyFilter || undefined);
      setInvoices(res);
    } catch (err) {
      console.error('[Billing] Failed to fetch invoices:', err);
    }
  }, [companyFilter]);

  const checkHealth = useCallback(async () => {
    setHealthStatus('checking');
    try {
      const res = await billingAPI.checkHealth();
      setHealthStatus(res.ok ? 'connected' : 'disconnected');
    } catch {
      setHealthStatus('disconnected');
    }
  }, []);

  useEffect(() => {
    fetchData();
    checkHealth();
  }, [fetchData, checkHealth]);

  useEffect(() => {
    if (activeTab === 'invoices') {
      fetchInvoices();
    }
  }, [activeTab, fetchInvoices]);

  // --- Filtering & Sorting ---
  const filteredProjects = useMemo(() => {
    let list = [...projects];

    // Status filter
    if (statusFilter !== 'all') {
      list = list.filter(p => p.billing_status === statusFilter);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p =>
        (p.customer_first_name || '').toLowerCase().includes(q) ||
        (p.customer_last_name || '').toLowerCase().includes(q) ||
        (p.installer_project_id || '').toLowerCase().includes(q) ||
        (p.company_name || '').toLowerCase().includes(q) ||
        (p.address || '').toLowerCase().includes(q) ||
        (p.city || '').toLowerCase().includes(q)
      );
    }

    // Sort
    list.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [projects, statusFilter, searchQuery, sortField, sortDir]);

  // --- Selection ---
  const uninvoicedProjects = useMemo(
    () => filteredProjects.filter(p => p.billing_status === 'uninvoiced'),
    [filteredProjects]
  );

  const selectedProjects = useMemo(
    () => projects.filter(p => selectedIds.has(p.id)),
    [projects, selectedIds]
  );

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === uninvoicedProjects.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(uninvoicedProjects.map(p => p.id)));
    }
  };

  // --- Invoice Creation ---
  const handleCreateInvoice = async () => {
    if (selectedProjects.length === 0) return;

    // Group by company
    const byCompany = new Map();
    selectedProjects.forEach(p => {
      const key = p.company_uuid;
      if (!byCompany.has(key)) byCompany.set(key, []);
      byCompany.get(key).push(p);
    });

    setInvoiceCreating(true);
    let successCount = 0;
    let errorCount = 0;

    for (const [companyUuid, companyProjects] of byCompany) {
      try {
        await billingAPI.createInvoice({
          projectIds: companyProjects.map(p => p.id),
          companyUuid,
          sendEmail: sendEmailOnCreate,
        });
        successCount++;
      } catch (err) {
        console.error(`[Billing] Invoice creation failed for ${companyUuid}:`, err);
        errorCount++;
      }
    }

    setInvoiceCreating(false);
    setShowInvoiceModal(false);
    setSelectedIds(new Set());

    if (successCount > 0) {
      toast.success(`${successCount} invoice(s) created successfully${sendEmailOnCreate ? ' and sent' : ''}`);
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} invoice(s) failed to create`);
    }

    fetchData();
  };

  // --- Send Invoice Email ---
  const handleSendEmail = async (invoiceId) => {
    try {
      await billingAPI.sendInvoiceEmail(invoiceId);
      toast.success('Invoice email sent');
      fetchInvoices();
    } catch (err) {
      toast.error('Failed to send email');
    }
  };

  // --- Sort handler ---
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  // --- Invoice preview data ---
  const invoicePreview = useMemo(() => {
    const byCompany = new Map();
    selectedProjects.forEach(p => {
      const key = p.company_name || 'Unknown';
      if (!byCompany.has(key)) byCompany.set(key, []);
      byCompany.get(key).push(p);
    });
    const groups = [];
    for (const [name, projs] of byCompany) {
      groups.push({ company: name, projects: projs, total: projs.length * DEFAULT_PRICE });
    }
    return { groups, total: selectedProjects.length * DEFAULT_PRICE };
  }, [selectedProjects]);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>
            <Receipt className={styles.titleIcon} size={24} />
            Billing & Invoicing
          </h1>
          <p className={styles.subtitle}>
            Manage project invoices, track payments, and generate bills via Bill.com
          </p>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.healthLabel}>
            <span className={`${styles.healthDot} ${
              healthStatus === 'connected' ? styles.healthConnected :
              healthStatus === 'disconnected' ? styles.healthDisconnected :
              styles.healthChecking
            }`} />
            Bill.com {healthStatus === 'connected' ? 'Connected' : healthStatus === 'checking' ? 'Checking...' : 'Disconnected'}
          </span>

          <div className={styles.companyFilter}>
            <select
              className={styles.companySelect}
              value={companyFilter}
              onChange={e => { setCompanyFilter(e.target.value); setSelectedIds(new Set()); }}
            >
              <option value="">All Companies</option>
              {companies.map(c => (
                <option key={c.uuid} value={c.uuid}>{c.name}</option>
              ))}
            </select>
          </div>

          <button className={styles.btnSecondary} onClick={() => { fetchData(); if (activeTab === 'invoices') fetchInvoices(); }}>
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      {summary && (
        <div className={styles.statsRow}>
          <div
            className={`${styles.statCard} ${statusFilter === 'all' ? styles.statCardActive : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            <span className={styles.statLabel}>Total Projects</span>
            <span className={styles.statValue}>{summary.total?.count || 0}</span>
            <span className={styles.statAmount}>{formatCurrency(summary.total?.amount || 0)}</span>
          </div>
          <div
            className={`${styles.statCard} ${styles.statUninvoiced} ${statusFilter === 'uninvoiced' ? styles.statCardActive : ''}`}
            onClick={() => setStatusFilter('uninvoiced')}
          >
            <span className={styles.statLabel}>Uninvoiced</span>
            <span className={styles.statValue}>{summary.uninvoiced?.count || 0}</span>
            <span className={styles.statAmount}>{formatCurrency(summary.uninvoiced?.amount || 0)}</span>
          </div>
          <div
            className={`${styles.statCard} ${styles.statInvoiced} ${statusFilter === 'invoiced' ? styles.statCardActive : ''}`}
            onClick={() => setStatusFilter('invoiced')}
          >
            <span className={styles.statLabel}>Invoiced</span>
            <span className={styles.statValue}>{summary.invoiced?.count || 0}</span>
            <span className={styles.statAmount}>{formatCurrency(summary.invoiced?.amount || 0)}</span>
          </div>
          <div
            className={`${styles.statCard} ${styles.statPaid} ${statusFilter === 'paid' ? styles.statCardActive : ''}`}
            onClick={() => setStatusFilter('paid')}
          >
            <span className={styles.statLabel}>Paid</span>
            <span className={styles.statValue}>{summary.paid?.count || 0}</span>
            <span className={styles.statAmount}>{formatCurrency(summary.paid?.amount || 0)}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className={styles.tabsRow}>
        <button
          className={`${styles.tab} ${activeTab === 'projects' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          Projects ({filteredProjects.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'invoices' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('invoices')}
        >
          Invoices ({invoices.length})
        </button>
      </div>

      {/* Projects Tab */}
      {activeTab === 'projects' && (
        <>
          {/* Toolbar */}
          <div className={styles.toolbar}>
            <div className={styles.toolbarLeft}>
              <div className={styles.searchWrapper}>
                <Search className={styles.searchIcon} />
                <input
                  className={styles.searchInput}
                  placeholder="Search by name, company, address, project ID..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              {selectedIds.size > 0 && (
                <span className={styles.selectedCount}>
                  {selectedIds.size} selected
                </span>
              )}
            </div>
            <div>
              <button
                className={styles.btnPrimary}
                disabled={selectedIds.size === 0}
                onClick={() => setShowInvoiceModal(true)}
              >
                <FileText size={14} />
                Generate Invoice{selectedIds.size > 1 ? 's' : ''} ({selectedIds.size})
              </button>
            </div>
          </div>

          {/* Projects Table */}
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner} />
              Loading billing data...
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className={styles.emptyState}>
              <FileText className={styles.emptyIcon} />
              <h3 className={styles.emptyTitle}>No projects found</h3>
              <p className={styles.emptyDesc}>
                {searchQuery ? 'Try adjusting your search.' : 'No projects match the current filters.'}
              </p>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>
                      <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={selectedIds.size > 0 && selectedIds.size === uninvoicedProjects.length}
                        onChange={toggleSelectAll}
                        title="Select all uninvoiced"
                      />
                    </th>
                    <th className="sortable" onClick={() => handleSort('customer_last_name')}>
                      Customer <SortIcon field="customer_last_name" />
                    </th>
                    <th>Project ID</th>
                    <th className="sortable" onClick={() => handleSort('company_name')}>
                      Company <SortIcon field="company_name" />
                    </th>
                    <th>Location</th>
                    <th className="sortable" onClick={() => handleSort('created_at')}>
                      Created <SortIcon field="created_at" />
                    </th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map(project => (
                    <tr
                      key={project.id}
                      className={selectedIds.has(project.id) ? styles.rowSelected : ''}
                    >
                      <td>
                        {project.billing_status === 'uninvoiced' ? (
                          <input
                            type="checkbox"
                            className={styles.checkbox}
                            checked={selectedIds.has(project.id)}
                            onChange={() => toggleSelect(project.id)}
                          />
                        ) : (
                          <span className={`${styles.dot} ${getDotClass(project.billing_status)}`} />
                        )}
                      </td>
                      <td>
                        <div className={styles.customerName}>
                          {(project.customer_first_name || '').trim()} {(project.customer_last_name || '').trim()}
                        </div>
                      </td>
                      <td>
                        <span className={styles.projectId}>{project.installer_project_id || `#${project.id}`}</span>
                      </td>
                      <td>
                        <span className={styles.companyName}>{project.company_name}</span>
                      </td>
                      <td>
                        <span className={styles.address}>
                          {[project.city, project.state].filter(Boolean).join(', ')}
                        </span>
                      </td>
                      <td>{formatDate(project.created_at)}</td>
                      <td>
                        <span className={styles.invoiceAmount}>
                          {formatCurrency(project.amount || DEFAULT_PRICE)}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${getStatusBadgeClass(project.billing_status)}`}>
                          {project.billing_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <>
          {invoices.length === 0 ? (
            <div className={styles.emptyState}>
              <Receipt className={styles.emptyIcon} />
              <h3 className={styles.emptyTitle}>No invoices yet</h3>
              <p className={styles.emptyDesc}>
                Select projects from the Projects tab and generate your first invoice.
              </p>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Company</th>
                    <th>Projects</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Due Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr key={inv.id}>
                      <td>
                        <span className={styles.projectId}>{inv.invoice_number}</span>
                      </td>
                      <td>
                        <span className={styles.companyName}>{inv.company_name}</span>
                      </td>
                      <td>{inv.line_items?.length || 0}</td>
                      <td>
                        <span className={styles.invoiceAmount}>{formatCurrency(inv.total)}</span>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${getStatusBadgeClass(inv.status)}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td>{formatDate(inv.created_at)}</td>
                      <td>{formatDate(inv.due_date)}</td>
                      <td>
                        <div className={styles.invoiceActions}>
                          {(inv.status === 'draft' || inv.status === 'sent') && (
                            <button
                              className={styles.btnIcon}
                              title="Send email"
                              onClick={() => handleSendEmail(inv.id)}
                            >
                              <Send size={14} />
                            </button>
                          )}
                          <button className={styles.btnIcon} title="View details">
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Invoice Creation Modal */}
      {showInvoiceModal && (
        <div className={styles.modalOverlay} onClick={() => !invoiceCreating && setShowInvoiceModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 className={styles.modalTitle}>Generate Invoice</h2>
                <p className={styles.modalSubtitle}>
                  {invoicePreview.groups.length > 1
                    ? `${invoicePreview.groups.length} invoices will be created (one per company)`
                    : `1 invoice for ${selectedProjects.length} project(s)`
                  }
                </p>
              </div>
              <button className={styles.btnIcon} onClick={() => !invoiceCreating && setShowInvoiceModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {invoicePreview.groups.map((group, i) => (
                <div key={i}>
                  <div className={styles.invoiceSummaryRow}>
                    <span className={styles.invoiceSummaryLabel}>Company</span>
                    <span className={styles.invoiceSummaryValue}>{group.company}</span>
                  </div>
                  <div className={styles.invoiceSummaryRow}>
                    <span className={styles.invoiceSummaryLabel}>Projects</span>
                    <span className={styles.invoiceSummaryValue}>{group.projects.length}</span>
                  </div>
                  <div className={styles.invoiceSummaryRow}>
                    <span className={styles.invoiceSummaryLabel}>
                      Rate ({formatCurrency(DEFAULT_PRICE)}/project)
                    </span>
                    <span className={`${styles.invoiceSummaryValue} ${styles.invoiceTotal}`}>
                      {formatCurrency(group.total)}
                    </span>
                  </div>
                  {i < invoicePreview.groups.length - 1 && <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '12px 0' }} />}
                </div>
              ))}

              {invoicePreview.groups.length > 1 && (
                <div className={styles.invoiceSummaryRow} style={{ paddingTop: 12, borderTop: '2px solid rgba(255,255,255,0.15)' }}>
                  <span className={styles.invoiceSummaryValue}>Grand Total</span>
                  <span className={`${styles.invoiceSummaryValue} ${styles.invoiceTotal}`}>
                    {formatCurrency(invoicePreview.total)}
                  </span>
                </div>
              )}

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 8, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <input
                  type="checkbox"
                  checked={sendEmailOnCreate}
                  onChange={e => setSendEmailOnCreate(e.target.checked)}
                  className={styles.checkbox}
                />
                Send invoice email immediately
              </label>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.btnSecondary}
                onClick={() => setShowInvoiceModal(false)}
                disabled={invoiceCreating}
              >
                Cancel
              </button>
              <button
                className={styles.btnPrimary}
                onClick={handleCreateInvoice}
                disabled={invoiceCreating}
              >
                {invoiceCreating ? (
                  <>
                    <div className={styles.spinner} style={{ width: 14, height: 14, borderWidth: 2 }} />
                    Creating...
                  </>
                ) : (
                  <>
                    <Zap size={14} />
                    Create & {sendEmailOnCreate ? 'Send' : 'Save'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingPortal;
