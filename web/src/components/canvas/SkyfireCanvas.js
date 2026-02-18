import React, { useState, useEffect, useRef, useCallback } from 'react';
import useGoogleMaps from '../../hooks/useGoogleMaps';
import { exportToDXF, downloadDXF } from '../../utils/dxfExporter';
import { fetchCanvasState, saveCanvasState } from '../../services/canvasAPI';
import styles from './SkyfireCanvas.module.css';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const LAYERS = [
  { id: 'roof',       name: 'Roof Outline',   color: '#F59E0B', locked: false },
  { id: 'panels',     name: 'Solar Panels',   color: '#3B82F6', locked: false },
  { id: 'conduit',    name: 'Conduit Runs',   color: '#10B981', locked: false },
  { id: 'equipment',  name: 'Equipment',      color: '#8B5CF6', locked: false },
  { id: 'dimensions', name: 'Dimensions',     color: '#EC4899', locked: false },
  { id: 'labels',     name: 'Labels & Notes', color: '#06B6D4', locked: false },
  { id: 'property',   name: 'Property Line',  color: '#6B7280', locked: false },
  { id: 'aerial',     name: 'Aerial Image',   color: '#374151', locked: true  },
];

const LAYER_COLORS = LAYERS.reduce((acc, l) => { acc[l.id] = l.color; return acc; }, {});

const TOOL_HINTS = {
  select:    'Click to select objects. <kbd>Delete</kbd> to remove. Hover for info.',
  line:      '<strong>Line</strong> — Click start, click end. <kbd>Esc</kbd> cancel.',
  polyline:  '<strong>Polyline</strong> — Click points. Snap to first point to close. <kbd>Double-click</kbd> or <kbd>Right-click</kbd> to finish.',
  rect:      '<strong>Rectangle</strong> — Click corner, click opposite corner.',
  circle:    '<strong>Circle</strong> — Click center, click radius point.',
  dimension: '<strong>Dimension</strong> — Click start, click end to measure.',
  pan:       '<strong>Pan</strong> — Drag to pan. Also <kbd>Space</kbd>+drag.',
  text:      '<strong>Text</strong> — Click to place text (coming soon).',
  measure:   '<strong>Measure</strong> — Click two points to measure distance.',
};

const OBJECT_ICONS = { line:'╱', rect:'▭', circle:'○', polyline:'⟋', dimension:'↔', equipment:'▣' };
const OBJECT_NAMES = { line:'Line', rect:'Rectangle', circle:'Circle', polyline:'Polyline', dimension:'Dimension', equipment:'Equipment' };

// Default map zoom when coords available
const DEFAULT_MAP_ZOOM = 20;
// Grid spacing in meters
const GRID_METERS = 1.0;
// Feet per meter
const FT_PER_M = 3.28084;
// Endpoint snap radius in screen pixels
const ENDPOINT_SNAP_PX = 15;
// Close-polygon snap radius in screen pixels
const CLOSE_SNAP_PX = 18;
// localStorage key prefix for auto-save
const LS_KEY_PREFIX = 'skyfire_canvas_';

// ─────────────────────────────────────────────────────────────────────────────
// GEO HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Offset a lat/lng by (dx meters East, dy meters North) */
function offsetLatLng(lat, lng, dx, dy) {
  const dLat = dy / 111320;
  const dLng = dx / (111320 * Math.cos(lat * Math.PI / 180));
  return { lat: lat + dLat, lng: lng + dLng };
}

/** Haversine distance in meters between two {lat,lng} points */
function haversineMeters(a, b) {
  const R = 6371000;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const c = sinLat * sinLat +
    Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * sinLng * sinLng;
  return R * 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c));
}

/** Snap a {lat,lng} to the nearest GRID_METERS grid anchored at origin */
function snapLatLng(pt, originLat, originLng, snapEnabled) {
  if (!snapEnabled) return pt;
  const dxM = (pt.lng - originLng) * 111320 * Math.cos(originLat * Math.PI / 180);
  const dyM = (pt.lat - originLat) * 111320;
  const snappedDx = Math.round(dxM / GRID_METERS) * GRID_METERS;
  const snappedDy = Math.round(dyM / GRID_METERS) * GRID_METERS;
  return offsetLatLng(originLat, originLng, snappedDx, snappedDy);
}

/** Apply ortho constraint: force line to nearest 45° bearing */
function applyOrthoLatLng(start, end, orthoEnabled) {
  if (!orthoEnabled) return end;
  const dLat = end.lat - start.lat;
  const dLng = (end.lng - start.lng) * Math.cos(start.lat * Math.PI / 180);
  if (Math.abs(dLng) > Math.abs(dLat)) {
    return { lat: start.lat, lng: end.lng };
  } else {
    return { lat: end.lat, lng: start.lng };
  }
}

/** Convert hex color to rgba string with given opacity */
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Shoelace area for a polygon defined by lat/lng points.
 * Returns area in square feet.
 */
function polygonAreaSqFt(points) {
  if (!points || points.length < 3) return 0;
  // Convert to local meters (flat-Earth)
  const origin = points[0];
  const cosLat = Math.cos(origin.lat * Math.PI / 180);
  const xy = points.map(p => ({
    x: (p.lng - origin.lng) * 111320 * cosLat,
    y: (p.lat - origin.lat) * 111320,
  }));
  // Shoelace
  let area = 0;
  const n = xy.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += xy[i].x * xy[j].y;
    area -= xy[j].x * xy[i].y;
  }
  const sqMeters = Math.abs(area) / 2;
  return sqMeters * FT_PER_M * FT_PER_M;
}

/**
 * Compute centroid of polygon in lat/lng space.
 */
function polygonCentroid(points) {
  if (!points || points.length === 0) return null;
  const lat = points.reduce((s, p) => s + p.lat, 0) / points.length;
  const lng = points.reduce((s, p) => s + p.lng, 0) / points.length;
  return { lat, lng };
}

/**
 * Collect all unique endpoint lat/lngs from all objects.
 * Returns array of { lat, lng, objIdx, ptKey } for hit-testing.
 */
function getAllEndpoints(objects) {
  const pts = [];
  objects.forEach((obj, idx) => {
    switch (obj.type) {
      case 'line': case 'dimension':
        pts.push({ ...obj.p1, objIdx: idx, ptKey: 'p1' });
        pts.push({ ...obj.p2, objIdx: idx, ptKey: 'p2' });
        break;
      case 'rect':
        ['nw','ne','se','sw'].forEach(k => pts.push({ ...obj[k], objIdx: idx, ptKey: k }));
        break;
      case 'circle':
        pts.push({ ...obj.center, objIdx: idx, ptKey: 'center' });
        pts.push({ ...obj.edge,   objIdx: idx, ptKey: 'edge' });
        break;
      case 'polyline':
        (obj.points || []).forEach((p, i) => pts.push({ ...p, objIdx: idx, ptKey: i }));
        break;
      case 'equipment':
        pts.push({ ...obj.pos, objIdx: idx, ptKey: 'pos' });
        break;
      default: break;
    }
  });
  return pts;
}

/**
 * Find the nearest endpoint within ENDPOINT_SNAP_PX of the mouse.
 * Returns { lat, lng } or null.
 */
function findNearestEndpoint(mousePx, objects, proj) {
  if (!proj || !mousePx) return null;
  const endpoints = getAllEndpoints(objects);
  let best = null;
  let bestDist = ENDPOINT_SNAP_PX;
  for (const ep of endpoints) {
    const px = proj.fromLatLngToContainerPixel(
      new window.google.maps.LatLng(ep.lat, ep.lng)
    );
    if (!px) continue;
    const d = Math.sqrt((px.x - mousePx.x) ** 2 + (px.y - mousePx.y) ** 2);
    if (d < bestDist) { bestDist = d; best = { lat: ep.lat, lng: ep.lng }; }
  }
  return best;
}

