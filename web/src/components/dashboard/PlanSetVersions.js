import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from '../../config/axios';
import { toast } from 'react-toastify';
import logger from '../../services/devLogger';
import planSetService from '../../services/planSetService';
import sitePlanService from '../../services/sitePlanService';
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
const PlanSetVersions = ({ projectUuid, onQCPanelChange, refreshTrigger }) => {
  logger.log('PlanSet', `[Component] PlanSetVersions mounted/rendered with projectUuid=${projectUuid}`);

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

  // Site plan integration state
  const [sitePlanPages, setSitePlanPages] = useState([]);  // Published site plan pages to merge

  // Status tab state: 'draft' or 'published'
  const [statusTab, setStatusTab] = useState('draft');

  // View state: 'planset' or 'specsheets'
  const [currentView, setCurrentView] = useState('planset');

  // Annotation state
  const [isAnnotationMode, setIsAnnotationMode] = useState(true); // Start with tools open
  const [currentTool, setCurrentTool] = useState('select');
  const [currentColor, setCurrentColor] = useState('#dc2626'); // Red default
  const [annotations, setAnnotations] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const annotationLayerRef = useRef(null);

  // Zoom state
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef(null);

  // Stable refs for socket listener (prevents register/unregister thrashing)
  const selectedVersionRef = useRef(null);
  const fetchImageUrlRef = useRef(null);
  const fetchVersionsRef = useRef(null);
  const fetchPublishedSitePlanPagesRef = useRef(null);

  // QC Checklist panel state - now supports 'site' and 'design' types
  const [activeQCType, setActiveQCType] = useState(null); // null, 'site', or 'design'

  // Spec sheet state
  const [specSheetAttachments, setSpecSheetAttachments] = useState([]);
  const [loadingSpecSheets, setLoadingSpecSheets] = useState(false);
  const [viewingSpecSheet, setViewingSpecSheet] = useState(null);

  // Socket.io hooks
  const { joinProject, leaveProject, onPlanSetConverted, onSitePlanConverted } = useSocket();

  // Ref to hold polling interval ID so we can clear it early when socket event fires
  const pollingIntervalRef = useRef(null);

  // Fetch published site plan pages to merge into plan set
  const fetchPublishedSitePlanPages = useCallback(async () => {
    if (!projectUuid) return;

    try {
      logger.log('PlanSet', '[fetchPublishedSitePlanPages] Fetching published site plan');

      // Get published site plan
      const response = await sitePlanService.getPublished(projectUuid);

      if (response.status === 'SUCCESS' && response.data) {
        const publishedSitePlan = response.data;
        logger.log('PlanSet', '[fetchPublishedSitePlanPages] Found published site plan:', publishedSitePlan);

        // Get the image URLs for the published site plan
        const imgResponse = await sitePlanService.getImageUrl(projectUuid, publishedSitePlan.id);
        const imgData = imgResponse?.data || imgResponse;

        // Normalize snake_case to camelCase
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

        // Check if we have pages
        if (imgData?.pages && imgData.pages.length > 0) {
          logger.log('PlanSet', `[fetchPublishedSitePlanPages] Got ${imgData.pages.length} site plan pages`);
          setSitePlanPages(imgData.pages);
        } else {
          logger.log('PlanSet', '[fetchPublishedSitePlanPages] No site plan pages available yet');
          setSitePlanPages([]);
        }
      } else {
        logger.log('PlanSet', '[fetchPublishedSitePlanPages] No published site plan found');
        setSitePlanPages([]);
      }
    } catch (error) {
      // It's okay if there's no published site plan yet
      logger.debug('PlanSet', '[fetchPublishedSitePlanPages] Error fetching published site plan:', error.message);
      setSitePlanPages([]);
    }
  }, [projectUuid]);

  // Fetch all versions (extracted to useCallback so it can be called from socket listener)
  const fetchVersions = useCallback(async () => {
    logger.log('PlanSet', `[fetchVersions] Called with projectUuid=${projectUuid}`);

    if (!projectUuid) {
      logger.warn('PlanSet', '[fetchVersions] Early return - no projectUuid');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      logger.log('PlanSet', `[fetchVersions] Fetching versions from /project/${projectUuid}/versions`);
      const response = await axios.get(`/project/${projectUuid}/versions`);

      if (response.data.success && response.data.versions.length > 0) {
        logger.log('PlanSet', `[fetchVersions] Got ${response.data.versions.length} versions`);
        setVersions(response.data.versions);

        // Determine if we have published versions
        const publishedVersions = response.data.versions.filter(v => v.status === 'published');
        const draftVersions = response.data.versions.filter(v => v.status === 'draft' || !v.status);

        logger.log('PlanSet', `[fetchVersions] Published: ${publishedVersions.length}, Draft: ${draftVersions.length}`);

        // If we have published, show published tab; otherwise show draft
        if (publishedVersions.length > 0) {
          setStatusTab('published');
          const latestPublished = publishedVersions.find(v => v.is_latest) || publishedVersions[publishedVersions.length - 1];
          setSelectedVersion(latestPublished.version_number);
          logger.log('PlanSet', `[fetchVersions] Selected published version ${latestPublished.version_number}`);
        } else if (draftVersions.length > 0) {
          setStatusTab('draft');
          const latestDraft = draftVersions.find(v => v.is_latest) || draftVersions[draftVersions.length - 1];
          setSelectedVersion(latestDraft.version_number);
          logger.log('PlanSet', `[fetchVersions] Selected draft version ${latestDraft.version_number}`);
        }
      } else {
        logger.warn('PlanSet', '[fetchVersions] No versions found or unsuccessful response');
        setVersions([]);
      }
    } catch (error) {
      logger.error('PlanSet', '[fetchVersions] Error fetching versions:', error);
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

  // Fetch published site plan pages when viewing published plan set
  useEffect(() => {
    if (statusTab === 'published') {
      fetchPublishedSitePlanPages();
    } else {
      setSitePlanPages([]);
    }
  }, [statusTab, fetchPublishedSitePlanPages]);

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

  /**
   * Fetch the converted PNG image URL for a plan set version.
   * Falls back to the original PDF presigned URL if no image is available yet.
   * Handles multi-page PDFs by setting up page tabs.
   */
  const fetchImageUrl = useCallback(async (versionNumber) => {
    logger.log('PlanSet', `[fetchImageUrl] Called with versionNumber=${versionNumber}, projectUuid=${projectUuid}`);

    if (!projectUuid || !versionNumber) {
      logger.warn('PlanSet', `[fetchImageUrl] Early return - projectUuid or versionNumber missing`);
      return;
    }

    logger.log('PlanSet', `[fetchImageUrl] Fetching image URL for version ${versionNumber}`);

    try {
      setLoadingPdf(true);
      setPresignedUrl(null);
      setPages([]);
      setActivePage(1);
      setPageCount(1);

      // Track if images were successfully loaded
      let imagesLoaded = false;

      // Try the image-url endpoint first (PNG)
      try {
        logger.log('PlanSet', `Calling planSetService.getImageUrl(${projectUuid}, ${versionNumber})`);
        const imgResponse = await planSetService.getImageUrl(projectUuid, versionNumber);
        const imgData = imgResponse?.data || imgResponse;

        // Normalize snake_case API response to camelCase and apply custom PV labels
        if (imgData) {
          if (imgData.image_url && !imgData.imageUrl) imgData.imageUrl = imgData.image_url;
          if (imgData.image_key && !imgData.imageKey) imgData.imageKey = imgData.image_key;
          if (imgData.conversion_status && !imgData.conversionStatus) imgData.conversionStatus = imgData.conversion_status;
          if (imgData.page_count && !imgData.pageCount) imgData.pageCount = imgData.page_count;
          if (imgData.pages) {
            // Custom PV label mapping for plan sets
            const pvLabelMap = {
              1: 'PV 1',
              2: 'PV 2',
              3: 'PV 3',
              4: 'PV 4',
              5: 'PV 5',
              6: 'PV 5.1',
              7: 'PV 5.2',
              8: 'PV 6',
              9: 'PV 7',
              10: 'PV 8'
            };

            // Filter out pages 2, 3, and 9 (PV 2, PV 3, and PV 7), then map labels
            imgData.pages = imgData.pages
              .filter(p => p.page !== 2 && p.page !== 3 && p.page !== 9)
              .map(p => ({
                ...p,
                imageUrl: p.imageUrl || p.image_url,
                imageKey: p.imageKey || p.image_key,
                label: pvLabelMap[p.page] || p.label || `Page ${p.page}`
              }));
          }
        }

        logger.log('PlanSet', 'Image URL response:', {
          status: imgResponse.status,
          hasPages: !!imgData?.pages,
          hasSingleImage: !!imgData?.imageUrl,
          conversionStatus: imgData?.conversionStatus,
          fullResponse: imgData
        });

        // Check if we have image URLs (conversion complete)
        if (imgData?.pages && imgData.pages.length > 0) {
          // Multi-page response
          let mergedPages = [...imgData.pages];

          // If we're viewing published plan set and have site plan pages, merge them in
          if (statusTab === 'published' && sitePlanPages.length > 0) {
            logger.log('PlanSet', `Merging ${sitePlanPages.length} site plan pages into plan set`);

            // Site plan pages should be inserted at positions 2, 3, and 9
            // Site plan page 1 (PV 2) -> plan set position 2
            // Site plan page 2 (PV 3) -> plan set position 3
            // Site plan page 3 (PV 7) -> plan set position 9

            const sitePlanInsertions = [
              { sitePlanPageIndex: 0, planSetPosition: 2, label: 'PV 2' },  // First site plan page
              { sitePlanPageIndex: 1, planSetPosition: 3, label: 'PV 3' },  // Second site plan page
              { sitePlanPageIndex: 2, planSetPosition: 9, label: 'PV 7' },  // Third site plan page
            ];

            // Build the final merged array
            const finalPages = [];
            let planSetIndex = 0;

            for (let i = 1; i <= 10; i++) {  // We'll have 10 pages total in the merged plan set
              const insertion = sitePlanInsertions.find(ins => ins.planSetPosition === i);

              if (insertion && sitePlanPages[insertion.sitePlanPageIndex]) {
                // Insert site plan page
                finalPages.push({
                  page: i,
                  label: insertion.label,
                  imageUrl: sitePlanPages[insertion.sitePlanPageIndex].imageUrl,
                  imageKey: sitePlanPages[insertion.sitePlanPageIndex].imageKey,
                  isSitePlan: true
                });
              } else if (planSetIndex < mergedPages.length) {
                // Insert plan set page
                finalPages.push({
                  ...mergedPages[planSetIndex],
                  page: i,
                  isSitePlan: false
                });
                planSetIndex++;
              }
            }

            mergedPages = finalPages;
            logger.log('PlanSet', `Merged plan set now has ${mergedPages.length} pages`);
          }

          setPages(mergedPages);
          setPageCount(mergedPages.length);
          setPresignedUrl(mergedPages[0]?.imageUrl || null);
          setActivePage(1);
          setConversionPending(false);
          imagesLoaded = true;
          logger.log('PlanSet', `Loaded ${mergedPages.length} pages for version ${versionNumber}`);
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

      // Fallback: get the original PDF presigned URL (only if images weren't loaded)
      if (!imagesLoaded) {
        const response = await axios.get(`/project/${projectUuid}/versions/${versionNumber}/presigned-url`);
        if (response.data.success) {
          setPresignedUrl(response.data.presigned_url);
          setPages([]);
          setPageCount(1);
        }
      }
    } catch (error) {
      logger.error('PlanSet', 'Error fetching URL:', error);
      setError(`Failed to load Version ${versionNumber}`);
    } finally {
      setLoadingPdf(false);
    }
  }, [projectUuid, statusTab, sitePlanPages]);

  // Keep refs current so socket listeners don't need to re-register
  selectedVersionRef.current = selectedVersion;
  fetchImageUrlRef.current = fetchImageUrl;
  fetchVersionsRef.current = fetchVersions;
  fetchPublishedSitePlanPagesRef.current = fetchPublishedSitePlanPages;

  // Listen for conversion completion
  useEffect(() => {
    const cleanup = onPlanSetConverted(async (data) => {
      logger.log('PlanSet', '[WebSocket] planset:converted received:', data);

      if (data.conversionStatus === 'complete') {
        setConversionPending(false);
        toast.success('Plan set image ready!');

        // Stop polling immediately when socket event fires
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
          logger.log('PlanSet', 'Stopped polling - version ready via socket event');
        }

        // If this is the currently selected version, fetch the PNG URLs (all pages)
        if (selectedVersion && data.versionId === selectedVersion) {
          logger.log('PlanSet', 'Conversion complete for current version, fetching image URL');
          await fetchImageUrl(selectedVersion);
        } else {
          logger.log('PlanSet', 'Conversion complete but not for current version:', {
            received: data.versionId,
            current: selectedVersion
          });
        }

        // Refresh versions to get updated conversion_status
        fetchVersions();
      } else if (data.conversionStatus === 'failed') {
        setConversionPending(false);
        toast.error('Plan set conversion failed. You can retry from the version menu.');
      }
    });

    return cleanup;
  }, [onPlanSetConverted]);

  // Poll for new versions after mount (catches versions created after tab switch)
  useEffect(() => {
    if (!projectUuid) return;

    let pollCount = 0;
    const maxPolls = 6; // 6 polls × 5s = 30s

    pollingIntervalRef.current = setInterval(() => {
      pollCount++;
      fetchVersions();

      // Stop if we've reached max polls
      if (pollCount >= maxPolls) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }, 5000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [projectUuid, refreshTrigger]); // Triggers on mount, project change, OR refresh trigger

  // Listen for site plan conversion completion to refresh merged pages
  useEffect(() => {
    const cleanup = onSitePlanConverted(async (data) => {
      logger.log('PlanSet', '[WebSocket] siteplan:converted received:', data);

      if (data.conversionStatus === 'complete' && statusTab === 'published') {
        logger.log('PlanSet', 'Site plan converted, refreshing published site plan pages');
        await fetchPublishedSitePlanPages();

        // Refresh the current plan set view to show merged pages
        if (selectedVersion) {
          await fetchImageUrl(selectedVersion);
        }
      }
    });

    return cleanup;
  }, [onSitePlanConverted]);

  // Fetch image URL when version changes
  useEffect(() => {
    logger.log('PlanSet', '[useEffect] selectedVersion changed:', selectedVersion);
    if (selectedVersion) {
      logger.log('PlanSet', '[useEffect] Calling fetchImageUrl for version:', selectedVersion);
      fetchImageUrl(selectedVersion);
    } else {
      logger.log('PlanSet', '[useEffect] selectedVersion is null/undefined, skipping fetchImageUrl');
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

  const handlePublish = async () => {
    if (!projectUuid || !selectedVersion) return;

    try {
      // For now, just show a placeholder message since we don't have the publish endpoint yet
      toast.info('Publish functionality coming soon', {
        position: 'top-right',
        autoClose: 3000
      });

      // TODO: Implement publish endpoint
      // const response = await planSetService.publish(projectUuid, selectedVersion);
      // if (response.status === 'SUCCESS') {
      //   toast.success(`Version ${selectedVersion} published successfully!`, {
      //     position: 'top-right',
      //     autoClose: 3000
      //   });
      //   await fetchVersions();
      // }
    } catch (error) {
      logger.error('PlanSet', 'Error publishing version:', error);
      toast.error('Failed to publish version', {
        position: 'top-right',
        autoClose: 5000
      });
    }
  };

  const handleToggleAnnotationMode = () => {
    setIsAnnotationMode(!isAnnotationMode);
  };

  const handleAnnotationsChange = (newAnnotations) => {
    logger.log('PlanSet', 'handleAnnotationsChange called:', {
      annotationCount: newAnnotations?.length,
      annotations: newAnnotations
    });
    setAnnotations(newAnnotations);
    setHasChanges(true);
    logger.log('PlanSet', 'hasChanges set to TRUE - Save button should be enabled');
  };

  const handleSaveMarkup = async () => {
    logger.log('PlanSet', '========== SAVE MARKUP CLICKED ==========');
    logger.log('PlanSet', 'Current state:', { statusTab, hasChanges, selectedVersion, projectUuid });

    // Save annotated images back to S3
    if (statusTab === 'draft' && hasChanges) {
      logger.log('PlanSet', 'Save conditions met - proceeding with save');

      try {
        // Get the annotation layer canvas and export all pages as images
        logger.log('PlanSet', 'Checking annotationLayerRef:', {
          exists: !!annotationLayerRef.current,
          current: annotationLayerRef.current
        });

        if (!annotationLayerRef.current) {
          logger.error('PlanSet', 'annotationLayerRef.current is null - aborting save');
          toast.error('No annotations to save', {
            position: 'top-right',
            autoClose: 3000
          });
          return;
        }

        toast.info('Saving annotations...', {
          position: 'top-right',
          autoClose: 2000
        });

        // Get canvas data for all pages with annotations
        logger.log('PlanSet', 'Calling exportAllPages()...');
        const annotatedPages = await annotationLayerRef.current.exportAllPages();
        logger.log('PlanSet', 'exportAllPages() returned:', {
          count: annotatedPages?.length,
          pages: annotatedPages
        });

        if (!annotatedPages || annotatedPages.length === 0) {
          logger.warn('PlanSet', 'No annotated pages returned from exportAllPages()');
          toast.error('No annotated pages to save', {
            position: 'top-right',
            autoClose: 3000
          });
          return;
        }

        // Add imageKey from pages state to each annotated page
        logger.log('PlanSet', 'Adding imageKeys to pages. Current pages state:', pages);
        const pagesWithKeys = annotatedPages.map(annotatedPage => {
          const pageData = pages.find(p => p.page === annotatedPage.pageNumber);
          logger.log('PlanSet', `Mapping page ${annotatedPage.pageNumber}:`, {
            pageData,
            imageKey: pageData?.imageKey
          });
          return {
            ...annotatedPage,
            imageKey: pageData?.imageKey || null
          };
        });
        logger.log('PlanSet', 'Pages with keys:', pagesWithKeys);

        // Validate that all pages have imageKeys
        const missingKeys = pagesWithKeys.filter(p => !p.imageKey);
        if (missingKeys.length > 0) {
          logger.error('PlanSet', 'Cannot save - missing imageKeys for pages:', missingKeys.map(p => p.pageNumber));
          toast.error('Failed to save - missing image keys', {
            position: 'top-right',
            autoClose: 3000
          });
          return;
        }

        // Save to backend
        logger.log('PlanSet', 'Calling planSetService.saveAnnotations with:', {
          projectUuid,
          selectedVersion,
          pageCount: pagesWithKeys.length
        });

        const response = await planSetService.saveAnnotations(
          projectUuid,
          selectedVersion,
          pagesWithKeys
        );

        logger.log('PlanSet', 'Backend response:', response);

        if (response.status === 'SUCCESS') {
          logger.log('PlanSet', 'Save successful!');
          toast.success(`Saved ${response.data.pagesUpdated} annotated pages!`, {
            position: 'top-right',
            autoClose: 3000
          });

          // Reset changes flag
          setHasChanges(false);

          // Refresh the images to show the saved annotations
          logger.log('PlanSet', 'Refreshing images...');
          await fetchImageUrl(selectedVersion);
          logger.log('PlanSet', '========== SAVE COMPLETE ==========');
        }
      } catch (error) {
        logger.error('PlanSet', 'Error saving annotations:', error);
        logger.error('PlanSet', 'Error stack:', error.stack);
        toast.error('Failed to save annotations', {
          position: 'top-right',
          autoClose: 5000
        });
      }
    } else {
      logger.warn('PlanSet', 'Save conditions NOT met:', {
        statusTab,
        expectedStatusTab: 'draft',
        hasChanges,
        reason: statusTab !== 'draft' ? 'Not on draft tab' : 'No changes to save'
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
                  crossOrigin="anonymous"
                  src={presignedUrl}
                  alt={`Plan Set Version ${selectedVersion}`}
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

                {/* Annotation Layer Overlay - MUST be inside imageContainer */}
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
              </div>
            ) : (
              <iframe
                src={presignedUrl}
                className={styles.pdfIframe}
                title={`Plan Set Version ${selectedVersion}`}
              />
            )}

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









