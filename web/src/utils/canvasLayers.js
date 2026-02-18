/**
 * canvasLayers.js — Layer definitions, ACI colors, and line type registry
 * matching Skyfire's AutoCAD template.
 */

// AutoCAD Color Index → Hex mapping (subset used by Skyfire)
export const ACI_COLORS = {
  1:  '#FF0000',  // Red
  2:  '#FFFF00',  // Yellow
  3:  '#00FF00',  // Green
  4:  '#00FFFF',  // Cyan
  5:  '#0000FF',  // Blue
  6:  '#FF00FF',  // Magenta
  7:  '#FFFFFF',  // White
  8:  '#808080',  // Gray
  9:  '#C0C0C0',  // Light gray
  30: '#FF7F00',  // Orange
};

// Full layer list matching Skyfire's AutoCAD template
export const DEFAULT_LAYERS = [
  { id: 'HOUSE',          name: 'HOUSE',         aciColor: 4,  lineType: 'continuous' },
  { id: 'MODULE',         name: 'MODULE',        aciColor: 2,  lineType: 'continuous' },
  { id: 'SOLAR PANELS',   name: 'SOLAR PANELS',  aciColor: 2,  lineType: 'continuous' },
  { id: 'EQUIPMENT',      name: 'EQUIPMENT',     aciColor: 7,  lineType: 'continuous' },
  { id: 'CONDUIT',        name: 'CONDUIT',       aciColor: 6,  lineType: 'continuous' },
  { id: 'TRENCH',         name: 'TRENCH',        aciColor: 5,  lineType: 'dashed'    },
  { id: 'OBSTRUCTION',    name: 'OBSTRUCTION',   aciColor: 3,  lineType: 'continuous' },
  { id: 'LANDSCAPING',    name: 'LANDSCAPING',   aciColor: 3,  lineType: 'continuous' },
  { id: 'FENCE',          name: 'FENCE',         aciColor: 4,  lineType: 'fence'     },
  { id: 'PROPERTY LINE',  name: 'PROPERTY LINE', aciColor: 4,  lineType: 'phantom'   },
  { id: 'FIRE SETBACK',   name: 'FIRE SETBACK',  aciColor: 1,  lineType: 'continuous' },
  { id: 'FIRE LINE',      name: 'FIRE LINE',     aciColor: 1,  lineType: 'dashed'    },
  { id: 'DRIVE LINE',     name: 'DRIVE LINE',    aciColor: 30, lineType: 'continuous' },
  { id: 'TRUSS/RAFTER',   name: 'TRUSS/RAFTER',  aciColor: 8,  lineType: 'continuous' },
  { id: 'DIMENSIONS',     name: 'DIMENSIONS',    aciColor: 7,  lineType: 'continuous' },
  { id: 'ANNOTATIONS',    name: 'ANNOTATIONS',   aciColor: 7,  lineType: 'continuous' },
];

/**
 * Line type definitions.
 * pattern: Canvas2D lineDash array (base scale = zoom 18).
 *          null = solid.
 * decoration: optional extra drawing mode (only 'notches' currently).
 */
export const LINE_TYPES = {
  continuous: { pattern: null },
  dashed:     { pattern: [12, 6] },
  phantom:    { pattern: [25, 5, 5, 5, 5, 5] }, // dash-dot-dot (property line)
  hidden:     { pattern: [8, 4] },
  fence: {
    pattern: null,        // solid base line
    decoration: 'notches',
    notchSpacing: 20,     // pixels at scale=1 between notches
    notchWidth:  2,       // pixels wide
    notchHeight: 10,      // pixels tall
  },
};

/** Resolve hex color for a layer by id. */
export function getLayerColor(layerId) {
  const layer = DEFAULT_LAYERS.find(l => l.id === layerId);
  return layer ? ACI_COLORS[layer.aciColor] : '#FFFFFF';
}

/** Resolve line type key for a layer by id. */
export function getLayerLineType(layerId) {
  const layer = DEFAULT_LAYERS.find(l => l.id === layerId);
  return layer ? layer.lineType : 'continuous';
}