/** Build demo objects relative to origin lat/lng */
function buildDemoObjects(originLat, originLng) {
  const o = (dx, dy) => offsetLatLng(originLat, originLng, dx, dy);
  return [
    { type: 'rect',
      nw: o(-8.5,  6.5), ne: o( 8.5,  6.5),
      se: o( 8.5, -6.5), sw: o(-8.5, -6.5),
      layer: 'roof', lineStyle: 'solid' },
    { type: 'rect',
      nw: o( 8.5,  4.5), ne: o(14,    4.5),
      se: o(14,   -4.5), sw: o( 8.5, -4.5),
      layer: 'roof', lineStyle: 'solid' },
    { type: 'rect',
      nw: o(-8,    6),   ne: o(-1,    6),
      se: o(-1,    1),   sw: o(-8,    1),
      layer: 'panels', lineStyle: 'solid' },
    { type: 'rect',
      nw: o(-8,   -1),  ne: o(-1,   -1),
      se: o(-1,  -5),   sw: o(-8,  -5),
      layer: 'panels', lineStyle: 'solid' },
    { type: 'polyline',
      points: [o(-4.5, 0), o(-4.5, -7), o(9, -7), o(9, -10)],
      layer: 'conduit', lineStyle: 'dashed' },
    { type: 'equipment', pos: o(10, -10), label: 'MSP', layer: 'equipment' },
    { type: 'equipment', pos: o(12, -10), label: 'DIS', layer: 'equipment' },
    { type: 'equipment', pos: o(14, -10), label: 'MTR', layer: 'equipment' },
    { type: 'dimension', p1: o(-8.5, 7.5), p2: o(8.5, 7.5), layer: 'dimensions', lineStyle: 'solid' },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const SkyfireCanvas = ({ projectUuid, projectData, lat, lng }) => {
  const hasCoords = lat != null && lng != null && !isNaN(lat) && !isNaN(lng);

  // ── Google Maps ───────────────────────────────────────────────────────
  const { isLoaded: mapsLoaded, loadError: mapsError } = useGoogleMaps();
  const mapContainerRef = useRef(null);
  const googleMapRef    = useRef(null);
  const overlayRef      = useRef(null);
  const projectionRef   = useRef(null);

  // ── Canvas ───────────────────────────────────────────────────────────
  const canvasRef     = useRef(null);
  const canvasAreaRef = useRef(null);

  // ── Drawing state (ref — not React state) ─────────────────────────────
  const drawRef = useRef({
    tool: 'line',
    drawing: false,
    startPt: null,
    currentPolyline: null,
    mouseLatLng: null,
    mousePx: null,
    selectedIdx: null,
    objects: [],
    activeLayer: 'roof',
    snapEnabled: true,
    orthoEnabled: true,
    gridEnabled: true,
    showMapLayer: true,
    isSpacePanning: false,
    metersPerPx: 0.15,
    // Phase 3 additions
    endpointSnap: null,     // { lat, lng } | null — current endpoint snap target
    closeSnap: false,       // boolean — polyline close-path snap active
    hoverIdx: null,         // object index under cursor (select tool)
    hoverPx: null,          // { x, y } position of hover cursor for tooltip
  });

  // ── React UI state ────────────────────────────────────────────────────
  const [activeTool,      setActiveTool]      = useState('line');
  const [activeLayer,     setActiveLayer]      = useState('roof');
  const [leftTab,         setLeftTab]          = useState('layers');
  const [snapEnabled,     setSnapEnabled]      = useState(true);
  const [orthoEnabled,    setOrthoEnabled]     = useState(true);
  const [gridEnabled,     setGridEnabled]      = useState(true);
  const [showMapLayer,    setShowMapLayer]      = useState(true);
  const [layerVisibility, setLayerVisibility]  = useState(() =>
    LAYERS.reduce((acc, l) => { acc[l.id] = true; return acc; }, {}));
  const [layerLocked,     setLayerLocked]      = useState(() =>
    LAYERS.reduce((acc, l) => { acc[l.id] = l.locked; return acc; }, {}));
  // Refs that mirror layer state — readable inside async callbacks without stale closures
  const layerVisibilityRef = useRef(LAYERS.reduce((acc, l) => { acc[l.id] = true; return acc; }, {}));
  const layerLockedRef     = useRef(LAYERS.reduce((acc, l) => { acc[l.id] = l.locked; return acc; }, {}));
  const [objects,         setObjects]          = useState([]);
  const [selectedIdx,     setSelectedIdx]      = useState(null);
  const [showShortcuts,   setShowShortcuts]    = useState(false);
  const [toolHint,        setToolHint]         = useState(TOOL_HINTS.line);
  const [mapZoom,         setMapZoom]          = useState(DEFAULT_MAP_ZOOM);
  const [scaleLabel,      setScaleLabel]       = useState('');
  const [coordDisplay,    setCoordDisplay]     = useState({ x: '—', y: '—', delta: '—' });
  const [hoverTooltip,    setHoverTooltip]     = useState(null); // { text, x, y }
  const [toast,           setToast]            = useState(null); // { msg, type }

  const commandInputRef = useRef(null);
  const toastTimerRef   = useRef(null);

  // ── Server save state ─────────────────────────────────────────────────
  const [saveStatus,    setSaveStatus]    = useState('saved');   // 'saved'|'saving'|'unsaved'|'error'
  const [lastSavedAt,   setLastSavedAt]   = useState(null);      // ISO string
  const versionRef      = useRef(0);
  const saveTimeoutRef  = useRef(null);

  // ── Toast helper ──────────────────────────────────────────────────────
  const showToast = useCallback((msg, type = 'info') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ msg, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
  }, []);

  // ── localStorage helpers ──────────────────────────────────────────────
  const getStorageKey = useCallback(() => {
    return projectUuid ? `${LS_KEY_PREFIX}${projectUuid}` : null;
  }, [projectUuid]);

  const saveToStorage = useCallback((extraFields = {}) => {
    const key = getStorageKey();
    if (!key) return;
    try {
      const payload = {
        objects: drawRef.current.objects,
        activeLayer: drawRef.current.activeLayer,
        savedAt: new Date().toISOString(),
        ...extraFields,
      };
      localStorage.setItem(key, JSON.stringify(payload));
    } catch (err) {
      // localStorage quota exceeded or unavailable — silently skip
    }
  }, [getStorageKey]);

  const loadFromStorage = useCallback(() => {
    const key = getStorageKey();
    if (!key) return null;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, [getStorageKey]);

  // ── Server save helpers ───────────────────────────────────────────────

  /** Build the full CanvasState payload from current drawRef + layer refs. */
  const buildCanvasState = useCallback(() => ({
    objects: drawRef.current.objects,
    layerVisibility: layerVisibilityRef.current,
    layerLocked: layerLockedRef.current,
    viewport: googleMapRef.current ? {
      center: {
        lat: googleMapRef.current.getCenter().lat(),
        lng: googleMapRef.current.getCenter().lng(),
      },
      zoom: googleMapRef.current.getZoom(),
    } : undefined,
    version: versionRef.current + 1,
  }), []);

  /** Perform an immediate server save. Updates saveStatus and versionRef. */
  const saveNow = useCallback(async () => {
    if (!projectUuid) return;
    try {
      setSaveStatus('saving');
      const state = buildCanvasState();
      const result = await saveCanvasState(projectUuid, state);
      versionRef.current = result.data.version;
      setLastSavedAt(result.data.savedAt);
      setSaveStatus('saved');
    } catch (err) {
      console.error('[Canvas] Server save failed:', err);
      setSaveStatus('error');
    }
  }, [projectUuid, buildCanvasState]);

  /**
   * Called after every canvas mutation.
   * Saves to localStorage immediately (offline-safe), then debounces a server save (2s).
   */
  const triggerSave = useCallback(() => {
    saveToStorage();
    setSaveStatus('unsaved');

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveNow();
    }, 2000);
  }, [saveToStorage, saveNow]);

  // ── Sync objects array → React state ──────────────────────────────────
  const syncObjects = useCallback((doSave = true) => {
    const d = drawRef.current;
    setObjects([...d.objects]);
    setSelectedIdx(d.selectedIdx);
    if (doSave) triggerSave();
  }, [triggerSave]);

  // ── Projection helpers ────────────────────────────────────────────────
  const latLngToPx = useCallback((latLng) => {
    const proj = projectionRef.current;
    if (!proj) return null;
    const pt = proj.fromLatLngToContainerPixel(
      new window.google.maps.LatLng(latLng.lat, latLng.lng)
    );
    return pt ? { x: pt.x, y: pt.y } : null;
  }, []);

  const pxToLatLng = useCallback((x, y) => {
    const proj = projectionRef.current;
    if (!proj) return null;
    const ll = proj.fromContainerPixelToLatLng(
      new window.google.maps.Point(x, y)
    );
    return ll ? { lat: ll.lat(), lng: ll.lng() } : null;
  }, []);

  // ── Update scale label from map ────────────────────────────────────────
  const updateScale = useCallback(() => {
    const map = googleMapRef.current;
    if (!map) return;
    const zoom = map.getZoom();
    const centerLat = (map.getCenter()?.lat() ?? (lat || 33.4));
    const mPerPx = 156543.03392 * Math.cos(centerLat * Math.PI / 180) / Math.pow(2, zoom);
    drawRef.current.metersPerPx = mPerPx;
    const ftPerPx = mPerPx * FT_PER_M;
    setScaleLabel(`1 px ≈ ${ftPerPx.toFixed(2)} ft`);
    setMapZoom(zoom);
  }, [lat]);

  // ── Main render ────────────────────────────────────────────────────────
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const proj   = projectionRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const d   = drawRef.current;

    const area = canvasAreaRef.current;
    if (area) {
      const r = area.getBoundingClientRect();
      if (canvas.width !== r.width || canvas.height !== r.height) {
        canvas.width  = r.width;
        canvas.height = r.height;
      }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!proj) {
      if (!hasCoords) drawNoCoordsPlaceholder(ctx, canvas);
      return;
    }

    if (d.gridEnabled) drawGrid(ctx, canvas, proj, d);
    d.objects.forEach((obj, i) => drawObject(ctx, obj, i === d.selectedIdx, proj, d));
    if (d.drawing) drawPreview(ctx, proj, d);
    if (d.mousePx) drawCrosshair(ctx, canvas, d);
    drawSnapIndicators(ctx, proj, d);
  }, [hasCoords]);

  // ── Drawing helpers ────────────────────────────────────────────────────

  function drawNoCoordsPlaceholder(ctx, canvas) {
    ctx.save();
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No coordinates available.', canvas.width / 2, canvas.height / 2 - 10);
    ctx.fillText('Add a project address to enable aerial imagery.', canvas.width / 2, canvas.height / 2 + 10);
    ctx.restore();
  }

  function drawGrid(ctx, canvas, proj, d) {
    if (!proj) return;
    ctx.save();
    ctx.lineWidth = 0.5;

    const topLeft  = proj.fromContainerPixelToLatLng(new window.google.maps.Point(0, 0));
    const botRight = proj.fromContainerPixelToLatLng(new window.google.maps.Point(canvas.width, canvas.height));
    if (!topLeft || !botRight) { ctx.restore(); return; }

    const minLat = botRight.lat(), maxLat = topLeft.lat();
    const minLng = topLeft.lng(),  maxLng = botRight.lng();

    const mPerDegLat = 111320;
    const mPerDegLng = 111320 * Math.cos(((minLat + maxLat) / 2) * Math.PI / 180);
    const dLat = GRID_METERS / mPerDegLat;
    const dLng = GRID_METERS / mPerDegLng;

    // Minor grid
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    const startLat = Math.floor(minLat / dLat) * dLat;
    const startLng = Math.floor(minLng / dLng) * dLng;
    for (let la = startLat; la <= maxLat + dLat; la += dLat) {
      const p0 = proj.fromLatLngToContainerPixel(new window.google.maps.LatLng(la, minLng));
      const p1 = proj.fromLatLngToContainerPixel(new window.google.maps.LatLng(la, maxLng));
      if (!p0 || !p1) continue;
      ctx.beginPath(); ctx.moveTo(0, p0.y); ctx.lineTo(canvas.width, p1.y); ctx.stroke();
    }
    for (let lo = startLng; lo <= maxLng + dLng; lo += dLng) {
      const p0 = proj.fromLatLngToContainerPixel(new window.google.maps.LatLng(minLat, lo));
      const p1 = proj.fromLatLngToContainerPixel(new window.google.maps.LatLng(maxLat, lo));
      if (!p0 || !p1) continue;
      ctx.beginPath(); ctx.moveTo(p0.x, canvas.height); ctx.lineTo(p1.x, 0); ctx.stroke();
    }

    // Major grid every 5m
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    const dLat5 = dLat * 5, dLng5 = dLng * 5;
    const startLat5 = Math.floor(minLat / dLat5) * dLat5;
    const startLng5 = Math.floor(minLng / dLng5) * dLng5;
    for (let la = startLat5; la <= maxLat + dLat5; la += dLat5) {
      const p0 = proj.fromLatLngToContainerPixel(new window.google.maps.LatLng(la, minLng));
      const p1 = proj.fromLatLngToContainerPixel(new window.google.maps.LatLng(la, maxLng));
      if (!p0 || !p1) continue;
      ctx.beginPath(); ctx.moveTo(0, p0.y); ctx.lineTo(canvas.width, p1.y); ctx.stroke();
    }
    for (let lo = startLng5; lo <= maxLng + dLng5; lo += dLng5) {
      const p0 = proj.fromLatLngToContainerPixel(new window.google.maps.LatLng(minLat, lo));
      const p1 = proj.fromLatLngToContainerPixel(new window.google.maps.LatLng(maxLat, lo));
      if (!p0 || !p1) continue;
      ctx.beginPath(); ctx.moveTo(p0.x, canvas.height); ctx.lineTo(p1.x, 0); ctx.stroke();
    }

    ctx.restore();
  }

  function getObjPoints(obj, proj) {
    switch (obj.type) {
      case 'line': case 'dimension':
        return { p1: proj.fromLatLngToContainerPixel(new window.google.maps.LatLng(obj.p1.lat, obj.p1.lng)),
                 p2: proj.fromLatLngToContainerPixel(new window.google.maps.LatLng(obj.p2.lat, obj.p2.lng)) };
      case 'rect':
        return {
          nw: proj.fromLatLngToContainerPixel(new window.google.maps.LatLng(obj.nw.lat, obj.nw.lng)),
          ne: proj.fromLatLngToContainerPixel(new window.google.maps.LatLng(obj.ne.lat, obj.ne.lng)),
          se: proj.fromLatLngToContainerPixel(new window.google.maps.LatLng(obj.se.lat, obj.se.lng)),
          sw: proj.fromLatLngToContainerPixel(new window.google.maps.LatLng(obj.sw.lat, obj.sw.lng)),
        };
      case 'circle':
        return {
          center: proj.fromLatLngToContainerPixel(new window.google.maps.LatLng(obj.center.lat, obj.center.lng)),
          edge:   proj.fromLatLngToContainerPixel(new window.google.maps.LatLng(obj.edge.lat, obj.edge.lng)),
        };
      case 'polyline':
        return { pts: obj.points.map(pt => proj.fromLatLngToContainerPixel(new window.google.maps.LatLng(pt.lat, pt.lng))) };
      case 'equipment':
        return { center: proj.fromLatLngToContainerPixel(new window.google.maps.LatLng(obj.pos.lat, obj.pos.lng)) };
      default: return {};
    }
  }

  function drawHandle(ctx, x, y) {
    if (x == null || y == null) return;
    ctx.fillStyle = '#FD7332';
    ctx.fillRect(x - 3, y - 3, 6, 6);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 3, y - 3, 6, 6);
  }

  function drawObject(ctx, obj, selected, proj, d) {
    if (!proj) return;
    ctx.save();
    const color = selected ? '#FD7332' : (LAYER_COLORS[obj.layer] || '#9CA3AF');
    ctx.strokeStyle = color;
    ctx.lineWidth = selected ? 2 : 1.5;
    if (obj.lineStyle === 'dashed') ctx.setLineDash([8, 4]);
    else if (obj.lineStyle === 'dashdot') ctx.setLineDash([8, 3, 2, 3]);
    else ctx.setLineDash([]);

    const pts = getObjPoints(obj, proj);

    switch (obj.type) {
      case 'line': {
        const { p1, p2 } = pts;
        if (!p1 || !p2) break;
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
        if (selected) { drawHandle(ctx, p1.x, p1.y); drawHandle(ctx, p2.x, p2.y); }
        break;
      }
      case 'rect': {
        const { nw, ne, se, sw } = pts;
        if (!nw || !ne || !se || !sw) break;
        // Fill for rect (layer color at 10% opacity)
        ctx.setLineDash([]);
        ctx.fillStyle = hexToRgba(LAYER_COLORS[obj.layer] || '#9CA3AF', 0.10);
        ctx.beginPath();
        ctx.moveTo(nw.x, nw.y); ctx.lineTo(ne.x, ne.y); ctx.lineTo(se.x, se.y); ctx.lineTo(sw.x, sw.y);
        ctx.closePath(); ctx.fill();
        // Restore dash for stroke
        if (obj.lineStyle === 'dashed') ctx.setLineDash([8, 4]);
        else if (obj.lineStyle === 'dashdot') ctx.setLineDash([8, 3, 2, 3]);
        else ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(nw.x, nw.y); ctx.lineTo(ne.x, ne.y); ctx.lineTo(se.x, se.y); ctx.lineTo(sw.x, sw.y);
        ctx.closePath(); ctx.stroke();
        if (selected) { drawHandle(ctx,nw.x,nw.y); drawHandle(ctx,ne.x,ne.y); drawHandle(ctx,se.x,se.y); drawHandle(ctx,sw.x,sw.y); }
        break;
      }
      case 'circle': {
        const { center, edge } = pts;
        if (!center || !edge) break;
        const r = Math.sqrt((edge.x - center.x) ** 2 + (edge.y - center.y) ** 2);
        ctx.beginPath(); ctx.arc(center.x, center.y, r, 0, Math.PI * 2); ctx.stroke();
        if (selected) { drawHandle(ctx, center.x, center.y); drawHandle(ctx, edge.x, edge.y); }
        break;
      }
      case 'polyline': {
        const { pts: points } = pts;
        if (!points || points.length < 2) break;

        if (obj.closed && points.length >= 3) {
          // Semi-transparent fill for closed polygon
          ctx.setLineDash([]);
          ctx.fillStyle = hexToRgba(LAYER_COLORS[obj.layer] || '#9CA3AF', 0.15);
          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length; i++) {
            if (points[i]) ctx.lineTo(points[i].x, points[i].y);
          }
          ctx.closePath(); ctx.fill();
          // Restore dash
          if (obj.lineStyle === 'dashed') ctx.setLineDash([8, 4]);
          else if (obj.lineStyle === 'dashdot') ctx.setLineDash([8, 3, 2, 3]);
          else ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length; i++) {
            if (points[i]) ctx.lineTo(points[i].x, points[i].y);
          }
          ctx.closePath(); ctx.stroke();

          // Area label at centroid
          const centroid = polygonCentroid(obj.points);
          if (centroid) {
            const cp = proj.fromLatLngToContainerPixel(new window.google.maps.LatLng(centroid.lat, centroid.lng));
            if (cp) {
              const areaSqFt = polygonAreaSqFt(obj.points);
              ctx.setLineDash([]);
              ctx.fillStyle = color;
              ctx.font = 'bold 11px sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(`${areaSqFt.toFixed(0)} sq ft`, cp.x, cp.y);
            }
          }
        } else {
          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length; i++) { ctx.lineTo(points[i].x, points[i].y); }
          ctx.stroke();
        }

        if (selected) { points.forEach(p => { if (p) drawHandle(ctx, p.x, p.y); }); }
        break;
      }
      case 'equipment': {
        const { center } = pts;
        if (!center) break;
        const sz = 24;
        ctx.fillStyle = 'rgba(139,92,246,0.15)';
        ctx.fillRect(center.x - sz/2, center.y - sz/2, sz, sz);
        ctx.strokeRect(center.x - sz/2, center.y - sz/2, sz, sz);
        ctx.fillStyle = color; ctx.font = '10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(obj.label || 'EQ', center.x, center.y);
        if (selected) drawHandle(ctx, center.x, center.y);
        break;
      }
      case 'dimension': {
        const { p1, p2 } = pts;
        if (!p1 || !p2) break;
        const distM = haversineMeters(obj.p1, obj.p2);
        const distFt = (distM * FT_PER_M).toFixed(1);
        const distIn = distM < 1 ? ` (${(distM * 39.3701).toFixed(1)}")` : '';
        ctx.strokeStyle = '#EC4899'; ctx.lineWidth = 1; ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y - 8); ctx.lineTo(p1.x, p1.y + 8);
        ctx.moveTo(p2.x, p2.y - 8); ctx.lineTo(p2.x, p2.y + 8);
        ctx.stroke();
        ctx.fillStyle = '#EC4899'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(`${distFt}'${distIn}`, (p1.x + p2.x) / 2, (p1.y + p2.y) / 2 - 10);
        if (selected) { drawHandle(ctx, p1.x, p1.y); drawHandle(ctx, p2.x, p2.y); }
        break;
      }
      default: break;
    }
    ctx.restore();
  }

  function drawPreview(ctx, proj, d) {
    if (!proj || !d.startPt || !d.mouseLatLng) return;
    ctx.save();
    ctx.strokeStyle = 'rgba(253,115,50,0.7)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);

    // Use endpoint snap if active, otherwise grid snap
    let endPt;
    if (d.endpointSnap) {
      endPt = d.endpointSnap;
    } else {
      endPt = snapLatLng(d.mouseLatLng, d.startPt.lat, d.startPt.lng, d.snapEnabled);
      if (d.orthoEnabled && d.tool !== 'rect' && d.tool !== 'circle') {
        endPt = applyOrthoLatLng(d.startPt, endPt, true);
      }
    }

    const sp = proj.fromLatLngToContainerPixel(new window.google.maps.LatLng(d.startPt.lat, d.startPt.lng));
    const ep = proj.fromLatLngToContainerPixel(new window.google.maps.LatLng(endPt.lat, endPt.lng));
    if (!sp || !ep) { ctx.restore(); return; }

    switch (d.tool) {
      case 'line':
      case 'dimension': {
        ctx.beginPath(); ctx.moveTo(sp.x, sp.y); ctx.lineTo(ep.x, ep.y); ctx.stroke();
        const distM = haversineMeters(d.startPt, endPt);
        const distFt = (distM * FT_PER_M).toFixed(1);
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(253,115,50,0.95)';
        ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(`${distFt}'`, (sp.x + ep.x) / 2, (sp.y + ep.y) / 2 - 12);
        break;
      }
      case 'rect': {
        const ne = { lat: d.startPt.lat, lng: endPt.lng };
        const sw = { lat: endPt.lat,     lng: d.startPt.lng };
        const nePx = proj.fromLatLngToContainerPixel(new window.google.maps.LatLng(ne.lat, ne.lng));
        const swPx = proj.fromLatLngToContainerPixel(new window.google.maps.LatLng(sw.lat, sw.lng));
        if (!nePx || !swPx) break;
        ctx.beginPath();
        ctx.moveTo(sp.x, sp.y); ctx.lineTo(nePx.x, nePx.y);
        ctx.lineTo(ep.x, ep.y); ctx.lineTo(swPx.x, swPx.y);
        ctx.closePath(); ctx.stroke();
        break;
      }
      case 'circle': {
        const r = Math.sqrt((ep.x - sp.x) ** 2 + (ep.y - sp.y) ** 2);
        ctx.beginPath(); ctx.arc(sp.x, sp.y, r, 0, Math.PI * 2); ctx.stroke();
        const rM = haversineMeters(d.startPt, endPt);
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(253,115,50,0.95)';
        ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(`r=${(rM * FT_PER_M).toFixed(1)}'`, sp.x, sp.y - r - 8);
        break;
      }
      case 'polyline': {
        if (d.currentPolyline && d.currentPolyline.length > 0) {
          // If close-snap active, draw preview closing line in green
          const isClosing = d.closeSnap && d.currentPolyline.length >= 3;
          if (isClosing) {
            ctx.strokeStyle = 'rgba(16,185,129,0.9)';
            ctx.setLineDash([4, 3]);
          }
          ctx.beginPath();
          const first = proj.fromLatLngToContainerPixel(new window.google.maps.LatLng(d.currentPolyline[0].lat, d.currentPolyline[0].lng));
          if (first) {
            ctx.moveTo(first.x, first.y);
            for (let i = 1; i < d.currentPolyline.length; i++) {
              const p = proj.fromLatLngToContainerPixel(new window.google.maps.LatLng(d.currentPolyline[i].lat, d.currentPolyline[i].lng));
              if (p) ctx.lineTo(p.x, p.y);
            }
            ctx.lineTo(ep.x, ep.y);
            ctx.stroke();

            // Close-snap green circle indicator at first point
            if (isClosing) {
              ctx.setLineDash([]);
              ctx.strokeStyle = '#10B981';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(first.x, first.y, 8, 0, Math.PI * 2);
              ctx.stroke();
            }
          }
        }
        break;
      }
      default: break;
    }
    ctx.restore();
  }

  function drawCrosshair(ctx, canvas, d) {
    if (!d.mousePx) return;
    const { x, y } = d.mousePx;
    ctx.save();
    ctx.strokeStyle = 'rgba(253,115,50,0.35)';
    ctx.lineWidth = 0.5; ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(x - 20, y); ctx.lineTo(x + 20, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y - 20); ctx.lineTo(x, y + 20); ctx.stroke();
    ctx.restore();
  }

  /** Draw both endpoint snap (circle) and grid snap (diamond) indicators */
  function drawSnapIndicators(ctx, proj, d) {
    if (!d.mousePx || !proj) return;

    // Endpoint snap — circle indicator (higher priority)
    if (d.endpointSnap) {
      const sp = proj.fromLatLngToContainerPixel(
        new window.google.maps.LatLng(d.endpointSnap.lat, d.endpointSnap.lng)
      );
      if (sp) {
        ctx.save();
        ctx.strokeStyle = '#F59E0B'; // amber
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        return; // don't also draw grid snap
      }
    }

    // Grid snap — diamond indicator
    if (d.snapEnabled && d.mouseLatLng) {
      const snapped = snapLatLng(d.mouseLatLng, d.mouseLatLng.lat, d.mouseLatLng.lng, true);
      const sp = proj.fromLatLngToContainerPixel(new window.google.maps.LatLng(snapped.lat, snapped.lng));
      if (!sp) return;
      const dist = Math.sqrt((sp.x - d.mousePx.x) ** 2 + (sp.y - d.mousePx.y) ** 2);
      if (dist < 10) {
        ctx.save();
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(sp.x, sp.y - 6); ctx.lineTo(sp.x + 6, sp.y);
        ctx.lineTo(sp.x, sp.y + 6); ctx.lineTo(sp.x - 6, sp.y);
        ctx.closePath(); ctx.stroke();
        ctx.restore();
      }
    }
  }

  // ── Hit testing ────────────────────────────────────────────────────────
  function hitTestObjects(latLng, proj, objects, d) {
    if (!proj) return null;
    const px = proj.fromLatLngToContainerPixel(new window.google.maps.LatLng(latLng.lat, latLng.lng));
    if (!px) return null;
    const threshold = 8;

    function distPxToSegment(ax, ay, bx, by) {
      const A = px.x - ax, B = px.y - ay, C = bx - ax, D = by - ay;
      const dot = A*C + B*D, lenSq = C*C + D*D;
      let t = lenSq !== 0 ? dot / lenSq : -1;
      t = Math.max(0, Math.min(1, t));
      return Math.sqrt((px.x - (ax + t*C))**2 + (px.y - (ay + t*D))**2);
    }

    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];
      const pts = getObjPoints(obj, proj);
      switch (obj.type) {
        case 'line': case 'dimension': {
          const { p1, p2 } = pts;
          if (p1 && p2 && distPxToSegment(p1.x, p1.y, p2.x, p2.y) < threshold) return i;
          break;
        }
        case 'rect': {
          const { nw, ne, se, sw } = pts;
          if (!nw || !ne || !se || !sw) break;
          if (distPxToSegment(nw.x,nw.y,ne.x,ne.y) < threshold ||
              distPxToSegment(ne.x,ne.y,se.x,se.y) < threshold ||
              distPxToSegment(se.x,se.y,sw.x,sw.y) < threshold ||
              distPxToSegment(sw.x,sw.y,nw.x,nw.y) < threshold) return i;
          break;
        }
        case 'circle': {
          const { center, edge } = pts;
          if (!center || !edge) break;
          const r = Math.sqrt((edge.x-center.x)**2 + (edge.y-center.y)**2);
          const dist = Math.sqrt((px.x-center.x)**2 + (px.y-center.y)**2);
          if (Math.abs(dist - r) < threshold) return i;
          break;
        }
        case 'polyline': {
          const { pts: points } = pts;
          if (!points) break;
          const segments = obj.closed
            ? points.length  // includes closing segment
            : points.length - 1;
          for (let j = 0; j < segments; j++) {
            const a = points[j], b = points[(j + 1) % points.length];
            if (a && b && distPxToSegment(a.x, a.y, b.x, b.y) < threshold) return i;
          }
          break;
        }
        case 'equipment': {
          const { center } = pts;
          if (center && Math.abs(px.x - center.x) < 16 && Math.abs(px.y - center.y) < 16) return i;
          break;
        }
        default: break;
      }
    }
    return null;
  }

  // ── Build hover tooltip text for a given object ────────────────────────
  function buildTooltip(obj) {
    if (!obj) return null;
    const name = OBJECT_NAMES[obj.type] || obj.type;
    const layerLabel = LAYERS.find(l => l.id === obj.layer)?.name || obj.layer;
    let measure = '';
    switch (obj.type) {
      case 'line': case 'dimension':
        measure = ` · ${(haversineMeters(obj.p1, obj.p2) * FT_PER_M).toFixed(1)}'`;
        break;
      case 'circle':
        measure = ` · r=${(haversineMeters(obj.center, obj.edge) * FT_PER_M).toFixed(1)}'`;
        break;
      case 'polyline':
        if (obj.closed && obj.points?.length >= 3) {
          measure = ` · ${polygonAreaSqFt(obj.points).toFixed(0)} sq ft`;
        } else if (obj.points?.length >= 2) {
          let total = 0;
          for (let i = 0; i < obj.points.length - 1; i++) {
            total += haversineMeters(obj.points[i], obj.points[i+1]);
          }
          measure = ` · ${(total * FT_PER_M).toFixed(1)}'`;
        }
        break;
      case 'equipment':
        measure = obj.label ? ` · ${obj.label}` : '';
        break;
      default: break;
    }
    return `${name} · ${layerLabel}${measure}`;
  }

  // ── Tool switching ─────────────────────────────────────────────────────
  const setTool = useCallback((tool) => {
    drawRef.current.tool = tool;
    drawRef.current.drawing = false;
    drawRef.current.currentPolyline = null;
    drawRef.current.endpointSnap = null;
    drawRef.current.closeSnap = false;
    setActiveTool(tool);
    setToolHint(TOOL_HINTS[tool] || `<strong>${tool}</strong> tool active`);
    const canvas = canvasRef.current;
    if (canvas) canvas.style.cursor = tool === 'select' ? 'default' : tool === 'pan' ? 'grab' : 'crosshair';
  }, []);

  const handleCommand = useCallback((cmd) => {
    const c = cmd.trim().toLowerCase();
    const map = { l:'line',line:'line',pl:'polyline',pline:'polyline',r:'rect',rec:'rect',
                  c:'circle',circle:'circle',d:'dimension',dim:'dimension',
                  t:'text',text:'text',m:'move',move:'move',v:'select',select:'select' };
    if (map[c]) setTool(map[c]);
  }, [setTool]);

  // ── Initialize Google Map + OverlayView ────────────────────────────────
  useEffect(() => {
    if (!mapsLoaded || !mapContainerRef.current) return;
    if (googleMapRef.current) return;

    const mapCenter = hasCoords ? { lat, lng } : { lat: 33.4484, lng: -112.0740 };

    const map = new window.google.maps.Map(mapContainerRef.current, {
      center: mapCenter,
      zoom: DEFAULT_MAP_ZOOM,
      mapTypeId: 'satellite',
      tilt: 0,
      heading: 0,
      disableDefaultUI: true,
      gestureHandling: 'greedy',
      keyboardShortcuts: false,
      clickableIcons: false,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: false,
      scaleControl: false,
      rotateControl: false,
    });

    googleMapRef.current = map;

    const overlay = new window.google.maps.OverlayView();
    overlay.onAdd = function () {};
    overlay.draw  = function () {
      projectionRef.current = this.getProjection();
      render();
      updateScale();
    };
    overlay.onRemove = function () { projectionRef.current = null; };
    overlay.setMap(map);
    overlayRef.current = overlay;

    map.addListener('bounds_changed', () => { updateScale(); render(); });
    map.addListener('idle',           () => { updateScale(); render(); });

    // Load canvas data: try server first, fall back to localStorage, then demo objects
    const loadCanvasData = async () => {
      if (projectUuid) {
        try {
          const serverState = await fetchCanvasState(projectUuid);
          if (serverState && serverState.objects?.length > 0) {
            drawRef.current.objects = serverState.objects;
            versionRef.current = serverState.version ?? 0;
            if (serverState.layerVisibility) {
              layerVisibilityRef.current = serverState.layerVisibility;
              setLayerVisibility(serverState.layerVisibility);
            }
            if (serverState.layerLocked) {
              layerLockedRef.current = serverState.layerLocked;
              setLayerLocked(serverState.layerLocked);
            }
            if (serverState.viewport && googleMapRef.current) {
              googleMapRef.current.setCenter(serverState.viewport.center);
              googleMapRef.current.setZoom(serverState.viewport.zoom);
            }
            syncObjects(false);
            setSaveStatus('saved');
            console.log(`[Canvas] Loaded ${serverState.objects.length} objects from server (v${serverState.version})`);
            return;
          }
        } catch (err) {
          console.warn('[Canvas] Server load failed, trying localStorage:', err?.message ?? err);
        }
      }

      // localStorage fallback
      const saved = loadFromStorage();
      if (saved && saved.objects?.length > 0) {
        drawRef.current.objects = saved.objects;
        if (saved.activeLayer) drawRef.current.activeLayer = saved.activeLayer;
        syncObjects(false);
        setSaveStatus('unsaved'); // loaded locally but not confirmed on server
        console.log(`[Canvas] Loaded ${saved.objects.length} objects from localStorage`);
        return;
      }

      // Demo objects fallback
      if (hasCoords && drawRef.current.objects.length === 0) {
        drawRef.current.objects = buildDemoObjects(lat, lng);
        syncObjects(false);
      }
    };
    loadCanvasData();

    return () => {
      overlay.setMap(null);
      overlayRef.current = null;
      projectionRef.current = null;
      googleMapRef.current = null;
    };
  }, [mapsLoaded, hasCoords, lat, lng, render, updateScale, syncObjects, loadFromStorage, projectUuid]);

  // ── Keep layer refs in sync with React state ──────────────────────────
  useEffect(() => { layerVisibilityRef.current = layerVisibility; }, [layerVisibility]);
  useEffect(() => { layerLockedRef.current = layerLocked; }, [layerLocked]);

  // ── Warn before unload with unsaved changes ────────────────────────────
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (saveStatus === 'unsaved' || saveStatus === 'error') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveStatus]);

  // ── Canvas resize ──────────────────────────────────────────────────────
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      const area   = canvasAreaRef.current;
      if (!canvas || !area) return;
      const r = area.getBoundingClientRect();
      canvas.width  = r.width;
      canvas.height = r.height;
      render();
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [render]);

  // ── Canvas mouse events ────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getLatLng = (e) => {
      const rect = canvas.getBoundingClientRect();
      return pxToLatLng(e.clientX - rect.left, e.clientY - rect.top);
    };

    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const d = drawRef.current;
      d.mousePx = { x, y };
      const ll = pxToLatLng(x, y);
      d.mouseLatLng = ll;

      // ── Endpoint snap detection ──────────────────────────────────────
      if (projectionRef.current && (d.drawing || d.tool !== 'select')) {
        const ep = findNearestEndpoint({ x, y }, d.objects, projectionRef.current);
        d.endpointSnap = ep;
      } else {
        d.endpointSnap = null;
      }

      // ── Close-path snap for polyline ──────────────────────────────────
      if (d.tool === 'polyline' && d.drawing && d.currentPolyline && d.currentPolyline.length >= 3) {
        const firstPt = d.currentPolyline[0];
        if (projectionRef.current) {
          const firstPx = projectionRef.current.fromLatLngToContainerPixel(
            new window.google.maps.LatLng(firstPt.lat, firstPt.lng)
          );
          if (firstPx) {
            const dist = Math.sqrt((x - firstPx.x) ** 2 + (y - firstPx.y) ** 2);
            d.closeSnap = dist < CLOSE_SNAP_PX;
            if (d.closeSnap) d.endpointSnap = firstPt; // snap to first point
          }
        }
      } else {
        d.closeSnap = false;
      }

      // ── Hover tooltip (select tool) ───────────────────────────────────
      if (d.tool === 'select' && ll && projectionRef.current) {
        const hIdx = hitTestObjects(ll, projectionRef.current, d.objects, d);
        d.hoverIdx = hIdx;
        if (hIdx !== null) {
          setHoverTooltip({ text: buildTooltip(d.objects[hIdx]), x: x + 15, y: y - 5 });
        } else {
          setHoverTooltip(null);
        }
      } else {
        d.hoverIdx = null;
        setHoverTooltip(null);
      }

      if (ll && hasCoords) {
        const dxM = (ll.lng - lng) * 111320 * Math.cos(lat * Math.PI / 180);
        const dyM = (ll.lat - lat) * 111320;
        setCoordDisplay({
          x: (dxM * FT_PER_M).toFixed(1) + "'",
          y: (dyM * FT_PER_M).toFixed(1) + "'",
          delta: d.drawing && d.startPt
            ? (haversineMeters(d.startPt, ll) * FT_PER_M).toFixed(1) + "'"
            : '—',
        });
      }
      render();
    };

    const onMouseDown = (e) => {
      if (e.button !== 0) return;
      const d = drawRef.current;
      const ll = getLatLng(e);
      if (!ll) return;
      if (d.isSpacePanning) return;

      // Resolve snap point: endpoint > grid
      let snapped;
      if (d.endpointSnap) {
        snapped = d.endpointSnap;
      } else {
        snapped = snapLatLng(ll, ll.lat, ll.lng, d.snapEnabled);
      }

      if (d.tool === 'select') {
        d.selectedIdx = hitTestObjects(ll, projectionRef.current, d.objects, d);
        syncObjects(); render(); return;
      }

      if (d.tool === 'polyline') {
        if (!d.drawing) {
          d.drawing = true;
          d.currentPolyline = [snapped];
          d.startPt = snapped;
        } else {
          // Check close-path
          if (d.closeSnap && d.currentPolyline.length >= 3) {
            // Close the polygon
            d.objects.push({
              type: 'polyline',
              points: [...d.currentPolyline],
              closed: true,
              layer: d.activeLayer,
              lineStyle: 'solid',
            });
            d.currentPolyline = null;
            d.drawing = false;
            d.closeSnap = false;
            d.endpointSnap = null;
            syncObjects(); render(); return;
          }

          let end = snapped;
          if (d.orthoEnabled && !d.endpointSnap) {
            const last = d.currentPolyline[d.currentPolyline.length - 1];
            end = applyOrthoLatLng(last, end, true);
          }
          d.currentPolyline.push(end);
          d.startPt = end;
        }
        render(); return;
      }

      if (!d.drawing) {
        d.drawing = true;
        d.startPt = snapped;
      } else {
        let endPt;
        if (d.endpointSnap) {
          endPt = d.endpointSnap;
        } else {
          endPt = snapLatLng(ll, ll.lat, ll.lng, d.snapEnabled);
          if (d.orthoEnabled && d.tool !== 'rect' && d.tool !== 'circle') {
            endPt = applyOrthoLatLng(d.startPt, endPt, true);
          }
        }
        let newObj = null;
        switch (d.tool) {
          case 'line':
            newObj = { type: 'line', p1: d.startPt, p2: endPt, layer: d.activeLayer, lineStyle: 'solid' };
            break;
          case 'rect': {
            const ne = { lat: d.startPt.lat, lng: endPt.lng };
            const sw = { lat: endPt.lat,     lng: d.startPt.lng };
            newObj = { type: 'rect', nw: d.startPt, ne, se: endPt, sw, layer: d.activeLayer, lineStyle: 'solid' };
            break;
          }
          case 'circle':
            newObj = { type: 'circle', center: d.startPt, edge: endPt, layer: d.activeLayer, lineStyle: 'solid' };
            break;
          case 'dimension':
            newObj = { type: 'dimension', p1: d.startPt, p2: endPt, layer: 'dimensions', lineStyle: 'solid' };
            break;
          default: break;
        }
        if (newObj) d.objects.push(newObj);
        d.drawing = false;
        d.endpointSnap = null;
        syncObjects(); render();
      }
    };

    const onDblClick = (e) => {
      const d = drawRef.current;
      if (d.tool === 'polyline' && d.drawing && d.currentPolyline && d.currentPolyline.length >= 2) {
        d.objects.push({ type: 'polyline', points: [...d.currentPolyline], closed: false, layer: d.activeLayer, lineStyle: 'solid' });
        d.currentPolyline = null; d.drawing = false;
        syncObjects(); render();
      }
    };

    const onContextMenu = (e) => {
      e.preventDefault();
      const d = drawRef.current;
      if (d.drawing) {
        if (d.tool === 'polyline' && d.currentPolyline && d.currentPolyline.length >= 2) {
          d.objects.push({ type: 'polyline', points: [...d.currentPolyline], closed: false, layer: d.activeLayer, lineStyle: 'solid' });
          syncObjects();
        }
        d.drawing = false; d.currentPolyline = null; d.closeSnap = false;
        render();
      }
    };

    const onMouseLeave = () => {
      drawRef.current.mousePx = null;
      drawRef.current.endpointSnap = null;
      drawRef.current.closeSnap = false;
      setHoverTooltip(null);
      render();
    };

    canvas.addEventListener('mousemove',   onMouseMove);
    canvas.addEventListener('mousedown',   onMouseDown);
    canvas.addEventListener('dblclick',    onDblClick);
    canvas.addEventListener('contextmenu', onContextMenu);
    canvas.addEventListener('mouseleave',  onMouseLeave);
    return () => {
      canvas.removeEventListener('mousemove',   onMouseMove);
      canvas.removeEventListener('mousedown',   onMouseDown);
      canvas.removeEventListener('dblclick',    onDblClick);
      canvas.removeEventListener('contextmenu', onContextMenu);
      canvas.removeEventListener('mouseleave',  onMouseLeave);
    };
  }, [render, syncObjects, pxToLatLng, hasCoords, lat, lng]);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e) => {
      if (document.activeElement === commandInputRef.current) {
        if (e.key === 'Enter') {
          handleCommand(commandInputRef.current.value);
          commandInputRef.current.value = '';
          commandInputRef.current.blur();
        }
        return;
      }
      const d = drawRef.current;
      switch (e.key) {
        case 'Escape':
          d.drawing = false; d.currentPolyline = null; d.selectedIdx = null;
          d.endpointSnap = null; d.closeSnap = false;
          syncObjects(); render(); break;
        case 'v': case 'V': setTool('select'); break;
        case 'l': case 'L': setTool('line'); break;
        case 'r': case 'R': setTool('rect'); break;
        case 'c': case 'C': setTool('circle'); break;
        case 'd': case 'D': setTool('dimension'); break;
        case 't': case 'T': setTool('text'); break;
        case 'Delete': case 'Backspace':
          if (d.selectedIdx !== null) {
            d.objects.splice(d.selectedIdx, 1);
            d.selectedIdx = null; syncObjects(); render();
          }
          break;
        case 'z':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (d.objects.length > 0) { d.objects.pop(); d.selectedIdx = null; syncObjects(); render(); }
          }
          break;
        case 's':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            saveNow();
          }
          break;
        case 'F7': e.preventDefault();
          d.gridEnabled = !d.gridEnabled; setGridEnabled(g => !g); render(); break;
        case 'F8': e.preventDefault();
          d.orthoEnabled = !d.orthoEnabled; setOrthoEnabled(o => !o); render(); break;
        case 'F9': e.preventDefault();
          d.snapEnabled = !d.snapEnabled; setSnapEnabled(sn => !sn); render(); break;
        case '?': case '/': setShowShortcuts(v => !v); break;
        case ' ':
          if (!d.drawing) d.isSpacePanning = true; break;
        default: break;
      }
    };
    const onKeyUp = (e) => {
      if (e.key === ' ') drawRef.current.isSpacePanning = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup',   onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup',   onKeyUp);
    };
  }, [setTool, handleCommand, render, syncObjects, saveNow]);

  // ── Map control handlers ───────────────────────────────────────────────
  const handleCenterOnProperty = () => {
    if (!googleMapRef.current || !hasCoords) return;
    googleMapRef.current.setCenter({ lat, lng });
    googleMapRef.current.setZoom(DEFAULT_MAP_ZOOM);
  };

  const handleToggleMapLayer = () => {
    const next = !drawRef.current.showMapLayer;
    drawRef.current.showMapLayer = next;
    setShowMapLayer(next);
    if (mapContainerRef.current) {
      mapContainerRef.current.style.opacity = next ? '1' : '0';
    }
  };

  const handleToggleSnap = () => {
    const next = !drawRef.current.snapEnabled;
    drawRef.current.snapEnabled = next;
    setSnapEnabled(next);
  };
  const handleToggleOrtho = () => {
    const next = !drawRef.current.orthoEnabled;
    drawRef.current.orthoEnabled = next;
    setOrthoEnabled(next);
  };
  const handleToggleGrid = () => {
    const next = !drawRef.current.gridEnabled;
    drawRef.current.gridEnabled = next;
    setGridEnabled(next);
    render();
  };
  const handleLayerClick = (id) => {
    drawRef.current.activeLayer = id;
    setActiveLayer(id);
  };
  const handleToggleVisibility = (id, e) => {
    e.stopPropagation();
    setLayerVisibility(prev => ({ ...prev, [id]: !prev[id] }));
  };
  const handleToggleLock = (id, e) => {
    e.stopPropagation();
    setLayerLocked(prev => ({ ...prev, [id]: !prev[id] }));
  };
  const handleSelectObject = (idx) => {
    drawRef.current.selectedIdx = idx;
    setTool('select');
    syncObjects(); render();
  };

  // ── DXF Export ────────────────────────────────────────────────────────
  const handleExportDXF = () => {
    const d = drawRef.current;
    if (d.objects.length === 0) {
      showToast('Canvas is empty — nothing to export.', 'warn');
      return;
    }
    if (!hasCoords) {
      showToast('No coordinates — DXF will use relative origin (0,0).', 'warn');
    }
    try {
      const origin = hasCoords ? { lat, lng } : { lat: 0, lng: 0 };
      const dxf = exportToDXF(d.objects, LAYERS, origin);
      const projectName = projectData?.address?.split(',')[0]?.trim().replace(/\s+/g, '-') || 'site-plan';
      downloadDXF(dxf, `${projectName}.dxf`);
      showToast('DXF exported successfully.', 'success');
    } catch (err) {
      showToast(`Export failed: ${err.message}`, 'error');
    }
  };

  // ── Clear Canvas ──────────────────────────────────────────────────────
  const handleClearCanvas = () => {
    if (!window.confirm('Clear all objects? This cannot be undone.')) return;
    const d = drawRef.current;
    d.objects = [];
    d.selectedIdx = null;
    d.drawing = false;
    d.currentPolyline = null;
    // Clear localStorage
    const key = getStorageKey();
    if (key) localStorage.removeItem(key);
    syncObjects(false);
    render();
    // Save empty state to server to clear it there too
    saveNow();
    showToast('Canvas cleared.', 'info');
  };

  // ── Properties panel helper ───────────────────────────────────────────
  const getSelectedObj = () => {
    const d = drawRef.current;
    if (d.selectedIdx === null || !d.objects[d.selectedIdx]) return null;
    return d.objects[d.selectedIdx];
  };

  const getSelectedDetail = () => {
    const obj = getSelectedObj();
    if (!obj) return 'No objects selected';
    const name = OBJECT_NAMES[obj.type] || obj.type;
    const layerLabel = LAYERS.find(l => l.id === obj.layer)?.name || obj.layer;
    let measure = '';
    switch (obj.type) {
      case 'line': case 'dimension':
        measure = ` — ${(haversineMeters(obj.p1, obj.p2) * FT_PER_M).toFixed(1)}'`;
        break;
      case 'circle':
        measure = ` — r=${(haversineMeters(obj.center, obj.edge) * FT_PER_M).toFixed(1)}'`;
        break;
      case 'polyline':
        if (obj.closed && obj.points?.length >= 3) {
          measure = ` — ${polygonAreaSqFt(obj.points).toFixed(0)} sq ft`;
        } else if (obj.points?.length >= 2) {
          let total = 0;
          for (let i = 0; i < obj.points.length - 1; i++) {
            total += haversineMeters(obj.points[i], obj.points[i+1]);
          }
          measure = ` — ${(total * FT_PER_M).toFixed(1)}'`;
        }
        break;
      default: break;
    }
    return `${name} · ${layerLabel}${measure}`;
  };

  // ── JSX ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.canvasRoot}>

      {/* ===== TOOLBAR ROW ===== */}
      <div className={styles.toolbarRow}>
        {/* Draw group */}
        <div className={styles.toolGroup}>
          <span className={styles.toolGroupLabel}>Draw</span>
          {[
            { tool:'line',     tip:'Line (L)',       svg:<line x1="2" y1="14" x2="14" y2="2"/> },
            { tool:'polyline', tip:'Polyline (PL)',  svg:<polyline points="2,14 6,4 10,10 14,2"/> },
            { tool:'rect',     tip:'Rectangle (R)',  svg:<rect x="2" y="3" width="12" height="10" rx="0.5"/> },
            { tool:'circle',   tip:'Circle (C)',     svg:<circle cx="8" cy="8" r="6"/> },
          ].map(({ tool, tip, svg }) => (
            <button key={tool} title={tip}
              className={`${styles.toolBtn} ${activeTool === tool ? styles.toolBtnActive : ''}`}
              onClick={() => setTool(tool)}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">{svg}</svg>
            </button>
          ))}
        </div>

        {/* Annotate group */}
        <div className={styles.toolGroup}>
          <span className={styles.toolGroupLabel}>Annotate</span>
          <button title="Dimension (D)"
            className={`${styles.toolBtn} ${activeTool === 'dimension' ? styles.toolBtnActive : ''}`}
            onClick={() => setTool('dimension')}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="2" y1="12" x2="14" y2="12"/>
              <line x1="2" y1="9" x2="2" y2="15"/><line x1="14" y1="9" x2="14" y2="15"/>
              <line x1="5" y1="12" x2="3" y2="10.5"/><line x1="5" y1="12" x2="3" y2="13.5"/>
              <line x1="11" y1="12" x2="13" y2="10.5"/><line x1="11" y1="12" x2="13" y2="13.5"/>
            </svg>
          </button>
        </div>

        {/* Map controls group */}
        {hasCoords && (
          <div className={styles.toolGroup}>
            <span className={styles.toolGroupLabel}>Map</span>
            <button title="Center on Property"
              className={styles.toolBtn}
              onClick={handleCenterOnProperty}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="8" cy="8" r="3"/>
                <line x1="8" y1="1" x2="8" y2="4"/><line x1="8" y1="12" x2="8" y2="15"/>
                <line x1="1" y1="8" x2="4" y2="8"/><line x1="12" y1="8" x2="15" y2="8"/>
              </svg>
            </button>
            <button title={showMapLayer ? 'Hide aerial imagery' : 'Show aerial imagery'}
              className={`${styles.toolBtn} ${showMapLayer ? styles.toolBtnActive : ''}`}
              onClick={handleToggleMapLayer}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="1" y="1" width="14" height="14" rx="1"/>
                <path d="M1 10l4-4 3 3 3-4 4 5"/>
              </svg>
            </button>
            <span className={styles.zoomBadge}>Z{mapZoom}</span>
          </div>
        )}

        {/* Export/File group */}
        <div className={styles.toolGroup}>
          <span className={styles.toolGroupLabel}>File</span>
          <button
            title={saveStatus === 'saved' ? 'All changes saved' : 'Save Now (Ctrl+S)'}
            className={`${styles.toolBtn} ${saveStatus === 'saved' ? styles.toolBtnDisabled : ''}`}
            onClick={() => saveNow()}
            disabled={saveStatus === 'saving'}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 2h9l3 3v9H2V2z"/>
              <path d="M5 2v4h6V2M5 9h6"/>
            </svg>
          </button>
          <button title="Export DXF" className={styles.toolBtn} onClick={handleExportDXF}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 2v9M5 8l3 3 3-3"/>
              <path d="M2 12v2h12v-2"/>
            </svg>
          </button>
          <button title="Clear Canvas" className={styles.toolBtn} onClick={handleClearCanvas}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 4h10M6 4V2h4v2M5 4l.5 9h5l.5-9"/>
            </svg>
          </button>
        </div>

        <div className={styles.toolbarFlex} />

        {/* Mode indicators */}
        <div className={styles.toolGroup} style={{ borderRight: 'none' }}>
          <button className={`${styles.snapIndicator} ${snapEnabled ? styles.snapOn : styles.snapOff}`} onClick={handleToggleSnap}>
            <svg width="10" height="10" viewBox="0 0 10 10">
              <rect x="1" y="1" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="5" cy="5" r="1.5" fill="currentColor"/>
            </svg>
            SNAP
          </button>
          <button className={`${styles.orthoIndicator} ${orthoEnabled ? styles.orthoOn : styles.orthoOff}`} onClick={handleToggleOrtho}>
            <svg width="10" height="10" viewBox="0 0 10 10">
              <line x1="1" y1="9" x2="1" y2="1" stroke="currentColor" strokeWidth="1.5"/>
              <line x1="1" y1="9" x2="9" y2="9" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            ORTHO
          </button>
          <button className={styles.gridToggle} onClick={handleToggleGrid}>
            <svg width="10" height="10" viewBox="0 0 10 10">
              <line x1="0" y1="5" x2="10" y2="5" stroke="currentColor" strokeWidth="0.5"/>
              <line x1="5" y1="0" x2="5" y2="10" stroke="currentColor" strokeWidth="0.5"/>
            </svg>
            GRID
          </button>
        </div>
      </div>

      {/* ===== LEFT TOOL RAIL ===== */}
      <div className={styles.toolRail}>
        <button title="Select (V)" className={`${styles.railBtn} ${activeTool==='select' ? styles.railBtnActive : ''}`} onClick={() => setTool('select')}>
          <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 2l2 14 3-5 5-3z"/></svg>
        </button>
        <div className={styles.railDivider}/>
        <button title="Line (L)" className={`${styles.railBtn} ${activeTool==='line' ? styles.railBtnActive : ''}`} onClick={() => setTool('line')}>
          <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="3" y1="15" x2="15" y2="3"/><circle cx="3" cy="15" r="1.5" fill="currentColor"/><circle cx="15" cy="3" r="1.5" fill="currentColor"/></svg>
        </button>
        <button title="Polyline (PL)" className={`${styles.railBtn} ${activeTool==='polyline' ? styles.railBtnActive : ''}`} onClick={() => setTool('polyline')}>
          <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="3,15 7,5 11,11 15,3"/><circle cx="3" cy="15" r="1.5" fill="currentColor"/><circle cx="7" cy="5" r="1.5" fill="currentColor"/><circle cx="11" cy="11" r="1.5" fill="currentColor"/><circle cx="15" cy="3" r="1.5" fill="currentColor"/></svg>
        </button>
        <button title="Rectangle (R)" className={`${styles.railBtn} ${activeTool==='rect' ? styles.railBtnActive : ''}`} onClick={() => setTool('rect')}>
          <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="12" height="10" rx="0.5"/></svg>
        </button>
        <button title="Circle (C)" className={`${styles.railBtn} ${activeTool==='circle' ? styles.railBtnActive : ''}`} onClick={() => setTool('circle')}>
          <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="9" cy="9" r="6"/><circle cx="9" cy="9" r="1" fill="currentColor"/></svg>
        </button>
        <div className={styles.railDivider}/>
        <button title="Dimension (D)" className={`${styles.railBtn} ${activeTool==='dimension' ? styles.railBtnActive : ''}`} onClick={() => setTool('dimension')}>
          <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="3" y1="13" x2="15" y2="13"/><line x1="3" y1="10" x2="3" y2="16"/><line x1="15" y1="10" x2="15" y2="16"/>
          </svg>
        </button>
      </div>

      {/* ===== LEFT PANEL ===== */}
      <div className={styles.leftPanel}>
        <div className={styles.panelTabs}>
          {['layers','equipment','blocks'].map(tab => (
            <button key={tab}
              className={`${styles.panelTab} ${leftTab === tab ? styles.panelTabActive : ''}`}
              onClick={() => setLeftTab(tab)}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {leftTab === 'layers' && (
          <div className={styles.panelContent}>
            {LAYERS.map(layer => (
              <div key={layer.id}
                className={`${styles.layerItem} ${activeLayer === layer.id ? styles.layerItemActive : ''}`}
                onClick={() => handleLayerClick(layer.id)}>
                <div className={styles.layerColor} style={{ background: layer.color }}/>
                <span className={styles.layerName}>{layer.name}</span>
                <button className={`${styles.layerVis} ${!layerVisibility[layer.id] ? styles.layerVisHidden : ''}`}
                  onClick={(e) => handleToggleVisibility(layer.id, e)} title="Toggle visibility">
                  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <path d="M1 6s2-4 5-4 5 4 5 4-2 4-5 4-5-4-5-4z"/>
                    <circle cx="6" cy="6" r="1.5"/>
                  </svg>
                </button>
                <button className={`${styles.layerLock} ${layerLocked[layer.id] ? styles.layerLockLocked : ''}`}
                  onClick={(e) => handleToggleLock(layer.id, e)} title="Toggle lock">
                  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <rect x="2" y="5" width="8" height="6" rx="1"/><path d="M4 5V3a2 2 0 014 0v2"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {leftTab === 'equipment' && (
          <div className={styles.panelContent}>
            {[
              { title: 'Solar Panels',       items: [{ icon:'⬛', name:'REC Alpha Pure-R 430W', detail:'67.8" × 40.6" — Sys 1' }] },
              { title: 'Inverters / Micros', items: [{ icon:'⚡', name:'Enphase IQ8M-72', detail:'Microinverter — Sys 1' },
                                                      { icon:'⚡', name:'Enphase IQ Combiner 4C', detail:'Combiner Panel' }] },
              { title: 'Energy Storage',     items: [{ icon:'🔋', name:'Enphase IQ Battery 5P', detail:'5.0 kWh — Qty: 2' }] },
              { title: 'BOS Equipment',      items: [{ icon:'🔌', name:'AC Disconnect', detail:'60A — New' },
                                                      { icon:'📊', name:'Production Meter', detail:'APS Required' },
                                                      { icon:'⏚', name:'Ground Rod', detail:'8ft Copper — #6 AWG' }] },
              { title: 'Electrical Symbols', items: [{ icon:'◎', name:'Main Panel (MSP)', detail:'200A Bus / 200A MCB' },
                                                      { icon:'▣', name:'Sub Panel', detail:'125A Bus' },
                                                      { icon:'Ⓜ', name:'Utility Meter', detail:'APS — 200A Service' }] },
            ].map(cat => (
              <div key={cat.title} className={styles.equipCategory}>
                <div className={styles.equipCategoryTitle}>{cat.title}</div>
                {cat.items.map((item, i) => (
                  <div key={i} className={styles.equipItem} draggable>
                    <div className={styles.equipIcon}>{item.icon}</div>
                    <div className={styles.equipInfo}>
                      <div className={styles.equipName}>{item.name}</div>
                      <div className={styles.equipDetail}>{item.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {leftTab === 'blocks' && (
          <div className={styles.panelContent}>
            {[
              { title: 'Title Blocks',  items: [{ icon:'📋', name:'Skyfire Title Block', detail:'24×36 Standard' }] },
              { title: 'Common Details',items: [{ icon:'📐', name:'Roof Attachment Detail', detail:'Comp Shingle / Tile' },
                                                 { icon:'📐', name:'Conduit Penetration', detail:'Roof / Wall' },
                                                 { icon:'🔀', name:'String Diagram', detail:'Auto-generate' }] },
              { title: 'Compass',       items: [{ icon:'🧭', name:'North Arrow', detail:'Standard' },
                                                 { icon:'📏', name:'Scale Bar', detail:"1\" = 10'" }] },
            ].map(cat => (
              <div key={cat.title} className={styles.equipCategory}>
                <div className={styles.equipCategoryTitle}>{cat.title}</div>
                {cat.items.map((item, i) => (
                  <div key={i} className={styles.equipItem} draggable>
                    <div className={styles.equipIcon}>{item.icon}</div>
                    <div className={styles.equipInfo}>
                      <div className={styles.equipName}>{item.name}</div>
                      <div className={styles.equipDetail}>{item.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== CANVAS AREA ===== */}
      <div className={styles.canvasArea} ref={canvasAreaRef}>
        {/* Google Maps satellite layer */}
        <div ref={mapContainerRef} className={styles.mapLayer}/>

        {/* Drawing canvas */}
        <canvas ref={canvasRef} className={styles.canvasOverlay}/>

        {/* Hover tooltip */}
        {hoverTooltip && (
          <div className={styles.hoverTooltip} style={{ left: hoverTooltip.x, top: hoverTooltip.y }}>
            {hoverTooltip.text}
          </div>
        )}

        {/* Toast notification */}
        {toast && (
          <div className={`${styles.toast} ${styles[`toast_${toast.type}`]}`}>
            {toast.msg}
          </div>
        )}

        {/* Tool hint */}
        <div className={styles.canvasToolHint} dangerouslySetInnerHTML={{ __html: toolHint }}/>

        {/* Scale / zoom display */}
        <div className={styles.canvasZoomDisplay}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="5" cy="5" r="4"/><line x1="8" y1="8" x2="11" y2="11"/>
          </svg>
          <span className={styles.zoomVal}>Z{mapZoom}</span>
          {scaleLabel && <><span>|</span><span>{scaleLabel}</span></>}
        </div>

        {/* Coordinate display */}
        <div className={styles.canvasCoords}>
          <span><span className={styles.coordLabel}>E:</span> <span className={styles.coordVal}>{coordDisplay.x}</span></span>
          <span><span className={styles.coordLabel}>N:</span> <span className={styles.coordVal}>{coordDisplay.y}</span></span>
          <span><span className={styles.coordLabel}>Δ:</span> <span className={styles.coordVal}>{coordDisplay.delta}</span></span>
        </div>

        {/* Keyboard shortcuts overlay */}
        {showShortcuts && (
          <div className={styles.shortcutOverlay}>
            <div className={styles.shortcutTitle}>Keyboard Shortcuts</div>
            <div className={styles.shortcutGrid}>
              {[['V','Select'],['L','Line'],['R','Rectangle'],['C','Circle'],['D','Dimension'],
                ['F8','Toggle Ortho'],['F9','Toggle Snap'],['F7','Toggle Grid'],
                ['Esc','Cancel / Deselect'],['Ctrl+Z','Undo'],['Delete','Delete selected'],['?','Show shortcuts']
              ].map(([key, desc]) => (
                <React.Fragment key={key}>
                  <div className={styles.shortcutKey}><kbd>{key}</kbd></div>
                  <div className={styles.shortcutDesc}>{desc}</div>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* No-coords overlay */}
        {!hasCoords && !mapsError && (
          <div className={styles.noCoordsOverlay}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="1" fill="currentColor"/>
            </svg>
            <div>No coordinates available.</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Add a project address to enable aerial imagery.</div>
          </div>
        )}

        {/* Maps load error */}
        {mapsError && (
          <div className={styles.noCoordsOverlay}>
            <div style={{ color: 'var(--color-error)' }}>Failed to load Google Maps.</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Check API key configuration.</div>
          </div>
        )}
      </div>

      {/* ===== RIGHT PANEL ===== */}
      <div className={styles.rightPanel}>
        <div className={styles.propsHeader}>Properties</div>

        <div className={styles.propsSection}>
          <div className={styles.propsSectionTitle}>Selection</div>
          <div className={styles.selectionInfo}>{getSelectedDetail()}</div>
        </div>

        <div className={styles.propsSection}>
          <div className={styles.propsSectionTitle}>Appearance</div>
          <div className={styles.propsRow}>
            <span className={styles.propsLabel}>Layer</span>
            <select className={styles.propsSelect} value={activeLayer} onChange={e => handleLayerClick(e.target.value)}>
              {LAYERS.filter(l => l.id !== 'aerial').map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
          <div className={styles.propsRow}>
            <span className={styles.propsLabel}>Style</span>
            <select className={styles.propsSelect}>
              <option>Continuous</option><option>Dashed</option><option>Dashdot</option>
            </select>
          </div>
        </div>

        <div className={styles.propsHeader}>
          Objects <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({objects.length})</span>
        </div>
        <div className={styles.objectList}>
          {objects.length === 0 ? (
            <div className={styles.emptyObjects}>Draw on the canvas to see objects here</div>
          ) : (
            objects.map((obj, i) => (
              <div key={i}
                className={`${styles.objectItem} ${i === selectedIdx ? styles.objectItemSelected : ''}`}
                onClick={() => handleSelectObject(i)}>
                <span style={{ fontSize: 12, color: LAYER_COLORS[obj.layer] || '#9CA3AF' }}>
                  {OBJECT_ICONS[obj.type] || '?'}
                </span>
                <span className={styles.objectName}>
                  {OBJECT_NAMES[obj.type] || obj.type} {i + 1}
                  {obj.closed && <span className={styles.closedBadge}>closed</span>}
                </span>
                <span className={styles.objectLayer}>{obj.layer}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ===== STATUS BAR ===== */}
      <div className={styles.statusBar}>
        <div className={styles.commandPrompt}>
          <span className={styles.promptLabel}>Command:</span>
          <input ref={commandInputRef} className={styles.commandInput} type="text"
            placeholder="Type a command or press ? for help" spellCheck={false}/>
        </div>
        <div className={styles.statusItems}>
          <div className={styles.statusItem}>
            <div className={`${styles.statusDot} ${snapEnabled ? styles.statusDotGreen : ''}`}
              style={!snapEnabled ? { background: 'var(--text-muted)' } : {}}/>
            Snap: {snapEnabled ? 'ON' : 'OFF'}
          </div>
          <div className={styles.statusItem}>
            <div className={`${styles.statusDot} ${orthoEnabled ? styles.statusDotBlue : ''}`}
              style={!orthoEnabled ? { background: 'var(--text-muted)' } : {}}/>
            Ortho: {orthoEnabled ? 'ON' : 'OFF'}
          </div>
          <div className={styles.statusItem}>
            <div className={`${styles.statusDot} ${styles.statusDotYellow}`}/>
            Grid: 1m
          </div>
          {scaleLabel && <div className={styles.statusItem}>{scaleLabel}</div>}
          <div className={styles.statusItem}>Objects: {objects.length}</div>
          {/* Save status indicator */}
          <div
            className={`${styles.statusItem} ${styles.saveStatus}`}
            title={lastSavedAt ? `Last saved: ${new Date(lastSavedAt).toLocaleTimeString()}` : 'Not yet saved to server'}>
            <div className={`${styles.statusDot} ${
              saveStatus === 'saved'   ? styles.statusDotGreen  :
              saveStatus === 'saving'  ? styles.statusDotSaving :
              saveStatus === 'error'   ? styles.statusDotRed    :
              styles.statusDotYellow
            }`}/>
            {saveStatus === 'saved'   && 'Saved'}
            {saveStatus === 'saving'  && 'Saving…'}
            {saveStatus === 'unsaved' && 'Unsaved changes'}
            {saveStatus === 'error'   && (
              <>Save failed <button className={styles.retryBtn} onClick={() => saveNow()}>Retry</button></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkyfireCanvas;
