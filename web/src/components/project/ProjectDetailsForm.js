import React, { useState, useEffect } from 'react';
import styles from '../../styles/ProjectAdd.module.css';
import axios from '../../config/axios';
import AddressAutocomplete from '../common/AddressAutocomplete';
import { toast } from 'react-toastify';
import { triggerPlanAutomation, fetchTriggerSecret } from '../../utils/triggerPlanAutomation';
import logger from '../services/devLogger';

const STATUS_OPTIONS = [
  { label: 'Sales', value: '0' },
  { label: 'Survey', value: '1' },
  { label: 'Design', value: '2' },
  { label: 'Revisions', value: '3' },
  { label: 'Permits', value: '4' },
  { label: 'Install', value: '5' },
  { label: 'Commish', value: '6' },
  { label: 'Inspect', value: '7' },
  { label: 'PTO', value: '8' },
];

const US_STATES = [
  { label: 'Alabama', value: 'AL' },
  { label: 'Alaska', value: 'AK' },
  { label: 'Arizona', value: 'AZ' },
  { label: 'Arkansas', value: 'AR' },
  { label: 'California', value: 'CA' },
  { label: 'Colorado', value: 'CO' },
  { label: 'Connecticut', value: 'CT' },
  { label: 'Delaware', value: 'DE' },
  { label: 'Florida', value: 'FL' },
  { label: 'Georgia', value: 'GA' },
  { label: 'Hawaii', value: 'HI' },
  { label: 'Idaho', value: 'ID' },
  { label: 'Illinois', value: 'IL' },
  { label: 'Indiana', value: 'IN' },
  { label: 'Iowa', value: 'IA' },
  { label: 'Kansas', value: 'KS' },
  { label: 'Kentucky', value: 'KY' },
  { label: 'Louisiana', value: 'LA' },
  { label: 'Maine', value: 'ME' },
  { label: 'Maryland', value: 'MD' },
  { label: 'Massachusetts', value: 'MA' },
  { label: 'Michigan', value: 'MI' },
  { label: 'Minnesota', value: 'MN' },
  { label: 'Mississippi', value: 'MS' },
  { label: 'Missouri', value: 'MO' },
  { label: 'Montana', value: 'MT' },
  { label: 'Nebraska', value: 'NE' },
  { label: 'Nevada', value: 'NV' },
  { label: 'New Hampshire', value: 'NH' },
  { label: 'New Jersey', value: 'NJ' },
  { label: 'New Mexico', value: 'NM' },
  { label: 'New York', value: 'NY' },
  { label: 'North Carolina', value: 'NC' },
  { label: 'North Dakota', value: 'ND' },
  { label: 'Ohio', value: 'OH' },
  { label: 'Oklahoma', value: 'OK' },
  { label: 'Oregon', value: 'OR' },
  { label: 'Pennsylvania', value: 'PA' },
  { label: 'Rhode Island', value: 'RI' },
  { label: 'South Carolina', value: 'SC' },
  { label: 'South Dakota', value: 'SD' },
  { label: 'Tennessee', value: 'TN' },
  { label: 'Texas', value: 'TX' },
  { label: 'Utah', value: 'UT' },
  { label: 'Vermont', value: 'VT' },
  { label: 'Virginia', value: 'VA' },
  { label: 'Washington', value: 'WA' },
  { label: 'West Virginia', value: 'WV' },
  { label: 'Wisconsin', value: 'WI' },
  { label: 'Wyoming', value: 'WY' },
];

