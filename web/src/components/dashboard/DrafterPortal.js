import React, { useState, useMemo, useRef, useEffect } from 'react';
import { safeGetJSON } from '../../utils/safeStorage';
import { Link, useNavigate } from 'react-router-dom';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import moment from 'moment';
import { toast } from 'react-toastify';
// Removed ag-grid.css import - using Theming API instead
import styles from '../../styles/Dashboard.module.css';
import { CSS_GRADIENTS } from '../../styles/gradient';
import { updateProjectStatus } from '../../services/projectService';
import { LaunchButton } from '../ui';
import speechBubbleIcon from '../../assets/images/speech-bubble-plus-128.png';
import eyeIcon from '../../assets/images/eye-icon-128.png';
import logger from '../../services/devLogger';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Status mapping from completed_step to status name
const STATUS_MAP = {
  0: 'Sales',
  1: 'Site Survey',
  2: 'Design',
  3: 'Revisions',
  4: 'Permits',
  5: 'Install',
  6: 'Commissioning',
  7: 'Inspection',
  8: 'PTO',
  9: 'Canceled',
  10: 'On Hold'
};

// Status options for dropdown
const STATUS_OPTIONS = [
  { label: 'Sales', value: 0 },
  { label: 'Site Survey', value: 1 },
  { label: 'Design', value: 2 },
  { label: 'Revisions', value: 3 },
  { label: 'Permits', value: 4 },
  { label: 'Install', value: 5 },
  { label: 'Commissioning', value: 6 },
  { label: 'Inspection', value: 7 },
  { label: 'PTO', value: 8 },
  { label: 'Canceled', value: 9 },
  { label: 'On Hold', value: 10 },
];

// Status colors matching mobile app (using design tokens from tokens.css)
const STATUS_COLORS = {
  'Sales': 'var(--status-sales)',
  'Site Survey': 'var(--status-site-survey)',
  'Design': 'var(--status-design)',
  'Revisions': 'var(--status-revisions)',
  'Permits': 'var(--status-permits)',
  'Install': 'var(--status-install)',
  'Commissioning': 'var(--status-commissioning)',
  'Inspection': 'var(--status-inspection)',
  'PTO': 'var(--status-pto)',
  'On Hold': 'var(--status-on-hold)',
  'Canceled': 'var(--status-canceled)'
};

/**
 * DrafterPortal - Drafter portal view with projects table
 * Based on ProjectsOverview component
 */
