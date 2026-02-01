import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import QCChecklistPanel from '../pdf/QCChecklistPanel';
import PdfFullScreenModal from '../pdf/PdfFullScreenModal';
import FormNavigationFooter from './FormNavigationFooter';
import AttestationModal from '../modals/AttestationModal';
import GenerateStatusModal from '../modals/GenerateStatusModal';
import UtilityValidationModal from '../modals/UtilityValidationModal';
import ProjectOverview from './ProjectOverview';
import ProjectHeader from '../common/ProjectHeader';
import ProjectOverviewDisplay from './ProjectOverviewDisplay';
import { Button, FormFieldRow, TableDropdown, EquipmentRow, Alert } from '../ui';
import ConfirmActionModal from '../ui/ConfirmActionModal';
import SystemContainer from './equipment/SystemContainer';
import OrderContainer from './submit/OrderContainer';
import ActivityLogPanel from './ActivityLogPanel';
import { getStampPermitOrders, createStampPermitOrders, formatOrderInfo } from '../../services/stampPermitService';
import equipStyles from './EquipmentForm.module.css';
import styles from './SubmitForm.module.css';
import projectStyles from '../../styles/ProjectAdd.module.css';
import { updateProjectStatus } from '../../services/projectService';
import { triggerPlanAutomation, fetchTriggerSecret, validateForGeneration } from '../../utils/triggerPlanAutomation';
import { PROCESS_NAMES, GENERATION_STATUS, DOCUMENT_TYPES } from '../../constants/generationConstants';
import { toast } from 'react-toastify';
import logger from '../../services/devLogger';
import { useSystemDetails } from '../../hooks';
import axios from '../../config/axios';
import { extractAllEquipment } from '../../utils/equipmentExtractor';

/**
 * SubmitForm - Submission workflow component with sub-tabs
 * Replaces the Print tab with Overview, QC, and Print sub-tabs
 */
