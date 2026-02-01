import React, { useState } from 'react';
import { Grid, List } from 'lucide-react';
import CompactTabs from '../common/CompactTabs';
import SurveyNotesPanel from './SurveyNotesPanel';
import MediaGallery from './MediaGallery';
import EquipmentSectionGroup from './EquipmentSectionGroup';
import ComingSoon from '../common/ComingSoon';
import PhotoPanelViewer from './PhotoPanelViewer';
import MapPanel from '../maps/MapPanel';
import styles from '../../styles/SurveyPanel.module.css';

// Simple SVG icons for grid toggle
const GridIcon2x2 = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <rect x="1" y="1" width="6" height="6" rx="1" />
    <rect x="9" y="1" width="6" height="6" rx="1" />
    <rect x="1" y="9" width="6" height="6" rx="1" />
    <rect x="9" y="9" width="6" height="6" rx="1" />
  </svg>
);

const GridIcon3x3 = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <rect x="1" y="1" width="4" height="4" rx="0.5" />
    <rect x="6" y="1" width="4" height="4" rx="0.5" />
    <rect x="11" y="1" width="4" height="4" rx="0.5" />
    <rect x="1" y="6" width="4" height="4" rx="0.5" />
    <rect x="6" y="6" width="4" height="4" rx="0.5" />
    <rect x="11" y="6" width="4" height="4" rx="0.5" />
    <rect x="1" y="11" width="4" height="4" rx="0.5" />
    <rect x="6" y="11" width="4" height="4" rx="0.5" />
    <rect x="11" y="11" width="4" height="4" rx="0.5" />
  </svg>
);

const GridIcon4x4 = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <rect x="1" y="1" width="2.5" height="2.5" rx="0.3" />
    <rect x="4.5" y="1" width="2.5" height="2.5" rx="0.3" />
    <rect x="8" y="1" width="2.5" height="2.5" rx="0.3" />
    <rect x="11.5" y="1" width="2.5" height="2.5" rx="0.3" />
    <rect x="1" y="4.5" width="2.5" height="2.5" rx="0.3" />
    <rect x="4.5" y="4.5" width="2.5" height="2.5" rx="0.3" />
    <rect x="8" y="4.5" width="2.5" height="2.5" rx="0.3" />
    <rect x="11.5" y="4.5" width="2.5" height="2.5" rx="0.3" />
    <rect x="1" y="8" width="2.5" height="2.5" rx="0.3" />
    <rect x="4.5" y="8" width="2.5" height="2.5" rx="0.3" />
    <rect x="8" y="8" width="2.5" height="2.5" rx="0.3" />
    <rect x="11.5" y="8" width="2.5" height="2.5" rx="0.3" />
    <rect x="1" y="11.5" width="2.5" height="2.5" rx="0.3" />
    <rect x="4.5" y="11.5" width="2.5" height="2.5" rx="0.3" />
    <rect x="8" y="11.5" width="2.5" height="2.5" rx="0.3" />
    <rect x="11.5" y="11.5" width="2.5" height="2.5" rx="0.3" />
  </svg>
);

const UploadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

/**
 * SurveyPanel - Parent container for survey-related content with sub-tabs
 * Replaces the old Gallery tab with organized survey data
 *
 * Sub-tabs: Notes, Photos, Videos, SS Report, Map
 *
 * @param {string} projectUuid - Project UUID for fetching survey data
 * @param {object} projectData - Full project data object containing site info for Map
 * @param {function} onSwitchToFilesTab - Callback to switch to main Files tab
 */
