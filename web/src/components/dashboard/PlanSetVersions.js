import React, { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import axios from '../../config/axios';
import { toast } from 'react-toastify';
import logger from '../../services/devLogger';
import styles from '../../styles/Dashboard.module.css';
import PdfFullScreenModal from '../pdf/PdfFullScreenModal';
import PdfAnnotationLayer from '../pdf/PdfAnnotationLayer';
import PdfToolbar from '../pdf/PdfToolbar';
import { LoadingSpinner, Button, Dropdown } from '../ui';
import SpecSheetGrid from './SpecSheetGrid';

/**
 * PlanSetVersions - Version tabs for viewing different plan set iterations
 * Fetches versions from API and displays PDFs with presigned URLs
 * Listens for real-time PDF upload notifications via Socket.io
 */
const PlanSetVersions = ({ projectUuid, onQCPanelChange }) => {
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [presignedUrl, setPresignedUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Status tab state: 'draft' or 'published'
  const [statusTab, setStatusTab] = useState('draft');

  // View state: 'planset' or 'specsheets'
  const [currentView, setCurrentView] = useState('planset');

  // Annotation state
  const [isAnnotationMode, setIsAnnotationMode] = useState(true); // Start with tools open
  const [currentTool, setCurrentTool] = useState('select');
  const [currentColor, setCurrentColor] = useState('var(--color-danger)'); // Red default
  const [annotations, setAnnotations] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const annotationLayerRef = React.useRef(null);

  // QC Checklist panel state - now supports 'site' and 'design' types
  const [activeQCType, setActiveQCType] = useState(null); // null, 'site', or 'design'

  // Spec sheet state
  const [specSheetAttachments, setSpecSheetAttachments] = useState([]);
  const [loadingSpecSheets, setLoadingSpecSheets] = useState(false);
  const [viewingSpecSheet, setViewingSpecSheet] = useState(null);

  // Fetch all versions (extracted to useCallback so it can be called from socket listener)
  const fetchVersions = useCallback(async () => {
    if (!projectUuid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`/project/${projectUuid}/versions`);

      if (response.data.success && response.data.versions.length > 0) {
        setVersions(response.data.versions);

        // Determine if we have published versions
        const publishedVersions = response.data.versions.filter(v => v.status === 'published');
        const draftVersions = response.data.versions.filter(v => v.status === 'draft' || !v.status);

        // If we have published, show published tab; otherwise show draft
        if (publishedVersions.length > 0) {
          setStatusTab('published');
          const latestPublished = publishedVersions.find(v => v.is_latest) || publishedVersions[publishedVersions.length - 1];
          setSelectedVersion(latestPublished.version_number);
        } else if (draftVersions.length > 0) {
          setStatusTab('draft');
          const latestDraft = draftVersions.find(v => v.is_latest) || draftVersions[draftVersions.length - 1];
          setSelectedVersion(latestDraft.version_number);
        }
      } else {
        setVersions([]);
      }
    } catch (error) {
      logger.error('Dashboard', 'Error fetching versions:', error);
      setError('Failed to load plan set versions');
      setVersions([]);
    } finally {
      setLoading(false);
    }
  }, [projectUuid]);

  // Fetch versions on mount
  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  // Fetch spec sheets
  const fetchSpecSheets = useCallback(async () => {
    if (!projectUuid) return;

    try {
      setLoadingSpecSheets(true);
      const response = await axios.get(`/api/spec-sheets/project/${projectUuid}/attachments`);

      if (response.data.success) {
        setSpecSheetAttachments(response.data.data);
        logger.log('Dashboard', `Loaded ${response.data.data.length} spec sheets`);
      }
    } catch (error) {
      logger.error('Dashboard', 'Failed to fetch spec sheets:', error);
      toast.error('Failed to load spec sheets', {
        position: 'top-right',
        autoClose: 3000
      });
    } finally {
      setLoadingSpecSheets(false);
    }
  }, [projectUuid]);

  // Fetch spec sheets on mount
  useEffect(() => {
    if (currentView === 'specsheets') {
      fetchSpecSheets();
    }
  }, [fetchSpecSheets, currentView]);

  // Handler for viewing spec sheet
  const handleViewSpecSheet = (specSheet) => {
    if (!specSheet) return;

    setViewingSpecSheet({
      url: specSheet.download_url,
      fileName: `${specSheet.manufacturer} ${specSheet.model_number}`,
      version: 1
    });
  };

  // Fetch presigned URL when version changes
  useEffect(() => {
    const fetchPresignedUrl = async () => {
      if (!projectUuid || !selectedVersion) {
        return;
      }

      try {
        setLoadingPdf(true);
        setPresignedUrl(null);
        const response = await axios.get(`/project/${projectUuid}/versions/${selectedVersion}/presigned-url`);

        if (response.data.success) {
          setPresignedUrl(response.data.presigned_url);
        }
      } catch (error) {
        logger.error('Dashboard', 'Error fetching presigned URL:', error);
        setError(`Failed to load Version ${selectedVersion} PDF`);
      } finally {
        setLoadingPdf(false);
      }
    };

    fetchPresignedUrl();
  }, [projectUuid, selectedVersion]);

  // Socket.io real-time PDF notifications
  useEffect(() => {
    if (!projectUuid) {
      return;
    }

    logger.debug('Dashboard', '[PlanSetVersions] Initializing Socket.io connection');

    const socket = io('https://api.skyfireapp.io', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socket.on('connect', () => {
      logger.log('Dashboard', '[PlanSetVersions] Socket connected, joining project room:', projectUuid);
      socket.emit('join-project', projectUuid);
    });

    socket.on('disconnect', (reason) => {
      logger.log('Dashboard', '[PlanSetVersions] Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      logger.error('Dashboard', '[PlanSetVersions] Socket connection error:', error);
    });

    socket.on('pdf-ready', (data) => {
      logger.log('Dashboard', '[PlanSetVersions] PDF ready notification received:', data);

      // Show toast notification
      toast.success(`Plan Set V${data.version_number} is ready!`, {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });

      // Refetch versions to show new PDF
      fetchVersions();
    });

    return () => {
      logger.debug('Dashboard', '[PlanSetVersions] Cleaning up Socket.io connection');
      socket.emit('leave-project', projectUuid);
      socket.disconnect();
    };
  }, [projectUuid, fetchVersions]);

  const handleVersionClick = (versionNumber) => {
    setSelectedVersion(versionNumber);
    setPresignedUrl(null); // Clear current PDF while loading new one
  };

  const handleFullScreen = () => {
    setIsModalOpen(true);
  };

  const handleDownload = () => {
    if (presignedUrl) {
      window.open(presignedUrl, '_blank');
    }
  };

  const handleToggleAnnotationMode = () => {
    setIsAnnotationMode(!isAnnotationMode);
  };

  const handleAnnotationsChange = (newAnnotations) => {
    setAnnotations(newAnnotations);
    setHasChanges(true);
  };

  const handleSaveMarkup = async () => {
    // If we're in draft mode with changes, publish the version
    if (statusTab === 'draft' && hasChanges) {
      await handlePublish();
    } else {
      logger.debug('Dashboard', 'Save markup clicked - no changes to publish');
    }
  };

  // Publish current draft version
  const handlePublish = async () => {
    if (!projectUuid || !selectedVersion) {
      return;
    }

    try {
      const response = await axios.post(`/project/${projectUuid}/versions/${selectedVersion}/publish`);

      if (response.data.success) {
        toast.success(`Version ${selectedVersion} published successfully!`, {
          position: 'top-right',
          autoClose: 3000
        });

        // Refetch versions to update UI
        await fetchVersions();
      }
    } catch (error) {
      logger.error('Dashboard', 'Error publishing version:', error);
      toast.error('Failed to publish version', {
        position: 'top-right',
        autoClose: 5000
      });
    }
  };

  // Get filtered versions based on current status tab
  const getFilteredVersions = () => {
    return versions.filter(v => {
      const versionStatus = v.status || 'draft'; // Default to draft if no status
      return versionStatus === statusTab;
    });
  };

  // Handle status tab change
  const handleStatusTabChange = (newStatus) => {
    setStatusTab(newStatus);

    // Auto-select first version in the new tab
    const filteredVersions = versions.filter(v => {
      const versionStatus = v.status || 'draft';
      return versionStatus === newStatus;
    });

    if (filteredVersions.length > 0) {
      const latest = filteredVersions.find(v => v.is_latest) || filteredVersions[filteredVersions.length - 1];
      setSelectedVersion(latest.version_number);
    } else {
      setSelectedVersion(null);
      setPresignedUrl(null);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={styles.fullHeightCenter}>
        <LoadingSpinner size="lg" label="Loading versions..." />
      </div>
    );
  }

  // No versions available
  if (versions.length === 0) {
    return (
      <div className={styles.fullHeightCenter}>
        <div className={styles.emptyStateContainer}>
          <div className={styles.emptyStateIcon}>📄</div>
          <h3 className={styles.emptyStateHeading}>
            No Plan Sets Available
          </h3>
          <p className={styles.emptyStateText}>
            Plan sets will appear here once generated
          </p>
        </div>
      </div>
    );
  }

  // Define view steps for standard sub-tab navigation
  const viewSteps = [
    { key: 'draft', label: 'Draft' },
    { key: 'published', label: 'Published' },
  ];

  return (
    <div className={styles.mainContainer}>
      {/* Header: Sub-tab Navigation + Version Dropdown */}
      <div className={styles.headerSection}>
        {/* Left Side: Standard Sub-tab Navigation + Version Dropdown */}
        <div className={styles.headerLeft}>
          {/* Standard Sub-tab Navigation */}
          <div className={styles.viewNavigation}>
            {viewSteps.map((view, index) => (
              <a
                key={view.key}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentView('planset');
                  handleStatusTabChange(view.key);
                }}
                className={`${styles.viewLink} ${index === 0 ? styles.viewLinkFirst : ''} ${
                  view.key === statusTab && currentView === 'planset' ? styles.viewLinkActive : ''
                }`}
              >
                {view.label}
                {view.key === statusTab && currentView === 'planset' && (
                  <span className={`${styles.viewLinkIndicator} ${index === 0 ? styles.viewLinkIndicatorFirst : styles.viewLinkIndicatorCenter}`} />
                )}
              </a>
            ))}

            {/* Version Dropdown - Between Published and Spec Sheets */}
            {currentView === 'planset' && getFilteredVersions().length > 0 && (
              <Dropdown
                trigger={
                  <button type="button" className={styles.versionButton}>
                    <span>
                      {selectedVersion ? `V${selectedVersion}${getFilteredVersions().find(v => v.version_number === selectedVersion)?.is_latest ? ' (Latest)' : ''}` : 'Select version...'}
                    </span>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginLeft: '0.5rem' }}>
                      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                }
                align="left"
                position="bottom"
                closeOnClick={true}
              >
                {getFilteredVersions().map(v => (
                  <Dropdown.Item
                    key={v.version_number}
                    onClick={() => handleVersionClick(v.version_number)}
                  >
                    V{v.version_number}{v.is_latest ? ' (Latest)' : ''}
                  </Dropdown.Item>
                ))}
              </Dropdown>
            )}

            {/* Spec Sheets Tab */}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setCurrentView('specsheets');
              }}
              className={`${styles.viewLink} ${currentView === 'specsheets' ? styles.viewLinkActive : ''}`}
            >
              Spec Sheets
              {currentView === 'specsheets' && (
                <span className={`${styles.viewLinkIndicator} ${styles.viewLinkIndicatorCenter}`} />
              )}
            </a>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.actionButtons}>
          {/* Publish Button - Always visible */}
          {selectedVersion && statusTab === 'draft' && (
            <Button
              variant="outline"
              onClick={handlePublish}
              size="md"
            >
              Publish
            </Button>
          )}

          {/* Tools Button - Only visible when PDF is loaded */}
          {presignedUrl && (
            <button
              onClick={handleToggleAnnotationMode}
              className={`${styles.pillButton} ${isAnnotationMode ? styles.pillButtonPrimary : styles.pillButtonOutlinePrimary}`}
            >
              Tools
            </button>
          )}

          {/* Full Screen Button - Only visible when PDF is loaded */}
          {presignedUrl && (
            <button
              onClick={handleFullScreen}
              className={`${styles.pillButton} ${isModalOpen ? styles.pillButtonPrimary : styles.pillButtonSecondary}`}
            >
              Full Screen
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className={styles.contentArea}>
        {currentView === 'planset' ? (
        /* PDF Viewer Container */
        <div className={styles.pdfContainer}>
          {error && (
          <div className={styles.errorAlert}>
            ⚠️ {error}
          </div>
        )}

        {loadingPdf ? (
          <div className={styles.flexCenter} style={{ flex: 1 }}>
            <LoadingSpinner size="lg" label="Loading PDF..." />
          </div>
        ) : presignedUrl ? (
          <>
            <iframe
              src={presignedUrl}
              className={styles.pdfIframe}
              title={`Plan Set Version ${selectedVersion}`}
            />

            {/* Annotation Layer Overlay */}
            <PdfAnnotationLayer
              ref={annotationLayerRef}
              isActive={isAnnotationMode}
              currentTool={currentTool}
              currentColor={currentColor}
              annotations={annotations}
              onAnnotationsChange={handleAnnotationsChange}
              onToolChange={setCurrentTool}
              currentPage={1}
            />

            {/* Annotation Toolbar */}
            {isAnnotationMode && (
              <PdfToolbar
                currentTool={currentTool}
                onToolChange={setCurrentTool}
                currentColor={currentColor}
                onColorChange={setCurrentColor}
                canSave={hasChanges}
                onSave={handleSaveMarkup}
                statusTab={statusTab}
              />
            )}
          </>
        ) : (
          <div className={styles.flexCenter} style={{ flex: 1 }}>
            <div className={styles.textCenter} style={{ color: 'var(--text-disabled)' }}>
              <p>Select a version to view the plan set</p>
            </div>
          </div>
        )}
        </div>
        ) : (
        /* Spec Sheets View */
        <SpecSheetGrid
          attachments={specSheetAttachments}
          loading={loadingSpecSheets}
          onView={handleViewSpecSheet}
          onRefresh={fetchSpecSheets}
          emptyMessage="Spec sheets attached in Submit tab will appear here"
        />
        )}
      </div>

      {/* Full Screen Modal - Plan Set */}
      <PdfFullScreenModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        presignedUrl={presignedUrl}
        versionNumber={selectedVersion}
        fileName="Plan Set"
      />

      {/* Full Screen Modal - Spec Sheets */}
      <PdfFullScreenModal
        isOpen={!!viewingSpecSheet}
        onClose={() => setViewingSpecSheet(null)}
        presignedUrl={viewingSpecSheet?.url}
        fileName={viewingSpecSheet?.fileName}
        versionNumber={viewingSpecSheet?.version}
      />
    </div>
  );
};

export default PlanSetVersions;