/** ACI number for a layer (used by DXF export). */
export function getLayerACI(layerId) {
  const layer = DEFAULT_LAYERS.find(l => l.id === layerId);
  return layer ? layer.aciColor : 7;
}

/**
 * Compute the canvas2D lineDash array for a given lineType, scaled to
 * the current zoom level so patterns stay visually consistent.
 *
 * @param {string} lineType - key from LINE_TYPES
 * @param {number} zoom     - Google Maps zoom (e.g. 18–21)
 * @returns {number[]|null} - array for setLineDash, or null for solid
 */
export function scaledLineDash(lineType, zoom) {
  const def = LINE_TYPES[lineType];
  if (!def?.pattern) return null;
  const scale = Math.max(0.4, Math.min(3, zoom / 18));
  return def.pattern.map(v => v * scale);
}

/**
 * Draw fence notches along a series of screen-space points.
 * Notches are small perpendicular rectangles at regular intervals.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array<{x,y}>} screenPts - ordered screen pixel points
 * @param {string}       fillColor - fill color for notches
 * @param {number}       zoom
 */
export function drawFenceNotches(ctx, screenPts, fillColor, zoom) {
  const def = LINE_TYPES.fence;
  const scale = Math.max(0.4, Math.min(3, zoom / 18));
  const spacing = def.notchSpacing * scale;
  const nw = def.notchWidth  * scale;
  const nh = def.notchHeight * scale;

  ctx.save();
  ctx.fillStyle = fillColor;

  for (let i = 0; i < screenPts.length - 1; i++) {
    const p1 = screenPts[i];
    const p2 = screenPts[i + 1];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const segLen = Math.sqrt(dx * dx + dy * dy);
    if (segLen < 1) continue;

    const angle = Math.atan2(dy, dx);

    for (let dist = spacing / 2; dist < segLen; dist += spacing) {
      const t  = dist / segLen;
      const cx = p1.x + dx * t;
      const cy = p1.y + dy * t;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      // Draw notch perpendicular to the line
      ctx.fillRect(-nw / 2, -nh / 2, nw, nh);
      ctx.restore();
    }
  }

  ctx.restore();
}

/**
 * DXF LTYPE table entries for the non-continuous line types we use.
 * Returns a DXF string fragment to insert in the TABLES section.
 */
export function buildDxfLtypeTable() {
  const gc = (code, value) => `${code}\n${value}\n`;

  // We define DASHED and PHANTOM; CONTINUOUS is implicit in AutoCAD
  const ltypes = [
    {
      name: 'DASHED',
      description: '__ __ __ __ __',
      elements: [0.375, -0.1875],   // positive = dash, negative = gap (AutoCAD units = feet)
    },
    {
      name: 'PHANTOM',
      description: '__  .  .  __  .  .',
      elements: [0.625, -0.125, 0.0, -0.125, 0.0, -0.125],
    },
  ];

  let table =
    gc(0, 'TABLE') +
    gc(2, 'LTYPE') +
    gc(70, ltypes.length + 1); // +1 for CONTINUOUS

  // CONTINUOUS (required)
  table +=
    gc(0, 'LTYPE') +
    gc(2, 'CONTINUOUS') +
    gc(70, 0) +
    gc(3, 'Solid line') +
    gc(72, 65) +
    gc(73, 0) +
    gc(40, '0.0');

  for (const lt of ltypes) {
    table +=
      gc(0, 'LTYPE') +
      gc(2, lt.name) +
      gc(70, 0) +
      gc(3, lt.description) +
      gc(72, 65) +
      gc(73, lt.elements.length) +
      gc(40, lt.elements.reduce((s, v) => s + Math.abs(v), 0).toFixed(4));
    for (const v of lt.elements) {
      table += gc(49, v.toFixed(4)) + gc(74, 0);
    }
  }

  table += gc(0, 'ENDTAB');
  return table;
}

/** Map a LINE_TYPES key → AutoCAD ltype name for DXF. */
export function lineTypeToDxf(lineType) {
  const map = {
    continuous: 'CONTINUOUS',
    dashed:     'DASHED',
    phantom:    'PHANTOM',
    hidden:     'DASHED',   // close enough for DXF
    fence:      'CONTINUOUS',
  };
  return map[lineType] || 'CONTINUOUS';
}