const SurveyPanel = ({ projectUuid, projectData, onSwitchToFilesTab }) => {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('surveyPanelTab') || 'photos';
  });
  const [gridSize, setGridSize] = useState(() => {
    return localStorage.getItem('surveyGalleryGridSize') || 'medium';
  });
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('surveyViewMode') || 'grid';
  });
  const [photoCount, setPhotoCount] = useState(0);
  const [videoCount, setVideoCount] = useState(0);
  const [uploadTrigger, setUploadTrigger] = useState({ type: null, timestamp: 0 });

  // Photo viewer state
  const [viewerState, setViewerState] = useState({
    isOpen: false,
    media: [],
    currentIndex: 0
  });

  // Zoom state for photo viewer
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const handleGridSizeChange = (size) => {
    setGridSize(size);
    localStorage.setItem('surveyGalleryGridSize', size);
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('surveyViewMode', mode);
  };

  const handleUploadClick = (mediaType) => {
    setUploadTrigger({ type: mediaType, timestamp: Date.now() });
  };

  const handleOpenPhoto = (media, index) => {
    setViewerState({
      isOpen: true,
      media,
      currentIndex: index
    });
  };

  const handleCloseViewer = () => {
    setViewerState({
      isOpen: false,
      media: [],
      currentIndex: 0
    });
    // Reset zoom when closing viewer
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleNavigateViewer = (direction) => {
    setViewerState(prev => ({
      ...prev,
      currentIndex: Math.max(0, Math.min(prev.media.length - 1, prev.currentIndex + direction))
    }));
    // Reset zoom when navigating
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleZoomReset = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  const handleUpdatePhoto = (photoId, updates) => {
    // Update the photo in the viewer state
    setViewerState(prev => ({
      ...prev,
      media: prev.media.map(item =>
        item.id === photoId ? { ...item, ...updates } : item
      )
    }));
  };

  const renderControls = (activeTab) => {
    if (activeTab === 'photos' || activeTab === 'all') {
      const count = activeTab === 'photos' ? photoCount : null;

      return (
        <React.Fragment>
          {/* Zoom controls with close button - only show when photo viewer is open */}
          {viewerState.isOpen && (
            <div className={styles.zoomControls}>
              <button
                type="button"
                className={styles.zoomBtn}
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
                title="Zoom Out"
              >
                −
              </button>
              <span className={styles.zoomLevel}>{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                className={styles.zoomBtn}
                onClick={handleZoomIn}
                disabled={zoom >= 5}
                title="Zoom In"
              >
                +
              </button>
              <button
                type="button"
                className={styles.resetBtn}
                onClick={handleZoomReset}
                disabled={zoom === 1 && pan.x === 0 && pan.y === 0}
                title="Reset"
              >
                Reset
              </button>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={handleCloseViewer}
                title="Close (ESC)"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          )}

          {count !== null && !viewerState.isOpen && (
            <span className={styles.mediaCount}>
              {count} items
            </span>
          )}

          {/* View Mode Toggle (Grid/List) - hide when viewer is open */}
          {!viewerState.isOpen && (
            <div className={styles.viewToggle}>
              <button
                type="button"
                className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.active : ''}`}
                onClick={() => handleViewModeChange('grid')}
                title="Grid view"
              >
                <Grid size={16} />
              </button>
              <button
                type="button"
                className={`${styles.viewBtn} ${viewMode === 'list' ? styles.active : ''}`}
                onClick={() => handleViewModeChange('list')}
                title="List view"
              >
                <List size={16} />
              </button>
            </div>
          )}

          {/* Grid Size Toggle (only show in grid mode and when viewer is not open) */}
          {viewMode === 'grid' && !viewerState.isOpen && (
            <div className={styles.gridToggle}>
              <button
                type="button"
                className={`${styles.gridBtn} ${gridSize === 'large' ? styles.active : ''}`}
                onClick={() => handleGridSizeChange('large')}
                title="Large thumbnails"
              >
                <GridIcon2x2 />
              </button>
              <button
                type="button"
                className={`${styles.gridBtn} ${gridSize === 'medium' ? styles.active : ''}`}
                onClick={() => handleGridSizeChange('medium')}
                title="Medium thumbnails"
              >
                <GridIcon3x3 />
              </button>
              <button
                type="button"
                className={`${styles.gridBtn} ${gridSize === 'small' ? styles.active : ''}`}
                onClick={() => handleGridSizeChange('small')}
                title="Small thumbnails"
              >
                <GridIcon4x4 />
              </button>
            </div>
          )}
        </React.Fragment>
      );
    }
    return null;
  };

  const tabContent = {
    all: <EquipmentSectionGroup projectUuid={projectUuid} gridSize={gridSize} />,
    photos: viewerState.isOpen ? (
      <PhotoPanelViewer
        media={viewerState.media}
        currentIndex={viewerState.currentIndex}
        onClose={handleCloseViewer}
        onNavigate={handleNavigateViewer}
        onUpdatePhoto={handleUpdatePhoto}
        projectUuid={projectUuid}
        mediaType="photo"
        zoom={zoom}
        pan={pan}
        setZoom={setZoom}
        setPan={setPan}
      />
    ) : (
      <MediaGallery
        projectUuid={projectUuid}
        mediaType="both"
        gridSize={gridSize}
        viewMode={viewMode}
        onCountChange={setPhotoCount}
        uploadTrigger={uploadTrigger.type === 'photos' ? uploadTrigger.timestamp : 0}
        enableUploads={false}
        onTabSwitch={onSwitchToFilesTab}
        onPhotoClick={handleOpenPhoto}
      />
    ),
    notes: (
      <SurveyNotesPanel projectUuid={projectUuid} compact={false} />
    ),
    map: projectData ? (
      <MapPanel
        address={projectData?.site?.address}
        city={projectData?.site?.city}
        state={projectData?.site?.state}
        zip={projectData?.site?.zip}
        lat={projectData?.site?.lat}
        lng={projectData?.site?.lng}
        projectUuid={projectData?.uuid}
      />
    ) : null,
    report: (
      <ComingSoon
        feature="Site Survey Report"
        description="The comprehensive site survey report is currently under development. This feature will provide detailed documentation of your site survey data."
      />
    ),
  };

  return (
    <div className={styles.surveyPanel}>
      <CompactTabs
        tabs={[
          { id: 'all', label: 'All' },
          { id: 'photos', label: 'Photos' },
          { id: 'notes', label: 'Notes' },
          { id: 'map', label: 'Map' },
          { id: 'report', label: 'SS Report' },
        ]}
        defaultTab="photos"
        storageKey="surveyPanelTab"
        renderControls={renderControls}
        tabContent={tabContent}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
};

export default SurveyPanel;