const DrafterPortal = ({ projects = [], loading = false, selectedStatus = 'all', onProjectsUpdate, onViewChatter, onNewProject, isNewProjectOpen = false }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [projectsData, setProjectsData] = useState(projects);
  const gridRef = useRef(null);
  const navigate = useNavigate();

  // Update local state when projects prop changes
  useEffect(() => {
    setProjectsData(projects);
  }, [projects]);

  // Get user data to check if superuser
  const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
  const companyData = safeGetJSON('companyData', sessionStorage, {});
  const isSuperAdmin = userData?.isSuperAdmin === true;

  // Handle status change
  const handleStatusChange = async (projectUuid, newStatus, oldStatus) => {
    // Optimistic update
    setProjectsData(prevProjects =>
      prevProjects.map(project =>
        project.uuid === projectUuid
          ? { ...project, completed_step: newStatus }
          : project
      )
    );

    try {
      await updateProjectStatus(projectUuid, companyData.uuid, newStatus);
      toast.success('Status updated successfully', {
        position: 'top-right',
        autoClose: 2000,
      });
      // Notify parent component to refresh data if callback provided
      if (onProjectsUpdate) {
        onProjectsUpdate();
      }
    } catch (error) {
      // Rollback on error
      setProjectsData(prevProjects =>
        prevProjects.map(project =>
          project.uuid === projectUuid
            ? { ...project, completed_step: oldStatus }
            : project
        )
      );
      toast.error('Failed to update status', {
        position: 'top-right',
        autoClose: 3000,
      });
      logger.error('Dashboard', 'Error updating status:', error);
    }
  };

  // Action buttons component for AG Grid (Chat + Eye + Launch)
  const ActionButtonsRenderer = (params) => {
    const handleLaunchClick = () => {
      navigate(`/project/${params.data.uuid}`);
    };

    const handleChatClick = (e) => {
      e.stopPropagation();

      // Build project info object for the chatter header
      const project = params.data;
      const projectInfo = {
        uuid: project.uuid,
        customerName: `${project.details?.customer_last_name || ''}, ${project.details?.customer_first_name || ''}`.trim() || 'Unknown Customer',
        address: project.site
          ? `${project.site.address || ''}${project.site.city ? `, ${project.site.city}` : ''}${project.site.state ? `, ${project.site.state}` : ''}${project.site.zip_code ? ` ${project.site.zip_code}` : ''}`
          : 'No address',
        projectId: project.details?.installer_project_id || project.uuid?.slice(0, 8),
        defaultTab: 'notes' // Open to notes tab
      };

      // Call the onViewChatter callback from props
      if (params.context?.onViewChatter) {
        params.context.onViewChatter(projectInfo);
      }
    };

    const handleOverviewClick = (e) => {
      e.stopPropagation();

      // Build project info object for the chatter header
      const project = params.data;
      const projectInfo = {
        uuid: project.uuid,
        customerName: `${project.details?.customer_last_name || ''}, ${project.details?.customer_first_name || ''}`.trim() || 'Unknown Customer',
        address: project.site
          ? `${project.site.address || ''}${project.site.city ? `, ${project.site.city}` : ''}${project.site.state ? `, ${project.site.state}` : ''}${project.site.zip_code ? ` ${project.site.zip_code}` : ''}`
          : 'No address',
        projectId: project.details?.installer_project_id || project.uuid?.slice(0, 8),
        defaultTab: 'overview' // Open to overview tab
      };

      // Call the onViewChatter callback from props
      if (params.context?.onViewChatter) {
        params.context.onViewChatter(projectInfo);
      }
    };

    return (
      <div style={{ display: 'flex', gap: '0', alignItems: 'center', justifyContent: 'center', marginLeft: '-8px' }}>
        {/* Chat Bubble Icon - Opens Notes Tab */}
        <button
          onClick={handleChatClick}
          title="View project notes"
          style={{
            padding: '0.09375rem 0.125rem',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            marginRight: '0',
          }}
        >
          <img
            src={speechBubbleIcon}
            alt="Notes"
            style={{
              width: '32px',
              height: '32px',
              opacity: 1,
              transition: 'all 0.2s',
              filter: 'brightness(0) saturate(100%) invert(46%) sepia(98%) saturate(1648%) hue-rotate(202deg) brightness(101%) contrast(93%)',
            }}
          />
        </button>

        {/* Eye Icon - Opens Overview Tab */}
        <button
          onClick={handleOverviewClick}
          title="View project overview"
          style={{
            padding: '0.09375rem 0.125rem',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            marginRight: '0.25rem',
          }}
        >
          <img
            src={eyeIcon}
            alt="Overview"
            style={{
              width: '32px',
              height: '32px',
              opacity: 1,
              transition: 'all 0.2s',
              filter: 'brightness(0) saturate(100%) invert(46%) sepia(98%) saturate(1648%) hue-rotate(202deg) brightness(101%) contrast(93%)',
            }}
          />
        </button>

        {/* Launch Button */}
        <LaunchButton onClick={handleLaunchClick} />
      </div>
    );
  };

  // Status cell renderer - editable dropdown
  const StatusDropdown = (params) => {
    const currentStatus = params.value ?? 0;
    const statusName = STATUS_MAP[currentStatus] || 'Unknown';
    const color = STATUS_COLORS[statusName] || 'var(--status-on-hold)';
    const projectUuid = params.data.uuid;

    const handleChange = (e) => {
      const newStatus = parseInt(e.target.value, 10);
      if (newStatus !== currentStatus) {
        handleStatusChange(projectUuid, newStatus, currentStatus);
      }
    };

    return (
      <select
        value={currentStatus}
        onChange={handleChange}
        style={{
          width: '100%',
          height: '100%',
          padding: '0 0.5rem',
          background: CSS_GRADIENTS.PANEL,
          border: 'none',
          borderRadius: '0.25rem',
          color: color,
          fontWeight: 600,
          fontSize: '0.875rem',
          cursor: 'pointer',
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23FD7332' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
          backgroundPosition: 'right 0.5rem center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '1em 1em',
          paddingRight: '2rem'
        }}
      >
        {STATUS_OPTIONS.map(option => (
          <option
            key={option.value}
            value={option.value}
            style={{
              background: 'var(--gray-800)',
              color: STATUS_COLORS[option.label] || 'var(--text-primary)',
              padding: '0.5rem'
            }}
          >
            {option.label}
          </option>
        ))}
      </select>
    );
  };

  // Column definitions
  const columnDefs = useMemo(() => {
    const baseCols = [];

    // Actions (first column) - pinned left, no header text, not resizable
    baseCols.push({
      headerName: '',
      field: '',
      width: 160,
      suppressSizeToFit: true,
      pinned: 'left',
      lockPosition: true,
      resizable: false,
      suppressMovable: true,
      cellRenderer: ActionButtonsRenderer,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
      headerClass: 'ag-header-cell-center',
      headerTooltip: 'Actions'
    });

    // Company (second column for superadmin)
    if (isSuperAdmin) {
      baseCols.push({
        headerName: 'Company',
        field: 'company.name',
        width: 160,
        headerTooltip: 'Company',
        tooltipField: 'company.name'
      });
    }

    // Customer (2nd/3rd column depending on superadmin)
    baseCols.push({
      headerName: 'Customer',
      valueGetter: (params) => {
        const first = params.data.details?.customer_first_name || '';
        const last = params.data.details?.customer_last_name || '';
        return `${last}, ${first}`;
      },
      width: 180,
      sortable: true,
      headerTooltip: 'Customer Name',
      tooltipValueGetter: (params) => {
        const first = params.data.details?.customer_first_name || '';
        const last = params.data.details?.customer_last_name || '';
        return `${last}, ${first}`;
      }
    });

    // Project ID
    baseCols.push({
      headerName: 'Project ID',
      field: 'details.installer_project_id',
      width: 130,
      cellRenderer: (params) => params.value || params.data.uuid.slice(0, 8),
      headerTooltip: 'Project ID',
      tooltipValueGetter: (params) => params.data.details?.installer_project_id || params.data.uuid
    });

    // Status
    baseCols.push({
      headerName: 'Status',
      field: 'completed_step',
      width: 140,
      cellRenderer: StatusDropdown,
      sortable: true,
      cellStyle: { padding: '0' },
      headerTooltip: 'Project Status'
    });

    // Address
    baseCols.push({
      headerName: 'Address',
      valueGetter: (params) => {
        const address = params.data.site?.address || '';
        const city = params.data.site?.city || '';
        return address ? `${address}, ${city}` : '';
      },
      width: 220,
      headerTooltip: 'Site Address',
      tooltipValueGetter: (params) => {
        const address = params.data.site?.address || '';
        const city = params.data.site?.city || '';
        return address ? `${address}, ${city}` : '';
      }
    });

    // Jurisdiction
    baseCols.push({
      headerName: 'Jurisdiction',
      field: 'site.jurisdiction',
      width: 140,
      headerTooltip: 'Jurisdiction',
      tooltipField: 'site.jurisdiction'
    });

    // Utility
    baseCols.push({
      headerName: 'Utility',
      field: 'site.utility',
      width: 120,
      sortable: true,
      headerTooltip: 'Utility Provider',
      tooltipField: 'site.utility'
    });

    // Proposal
    baseCols.push({
      headerName: 'Proposal',
      field: 'proposal_url',
      width: 100,
      cellRenderer: (params) => {
        if (!params.value) return '-';
        return `<a href="${params.value}" target="_blank" rel="noopener noreferrer" style="color: var(--color-link); text-decoration: underline;">View</a>`;
      },
      headerTooltip: 'Proposal Document'
    });

    // Signatures
    baseCols.push({
      headerName: 'Signatures',
      field: 'signatures_url',
      width: 110,
      cellRenderer: (params) => {
        if (!params.value) return '-';
        return `<a href="${params.value}" target="_blank" rel="noopener noreferrer" style="color: var(--color-link); text-decoration: underline;">View</a>`;
      },
      headerTooltip: 'Customer Signatures'
    });

    // Site Survey
    baseCols.push({
      headerName: 'Site Survey',
      field: 'site_survey_url',
      width: 110,
      cellRenderer: (params) => {
        if (!params.value) return '-';
        return `<a href="${params.value}" target="_blank" rel="noopener noreferrer" style="color: var(--color-link); text-decoration: underline;">View</a>`;
      },
      headerTooltip: 'Site Survey Document'
    });

    // Site Plan
    baseCols.push({
      headerName: 'Site Plan',
      field: 'site_plan_url',
      width: 100,
      cellRenderer: (params) => {
        if (!params.value) return '-';
        return `<a href="${params.value}" target="_blank" rel="noopener noreferrer" style="color: var(--color-link); text-decoration: underline;">View</a>`;
      },
      headerTooltip: 'Site Plan Document'
    });

    // Plan Set
    baseCols.push({
      headerName: 'Plan Set',
      field: 'plan_set_url',
      width: 100,
      cellRenderer: (params) => {
        if (!params.value) return '-';
        return `<a href="${params.value}" target="_blank" rel="noopener noreferrer" style="color: var(--color-link); text-decoration: underline;">View</a>`;
      },
      headerTooltip: 'Plan Set Document'
    });

    // Permits
    baseCols.push({
      headerName: 'Permits',
      field: 'permits_url',
      width: 100,
      cellRenderer: (params) => {
        if (!params.value) return '-';
        return `<a href="${params.value}" target="_blank" rel="noopener noreferrer" style="color: var(--color-link); text-decoration: underline;">View</a>`;
      },
      headerTooltip: 'Permits Document'
    });

    // Interconnection
    baseCols.push({
      headerName: 'Interconnection',
      field: 'interconnection_url',
      width: 130,
      cellRenderer: (params) => {
        if (!params.value) return '-';
        return `<a href="${params.value}" target="_blank" rel="noopener noreferrer" style="color: var(--color-link); text-decoration: underline;">View</a>`;
      },
      headerTooltip: 'Interconnection Agreement'
    });

    // HOA
    baseCols.push({
      headerName: 'HOA',
      field: 'hoa_url',
      width: 90,
      cellRenderer: (params) => {
        if (!params.value) return '-';
        return `<a href="${params.value}" target="_blank" rel="noopener noreferrer" style="color: var(--color-link); text-decoration: underline;">View</a>`;
      },
      headerTooltip: 'HOA Approval'
    });

    // Install
    baseCols.push({
      headerName: 'Install',
      field: 'install_url',
      width: 90,
      cellRenderer: (params) => {
        if (!params.value) return '-';
        return `<a href="${params.value}" target="_blank" rel="noopener noreferrer" style="color: var(--color-link); text-decoration: underline;">View</a>`;
      },
      headerTooltip: 'Installation Photos'
    });

    // Commission
    baseCols.push({
      headerName: 'Commission',
      field: 'commission_url',
      width: 110,
      cellRenderer: (params) => {
        if (!params.value) return '-';
        return `<a href="${params.value}" target="_blank" rel="noopener noreferrer" style="color: var(--color-link); text-decoration: underline;">View</a>`;
      },
      headerTooltip: 'Commission Documents'
    });

    // Inspection
    baseCols.push({
      headerName: 'Inspection',
      field: 'inspection_url',
      width: 110,
      cellRenderer: (params) => {
        if (!params.value) return '-';
        return `<a href="${params.value}" target="_blank" rel="noopener noreferrer" style="color: var(--color-link); text-decoration: underline;">View</a>`;
      },
      headerTooltip: 'Inspection Reports'
    });

    // PTO
    baseCols.push({
      headerName: 'PTO',
      field: 'pto_url',
      width: 90,
      cellRenderer: (params) => {
        if (!params.value) return '-';
        return `<a href="${params.value}" target="_blank" rel="noopener noreferrer" style="color: var(--color-link); text-decoration: underline;">View</a>`;
      },
      headerTooltip: 'Permission To Operate'
    });

    return baseCols;
  }, [isSuperAdmin]);

  // Map selectedStatus to completed_step value
  const STATUS_STEP_MAP = {
    all: null,
    sales: 0,
    site_survey: 1,
    design: [2, 3], // Includes both Design and Revisions
    permits: 4,
    install: 5,
    commissioning: 6,
    inspection: 7,
    pto: 8,
  };

  // Filter projects based on search and status
  const filteredProjects = useMemo(() => {
    let filtered = [...projectsData];

    // Filter by status
    if (selectedStatus !== 'all') {
      const stepValue = STATUS_STEP_MAP[selectedStatus];
      if (stepValue !== undefined && stepValue !== null) {
        // Handle array of step values (e.g., Design includes steps 2 and 3)
        if (Array.isArray(stepValue)) {
          filtered = filtered.filter(p => stepValue.includes(p.completed_step));
        } else {
          filtered = filtered.filter(p => p.completed_step === stepValue);
        }
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => {
        const customerName = `${p.details?.customer_first_name || ''} ${p.details?.customer_last_name || ''}`.toLowerCase();
        const projectId = (p.details?.installer_project_id || '').toLowerCase();
        const address = (p.site?.address || '').toLowerCase();
        const city = (p.site?.city || '').toLowerCase();
        const companyName = (p.company?.name || '').toLowerCase();

        return customerName.includes(query) ||
               projectId.includes(query) ||
               address.includes(query) ||
               city.includes(query) ||
               companyName.includes(query);
      });
    }

    return filtered;
  }, [projectsData, searchQuery, selectedStatus]);

  // Default column definitions for AG Grid
  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: false,
    resizable: true,
    suppressMovable: true
  }), []);

  if (loading) {
    return (
      <div className={styles.projectsOverviewContainer}>
        <div className={styles.emptyStateCenter}>
          <div className={styles.emptyStateIcon}>⏳</div>
          <p>Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.projectsOverviewContainer}>
      {/* Search Filter with New Project Button */}
      <div className={styles.filters}>
        <button
          onClick={onNewProject}
          className={`${styles.projectsNewButton} ${
            isNewProjectOpen ? styles.projectsNewButtonActive : styles.projectsNewButtonInactive
          }`}
          onMouseEnter={(e) => {
            if (isNewProjectOpen) {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(253, 115, 50, 0.4)';
            } else {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            if (isNewProjectOpen) {
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(253, 115, 50, 0.3)';
            } else {
              e.currentTarget.style.background = CSS_GRADIENTS.PANEL;
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }
          }}
        >
          <span className={styles.projectsNewButtonIcon}>+</span>
          <span>Project</span>
        </button>
        <input
          type="text"
          placeholder="Search by customer, project ID, address, or company..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`${styles.filterInput} ${styles.searchInputFlex}`}
        />
      </div>

      {/* Projects Table */}
      {filteredProjects.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>🔍</div>
          <h3 className={styles.emptyStateTitle}>No Projects Found</h3>
          <p className={styles.emptyStateDescription}>
            {searchQuery ? 'Try adjusting your search or filters' : 'No projects match the selected filters'}
          </p>
        </div>
      ) : (
        <div
          className={`${styles.agGridDark} ${styles.agGridContainer}`}
        >
          <AgGridReact
            ref={gridRef}
            rowData={filteredProjects}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            context={{ onViewChatter }}
            pagination={false}
            rowHeight={38}
            headerHeight={38}
            animateRows={true}
            domLayout="normal"
          />
        </div>
      )}
    </div>
  );
};

export default DrafterPortal;
