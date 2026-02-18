/**
 * DXF Exporter — client-side DXF generation from SkyfireCanvas objects.
 *
 * Coordinate system:
 *   origin = { lat, lng } (property center)
 *   x = (lng - originLng) * 111320 * cos(originLat) * FT_PER_M  (East, in feet)
 *   y = (lat - originLat) * 111320 * FT_PER_M                    (North, in feet)
 *
 * AutoCAD Color Index (ACI) for layers:
 *   roof=30 (orange), panels=5 (blue), conduit=3 (green),
 *   equipment=6 (magenta), dimensions=1 (red), labels=4 (cyan), property=8 (gray)
 */

const FT_PER_M = 3.28084;

const LAYER_ACI = {
  roof:       30,
  panels:      5,
  conduit:     3,
  equipment:   6,
  dimensions:  1,
  labels:      4,
  property:    8,
  aerial:      8,
};

/** Convert a { lat, lng } point to DXF feet relative to origin */
function toDxfXY(pt, origin) {
  const cosLat = Math.cos(origin.lat * Math.PI / 180);
  const x = (pt.lng - origin.lng) * 111320 * cosLat * FT_PER_M;
  const y = (pt.lat - origin.lat) * 111320 * FT_PER_M;
  return { x, y };
}

/** Haversine distance in feet */
function haverineFt(a, b) {
  const R = 6371000;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const c = sinLat * sinLat +
    Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * sinLng * sinLng;
  return R * 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c)) * FT_PER_M;
}

/** DXF group code pair */
const gc = (code, value) => `${code}\n${value}\n`;

// ─────────────────────────────────────────────────────────────────
// HEADER section
// ─────────────────────────────────────────────────────────────────
function buildHeader() {
  return (
    gc(0, 'SECTION') +
    gc(2, 'HEADER') +
    gc(9, '$ACADVER') + gc(1, 'AC1015') +        // AutoCAD 2000+
    gc(9, '$INSUNITS') + gc(70, 2) +              // 2 = feet
    gc(9, '$MEASUREMENT') + gc(70, 0) +           // 0 = English
    gc(9, '$EXTMIN') + gc(10, '-100') + gc(20, '-100') + gc(30, '0') +
    gc(9, '$EXTMAX') + gc(10, '100')  + gc(20, '100')  + gc(30, '0') +
    gc(0, 'ENDSEC')
  );
}

// ─────────────────────────────────────────────────────────────────
// TABLES section (just layer definitions)
// ─────────────────────────────────────────────────────────────────
function buildTables(layers) {
  let table =
    gc(0, 'SECTION') +
    gc(2, 'TABLES') +
    gc(0, 'TABLE') +
    gc(2, 'LAYER') +
    gc(70, layers.length);

  for (const layer of layers) {
    table +=
      gc(0, 'LAYER') +
      gc(2, layer.name) +
      gc(70, 0) +                                 // layer flags (0 = normal)
      gc(62, LAYER_ACI[layer.id] ?? 7) +           // ACI color
      gc(6, 'CONTINUOUS');                         // linetype
  }

  table +=
    gc(0, 'ENDTAB') +
    gc(0, 'ENDSEC');

  return table;
}

// ─────────────────────────────────────────────────────────────────
// ENTITIES helpers
// ─────────────────────────────────────────────────────────────────

function entityLine(p1, p2, layerName, aci) {
  return (
    gc(0, 'LINE') +
    gc(8, layerName) +
    gc(62, aci) +
    gc(10, p1.x.toFixed(4)) + gc(20, p1.y.toFixed(4)) + gc(30, '0') +
    gc(11, p2.x.toFixed(4)) + gc(21, p2.y.toFixed(4)) + gc(31, '0')
  );
}

function entityLwPolyline(pts, closed, layerName, aci) {
  const flags = closed ? 1 : 0;
  let e =
    gc(0, 'LWPOLYLINE') +
    gc(8, layerName) +
    gc(62, aci) +
    gc(90, pts.length) +   // vertex count
    gc(70, flags);         // 1 = closed
  for (const pt of pts) {
    e += gc(10, pt.x.toFixed(4)) + gc(20, pt.y.toFixed(4));
  }
  return e;
}

function entityCircle(center, radiusFt, layerName, aci) {
  return (
    gc(0, 'CIRCLE') +
    gc(8, layerName) +
    gc(62, aci) +
    gc(10, center.x.toFixed(4)) + gc(20, center.y.toFixed(4)) + gc(30, '0') +
    gc(40, radiusFt.toFixed(4))
  );
}

function entityText(pos, text, height, layerName, aci) {
  return (
    gc(0, 'TEXT') +
    gc(8, layerName) +
    gc(62, aci) +
    gc(10, pos.x.toFixed(4)) + gc(20, pos.y.toFixed(4)) + gc(30, '0') +
    gc(40, height.toFixed(4)) +
    gc(1, text)
  );
}

