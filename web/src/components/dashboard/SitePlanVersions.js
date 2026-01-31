import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import axios from '../../config/axios';
import sitePlanService from '../../services/sitePlanService';
import logger from '../../services/devLogger';
import styles from '../../styles/Dashboard.module.css';
import PdfFullScreenModal from '../pdf/PdfFullScreenModal';
import PdfAnnotationLayer from '../pdf/PdfAnnotationLayer';
import PdfToolbar from '../pdf/PdfToolbar';
import { LoadingSpinner, Button, Dropdown, Modal, Textarea } from '../ui';

/**
 * SitePlanVersions - Site Plan tab with Draft/Published sub-tabs and upload
 * Mirrors PlanSetVersions.js structure with upload functionality added
 *
 * @param {string} projectUuid - Project UUID (will be converted to ID via API)
 * @param {number} projectId - Optional direct project ID
 */
const SitePlanVersions = ({ projectUuid, projectId: directProjectId }) => {
  const [projectId, setProjectId] = useState(directProjectId);
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [presignedUrl, setPresignedUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Status tab state: 'draft' or 'published'
  const [statusTab, setStatusTab] = useState('draft');

  // Annotation state
  const [isAnnotationMode, setIsAnnotationMode] = useState(true);
  const [currentTool, setCurrentTool] = useState('select');
  const [currentColor, setCurrentColor] = useState('var(--color-danger)');
  const [annotations, setAnnotations] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const annotationLayerRef = useRef(null);

  // Upload state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadNotes, setUploadNotes] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch project ID from UUID if only UUID is provided
  useEffect(() => {
    const fetchProjectId = async () => {
      if (directProjectId) {
        setProjectId(directProjectId);
        return;
      }

      if (!projectUuid) {
        setLoading(false);
        return;
      }

      try {
        const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
        const companyId = userData?.company?.uuid;

        const endpoint = companyId
          ? `/project/${projectUuid}?companyId=${companyId}`
          : `/project/${projectUuid}`;

        const response = await axios.get(endpoint);
        const projectData = response.data.data || response.data;

        if (projectData?.id) {
          setProjectId(projectData.id);
        } else {
          logger.error('SitePlan', 'No project ID found in response');
          setError('Failed to load project information');
          setLoading(false);
        }
      } catch (error) {
        logger.error('SitePlan', 'Error fetching project ID:', error);
        setError('Failed to load project information');
        setLoading(false);
      }
    };

    fetchProjectId();
  }, [projectUuid, directProjectId]);

  // Fetch all versions
  const fetchVersions = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await sitePlanService.list(projectId);

      if (response.status === 'SUCCESS' && response.data.length > 0) {
        // Sort by version number descending
        const sortedVersions = response.data.sort((a, b) => b.versionNumber - a.versionNumber);
        setVersions(sortedVersions);

        // Determine if we have published versions
        const publishedVersions = sortedVersions.filter(v => v.status === 'published');
        const draftVersions = sortedVersions.filter(v => v.status === 'draft');

        // If we have published, show published tab; otherwise show draft
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
  }, [projectId]);

  // Fetch versions on mount
  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  // Fetch presigned URL when version changes
  useEffect(() => {
    const fetchPresignedUrl = async () => {
      if (!projectId || !selectedVersion) {
        return;
      }

      try {
        setLoadingPdf(true);
        setPresignedUrl(null);
        const response = await sitePlanService.getDownloadUrl(projectId, selectedVersion.id);

        if (response.status === 'SUCCESS') {
          setPresignedUrl(response.data.downloadUrl);
        }
      } catch (error) {
        logger.error('SitePlan', 'Error fetching presigned URL:', error);
        setError('Failed to load site plan PDF');
      } finally {
        setLoadingPdf(false);
      }
    };

    fetchPresignedUrl();
  }, [projectId, selectedVersion]);

  // Handle version selection
  const handleVersionClick = (versionId) => {
    const version = versions.find(v => v.id === versionId);
    setSelectedVersion(version);
    setPresignedUrl(null);
  };

  // Get filtered versions based on current status tab
  const getFilteredVersions = () => {
    return versions.filter(v => v.status === statusTab);
  };

  // Handle status tab change
  const handleStatusTabChange = (newStatus) => {
    setStatusTab(newStatus);

    // Auto-select first version in the new tab
    const filteredVersions = versions.filter(v => v.status === newStatus);

    if (filteredVersions.length > 0) {
      const latest = filteredVersions[0];
      setSelectedVersion(latest);
    } else {
      setSelectedVersion(null);
      setPresignedUrl(null);
    }
  };

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
      if (file.type === 'application/pdf') {
        setUploadFile(file);
      } else {
        toast.error('Only PDF files are allowed');
      }
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf') {
        setUploadFile(file);
      } else {
        toast.error('Only PDF files are allowed');
      }
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;

    // Validate file
    if (uploadFile.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      return;
    }
    if (uploadFile.size > 50 * 1024 * 1024) {
      toast.error('File must be less than 50MB');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 1. Get presigned URL
      const urlResponse = await sitePlanService.getUploadUrl(
        projectId,
        uploadFile.name,
        uploadFile.type,
        uploadFile.size
      );
      const { uploadUrl, fileKey, nextVersion } = urlResponse.data;

      // 2. Upload to S3 with progress
      await sitePlanService.uploadToS3(uploadUrl, uploadFile, setUploadProgress);

      // 3. Create record in backend
      await sitePlanService.create(projectId, {
        fileKey,
        fileName: uploadFile.name,
        fileSize: uploadFile.size,
        versionNumber: nextVersion,
        notes: uploadNotes
      });

      // 4. Success - close modal and refresh
      toast.success(`Site plan V${nextVersion} uploaded successfully`);
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadNotes('');
      setUploadProgress(0);

      // 5. Refresh versions list
      await fetchVersions();
    } catch (error) {
      logger.error('SitePlan', 'Upload failed:', error);
      toast.error('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Publish current draft version
  const handlePublish = async () => {
    if (!projectId || !selectedVersion) {
      return;
    }

    try {
      const response = await sitePlanService.publish(projectId, selectedVersion.id);

      if (response.status === 'SUCCESS') {
        toast.success(`Version ${selectedVersion.versionNumber} published successfully!`, {
          position: 'top-right',
          autoClose: 3000
        });

        // Refetch versions to update UI
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
  const handleFullScreen = () => {
    setIsModalOpen(true);
  };

  const handleToggleAnnotationMode = () => {
    setIsAnnotationMode(!isAnnotationMode);
  };

  const handleAnnotationsChange = (newAnnotations) => {
    setAnnotations(newAnnotations);
    setHasChanges(true);
  };

  const handleSaveMarkup = async () => {
    if (statusTab === 'draft' && hasChanges) {
      await handlePublish();
    } else {
      logger.debug('SitePlan', 'Save markup clicked - no changes to publish');
    }
  };

  // Define view steps for sub-tab navigation
  const viewSteps = [
    { key: 'draft', label: 'Draft' },
    { key: 'published', label: 'Published' },
  ];

  return (
    <div className={styles.mainContainer}>
      {/* Header: Sub-tab Navigation + Version Dropdown */}
      <div className={styles.headerSection}>
        {/* Left Side: Sub-tab Navigation + Version Dropdown */}
        <div className={styles.headerLeft}>
          {/* Sub-tab Navigation */}
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
        </div>

        {/* Action Buttons */}
        <div className={styles.actionButtons}>
          {/* Upload Button */}
          <Button
            variant="primary"
            onClick={() => setShowUploadModal(true)}
            size="md"
          >
            Upload
          </Button>

          {/* Publish Button - Only visible for draft versions */}
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
        {/* PDF Viewer Container */}
        <div className={styles.pdfContainer}>
          {error && (
            <div className={styles.errorAlert}>
              ⚠️ {error}
            </div>
          )}

          {loading ? (
            <div className={styles.flexCenter} style={{ flex: 1 }}>
              <LoadingSpinner size="lg" label="Loading versions..." />
            </div>
          ) : getFilteredVersions().length === 0 ? (
            <div className={styles.flexCenter} style={{ flex: 1 }}>
              <div className={styles.emptyStateContainer}>
                <div className={styles.emptyStateIcon}>📄</div>
                <h3 className={styles.emptyStateHeading}>
                  No {statusTab === 'draft' ? 'Draft' : 'Published'} Site Plans
                </h3>
                <p className={styles.emptyStateText}>
                  {statusTab === 'draft'
                    ? 'Upload a site plan PDF to get started'
                    : 'Publish a draft to see it here'}
                </p>
              </div>
            </div>
          ) : loadingPdf ? (
            <div className={styles.flexCenter} style={{ flex: 1 }}>
              <LoadingSpinner size="lg" label="Loading PDF..." />
            </div>
          ) : presignedUrl ? (
            <>
              <iframe
                src={presignedUrl}
                className={styles.pdfIframe}
                title={`Site Plan Version ${selectedVersion?.versionNumber}`}
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
                <p>Select a version to view the site plan</p>
              </div>
            </div>
          )}
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
          {/* Drop Zone */}
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
              accept=".pdf"
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
                <p>Drop PDF here or click to browse</p>
                <p className={styles.hint}>PDF files only, max 50MB</p>
              </>
            )}
          </div>

          {/* Notes Field */}
          <Textarea
            label="Notes (optional)"
            value={uploadNotes}
            onChange={(e) => setUploadNotes(e.target.value)}
            placeholder="Version notes..."
            rows={2}
          />

          {/* Progress Bar */}
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

          {/* Actions */}
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
