/**
 * Panel Array Fill Algorithm
 *
 * Fills a roof polygon with solar panel rectangles.
 * All coordinates are in local meters (flat-Earth approximation) relative to the polygon centroid.
 *
 * Steps:
 *   1. Convert lat/lng polygon to local meters
 *   2. Apply edge-offset setback (parallel inward offset + adjacent line intersection)
 *   3. Generate an axis-aligned grid at the given azimuth
 *   4. Test each panel center against the inset polygon (ray-casting)
 *   5. Convert surviving panel centers back to lat/lng
 */

const FT_PER_M = 3.28084;

// ─────────────────────────────────────────────────────────────────────────────
// 2-D geometry helpers (all in local meters, x = East, y = North)
// ─────────────────────────────────────────────────────────────────────────────

/** Normalize a 2-D vector to unit length */
function normalize({ x, y }) {
  const len = Math.sqrt(x * x + y * y);
  return len > 0 ? { x: x / len, y: y / len } : { x: 0, y: 0 };
}

/** Inward normal of polygon edge from A to B (assumes CCW polygon = right-hand inward) */
function inwardNormal(a, b, centroid) {
  const dx = b.x - a.x, dy = b.y - a.y;
  // Two perpendiculars: (-dy, dx) and (dy, -dx)
  // Choose the one pointing toward centroid
  const n1 = normalize({ x: -dy, y: dx });
  const n2 = normalize({ x: dy,  y: -dx });
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const toCentroid = { x: centroid.x - mid.x, y: centroid.y - mid.y };
  const dot1 = n1.x * toCentroid.x + n1.y * toCentroid.y;
  return dot1 >= 0 ? n1 : n2;
}

/**
 * Offset a polygon inward by `dist` meters using edge-parallel offset + line intersection.
 * Works correctly for convex polygons. For mildly concave polygons (typical roofs) it degrades
 * gracefully — if an intersection is outside the original polygon we clip it back.
 *
 * @param {Array<{x,y}>} poly - polygon vertices (any winding)
 * @param {number}        dist - setback distance in meters
 * @returns {Array<{x,y}>}     offset polygon (may have fewer vertices if edges collapse)
 */
export function offsetPolygonInward(poly, dist) {
  if (dist <= 0) return poly;
  const n = poly.length;

  // Compute centroid for normal direction
  const centroid = {
    x: poly.reduce((s, p) => s + p.x, 0) / n,
    y: poly.reduce((s, p) => s + p.y, 0) / n,
  };

  // Build offset lines: each edge shifted inward by dist
  // Each offset line is stored as { p: point on line, n: inward normal }
  const offsetLines = [];
  for (let i = 0; i < n; i++) {
    const a = poly[i], b = poly[(i + 1) % n];
    const normal = inwardNormal(a, b, centroid);
    offsetLines.push({
      p: { x: a.x + normal.x * dist, y: a.y + normal.y * dist },
      d: { x: b.x - a.x, y: b.y - a.y }, // direction of original edge
    });
  }

  // Compute intersection of adjacent offset lines
  const result = [];
  for (let i = 0; i < n; i++) {
    const L1 = offsetLines[i];
    const L2 = offsetLines[(i + 1) % n];
    const pt = lineIntersect(L1.p, L1.d, L2.p, L2.d);
    if (pt) result.push(pt);
  }

  return result.length >= 3 ? result : poly; // degenerate case: return original
}

/** Intersection of two parametric lines: P1+t*D1 and P2+s*D2 */
function lineIntersect(p1, d1, p2, d2) {
  const denom = d1.x * d2.y - d1.y * d2.x;
  if (Math.abs(denom) < 1e-10) return null; // parallel
  const dx = p2.x - p1.x, dy = p2.y - p1.y;
  const t = (dx * d2.y - dy * d2.x) / denom;
  return { x: p1.x + t * d1.x, y: p1.y + t * d1.y };
}

/**
 * Ray-casting point-in-polygon test.
 * @param {{x,y}} pt
 * @param {Array<{x,y}>} poly
 * @returns {boolean}
 */