function entityMtext(pos, text, height, layerName, aci) {
  return (
    gc(0, 'MTEXT') +
    gc(8, layerName) +
    gc(62, aci) +
    gc(10, pos.x.toFixed(4)) + gc(20, pos.y.toFixed(4)) + gc(30, '0') +
    gc(40, height.toFixed(4)) +  // text height
    gc(41, '24') +               // reference rectangle width (24ft)
    gc(1, text)
  );
}

// ─────────────────────────────────────────────────────────────────
// Main export function
// ─────────────────────────────────────────────────────────────────

/**
 * exportToDXF — generate a DXF string from canvas objects.
 *
 * @param {Array}  objects   - drawRef.current.objects array
 * @param {Array}  layers    - LAYERS constant from SkyfireCanvas
 * @param {Object} origin    - { lat, lng } of the property center
 * @returns {string}  DXF file content
 */
export function exportToDXF(objects, layers, origin) {
  if (!origin) throw new Error('Origin (lat/lng) required for DXF export');

  // Build entities section
  let entities = gc(0, 'SECTION') + gc(2, 'ENTITIES');

  for (const obj of objects) {
    const layerName = obj.layer || 'labels';
    const aci = LAYER_ACI[layerName] ?? 7;

    switch (obj.type) {
      case 'line': {
        const p1 = toDxfXY(obj.p1, origin);
        const p2 = toDxfXY(obj.p2, origin);
        entities += entityLine(p1, p2, layerName, aci);
        break;
      }

      case 'rect': {
        const nw = toDxfXY(obj.nw, origin);
        const ne = toDxfXY(obj.ne, origin);
        const se = toDxfXY(obj.se, origin);
        const sw = toDxfXY(obj.sw, origin);
        entities += entityLwPolyline([nw, ne, se, sw], true, layerName, aci);
        break;
      }

      case 'circle': {
        const center = toDxfXY(obj.center, origin);
        const radiusFt = haverineFt(obj.center, obj.edge);
        entities += entityCircle(center, radiusFt, layerName, aci);
        break;
      }

      case 'polyline': {
        if (!obj.points || obj.points.length < 2) break;
        const pts = obj.points.map(pt => toDxfXY(pt, origin));
        entities += entityLwPolyline(pts, !!obj.closed, layerName, aci);
        break;
      }

      case 'dimension': {
        // Draw line + tick marks + text
        const p1 = toDxfXY(obj.p1, origin);
        const p2 = toDxfXY(obj.p2, origin);
        entities += entityLine(p1, p2, 'dimensions', LAYER_ACI.dimensions);
        // Tick marks (perpendicular to line, ±0.5ft)
        const dx = p2.x - p1.x, dy = p2.y - p1.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const nx = -dy / len * 0.5, ny = dx / len * 0.5;
        entities += entityLine(
          { x: p1.x - nx, y: p1.y - ny },
          { x: p1.x + nx, y: p1.y + ny },
          'dimensions', LAYER_ACI.dimensions
        );
        entities += entityLine(
          { x: p2.x - nx, y: p2.y - ny },
          { x: p2.x + nx, y: p2.y + ny },
          'dimensions', LAYER_ACI.dimensions
        );
        // Label at midpoint, slightly offset
        const distFt = haverineFt(obj.p1, obj.p2);
        const mid = { x: (p1.x + p2.x) / 2 + nx * 2, y: (p1.y + p2.y) / 2 + ny * 2 };
        entities += entityText(mid, `${distFt.toFixed(1)}'`, 0.75, 'dimensions', LAYER_ACI.dimensions);
        break;
      }

      case 'equipment': {
        const pos = toDxfXY(obj.pos, origin);
        // Equipment as a small square (2ft × 2ft) + label
        const hs = 1.0; // half-size in feet
        entities += entityLwPolyline(
          [{ x: pos.x - hs, y: pos.y - hs }, { x: pos.x + hs, y: pos.y - hs },
           { x: pos.x + hs, y: pos.y + hs }, { x: pos.x - hs, y: pos.y + hs }],
          true, 'equipment', LAYER_ACI.equipment
        );
        if (obj.label) {
          entities += entityText({ x: pos.x, y: pos.y }, obj.label, 0.6, 'equipment', LAYER_ACI.equipment);
        }
        break;
      }

      default: break;
    }
  }

  entities += gc(0, 'ENDSEC');

  // Combine all sections
  return (
    buildHeader() +
    buildTables(layers.filter(l => l.id !== 'aerial')) +
    entities +
    gc(0, 'EOF')
  );
}

/**
 * downloadDXF — trigger a browser download of the DXF string.
 * @param {string} dxfContent
 * @param {string} filename
 */
export function downloadDXF(dxfContent, filename = 'skyfire-site-plan.dxf') {
  const blob = new Blob([dxfContent], { type: 'application/dxf' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
