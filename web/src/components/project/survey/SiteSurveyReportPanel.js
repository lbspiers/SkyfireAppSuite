// src/components/project/survey/SiteSurveyReportPanel.js

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { useSurveyReportData } from '../../../hooks/useSurveyReportData';
import { LoadingSpinner, Button, ErrorState } from '../../ui';
import styles from '../../../styles/SiteSurveyReport.module.css';

/**
 * Site Survey Report Panel
 * Generates a professional 6-page printable report for solar site surveys
 *
 * @param {string} projectUuid - Project UUID (required)
 * @param {Object} projectData - Optional project data for customer/site fallback
 */
const SiteSurveyReportPanel = ({ projectUuid, projectData = null }) => {
  const printRef = useRef(null);
  const containerRef = useRef(null);
  const pageRefs = useRef([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(6);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenScale, setFullscreenScale] = useState(1);

  // Fetch all report data
  const { loading, error, data, refresh } = useSurveyReportData(projectUuid, projectData);

  // Fullscreen controls
  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  const handleCloseFullscreen = useCallback(() => {
    setIsFullscreen(false);
  }, []);

  // Calculate scale for fullscreen mode
  const calculateFullscreenScale = useCallback(() => {
    if (typeof window === 'undefined') return 1;
    const viewportHeight = window.innerHeight - 120; // Account for toolbar and padding
    const pageHeight = 1056; // 11in at 96 DPI
    return Math.min(viewportHeight / pageHeight, 1.2); // Max 120% scale
  }, []);

  // Page navigation
  const goToPage = useCallback((pageNumber) => {
    const pageIndex = pageNumber - 1;
    if (pageRefs.current[pageIndex] && containerRef.current) {
      pageRefs.current[pageIndex].scrollIntoView({ behavior: 'smooth', block: 'start' });
      setCurrentPage(pageNumber);
    }
  }, []);

  const handlePreviousPage = useCallback(() => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  }, [currentPage, goToPage]);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  }, [currentPage, totalPages, goToPage]);

  const handlePageInput = useCallback((e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= totalPages) {
      if (isFullscreen) {
        setCurrentPage(value);
      } else {
        goToPage(value);
      }
    }
  }, [totalPages, goToPage, isFullscreen]);

  // Track current page using Intersection Observer (only in normal mode)
  useEffect(() => {
    if (isFullscreen || !containerRef.current || pageRefs.current.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            const pageIndex = pageRefs.current.indexOf(entry.target);
            if (pageIndex !== -1) {
              setCurrentPage(pageIndex + 1);
            }
          }
        });
      },
      {
        root: containerRef.current,
        threshold: [0.5],
      }
    );

    pageRefs.current.forEach((page) => {
      if (page) observer.observe(page);
    });

    return () => {
      observer.disconnect();
    };
  }, [data, isFullscreen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        handleCloseFullscreen();
      } else if (isFullscreen) {
        if (e.key === 'ArrowLeft') {
          handlePreviousPage();
        } else if (e.key === 'ArrowRight') {
          handleNextPage();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, handleCloseFullscreen, handlePreviousPage, handleNextPage]);

  // Update fullscreen scale on window resize
  useEffect(() => {
    if (!isFullscreen) return;

    const updateScale = () => {
      setFullscreenScale(calculateFullscreenScale());
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [isFullscreen, calculateFullscreenScale]);

  // Setup print handler
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: data
      ? `Site_Survey_Report_${data.customer.lastName || 'Customer'}_${data.site.address || 'Site'}`
          .replace(/\s+/g, '_')
          .replace(/[^\w-]/g, '')
      : 'Site_Survey_Report',
    onBeforeGetContent: () => {
      setIsPrinting(true);
      return Promise.resolve();
    },
    onAfterPrint: () => {
      setIsPrinting(false);
    },
  });

  // Loading state
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner />
        <p className={styles.loadingText}>Loading report data...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>⚠️</div>
        <h3 className={styles.errorTitle}>Failed to Load Report</h3>
        <p className={styles.errorText}>{error}</p>
        <Button onClick={refresh} className={styles.refreshButton}>
          Try Again
        </Button>
      </div>
    );
  }

  // Empty state
  if (!data) {
    return (
      <div className={styles.emptyContainer}>
        <div className={styles.emptyIcon}>📄</div>
        <h3 className={styles.emptyTitle}>No Survey Data</h3>
        <p className={styles.emptyText}>
          Survey data will appear here once equipment and site information has been entered.
        </p>
      </div>
    );
  }

  const { company, project, customer, site, electrical, systems, structural, notes, photos } = data;

  // Calculate totals
  const totalSystemSize = systems.reduce((sum, sys) => sum + parseFloat(sys.totalSystemSize || 0), 0).toFixed(2);
  const totalPanels = systems.reduce((sum, sys) => sum + parseInt(sys.panels.qty || 0, 10), 0);
  const totalInverters = systems.reduce((sum, sys) => sum + parseInt(sys.inverter.qty || 0, 10), 0);

  // Group photos by section
  const propertyPhotos = photos.property || [];
  const electricalPhotos = photos.electrical || [];
  const equipmentPhotos = photos.equipment || [];
  const roofPhotos = photos.roof || [];

  // Status label mapping
  const STATUS_LABELS = {
    0: 'New Project',
    1: 'Site Survey',
    2: 'Design',
    3: 'Permitting',
    4: 'Installation',
    5: 'Inspection',
    6: 'Complete',
  };

  const statusLabel = typeof project.status === 'number'
    ? STATUS_LABELS[project.status] || 'Site Survey'
    : project.status || 'Site Survey';

  // Create fullscreen icon SVG
  const FullscreenIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
    </svg>
  );

  // Helper function to render a specific page for fullscreen mode
  const renderPage = (pageNum) => {
    if (!data) return null;

    const { company, customer, site, project, electrical, systems, notes, photos } = data;

    // Ensure we have default objects to prevent undefined errors
    const safeCompany = company || {};
    const safeCustomer = customer || {};
    const safeSite = site || {};
    const safeProject = project || {};
    const safeElectrical = electrical || { mainPanel: {}, mountingPlanes: [] };
    const safeSystems = systems || [];
    const safeNotes = notes || [];
    const safePhotos = photos || {};

    // Calculate totals from systems array
    const totalSystemSize = systems?.reduce((sum, sys) => sum + parseFloat(sys.totalSystemSize || 0), 0).toFixed(2) || '0.00';
    const totalPanels = systems?.reduce((sum, sys) => sum + parseInt(sys.panels?.qty || 0, 10), 0) || 0;
    const totalInverters = systems?.reduce((sum, sys) => sum + parseInt(sys.inverter?.qty || 0, 10), 0) || 0;

    // Get first system for equipment details
    const firstSystem = systems?.[0] || {};
    const equipment = {
      solar: {
        systemSize: totalSystemSize,
        annualProduction: firstSystem.annualProduction || 'TBD',
        panelCount: totalPanels,
        panelManufacturer: firstSystem.panels?.manufacturer || 'TBD',
        panelModel: firstSystem.panels?.model || '',
        panelWattage: firstSystem.panels?.watts || 'TBD',
      },
      inverter: {
        type: firstSystem.inverter?.type || 'TBD',
        manufacturer: firstSystem.inverter?.manufacturer || 'TBD',
        model: firstSystem.inverter?.model || 'TBD',
      }
    };

    // Group photos by section
    const photosBySection = {
      property: photos?.property || [],
      electrical: photos?.electrical || [],
      equipment: photos?.equipment || [],
      roof: photos?.roof || [],
    };
    const STATUS_LABELS = {
      0: 'New Project',
      1: 'Site Survey',
      2: 'Design',
      3: 'Permitting',
      4: 'Installation',
      5: 'Inspection',
      6: 'Complete',
    };
    const statusLabel = typeof safeProject.status === 'number'
      ? STATUS_LABELS[safeProject.status] || 'Site Survey'
      : safeProject.status || 'Site Survey';

    switch (pageNum) {
      case 1:
        return (
          <div className={styles.page} id={`fullscreen-page-${pageNum}`}>
            <div className={styles.coverPage}>
              <div className={styles.coverHeader}>
                <div>
                  {safeCompany.logo ? (
                    <img src={safeCompany.logo} alt={safeCompany.name} className={styles.coverLogo} />
                  ) : (
                    <div className={styles.coverCompanyName}>{safeCompany.name || 'Solar Company'}</div>
                  )}
                </div>
                <div className={styles.coverCompanyInfo}>
                  {safeCompany.address && <div>{safeCompany.address}</div>}
                  {(safeCompany.city || safeCompany.state) && (
                    <div>{safeCompany.city}{safeCompany.city && safeCompany.state && ', '}{safeCompany.state} {safeCompany.zip}</div>
                  )}
                  {safeCompany.phone && <div>Phone: {safeCompany.phone}</div>}
                  {safeCompany.email && <div>Email: {safeCompany.email}</div>}
                  {safeCompany.license && <div>License: {safeCompany.license}</div>}
                </div>
              </div>
              <div className={styles.coverMain}>
                <h1 className={styles.coverTitle}>Site Survey Report</h1>
                <div className={styles.coverSubtitle}>Solar Installation Assessment</div>
                <div className={styles.coverAddress}>{formatAddress(safeSite)}</div>
                <div className={styles.coverCityState}>{safeSite.city}{safeSite.city && safeSite.state && ', '}{safeSite.state} {safeSite.zip}</div>
                {(safeCustomer.firstName || safeCustomer.lastName) && (
                  <div className={styles.coverCustomer}>Prepared for: {safeCustomer.firstName} {safeCustomer.lastName}</div>
                )}
              </div>
              <div className={styles.coverFooter}>
                <div className={styles.coverDate}>Report Date: {formatDate(safeProject.surveyDate || new Date().toISOString())}</div>
                <div className={styles.coverStatus}>Status: {statusLabel}</div>
                <div className={styles.coverProject}>Project ID: {projectUuid || safeProject.uuid || 'N/A'}</div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className={styles.page} id={`fullscreen-page-${pageNum}`}>
            <PageHeader company={safeCompany} site={safeSite} pageNumber={2} />
            <SectionTitle icon="📋" title="Executive Summary" />
            <div className={styles.summarySection}>
              <div className={styles.summaryGrid}>
                <div className={styles.summaryItem}>
                  <strong>System Size:</strong> {equipment.solar.systemSize || 'TBD'} kW
                </div>
                <div className={styles.summaryItem}>
                  <strong>Annual Production:</strong> {equipment.solar.annualProduction || 'TBD'} kWh
                </div>
                <div className={styles.summaryItem}>
                  <strong>Panel Count:</strong> {equipment.solar.panelCount || 'TBD'}
                </div>
                <div className={styles.summaryItem}>
                  <strong>Panel Type:</strong> {equipment.solar.panelManufacturer || 'TBD'} {equipment.solar.panelModel || ''}
                </div>
                <div className={styles.summaryItem}>
                  <strong>Inverter Type:</strong> {equipment.inverter.type || 'TBD'}
                </div>
                <div className={styles.summaryItem}>
                  <strong>Main Service Size:</strong> {electrical.mainPanel.amperage || 'TBD'}A
                </div>
              </div>
            </div>
            <SectionTitle icon="🏠" title="Property Photos" />
            <div className={styles.photoGrid}>
              {photosBySection.property?.slice(0, 6).map((photo, idx) => (
                <div key={idx} className={styles.photoItem}>
                  <img src={photo.url} alt={photo.filename} className={styles.photo} />
                  <div className={styles.photoCaption}>{photo.filename}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className={styles.page} id={`fullscreen-page-${pageNum}`}>
            <PageHeader company={safeCompany} site={safeSite} pageNumber={3} />
            <SectionTitle icon="⚡" title="Electrical Configuration" />
            <h3 className={styles.subsectionTitle}>Main Service Panel</h3>
            <table className={styles.fullTable}>
              <tbody>
                <tr><td><strong>Location:</strong></td><td>{safeElectrical.mainPanel.location || 'Not specified'}</td></tr>
                <tr><td><strong>Amperage:</strong></td><td>{safeElectrical.mainPanel.amperage || 'TBD'}A</td></tr>
                <tr><td><strong>Main Breaker Size:</strong></td><td>{safeElectrical.mainPanel.mainBreakerSize || 'TBD'}A</td></tr>
                <tr><td><strong>Bus Rating:</strong></td><td>{safeElectrical.mainPanel.busRating || 'TBD'}A</td></tr>
                <tr><td><strong>Available Spaces:</strong></td><td>{safeElectrical.mainPanel.availableSpaces || 'TBD'}</td></tr>
              </tbody>
            </table>
            <SectionTitle icon="📸" title="Electrical Photos" />
            <div className={styles.photoGrid}>
              {photosBySection.electrical?.slice(0, 6).map((photo, idx) => (
                <div key={idx} className={styles.photoItem}>
                  <img src={photo.url} alt={photo.filename} className={styles.photo} />
                  <div className={styles.photoCaption}>{photo.filename}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className={styles.page} id={`fullscreen-page-${pageNum}`}>
            <PageHeader company={safeCompany} site={safeSite} pageNumber={4} />
            <SectionTitle icon="🔧" title="Equipment Specifications" />
            <h3 className={styles.subsectionTitle}>Solar Panels</h3>
            <table className={styles.fullTable}>
              <tbody>
                <tr><td><strong>Manufacturer:</strong></td><td>{equipment.solar.panelManufacturer || 'TBD'}</td></tr>
                <tr><td><strong>Model:</strong></td><td>{equipment.solar.panelModel || 'TBD'}</td></tr>
                <tr><td><strong>Wattage:</strong></td><td>{equipment.solar.panelWattage || 'TBD'}W</td></tr>
                <tr><td><strong>Panel Count:</strong></td><td>{equipment.solar.panelCount || 'TBD'}</td></tr>
              </tbody>
            </table>
            <h3 className={styles.subsectionTitle}>Inverter</h3>
            <table className={styles.fullTable}>
              <tbody>
                <tr><td><strong>Type:</strong></td><td>{equipment.inverter.type || 'TBD'}</td></tr>
                <tr><td><strong>Manufacturer:</strong></td><td>{equipment.inverter.manufacturer || 'TBD'}</td></tr>
                <tr><td><strong>Model:</strong></td><td>{equipment.inverter.model || 'TBD'}</td></tr>
              </tbody>
            </table>
            <SectionTitle icon="📸" title="Equipment Photos" />
            <div className={styles.photoGrid}>
              {photosBySection.equipment?.slice(0, 4).map((photo, idx) => (
                <div key={idx} className={styles.photoItem}>
                  <img src={photo.url} alt={photo.filename} className={styles.photo} />
                  <div className={styles.photoCaption}>{photo.filename}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case 5:
        if (!safeNotes || safeNotes.length === 0) return null;
        return (
          <div className={styles.page} id={`fullscreen-page-${pageNum}`}>
            <PageHeader company={safeCompany} site={safeSite} pageNumber={5} />
            <SectionTitle icon="📝" title="Site Survey Notes" />
            <div className={styles.notesSection}>
              {safeNotes.map((note, idx) => (
                <div key={idx} className={styles.noteItem}>
                  <div className={styles.noteHeader}>
                    <strong>{note.title || `Note ${idx + 1}`}</strong>
                    <span className={styles.noteDate}>{formatDate(note.createdAt)}</span>
                  </div>
                  <div className={styles.noteContent}>{note.content}</div>
                  {note.author && <div className={styles.noteAuthor}>— {note.author}</div>}
                </div>
              ))}
            </div>
          </div>
        );

      case 6:
        if (safeElectrical.mountingPlanes?.length === 0) return null;
        return (
          <div className={styles.page} id={`fullscreen-page-${pageNum}`}>
            <PageHeader company={safeCompany} site={safeSite} pageNumber={6} />
            <SectionTitle icon="📐" title="Mounting Planes" />
            <table className={styles.fullTable}>
              <thead>
                <tr>
                  <th>Plane</th>
                  <th>Stories</th>
                  <th>Pitch</th>
                  <th>Azimuth</th>
                  <th>Roof Type</th>
                  <th>Mode</th>
                  <th>Panels</th>
                </tr>
              </thead>
              <tbody>
                {safeElectrical.mountingPlanes?.map((plane, idx) => (
                  <tr key={idx}>
                    <td>{plane.name || `Plane ${idx + 1}`}</td>
                    <td>{plane.stories || 'N/A'}</td>
                    <td>{plane.pitch || 'N/A'}°</td>
                    <td>{plane.azimuth || 'N/A'}°</td>
                    <td>{plane.roofType || 'N/A'}</td>
                    <td>{plane.mode || 'N/A'}</td>
                    <td>{plane.panels || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <SectionTitle icon="📸" title="Roof & Mounting Photos" />
            <div className={styles.photoGrid}>
              {photosBySection.roof?.slice(0, 6).map((photo, idx) => (
                <div key={idx} className={styles.photoItem}>
                  <img src={photo.url} alt={photo.filename} className={styles.photo} />
                  <div className={styles.photoCaption}>{photo.filename}</div>
                </div>
              ))}
            </div>
            <div className={styles.signatureSection}>
              <h3 className={styles.subsectionTitle}>Acknowledgment</h3>
              <div className={styles.signatureInfo}><strong>Surveyor Name:</strong> _________________________________</div>
              <div className={styles.signatureInfo}><strong>Surveyor Signature:</strong> _________________________________</div>
              <div className={styles.signatureInfo}><strong>Date:</strong> _____________</div>
              <div className={styles.signatureInfo}><strong>Homeowner Signature:</strong> _________________________________</div>
              <div className={styles.signatureInfo}><strong>Date:</strong> _____________</div>
            </div>
            <div className={styles.pageFooter}>Generated by {safeCompany.name || 'Solar Company'} • {formatDate(new Date().toISOString())}</div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div className={styles.reportWrapper}>
        {/* Simplified Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <h2 className={styles.reportTitle}>📄 Site Survey Report</h2>
            {/* Compact Page Navigation */}
            <div className={styles.pageNavigation}>
              <Button
                onClick={handlePreviousPage}
                variant="secondary"
                size="small"
                disabled={currentPage <= 1}
                title="Previous page"
              >
                ◀
              </Button>
              <div className={styles.pageInput}>
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => setCurrentPage(parseInt(e.target.value, 10) || 1)}
                  onBlur={handlePageInput}
                  onKeyDown={(e) => e.key === 'Enter' && handlePageInput(e)}
                  className={styles.pageNumberInput}
                />
                <span>/ {totalPages}</span>
              </div>
              <Button
                onClick={handleNextPage}
                variant="secondary"
                size="small"
                disabled={currentPage >= totalPages}
                title="Next page"
              >
                ▶
              </Button>
            </div>
          </div>
          <div className={styles.toolbarRight}>
            <Button onClick={handleToggleFullscreen} variant="secondary" title="Fullscreen view">
              <FullscreenIcon /> Fullscreen
            </Button>
            <Button onClick={handlePrint} variant="primary">
              🖨️ Print
            </Button>
          </div>
        </div>

        {/* Normal Scrollable Container */}
        <div className={styles.printContainer} ref={containerRef}>
          <div ref={printRef}>
        {/* ==================== PAGE 1: COVER PAGE ==================== */}
        <div
          className={styles.page}
          ref={(el) => (pageRefs.current[0] = el)}
          id="page-1"
        >
          <div className={styles.coverPage}>
            {/* Header */}
            <div className={styles.coverHeader}>
              <div>
                {company.logo ? (
                  <img src={company.logo} alt={company.name} className={styles.coverLogo} />
                ) : (
                  <div className={styles.coverCompanyName}>{company.name}</div>
                )}
              </div>
              <div className={styles.coverCompanyInfo}>
                {company.address && <div>{company.address}</div>}
                {(company.city || company.state) && (
                  <div>
                    {company.city}
                    {company.city && company.state && ', '}
                    {company.state} {company.zip}
                  </div>
                )}
                {company.phone && <div>Phone: {company.phone}</div>}
                {company.email && <div>Email: {company.email}</div>}
                {company.license && <div>License: {company.license}</div>}
              </div>
            </div>

            {/* Main Content */}
            <div className={styles.coverMain}>
              <h1 className={styles.coverTitle}>Site Survey Report</h1>
              <div className={styles.coverSubtitle}>Solar Installation Assessment</div>

              <div className={styles.coverAddress}>{formatAddress(site)}</div>
              <div className={styles.coverCityState}>
                {site.city}
                {site.city && site.state && ', '}
                {site.state} {site.zip}
              </div>

              {(customer.firstName || customer.lastName) && (
                <div className={styles.coverCustomer}>
                  Prepared for: {customer.firstName} {customer.lastName}
                </div>
              )}
              {(customer.phone || customer.email) && (
                <div className={styles.coverCustomerContact}>
                  {customer.phone && <span>{customer.phone}</span>}
                  {customer.phone && customer.email && ' • '}
                  {customer.email && <span>{customer.email}</span>}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={styles.coverFooter}>
              <div>
                <strong>Project ID</strong>
                <span>{project.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div>
                <strong>Survey Date</strong>
                <span>{formatDate(project.surveyDate)}</span>
              </div>
              <div>
                <strong>Surveyed By</strong>
                <span>{project.surveyedBy}</span>
              </div>
              <div>
                <strong>Status</strong>
                <span>{statusLabel}</span>
              </div>
              <div>
                <strong>Generated</strong>
                <span>{formatDate(new Date().toISOString())}</span>
              </div>
              <div>
                <strong>Page</strong>
                <span>1 of 6</span>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== PAGE 2: EXECUTIVE SUMMARY ==================== */}
        <div
          className={styles.page}
          ref={(el) => (pageRefs.current[1] = el)}
          id="page-2"
        >
          <PageHeader company={company} site={site} pageNumber={2} />

          <SectionTitle icon="📊" title="Executive Summary" />

          {/* Summary Stats Box */}
          <div className={styles.summaryBox}>
            <div className={styles.summaryTitle}>System Overview</div>
            <div className={styles.summaryGrid}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryValue}>{totalSystemSize}</span>
                <span className={styles.summaryLabel}>Total kW</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryValue}>{totalPanels}</span>
                <span className={styles.summaryLabel}>Solar Panels</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryValue}>{totalInverters}</span>
                <span className={styles.summaryLabel}>Inverters</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryValue}>{systems.length}</span>
                <span className={styles.summaryLabel}>Systems</span>
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className={styles.twoColumn}>
            {/* Site Information */}
            <div>
              <h3 className={styles.reportHeadingLarge}>
                Site Information
              </h3>
              <DataTable
                data={{
                  Address: formatAddress(site),
                  'City, State': `${site.city}, ${site.state} ${site.zip}`,
                  AHJ: site.ahj,
                  Utility: site.utility,
                  'APN/Parcel': site.apn,
                  'Square Footage': site.squareFootage ? `${site.squareFootage} sq ft` : null,
                  Stories: site.stories,
                }}
              />
            </div>

            {/* Electrical Summary */}
            <div>
              <h3 className={styles.reportHeadingLarge}>
                Electrical Summary
              </h3>
              <DataTable
                data={{
                  'SES Type': electrical.sesType,
                  'Main Panel Bus Bar': electrical.mainPanel.busBarRating
                    ? `${electrical.mainPanel.busBarRating}A`
                    : null,
                  'Main Breaker': electrical.mainPanel.mainBreakerRating
                    ? `${electrical.mainPanel.mainBreakerRating}A`
                    : null,
                  'Sub Panels': electrical.subPanels.length || 'None',
                  'POI Method': electrical.poi.method,
                  'POI Breaker': electrical.poi.breakerRating
                    ? `${electrical.poi.breakerRating}A`
                    : null,
                }}
              />
            </div>
          </div>

          {/* Property Photos */}
          {propertyPhotos.length > 0 && (
            <div className={styles.photoSection}>
              <h3 className={styles.reportHeadingMedium}>
                Property Photos
              </h3>
              <PhotoGrid photos={propertyPhotos.slice(0, 4)} columns={4} />
            </div>
          )}
        </div>

        {/* ==================== PAGE 3: EQUIPMENT ==================== */}
        <div
          className={styles.page}
          ref={(el) => (pageRefs.current[2] = el)}
          id="page-3"
        >
          <PageHeader company={company} site={site} pageNumber={3} />

          <SectionTitle icon="⚡" title="System Equipment" />

          {/* Systems */}
          {systems.map((system) => (
            <div key={system.id} className={styles.systemSection}>
              <h3 className={styles.systemTitle}>
                {system.name} ({system.totalSystemSize} kW)
              </h3>

              {/* Inverter */}
              {system.inverter.make && (
                <EquipmentCard
                  title="Inverter"
                  badge={system.inverter.type}
                  data={{
                    Make: system.inverter.make,
                    Model: system.inverter.model,
                    Quantity: system.inverter.qty,
                    'Max Output': system.inverter.maxContinuousOutput
                      ? `${system.inverter.maxContinuousOutput}A`
                      : null,
                  }}
                />
              )}

              {/* Solar Panels */}
              {system.panels.make && (
                <EquipmentCard
                  title="Solar Panels"
                  data={{
                    Make: system.panels.make,
                    Model: system.panels.model,
                    Wattage: system.panels.wattage ? `${system.panels.wattage}W` : null,
                    Quantity: system.panels.qty,
                    'Total Output': system.totalSystemSize ? `${system.totalSystemSize} kW` : null,
                  }}
                />
              )}

              {/* Batteries */}
              {system.batteries && (
                <>
                  {system.batteries.battery1 && (
                    <EquipmentCard
                      title="Battery Storage #1"
                      data={{
                        Make: system.batteries.battery1.make,
                        Model: system.batteries.battery1.model,
                        Quantity: system.batteries.battery1.qty,
                        Capacity: system.batteries.battery1.capacity
                          ? `${system.batteries.battery1.capacity} kWh`
                          : null,
                      }}
                    />
                  )}
                  {system.batteries.battery2 && (
                    <EquipmentCard
                      title="Battery Storage #2"
                      data={{
                        Make: system.batteries.battery2.make,
                        Model: system.batteries.battery2.model,
                        Quantity: system.batteries.battery2.qty,
                        Capacity: system.batteries.battery2.capacity
                          ? `${system.batteries.battery2.capacity} kWh`
                          : null,
                      }}
                    />
                  )}
                </>
              )}
            </div>
          ))}

          {/* Structural Information */}
          {(structural.roofTypes.length > 0 || structural.mountingHardware.length > 0) && (
            <>
              <SectionTitle icon="🏠" title="Structural Information" />

              {structural.roofTypes.map((roofType, index) => (
                <EquipmentCard
                  key={index}
                  title={roofType.name}
                  data={{
                    Material: roofType.material,
                    'Framing Type': roofType.framingType,
                    'Framing Size': roofType.framingSize,
                    'Framing Spacing': roofType.framingSpacing
                      ? `${roofType.framingSpacing}"`
                      : null,
                    'Area': roofType.areaSqft ? `${roofType.areaSqft} sq ft` : null,
                  }}
                />
              ))}

              {structural.mountingHardware.map((hardware, index) => (
                <EquipmentCard
                  key={index}
                  title={`${hardware.roofType} - Mounting Hardware`}
                  data={{
                    'Rail Make': hardware.railMake,
                    'Rail Model': hardware.railModel,
                    'Attachment Make': hardware.attachmentMake,
                    'Attachment Model': hardware.attachmentModel,
                  }}
                />
              ))}
            </>
          )}
        </div>

        {/* ==================== PAGE 4: ELECTRICAL DETAILS ==================== */}
        <div
          className={styles.page}
          ref={(el) => (pageRefs.current[3] = el)}
          id="page-4"
        >
          <PageHeader company={company} site={site} pageNumber={4} />

          <SectionTitle icon="⚡" title="Electrical Configuration" />

          <div className={styles.twoColumn}>
            {/* Main Panel */}
            <div>
              <h3 className={styles.reportHeadingLarge}>
                Main Service Panel
              </h3>
              <DataTable
                data={{
                  'Bus Bar Rating': electrical.mainPanel.busBarRating
                    ? `${electrical.mainPanel.busBarRating}A`
                    : null,
                  'Main Breaker': electrical.mainPanel.mainBreakerRating
                    ? `${electrical.mainPanel.mainBreakerRating}A`
                    : null,
                  'Feeder Location': electrical.mainPanel.feederLocation,
                  'Panel Type': electrical.mainPanel.existing ? 'Existing' : 'New',
                  Derated: electrical.mainPanel.derated ? 'Yes' : 'No',
                }}
              />

              {/* Sub Panels */}
              {electrical.subPanels.length > 0 && (
                <>
                  <h3 className={`${styles.reportHeadingLarge} ${styles.reportSection}`}>
                    Sub Panels
                  </h3>
                  {electrical.subPanels.map((subPanel, index) => (
                    <div key={index} className={styles.reportSection}>
                      <h4 className={styles.reportHeadingSmall}>
                        {subPanel.name}
                      </h4>
                      <DataTable
                        data={{
                          'Bus Bar': subPanel.busBarRating ? `${subPanel.busBarRating}A` : null,
                          'Main Breaker': subPanel.mainBreakerRating
                            ? `${subPanel.mainBreakerRating}A`
                            : null,
                          'Upstream Breaker': subPanel.upstreamBreaker
                            ? `${subPanel.upstreamBreaker}A`
                            : null,
                          'Conductor Size': subPanel.conductorSize,
                          'Tie-In Location': subPanel.tieInLocation,
                        }}
                      />
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Point of Interconnection */}
            <div>
              <h3 className={styles.reportHeadingLarge}>
                Point of Interconnection
              </h3>
              <DataTable
                data={{
                  Method: electrical.poi.method,
                  'Breaker Rating': electrical.poi.breakerRating
                    ? `${electrical.poi.breakerRating}A`
                    : null,
                  'Disconnect Rating': electrical.poi.disconnectRating
                    ? `${electrical.poi.disconnectRating}A`
                    : null,
                  'Breaker Location': electrical.poi.breakerLocation,
                }}
              />

              <h3 className={`${styles.reportHeadingLarge} ${styles.reportSection}`}>
                Additional Electrical
              </h3>
              <DataTable
                data={{
                  'SES Type': electrical.sesType,
                  'Main Circuit Breakers': electrical.mainCircuitBreakersQty,
                }}
              />
            </div>
          </div>

          {/* Electrical Photos */}
          {electricalPhotos.length > 0 && (
            <div className={styles.photoSection}>
              <h3 className={styles.reportHeadingMedium}>
                Electrical Photos
              </h3>
              <PhotoGrid photos={electricalPhotos.slice(0, 6)} columns={3} />
            </div>
          )}
        </div>

        {/* ==================== PAGE 5: SURVEY NOTES (CONDITIONAL) ==================== */}
        {notes.length > 0 && (
          <div
            className={styles.page}
            ref={(el) => (pageRefs.current[4] = el)}
            id="page-5"
          >
            <PageHeader company={company} site={site} pageNumber={5} />

            <SectionTitle icon="📝" title="Survey Notes & Observations" />

            {/* Priority Legend */}
            <div className={styles.legendBox}>
              <strong>Priority:</strong>
              <span className={styles.legendHigh}>High - Immediate Attention</span>
              <span className={styles.legendMedium}>Medium - Plan Ahead</span>
              <span className={styles.legendInfo}>Info - For Reference</span>
            </div>

            {/* Notes by Section */}
            <div className={styles.twoColumn}>
              <div>
                {/* Electrical Notes */}
                {data.notesBySection.electrical && data.notesBySection.electrical.length > 0 && (
                  <>
                    <h4 className={styles.noteSectionTitle}>⚡ Electrical</h4>
                    {data.notesBySection.electrical.map((note) => (
                      <NoteItem key={note.id} note={note} />
                    ))}
                  </>
                )}

                {/* Roof Notes */}
                {data.notesBySection.roof && data.notesBySection.roof.length > 0 && (
                  <>
                    <h4 className={styles.noteSectionTitle}>🏠 Roof & Structure</h4>
                    {data.notesBySection.roof.map((note) => (
                      <NoteItem key={note.id} note={note} />
                    ))}
                  </>
                )}
              </div>

              <div>
                {/* Equipment Notes */}
                {data.notesBySection.equipment && data.notesBySection.equipment.length > 0 && (
                  <>
                    <h4 className={styles.noteSectionTitle}>⚙️ Equipment</h4>
                    {data.notesBySection.equipment.map((note) => (
                      <NoteItem key={note.id} note={note} />
                    ))}
                  </>
                )}

                {/* General Notes */}
                {data.notesBySection.general && data.notesBySection.general.length > 0 && (
                  <>
                    <h4 className={styles.noteSectionTitle}>📋 General</h4>
                    {data.notesBySection.general.map((note) => (
                      <NoteItem key={note.id} note={note} />
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* Any remaining uncategorized notes */}
            {notes
              .filter(
                (note) =>
                  !['electrical', 'roof', 'equipment', 'general'].includes(note.section || 'general')
              )
              .map((note) => (
                <NoteItem key={note.id} note={note} />
              ))}
          </div>
        )}

        {/* ==================== PAGE 6: MOUNTING PLANES (CONDITIONAL) ==================== */}
        {structural.mountingPlanes.length > 0 && (
          <div
            className={styles.page}
            ref={(el) => (pageRefs.current[5] = el)}
            id="page-6"
          >
            <PageHeader company={company} site={site} pageNumber={6} />

            <SectionTitle icon="📐" title="Mounting Planes" />

            <table className={styles.fullTable}>
              <thead>
                <tr>
                  <th>Plane</th>
                  <th>Stories</th>
                  <th>Pitch</th>
                  <th>Azimuth</th>
                  <th>Roof Type</th>
                  <th>Mode</th>
                  <th>Panels</th>
                </tr>
              </thead>
              <tbody>
                {structural.mountingPlanes.map((plane) => (
                  <tr key={plane.number}>
                    <td>{plane.number}</td>
                    <td>{plane.stories}</td>
                    <td>{plane.pitch ? `${plane.pitch}°` : '-'}</td>
                    <td>{plane.azimuth ? `${plane.azimuth}°` : '-'}</td>
                    <td>{plane.roofType || '-'}</td>
                    <td>{plane.mode || '-'}</td>
                    <td>{plane.panelQty || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Roof Photos */}
            {roofPhotos.length > 0 && (
              <div className={styles.photoSection}>
                <h3 className={styles.reportHeadingMedium}>
                  Roof & Mounting Photos
                </h3>
                <PhotoGrid photos={roofPhotos.slice(0, 6)} columns={3} />
              </div>
            )}

            {/* Signature Section */}
            <div className={styles.signatureSection}>
              <h4 className={styles.signatureTitle}>Acknowledgment</h4>
              <p className={styles.signatureText}>
                This site survey report accurately represents the conditions observed at the property on
                the survey date. All measurements, observations, and recommendations are subject to
                verification during final engineering and permitting.
              </p>

              <div className={styles.signatureLine}>
                <div className={styles.signatureInfo}>
                  <strong>Surveyor:</strong> {project.surveyedBy}
                </div>
                <div className={styles.signatureInfo}>
                  <strong>Date:</strong> {formatDate(project.surveyDate)}
                </div>
              </div>

              <div className={`${styles.signatureLine} ${styles.signatureLineTop}`}>
                <div className={styles.signatureInfo}>
                  <strong>Homeowner Signature:</strong> _________________________________
                </div>
                <div className={styles.signatureInfo}>
                  <strong>Date:</strong> _____________
                </div>
              </div>
            </div>

            {/* Page Footer */}
            <div className={styles.pageFooter}>
              Generated by {company.name} • {formatDate(new Date().toISOString())}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>

    {/* Fullscreen Modal */}
    {isFullscreen && (
      <div className={styles.fullscreenOverlay} onClick={handleCloseFullscreen}>
        {/* Floating Toolbar */}
        <div className={styles.fullscreenToolbar} onClick={(e) => e.stopPropagation()}>
          <div className={styles.fullscreenToolbarLeft}>
            <Button
              onClick={handleCloseFullscreen}
              variant="secondary"
              size="small"
              title="Close fullscreen (ESC)"
            >
              ✕ Close
            </Button>
            {/* Page Navigation */}
            <div className={styles.pageNavigation}>
              <Button
                onClick={handlePreviousPage}
                variant="secondary"
                size="small"
                disabled={currentPage <= 1}
                title="Previous page (← Arrow)"
              >
                ◀
              </Button>
              <div className={styles.pageInput}>
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => setCurrentPage(parseInt(e.target.value, 10) || 1)}
                  onBlur={handlePageInput}
                  onKeyDown={(e) => e.key === 'Enter' && handlePageInput(e)}
                  className={styles.pageNumberInput}
                />
                <span>/ {totalPages}</span>
              </div>
              <Button
                onClick={handleNextPage}
                variant="secondary"
                size="small"
                disabled={currentPage >= totalPages}
                title="Next page (→ Arrow)"
              >
                ▶
              </Button>
            </div>
          </div>
          <div className={styles.fullscreenToolbarRight}>
            <Button onClick={handlePrint} variant="primary">
              🖨️ Print
            </Button>
          </div>
        </div>

        {/* Single Page View with Scaling */}
        <div className={styles.fullscreenContent} onClick={(e) => e.stopPropagation()}>
          <div
            className={styles.fullscreenPageWrapper}
            style={{
              transform: `scale(${fullscreenScale})`,
              transformOrigin: 'top center'
            }}
          >
            {renderPage(currentPage)}
          </div>
        </div>

        {/* Large clickable prev/next areas */}
        <div
          className={`${styles.fullscreenNavLeft} ${currentPage <= 1 ? styles.paginationHidden : styles.paginationVisible}`}
          onClick={(e) => {
            e.stopPropagation();
            handlePreviousPage();
          }}
        />
        <div
          className={`${styles.fullscreenNavRight} ${currentPage >= totalPages ? styles.paginationHidden : styles.paginationVisible}`}
          onClick={(e) => {
            e.stopPropagation();
            handleNextPage();
          }}
        />
      </div>
    )}
  </>
  );
};

/* ========================================
   SUB-COMPONENTS
   ======================================== */

/**
 * Page Header - Company name, site address, page number
 */
const PageHeader = ({ company, site, pageNumber }) => (
  <div className={styles.pageHeader}>
    <span>{company.name}</span>
    <span>{formatAddress(site)}</span>
    <span>Page {pageNumber}</span>
  </div>
);

/**
 * Section Title - Icon + Title with bottom border
 */
const SectionTitle = ({ icon, title }) => (
  <div className={styles.sectionTitle}>
    <span className={styles.sectionIcon}>{icon}</span>
    <span>{title}</span>
  </div>
);

/**
 * Data Table - Label/value rows, filters out null values
 */
const DataTable = ({ data }) => {
  const entries = Object.entries(data).filter(([_, value]) => value !== null && value !== undefined);

  if (entries.length === 0) {
    return <p className={styles.noDataText}>No data available</p>;
  }

  return (
    <table className={styles.dataTable}>
      <tbody>
        {entries.map(([label, value]) => (
          <tr key={label}>
            <td className={styles.dataLabel}>{label}</td>
            <td className={styles.dataValue}>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

/**
 * Equipment Card - Title, optional badge, and data table
 */
const EquipmentCard = ({ title, badge, data }) => (
  <div className={styles.equipmentCard}>
    <div className={styles.equipmentHeader}>
      <h4 className={styles.equipmentTitle}>{title}</h4>
      {badge && <span className={styles.equipmentBadge}>{badge}</span>}
    </div>
    <DataTable data={data} />
  </div>
);

/**
 * Photo Grid - Grid of photo cards with labels
 */
const PhotoGrid = ({ photos, columns = 3 }) => {
  if (!photos || photos.length === 0) {
    return null;
  }

  const gridClass = `${styles.photoGrid} ${styles[`cols${columns}`]}`;

  return (
    <div className={gridClass}>
      {photos.map((photo, index) => (
        <div key={photo.id || index} className={styles.photoCard}>
          <img src={photo.url} alt={photo.label || photo.fileName || 'Photo'} className={styles.photoImage} />
          <div className={styles.photoLabel}>{photo.label || photo.fileName || `Photo ${index + 1}`}</div>
        </div>
      ))}
    </div>
  );
};

/**
 * Note Item - Styled by priority (high/medium/info)
 */
const NoteItem = ({ note }) => {
  const priorityClass =
    note.priority === 'high'
      ? styles.noteHigh
      : note.priority === 'medium'
      ? styles.noteMedium
      : styles.noteInfo;

  return (
    <div className={`${styles.noteItem} ${priorityClass}`}>
      {note.content || note.note || note.text}
    </div>
  );
};

/* ========================================
   HELPER FUNCTIONS
   ======================================== */

/**
 * Format date string to "Month Day, Year"
 */
const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
};

/**
 * Format address from site object
 */
const formatAddress = (site) => {
  if (!site) return '';
  return site.address || '';
};

export default SiteSurveyReportPanel;
