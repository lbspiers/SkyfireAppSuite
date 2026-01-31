import React, { useRef, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';
import html2canvas from 'html2canvas';
import azimuthService from '../../services/azimuthService';
import LoadingSpinner from '../ui/LoadingSpinner';
import styles from './AzimuthFinder.module.css';

/**
 * AzimuthFinder - Interactive tool for measuring roof plane orientations
 * Features compass overlay, multi-plane support, and project file integration
 */
const AzimuthFinder = ({
  lat,
  lng,
  address,
  projectUuid,
  initialMeasurements = [],
  onMeasurementsChange,
}) => {
  const mapContainerRef = useRef(null); // Container for map + canvas (for screenshot)
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const canvasRef = useRef(null);
  const compassRef = useRef(null);

  // State
  const [measurements, setMeasurements] = useState(initialMeasurements);
  const [isLocked, setIsLocked] = useState(false);
  const [selectedPlane, setSelectedPlane] = useState(1);
  const [showExtraPlanes, setShowExtraPlanes] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [snapToAngles, setSnapToAngles] = useState(false);
  const [showCompass, setShowCompass] = useState(false); // Compass OFF by default
  const [compassColor, setCompassColor] = useState('white');
  const [compassSize, setCompassSize] = useState(300);
  const [compassOpacity, setCompassOpacity] = useState(0.7);
  const [compassPosition, setCompassPosition] = useState({ x: 0, y: 0 }); // Offset from center, (0,0) = centered
  const [drawing, setDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [currentPoint, setCurrentPoint] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [selectedMeasurement, setSelectedMeasurement] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isDraggingCompass, setIsDraggingCompass] = useState(false);

  // Plane colors for canvas drawing - matches design tokens
  // Canvas API requires actual hex values, not CSS variables
  const planeColors = [
    'var(--color-info)', // --color-accent-blue
    'var(--color-success)', // --color-success
    'var(--color-warning)', // --color-warning
    '#8B5CF6', // --color-accent-purple
    '#EC4899', // --color-accent-pink
    '#06B6D4', // --color-accent-cyan
    '#EAB308', // Yellow (custom)
    'var(--color-error)', // --color-error
  ];

  // Cardinal directions
  const getCardinalDirection = (azimuth) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(azimuth / 45) % 8;
    return directions[index];
  };

  // Calculate azimuth from two points
  const calculateAzimuth = (start, end) => {
    const dx = end.x - start.x;
    const dy = start.y - end.y; // Inverted because canvas y increases downward
    let angle = Math.atan2(dx, dy) * (180 / Math.PI);
    if (angle < 0) angle += 360;

    // Snap to 45° if enabled
    if (snapToAngles) {
      angle = Math.round(angle / 45) * 45;
    }

    return Math.round(angle);
  };

  // Initialize Google Map
  useEffect(() => {
    if (!lat || !lng || !window.google || !mapRef.current) return;

    const position = { lat, lng };

    const map = new window.google.maps.Map(mapRef.current, {
      center: position,
      zoom: 21, // Maximum zoom for highest detail
      mapTypeId: 'satellite',
      tilt: 0, // Force overhead view for accurate measurements
      heading: 0,

      // Enable Google's native compass (shows N/E/S/W)
      rotateControl: true,
      rotateControlOptions: {
        position: window.google.maps.ControlPosition.RIGHT_TOP
      },

      // Other controls
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      zoomControlOptions: {
        position: window.google.maps.ControlPosition.RIGHT_BOTTOM
      },
      scaleControl: true,
      mapTypeControl: true,
      mapTypeControlOptions: {
        position: window.google.maps.ControlPosition.TOP_RIGHT,
        mapTypeIds: ['satellite', 'hybrid']
      },

      draggable: !isLocked,
      scrollwheel: !isLocked,
      disableDoubleClickZoom: isLocked,
    });

    googleMapRef.current = map;

    // Update map draggable state when lock changes
    return () => {
      googleMapRef.current = null;
    };
  }, [lat, lng]);

  // Update map controls when lock state changes
  useEffect(() => {
    if (googleMapRef.current) {
      googleMapRef.current.setOptions({
        draggable: !isLocked,
        scrollwheel: !isLocked,
        disableDoubleClickZoom: isLocked,
      });
    }
  }, [isLocked]);

  // Initialize canvas and handle resizing with device pixel ratio support
  useEffect(() => {
    if (!canvasRef.current || !mapRef.current) return;

    const canvas = canvasRef.current;
    const mapContainer = mapRef.current;

    const resizeCanvas = () => {
      const rect = mapContainer.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      // Set actual size in memory (scaled for high-DPI displays)
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      // Set display size (CSS pixels)
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';

      // Scale context to match device pixel ratio
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);

      redrawCanvas();
    };

    // Initial size
    resizeCanvas();

    // Resize on window resize
    window.addEventListener('resize', resizeCanvas);

    // Also resize when map is fully loaded
    if (googleMapRef.current && window.google) {
      const listener = window.google.maps.event.addListenerOnce(
        googleMapRef.current,
        'idle',
        resizeCanvas
      );

      return () => {
        window.removeEventListener('resize', resizeCanvas);
        if (listener) window.google.maps.event.removeListener(listener);
      };
    }

    return () => window.removeEventListener('resize', resizeCanvas);
  }, [googleMapRef.current]);

  // Redraw canvas
  const redrawCanvas = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    // Get display dimensions (CSS pixels)
    const displayWidth = canvas.width / dpr;
    const displayHeight = canvas.height / dpr;

    // Clear canvas (use display dimensions since ctx is already scaled)
    ctx.clearRect(0, 0, displayWidth, displayHeight);

    // Draw compass only if enabled
    if (showCompass) {
      drawCompass(ctx, displayWidth, displayHeight);
    }

    // Draw all measurements
    measurements.forEach((measurement, index) => {
      const isSelected = selectedMeasurement === index;
      drawMeasurement(ctx, measurement, isSelected);
    });

    // Draw current drawing line
    if (drawing && startPoint && currentPoint) {
      const azimuth = calculateAzimuth(startPoint, currentPoint);
      const tempMeasurement = {
        start: startPoint,
        end: currentPoint,
        azimuth,
        plane: selectedPlane,
      };
      drawMeasurement(ctx, tempMeasurement, false, true);
    }
  }, [measurements, selectedMeasurement, drawing, startPoint, currentPoint, selectedPlane, compassPosition, compassSize, compassOpacity, compassColor, showLabels, showCompass]);

  // Draw compass overlay
  const drawCompass = (ctx, displayWidth, displayHeight) => {
    // Calculate center position (display center + offset)
    const centerX = (displayWidth / 2) + compassPosition.x;
    const centerY = (displayHeight / 2) + compassPosition.y;
    const radius = compassSize / 2;

    ctx.save();
    ctx.globalAlpha = compassOpacity;

    // Determine stroke and text colors based on compass color
    // Using hardcoded colors for canvas drawing - Canvas API doesn't support CSS variables
    const strokeColor = compassColor === 'orange' ? 'var(--color-primary)' : compassColor; // --color-primary when orange
    const textColor = strokeColor;

    // Outer circle
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();

    // Inner circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 10, 0, 2 * Math.PI);
    ctx.stroke();

    // Cardinal directions
    const cardinals = ['N', 'E', 'S', 'W'];
    const angles = [0, 90, 180, 270];

    ctx.font = `bold ${Math.round(compassSize / 15)}px Arial`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    angles.forEach((angle, i) => {
      const rad = (angle - 90) * Math.PI / 180;
      const x = centerX + Math.cos(rad) * (radius - 30);
      const y = centerY + Math.sin(rad) * (radius - 30);
      ctx.fillText(cardinals[i], x, y);
    });

    // Draw degree marks - 4 levels of granularity for precision
    ctx.strokeStyle = strokeColor;

    for (let i = 0; i < 360; i += 1) {
      const angle = (i - 90) * Math.PI / 180;
      let innerRadius;
      let tickWidth;

      if (i % 30 === 0) {
        // Major ticks every 30° - longest, thickest
        innerRadius = radius - 25;
        tickWidth = 2.5;
      } else if (i % 10 === 0) {
        // Medium ticks every 10°
        innerRadius = radius - 18;
        tickWidth = 1.5;
      } else if (i % 5 === 0) {
        // Minor ticks every 5°
        innerRadius = radius - 12;
        tickWidth = 1;
      } else {
        // Micro ticks every 1° - shortest, thinnest
        innerRadius = radius - 7;
        tickWidth = 0.5;
      }

      ctx.lineWidth = tickWidth;
      ctx.beginPath();
      ctx.moveTo(
        centerX + Math.cos(angle) * innerRadius,
        centerY + Math.sin(angle) * innerRadius
      );
      ctx.lineTo(
        centerX + Math.cos(angle) * radius,
        centerY + Math.sin(angle) * radius
      );
      ctx.stroke();
    }

    // Draw degree labels every 10°
    ctx.fillStyle = textColor;
    for (let i = 0; i < 360; i += 10) {
      const angle = (i - 90) * Math.PI / 180;
      ctx.font = i % 30 === 0
        ? `bold ${Math.round(compassSize / 28)}px Arial`  // Larger for 30° marks
        : `${Math.round(compassSize / 35)}px Arial`;       // Smaller for 10° marks
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const labelRadius = radius - (i % 30 === 0 ? 40 : 32);
      ctx.fillText(
        i.toString(),
        centerX + Math.cos(angle) * labelRadius,
        centerY + Math.sin(angle) * labelRadius
      );
    }

    // North arrow (red)
    ctx.fillStyle = 'var(--color-error)'; // --color-error
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - radius + 30);
    ctx.lineTo(centerX - 8, centerY - radius + 50);
    ctx.lineTo(centerX + 8, centerY - radius + 50);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  };

  // Draw measurement line
  const drawMeasurement = (ctx, measurement, isSelected, isDrawing = false) => {
    const color = planeColors[measurement.plane - 1];
    const { start, end, azimuth } = measurement;

    ctx.save();

    // Line
    ctx.strokeStyle = color;
    ctx.lineWidth = isSelected ? 4 : isDrawing ? 3 : 2;
    ctx.setLineDash(isDrawing ? [5, 5] : []);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    // Arrowhead
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const arrowLength = 15;
    const arrowAngle = Math.PI / 6;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(
      end.x - arrowLength * Math.cos(angle - arrowAngle),
      end.y - arrowLength * Math.sin(angle - arrowAngle)
    );
    ctx.lineTo(
      end.x - arrowLength * Math.cos(angle + arrowAngle),
      end.y - arrowLength * Math.sin(angle + arrowAngle)
    );
    ctx.closePath();
    ctx.fill();

    // Start point circle
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(start.x, start.y, 6, 0, 2 * Math.PI);
    ctx.fill();

    // Label
    if (showLabels && !isDrawing) {
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      const cardinal = getCardinalDirection(azimuth);
      const text = `${azimuth}° ${cardinal}`;

      ctx.font = 'bold 14px Arial';
      ctx.fillStyle = 'var(--gray-800)'; // --gray-800
      ctx.strokeStyle = 'var(--text-primary)'; // white for outline
      ctx.lineWidth = 4;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.strokeText(text, midX, midY - 15);
      ctx.fillText(text, midX, midY - 15);
    }

    ctx.restore();
  };

  // Redraw on state changes
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Mouse event handlers
  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e) => {
    if (!isLocked) return;

    const point = getCanvasCoordinates(e);
    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = canvas.width / dpr;
    const displayHeight = canvas.height / dpr;

    // Check if clicking on compass (for dragging with Shift key)
    if (e.shiftKey && showCompass) {
      // Calculate actual compass center (using display dimensions)
      const compassCenterX = (displayWidth / 2) + compassPosition.x;
      const compassCenterY = (displayHeight / 2) + compassPosition.y;
      const dx = point.x - compassCenterX;
      const dy = point.y - compassCenterY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < compassSize / 2) {
        setIsDraggingCompass(true);
        return;
      }
    }

    // Start drawing measurement
    setDrawing(true);
    setStartPoint(point);
    setCurrentPoint(point);
  };

  const handleMouseMove = (e) => {
    if (isDraggingCompass) {
      const point = getCanvasCoordinates(e);
      const canvas = canvasRef.current;
      const dpr = window.devicePixelRatio || 1;
      const displayWidth = canvas.width / dpr;
      const displayHeight = canvas.height / dpr;

      // Calculate offset from canvas center (using display dimensions)
      const offsetX = point.x - (displayWidth / 2);
      const offsetY = point.y - (displayHeight / 2);

      setCompassPosition({ x: offsetX, y: offsetY });
      return;
    }

    if (drawing && startPoint) {
      const point = getCanvasCoordinates(e);
      setCurrentPoint(point);
    }
  };

  const handleMouseUp = (e) => {
    if (isDraggingCompass) {
      setIsDraggingCompass(false);
      return;
    }

    if (drawing && startPoint && currentPoint) {
      const endPoint = getCanvasCoordinates(e);

      // Ensure minimum line length
      const dx = endPoint.x - startPoint.x;
      const dy = endPoint.y - startPoint.y;
      const length = Math.sqrt(dx * dx + dy * dy);

      if (length > 20) {
        const azimuth = calculateAzimuth(startPoint, endPoint);
        const newMeasurement = {
          start: startPoint,
          end: endPoint,
          azimuth,
          plane: selectedPlane,
          id: Date.now(),
        };

        const newMeasurements = [...measurements, newMeasurement];
        setMeasurements(newMeasurements);
        addToHistory(newMeasurements);

        if (onMeasurementsChange) {
          onMeasurementsChange(newMeasurements);
        }
      }
    }

    setDrawing(false);
    setStartPoint(null);
    setCurrentPoint(null);
  };

  // History management
  const addToHistory = (newMeasurements) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newMeasurements);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setMeasurements(history[prevIndex]);
      if (onMeasurementsChange) {
        onMeasurementsChange(history[prevIndex]);
      }
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setMeasurements(history[nextIndex]);
      if (onMeasurementsChange) {
        onMeasurementsChange(history[nextIndex]);
      }
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // L - Toggle lock
      if (e.key === 'l' || e.key === 'L') {
        setIsLocked(prev => !prev);
      }
      // S - Toggle snap
      if (e.key === 's' || e.key === 'S') {
        setSnapToAngles(prev => !prev);
      }
      // Delete/Backspace - Delete selected
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedMeasurement !== null) {
        handleDeleteSelected();
      }
      // Escape - Deselect
      if (e.key === 'Escape') {
        setSelectedMeasurement(null);
        setDrawing(false);
        setStartPoint(null);
        setCurrentPoint(null);
      }
      // Ctrl+Z - Undo
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undo();
      }
      // Ctrl+Y - Redo
      if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        redo();
      }
      // Ctrl+C - Copy to clipboard
      if (e.ctrlKey && e.key === 'c' && measurements.length > 0) {
        e.preventDefault();
        handleCopyToClipboard();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMeasurement, measurements, historyIndex]);

  // Tool handlers
  const handleDeleteSelected = () => {
    if (selectedMeasurement !== null) {
      const newMeasurements = measurements.filter((_, i) => i !== selectedMeasurement);
      setMeasurements(newMeasurements);
      addToHistory(newMeasurements);
      setSelectedMeasurement(null);
      if (onMeasurementsChange) {
        onMeasurementsChange(newMeasurements);
      }
    }
  };

  const handleClearAll = () => {
    setMeasurements([]);
    addToHistory([]);
    setSelectedMeasurement(null);
    if (onMeasurementsChange) {
      onMeasurementsChange([]);
    }
  };

  const handleResetCompass = () => {
    setCompassPosition({ x: 0, y: 0 }); // Reset to center (no offset)
    setCompassSize(300);
    setCompassOpacity(0.7);
  };

  const handleCopyToClipboard = () => {
    const text = measurements.map(m =>
      `Plane ${m.plane}: ${m.azimuth}° ${getCardinalDirection(m.azimuth)}`
    ).join('\n');

    navigator.clipboard.writeText(text).then(() => {
      toast.success('Measurements copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy to clipboard');
    });
  };

  // Save to project
  const handleSaveToProject = async () => {
    if (!projectUuid) {
      toast.error('Project context required to save');
      return;
    }

    if (measurements.length === 0) {
      toast.error('No measurements to save');
      return;
    }

    setSaving(true);
    try {
      // 1. Capture the entire map container (satellite imagery + canvas overlay)
      const mapContainer = mapContainerRef.current;

      if (!mapContainer) {
        throw new Error('Map container not found');
      }

      // Use html2canvas to capture the map + overlay together
      const capturedCanvas = await html2canvas(mapContainer, {
        useCORS: true,           // Allow cross-origin images (Google Maps tiles)
        allowTaint: true,        // Allow tainted canvas
        backgroundColor: null,   // Transparent background
        scale: 2,                // Higher resolution (2x for retina displays)
        logging: false,          // Disable console logging
        imageTimeout: 15000,     // Longer timeout for map tiles to load
      });

      // 2. Convert to blob
      const blob = await new Promise((resolve) =>
        capturedCanvas.toBlob(resolve, 'image/png')
      );

      // 3. Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const fileName = `azimuth-map-${timestamp}.png`;

      // 4. Get presigned upload URL
      const { uploadUrl, fileKey } = await azimuthService.getUploadUrl(projectUuid, fileName);

      // 5. Upload to S3 using presigned URL
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: blob,
        headers: {
          'Content-Type': 'image/png',
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload to S3');
      }

      // 6. Register file with project
      await azimuthService.registerFile(projectUuid, {
        fileName,
        fileType: 'azimuth_map',
        fileUrl: fileKey,
        fileSizeBytes: blob.size,
        mimeType: 'image/png',
        label: 'Azimuth Measurement Map',
        metadata: {
          measurements: measurements.map(m => ({
            plane: m.plane,
            azimuth: m.azimuth,
            start: m.start,
            end: m.end,
          })),
          address: address || 'Unknown location',
          capturedAt: new Date().toISOString(),
        },
      });

      // 7. Save measurements data (optional - endpoint may not exist yet)
      await azimuthService.saveMeasurements(projectUuid, measurements);

      toast.success('Azimuth map saved to project files!');
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('Failed to save azimuth map');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        {/* Lock/Unlock */}
        <button
          type="button"
          onClick={() => setIsLocked(prev => !prev)}
          className={`${styles.toolButton} ${isLocked ? styles.toolButtonActive : ''}`}
          title={`${isLocked ? 'Unlock' : 'Lock'} map (L)`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {isLocked ? (
              <>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </>
            ) : (
              <>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 9.9-1" />
              </>
            )}
          </svg>
          <span>{isLocked ? 'Locked' : 'Unlocked'}</span>
        </button>

        {/* Snap to Angles */}
        <button
          type="button"
          onClick={() => setSnapToAngles(prev => !prev)}
          className={`${styles.toolButton} ${snapToAngles ? styles.toolButtonActive : ''}`}
          title="Snap to 45° angles (S)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          </svg>
          <span>Snap</span>
        </button>

        {/* Show/Hide Labels */}
        <button
          type="button"
          onClick={() => setShowLabels(prev => !prev)}
          className={`${styles.toolButton} ${showLabels ? styles.toolButtonActive : ''}`}
          title="Toggle labels"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
          <span>Labels</span>
        </button>

        {/* Toggle Compass Overlay */}
        <button
          type="button"
          onClick={() => setShowCompass(prev => !prev)}
          className={`${styles.toolButton} ${showCompass ? styles.toolButtonActive : ''}`}
          title="Toggle compass overlay"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88" fill="currentColor" />
          </svg>
          <span>Compass</span>
        </button>

        <div className={styles.toolDivider} />

        {/* Undo */}
        <button
          type="button"
          onClick={undo}
          disabled={historyIndex <= 0}
          className={styles.toolButton}
          title="Undo (Ctrl+Z)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 7v6h6" />
            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
          </svg>
        </button>

        {/* Redo */}
        <button
          type="button"
          onClick={redo}
          disabled={historyIndex >= history.length - 1}
          className={styles.toolButton}
          title="Redo (Ctrl+Y)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 7v6h-6" />
            <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
          </svg>
        </button>

        {/* Delete Selected */}
        <button
          type="button"
          onClick={handleDeleteSelected}
          disabled={selectedMeasurement === null}
          className={styles.toolButton}
          title="Delete selected (Del)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>

        {/* Clear All */}
        <button
          type="button"
          onClick={handleClearAll}
          disabled={measurements.length === 0}
          className={styles.toolButton}
          title="Clear all measurements"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        </button>

        <div className={styles.toolDivider} />

        {/* Save to Project */}
        <button
          type="button"
          onClick={handleSaveToProject}
          disabled={saving || measurements.length === 0}
          className={`${styles.toolButton} ${styles.saveButton}`}
          title="Save to project files"
        >
          {saving ? (
            <LoadingSpinner size="sm" />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
          )}
          <span>Save to Project</span>
        </button>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Sidebar */}
        <div className={styles.sidebar}>
          {/* Plane Selector */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Measurement Plane</h3>
            <div className={styles.planeGrid}>
              {[1, 2, 3, 4].map(plane => (
                <button
                  key={plane}
                  type="button"
                  onClick={() => setSelectedPlane(plane)}
                  className={`${styles.planeButton} ${selectedPlane === plane ? styles.planeButtonActive : ''}`}
                  style={{
                    borderColor: planeColors[plane - 1],
                    backgroundColor: selectedPlane === plane ? planeColors[plane - 1] : 'transparent',
                  }}
                >
                  {plane}
                </button>
              ))}
            </div>

            {!showExtraPlanes && (
              <button
                type="button"
                onClick={() => setShowExtraPlanes(true)}
                className={styles.expandButton}
              >
                + Show Planes 5-8
              </button>
            )}

            {showExtraPlanes && (
              <>
                <div className={styles.planeGrid} style={{ marginTop: '0.5rem' }}>
                  {[5, 6, 7, 8].map(plane => (
                    <button
                      key={plane}
                      type="button"
                      onClick={() => setSelectedPlane(plane)}
                      className={`${styles.planeButton} ${selectedPlane === plane ? styles.planeButtonActive : ''}`}
                      style={{
                        borderColor: planeColors[plane - 1],
                        backgroundColor: selectedPlane === plane ? planeColors[plane - 1] : 'transparent',
                      }}
                    >
                      {plane}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setShowExtraPlanes(false)}
                  className={styles.expandButton}
                >
                  - Hide Planes 5-8
                </button>
              </>
            )}
          </div>

          {/* Compass Settings - Only show when compass is enabled */}
          {showCompass && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Compass Settings</h3>

              {/* Color */}
              <label className={styles.settingLabel}>
                Color
                <div className={styles.colorButtons}>
                  {['white', 'black', 'orange', 'blue'].map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setCompassColor(color)}
                      className={`${styles.colorButton} ${compassColor === color ? styles.colorButtonActive : ''}`}
                      style={{
                        backgroundColor: color === 'orange' ? 'var(--color-primary)' : color,
                        border: color === 'white' ? '1px solid var(--text-disabled)' : 'none',
                      }}
                    />
                  ))}
                </div>
              </label>

              {/* Size */}
              <label className={styles.settingLabel}>
                Size: {compassSize}px
                <input
                  type="range"
                  min="150"
                  max="600"
                  value={compassSize}
                  onChange={(e) => setCompassSize(Number(e.target.value))}
                  className={styles.slider}
                />
              </label>

              {/* Opacity */}
              <label className={styles.settingLabel}>
                Opacity: {Math.round(compassOpacity * 100)}%
                <input
                  type="range"
                  min="0.2"
                  max="1"
                  step="0.1"
                  value={compassOpacity}
                  onChange={(e) => setCompassOpacity(Number(e.target.value))}
                  className={styles.slider}
                />
              </label>

              <button
                type="button"
                onClick={handleResetCompass}
                className={styles.resetButton}
              >
                Reset Compass Position
              </button>
            </div>
          )}

          {/* Measurements List */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Measurements ({measurements.length})</h3>
            {measurements.length === 0 ? (
              <p className={styles.emptyText}>No measurements yet. Lock the map and click to draw.</p>
            ) : (
              <div className={styles.measurementsList}>
                {measurements.map((m, i) => (
                  <div
                    key={m.id || i}
                    onClick={() => setSelectedMeasurement(i)}
                    className={`${styles.measurementItem} ${selectedMeasurement === i ? styles.measurementItemActive : ''}`}
                  >
                    <div
                      className={styles.measurementColor}
                      style={{ backgroundColor: planeColors[m.plane - 1] }}
                    />
                    <div className={styles.measurementInfo}>
                      <div className={styles.measurementPlane}>Plane {m.plane}</div>
                      <div className={styles.measurementValue}>{m.azimuth}° {getCardinalDirection(m.azimuth)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Instructions</h3>
            <ul className={styles.instructionsList}>
              <li>Lock the map to enable drawing</li>
              <li>Click and drag to measure azimuth</li>
              <li>Use Google's compass (top-right) for N/E/S/W reference</li>
              <li>Enable custom compass overlay for precision tick marks</li>
              <li>Shift+drag to move custom compass over roof areas</li>
              <li>Press L to toggle lock</li>
              <li>Press S to snap to 45°</li>
            </ul>
          </div>
        </div>

        {/* Map View */}
        <div className={styles.mapView}>
          {/* Wrapper for screenshot capture (map + canvas together) */}
          <div ref={mapContainerRef} className={styles.mapWrapper}>
            <div ref={mapRef} className={styles.map} />
            <canvas
              ref={canvasRef}
              className={styles.canvas}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              style={{ cursor: isLocked ? 'crosshair' : 'grab' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

AzimuthFinder.propTypes = {
  lat: PropTypes.number.isRequired,
  lng: PropTypes.number.isRequired,
  address: PropTypes.string,
  projectUuid: PropTypes.string, // Optional - Save to Project is optional feature
  initialMeasurements: PropTypes.array,
  onMeasurementsChange: PropTypes.func,
};

export default AzimuthFinder;