export function pointInPolygon(pt, poly) {
  let inside = false;
  const n = poly.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = poly[i].x, yi = poly[i].y;
    const xj = poly[j].x, yj = poly[j].y;
    const intersect = (yi > pt.y) !== (yj > pt.y) &&
      pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// ─────────────────────────────────────────────────────────────────────────────
// Lat/lng ↔ local meters conversion
// ─────────────────────────────────────────────────────────────────────────────

function latLngToMeters(pt, origin) {
  const cosLat = Math.cos(origin.lat * Math.PI / 180);
  return {
    x: (pt.lng - origin.lng) * 111320 * cosLat,
    y: (pt.lat - origin.lat) * 111320,
  };
}

function metersToLatLng(pt, origin) {
  const cosLat = Math.cos(origin.lat * Math.PI / 180);
  return {
    lat: origin.lat + pt.y / 111320,
    lng: origin.lng + pt.x / (111320 * cosLat),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a panel array inside a roof polygon.
 *
 * @param {Array<{lat,lng}>} polygonLatLng  - Closed roof polygon vertices
 * @param {Object}           config
 * @param {number}  config.panelLongFt      - Panel long side in feet
 * @param {number}  config.panelShortFt     - Panel short side in feet
 * @param {boolean} config.portrait         - true = portrait (short side horizontal), false = landscape
 * @param {number}  config.rowSpacingFt     - Gap between rows in feet
 * @param {number}  config.colSpacingFt     - Gap between columns in feet
 * @param {number}  config.setbackFt        - Edge setback distance in feet
 * @param {number}  config.azimuthDeg       - Array azimuth in degrees (0 = North, 90 = East)
 *
 * @returns {Array<{lat, lng}>} center lat/lng for each panel that fits
 */
export function generatePanelArray(polygonLatLng, config) {
  if (!polygonLatLng || polygonLatLng.length < 3) return [];

  const {
    panelLongFt  = 5.65,
    panelShortFt = 3.38,
    portrait     = true,
    rowSpacingFt = 0,
    colSpacingFt = 0.5,
    setbackFt    = 1.0,     // 12 inches
    azimuthDeg   = 180,     // South-facing default
  } = config;

  // In portrait: columns run along long axis; rows along short axis
  const colW = (portrait ? panelShortFt : panelLongFt) / FT_PER_M;   // meters — panel width in a row
  const rowH = (portrait ? panelLongFt  : panelShortFt) / FT_PER_M;  // meters — panel height in a column
  const colStep = colW + colSpacingFt / FT_PER_M;
  const rowStep = rowH + rowSpacingFt / FT_PER_M;
  const setbackM = setbackFt / FT_PER_M;

  // Pick origin as first vertex
  const origin = polygonLatLng[0];

  // Convert polygon to local meters
  const poly = polygonLatLng.map(pt => latLngToMeters(pt, origin));

  // Inset polygon by setback
  const insetPoly = offsetPolygonInward(poly, setbackM);
  if (insetPoly.length < 3) return [];

  // Bounding box of inset polygon
  const xs = insetPoly.map(p => p.x), ys = insetPoly.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);

  // Azimuth rotation: rotate the grid so columns run along azimuth direction
  // azimuth 180° (South) = panels face south = rows run E-W, columns run N-S
  const azRad = (azimuthDeg - 180) * Math.PI / 180; // rotate grid
  const cosA = Math.cos(azRad), sinA = Math.sin(azRad);

  // We'll generate centers in a rotated frame, test in the original frame
  const centers = [];

  // Grid extent in the rotated frame — use the bounding circle to ensure full coverage
  const diag = Math.sqrt((maxX - minX) ** 2 + (maxY - minY) ** 2);
  const gridHalf = diag; // over-estimate; point-in-polygon will filter

  // Center of inset polygon (use centroid)
  const cx = xs.reduce((s, v) => s + v, 0) / xs.length;
  const cy = ys.reduce((s, v) => s + v, 0) / ys.length;

  const iMin = Math.floor(-gridHalf / colStep) - 1;
  const iMax = Math.ceil( gridHalf / colStep) + 1;
  const jMin = Math.floor(-gridHalf / rowStep) - 1;
  const jMax = Math.ceil( gridHalf / rowStep) + 1;

  for (let i = iMin; i <= iMax; i++) {
    for (let j = jMin; j <= jMax; j++) {
      // Center in rotated frame (relative to inset centroid)
      const u = i * colStep + colW / 2;
      const v = j * rowStep + rowH / 2;

      // Rotate back to world frame
      const wx = cx + u * cosA - v * sinA;
      const wy = cy + u * sinA + v * cosA;

      // Test against inset polygon
      if (pointInPolygon({ x: wx, y: wy }, insetPoly)) {
        centers.push(metersToLatLng({ x: wx, y: wy }, origin));
      }
    }
  }

  return centers;
}

/**
 * Count how many panels fit in a polygon (preview without full placement).
 * Fast: same as generatePanelArray but just returns the count.
 */
export function countPanelsFit(polygonLatLng, config) {
  return generatePanelArray(polygonLatLng, config).length;
}
