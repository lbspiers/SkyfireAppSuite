import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import styles from './ProjectInformationForm.module.css';
import axios from '../../config/axios';
import AddressAutocomplete from '../common/AddressAutocomplete';
import { toast } from 'react-toastify';
import { EquipmentRow, FormFieldRow, TableDropdown, Button, LoadingSpinner, Alert } from '../ui';
import logger from '../../services/devLogger';
import documentService from '../../services/documentService';
import { isCurrentUserAdminAsync } from '../../utils/adminUtils';
import UtilityValidationModal from '../modals/UtilityValidationModal';
import { isEnergyAidCompany, getDocumentTypeForCompany, getUploadLabelForCompany } from '../../utils/companyUtils';

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

const ProjectInformationForm = forwardRef(({ onNext, hideSubmitButton = false, onValidityChange }, ref) => {
  const [formData, setFormData] = useState({
    installer: '',
    projectID: `SFSD${Math.floor(Date.now() / 1000)}`,
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    houseSqFt: '',
    projectValuation: '',
    status: '2',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [installersList, setInstallersList] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // Upload states
  const [salesProposal, setSalesProposal] = useState(null);
  const [supportingDocs, setSupportingDocs] = useState([]);
  const [uploadingProposal, setUploadingProposal] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);

  // EquipmentRow expansion states
  const [proposalExpanded, setProposalExpanded] = useState(false);
  const [projectInfoExpanded, setProjectInfoExpanded] = useState(true);
  const [customerExpanded, setCustomerExpanded] = useState(true);
  const [locationExpanded, setLocationExpanded] = useState(false);
  const [documentsExpanded, setDocumentsExpanded] = useState(false);

  // Utility modal state
  const [showUtilityModal, setShowUtilityModal] = useState(false);
  const [pendingZipCode, setPendingZipCode] = useState(null);

  // EnergyAid company detection
  const [isEnergyAid, setIsEnergyAid] = useState(false);

  // Check if form is valid
  const isFormValid = () => {
    const baseValid = (
      formData.installer?.trim() &&
      formData.projectID?.trim() &&
      formData.firstName?.trim() &&
      formData.lastName?.trim() &&
      formData.address?.trim() &&
      formData.city?.trim() &&
      formData.state &&
      formData.zip?.trim()
    );

    // California requires House Square Ft
    if (formData.state === 'CA') {
      return baseValid && formData.houseSqFt?.trim();
    }

    return baseValid;
  };

  // Expose submit function and validation to parent via ref
  useImperativeHandle(ref, () => ({
    submitForm: () => {
      handleSubmit(new Event('submit'));
    },
    isValid: isFormValid
  }));

  useEffect(() => {
    // Check admin status and initialize form
    const initializeForm = async () => {
      // Verify admin status with backend
      const isAdminUser = await isCurrentUserAdminAsync();
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

        // Check if EnergyAid company (for assessment upload mode)
        const energyAidDetected = isEnergyAidCompany(companyData.id, companyData.uuid, companyData.name);
        setIsEnergyAid(energyAidDetected);

        if (energyAidDetected) {
          logger.log('Project', '🔋 EnergyAid company detected - using assessment upload mode');
        }
      }
    };

    initializeForm();
  }, []);

  // Track form validity and notify parent
  useEffect(() => {
    if (onValidityChange) {
      onValidityChange(isFormValid());
    }
  }, [formData, onValidityChange]);

  const fetchCompanies = async () => {
    try {
      const response = await axios.get('/companies/list-active');
      if (response.data.status === 'SUCCESS' && Array.isArray(response.data.data)) {
        const companies = response.data.data.map(company => ({
          label: company.name,
          value: company.name,
          uuid: company.uuid,
          id: company.id, // Include company ID for automation API
        }));
        setInstallersList(companies);
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

    // Trigger utility modal if zip code is present
    if (details.zip && details.zip.length >= 5) {
      setPendingZipCode(details.zip);
      setShowUtilityModal(true);
    }
  };

  const handleUtilitySave = (utilityData) => {
    logger.log('ProjectInformationForm', 'Utility saved:', utilityData);

    // Handle custom utility
    if (utilityData.isCustom) {
      setFormData(prev => ({
        ...prev,
        utility: utilityData.abbreviation
      }));
      toast.success(`Custom utility "${utilityData.abbreviation}" added. Admin will review.`);
    } else {
      // Standard utility
      setFormData(prev => ({
        ...prev,
        utility: utilityData
      }));
    }

    setShowUtilityModal(false);
    setPendingZipCode(null);
  };

  // Handle sales proposal file selection
  const handleSalesProposalSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      logger.log('Project', 'Sales proposal selected:', file.name, file.type);
      setSalesProposal(file);
      setTimeout(() => {
        e.target.value = '';
      }, 100);
    }
  };

  // Handle supporting documents selection
  const handleSupportingDocsSelect = (e) => {
    const files = Array.from(e.target.files);
    setSupportingDocs(prev => [...prev, ...files]);
    e.target.value = '';
  };

  // Remove sales proposal
  const handleRemoveSalesProposal = () => {
    setSalesProposal(null);
    const fileInput = document.getElementById('salesProposalInput');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Remove supporting document
  const handleRemoveSupportingDoc = (index) => {
    setSupportingDocs(prev => prev.filter((_, i) => i !== index));
  };

  // Drag and drop handlers for sales proposal
  const handleSalesProposalDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleSalesProposalDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    logger.log('Project', 'File dropped:', file?.name, file?.type);
    if (file && file.type === 'application/pdf') {
      logger.log('Project', 'Valid PDF dropped:', file.name);
      setSalesProposal(file);
    } else {
      logger.log('Project', 'Invalid file type - only PDF accepted');
    }
  };

  // Drag and drop handlers for supporting documents
  const handleSupportingDocsDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleSupportingDocsDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    setSupportingDocs(prev => [...prev, ...files]);
  };

  // Helper to upload file to S3 using presigned URL
  const uploadFileToS3 = async (file, folder = 'sales-proposals') => {
    try {
      // Get presigned URL
      const urlResponse = await axios.post('/upload/presigned-url', {
        fileName: file.name,
        fileType: file.type,
        folder: folder
      });

      const { upload_url, key } = urlResponse.data;

      // Upload to S3
      await fetch(upload_url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      });

      // Return the S3 URL
      return `https://skyfire-media-files.s3.amazonaws.com/${key}`;
    } catch (error) {
      logger.error('Project', 'Failed to upload to S3:', error);
      throw new Error('Failed to upload file to S3');
    }
  };

  // Helper to poll job status
  const pollJobStatus = async (jobId, maxAttempts = 60) => {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 sec intervals

      const response = await axios.get(`/automation/status/${jobId}`);
      const status = response.data;

      logger.log('Project', `Polling job ${jobId} - Status: ${status.status}`);

      if (status.status === 'success' || status.status === 'failed') {
        return status;
      }
    }
    throw new Error('Processing timeout - exceeded 2 minutes');
  };

  // Upload sales proposal and autofill form
  const handleUploadProposal = async () => {
    if (!salesProposal) return;

    // If project already exists, use old upload method
    if (formData.uuid) {
      setUploadingProposal(true);
      try {
        logger.log('Project', 'Uploading sales proposal to existing project:', salesProposal.name);

        await documentService.documents.upload(formData.uuid, salesProposal, {
          documentType: 'sales_proposal'
        });

        toast.success('Sales proposal uploaded successfully!', {
          position: 'top-right',
          autoClose: 3000,
        });

        setSalesProposal(null);
      } catch (error) {
        logger.error('Project', 'Error uploading sales proposal:', error);
        toast.error('Failed to upload sales proposal: ' + error.message, {
          position: 'top-right',
          autoClose: 3000,
        });
      } finally {
        setUploadingProposal(false);
      }
      return;
    }

    // New flow: Upload to S3 and call automation API for autofill
    setUploadingProposal(true);
    try {
      logger.log('Project', 'Starting autofill from proposal:', salesProposal.name);

      // Step 1: Get company_id from installer dropdown or session
      const companyData = JSON.parse(sessionStorage.getItem('companyData') || '{}');
      const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');

      let companyId = companyData.id;

      // For admin users, get company ID from selected installer
      if (isAdmin && formData.installer) {
        const selectedCompany = installersList.find(c => c.value === formData.installer);
        logger.log('Project', 'Selected installer:', formData.installer);
        logger.log('Project', 'Found company:', selectedCompany);

        if (selectedCompany?.id) {
          companyId = selectedCompany.id;
          logger.log('Project', 'Using selected company ID:', companyId);
        } else {
          logger.warn('Project', 'No company ID found for selected installer, using session company');
        }
      }

      if (!companyId) {
        throw new Error('Company information not found. Please select an installer.');
      }

      logger.log('Project', 'Using company ID:', companyId);

      // Determine document type - EnergyAid uses 'assessment', others use 'sales_proposal'
      const selectedCompany = isAdmin
        ? installersList.find(c => c.value === formData.installer)
        : null;
      const effectiveCompanyId = selectedCompany?.id || companyId;
      const effectiveCompanyName = selectedCompany?.label || companyData.name;
      const documentType = isEnergyAid || isEnergyAidCompany(effectiveCompanyId, null, effectiveCompanyName)
        ? 'assessment'
        : 'sales_proposal';

      logger.log('Project', `Using document_type: ${documentType} for company: ${effectiveCompanyName}`);

      // Step 2: Upload PDF to S3
      toast.info(isEnergyAid ? 'Uploading assessment to S3...' : 'Uploading proposal to S3...', {
        position: 'top-right',
        autoClose: 2000,
      });
      const s3Url = await uploadFileToS3(salesProposal, 'sales-proposals');
      logger.log('Project', 'Proposal uploaded to S3:', s3Url);

      // Step 3: Call automation API
      toast.info(isEnergyAid ? 'Processing assessment with AI...' : 'Processing proposal with AI...', {
        position: 'top-right',
        autoClose: 3000,
      });

      const automationResponse = await axios.post('/automation/upload', {
        company_id: effectiveCompanyId,
        user_id: userData.id,
        file_url: s3Url,
        document_type: documentType,
        company_name: effectiveCompanyName || 'Unknown'
      });

      const result = automationResponse.data;
      logger.log('Project', 'Automation job started:', result);

      if (result.status === 'accepted' && result.job_id) {
        // Step 4: Poll for completion
        toast.info(isEnergyAid ? 'Scraping assessment data... This may take up to 2 minutes.' : 'Scraping proposal data... This may take up to 2 minutes.', {
          position: 'top-right',
          autoClose: 5000,
        });

        const jobResult = await pollJobStatus(result.job_id);

        if (jobResult.status === 'failed') {
          throw new Error(jobResult.error_message || 'Failed to process proposal');
        }

        if (jobResult.status === 'success' && jobResult.project_data) {
          // Step 5: Populate form with scraped data
          const data = jobResult.project_data;
          logger.log('Project', 'Autofill data received:', data);

          const nameParts = (data.customer_name || '').split(' ');

          setFormData(prev => ({
            ...prev,
            firstName: nameParts[0] || prev.firstName,
            lastName: nameParts.slice(1).join(' ') || prev.lastName,
            address: data.address_street || prev.address,
            city: data.address_city || prev.city,
            state: data.address_state || prev.state,
            zip: data.address_zip || prev.zip,
          }));

          // NEW: Store equipment data for later use (after project creation)
          // Equipment comes back in project_data for assessments
          if (data.panel_make || data.inverter_make || data.battery_make) {
            const equipmentData = {
              panel_make: data.panel_make || null,
              panel_model: data.panel_model || null,
              panel_quantity: data.panel_quantity || null,
              inverter_make: data.inverter_make || null,
              inverter_model: data.inverter_model || null,
              battery_make: data.battery_make || null,
              battery_model: data.battery_model || null,
              battery_quantity: data.battery_quantity || null,
            };

            // Store in sessionStorage for use after project creation
            sessionStorage.setItem('pendingEquipmentData', JSON.stringify(equipmentData));
            logger.log('Project', '⚡ Equipment data stored for auto-population:', equipmentData);

            toast.info('Equipment data extracted! Will be auto-filled after project creation.', {
              position: 'top-right',
              autoClose: 4000,
            });
          }

          // NEW: Store photo URLs for post-creation import (assessments only)
          if (jobResult.photo_urls && jobResult.photo_urls.length > 0) {
            const photoData = {
              photo_urls: jobResult.photo_urls,
              photos_uploaded: jobResult.photos_uploaded || jobResult.photo_urls.length,
            };

            sessionStorage.setItem('pendingPhotoData', JSON.stringify(photoData));
            logger.log('Project', '📸 Photo URLs stored for import:', photoData);

            toast.info(`${photoData.photos_uploaded} photos extracted! Will be imported after project creation.`, {
              position: 'top-right',
              autoClose: 4000,
            });
          }

          // Expand relevant sections
          setProjectInfoExpanded(true);
          setCustomerExpanded(true);
          setLocationExpanded(true);

          const successMessage = documentType === 'assessment'
            ? 'Form autofilled from assessment! Review and create project.'
            : 'Form autofilled from proposal! Review and create project.';

          toast.success(successMessage, {
            position: 'top-right',
            autoClose: 5000,
          });

          setSalesProposal(null);
        } else {
          throw new Error('No project data returned from automation');
        }
      } else {
        throw new Error('Automation job not accepted');
      }
    } catch (error) {
      logger.error('Project', 'Autofill failed:', error);

      let errorMessage = 'Failed to process proposal';
      if (error.response?.data?.detail) {
        errorMessage += `: ${error.response.data.detail}`;
      } else if (error.message) {
        errorMessage += `: ${error.message}`;
      }

      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 5000,
      });
    } finally {
      setUploadingProposal(false);
    }
  };

  // Upload supporting documents
  const handleUploadDocs = async () => {
    if (supportingDocs.length === 0) return;

    if (!formData.uuid) {
      toast.info('Supporting documents will be uploaded after project creation', {
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }

    setUploadingDocs(true);
    try {
      logger.log('Project', 'Uploading supporting documents:', supportingDocs.map(d => d.name));

      await documentService.documents.uploadBulk(formData.uuid, supportingDocs, {
        documentType: 'supporting'
      });

      toast.success('Supporting documents uploaded successfully!', {
        position: 'top-right',
        autoClose: 3000,
      });

      setSupportingDocs([]);
    } catch (error) {
      logger.error('Project', 'Error uploading documents:', error);
      toast.error('Failed to upload documents: ' + error.message, {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      setUploadingDocs(false);
    }
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

    // California requires House Square Ft
    if (formData.state === 'CA' && !formData.houseSqFt.trim()) {
      newErrors.houseSqFt = 'House Square Ft is required for California';
    }

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

      // Build payload for new consolidated endpoint
      const payload = {
        company_id: companyUuid,
        installer_name: formData.installer,
        installer_project_id: formData.projectID,
        customer_first_name: formData.firstName,
        customer_last_name: formData.lastName,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zip,
        apn: formData.apn || '',
        utility: formData.utility || '',
        completed_step: parseInt(formData.status, 10) || 0,
      };

      // Add optional fields only if they have values
      if (formData.houseSqFt) {
        payload.house_sqft = formData.houseSqFt;
      }
      if (formData.projectValuation) {
        payload.project_valuation = parseInt(formData.projectValuation, 10);
      }

      logger.log('Project', 'Creating project with automation:', payload);

      // Create project with automation (single call)
      const createResponse = await axios.post('/project/with-automation', payload);

      if (createResponse.data.status === 'SUCCESS' && createResponse.data.project) {
        const projectUuid = createResponse.data.project.uuid;
        const automation = createResponse.data.automation;

        logger.log('Project', 'Project created successfully:', createResponse.data.project);
        logger.log('Project', 'Automation completed:', automation);

        // Show success with automation details
        if (automation?.ahj) {
          toast.success(`Project created! AHJ: ${automation.ahj}`, {
            position: 'top-right',
            autoClose: 4000,
          });
        } else {
          toast.success('Project created successfully!', {
            position: 'top-right',
            autoClose: 3000,
          });
        }

        // Import photos from assessment if available
        const pendingPhotoData = sessionStorage.getItem('pendingPhotoData');
        if (pendingPhotoData) {
          try {
            const photoData = JSON.parse(pendingPhotoData);
            logger.log('Project', '📸 Importing photos for project:', projectUuid);

            // Call bulk import endpoint
            await axios.post(`/project/${projectUuid}/photos/bulk-import`, {
              photo_urls: photoData.photo_urls,
            });

            logger.log('Project', `✅ Successfully imported ${photoData.photos_uploaded} photos`);
            toast.success(`${photoData.photos_uploaded} photos imported to project gallery!`, {
              position: 'top-right',
              autoClose: 4000,
            });

            // Clear the pending photo data
            sessionStorage.removeItem('pendingPhotoData');
          } catch (photoError) {
            logger.error('Project', 'Failed to import photos:', photoError);
            toast.warning('Project created but failed to import photos. You can upload them manually.', {
              position: 'top-right',
              autoClose: 5000,
            });
            // Don't block project creation if photo import fails
            sessionStorage.removeItem('pendingPhotoData');
          }
        }

        // Reset form
        const resetInstaller = isAdmin ? '' : (companyData.name || '');

        setFormData({
          installer: resetInstaller,
          projectID: `SFSD${Math.floor(Date.now() / 1000)}`,
          firstName: '',
          lastName: '',
          address: '',
          city: '',
          state: '',
          zip: '',
          houseSqFt: '',
          projectValuation: '',
          status: '0',
        });

        setErrors({});

        if (onNext) {
          onNext(projectUuid);
        }
      } else {
        throw new Error('Failed to create project');
      }
    } catch (error) {
      logger.error('Project', 'Error creating project:', error);

      if (error.response?.status === 409) {
        toast.error('A project with this Installer Project ID already exists. Please use a unique ID.', {
          position: 'top-center',
          autoClose: 5000,
        });
      } else {
        toast.error(error.response?.data?.message || 'Failed to create project. Please try again.', {
          position: 'top-center',
          autoClose: 4000,
        });
      }
      return;
    } finally {
      setLoading(false);
    }
  };

  // Generate subtitles for collapsed state
  const getProposalSubtitle = () => {
    if (salesProposal) return salesProposal.name;
    return 'Optional';
  };

  const getProjectInfoSubtitle = () => {
    const parts = [];
    if (formData.installer) parts.push(formData.installer);
    if (formData.projectID) parts.push(formData.projectID);
    if (formData.projectValuation) parts.push(`$${parseInt(formData.projectValuation).toLocaleString()}`);
    return parts.length > 0 ? parts.join(' • ') : null;
  };

  const getCustomerSubtitle = () => {
    const parts = [];
    if (formData.firstName) parts.push(formData.firstName);
    if (formData.lastName) parts.push(formData.lastName);
    return parts.length > 0 ? parts.join(' ') : null;
  };

  const getLocationSubtitle = () => {
    const parts = [];
    if (formData.address) parts.push(formData.address);
    if (formData.city) parts.push(formData.city);
    if (formData.state) parts.push(formData.state);
    if (formData.zip) parts.push(formData.zip);
    if (formData.houseSqFt) parts.push(`${formData.houseSqFt} sqft`);
    return parts.length > 0 ? parts.join(', ') : null;
  };

  const getDocumentsSubtitle = () => {
    if (supportingDocs.length > 0) {
      return `${supportingDocs.length} file${supportingDocs.length !== 1 ? 's' : ''}`;
    }
    return 'Optional';
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {/* Upload Sales Proposal Section */}
      <EquipmentRow
        title={isEnergyAid ? "Upload Assessment" : "Upload Sales Proposal"}
        subtitle={getProposalSubtitle()}
        initiallyExpanded={proposalExpanded}
        expanded={proposalExpanded}
        onToggle={() => setProposalExpanded(!proposalExpanded)}
      >
        <div className={styles.uploadSection}>
          <input
            type="file"
            id="salesProposalInput"
            accept=".pdf"
            onChange={handleSalesProposalSelect}
            className={styles.hiddenInput}
          />

          <label
            htmlFor="salesProposalInput"
            className={styles.uploadArea}
            onDragOver={handleSalesProposalDragOver}
            onDrop={handleSalesProposalDrop}
          >
            <span className={styles.uploadText}>
              {salesProposal ? salesProposal.name : 'Click to Upload PDF'}
            </span>
            {salesProposal && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  handleRemoveSalesProposal();
                }}
                className={styles.removeButton}
              >
                ✕
              </button>
            )}
          </label>

          <Button
            variant={salesProposal ? 'primary' : 'secondary'}
            onClick={handleUploadProposal}
            disabled={!salesProposal || uploadingProposal}
            loading={uploadingProposal}
          >
            {isEnergyAid ? 'Autofill from Assessment' : 'Autofill from Proposal'}
          </Button>

          {uploadingProposal && (
            <div className={styles.loadingRow}>
              <LoadingSpinner size="md" />
              <span className={styles.loadingText}>
                {isEnergyAid ? 'Scraping assessment data...' : 'Scraping proposal data...'}
              </span>
            </div>
          )}
        </div>
      </EquipmentRow>

      {/* OR Divider */}
      <div className={styles.divider}>
        <div className={styles.dividerLine} />
        <span className={styles.dividerText}>OR</span>
        <div className={styles.dividerLine} />
      </div>

      {/* Project Information Section */}
      <EquipmentRow
        title="Project Information"
        subtitle={getProjectInfoSubtitle()}
        initiallyExpanded={projectInfoExpanded}
        expanded={projectInfoExpanded}
        onToggle={() => setProjectInfoExpanded(!projectInfoExpanded)}
      >
        {isAdmin ? (
          <TableDropdown
            label="Installer"
            value={formData.installer}
            onChange={(value) => handleChange({ target: { name: 'installer', value } })}
            options={installersList}
            placeholder="Select Installer"
          />
        ) : (
          <FormFieldRow label="Installer">
            <input
              type="text"
              name="installer"
              value={formData.installer}
              readOnly
              className={styles.inputReadOnly}
            />
          </FormFieldRow>
        )}

        <FormFieldRow label="Installer Project ID">
          <input
            type="text"
            name="projectID"
            value={formData.projectID}
            onChange={handleChange}
            className={styles.input}
          />
        </FormFieldRow>

        <FormFieldRow label="Project Valuation ($)">
          <input
            type="text"
            inputMode="numeric"
            name="projectValuation"
            value={formData.projectValuation}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, '');
              handleChange({ target: { name: 'projectValuation', value } });
            }}
            placeholder="1,000 - 100,000"
            className={styles.input}
          />
        </FormFieldRow>

        <TableDropdown
          label="Set Status To"
          value={formData.status}
          onChange={(value) => handleChange({ target: { name: 'status', value } })}
          options={STATUS_OPTIONS}
        />
      </EquipmentRow>

      {/* Customer Section */}
      <EquipmentRow
        title="Customer"
        subtitle={getCustomerSubtitle()}
        initiallyExpanded={customerExpanded}
        expanded={customerExpanded}
        onToggle={() => setCustomerExpanded(!customerExpanded)}
      >
        <FormFieldRow label="First Name">
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="First Name..."
            className={styles.input}
          />
        </FormFieldRow>

        <FormFieldRow label="Last Name" noBorder>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Last Name..."
            className={styles.input}
          />
        </FormFieldRow>
      </EquipmentRow>

      {/* Location Section */}
      <EquipmentRow
        title="Location"
        subtitle={getLocationSubtitle()}
        initiallyExpanded={locationExpanded}
        expanded={locationExpanded}
        onToggle={() => setLocationExpanded(!locationExpanded)}
      >
        <FormFieldRow label="Address">
          <AddressAutocomplete
            value={formData.address}
            onChange={(value) => setFormData(prev => ({ ...prev, address: value }))}
            onAddressSelect={handleAddressSelect}
            error={errors.address}
            className={styles.input}
          />
        </FormFieldRow>

        <FormFieldRow label="City">
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="City..."
            className={styles.input}
          />
        </FormFieldRow>

        <TableDropdown
          label="State"
          value={formData.state}
          onChange={(value) => handleChange({ target: { name: 'state', value } })}
          options={US_STATES}
          placeholder="State"
        />

        <FormFieldRow label="ZIP">
          <input
            type="text"
            name="zip"
            value={formData.zip}
            onChange={handleChange}
            placeholder="ZIP..."
            className={styles.input}
          />
        </FormFieldRow>

        <FormFieldRow label={`House Square Ft${formData.state === 'CA' ? ' *' : ''}`} noBorder>
          <input
            type="text"
            inputMode="numeric"
            name="houseSqFt"
            value={formData.houseSqFt}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, '');
              handleChange({ target: { name: 'houseSqFt', value } });
            }}
            placeholder={formData.state === 'CA' ? 'Required for California' : 'Optional'}
            className={`${styles.input} ${errors.houseSqFt ? styles.inputError : ''}`}
          />
        </FormFieldRow>
      </EquipmentRow>

      {/* Documents Section */}
      <EquipmentRow
        title="Documents"
        subtitle={getDocumentsSubtitle()}
        initiallyExpanded={documentsExpanded}
        expanded={documentsExpanded}
        onToggle={() => setDocumentsExpanded(!documentsExpanded)}
      >
        <div className={styles.uploadSection}>
          <input
            type="file"
            id="supportingDocsInput"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            multiple
            onChange={handleSupportingDocsSelect}
            className={styles.hiddenInput}
          />

          {supportingDocs.length === 0 ? (
            <label
              htmlFor="supportingDocsInput"
              className={styles.uploadArea}
              onDragOver={handleSupportingDocsDragOver}
              onDrop={handleSupportingDocsDrop}
            >
              <span className={styles.uploadText}>Click to Upload</span>
            </label>
          ) : (
            <div className={styles.fileList}>
              {supportingDocs.map((doc, index) => (
                <div key={index} className={styles.fileRow}>
                  <span className={styles.fileName}>{doc.name}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemoveSupportingDoc(index);
                    }}
                    className={styles.removeButton}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <label htmlFor="supportingDocsInput" className={styles.addMore}>
                + Add More
              </label>
            </div>
          )}

          {uploadingDocs && (
            <div className={styles.loadingRow}>
              <LoadingSpinner size="md" />
              <span className={styles.loadingText}>Uploading documents...</span>
            </div>
          )}
        </div>
      </EquipmentRow>

      {/* Error Message */}
      {Object.keys(errors).length > 0 && (
        <Alert variant="error" className={styles.errorAlert}>
          Fill Required Fields
        </Alert>
      )}

      {/* Submit Button */}
      {!hideSubmitButton && (
        <div className={styles.submitSection}>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            loading={loading}
          >
            {loading ? 'Creating...' : '+ Create Project'}
          </Button>
        </div>
      )}

      {/* Utility Validation Modal */}
      <UtilityValidationModal
        isOpen={showUtilityModal}
        onClose={() => {
          setShowUtilityModal(false);
          setPendingZipCode(null);
        }}
        onSave={handleUtilitySave}
        zipCode={pendingZipCode}
        projectUuid={null}
      />
    </form>
  );
});

ProjectInformationForm.displayName = 'ProjectInformationForm';

export default ProjectInformationForm;
