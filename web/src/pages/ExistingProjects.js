import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from 'reactstrap';
import { AgGridReact } from 'ag-grid-react';
import Moment from 'react-moment';
import Swal from 'sweetalert2';
import { LoadingSpinner } from '../components/ui';
import { useSocket } from '../hooks/useSocket';
import logger from '../services/devLogger';
import styles from './ExistingProjects.module.css';

// Table component wrapper
const TableComponent = ({ rowData, columnDefs, title }) => {
  const [searchText, setSearchText] = useState('');

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>{title}</h4>
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search..."
          className={`form-control ${styles.searchInput}`}
        />
      </div>
      <div className={`ag-theme-alpine ${styles.gridContainer}`}>
        <AgGridReact
          rowData={rowData}
          columnDefs={[
            {
              headerName: '#',
              valueGetter: 'node.rowIndex + 1',
              width: 50,
              sortable: false,
              filter: false,
            },
            ...columnDefs,
          ]}
          defaultColDef={{
            resizable: true,
            filter: false,
            sortable: true,
          }}
          pagination={true}
          quickFilterText={searchText}
        />
      </div>
    </div>
  );
};

const ExistingProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const { onAutomationComplete } = useSocket();

  const fetchProjects = async () => {
    setLoading(true);
    const userData = sessionStorage.getItem('userData') || '';
    let parsedData = null;

    if (userData !== '') {
      parsedData = JSON.parse(userData);
    }

    try {
      const response = await axios.get(
        `/api/projects/list?companyId=${parsedData?.company?.uuid}`
      );

      if (response.data.data && response.data.data.length > 0) {
        const projectData = [];
        response.data.data.map((project) => {
          projectData.push({
            projectId: project.uuid,
            installer: project.details.installer_name,
            customerName: `${project.details.customer_first_name} ${project.details.customer_last_name}`,
            address: '',
            status: project.is_draft === true ? 'DRAFT' : '',
            description: '',
            createdOn: project._created_at,
          });
        });
        setProjects([...projectData]);
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      logger.error('Project', 'Error fetching projects:', error);
    }
  };

  const handleDelete = async (e, rowData) => {
    e.preventDefault();
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you really want to delete this record?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, cancel!',
      customClass: {
        confirmButton: 'bg-success',
        cancelButton: 'custom-cancel-button',
      },
    });

    if (result.isConfirmed) {
      // Delete logic would go here
      logger.log('Project', 'Delete project:', rowData);
    }
  };

  const columnDefs = [
    {
      field: 'projectId',
      headerName: 'Project Id',
      sortable: true,
      flex: 1,
    },
    {
      field: 'installer',
      headerName: 'Installer',
      sortable: true,
      flex: 1,
    },
    {
      field: 'customerName',
      headerName: 'Customer Name',
      sortable: true,
    },
    {
      field: 'address',
      headerName: 'Address',
      sortable: true,
      flex: 2,
    },
    {
      field: 'description',
      headerName: 'Description',
      sortable: true,
      flex: 2,
    },
    {
      field: 'createdOn',
      headerName: 'Created On',
      sortable: false,
      flex: 1.2,
      cellRenderer: (params) => (
        <Moment format="MM/DD/YYYY">{params.value}</Moment>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      sortable: false,
      width: 100,
      flex: 1,
      cellRenderer: (params) => (
        <div className="h-100 d-flex align-items-center py-2">
          {params.value === 'DRAFT' && (
            <span className="status-draft">Draft</span>
          )}
        </div>
      ),
    },
    {
      field: 'action',
      headerName: 'Action',
      sortable: false,
      width: 100,
      flex: 1,
      cellRenderer: (params) => (
        <div className="h-100 d-flex align-items-center">
          <Button
            color="danger"
            className={`btn-icon ${styles.deleteButton}`}
            onClick={(e) => handleDelete(e, params.data)}
          >
            <i className="ri-delete-bin-5-line"></i>
          </Button>
        </div>
      ),
    },
  ];

  useEffect(() => {
    fetchProjects();
  }, []);

  /**
   * Listen for automation:complete (new project created via webhook)
   *
   * IMPORTANT: This listener requires the backend to emit to the USER ROOM.
   * The socket connection in useSocket.js joins the user room with:
   *   socket.emit('join:user', userData.uuid)
   *
   * Backend must emit like this:
   *   io.to(`user:${userId}`).emit('automation:complete', { ... })
   *
   * NOT like this (global emit won't work):
   *   io.emit('automation:complete', { ... })
   *
   * Check browser console for:
   *   [Socket] Connected: <socket-id>
   *   [Socket] Joined user room: <user-uuid>
   *   [Socket] Registering automation:complete listener
   *   🎉 automation:complete EVENT RECEIVED: <data>
   */
  useEffect(() => {
    console.log('🔧 ExistingProjects: Setting up automation:complete listener');
    console.log('🔧 onAutomationComplete function:', typeof onAutomationComplete);
    logger.log('Project', '[DEBUG] Setting up automation:complete listener');

    const cleanup = onAutomationComplete((data) => {
      logger.log('Project', '🎉 automation:complete EVENT RECEIVED:', data);
      console.log('🎉 automation:complete EVENT RECEIVED:', data);
      // Refresh projects list when new project is created
      fetchProjects();
    });

    console.log('🔧 Cleanup function returned:', typeof cleanup);
    logger.log('Project', '[DEBUG] automation:complete listener registered');
    console.log('✅ ExistingProjects: automation:complete listener registered successfully');

    return () => {
      console.log('🔧 ExistingProjects: Cleaning up automation:complete listener');
      cleanup();
    };
  }, [onAutomationComplete, fetchProjects]);

  return (
    <div className="page-content">
      {loading && <LoadingSpinner />}
      <div className="existing-project-wrapper">
        <TableComponent
          rowData={projects}
          columnDefs={columnDefs}
          title="Existing Projects"
        />
      </div>
    </div>
  );
};

export default ExistingProjects;
