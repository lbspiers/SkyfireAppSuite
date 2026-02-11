// src/pages/Admin/BillingPortal.js
// Admin Billing Portal - Bill.com Integration v3
// Compact layout: inline stats, max table space

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DollarSign, FileText, Send, CheckCircle, Clock, AlertCircle,
  Building2, Search, RefreshCw, Eye, XCircle, Ban,
  ToggleLeft, ToggleRight, ChevronDown, ChevronUp,
  Zap, Activity, Hash, MapPin, Package,
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
  checkBillingHealth,
  getBillingCompanies,
  toggleCompanyBilling,
  getBillingProjects,
  getBillingSummary,
  createInvoice,
  sendInvoiceEmail,
  getInvoices,
  getInvoiceDetail,
} from '../../services/billingAPI';
import { formatPrice, DEFAULT_PRICE } from '../../constants/pricing';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import styles from './BillingPortal.module.css';

// ════════════════════════════════════════════
// Sub-Components
// ════════════════════════════════════════════

const StatusBadge = ({ status, type = 'billing' }) => {
  if (!status) return <span className={`${styles.badge} ${styles.badgeNone}`}>—</span>;

  const configs = {
    billing: {
      uninvoiced: { cls: styles.badgeUninvoiced, label: 'Uninvoiced' },
      not_invoiced: { cls: styles.badgeUninvoiced, label: 'Uninvoiced' },
      invoiced: { cls: styles.badgeInvoiced, label: 'Invoiced' },
      sent: { cls: styles.badgeSent, label: 'Sent' },
      paid: { cls: styles.badgePaid, label: 'Paid' },
      overdue: { cls: styles.badgeOverdue, label: 'Overdue' },
      draft: { cls: styles.badgeDraft, label: 'Draft' },
      void: { cls: styles.badgeVoid, label: 'Void' },
    },
    project: {
      Survey: { cls: styles.badgeSurvey, label: 'Survey' },
      Design: { cls: styles.badgeDesign, label: 'Design' },
      Revision: { cls: styles.badgeRevision, label: 'Revision' },
      Permit: { cls: styles.badgePermit, label: 'Permit' },
      Installed: { cls: styles.badgeInstalled, label: 'Installed' },
      Canceled: { cls: styles.badgeCanceled, label: 'Canceled' },
      'On Hold': { cls: styles.badgeOnHold, label: 'On Hold' },
    },
  };

  const config = configs[type]?.[status] || { cls: styles.badgeDefault, label: status };
  return <span className={`${styles.badge} ${config.cls}`}>{config.label}</span>;
};

const EmptyState = ({ icon: Icon, title, subtitle }) => (
  <div className={styles.emptyState}>
    <Icon size={40} strokeWidth={1} />
    <h3>{title}</h3>
    <p>{subtitle}</p>
  </div>
);

// ════════════════════════════════════════════
// Main Component
// ════════════════════════════════════════════