const SubmitForm = ({ projectUuid, projectData, onNavigateToTab }) => {
  // Get system details for Overview tab
  const { data: systemDetails } = useSystemDetails({ projectUuid });
  // Navigation handlers
  const handlePrev = () => {
    if (onNavigateToTab) {
      onNavigateToTab('structural');
    }
  };

  const handleNext = () => {
    // Navigate through sub-tabs: Overview → QC → Order & Print
    if (selectedView === 'overview') {
      setSelectedView('qc');
    } else if (selectedView === 'qc') {
      setSelectedView('print');
    }
    // On 'print' tab, Next does nothing (last tab)
  };

  const [selectedView, setSelectedView] = useState('overview');
  const [activeQCType, setActiveQCType] = useState(null); // null, 'site', or 'design'
  const [siteQcProgress, setSiteQcProgress] = useState(0);
  const [designQcProgress, setDesignQcProgress] = useState(0);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showUtilityModal, setShowUtilityModal] = useState(false);

  // Local state for utility to force UI update
  const [localProjectData, setLocalProjectData] = useState(projectData);

  // Sync local state when projectData prop changes
  useEffect(() => {
    setLocalProjectData(projectData);
  }, [projectData]);

  const handlePrintDraft = () => {
    logger.log('Project', 'Generate Plan Set clicked');

    // Check if utility is missing
    if (!localProjectData?.site?.utility) {
      logger.warn('SubmitForm', 'Utility is missing, showing modal');
      toast.warning('Please select a utility before generating the plan set', {
        position: 'top-center',
        autoClose: 3000
      });
      setShowUtilityModal(true);
      return;
    }

    setShowGenerateConfirm(true);
  };

  const handleConfirmGenerate = async () => {
    setShowGenerateConfirm(false);
    setIsGenerating(true);

    try {
      logger.log('Project', '🚀 Triggering GenerateProjects_Mobile automation for project:', projectUuid);

      toast.info('Triggering plan set generation...', {
        position: 'top-center',
        autoClose: 2000,
      });

      // Fetch the secret token
      const secretToken = await fetchTriggerSecret();

      // Get user data from session
      const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
      const userUuid = userData.uuid || userData.id;
      const companyUuid = userData?.company?.uuid || projectData?.company_id;

      if (!companyUuid) {
        throw new Error('Company ID not found');
      }

      const automationOptions = {
        companyUuid,
        userUuid,
        computerName: 'ServerComputer2',
      };

      // Trigger the plan set generation automation
      await triggerPlanAutomation(
        projectUuid,
        secretToken,
        'GenerateProjects_Mobile',
        automationOptions
      );

      logger.success('Project', '✅ Plan set generation triggered successfully');
      toast.success('Plan set generation triggered successfully', {
        position: 'top-center',
        autoClose: 3000,
      });

    } catch (error) {
      logger.error('Project', '❌ Failed to trigger plan set generation:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to trigger plan set generation. Please try again.', {
        position: 'top-center',
        autoClose: 5000,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Calculate total QC progress (average of both)
  const totalQcProgress = Math.round((siteQcProgress + designQcProgress) / 2);

  // View configuration
  const viewSteps = [
    { key: 'overview', label: 'Overview' },
    { key: 'qc', label: 'QC' },
    { key: 'print', label: 'Submit' },
    { key: 'activity', label: 'Activity', alignRight: true },
  ];

  // Handle publish to permitting
  const handlePublish = async () => {
    if (siteQcProgress < 100 || designQcProgress < 100) {
      toast.warning('Please complete both Site QC and Design QC checklists before publishing.', {
        position: 'top-center',
        autoClose: 4000,
      });
      return;
    }

    try {
      setIsPublishing(true);
      const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
      const companyId = userData?.company?.uuid;

      if (!companyId) {
        throw new Error('Company ID not found');
      }

      // Update project status to permitting (completed_step progression)
      await updateProjectStatus(projectUuid, companyId, 5); // Assuming 5 = permitting stage

      toast.success('Project successfully published to permitting!', {
        position: 'top-center',
        autoClose: 3000,
      });
      // Optionally refresh or navigate
    } catch (error) {
      logger.error('Project', 'Error publishing project:', error);
      toast.error('Failed to publish project. Please try again.', {
        position: 'top-center',
        autoClose: 5000,
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // Handle QC progress changes
  const handleSiteQCProgress = (progress) => {
    setSiteQcProgress(progress);
  };

  const handleDesignQCProgress = (progress) => {
    setDesignQcProgress(progress);
  };

  // Handle utility click from overview
  const handleUtilityClick = () => {
    logger.log('SubmitForm', 'Utility field clicked, opening modal');
    setShowUtilityModal(true);
  };

  // Handle utility save from modal
  const handleUtilitySave = async (selectedUtility) => {
    logger.log('SubmitForm', 'Utility save requested:', selectedUtility);
    try {
      const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
      const companyId = userData?.company?.uuid;

      if (!companyId) {
        toast.error('Company information not found', {
          position: 'top-center',
          autoClose: 3000
        });
        return;
      }

      const payload = {
        companyId,
        address: projectData?.site?.address || '',
        city: projectData?.site?.city || '',
        state: projectData?.site?.state || '',
        zipCode: projectData?.site?.zip_code,
        ahj: projectData?.site?.ahj || '',
        utility: selectedUtility,
        apn: projectData?.site?.apn || '',
        squareFootage: projectData?.site?.squareFootage ? parseFloat(projectData.site.squareFootage) : null
      };

      await axios.put(`/project/${projectUuid}/site-info`, payload);
      toast.success('Utility saved successfully', {
        position: 'top-center',
        autoClose: 2000
      });

      // Update local state to force UI update
      setLocalProjectData(prevData => ({
        ...prevData,
        site: {
          ...prevData?.site,
          utility: selectedUtility
        }
      }));

      setShowUtilityModal(false)
    } catch (error) {
      logger.error('SubmitForm', 'UtilitySave Error:', error);
      toast.error(`Failed to save utility: ${error.response?.data?.message || error.message}`, {
        position: 'top-center',
        autoClose: 3000
      });
    }
  };

  return (
    <form onSubmit={(e) => e.preventDefault()} className={styles.formContainer}>
      {/* Sticky Header Section - Sub-tab Navigation */}
      <div className={equipStyles.stickyHeader}>
        {/* View Navigation - Overview, QC, Submit + Activity on right */}
        <div className={`${styles.viewNavigation} ${selectedView === 'qc' ? styles.viewNavigationWithQC : ''}`}>
          {viewSteps.filter(v => !v.alignRight).map((view, index) => (
            <button
              key={view.key}
              type="button"
              onClick={() => setSelectedView(view.key)}
              className={`${styles.viewLink} ${index === 0 ? styles.viewLinkFirst : ''} ${selectedView === view.key ? styles.viewLinkActive : ''}`}
            >
              {view.label}
              {selectedView === view.key && (
                <span className={`${styles.viewLinkIndicator} ${index === 0 ? styles.viewLinkIndicatorFirst : styles.viewLinkIndicatorCenter}`} />
              )}
            </button>
          ))}

          {/* Spacer to push right-aligned tabs */}
          <div style={{ flex: 1 }} />

          {/* Right-aligned tabs (Activity) */}
          {viewSteps.filter(v => v.alignRight).map((view) => (
            <button
              key={view.key}
              type="button"
              onClick={() => setSelectedView(view.key)}
              className={`${styles.viewLink} ${styles.viewLinkRight} ${selectedView === view.key ? styles.viewLinkActive : ''}`}
            >
              {view.label}
              {selectedView === view.key && (
                <span className={`${styles.viewLinkIndicator} ${styles.viewLinkIndicatorCenter}`} />
              )}
            </button>
          ))}
        </div>

        {/* QC Pill Buttons - Show only when QC tab is selected */}
        {selectedView === 'qc' && (
          <div className={styles.qcPillButtons}>
            {/* Site QC Button */}
            <button
              onClick={() => {
                const newType = activeQCType === 'site' ? null : 'site';
                setActiveQCType(newType);
              }}
              className={`${styles.qcPillButton} ${activeQCType === 'site' ? styles.qcPillButtonSiteActive : styles.qcPillButtonSite}`}
            >
              Site Plan QC
            </button>

            {/* Design QC Button */}
            <button
              onClick={() => {
                const newType = activeQCType === 'design' ? null : 'design';
                setActiveQCType(newType);
              }}
              className={`${styles.qcPillButton} ${activeQCType === 'design' ? styles.qcPillButtonDesignActive : styles.qcPillButtonDesign}`}
            >
              Design QC
            </button>
          </div>
        )}
      </div>

      {/* Scrollable Content */}
      <div className={equipStyles.scrollableContent}>
        {/* Overview View */}
        {selectedView === 'overview' && (
          <div style={{ padding: 'var(--spacing)' }}>
            {localProjectData && <ProjectHeader projectData={localProjectData} />}
            {localProjectData && (
              <ProjectOverviewDisplay
                projectData={localProjectData}
                systemDetails={systemDetails}
                onUtilityClick={handleUtilityClick}
              />
            )}
          </div>
        )}

        {/* QC View */}
        {selectedView === 'qc' && (
          <QCSubTab
            projectUuid={projectUuid}
            siteQcProgress={siteQcProgress}
            designQcProgress={designQcProgress}
            totalQcProgress={totalQcProgress}
            onSiteProgressChange={handleSiteQCProgress}
            onDesignProgressChange={handleDesignQCProgress}
            onPublish={handlePublish}
            isPublishing={isPublishing}
            activeQCType={activeQCType}
            onQCTypeChange={setActiveQCType}
          />
        )}

        {/* Print View */}
        {selectedView === 'print' && (
          <PrintSubTab projectUuid={projectUuid} projectData={projectData} />
        )}

        {/* Activity View */}
        {selectedView === 'activity' && (
          <ActivityLogPanel
            projectUuid={projectUuid}
            projectNumber={projectData?.details?.installer_project_id}
            homeownerName={projectData?.details ? `${projectData.details.customer_first_name || ''} ${projectData.details.customer_last_name || ''}`.trim() : ''}
          />
        )}
      </div>

      {/* Footer Navigation */}
      <FormNavigationFooter
        onPrev={null}
        onNext={handleNext}
        showNext={selectedView !== 'print'}
        showPrev={false}
        nextLabel="Next"
        centerButton={null}
      />

      {/* Generate Plan Set Confirmation Modal - Inline, contained within panel */}
      {showGenerateConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalDialog}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Generate Plan Set</h3>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.modalMessage}>
                Please confirm that all project data has been entered correctly and completely.
                This will trigger the plan set generation automation.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <Button
                variant="secondary"
                onClick={() => setShowGenerateConfirm(false)}
                disabled={isGenerating}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmGenerate}
                loading={isGenerating}
              >
                Confirm & Generate
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Utility Validation Modal */}
      <UtilityValidationModal
        isOpen={showUtilityModal}
        onClose={() => setShowUtilityModal(false)}
        onSave={handleUtilitySave}
        zipCode={localProjectData?.site?.zip_code}
        projectUuid={projectUuid}
      />
    </form>
  );
};

/**
 * Helper component for read-only display rows
 */
const DisplayRow = ({ label, value }) => {
  // Only render if value exists
  if (!value) return null;
  return (
    <FormFieldRow label={label}>
      <div className={styles.displayRowValue}>
        {value}
      </div>
    </FormFieldRow>
  );
};

/**
 * Print Sub-Tab - Draft printing, PE stamps, and permit ordering
 */
const PrintSubTab = ({ projectUuid, projectData }) => {
  // Draft version state
  const [draftVersion, setDraftVersion] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

  // ORDER STATUS from API (what's already been ordered)
  const [orderStatus, setOrderStatus] = useState(null);
  const [orderStatusLoading, setOrderStatusLoading] = useState(true);

  // PE Stamps - SELECTION state (what user wants to order)
  const [structuralStampSelected, setStructuralStampSelected] = useState(false);
  const [electricalStampSelected, setElectricalStampSelected] = useState(false);
  const [selectedPublishedVersion, setSelectedPublishedVersion] = useState(null);

  // Permits - SELECTION state (what user wants to order)
  const [buildingPermitSelected, setBuildingPermitSelected] = useState(false);
  const [interconnectionSelected, setInterconnectionSelected] = useState(false);

  // Confirmation dialogs
  const [showPrintDraftConfirm, setShowPrintDraftConfirm] = useState(false);
  const [showPEStampConfirm, setShowPEStampConfirm] = useState(false);
  const [showPermitConfirm, setShowPermitConfirm] = useState(false);
  const [showUtilityModal, setShowUtilityModal] = useState(false);

  // Ordering state
  const [isOrderingStamps, setIsOrderingStamps] = useState(false);
  const [isOrderingPermits, setIsOrderingPermits] = useState(false);

  // Mock published versions (TODO: fetch from API)
  const publishedVersions = [
    { value: 1, label: 'V1' },
    { value: 2, label: 'V2' },
    { value: 3, label: 'V3 (Latest)' },
  ];

  // Derived: check if each type is already ordered
  const structuralAlreadyOrdered = orderStatus?.structural_pe_stamp?.ordered || false;
  const electricalAlreadyOrdered = orderStatus?.electrical_pe_stamp?.ordered || false;
  const buildingAlreadyOrdered = orderStatus?.building_permit?.ordered || false;
  const interconnectionAlreadyOrdered = orderStatus?.interconnection_application?.ordered || false;

  // Fetch order status on mount
  useEffect(() => {
    const fetchOrderStatus = async () => {
      if (!projectUuid) return;

      try {
        setOrderStatusLoading(true);
        const data = await getStampPermitOrders(projectUuid);
        setOrderStatus(data);
      } catch (error) {
        console.error('Failed to fetch stamp/permit order status:', error);
      } finally {
        setOrderStatusLoading(false);
      }
    };

    fetchOrderStatus();
  }, [projectUuid]);

  // Handle Print Draft click - Check utility and AHJ first
  const handlePrintDraft = () => {
    // Check if utility and AHJ are filled
    const utility = projectData?.site?.utility;
    const ahj = projectData?.site?.ahj;

    const missingFields = [];
    if (!utility || utility.trim() === '') {
      missingFields.push('Utility');
    }
    if (!ahj || ahj.trim() === '') {
      missingFields.push('AHJ (Authority Having Jurisdiction)');
    }

    if (missingFields.length > 0) {
      logger.warn('Project', 'Missing required fields:', missingFields);
      toast.error(
        `Cannot print draft. Please fill in the following field(s) on the Site tab: ${missingFields.join(' and ')}`,
        {
          position: 'top-center',
          autoClose: 5000
        }
      );
      return;
    }

    // Both utility and AHJ are present, proceed with print confirmation
    setShowPrintDraftConfirm(true);
  };

  // Handle utility save from modal
  const handleUtilitySave = async (selectedUtility) => {
    try {
      const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
      const companyId = userData?.company?.uuid;

      if (!companyId) {
        throw new Error('Company ID not found');
      }

      // Build payload - API requires ALL address fields + apn/ahj must be strings
      const payload = {
        companyId,
        address: projectData?.site?.address,
        city: projectData?.site?.city,
        state: projectData?.site?.state,
        zipCode: projectData?.site?.zip_code, // API expects zipCode, data has zip_code
        ahj: projectData?.site?.ahj || '', // Must be string, not null
        utility: selectedUtility,
        apn: projectData?.site?.apn || '', // Must be string, not null
        squareFootage: projectData?.site?.squareFootage ? parseFloat(projectData.site.squareFootage) : null
      };

      const response = await axios.put(`/project/${projectUuid}/site-info`, payload);
      toast.success('Utility saved successfully', {
        position: 'top-center',
        autoClose: 2000
      });

      // Update local projectData to reflect the change
      if (projectData && projectData.site) {
        projectData.site.utility = selectedUtility;
      }

      // Close utility modal and proceed with print
      setShowUtilityModal(false);
      setShowPrintDraftConfirm(true);

    } catch (error) {
      console.error('[UtilitySave] ========== ERROR ==========');
      console.error('[UtilitySave] Error:', error);
      console.error('[UtilitySave] Error response data:', error.response?.data);
      console.error('[UtilitySave] Error status:', error.response?.status);
      console.error('[UtilitySave] Error response:', error.response);
      toast.error(`Failed to save utility: ${error.response?.data?.message || error.message}`, {
        position: 'top-center',
        autoClose: 3000
      });
    }
  };

  // Confirm Print Draft
  const handleConfirmPrintDraft = async () => {
    setShowPrintDraftConfirm(false);
    setIsGenerating(true);

    try {
      logger.log('Project', '🖨️ Printing draft version:', draftVersion);

      // TODO: Trigger actual print automation
      const secretToken = await fetchTriggerSecret();
      const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
      const companyData = JSON.parse(sessionStorage.getItem('companyData') || '{}');

      const options = {
        companyUuid: companyData.uuid,
        userUuid: userData.uuid,
        computerName: 'ServerComputer2',
      };

      await triggerPlanAutomation(projectUuid, secretToken, 'GenerateProjects_Mobile', options);

      // Increment draft version
      setDraftVersion(prev => prev + 1);

      toast.success(`Draft ${draftVersion} printed successfully!`, {
        position: 'top-center',
        autoClose: 3000,
      });

      logger.success('Project', '✅ Draft printed successfully');
    } catch (error) {
      logger.error('Project', '❌ Failed to print draft:', error);
      toast.error('Failed to print draft. Please try again.', {
        position: 'top-center',
        autoClose: 5000,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Order PE Stamps
  const handleOrderPEStamps = () => {
    if (!structuralStampSelected && !electricalStampSelected) {
      toast.warning('Please select at least one PE stamp to order', {
        position: 'top-center',
        autoClose: 3000,
      });
      return;
    }
    setShowPEStampConfirm(true);
  };

  // Confirm Order PE Stamps
  const handleConfirmPEStamps = async () => {
    setShowPEStampConfirm(false);
    setIsOrderingStamps(true);

    try {
      const orderTypes = [];
      if (structuralStampSelected) orderTypes.push('structural_pe_stamp');
      if (electricalStampSelected) orderTypes.push('electrical_pe_stamp');

      logger.log('Project', '📋 Ordering PE stamps:', orderTypes, 'for version:', selectedPublishedVersion);

      await createStampPermitOrders({
        projectUuid,
        orderTypes,
        address: {
          address: projectData?.site?.address,
          city: projectData?.site?.city,
          state: projectData?.site?.state,
          zip_code: projectData?.site?.zip_code
        }
      });

      // Refresh order status
      const data = await getStampPermitOrders(projectUuid);
      setOrderStatus(data);

      // Clear selections
      setStructuralStampSelected(false);
      setElectricalStampSelected(false);

      toast.success(`PE stamp order placed successfully!`, {
        position: 'top-center',
        autoClose: 3000,
      });

      logger.success('Project', '✅ PE stamps ordered successfully');
    } catch (error) {
      logger.error('Project', '❌ Failed to order PE stamps:', error);
      toast.error('Failed to place order. Please try again.', {
        position: 'top-center',
        autoClose: 5000,
      });
    } finally {
      setIsOrderingStamps(false);
    }
  };

  // Handle Order Permits
  const handleOrderPermits = () => {
    if (!buildingPermitSelected && !interconnectionSelected) {
      toast.warning('Please select at least one permit to order', {
        position: 'top-center',
        autoClose: 3000,
      });
      return;
    }
    setShowPermitConfirm(true);
  };

  // Confirm Order Permits
  const handleConfirmPermits = async () => {
    setShowPermitConfirm(false);
    setIsOrderingPermits(true);

    try {
      const orderTypes = [];
      if (buildingPermitSelected) orderTypes.push('building_permit');
      if (interconnectionSelected) orderTypes.push('interconnection_application');

      logger.log('Project', '📝 Ordering permits:', orderTypes);

      await createStampPermitOrders({
        projectUuid,
        orderTypes,
        address: {
          address: projectData?.site?.address,
          city: projectData?.site?.city,
          state: projectData?.site?.state,
          zip_code: projectData?.site?.zip_code
        }
      });

      // Refresh order status
      const data = await getStampPermitOrders(projectUuid);
      setOrderStatus(data);

      // Clear selections
      setBuildingPermitSelected(false);
      setInterconnectionSelected(false);

      toast.success(`Permit order placed successfully!`, {
        position: 'top-center',
        autoClose: 3000,
      });

      logger.success('Project', '✅ Permits ordered successfully');
    } catch (error) {
      logger.error('Project', '❌ Failed to order permits:', error);
      toast.error('Failed to place order. Please try again.', {
        position: 'top-center',
        autoClose: 5000,
      });
    } finally {
      setIsOrderingPermits(false);
    }
  };

  // Handle eye icon - navigate to Plan Set tab
  const handleViewVersion = () => {
    if (selectedPublishedVersion) {
      logger.log('Project', '👁️ Viewing plan set version:', selectedPublishedVersion);
      // TODO: Navigate to Plan Set tab with selected version
      // This may require updating the parent component to support version navigation
      toast.info(`Navigate to Plan Set V${selectedPublishedVersion}`, {
        position: 'top-center',
        autoClose: 2000,
      });
    }
  };

  return (
    <div>
      {/* Section A: Print Draft */}
      <OrderContainer title="Print Draft">
        <Button
          variant="primary"
          onClick={handlePrintDraft}
          loading={isGenerating}
          size="lg"
          className={styles.printDraftButton}
        >
          Print Draft {draftVersion}
        </Button>

        <Alert variant="info" collapsible={false}>
          <strong>Note:</strong> Only printed drafts can be converted into a published plan set.
        </Alert>
      </OrderContainer>

      {/* Section B: Order PE Stamps */}
      <OrderContainer title="Order PE Stamps">

        <div className={styles.orderSectionContent}>
          {/* Checkboxes */}
          <div className={styles.orderCheckboxGroup}>
            {/* Structural PE Stamp */}
            {structuralAlreadyOrdered ? (
              <div className={styles.checkboxOrdered}>
                <span className={styles.checkboxCheckmark}>✓</span>
                <div>
                  <div>Structural PE Stamp</div>
                  <div className={styles.checkboxOrderInfo}>
                    {formatOrderInfo(orderStatus.structural_pe_stamp)}
                  </div>
                </div>
              </div>
            ) : (
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={structuralStampSelected}
                  onChange={(e) => setStructuralStampSelected(e.target.checked)}
                  className={styles.checkboxInput}
                />
                + Structural PE Stamp
              </label>
            )}

            {/* Electrical PE Stamp */}
            {electricalAlreadyOrdered ? (
              <div className={styles.checkboxOrderedLast}>
                <span className={styles.checkboxCheckmark}>✓</span>
                <div>
                  <div>Electrical PE Stamp</div>
                  <div className={styles.checkboxOrderInfo}>
                    {formatOrderInfo(orderStatus.electrical_pe_stamp)}
                  </div>
                </div>
              </div>
            ) : (
              <label className={styles.checkboxLabelLast}>
                <input
                  type="checkbox"
                  checked={electricalStampSelected}
                  onChange={(e) => setElectricalStampSelected(e.target.checked)}
                  className={styles.checkboxInput}
                />
                + Electrical PE Stamp
              </label>
            )}
          </div>

          {/* Published Version Dropdown with Eye Icon */}
          <div className={styles.versionSelectorRow}>
            <label className={styles.versionLabel}>
              Published Plan Set:
            </label>

            <select
              value={selectedPublishedVersion || ''}
              onChange={(e) => setSelectedPublishedVersion(Number(e.target.value))}
              className={styles.versionSelect}
            >
              <option value="">Select version...</option>
              {publishedVersions.map(v => (
                <option key={v.value} value={v.value}>{v.label}</option>
              ))}
            </select>

            {/* Eye Icon Button */}
            <button
              onClick={handleViewVersion}
              disabled={!selectedPublishedVersion}
              className={selectedPublishedVersion ? styles.versionViewButton : styles.versionViewButtonDisabled}
              title="View selected version"
            >
              👁️
            </button>
          </div>

          {/* Order Button or All Ordered Message */}
          {structuralAlreadyOrdered && electricalAlreadyOrdered ? (
            <Alert variant="success" collapsible={false}>
              All PE stamps have been ordered.
            </Alert>
          ) : (
            <Button
              variant="outline"
              onClick={handleOrderPEStamps}
              disabled={!structuralStampSelected && !electricalStampSelected}
              loading={isOrderingStamps}
            >
              Order PE Stamps
            </Button>
          )}
        </div>
      </OrderContainer>

      {/* Section C: Order Permits */}
      <OrderContainer title="Order Permits">

        <div className={styles.orderSectionContent}>
          {/* Checkboxes */}
          <div className={styles.orderCheckboxGroup}>
            {/* Building Permit */}
            {buildingAlreadyOrdered ? (
              <div className={styles.checkboxOrdered}>
                <span className={styles.checkboxCheckmark}>✓</span>
                <div>
                  <div>Building Permit Application</div>
                  <div className={styles.checkboxOrderInfo}>
                    {formatOrderInfo(orderStatus.building_permit)}
                  </div>
                </div>
              </div>
            ) : (
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={buildingPermitSelected}
                  onChange={(e) => setBuildingPermitSelected(e.target.checked)}
                  className={styles.checkboxInput}
                />
                Building Permit Application
              </label>
            )}

            {/* Interconnection Application */}
            {interconnectionAlreadyOrdered ? (
              <div className={styles.checkboxOrderedLast}>
                <span className={styles.checkboxCheckmark}>✓</span>
                <div>
                  <div>Interconnection Application</div>
                  <div className={styles.checkboxOrderInfo}>
                    {formatOrderInfo(orderStatus.interconnection_application)}
                  </div>
                </div>
              </div>
            ) : (
              <label className={styles.checkboxLabelLast}>
                <input
                  type="checkbox"
                  checked={interconnectionSelected}
                  onChange={(e) => setInterconnectionSelected(e.target.checked)}
                  className={styles.checkboxInput}
                />
                Interconnection Application
              </label>
            )}
          </div>

          {/* Order Button or All Ordered Message */}
          {buildingAlreadyOrdered && interconnectionAlreadyOrdered ? (
            <Alert variant="success" collapsible={false}>
              All permits have been ordered.
            </Alert>
          ) : (
            <Button
              variant="outline"
              onClick={handleOrderPermits}
              disabled={!buildingPermitSelected && !interconnectionSelected}
              loading={isOrderingPermits}
            >
              Order Permits
            </Button>
          )}
        </div>
      </OrderContainer>

      {/* Print Draft Confirmation Modal */}
      {showPrintDraftConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalDialog}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Print Draft {draftVersion}</h3>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.modalMessage}>
                Confirm that you want to print Draft {draftVersion}. This will trigger the plan set generation automation.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <Button
                variant="secondary"
                onClick={() => setShowPrintDraftConfirm(false)}
                disabled={isGenerating}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmPrintDraft}
                loading={isGenerating}
              >
                Confirm & Print
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* PE Stamp Confirmation Modal */}
      {showPEStampConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalDialog}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Order PE Stamps</h3>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.modalMessage}>
                Confirm PE stamp order for Plan Set V{selectedPublishedVersion}:
              </p>
              <ul className={styles.modalList}>
                {structuralStampSelected && <li>Structural PE Stamp</li>}
                {electricalStampSelected && <li>Electrical PE Stamp</li>}
              </ul>
            </div>
            <div className={styles.modalFooter}>
              <Button
                variant="secondary"
                onClick={() => setShowPEStampConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmPEStamps}
              >
                Confirm Order
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Permit Confirmation Modal */}
      {showPermitConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalDialog}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Order Permits</h3>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.modalMessage}>
                Confirm permit order:
              </p>
              <ul className={styles.modalList}>
                {buildingPermitSelected && <li>Building Permit Application</li>}
                {interconnectionSelected && <li>Interconnection Application</li>}
              </ul>
            </div>
            <div className={styles.modalFooter}>
              <Button
                variant="secondary"
                onClick={() => setShowPermitConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmPermits}
              >
                Confirm Order
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Utility Validation Modal */}
      <UtilityValidationModal
        isOpen={showUtilityModal}
        onClose={() => setShowUtilityModal(false)}
        onSave={handleUtilitySave}
        zipCode={projectData?.site?.zip_code}
        projectUuid={projectUuid}
      />
    </div>
  );
};

/**
 * Spec Sheets Sub-Tab - Equipment spec sheet management
 */
const SpecSheetsSubTab = ({ projectUuid, projectData, systemDetails }) => {
  const [attachments, setAttachments] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [viewingPdf, setViewingPdf] = useState(null);

  // Upload state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadingFor, setUploadingFor] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const [uploadForm, setUploadForm] = useState({
    manufacturer: '',
    modelNumber: '',
    equipmentType: ''
  });

  // Extract equipment from systemDetails using shared utility
  const projectEquipment = useMemo(() => {
    return extractAllEquipment(systemDetails);
  }, [systemDetails]);

  // Fetch existing attachments
  useEffect(() => {
    const fetchAttachments = async () => {
      try {
        const response = await axios.get(`/api/spec-sheets/project/${projectUuid}/attachments`);
        if (response.data.success) {
          setAttachments(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch attachments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (projectUuid) {
      fetchAttachments();
    }
  }, [projectUuid]);

  // Auto-match spec sheets
  const handleAutoMatch = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(`/api/spec-sheets/project/${projectUuid}/auto-match`, {
        equipment: projectEquipment
      });

      if (response.data.success) {
        // Refresh attachments
        const attachResponse = await axios.get(`/api/spec-sheets/project/${projectUuid}/attachments`);
        if (attachResponse.data.success) {
          setAttachments(attachResponse.data.data);
        }

        const matched = response.data.data.filter(m => m.attached).length;
        const notFound = response.data.data.filter(m => m.reason === 'not_found').length;
        toast.success(`Matched ${matched} spec sheets. ${notFound} not found.`);
      }
    } catch (error) {
      toast.error('Auto-match failed');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Search for spec sheets
  const handleSearch = async (manufacturer, model) => {
    // If called from equipment row, use provided params; otherwise use searchQuery
    const searchManufacturer = manufacturer || searchQuery;
    const searchModel = model || searchQuery;

    if (!searchManufacturer.trim() && !searchModel.trim()) return;

    setIsSearching(true);
    try {
      const response = await axios.get('/api/spec-sheets/search', {
        params: {
          model: searchModel,
          manufacturer: searchManufacturer,
          limit: 20
        }
      });

      if (response.data.success) {
        setSearchResults(response.data.data);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Attach spec sheet to project
  const handleAttach = async (specSheetUuid) => {
    try {
      const response = await axios.post(`/api/spec-sheets/project/${projectUuid}/attach`, {
        specSheetUuid,
        systemNumber: selectedEquipment?.systemNumber || 1,
        attachmentType: 'manual'
      });

      if (response.data.success) {
        // Refresh attachments
        const attachResponse = await axios.get(`/api/spec-sheets/project/${projectUuid}/attachments`);
        if (attachResponse.data.success) {
          setAttachments(attachResponse.data.data);
        }
        setShowSearchModal(false);
        toast.success('Spec sheet attached');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to attach');
    }
  };

  // Remove attachment
  const handleRemove = async (attachmentUuid) => {
    if (!window.confirm('Remove this spec sheet from the project?')) return;

    try {
      await axios.delete(`/api/spec-sheets/project/${projectUuid}/attachments/${attachmentUuid}`);
      setAttachments(prev => prev.filter(a => a.uuid !== attachmentUuid));
      toast.success('Spec sheet removed');
    } catch (error) {
      toast.error('Failed to remove');
    }
  };

  // Open upload modal for specific equipment
  const handleOpenUpload = (equipment) => {
    setUploadingFor(equipment);
    setUploadForm({
      manufacturer: equipment.manufacturer || '',
      modelNumber: equipment.model || '',
      equipmentType: equipment.type || ''
    });
    setShowUploadModal(true);
  };

  // Handle file selection
  const handleFileSelect = (files) => {
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf') {
        setUploadFile(file);
      } else {
        toast.error('Please select a PDF file');
      }
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    handleFileSelect(e.dataTransfer.files);
  };

  // Handle upload
  const handleUpload = async () => {
    if (!uploadFile || !uploadForm.manufacturer || !uploadForm.modelNumber) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      // 1. Get presigned URL
      const urlResponse = await axios.get('/api/spec-sheets/upload-url', {
        params: {
          filename: uploadFile.name,
          contentType: uploadFile.type
        }
      });

      if (!urlResponse.data.success) {
        throw new Error('Failed to get upload URL');
      }

      setUploadProgress(30);

      // 2. Upload to S3
      await axios.put(urlResponse.data.data.presignedUrl, uploadFile, {
        headers: { 'Content-Type': uploadFile.type },
        onUploadProgress: (e) => {
          const percent = 30 + (e.loaded / e.total) * 50;
          setUploadProgress(percent);
        }
      });

      setUploadProgress(85);

      // 3. Create spec sheet record
      const createResponse = await axios.post('/api/spec-sheets/manual', {
        s3Key: urlResponse.data.data.s3Key,
        originalFilename: uploadFile.name,
        manufacturer: uploadForm.manufacturer,
        modelNumber: uploadForm.modelNumber,
        equipmentType: uploadForm.equipmentType,
        fileSize: uploadFile.size
      });

      if (!createResponse.data.success) {
        throw new Error('Failed to create spec sheet record');
      }

      setUploadProgress(95);

      // 4. Auto-attach to project
      const specSheetUuid = createResponse.data.data.uuid;
      await axios.post(`/api/spec-sheets/project/${projectUuid}/attach`, {
        specSheetUuid,
        systemNumber: uploadingFor?.systemNumber || 1,
        attachmentType: 'manual'
      });

      setUploadProgress(100);
      toast.success('Spec sheet uploaded successfully');

      // Reset and close modal
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadProgress(0);
      setUploadForm({ manufacturer: '', modelNumber: '', equipmentType: '' });

      // Refresh attachments
      const attachResponse = await axios.get(`/api/spec-sheets/project/${projectUuid}/attachments`);
      if (attachResponse.data.success) {
        setAttachments(attachResponse.data.data);
      }

    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Upload failed: ' + (error.response?.data?.message || error.message));
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <p>Loading spec sheets...</p>
      </div>
    );
  }

  return (
    <div className={styles.specSheetsContainer}>
      {/* Header with Auto-Match button */}
      <div className={styles.specSheetsHeader}>
        <h3>Equipment Spec Sheets</h3>
        <Button
          variant="secondary"
          onClick={handleAutoMatch}
          disabled={isLoading || projectEquipment.length === 0}
        >
          Auto-Match All
        </Button>
      </div>

      {/* Summary Stats */}
      <div className={styles.specSheetsSummary}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Equipment Items:</span>
          <span className={styles.summaryValue}>{projectEquipment.length}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Spec Sheets Attached:</span>
          <span className={styles.summaryValue}>{attachments.length}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Missing:</span>
          <span className={`${styles.summaryValue} ${projectEquipment.length - attachments.length > 0 ? styles.summaryWarning : ''}`}>
            {Math.max(0, projectEquipment.length - attachments.length)}
          </span>
        </div>
      </div>

      {/* Equipment Checklist */}
      <div className={styles.specChecklistContainer}>
        {projectEquipment.map((equip) => {
          // Improved fuzzy matching - check both directions with partial match
          const attachment = attachments.find(a => {
            const attachedMfg = (a.specSheet?.manufacturer || '').toLowerCase();
            const attachedModel = (a.specSheet?.model_number || '').toLowerCase();
            const equipMfg = (equip.manufacturer || '').toLowerCase();
            const equipModel = (equip.model || '').toLowerCase();

            // Match manufacturer exactly and model with partial match
            const mfgMatch = attachedMfg === equipMfg;
            const modelMatch = attachedModel.includes(equipModel) ||
                              equipModel.includes(attachedModel) ||
                              // Also try matching just the first part of model number
                              attachedModel.split(' ')[0] === equipModel.split(' ')[0];

            return mfgMatch && modelMatch;
          });

          const isAttached = !!attachment;

          return (
            <div key={equip.key} className={styles.specChecklistRow}>
              {/* Status Icon */}
              <div className={isAttached ? styles.specCheckIconAttached : styles.specCheckIconMissing}>
                {isAttached ? '✓' : '✗'}
              </div>

              {/* Equipment Info */}
              <div className={styles.specCheckInfo}>
                <div className={styles.specCheckType}>{equip.type}</div>
                <div className={styles.specCheckModel}>
                  {equip.manufacturer} {equip.model}
                </div>
              </div>

              {/* Action Button */}
              <div className={styles.specCheckAction}>
                {isAttached ? (
                  <button
                    className={styles.specCheckButton}
                    onClick={() => setViewingPdf({
                      url: attachment.specSheet?.download_url,
                      fileName: `${equip.manufacturer} ${equip.model}`,
                      version: 1
                    })}
                  >
                    View
                  </button>
                ) : (
                  <button
                    className={styles.specCheckButton}
                    onClick={() => {
                      setSelectedEquipment(equip);
                      setSearchQuery(`${equip.manufacturer} ${equip.model}`);
                      setShowSearchModal(true);
                      // Search with proper manufacturer and model split
                      handleSearch(equip.manufacturer, equip.model);
                    }}
                  >
                    Upload
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {projectEquipment.length === 0 && (
          <div className={styles.emptyState}>
            No equipment configured for this project yet.
          </div>
        )}
      </div>

      {/* Attached Spec Sheets List */}
      {attachments.length > 0 && (
        <div className={styles.attachedSection}>
          <h4>All Attached Spec Sheets ({attachments.length})</h4>
          <div className={styles.attachedList}>
            {attachments.map((att) => (
              <div key={att.uuid} className={styles.attachedRow}>
                {att.specSheet?.thumbnail_url && (
                  <img
                    src={att.specSheet.thumbnail_url}
                    alt={`${att.specSheet.manufacturer} ${att.specSheet.model_number} thumbnail`}
                    className={styles.attachedThumbnail}
                    onClick={() => setViewingPdf({
                      url: att.specSheet?.download_url,
                      fileName: `${att.specSheet?.manufacturer} ${att.specSheet?.model_number}`,
                      version: 1
                    })}
                  />
                )}
                <div className={styles.attachedInfo}>
                  <span className={styles.attachedType}>{att.specSheet?.equipment_type}</span>
                  <span className={styles.attachedModel}>
                    {att.specSheet?.manufacturer} {att.specSheet?.model_number}
                  </span>
                  <span className={styles.attachedMeta}>
                    System {att.system_number} • {att.attachment_type}
                  </span>
                </div>
                <div className={styles.attachedActions}>
                  <button
                    className={styles.viewButton}
                    onClick={() => setViewingPdf({
                      url: att.specSheet?.download_url,
                      fileName: `${att.specSheet?.manufacturer} ${att.specSheet?.model_number}`,
                      version: 1
                    })}
                  >
                    View
                  </button>
                  <a
                    href={att.specSheet?.download_url}
                    download
                    className={styles.downloadLink}
                  >
                    Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Modal */}
      {showSearchModal && (
        <div className={styles.modalOverlay} onClick={() => setShowSearchModal(false)}>
          <div className={styles.searchModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.searchModalHeader}>
              <h3>Find Spec Sheet</h3>
              <button onClick={() => setShowSearchModal(false)}>×</button>
            </div>

            <div className={styles.searchInputRow}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by manufacturer or model..."
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>

            <div className={styles.searchResults}>
              {searchResults.length === 0 ? (
                <p className={styles.noResults}>No results found</p>
              ) : (
                searchResults.map((spec) => (
                  <div key={spec.uuid} className={styles.searchResultRow}>
                    {spec.thumbnail_url && (
                      <img
                        src={spec.thumbnail_url}
                        alt={`${spec.manufacturer} ${spec.model_number} thumbnail`}
                        className={styles.resultThumbnail}
                        onClick={() => setViewingPdf({
                          url: spec.download_url,
                          fileName: `${spec.manufacturer} ${spec.model_number}`,
                          version: 1
                        })}
                      />
                    )}
                    <div className={styles.resultInfo}>
                      <span className={styles.resultType}>{spec.equipment_type}</span>
                      <span className={styles.resultModel}>
                        {spec.manufacturer} {spec.model_number}
                      </span>
                      <span className={styles.resultConfidence}>
                        {Math.round(spec.extraction_confidence * 100)}% confidence
                      </span>
                    </div>
                    <div className={styles.resultActions}>
                      <button
                        className={styles.viewButton}
                        onClick={() => setViewingPdf({
                          url: spec.download_url,
                          fileName: `${spec.manufacturer} ${spec.model_number}`,
                          version: 1
                        })}
                      >
                        Preview
                      </button>
                      <Button
                        variant="primary"
                        size="small"
                        onClick={() => handleAttach(spec.uuid)}
                      >
                        Attach
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className={styles.modalOverlay} onClick={() => setShowUploadModal(false)}>
          <div className={styles.uploadModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.searchModalHeader}>
              <h3>Upload Spec Sheet</h3>
              <button onClick={() => setShowUploadModal(false)}>×</button>
            </div>

            <div style={{ padding: 'var(--spacing)' }}>
              {/* Equipment Info */}
              <div style={{ marginBottom: 'var(--spacing)', padding: 'var(--spacing)', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Uploading for:</div>
                <div style={{ fontSize: 'var(--text-md)', fontWeight: '600', color: 'var(--text-primary)', marginTop: '4px' }}>
                  {uploadingFor?.type} - System {uploadingFor?.systemNumber}
                </div>
              </div>

              {/* Drag-drop zone */}
              {!uploadFile ? (
                <div
                  className={`${styles.uploadDropzone} ${isDragActive ? styles.uploadDropzoneDragOver : ''}`}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div style={{ fontSize: '48px', marginBottom: 'var(--spacing)' }}>📄</div>
                  <div style={{ fontSize: 'var(--text-md)', fontWeight: '600', marginBottom: 'var(--spacing-xs)' }}>
                    {isDragActive ? 'Drop PDF here' : 'Drag & drop PDF file'}
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                    or click to browse
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => handleFileSelect(e.target.files)}
                    style={{ display: 'none' }}
                  />
                </div>
              ) : (
                <div className={styles.uploadPreview}>
                  <div className={styles.uploadPreviewIcon}>📄</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: '500' }}>{uploadFile.name}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                      {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                  <button
                    onClick={() => setUploadFile(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: 'var(--text-muted)' }}
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Form fields */}
              <div className={styles.uploadForm}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: '500', marginBottom: 'var(--spacing-xs)', color: 'var(--text-primary)' }}>
                    Manufacturer *
                  </label>
                  <input
                    type="text"
                    value={uploadForm.manufacturer}
                    onChange={(e) => setUploadForm({ ...uploadForm, manufacturer: e.target.value })}
                    placeholder="Enter manufacturer name"
                    style={{
                      width: '100%',
                      padding: 'var(--spacing-sm) var(--spacing)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--text-md)',
                      background: 'var(--bg-page)',
                      color: 'var(--text-primary)',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: '500', marginBottom: 'var(--spacing-xs)', color: 'var(--text-primary)' }}>
                    Model Number *
                  </label>
                  <input
                    type="text"
                    value={uploadForm.modelNumber}
                    onChange={(e) => setUploadForm({ ...uploadForm, modelNumber: e.target.value })}
                    placeholder="Enter model number"
                    style={{
                      width: '100%',
                      padding: 'var(--spacing-sm) var(--spacing)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--text-md)',
                      background: 'var(--bg-page)',
                      color: 'var(--text-primary)',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: '500', marginBottom: 'var(--spacing-xs)', color: 'var(--text-primary)' }}>
                    Equipment Type *
                  </label>
                  <select
                    value={uploadForm.equipmentType}
                    onChange={(e) => setUploadForm({ ...uploadForm, equipmentType: e.target.value })}
                    style={{
                      width: '100%',
                      padding: 'var(--spacing-sm) var(--spacing)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--text-md)',
                      background: 'var(--bg-page)',
                      color: 'var(--text-primary)',
                      fontFamily: 'inherit'
                    }}
                  >
                    <option value="">Select equipment type</option>
                    <option value="Solar Panel">Solar Panel</option>
                    <option value="Inverter">Inverter</option>
                    <option value="Microinverter">Microinverter</option>
                    <option value="Battery">Battery</option>
                    <option value="Storage Management System">Storage Management System</option>
                    <option value="String Combiner Panel">String Combiner Panel</option>
                    <option value="AC Disconnect">AC Disconnect</option>
                    <option value="Load Center">Load Center</option>
                    <option value="Rapid Shutdown">Rapid Shutdown</option>
                    <option value="Optimizer">Optimizer</option>
                  </select>
                </div>
              </div>

              {/* Progress bar */}
              {uploadProgress > 0 && (
                <div className={styles.uploadProgress}>
                  <div className={styles.uploadProgressBar} style={{ width: `${uploadProgress}%` }} />
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 'var(--spacing)', marginTop: 'var(--spacing)' }}>
                <Button
                  variant="secondary"
                  onClick={() => setShowUploadModal(false)}
                  disabled={isUploading}
                  style={{ flex: 1 }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleUpload}
                  disabled={!uploadFile || !uploadForm.manufacturer || !uploadForm.modelNumber || !uploadForm.equipmentType || isUploading}
                  style={{ flex: 1 }}
                >
                  {isUploading ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
      <PdfFullScreenModal
        isOpen={!!viewingPdf}
        onClose={() => setViewingPdf(null)}
        presignedUrl={viewingPdf?.url}
        fileName={viewingPdf?.fileName}
        versionNumber={viewingPdf?.version}
      />
    </div>
  );
};

/**
 * QC Sub-Tab - Quality control checklist panel area
 */
const QCSubTab = ({
  projectUuid,
  siteQcProgress,
  designQcProgress,
  totalQcProgress,
  onSiteProgressChange,
  onDesignProgressChange,
  onPublish,
  isPublishing,
  activeQCType,
  onQCTypeChange
}) => {
  const qcPanelRef = React.useRef(null);
  const containerRef = React.useRef(null);

  const handleReset = () => {
    if (qcPanelRef.current) {
      qcPanelRef.current.reset();
    }
  };

  const progressPercent = activeQCType === 'site' ? siteQcProgress : designQcProgress;

  return (
    <div
      ref={containerRef}
      className={styles.qcContainer}>
      {/* QC Panel - Embedded directly in scrollable area */}
      {activeQCType && (
        <>
          <div className={styles.qcPanelWrapper}>
            <QCChecklistPanel
              ref={qcPanelRef}
              isOpen={true}
              onClose={() => onQCTypeChange(null)}
              projectId={projectUuid}
              checklistType={activeQCType}
              onProgressChange={activeQCType === 'site' ? onSiteProgressChange : onDesignProgressChange}
            />
          </div>

          {/* Fixed Footer Actions */}
          <div className={styles.qcFooter}>
            <button
              onClick={handleReset}
              className={styles.resetButton}
            >
              Reset All
            </button>
            <button
              onClick={() => onQCTypeChange(null)}
              className={`${styles.saveButton} ${progressPercent === 100 ? styles.saveButtonSuccess : styles.saveButtonPrimary}`}
            >
              {progressPercent === 100 ? '✓ Save & Close' : 'Save & Close'}
            </button>
          </div>
        </>
      )}

      {/* Publish Button - Show when both complete */}
      {!activeQCType && totalQcProgress === 100 && (
        <div className={styles.publishCenter}>
          <button
            type="button"
            onClick={onPublish}
            disabled={isPublishing}
            className={`${styles.publishButton} ${isPublishing ? styles.publishButtonDisabled : styles.publishButtonEnabled}`}
          >
            {isPublishing ? 'Publishing...' : '✓ Publish to Permitting'}
          </button>
        </div>
      )}

      {/* Warning message when incomplete and no panel open */}
      {!activeQCType && totalQcProgress < 100 && (
        <div className={styles.warningAlert}>
          Complete both Site QC and Design QC checklists to enable publishing to permitting.
        </div>
      )}
    </div>
  );
};

/**
 * Helper component for displaying info fields
 */
const InfoField = ({ label, value }) => (
  <div className={styles.infoField}>
    <div className={styles.infoLabel}>
      {label}
    </div>
    <div className={styles.infoValue}>
      {value}
    </div>
  </div>
);

export default SubmitForm;
