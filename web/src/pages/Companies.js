import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Input } from 'reactstrap';
import { AgGridReact } from 'ag-grid-react';
import Moment from 'react-moment';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import { LoadingSpinner } from '../components/ui';
import logger from '../services/devLogger';
import styles from './Companies.module.css';

// Table component wrapper (same as ExistingProjects)
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

const Companies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/companies/list');
      setLoading(false);

      if (response && response.data && response.data.data.length > 0) {
        const companyData = [];
        response.data.data.map((item) => {
          companyData.push({
            companyName: item.company.name,
            name: `${item.user.firstName} ${item.user.lastName}`,
            email: item.user.email,
            address: `${item.company.address ? item.company.address : ''} ${
              item.company.city ? item.company.city : ''
            } ${item.company.state ? `, ${item.company.state}` : ''} ${
              item.company.zipCode ? `, ${item.company.zipCode}` : ''
            }`,
            status: item.user.status,
            companyUuid: item.company.uuid,
            createdDate: item.company.created_at,
          });
        });
        setCompanies([...companyData]);
      }
    } catch (error) {
      setLoading(false);
      logger.log('General', 'error ...', error);
    }
  };

  const handleStatusChange = async (e, rowData) => {
    e.preventDefault();
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to change the status?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, change it!',
      cancelButtonText: 'No, cancel!',
      customClass: {
        confirmButton: 'bg-success',
        cancelButton: 'custom-cancel-button',
      },
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        await axios.patch('/api/companies/accept-reject', {
          companyUuid: rowData.companyUuid,
          isVerified: rowData.status !== 2,
        });
        setLoading(false);
        fetchCompanies();
      } catch (error) {
        setLoading(false);
        let errorMessage = 'Request Failed';
        if (error.response && error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
        toast(`Error ! ${errorMessage}`, {
          position: 'top-right',
          hideProgressBar: true,
          closeOnClick: false,
          className: 'bg-danger text-white',
        });
      }
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
      setLoading(true);
      try {
        await axios.delete(`/api/companies/delete/${rowData.companyUuid}`);
        setLoading(false);
        fetchCompanies();
      } catch (error) {
        setLoading(false);
        let errorMessage = 'Request Failed';
        if (error.response && error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
        toast(`Error ! ${errorMessage}`, {
          position: 'top-right',
          hideProgressBar: true,
          closeOnClick: false,
          className: 'bg-danger text-white',
        });
      }
    }
  };

  const columnDefs = [
    {
      field: 'companyName',
      headerName: 'Company Name',
      sortable: true,
      flex: 1,
    },
    {
      field: 'name',
      headerName: 'Name',
      sortable: true,
      flex: 1,
    },
    {
      field: 'email',
      headerName: 'Email',
      sortable: true,
    },
    {
      field: 'address',
      headerName: 'Address',
      sortable: true,
      flex: 2,
    },
    {
      field: 'createdDate',
      headerName: 'Created Date',
      sortable: false,
      flex: 1,
      cellRenderer: (params) => (
        <Moment format="MM/DD/YYYY">{params.value}</Moment>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      sortable: false,
      width: 100,
      flex: 0.6,
      cellRenderer: (params) => (
        <>
          <div className="form-check form-switch form-switch-success h-100 d-flex align-items-center">
            <Input
              className="form-check-input"
              type="checkbox"
              role="switch"
              id={`flexSwitchCheckChecked-${params.data}`}
              checked={params.data.status === 2}
              onChange={(e) => handleStatusChange(e, params.data)}
            />
          </div>
        </>
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
    fetchCompanies();
  }, []);

  return (
    <div className="page-content">
      {loading && <LoadingSpinner />}
      <TableComponent rowData={companies} columnDefs={columnDefs} title="Companies" />
    </div>
  );
};

export default Companies;
