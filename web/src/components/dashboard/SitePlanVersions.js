import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import sitePlanService from '../../services/sitePlanService';
import logger from '../../services/devLogger';
import styles from '../../styles/Dashboard.module.css';
import PdfFullScreenModal from '../pdf/PdfFullScreenModal';
import PdfAnnotationLayer from '../pdf/PdfAnnotationLayer';
import PdfToolbar from '../pdf/PdfToolbar';
import { LoadingSpinner, Button, Dropdown, Modal, Textarea } from '../ui';
import { useSocket } from '../../hooks/useSocket';

/**
 * SitePlanVersions - Site Plan tab with Draft/Published sub-tabs and upload
 * Now displays converted PNG images instead of raw PDFs.
 * Listens for 'siteplan:converted' WebSocket events after upload.
 *
 * @param {string} projectUuid - Project UUID
 * @param {number} projectId - Optional direct project ID
 */
const SitePlanVersions = ({ projectUuid, projectId: directProjectId }) => {
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [presignedUrl, setPresignedUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingImage, setLoadingImage] = useState(false);
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

  // Annotation state
  const [isAnnotationMode, setIsAnnotationMode] = useState(true);
  const [currentTool, setCurrentTool] = useState('select');
  const [currentColor, setCurrentColor] = useState('var(--color-danger)');
  const [annotations, setAnnotations] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const annotationLayerRef = useRef(null);

  // Zoom state
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef(null);

  // Upload state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadNotes, setUploadNotes] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Socket hook
  const { onSitePlanConverted, joinProject, leaveProject } = useSocket();

  // Join project room for socket events
  useEffect(() => {
    if (projectUuid) {
      joinProject(projectUuid);
      return () => leaveProject(projectUuid);
    }
  }, [projectUuid, joinProject, leaveProject]);

  // Fetch all versions
  const fetchVersions = useCallback(async () => {
    if (!projectUuid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await sitePlanService.list(projectUuid);

      if (response.status === 'SUCCESS' && response.data.length > 0) {
        const sortedVersions = response.data.sort((a, b) => b.versionNumber - a.versionNumber);
        setVersions(sortedVersions);

        const publishedVersions = sortedVersions.filter(v => v.status === 'published');
        const draftVersions = sortedVersions.filter(v => v.status === 'draft');

        if (publishedVersions.length > 0) {
          setStatusTab('published');
          const latest = publishedVersions[0];
          setSelectedVersion(latest);
        } else if (draftVersions.length > 0) {
          setStatusTab('draft');
          const latest = draftVersions[0];
          setSelectedVersion(latest);
        }
      } else {
        setVersions([]);
      }
    } catch (error) {
      logger.error('SitePlan', 'Error fetching versions:', error);
      setError('Failed to load site plan versions');
      setVersions([]);
    } finally {
      setLoading(false);
    }
  }, [projectUuid]);

  /**
   * Fetch the converted PNG image URL for a site plan version.
   * Falls back to the original PDF download URL if no image is available yet.
   * Handles multi-page PDFs by setting up page tabs.
   */
  const fetchImageUrl = useCallback(async (version) => {
    if (!projectUuid || !version) return;

    try {
      setLoadingImage(true);
      setPresignedUrl(null);
      setPages([]);
      setActivePage(1);
      setPageCount(1);

      // Track if images were successfully loaded
      let imagesLoaded = false;

      // Try the image-url endpoint first (PNG)
      try {
        const imgResponse = await sitePlanService.getImageUrl(projectUuid, version.id);
        const imgData = imgResponse?.data || imgResponse;

        // Normalize snake_case API response to camelCase
        if (imgData) {
          if (imgData.image_url && !imgData.imageUrl) imgData.imageUrl = imgData.image_url;
          if (imgData.image_key && !imgData.imageKey) imgData.imageKey = imgData.image_key;
          if (imgData.conversion_status && !imgData.conversionStatus) imgData.conversionStatus = imgData.conversion_status;
          if (imgData.page_count && !imgData.pageCount) imgData.pageCount = imgData.page_count;
          if (imgData.pages) {
            imgData.pages = imgData.pages.map(p => ({
              ...p,
              imageUrl: p.imageUrl || p.image_url,
              imageKey: p.imageKey || p.image_key,
            }));
          }
        }

        logger.debug('SitePlan', 'Image URL response:', { status: imgResponse.status, hasPages: !!imgData?.pages, hasSingleImage: !!imgData?.imageUrl, conversionStatus: imgData?.conversionStatus });

        // Check if we have image URLs (conversion complete)
        if (imgData?.pages && imgData.pages.length > 0) {
          // Multi-page response
          setPages(imgData.pages);
          setPageCount(imgData.pageCount || imgData.pages.length);
          setPresignedUrl(imgData.pages[0]?.imageUrl || null);
          setActivePage(1);
          setConversionPending(false);
          imagesLoaded = true;
          logger.log('SitePlan', `Loaded ${imgData.pages.length} pages for version ${version.versionNumber}`);
          return;
        }

        if (imgData?.imageUrl) {
          // Single image (backward compat)
          setPages([{ page: 1, label: 'pg1', imageUrl: imgData.imageUrl, imageKey: imgData.imageKey }]);
          setPageCount(1);
          setPresignedUrl(imgData.imageUrl);
          setActivePage(1);
          setConversionPending(false);
          imagesLoaded = true;
          logger.log('SitePlan', `Loaded single image for version ${version.versionNumber}`);
          return;
        }

        // If conversion is still pending
        if (imgData?.conversionStatus === 'pending' || imgData?.conversionStatus === 'processing') {
          logger.log('SitePlan', `Conversion pending for version ${version.versionNumber}`);
          setConversionPending(true);
          return;
        }

        // If we get here, conversion may have failed or not started
        logger.warn('SitePlan', `No image data and no pending status for version ${version.versionNumber}`);
      } catch (imgErr) {
        // image-url endpoint might not exist yet or conversion not done
        logger.debug('SitePlan', 'Image URL not available, falling back to PDF:', imgErr.message);
      }

      // Fallback: get the original PDF download URL (only if images weren't loaded)
      if (!imagesLoaded) {
        const response = await sitePlanService.getDownloadUrl(projectUuid, version.id);
        if (response.status === 'SUCCESS') {
          setPresignedUrl(response.data.downloadUrl);
          setPages([]);
          setPageCount(1);
        }
      }
    } catch (error) {
      logger.error('SitePlan', 'Error fetching URL:', error);
      setError('Failed to load site plan');
    } finally {
      setLoadingImage(false);
    }
  }, [projectUuid]);

  // Listen for conversion completion
  useEffect(() => {
    const cleanup = onSitePlanConverted(async (data) => {
      logger.log('SitePlan', '[WebSocket] siteplan:converted received:', data);

      if (data.conversionStatus === 'complete') {
        setConversionPending(false);
        toast.success('Site plan image ready!');

        // If this is the currently selected version, fetch the PNG URLs (all pages)
        if (selectedVersion && data.sitePlanId === selectedVersion.id) {
          try {
            const imgResponse = await sitePlanService.getImageUrl(projectUuid, data.sitePlanId);
            const imgData = imgResponse?.data || imgResponse;

            // Normalize snake_case API response to camelCase
            if (imgData) {
              if (imgData.image_url && !imgData.imageUrl) imgData.imageUrl = imgData.image_url;
              if (imgData.image_key && !imgData.imageKey) imgData.imageKey = imgData.image_key;
              if (imgData.conversion_status && !imgData.conversionStatus) imgData.conversionStatus = imgData.conversion_status;
              if (imgData.page_count && !imgData.pageCount) imgData.pageCount = imgData.page_count;
              if (imgData.pages) {
                imgData.pages = imgData.pages.map(p => ({
                  ...p,
                  imageUrl: p.imageUrl || p.image_url,
                  imageKey: p.imageKey || p.image_key,
                }));
              }
            }

            if (imgData?.pages && imgData.pages.length > 0) {
              setPages(imgData.pages);
              setPageCount(imgData.pageCount || imgData.pages.length);
              setPresignedUrl(imgData.pages[0]?.imageUrl || null);
              setActivePage(1);
            } else if (imgData?.imageUrl) {
              setPages([{ page: 1, label: 'pg1', imageUrl: imgData.imageUrl, imageKey: imgData.imageKey }]);
              setPageCount(1);
              setPresignedUrl(imgData.imageUrl);
              setActivePage(1);
            }
          } catch (err) {
            logger.error('SitePlan', 'Error fetching converted images:', err);
          }
        }

        // Refresh versions to get updated conversion_status
        fetchVersions();
      } else if (data.conversionStatus === 'failed') {
        setConversionPending(false);
        toast.error('Site plan conversion failed. You can retry from the version menu.');
      }
    });

    return cleanup;
  }, [onSitePlanConverted, selectedVersion, projectUuid, fetchVersions]);

  // Fetch versions on mount
  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  // Fetch image URL when version changes
  useEffect(() => {
    if (selectedVersion) {
      fetchImageUrl(selectedVersion);
    }
  }, [selectedVersion, fetchImageUrl]);

  // Handle version selection
  const handleVersionClick = (versionId) => {
    const version = versions.find(v => v.id === versionId);
    setSelectedVersion(version);
    setPresignedUrl(null);
    setConversionPending(false);
    // Reset page state when switching versions
    setPages([]);
    setActivePage(1);
    setPageCount(1);
  };

  // Get filtered versions based on current status tab
  const getFilteredVersions = () => {
    return versions.filter(v => v.status === statusTab);
  };

  // Handle status tab change
  const handleStatusTabChange = (newStatus) => {
    setStatusTab(newStatus);

    const filteredVersions = versions.filter(v => v.status === newStatus);

    if (filteredVersions.length > 0) {
      const latest = filteredVersions[0];
      setSelectedVersion(latest);
    } else {
      setSelectedVersion(null);
      setPresignedUrl(null);
    }

    // Reset page state when switching status tabs
    setPages([]);
    setActivePage(1);
    setPageCount(1);
    // Reset zoom
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
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

  // Upload handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const validTypes = ['application/pdf', ''];
      const validExtensions = ['.pdf', '.dwg'];
      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));

      if (validTypes.includes(file.type) || validExtensions.includes(ext)) {
        setUploadFile(file);
      } else {
        toast.error('Only PDF and DWG files are allowed');
      }
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));

      if (file.type === 'application/pdf' || ext === '.pdf' || ext === '.dwg') {
        setUploadFile(file);
      } else {
        toast.error('Only PDF and DWG files are allowed');
      }
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;

    if (uploadFile.size > 50 * 1024 * 1024) {
      toast.error('File must be less than 50MB');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 1. Get presigned URL
      const urlResponse = await sitePlanService.getUploadUrl(
        projectUuid,
        uploadFile.name,
        uploadFile.type || 'application/octet-stream',
        uploadFile.size
      );
      const { uploadUrl, fileKey, nextVersion } = urlResponse.data;

      // 2. Upload to S3 with progress
      await sitePlanService.uploadToS3(uploadUrl, uploadFile, setUploadProgress);

      // 3. Create record in backend (triggers conversion)
      await sitePlanService.create(projectUuid, {
        fileKey,
        fileName: uploadFile.name,
        fileSize: uploadFile.size,
        versionNumber: nextVersion,
        notes: uploadNotes
      });

      // 4. Success - close modal and show converting state
      toast.success(`Site plan V${nextVersion} uploaded — converting to image...`);
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadNotes('');
      setUploadProgress(0);
      setConversionPending(true);

      // 5. Refresh versions list (will show new version with 'pending' conversion)
      await fetchVersions();
    } catch (error) {
      logger.error('SitePlan', 'Upload failed:', error);
      toast.error('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Retry conversion for a failed version
  const handleRetryConversion = async () => {
    if (!projectUuid || !selectedVersion) return;

    try {
      setConversionPending(true);
      await sitePlanService.retryConversion(projectUuid, selectedVersion.id);
      toast.info('Retrying conversion...');
    } catch (err) {
      logger.error('SitePlan', 'Retry conversion failed:', err);
      toast.error('Failed to retry conversion');
      setConversionPending(false);
    }
  };

  // Publish current draft version
  const handlePublish = async () => {
    if (!projectUuid || !selectedVersion) return;

    try {
      const response = await sitePlanService.publish(projectUuid, selectedVersion.id);

      if (response.status === 'SUCCESS') {
        toast.success(`Version ${selectedVersion.versionNumber} published successfully!`, {
          position: 'top-right',
          autoClose: 3000
        });

        await fetchVersions();
      }
    } catch (error) {
      logger.error('SitePlan', 'Error publishing version:', error);
      toast.error('Failed to publish version', {
        position: 'top-right',
        autoClose: 5000
      });
    }
  };

  // Annotation handlers
  const handleFullScreen = () => setIsModalOpen(true);

  const handleToggleAnnotationMode = () => setIsAnnotationMode(!isAnnotationMode);

  const handleAnnotationsChange = (newAnnotations) => {
    setAnnotations(newAnnotations);
    setHasChanges(true);
  };

  const handleSaveMarkup = async () => {
    if (statusTab === 'draft' && hasChanges) {
      await handlePublish();
    }
  };

  // Determine if the presigned URL is a PNG (image) or PDF
  const isImageUrl = presignedUrl && (
    presignedUrl.includes('preview.png') ||
    presignedUrl.includes('.png') ||
    selectedVersion?.imageKey
  );

  const viewSteps = [
    { key: 'draft', label: 'Draft' },
    { key: 'published', label: 'Published' },
  ];

  // Render the site plan content area
  const renderContent = () => {
    if (error) {
      return (
        <div className={styles.errorAlert}>
          ⚠️ {error}
        </div>
      );
    }

    if (loading) {
      return (
        <div className={styles.flexCenter} style={{ flex: 1 }}>
          <LoadingSpinner size="lg" label="Loading versions..." />
        </div>
      );
    }

    if (getFilteredVersions().length === 0) {
      return (
        <div className={styles.flexCenter} style={{ flex: 1 }}>
          <div className={styles.emptyStateContainer}>
            <div className={styles.emptyStateIcon}>📄</div>
            <h3 className={styles.emptyStateHeading}>
              No {statusTab === 'draft' ? 'Draft' : 'Published'} Site Plans
            </h3>
            <p className={styles.emptyStateText}>
              {statusTab === 'draft'
                ? 'Upload a site plan PDF or DWG to get started'
                : 'Publish a draft to see it here'}
            </p>
          </div>
        </div>
      );
    }

    // Conversion in progress
    if (conversionPending) {
      return (
        <div className={styles.flexCenter} style={{ flex: 1 }}>
          <div style={{ textAlign: 'center' }}>
            <LoadingSpinner size="lg" />
            <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>
              Converting site plan to image...
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-disabled)', marginTop: '0.5rem' }}>
              This usually takes a few seconds
            </p>
          </div>
        </div>
      );
    }

    // Conversion failed
    if (selectedVersion?.conversionStatus === 'failed') {
      return (
        <div className={styles.flexCenter} style={{ flex: 1 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Image conversion failed for this version
            </p>
            <Button variant="outline" onClick={handleRetryConversion}>
              Retry Conversion
            </Button>
          </div>
        </div>
      );
    }

    if (loadingImage) {
      return (
        <div className={styles.flexCenter} style={{ flex: 1 }}>
          <LoadingSpinner size="lg" label="Loading site plan..." />
        </div>
      );
    }

    if (!presignedUrl) {
      return (
        <div className={styles.flexCenter} style={{ flex: 1 }}>
          <div className={styles.textCenter} style={{ color: 'var(--text-disabled)' }}>
            <p>Select a version to view the site plan</p>
          </div>
        </div>
      );
    }

    // Display PNG image or fallback to PDF iframe
    if (isImageUrl) {
      return (
        <>
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
              alt={`Site Plan Version ${selectedVersion?.versionNumber}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                backgroundColor: 'var(--bg-panel)',
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
      );
    }

    // Fallback: PDF iframe (for versions without PNG conversion)
    return (
      <>
        <iframe
          src={presignedUrl}
          className={styles.pdfIframe}
          title={`Site Plan Version ${selectedVersion?.versionNumber}`}
        />

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
    );
  };

  return (
    <div className={styles.mainContainer}>
      {/* Header: Sub-tab Navigation + Version Dropdown */}
      <div className={styles.headerSection}>
        <div className={styles.headerLeft}>
          <div className={styles.viewNavigation}>
            {viewSteps.map((view, index) => (
              <a
                key={view.key}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleStatusTabChange(view.key);
                }}
                className={`${styles.viewLink} ${index === 0 ? styles.viewLinkFirst : ''} ${
                  view.key === statusTab ? styles.viewLinkActive : ''
                }`}
              >
                {view.label}
                {view.key === statusTab && (
                  <span className={`${styles.viewLinkIndicator} ${index === 0 ? styles.viewLinkIndicatorFirst : styles.viewLinkIndicatorCenter}`} />
                )}
              </a>
            ))}

            {/* Version Dropdown */}
            {getFilteredVersions().length > 0 && (
              <Dropdown
                trigger={
                  <button type="button" className={styles.versionButton}>
                    <span>
                      {selectedVersion
                        ? `V${selectedVersion.versionNumber}${selectedVersion.versionNumber === Math.max(...versions.map(x => x.versionNumber)) ? ' (Latest)' : ''}`
                        : 'Select version...'}
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
                    key={v.id}
                    onClick={() => handleVersionClick(v.id)}
                  >
                    V{v.versionNumber}{v.versionNumber === Math.max(...versions.map(x => x.versionNumber)) ? ' (Latest)' : ''}
                  </Dropdown.Item>
                ))}
              </Dropdown>
            )}
          </div>

          {/* Page tabs - only show for multi-page documents */}
          {pageCount > 1 && pages.length > 0 && !loading && !conversionPending && (
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
          <Button
            variant="primary"
            onClick={() => setShowUploadModal(true)}
            size="md"
          >
            Upload
          </Button>

          {selectedVersion && statusTab === 'draft' && (
            <Button
              variant="outline"
              onClick={handlePublish}
              size="md"
            >
              Publish
            </Button>
          )}

          {presignedUrl && !conversionPending && (
            <button
              onClick={handleToggleAnnotationMode}
              className={`${styles.pillButton} ${isAnnotationMode ? styles.pillButtonPrimary : styles.pillButtonOutlinePrimary}`}
            >
              Tools
            </button>
          )}

          {presignedUrl && !conversionPending && (
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
        <div className={styles.pdfContainer}>
          {renderContent()}
        </div>
      </div>

      {/* Full Screen Modal */}
      <PdfFullScreenModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        presignedUrl={presignedUrl}
        versionNumber={selectedVersion?.versionNumber}
        fileName="Site Plan"
      />

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => !isUploading && setShowUploadModal(false)}
        title="Upload Site Plan"
      >
        <div className={styles.uploadModalContent}>
          <div
            className={`${styles.dropZone} ${dragActive ? styles.dragActive : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.dwg"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            {uploadFile ? (
              <div className={styles.selectedFile}>
                <span>📄 {uploadFile.name}</span>
                <span className={styles.fileSize}>
                  ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
            ) : (
              <>
                <div className={styles.dropIcon}>📄</div>
                <p>Drop PDF or DWG here or click to browse</p>
                <p className={styles.hint}>PDF or DWG files, max 50MB</p>
              </>
            )}
          </div>

          <Textarea
            label="Notes (optional)"
            value={uploadNotes}
            onChange={(e) => setUploadNotes(e.target.value)}
            placeholder="Version notes..."
            rows={2}
          />

          {isUploading && (
            <div className={styles.progressContainer}>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span>{uploadProgress}%</span>
            </div>
          )}

          <div className={styles.modalActions}>
            <Button
              variant="ghost"
              onClick={() => setShowUploadModal(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleUpload}
              disabled={!uploadFile || isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SitePlanVersions;
