import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from '../../config/axios';
import { toast } from 'react-toastify';
import logger from '../../services/devLogger';
import planSetService from '../../services/planSetService';
import { useSocket } from '../../hooks/useSocket';
import styles from '../../styles/Dashboard.module.css';
import PdfFullScreenModal from '../pdf/PdfFullScreenModal';
import PdfAnnotationLayer from '../pdf/PdfAnnotationLayer';
import PdfToolbar from '../pdf/PdfToolbar';
import { LoadingSpinner, Button, Dropdown } from '../ui';
import SpecSheetGrid from './SpecSheetGrid';

/**
 * PlanSetVersions - Version tabs for viewing different plan set iterations
 * Now displays converted PNG images instead of raw PDFs.
 * Listens for 'planset:converted' WebSocket events after upload.
 */
const PlanSetVersions = ({ projectUuid, onQCPanelChange }) => {
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [presignedUrl, setPresignedUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Conversion state
  const [conversionPending, setConversionPending] = useState(false);

  // Multi-page state
  const [pages, setPages] = useState([]);           // Array of { page, label, imageUrl, imageKey }
  const [activePage, setActivePage] = useState(1);   // Currently selected page number
  const [pageCount, setPageCount] = useState(1);

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
  const annotationLayerRef = useRef(null);

  // Zoom state
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef(null);

  // QC Checklist panel state - now supports 'site' and 'design' types
  const [activeQCType, setActiveQCType] = useState(null); // null, 'site', or 'design'

  // Spec sheet state
  const [specSheetAttachments, setSpecSheetAttachments] = useState([]);
  const [loadingSpecSheets, setLoadingSpecSheets] = useState(false);
  const [viewingSpecSheet, setViewingSpecSheet] = useState(null);

  // Socket.io hooks
  const { joinProject, leaveProject, onPlanSetConverted } = useSocket();

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

  // Join project room for WebSocket updates
  useEffect(() => {
    if (projectUuid) {
      joinProject(projectUuid);
      return () => leaveProject(projectUuid);
    }
  }, [projectUuid, joinProject, leaveProject]);

  // Listen for conversion completion
  useEffect(() => {
    const cleanup = onPlanSetConverted(async (data) => {
      logger.log('PlanSet', '[WebSocket] planset:converted received:', data);

      if (data.conversionStatus === 'complete') {
        setConversionPending(false);
        toast.success('Plan set image ready!');

        // If this is the currently selected version, fetch the PNG URLs (all pages)
        if (selectedVersion && data.versionId === selectedVersion) {
          await fetchImageUrl(selectedVersion);
        }

        // Refresh versions to get updated conversion_status
        fetchVersions();
      } else if (data.conversionStatus === 'failed') {
        setConversionPending(false);
        toast.error('Plan set conversion failed. You can retry from the version menu.');
      }
    });

    return cleanup;
  }, [onPlanSetConverted, selectedVersion, projectUuid, fetchVersions]);

  /**
   * Fetch the converted PNG image URL for a plan set version.
   * Falls back to the original PDF presigned URL if no image is available yet.
   * Handles multi-page PDFs by setting up page tabs.
   */
  const fetchImageUrl = useCallback(async (versionNumber) => {
    if (!projectUuid || !versionNumber) return;

    try {
      setLoadingPdf(true);
      setPresignedUrl(null);
      setPages([]);
      setActivePage(1);
      setPageCount(1);

      // Try the image-url endpoint first (PNG)
      try {
        const imgResponse = await planSetService.getImageUrl(projectUuid, versionNumber);
        const imgData = imgResponse?.data?.data || imgResponse?.data;

        logger.debug('PlanSet', 'Image URL response:', {
          status: imgResponse.status,
          hasPages: !!imgData?.pages,
          hasSingleImage: !!imgData?.imageUrl,
          conversionStatus: imgData?.conversionStatus
        });

        // Check if we have image URLs (conversion complete)
        if (imgData?.pages && imgData.pages.length > 0) {
          // Multi-page response
          setPages(imgData.pages);
          setPageCount(imgData.pageCount || imgData.pages.length);
          setPresignedUrl(imgData.pages[0]?.imageUrl || null);
          setActivePage(1);
          setConversionPending(false);
          logger.log('PlanSet', `Loaded ${imgData.pages.length} pages for version ${versionNumber}`);
          return;
        }

        if (imgData?.imageUrl) {
          // Single image (backward compat)
          setPages([{ page: 1, label: 'pg1', imageUrl: imgData.imageUrl, imageKey: imgData.imageKey }]);
          setPageCount(1);
          setPresignedUrl(imgData.imageUrl);
          setActivePage(1);
          setConversionPending(false);
          logger.log('PlanSet', `Loaded single image for version ${versionNumber}`);
          return;
        }

        // If conversion is still pending
        if (imgData?.conversionStatus === 'pending' || imgData?.conversionStatus === 'processing') {
          logger.log('PlanSet', `Conversion pending for version ${versionNumber}`);
          setConversionPending(true);
          return;
        }

        // If we get here, conversion may have failed or not started
        logger.warn('PlanSet', `No image data and no pending status for version ${versionNumber}`);
      } catch (imgErr) {
        // image-url endpoint might not exist yet or conversion not done
        logger.debug('PlanSet', 'Image URL not available, falling back to PDF:', imgErr.message);
      }

      // Fallback: get the original PDF presigned URL
      const response = await axios.get(`/project/${projectUuid}/versions/${versionNumber}/presigned-url`);
      if (response.data.success) {
        setPresignedUrl(response.data.presigned_url);
        setPages([]);
        setPageCount(1);
      }
    } catch (error) {
      logger.error('PlanSet', 'Error fetching URL:', error);
      setError(`Failed to load Version ${versionNumber}`);
    } finally {
      setLoadingPdf(false);
    }
  }, [projectUuid]);

  // Fetch image URL when version changes
  useEffect(() => {
    if (selectedVersion) {
      fetchImageUrl(selectedVersion);
    }
  }, [selectedVersion, fetchImageUrl]);

  const handleVersionClick = (versionNumber) => {
    setSelectedVersion(versionNumber);
    setPresignedUrl(null);
    setConversionPending(false);
    // Reset page state when switching versions
    setPages([]);
    setActivePage(1);
    setPageCount(1);
  };

  // Zoom handlers
  const handleMouseDown = useCallback((e) => {
    if (e.button === 0 && zoom > 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      e.preventDefault();
    }
  }, [zoom, panOffset]);

  const handleMouseMove = useCallback((e) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.25, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  }, []);

  // Reset zoom when switching versions or pages
  useEffect(() => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  }, [selectedVersion, activePage]);

  // Attach wheel event listener with { passive: false } to allow preventDefault
  useEffect(() => {
    const container = imageContainerRef.current;
    if (!container) return;

    const wheelHandler = (e) => {
      e.preventDefault();
      const delta = e.deltaY * -0.001;
      setZoom(prevZoom => {
        const newZoom = Math.min(Math.max(0.5, prevZoom + delta), 5);
        return newZoom;
      });
    };

    container.addEventListener('wheel', wheelHandler, { passive: false });
    return () => container.removeEventListener('wheel', wheelHandler);
  }, []);

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

          {/* Page tabs - only show for multi-page documents */}
          {currentView === 'planset' && pageCount > 1 && pages.length > 0 && !loading && !conversionPending && (
            <div className={styles.pageTabs}>
              {pages.map((pg) => (
                <button
                  key={pg.page}
                  className={`${styles.pageTab} ${activePage === pg.page ? styles.pageTabActive : ''}`}
                  onClick={() => {
                    setActivePage(pg.page);
                    setPresignedUrl(pg.imageUrl);
                  }}
                >
                  {pg.label}
                </button>
              ))}
            </div>
          )}
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
            <LoadingSpinner size="lg" label="Loading plan set..." />
          </div>
        ) : conversionPending ? (
          <div className={styles.flexCenter} style={{ flex: 1 }}>
            <div className={styles.textCenter}>
              <LoadingSpinner size="lg" label="Converting to image..." />
              <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>
                This may take a minute for large files
              </p>
            </div>
          </div>
        ) : presignedUrl ? (
          <>
            {/* Check if URL is an image (PNG) or PDF */}
            {presignedUrl.includes('.png') || presignedUrl.includes('image') || pages.length > 0 ? (
              <div
                ref={imageContainerRef}
                className={styles.imageContainer}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{
                  cursor: isPanning ? 'grabbing' : zoom > 1 ? 'grab' : 'default',
                  overflow: 'hidden',
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                }}
              >
                <img
                  src={presignedUrl}
                  alt={`Plan Set Version ${selectedVersion}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    backgroundColor: 'var(--bg-secondary, #f5f5f5)',
                    transform: `scale(${zoom}) translate(${panOffset.x / zoom}px, ${panOffset.y / zoom}px)`,
                    transformOrigin: 'center center',
                    transition: isPanning ? 'none' : 'transform 0.1s ease-out',
                  }}
                />

                {/* Floating Zoom Controls */}
                <div className={styles.zoomControls}>
                  <button
                    className={styles.zoomButton}
                    onClick={handleZoomIn}
                    disabled={zoom >= 5}
                    title="Zoom In"
                  >
                    +
                  </button>
                  <div className={styles.zoomDisplay}>
                    {Math.round(zoom * 100)}%
                  </div>
                  <button
                    className={styles.zoomButton}
                    onClick={handleZoomOut}
                    disabled={zoom <= 0.5}
                    title="Zoom Out"
                  >
                    −
                  </button>
                  <button
                    className={styles.zoomButton}
                    onClick={handleZoomReset}
                    disabled={zoom === 1 && panOffset.x === 0 && panOffset.y === 0}
                    title="Reset Zoom"
                  >
                    ⟲
                  </button>
                </div>
              </div>
            ) : (
              <iframe
                src={presignedUrl}
                className={styles.pdfIframe}
                title={`Plan Set Version ${selectedVersion}`}
              />
            )}

            {/* Annotation Layer Overlay */}
            <PdfAnnotationLayer
              ref={annotationLayerRef}
              isActive={isAnnotationMode}
              currentTool={currentTool}
              currentColor={currentColor}
              annotations={annotations}
              onAnnotationsChange={handleAnnotationsChange}
              onToolChange={setCurrentTool}
              currentPage={activePage}
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