const ProjectDetailsForm = ({ onNext }) => {
  const [formData, setFormData] = useState({
    installer: '',
    projectID: `SFSD${Math.floor(Date.now() / 1000)}`,
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    status: '2',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [installersList, setInstallersList] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Get user data from session
    const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
    const isSuperAdmin = userData.isSuperAdmin === true;

    // Check if user is admin (server-verified only)
    const isAdminUser = isSuperAdmin;

    setIsAdmin(isAdminUser);

    // Fetch companies for admin users
    if (isAdminUser) {
      fetchCompanies();
    } else {
      // For regular users, set their company as installer
      const companyData = JSON.parse(sessionStorage.getItem('companyData') || '{}');
      if (companyData.name) {
        setFormData(prev => ({ ...prev, installer: companyData.name }));
      }
    }
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await axios.get('/companies/list-active');
      if (response.data.status === 'SUCCESS' && Array.isArray(response.data.data)) {
        const companies = response.data.data.map(company => ({
          label: company.name,
          value: company.name,
          uuid: company.uuid,
        }));
        setInstallersList(companies);
        // Don't auto-select - leave as "Select Installer" to prevent mistakes
      }
    } catch (error) {
      logger.error('Project', 'Error fetching companies:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error for this field if it has a value
    if (errors[name] && value.trim()) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleAddressSelect = (details) => {
    setFormData(prev => ({
      ...prev,
      address: details.address || '',
      city: details.city || '',
      state: details.state || '',
      zip: details.zip || '',
    }));

    // Clear errors for address fields that have values
    setErrors(prev => {
      const newErrors = { ...prev };
      if (details.address) delete newErrors.address;
      if (details.city) delete newErrors.city;
      if (details.state) delete newErrors.state;
      if (details.zip) delete newErrors.zip;
      return newErrors;
    });
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.installer.trim()) newErrors.installer = 'Installer is required';
    if (!formData.projectID.trim()) newErrors.projectID = 'Project ID is required';
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state) newErrors.state = 'State is required';
    if (!formData.zip.trim()) newErrors.zip = 'ZIP code is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      // Get company UUID
      const companyData = JSON.parse(sessionStorage.getItem('companyData') || '{}');
      let companyUuid = companyData.uuid;

      // For admin users, get selected company UUID
      if (isAdmin) {
        const selectedCompany = installersList.find(c => c.value === formData.installer);
        if (selectedCompany) {
          companyUuid = selectedCompany.uuid;
        }
      }

      if (!companyUuid) {
        throw new Error('Company information not found');
      }

      // Create project
      const createResponse = await axios.post('/project', {
        company_id: companyUuid,
        installer_name: formData.installer,
        installer_project_id: formData.projectID,
        customer_first_name: formData.firstName,
        customer_last_name: formData.lastName,
        completed_step: parseInt(formData.status, 10),
      });

      if (createResponse.data.status === 'SUCCESS' && createResponse.data.project) {
        const projectUuid = createResponse.data.project.uuid;

        // Save site information
        await axios.put(`/project/${projectUuid}/site-info`, {
          companyId: companyUuid,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zip,
          ahj: '',
          utility: '',
        });

        // Show success toast
        toast.success('Project created successfully!', {
          position: 'top-right',
          autoClose: 3000,
        });

        // Trigger automations (non-blocking)
        const triggerAutomations = async () => {
          try {
            // Fetch the secret token from the database
            const secretToken = await fetchTriggerSecret();

            // Get user UUID from sessionStorage
            const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
            const userUuid = userData.uuid || userData.id;

            const automationOptions = {
              companyUuid,
              userUuid,
              computerName: 'ServerComputer2', // For NewProject
            };

            // Trigger NewProject automation
            try {
              logger.log('Project', '🚀 Triggering NewProject automation for project:', projectUuid);
              await triggerPlanAutomation(
                projectUuid,
                secretToken,
                'NewProject',
                automationOptions
              );
              logger.log('Project', '✅ NewProject automation triggered successfully');
              toast.info('Project automation started', {
                position: 'top-right',
                autoClose: 2000,
              });
            } catch (err) {
              logger.warn('Project', '⚠️ NewProject trigger failed (non-blocking):', err);
              toast.warning('Project automation could not be started', {
                position: 'top-right',
                autoClose: 3000,
              });
            }

            // Trigger AHJ Lookup automation
            try {
              logger.log('Project', '🚀 Triggering AHJ Lookup for project:', projectUuid);
              await triggerPlanAutomation(
                projectUuid,
                secretToken,
                'AHJLookup',
                automationOptions
              );
              logger.log('Project', '✅ AHJ Lookup triggered successfully');
            } catch (err) {
              logger.warn('Project', '⚠️ AHJ Lookup trigger failed (non-blocking):', err);
            }
          } catch (error) {
            logger.error('Project', '❌ Failed to trigger automations:', error);
          }
        };

        // Fire automations in background (don't wait)
        triggerAutomations();

        // Reset form for next project
        const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
        const companyData = JSON.parse(sessionStorage.getItem('companyData') || '{}');
        const isSuperAdmin = userData.isSuperAdmin === true;

        // Check if user is admin (server-verified only)
        const isAdminUser = isSuperAdmin;

        // Reset form with appropriate installer value
        // For admin: reset to empty (Select Installer) to prevent mistakes
        // For regular users: keep their company name
        const resetInstaller = isAdminUser ? '' : (companyData.name || '');

        setFormData({
          installer: resetInstaller,
          projectID: `SFSD${Math.floor(Date.now() / 1000)}`,
          firstName: '',
          lastName: '',
          address: '',
          city: '',
          state: '',
          zip: '',
          status: '0',
        });

        // Clear any errors
        setErrors({});

        // Call onNext to notify parent component
        if (onNext) {
          onNext(projectUuid);
        }
      } else {
        throw new Error('Failed to create project');
      }
    } catch (error) {
      logger.error('Project', 'Error creating project:', error);
      toast.error(error.message || 'Failed to create project. Please try again.', {
        position: 'top-center',
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Installer */}
      <div className={styles.formGroup}>
        <label className={styles.label}>
          Installer<span className={styles.required}>*</span>
        </label>
        {isAdmin ? (
          <select
            name="installer"
            value={formData.installer}
            onChange={handleChange}
            className={`${styles.select} ${formData.installer !== '' ? styles.selectFilled : ''} ${errors.installer ? styles.inputError : ''}`}
            style={{ color: formData.installer === '' ? 'var(--gray-500)' : 'var(--gray-50)' }}
          >
            <option value="">Select Installer</option>
            {installersList.map(company => (
              <option key={company.uuid} value={company.value}>
                {company.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            name="installer"
            value={formData.installer}
            readOnly
            className={`${styles.input} ${styles.inputReadOnly}`}
          />
        )}
      </div>

      {/* Project ID */}
      <div className={styles.formGroup}>
        <label className={styles.label}>
          Installer Project ID<span className={styles.required}>*</span>
        </label>
        <input
          type="text"
          name="projectID"
          value={formData.projectID}
          onChange={handleChange}
          className={`${styles.input} ${errors.projectID ? styles.inputError : ''}`}
        />
      </div>

      {/* Customer Name - Side by Side */}
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Customer First Name<span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="First Name..."
            className={`${styles.input} ${errors.firstName ? styles.inputError : ''}`}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>
            Customer Last Name<span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Last Name..."
            className={`${styles.input} ${errors.lastName ? styles.inputError : ''}`}
          />
        </div>
      </div>

      {/* Address with Google Autocomplete */}
      <AddressAutocomplete
        value={formData.address}
        onChange={(value) => setFormData(prev => ({ ...prev, address: value }))}
        onAddressSelect={handleAddressSelect}
        error={errors.address}
      />

      {/* City, State, Zip - Envelope Layout */}
      <div className={styles.formRowThree}>
        <div className={styles.formGroup}>
          <label className={styles.label}>
            City<span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="City..."
            className={`${styles.input} ${errors.city ? styles.inputError : ''}`}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>
            State<span className={styles.required}>*</span>
          </label>
          <select
            name="state"
            value={formData.state}
            onChange={handleChange}
            className={`${styles.select} ${formData.state !== '' ? styles.selectFilled : ''} ${errors.state ? styles.inputError : ''}`}
            style={{ color: formData.state === '' ? 'var(--gray-500)' : 'var(--gray-50)' }}
          >
            <option value="">State</option>
            {US_STATES.map(state => (
              <option key={state.value} value={state.value}>
                {state.value}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>
            ZIP<span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            name="zip"
            value={formData.zip}
            onChange={handleChange}
            placeholder="ZIP..."
            className={`${styles.input} ${errors.zip ? styles.inputError : ''}`}
          />
        </div>
      </div>

      {/* Status */}
      <div className={styles.formGroup}>
        <label className={styles.label}>
          Set Status To<span className={styles.required}>*</span>
        </label>
        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          className={`${styles.select} ${styles.selectFilled}`}
          style={{ color: 'var(--gray-50)' }}
        >
          {STATUS_OPTIONS.map(status => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </div>

      {/* Error Message */}
      {Object.keys(errors).length > 0 && (
        <div className={styles.formErrorMessage}>
          Fill Required Fields
        </div>
      )}

      {/* Submit Button */}
      <div className={styles.buttonGroup}>
        <button
          type="submit"
          className={styles.buttonPrimary}
          disabled={loading}
        >
          {loading ? (
            <span>Creating...</span>
          ) : (
            <>
              <span className={styles.plusIcon}>+</span>
              <span className={styles.buttonText}>Create Project</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default ProjectDetailsForm;