const BillingPortal = () => {
  // ── Tab State ──
  const [activeTab, setActiveTab] = useState('projects');

  // ── Health ──
  const [health, setHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);

  // ── Companies ──
  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [companySearch, setCompanySearch] = useState('');

  // ── Projects ──
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectSearch, setProjectSearch] = useState('');
  const [selectedProjects, setSelectedProjects] = useState(new Set());
  const [showCanceled, setShowCanceled] = useState(false);
  const [showHeld, setShowHeld] = useState(false);
  const [sortField, setSortField] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');

  // ── Invoices ──
  const [invoices, setInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [invoiceDetail, setInvoiceDetail] = useState(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

  // ── Create Invoice ──
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [sendEmailOnCreate, setSendEmailOnCreate] = useState(false);

  // ── Company dropdown ──
  const [companyOptions, setCompanyOptions] = useState([]);

  // ════════════════════════════════════════
  // Data Fetching
  // ════════════════════════════════════════

  const fetchHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const result = await checkBillingHealth();
      setHealth(result);
    } catch (err) {
      setHealth({ ok: false, error: err.message });
    } finally {
      setHealthLoading(false);
    }
  }, []);

  const fetchCompanies = useCallback(async () => {
    setCompaniesLoading(true);
    try {
      const result = await getBillingCompanies();
      setCompanies(result);
      setCompanyOptions(result.map(c => ({ value: c.uuid, label: c.name, id: c.id })));
    } catch (err) {
      toast.error('Failed to load companies');
    } finally {
      setCompaniesLoading(false);
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    setProjectsLoading(true);
    try {
      const companyUuid = selectedCompany || undefined;
      const status = statusFilter === 'all' ? undefined : statusFilter;
      const { projects: result } = await getBillingProjects(companyUuid, status || 'all', {
        includeCanceled: showCanceled,
        includeHeld: showHeld,
      });
      setProjects(result);
      setSelectedProjects(new Set());
    } catch (err) {
      toast.error('Failed to load projects');
    } finally {
      setProjectsLoading(false);
    }
  }, [selectedCompany, statusFilter, showCanceled, showHeld]);

  const fetchSummary = useCallback(async () => {
    try {
      const companyUuid = selectedCompany || undefined;
      const result = await getBillingSummary(companyUuid);
      setSummary(result);
    } catch (err) {
      console.error('Failed to load summary:', err);
    }
  }, [selectedCompany]);

  const fetchInvoices = useCallback(async () => {
    setInvoicesLoading(true);
    try {
      const companyUuid = selectedCompany || undefined;
      const result = await getInvoices(companyUuid);
      setInvoices(result);
    } catch (err) {
      toast.error('Failed to load invoices');
    } finally {
      setInvoicesLoading(false);
    }
  }, [selectedCompany]);

  useEffect(() => { fetchHealth(); }, [fetchHealth]);
  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);
  useEffect(() => { fetchProjects(); fetchSummary(); }, [fetchProjects, fetchSummary]);
  useEffect(() => { if (activeTab === 'invoices') fetchInvoices(); }, [activeTab, fetchInvoices]);

  // ════════════════════════════════════════
  // Actions
  // ════════════════════════════════════════

  const handleToggleBilling = async (company) => {
    try {
      const newValue = !company.billing_enabled;
      await toggleCompanyBilling(company.id, newValue);
      setCompanies(prev => prev.map(c => c.id === company.id ? { ...c, billing_enabled: newValue } : c));
      toast.success(`Billing ${newValue ? 'enabled' : 'disabled'} for ${company.name}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to toggle billing');
    }
  };

  const handleSelectProject = (projectId) => {
    setSelectedProjects(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId); else next.add(projectId);
      return next;
    });
  };

  const handleSelectAll = () => {
    const billable = filteredProjects.filter(p => !p.billing_status || p.billing_status === 'uninvoiced' || p.billing_status === 'not_invoiced');
    if (selectedProjects.size === billable.length) {
      setSelectedProjects(new Set());
    } else {
      setSelectedProjects(new Set(billable.map(p => p.project_id)));
    }
  };

  const handleCreateInvoice = async () => {
    if (selectedProjects.size === 0) return;
    const firstProject = projects.find(p => selectedProjects.has(p.project_id));
    if (!firstProject) return;

    const selectedList = projects.filter(p => selectedProjects.has(p.project_id));
    const uniqueCompanies = new Set(selectedList.map(p => p.company_id));
    if (uniqueCompanies.size > 1) {
      toast.error('All selected projects must belong to the same company');
      return;
    }
    if (!firstProject.billing_enabled) {
      toast.error(`Billing not enabled for ${firstProject.company_name}. Enable it in Companies tab.`);
      return;
    }

    setCreating(true);
    try {
      const result = await createInvoice({
        projectIds: Array.from(selectedProjects),
        companyId: firstProject.company_uuid,
        sendEmail: sendEmailOnCreate,
      });
      toast.success(`Invoice ${result.invoice?.invoice_number || ''} created — ${formatPrice(result.totalAmount)}`);
      setCreateModalOpen(false);
      setSelectedProjects(new Set());
      setSendEmailOnCreate(false);
      fetchProjects();
      fetchSummary();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create invoice');
    } finally {
      setCreating(false);
    }
  };

  const handleSendInvoice = async (invoiceId) => {
    try {
      await sendInvoiceEmail(invoiceId);
      toast.success('Invoice email sent');
      fetchInvoices();
    } catch (err) {
      toast.error('Failed to send invoice email');
    }
  };

  const handleViewInvoice = async (invoiceId) => {
    try {
      const detail = await getInvoiceDetail(invoiceId);
      setInvoiceDetail(detail);
      setInvoiceModalOpen(true);
    } catch (err) {
      toast.error('Failed to load invoice details');
    }
  };

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  // ════════════════════════════════════════
  // Derived Data
  // ════════════════════════════════════════

  const filteredCompanies = useMemo(() => {
    if (!companySearch) return companies;
    const q = companySearch.toLowerCase();
    return companies.filter(c => c.name.toLowerCase().includes(q));
  }, [companies, companySearch]);

  const filteredProjects = useMemo(() => {
    let result = [...projects];
    if (projectSearch) {
      const q = projectSearch.toLowerCase();
      result = result.filter(p =>
        (p.address || '').toLowerCase().includes(q) ||
        (p.company_name || '').toLowerCase().includes(q) ||
        (p.invoice_number || '').toLowerCase().includes(q) ||
        (p.customer_first_name || '').toLowerCase().includes(q) ||
        (p.customer_last_name || '').toLowerCase().includes(q) ||
        String(p.project_id).includes(q)
      );
    }
    result.sort((a, b) => {
      let aVal = a[sortField], bVal = b[sortField];
      if (aVal == null) aVal = '';
      if (bVal == null) bVal = '';
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [projects, projectSearch, sortField, sortDir]);

  const selectedProjectsList = useMemo(() => projects.filter(p => selectedProjects.has(p.project_id)), [projects, selectedProjects]);
  const selectedTotal = useMemo(() => selectedProjectsList.length * DEFAULT_PRICE, [selectedProjectsList]);

  const tabs = [
    { id: 'projects', label: 'Projects', icon: FileText, count: projects.length },
    { id: 'companies', label: 'Companies', icon: Building2, count: companies.length },
    { id: 'invoices', label: 'Invoices', icon: DollarSign, count: invoices.length },
    { id: 'health', label: 'Connection', icon: Activity },
  ];

  // ════════════════════════════════════════
  // Render Helpers
  // ════════════════════════════════════════

  const SortHeader = ({ field, children }) => (
    <th onClick={() => handleSort(field)} className={styles.sortHeader}>
      {children}
      {sortField === field && (sortDir === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
    </th>
  );

  // ════════════════════════════════════════
  // Render: Inline Stats Bar
  // ════════════════════════════════════════

  const renderStatsBar = () => {
    if (!summary) return null;
    const s = summary;
    return (
      <div className={styles.statsBar}>
        <div className={styles.statPill}>
          <Package size={13} />
          <span className={styles.statNum}>{Number(s.total_projects) || 0}</span>
          <span className={styles.statLbl}>Billable</span>
        </div>
        <div className={`${styles.statPill} ${styles.statWarn}`}>
          <Clock size={13} />
          <span className={styles.statNum}>{Number(s.uninvoiced_count) || 0}</span>
          <span className={styles.statLbl}>Uninvoiced</span>
        </div>
        <div className={`${styles.statPill} ${styles.statInfo}`}>
          <FileText size={13} />
          <span className={styles.statNum}>{formatPrice(Number(s.outstanding_amount) || 0)}</span>
          <span className={styles.statLbl}>{Number(s.invoiced_count) || 0} invoices</span>
        </div>
        <div className={`${styles.statPill} ${styles.statOk}`}>
          <CheckCircle size={13} />
          <span className={styles.statNum}>{formatPrice(Number(s.paid_amount) || 0)}</span>
          <span className={styles.statLbl}>{Number(s.paid_count) || 0} projects</span>
        </div>
        <div className={`${styles.statPill} ${styles.statAccent}`}>
          <Activity size={13} />
          <span className={styles.statNum}>{formatPrice(Number(s.total_revenue) || 0)}</span>
          <span className={styles.statLbl}>Total</span>
        </div>
        <div className={styles.statPill}>
          <DollarSign size={13} />
          <span className={styles.statNum}>{formatPrice(Number(s.avg_project_value) || 150)}</span>
          <span className={styles.statLbl}>per project</span>
        </div>
        {Number(s.held_canceled_count) > 0 && (
          <div className={`${styles.statPill} ${styles.statMuted}`}>
            <Ban size={13} />
            <span className={styles.statNum}>{Number(s.held_canceled_count)}</span>
            <span className={styles.statLbl}>Held</span>
          </div>
        )}
      </div>
    );
  };

  // ════════════════════════════════════════
  // Render: Projects Tab
  // ════════════════════════════════════════

  const renderProjects = () => (
    <div className={styles.tabContent}>
      {/* Stats + Toolbar on one compact strip */}

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={14} />
          <input
            type="text" placeholder="Search address, company, ID..."
            value={projectSearch} onChange={e => setProjectSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <select value={selectedCompany} onChange={e => setSelectedCompany(e.target.value)} className={styles.filterSelect}>
          <option value="">All Companies</option>
          {companyOptions.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={styles.filterSelect}>
          <option value="all">All Statuses</option>
          <option value="uninvoiced">Uninvoiced</option>
          <option value="invoiced">Invoiced</option>
          <option value="paid">Paid</option>
        </select>
        <label className={styles.miniCheck}><input type="checkbox" checked={showCanceled} onChange={e => setShowCanceled(e.target.checked)} /> Canceled</label>
        <label className={styles.miniCheck}><input type="checkbox" checked={showHeld} onChange={e => setShowHeld(e.target.checked)} /> On Hold</label>
        <button onClick={() => { fetchProjects(); fetchSummary(); }} className={styles.btnIcon} title="Refresh">
          <RefreshCw size={14} className={projectsLoading ? styles.spinning : ''} />
        </button>
      </div>

      {/* Selection action bar */}
      {selectedProjects.size > 0 && (
        <div className={styles.selectionBar}>
          <span className={styles.selCount}>{selectedProjects.size} selected</span>
          <span className={styles.selTotal}>{formatPrice(selectedTotal)}</span>
          <button onClick={() => setCreateModalOpen(true)} className={styles.btnPrimary}>
            <DollarSign size={13} /> Generate Invoice
          </button>
          <button onClick={() => setSelectedProjects(new Set())} className={styles.btnGhost}>
            <XCircle size={13} /> Clear
          </button>
        </div>
      )}

      {/* Table */}
      {projectsLoading ? (
        <div className={styles.loadingWrap}><LoadingSpinner /></div>
      ) : filteredProjects.length === 0 ? (
        <EmptyState icon={FileText} title="No projects" subtitle="Adjust filters or select a different company." />
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.colCheck}>
                  <input type="checkbox" onChange={handleSelectAll}
                    checked={selectedProjects.size > 0 && selectedProjects.size === filteredProjects.filter(p => !p.billing_status || p.billing_status === 'uninvoiced' || p.billing_status === 'not_invoiced').length}
                  />
                </th>
                <SortHeader field="project_id">ID</SortHeader>
                <SortHeader field="company_name">Company</SortHeader>
                <SortHeader field="address">Address</SortHeader>
                <SortHeader field="customer_last_name">Customer</SortHeader>
                <SortHeader field="project_status">Stage</SortHeader>
                <SortHeader field="billing_status">Billing</SortHeader>
                <SortHeader field="invoice_number">Invoice</SortHeader>
                <SortHeader field="created_at">Created</SortHeader>
                <th className={styles.colRight}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map(p => {
                const billable = !p.billing_status || p.billing_status === 'uninvoiced' || p.billing_status === 'not_invoiced';
                const selected = selectedProjects.has(p.project_id);
                return (
                  <tr key={p.project_id} className={`${selected ? styles.rowSelected : ''} ${!billable ? styles.rowDim : ''}`}>
                    <td className={styles.colCheck}>
                      {billable && <input type="checkbox" checked={selected} onChange={() => handleSelectProject(p.project_id)} />}
                    </td>
                    <td className={styles.colMono}>{p.installer_project_id || p.project_id}</td>
                    <td>
                      <span className={styles.companyName}>{p.company_name || '—'}</span>
                      {!p.billing_enabled && <Ban size={10} className={styles.billingOff} title="Billing off" />}
                    </td>
                    <td>
                      <span>{[p.address, p.city, p.state].filter(Boolean).join(", ") || "—"}</span>
                    </td>
                    <td>{p.customer_last_name ? `${p.customer_last_name}, ${p.customer_first_name || ""}` : "—"}</td>
                    <td><StatusBadge status={p.project_status} type="project" /></td>
                    <td><StatusBadge status={p.billing_status} type="billing" /></td>
                    <td className={styles.colMono}>{p.invoice_number || '—'}</td>
                    <td className={styles.colDate}>{p.created_at ? new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</td>
                    <td className={styles.colRight}>{formatPrice(DEFAULT_PRICE)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <div className={styles.tableFooter}>{filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}</div>
    </div>
  );

  // ════════════════════════════════════════
  // Render: Companies Tab
  // ════════════════════════════════════════

  const renderCompanies = () => (
    <div className={styles.tabContent}>
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={14} />
          <input type="text" placeholder="Search companies..." value={companySearch}
            onChange={e => setCompanySearch(e.target.value)} className={styles.searchInput} />
        </div>
        <button onClick={fetchCompanies} className={styles.btnIcon} title="Refresh">
          <RefreshCw size={14} className={companiesLoading ? styles.spinning : ''} />
        </button>
      </div>

      {companiesLoading ? (
        <div className={styles.loadingWrap}><LoadingSpinner /></div>
      ) : filteredCompanies.length === 0 ? (
        <EmptyState icon={Building2} title="No companies" subtitle="No active companies found." />
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Company</th>
                <th className={styles.colCenter}>Projects</th>
                <th className={styles.colCenter}>Invoiced</th>
                <th className={styles.colCenter}>Paid</th>
                <th className={styles.colCenter}>Billing</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.map(c => (
                <tr key={c.id} className={c.billing_enabled ? '' : styles.rowDim}>
                  <td>
                    <div className={styles.companyCell}>
                      <Building2 size={14} className={styles.companyIcon} />
                      <span className={styles.companyName}>{c.name}</span>
                    </div>
                  </td>
                  <td className={styles.colCenter}>{Number(c.total_projects)}</td>
                  <td className={styles.colCenter}>{Number(c.invoiced_projects)}</td>
                  <td className={styles.colCenter}>{Number(c.paid_projects)}</td>
                  <td className={styles.colCenter}>
                    <button onClick={() => handleToggleBilling(c)}
                      className={`${styles.toggleBtn} ${c.billing_enabled ? styles.toggleOn : styles.toggleOff}`}>
                      {c.billing_enabled ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                      <span>{c.billing_enabled ? 'Active' : 'Off'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // ════════════════════════════════════════
  // Render: Invoices Tab
  // ════════════════════════════════════════

  const renderInvoices = () => (
    <div className={styles.tabContent}>
      {invoicesLoading ? (
        <div className={styles.loadingWrap}><LoadingSpinner /></div>
      ) : invoices.length === 0 ? (
        <EmptyState icon={DollarSign} title="No invoices" subtitle="Create your first invoice from the Projects tab." />
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Company</th>
                <th className={styles.colCenter}>Projects</th>
                <th className={styles.colRight}>Total</th>
                <th className={styles.colRight}>Due</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id}>
                  <td className={styles.invoiceNum}>{inv.invoice_number || inv.billcom_invoice_number || '—'}</td>
                  <td>{inv.company_name}</td>
                  <td className={styles.colCenter}>{Number(inv.project_count) || 0}</td>
                  <td className={styles.colRight}>{formatPrice(Number(inv.total_amount))}</td>
                  <td className={styles.colRight}>{formatPrice(Number(inv.due_amount))}</td>
                  <td><StatusBadge status={inv.status} /></td>
                  <td className={styles.colDate}>{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}</td>
                  <td>
                    <div className={styles.actionBtns}>
                      <button onClick={() => handleViewInvoice(inv.id)} className={styles.btnSmall} title="View"><Eye size={13} /></button>
                      {(inv.status === 'draft' || inv.status === 'invoiced') && (
                        <button onClick={() => handleSendInvoice(inv.id)} className={styles.btnSmall} title="Send"><Send size={13} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // ════════════════════════════════════════
  // Render: Health Tab
  // ════════════════════════════════════════

  const renderHealth = () => (
    <div className={styles.tabContent}>
      <div className={styles.healthPanel}>
        <div className={styles.healthHeader}>
          <Activity size={20} />
          <h3>Bill.com API Connection</h3>
          <button onClick={fetchHealth} className={styles.btnIcon} disabled={healthLoading}>
            <RefreshCw size={14} className={healthLoading ? styles.spinning : ''} />
          </button>
        </div>
        {healthLoading ? <div className={styles.loadingWrap}><LoadingSpinner /></div> : health ? (
          <div className={styles.healthGrid}>
            <div className={`${styles.healthRow} ${health.ok ? styles.healthOk : styles.healthErr}`}>
              <span className={styles.healthDot} />
              <span className={styles.healthLabel}>Status</span>
              <span className={styles.healthVal}>{health.ok ? 'Connected' : 'Disconnected'}</span>
            </div>
            {health.userId && <div className={styles.healthRow}><span className={styles.healthLabel}>User ID</span><span className={styles.healthVal}>{health.userId}</span></div>}
            {health.orgId && <div className={styles.healthRow}><span className={styles.healthLabel}>Org ID</span><span className={styles.healthVal}>{health.orgId}</span></div>}
            {health.error && <div className={`${styles.healthRow} ${styles.healthErr}`}><span className={styles.healthLabel}>Error</span><span className={styles.healthVal}>{health.error}</span></div>}
          </div>
        ) : null}
      </div>
    </div>
  );

  // ════════════════════════════════════════
  // Render: Create Invoice Modal
  // ════════════════════════════════════════

  const renderCreateModal = () => {
    if (!createModalOpen) return null;
    const company = selectedProjectsList[0]?.company_name || 'Unknown';
    return (
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create Invoice">
        <div className={styles.modalBody}>
          <div className={styles.modalSection}>
            <h4>Summary</h4>
            <div className={styles.modalInfo}>
              <div><strong>Company:</strong> {company}</div>
              <div><strong>Projects:</strong> {selectedProjectsList.length}</div>
              <div><strong>Rate:</strong> {formatPrice(DEFAULT_PRICE)} / project</div>
              <div className={styles.modalTotal}><strong>Total:</strong> {formatPrice(selectedTotal)}</div>
            </div>
          </div>
          <div className={styles.modalSection}>
            <h4>Projects</h4>
            <div className={styles.modalList}>
              {selectedProjectsList.map(p => (
                <div key={p.project_id} className={styles.modalRow}>
                  <span>#{p.project_id}</span>
                  <span>{p.address || 'No address'}</span>
                  <span>{formatPrice(DEFAULT_PRICE)}</span>
                </div>
              ))}
            </div>
          </div>
          <label className={styles.miniCheck}>
            <input type="checkbox" checked={sendEmailOnCreate} onChange={e => setSendEmailOnCreate(e.target.checked)} />
            Send invoice email via Bill.com
          </label>
          <div className={styles.modalActions}>
            <button onClick={() => setCreateModalOpen(false)} className={styles.btnGhost}>Cancel</button>
            <button onClick={handleCreateInvoice} className={styles.btnPrimary} disabled={creating}>
              {creating ? <RefreshCw size={13} className={styles.spinning} /> : <DollarSign size={13} />}
              {creating ? 'Creating...' : `Create Invoice (${formatPrice(selectedTotal)})`}
            </button>
          </div>
        </div>
      </Modal>
    );
  };

  // ════════════════════════════════════════
  // Render: Invoice Detail Modal
  // ════════════════════════════════════════

  const renderInvoiceModal = () => {
    if (!invoiceModalOpen || !invoiceDetail) return null;
    const d = invoiceDetail;
    return (
      <Modal isOpen={invoiceModalOpen} onClose={() => { setInvoiceModalOpen(false); setInvoiceDetail(null); }} title={`Invoice ${d.invoice_number || ''}`}>
        <div className={styles.modalBody}>
          <div className={styles.modalInfo}>
            <div><strong>Company:</strong> {d.company_name}</div>
            <div><strong>Status:</strong> <StatusBadge status={d.status} /></div>
            <div><strong>Date:</strong> {d.invoice_date ? new Date(d.invoice_date).toLocaleDateString() : '—'}</div>
            <div><strong>Due:</strong> {d.due_date ? new Date(d.due_date).toLocaleDateString() : '—'}</div>
            <div><strong>Total:</strong> {formatPrice(Number(d.total_amount))}</div>
            <div><strong>Paid:</strong> {formatPrice(Number(d.paid_amount) || 0)}</div>
            <div><strong>Balance:</strong> {formatPrice(Number(d.due_amount))}</div>
            {d.email_sent_at && <div><strong>Emailed:</strong> {new Date(d.email_sent_at).toLocaleString()}</div>}
          </div>
          {d.lineItems?.length > 0 && (
            <div className={styles.modalSection}>
              <h4>Line Items</h4>
              <div className={styles.modalList}>
                {d.lineItems.map(li => (
                  <div key={li.id} className={styles.modalRow}>
                    <span>#{li.project_id}</span>
                    <span>{li.project_address || li.description}</span>
                    <span>{formatPrice(Number(li.amount))}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {d.payments?.length > 0 && (
            <div className={styles.modalSection}>
              <h4>Payments</h4>
              <div className={styles.modalList}>
                {d.payments.map(pmt => (
                  <div key={pmt.id} className={styles.modalRow}>
                    <span>{new Date(pmt.payment_date).toLocaleDateString()}</span>
                    <span>{pmt.payment_method}</span>
                    <span>{formatPrice(Number(pmt.amount))}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    );
  };

  // ════════════════════════════════════════
  // Main Render
  // ════════════════════════════════════════

  return (
    <div className={styles.container}>
      {/* Compact header row */}
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <Zap size={20} className={styles.headerIcon} />
          <h2 className={styles.title}>Billing</h2>
          <span className={`${styles.connDot} ${health?.ok ? styles.dotGreen : styles.dotRed}`} />
        </div>
        {renderStatsBar()}
        {/* Tabs inline with header */}
        <div className={styles.tabBar}>
          {tabs.map(tab => (
            <button key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.id)}>
              <tab.icon size={14} />
              <span>{tab.label}</span>
              {tab.count !== undefined && <span className={styles.tabCount}>{tab.count}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'projects' && renderProjects()}
      {activeTab === 'companies' && renderCompanies()}
      {activeTab === 'invoices' && renderInvoices()}
      {activeTab === 'health' && renderHealth()}

      {renderCreateModal()}
      {renderInvoiceModal()}
    </div>
  );
};

export default BillingPortal;
