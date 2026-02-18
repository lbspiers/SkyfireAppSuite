import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './SkyfireCanvas.module.css';

// Layer definitions
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
  select:    'Click to select objects. <kbd>Delete</kbd> to remove.',
  line:      '<strong>Line</strong> — Click start point, click end point. <kbd>Esc</kbd> cancel.',
  polyline:  '<strong>Polyline</strong> — Click to add points. <kbd>Double-click</kbd> or <kbd>Right-click</kbd> to finish.',
  rect:      '<strong>Rectangle</strong> — Click corner, click opposite corner.',
  circle:    '<strong>Circle</strong> — Click center, click radius point.',
  dimension: '<strong>Dimension</strong> — Click start, click end to measure.',
  pan:       '<strong>Pan</strong> — Click and drag to pan. Also <kbd>Space</kbd>+drag.',
  text:      '<strong>Text</strong> — Click to place text (coming soon).',
  measure:   '<strong>Measure</strong> — Click two points to measure distance.',
};

function addDemoObjects(objects) {
  objects.push({ type: 'rect',      x: 200, y: 160, w: 350, h: 260, layer: 'roof',       lineStyle: 'solid' });
  objects.push({ type: 'rect',      x: 550, y: 220, w: 110, h: 180, layer: 'roof',       lineStyle: 'solid' });
  objects.push({ type: 'rect',      x: 240, y: 180, w: 160, h: 100, layer: 'panels',     lineStyle: 'solid' });
  objects.push({ type: 'rect',      x: 240, y: 300, w: 160, h:  80, layer: 'panels',     lineStyle: 'solid' });
  objects.push({ type: 'polyline',  points: [{x:320,y:280},{x:320,y:420},{x:560,y:420},{x:560,y:460}], layer: 'conduit',    lineStyle: 'dashed' });
  objects.push({ type: 'equipment', x: 580, y: 460, label: 'MSP', layer: 'equipment' });
  objects.push({ type: 'equipment', x: 620, y: 460, label: 'DIS', layer: 'equipment' });
  objects.push({ type: 'equipment', x: 660, y: 460, label: 'MTR', layer: 'equipment' });
  objects.push({ type: 'dimension', x1: 200, y1: 140, x2: 550, y2: 140, layer: 'dimensions', lineStyle: 'solid' });
}

const SkyfireCanvas = ({ projectUuid, projectData, lat, lng }) => {
  // ── UI State (drives toolbars/panels) ────────────────────────────────
  const [activeTool, setActiveTool]         = useState('line');
  const [activeLayer, setActiveLayer]       = useState('roof');
  const [leftTab, setLeftTab]               = useState('layers');
  const [snapEnabled, setSnapEnabled]       = useState(true);
  const [orthoEnabled, setOrthoEnabled]     = useState(true);
  const [gridEnabled, setGridEnabled]       = useState(true);
  const [layerVisibility, setLayerVisibility] = useState(() =>
    LAYERS.reduce((acc, l) => { acc[l.id] = true; return acc; }, {})
  );
  const [layerLocked, setLayerLocked]       = useState(() =>
    LAYERS.reduce((acc, l) => { acc[l.id] = l.locked; return acc; }, {})
  );
  const [zoom, setZoom]                     = useState(1);
  const [coordX, setCoordX]                 = useState('0.00\'');
  const [coordY, setCoordY]                 = useState('0.00\'');
  const [coordDelta, setCoordDelta]         = useState('—');
  const [objects, setObjects]               = useState([]);
  const [selectedIdx, setSelectedIdx]       = useState(null);
  const [showShortcuts, setShowShortcuts]   = useState(false);
  const [toolHint, setToolHint]             = useState(TOOL_HINTS.line);

  // ── Canvas Refs (performance-critical state) ──────────────────────────
  const canvasRef    = useRef(null);
  const canvasAreaRef = useRef(null);
  const stateRef     = useRef({
    tool: 'line',
    zoom: 1,
    panX: 0,
    panY: 0,
    isPanning: false,
    snapEnabled: true,
    orthoEnabled: true,
    gridEnabled: true,
    gridSize: 20,
    mouseX: 0,
    mouseY: 0,
    worldX: 0,
    worldY: 0,
    drawing: false,
    startX: 0,
    startY: 0,
    objects: [],
    selectedIdx: null,
    currentPolyline: null,
    activeLayer: 'roof',
    isSpacePanning: false,
  });
  const commandInputRef = useRef(null);

  // ── Coordinate Transforms ─────────────────────────────────────────────
  const screenToWorld = useCallback((sx, sy) => {
    const s = stateRef.current;
    return { x: (sx - s.panX) / s.zoom, y: (sy - s.panY) / s.zoom };
  }, []);

  const worldToScreen = useCallback((wx, wy) => {
    const s = stateRef.current;
    return { x: wx * s.zoom + s.panX, y: wy * s.zoom + s.panY };
  }, []);

  const snapToGrid = useCallback((x, y) => {
    if (!stateRef.current.snapEnabled) return { x, y };
    const g = stateRef.current.gridSize;
    return { x: Math.round(x / g) * g, y: Math.round(y / g) * g };
  }, []);

  const applyOrtho = useCallback((x1, y1, x2, y2) => {
    if (!stateRef.current.orthoEnabled) return { x: x2, y: y2 };
    const dx = Math.abs(x2 - x1), dy = Math.abs(y2 - y1);
    if (dx > dy) return { x: x2, y: y1 };
    return { x: x1, y: y2 };
  }, []);

  // ── Rendering ─────────────────────────────────────────────────────────
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const s = stateRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawAerialPlaceholder(ctx, s);
    if (s.gridEnabled) drawGrid(ctx, canvas, s);
    s.objects.forEach((obj, i) => drawObject(ctx, obj, i === s.selectedIdx, s));
    if (s.drawing) drawPreview(ctx, s);
    drawCrosshair(ctx, canvas, s);
    if (s.snapEnabled) drawSnapIndicator(ctx, s);
  }, []);

  function drawAerialPlaceholder(ctx, s) {
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#2a3a4a';
    const tl = wts(s, 100, 100), br = wts(s, 700, 500);
    ctx.fillRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#4a3a2a';
    const h1 = wts(s,200,160), h2 = wts(s,550,160), h3 = wts(s,550,420), h4 = wts(s,200,420);
    ctx.beginPath(); ctx.moveTo(h1.x,h1.y); ctx.lineTo(h2.x,h2.y); ctx.lineTo(h3.x,h3.y); ctx.lineTo(h4.x,h4.y); ctx.closePath(); ctx.fill();
    const g1 = wts(s,550,220), g2 = wts(s,660,220), g3 = wts(s,660,400), g4 = wts(s,550,400);
    ctx.beginPath(); ctx.moveTo(g1.x,g1.y); ctx.lineTo(g2.x,g2.y); ctx.lineTo(g3.x,g3.y); ctx.lineTo(g4.x,g4.y); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 0.3; ctx.fillStyle = '#fff';
    ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
    const center = wts(s, 400, 300);
    ctx.fillText('Aerial image loads from project data', center.x, center.y - 10);
    ctx.fillText('(Google Maps / Satellite)', center.x, center.y + 10);
    ctx.restore();
  }

  function wts(s, wx, wy) {
    return { x: wx * s.zoom + s.panX, y: wy * s.zoom + s.panY };
  }

  function stw(s, sx, sy) {
    return { x: (sx - s.panX) / s.zoom, y: (sy - s.panY) / s.zoom };
  }

  function drawGrid(ctx, canvas, s) {
    const g = s.gridSize;
    const start = stw(s, 0, 0), end = stw(s, canvas.width, canvas.height);
    const startX = Math.floor(start.x / g) * g, startY = Math.floor(start.y / g) * g;
    const endX = Math.ceil(end.x / g) * g, endY = Math.ceil(end.y / g) * g;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.03)'; ctx.lineWidth = 0.5;
    for (let x = startX; x <= endX; x += g) { const p = wts(s,x,0); ctx.beginPath(); ctx.moveTo(p.x,0); ctx.lineTo(p.x,canvas.height); ctx.stroke(); }
    for (let y = startY; y <= endY; y += g) { const p = wts(s,0,y); ctx.beginPath(); ctx.moveTo(0,p.y); ctx.lineTo(canvas.width,p.y); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 0.5;
    const mg = g * 5;
    const msx = Math.floor(start.x / mg) * mg, msy = Math.floor(start.y / mg) * mg;
    for (let x = msx; x <= endX; x += mg) { const p = wts(s,x,0); ctx.beginPath(); ctx.moveTo(p.x,0); ctx.lineTo(p.x,canvas.height); ctx.stroke(); }
    for (let y = msy; y <= endY; y += mg) { const p = wts(s,0,y); ctx.beginPath(); ctx.moveTo(0,p.y); ctx.lineTo(canvas.width,p.y); ctx.stroke(); }
    const origin = wts(s,0,0);
    ctx.strokeStyle = 'rgba(239,68,68,0.2)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(origin.x,0); ctx.lineTo(origin.x,canvas.height); ctx.stroke();
    ctx.strokeStyle = 'rgba(16,185,129,0.2)';
    ctx.beginPath(); ctx.moveTo(0,origin.y); ctx.lineTo(canvas.width,origin.y); ctx.stroke();
    ctx.restore();
  }

  function drawObject(ctx, obj, selected, s) {
    ctx.save();
    const color = selected ? '#FD7332' : (LAYER_COLORS[obj.layer] || '#9CA3AF');
    ctx.strokeStyle = color; ctx.lineWidth = selected ? 2 : 1.5;
    if (obj.lineStyle === 'dashed') ctx.setLineDash([8, 4]);
    else if (obj.lineStyle === 'dashdot') ctx.setLineDash([8, 3, 2, 3]);
    else ctx.setLineDash([]);

    switch (obj.type) {
      case 'line': {
        const sp = wts(s,obj.x1,obj.y1), ep = wts(s,obj.x2,obj.y2);
        ctx.beginPath(); ctx.moveTo(sp.x,sp.y); ctx.lineTo(ep.x,ep.y); ctx.stroke();
        if (selected) { drawHandle(ctx,sp.x,sp.y); drawHandle(ctx,ep.x,ep.y); }
        break;
      }
      case 'rect': {
        const sp = wts(s,obj.x,obj.y), ep = wts(s,obj.x+obj.w,obj.y+obj.h);
        ctx.strokeRect(sp.x,sp.y,ep.x-sp.x,ep.y-sp.y);
        if (selected) { drawHandle(ctx,sp.x,sp.y); drawHandle(ctx,ep.x,sp.y); drawHandle(ctx,ep.x,ep.y); drawHandle(ctx,sp.x,ep.y); }
        break;
      }
      case 'circle': {
        const cp = wts(s,obj.cx,obj.cy); const r = obj.r * s.zoom;
        ctx.beginPath(); ctx.arc(cp.x,cp.y,r,0,Math.PI*2); ctx.stroke();
        if (selected) { drawHandle(ctx,cp.x,cp.y); drawHandle(ctx,cp.x+r,cp.y); }
        break;
      }
      case 'polyline': {
        if (obj.points.length < 2) break;
        ctx.beginPath();
        const fp = wts(s,obj.points[0].x,obj.points[0].y); ctx.moveTo(fp.x,fp.y);
        for (let i = 1; i < obj.points.length; i++) { const p = wts(s,obj.points[i].x,obj.points[i].y); ctx.lineTo(p.x,p.y); }
        ctx.stroke();
        if (selected) { obj.points.forEach(p => { const sp = wts(s,p.x,p.y); drawHandle(ctx,sp.x,sp.y); }); }
        break;
      }
      case 'equipment': {
        const pos = wts(s,obj.x,obj.y); const size = 24 * s.zoom;
        ctx.fillStyle = 'rgba(139,92,246,0.15)';
        ctx.fillRect(pos.x-size/2,pos.y-size/2,size,size); ctx.strokeRect(pos.x-size/2,pos.y-size/2,size,size);
        ctx.fillStyle = color; ctx.font = `${10*s.zoom}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(obj.label||'EQ', pos.x, pos.y);
        if (selected) drawHandle(ctx, pos.x, pos.y);
        break;
      }
      case 'dimension': {
        const sp = wts(s,obj.x1,obj.y1), ep = wts(s,obj.x2,obj.y2);
        ctx.strokeStyle = '#EC4899'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(sp.x,sp.y); ctx.lineTo(ep.x,ep.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(sp.x,sp.y-8); ctx.lineTo(sp.x,sp.y+8); ctx.moveTo(ep.x,ep.y-8); ctx.lineTo(ep.x,ep.y+8); ctx.stroke();
        const dist = Math.sqrt((obj.x2-obj.x1)**2+(obj.y2-obj.y1)**2);
        const feet = (dist/20).toFixed(1);
        ctx.fillStyle='#EC4899'; ctx.font='bold 11px sans-serif'; ctx.textAlign='center'; ctx.setLineDash([]);
        ctx.fillText(`${feet}'`, (sp.x+ep.x)/2, (sp.y+ep.y)/2 - 8);
        break;
      }
      default: break;
    }
    ctx.restore();
  }

  function drawHandle(ctx, x, y) {
    ctx.fillStyle = '#FD7332'; ctx.fillRect(x-3,y-3,6,6);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(x-3,y-3,6,6);
  }

  function drawPreview(ctx, s) {
    ctx.save(); ctx.strokeStyle = 'rgba(253,115,50,0.7)'; ctx.lineWidth = 1; ctx.setLineDash([4,4]);
    let endWorld = snapToGrid(s.worldX, s.worldY);
    if (s.orthoEnabled && s.tool !== 'rect' && s.tool !== 'circle') {
      endWorld = applyOrtho(s.startX, s.startY, endWorld.x, endWorld.y);
    }
    const start = wts(s,s.startX,s.startY), end = wts(s,endWorld.x,endWorld.y);
    switch(s.tool) {
      case 'line':
      case 'dimension':
        ctx.beginPath(); ctx.moveTo(start.x,start.y); ctx.lineTo(end.x,end.y); ctx.stroke();
        const dist = Math.sqrt((endWorld.x-s.startX)**2+(endWorld.y-s.startY)**2);
        const feet = (dist/20).toFixed(1);
        ctx.fillStyle='rgba(253,115,50,0.9)'; ctx.font='bold 11px sans-serif'; ctx.textAlign='center'; ctx.setLineDash([]);
        ctx.fillText(`${feet}'`, (start.x+end.x)/2, (start.y+end.y)/2 - 12);
        break;
      case 'rect':
        ctx.strokeRect(start.x,start.y,end.x-start.x,end.y-start.y);
        break;
      case 'circle': {
        const r = Math.sqrt((end.x-start.x)**2+(end.y-start.y)**2);
        ctx.beginPath(); ctx.arc(start.x,start.y,r,0,Math.PI*2); ctx.stroke();
        break;
      }
      case 'polyline':
        if (s.currentPolyline && s.currentPolyline.length > 0) {
          ctx.beginPath();
          const fp = wts(s,s.currentPolyline[0].x,s.currentPolyline[0].y); ctx.moveTo(fp.x,fp.y);
          for (let i = 1; i < s.currentPolyline.length; i++) { const p = wts(s,s.currentPolyline[i].x,s.currentPolyline[i].y); ctx.lineTo(p.x,p.y); }
          ctx.lineTo(end.x,end.y); ctx.stroke();
        }
        break;
      default: break;
    }
    ctx.restore();
  }

  function drawCrosshair(ctx, canvas, s) {
    const snapped = snapToGrid(s.worldX, s.worldY);
    const pos = wts(s, snapped.x, snapped.y);
    ctx.save(); ctx.strokeStyle = 'rgba(253,115,50,0.3)'; ctx.lineWidth = 0.5; ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(pos.x-20,pos.y); ctx.lineTo(pos.x+20,pos.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pos.x,pos.y-20); ctx.lineTo(pos.x,pos.y+20); ctx.stroke();
    ctx.restore();
  }

  function drawSnapIndicator(ctx, s) {
    const snapped = snapToGrid(s.worldX, s.worldY);
    const pos = wts(s, snapped.x, snapped.y);
    const dist = Math.sqrt((pos.x - s.mouseX)**2 + (pos.y - s.mouseY)**2);
    if (dist < 15) {
      ctx.save(); ctx.strokeStyle = '#10B981'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(pos.x,pos.y-6); ctx.lineTo(pos.x+6,pos.y); ctx.lineTo(pos.x,pos.y+6); ctx.lineTo(pos.x-6,pos.y); ctx.closePath(); ctx.stroke();
      ctx.restore();
    }
  }

  // ── Hit Testing ───────────────────────────────────────────────────────
  function distToSegment(px,py,x1,y1,x2,y2) {
    const A=px-x1,B=py-y1,C=x2-x1,D=y2-y1;
    const dot=A*C+B*D, lenSq=C*C+D*D;
    let t = lenSq!==0 ? dot/lenSq : -1;
    t=Math.max(0,Math.min(1,t));
    const xx=x1+t*C, yy=y1+t*D;
    return Math.sqrt((px-xx)**2+(py-yy)**2);
  }

  function hitTest(obj, wx, wy, zoom) {
    const threshold = 8 / zoom;
    switch(obj.type) {
      case 'line': case 'dimension':
        return distToSegment(wx,wy,obj.x1,obj.y1,obj.x2,obj.y2) < threshold;
      case 'rect':
        return wx>=obj.x-threshold && wx<=obj.x+obj.w+threshold && wy>=obj.y-threshold && wy<=obj.y+obj.h+threshold;
      case 'circle': {
        const d=Math.sqrt((wx-obj.cx)**2+(wy-obj.cy)**2);
        return Math.abs(d-obj.r) < threshold;
      }
      case 'equipment':
        return Math.abs(wx-obj.x)<15 && Math.abs(wy-obj.y)<15;
      case 'polyline':
        for (let i=0;i<obj.points.length-1;i++) {
          if (distToSegment(wx,wy,obj.points[i].x,obj.points[i].y,obj.points[i+1].x,obj.points[i+1].y) < threshold) return true;
        }
        return false;
      default: return false;
    }
  }

  // ── Tool Switching ────────────────────────────────────────────────────
  const setTool = useCallback((tool) => {
    stateRef.current.tool = tool;
    stateRef.current.drawing = false;
    stateRef.current.currentPolyline = null;
    setActiveTool(tool);
    setToolHint(TOOL_HINTS[tool] || `<strong>${tool}</strong> tool active`);
    const canvas = canvasRef.current;
    if (canvas) canvas.style.cursor = tool === 'select' ? 'default' : tool === 'pan' ? 'grab' : 'crosshair';
    render();
  }, [render]);

  const handleCommand = useCallback((cmd) => {
    const c = cmd.trim().toLowerCase();
    const toolMap = { l:'line',line:'line',pl:'polyline',pline:'polyline',r:'rect',rec:'rect',c:'circle',circle:'circle',d:'dimension',dim:'dimension',dimlinear:'dimension',t:'text',text:'text',m:'move',move:'move',v:'select',select:'select' };
    if (toolMap[c]) setTool(toolMap[c]);
  }, [setTool]);

  // ── Canvas Resize ─────────────────────────────────────────────────────
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const area = canvasAreaRef.current;
    if (!canvas || !area) return;
    const rect = area.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    render();
  }, [render]);

  // ── Object list sync ──────────────────────────────────────────────────
  const syncObjects = useCallback(() => {
    setObjects([...stateRef.current.objects]);
    setSelectedIdx(stateRef.current.selectedIdx);
  }, []);

  // ── Mouse Event Handlers ──────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const s = stateRef.current;
      s.mouseX = e.clientX - rect.left;
      s.mouseY = e.clientY - rect.top;
      const world = stw(s, s.mouseX, s.mouseY);
      s.worldX = world.x; s.worldY = world.y;
      if (s.isPanning) { s.panX += e.movementX; s.panY += e.movementY; }
      const snapped = snapToGrid(s.worldX, s.worldY);
      setCoordX((snapped.x / 20).toFixed(2) + "'");
      setCoordY((snapped.y / 20).toFixed(2) + "'");
      if (s.drawing) {
        const dx = Math.abs(snapped.x - s.startX) / 20, dy = Math.abs(snapped.y - s.startY) / 20;
        setCoordDelta(Math.sqrt(dx*dx+dy*dy).toFixed(2) + "'");
      }
      render();
    };

    const onMouseDown = (e) => {
      const s = stateRef.current;
      if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
        s.isPanning = true; canvas.style.cursor = 'grabbing'; return;
      }
      if (e.button !== 0) return;
      const snapped = snapToGrid(s.worldX, s.worldY);

      if (s.tool === 'select') {
        s.selectedIdx = null;
        for (let i = s.objects.length - 1; i >= 0; i--) {
          if (hitTest(s.objects[i], s.worldX, s.worldY, s.zoom)) { s.selectedIdx = i; break; }
        }
        syncObjects(); render(); return;
      }

      if (s.tool === 'polyline') {
        if (!s.drawing) {
          s.drawing = true; s.currentPolyline = [{x:snapped.x,y:snapped.y}]; s.startX=snapped.x; s.startY=snapped.y;
        } else {
          let end = snapped;
          if (s.orthoEnabled) { const last = s.currentPolyline[s.currentPolyline.length-1]; end = applyOrtho(last.x,last.y,snapped.x,snapped.y); }
          s.currentPolyline.push({x:end.x,y:end.y}); s.startX=end.x; s.startY=end.y;
        }
        render(); return;
      }

      if (!s.drawing) {
        s.drawing = true; s.startX = snapped.x; s.startY = snapped.y;
      } else {
        let endPos = snapped;
        if (s.orthoEnabled && s.tool !== 'rect' && s.tool !== 'circle') {
          endPos = applyOrtho(s.startX, s.startY, snapped.x, snapped.y);
        }
        let newObj = null;
        switch(s.tool) {
          case 'line':      newObj = {type:'line',x1:s.startX,y1:s.startY,x2:endPos.x,y2:endPos.y,layer:s.activeLayer,lineStyle:'solid'}; break;
          case 'rect':      newObj = {type:'rect',x:s.startX,y:s.startY,w:endPos.x-s.startX,h:endPos.y-s.startY,layer:s.activeLayer,lineStyle:'solid'}; break;
          case 'circle':  { const r=Math.sqrt((endPos.x-s.startX)**2+(endPos.y-s.startY)**2); newObj={type:'circle',cx:s.startX,cy:s.startY,r,layer:s.activeLayer,lineStyle:'solid'}; break; }
          case 'dimension': newObj = {type:'dimension',x1:s.startX,y1:s.startY,x2:endPos.x,y2:endPos.y,layer:'dimensions',lineStyle:'solid'}; break;
          default: break;
        }
        if (newObj) { s.objects.push(newObj); }
        s.drawing = false; syncObjects(); render();
      }
    };

    const onMouseUp = (e) => {
      const s = stateRef.current;
      if (s.isPanning && !s.isSpacePanning) { s.isPanning = false; canvas.style.cursor = s.tool === 'select' ? 'default' : 'crosshair'; }
    };

    const onDblClick = (e) => {
      const s = stateRef.current;
      if (s.tool === 'polyline' && s.drawing && s.currentPolyline && s.currentPolyline.length >= 2) {
        s.objects.push({type:'polyline',points:[...s.currentPolyline],layer:s.activeLayer,lineStyle:'solid'});
        s.currentPolyline = null; s.drawing = false; syncObjects(); render();
      }
    };

    const onWheel = (e) => {
      e.preventDefault();
      const s = stateRef.current;
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const oldZoom = s.zoom;
      s.zoom = Math.max(0.1, Math.min(10, s.zoom * delta));
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      s.panX = mx - (mx - s.panX) * (s.zoom / oldZoom);
      s.panY = my - (my - s.panY) * (s.zoom / oldZoom);
      setZoom(Math.round(s.zoom * 100));
      render();
    };

    const onContextMenu = (e) => {
      e.preventDefault();
      const s = stateRef.current;
      if (s.drawing) {
        if (s.tool === 'polyline' && s.currentPolyline && s.currentPolyline.length >= 2) {
          s.objects.push({type:'polyline',points:[...s.currentPolyline],layer:s.activeLayer,lineStyle:'solid'});
          syncObjects();
        }
        s.drawing = false; s.currentPolyline = null; render();
      }
    };

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('dblclick', onDblClick);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('contextmenu', onContextMenu);
    return () => {
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('dblclick', onDblClick);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('contextmenu', onContextMenu);
    };
  }, [render, snapToGrid, applyOrtho, syncObjects]);

  // ── Keyboard Shortcuts ────────────────────────────────────────────────
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
      const s = stateRef.current;
      switch(e.key) {
        case 'Escape':
          s.drawing = false; s.currentPolyline = null; s.selectedIdx = null;
          syncObjects(); render(); break;
        case 'v': case 'V': setTool('select'); break;
        case 'l': case 'L': setTool('line'); break;
        case 'r': case 'R': setTool('rect'); break;
        case 'c': case 'C': setTool('circle'); break;
        case 'd': case 'D': setTool('dimension'); break;
        case 't': case 'T': setTool('text'); break;
        case 'm': case 'M': setTool('move'); break;
        case 'Delete': case 'Backspace':
          if (s.selectedIdx !== null) {
            s.objects.splice(s.selectedIdx, 1);
            s.selectedIdx = null; syncObjects(); render();
          }
          break;
        case 'z':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (s.objects.length > 0) { s.objects.pop(); s.selectedIdx = null; syncObjects(); render(); }
          }
          break;
        case 'F7': e.preventDefault();
          stateRef.current.gridEnabled = !stateRef.current.gridEnabled;
          setGridEnabled(g => !g); render(); break;
        case 'F8': e.preventDefault();
          stateRef.current.orthoEnabled = !stateRef.current.orthoEnabled;
          setOrthoEnabled(o => !o); render(); break;
        case 'F9': e.preventDefault();
          stateRef.current.snapEnabled = !stateRef.current.snapEnabled;
          setSnapEnabled(sn => !sn); render(); break;
        case '?': case '/':
          setShowShortcuts(v => !v); break;
        case ' ':
          if (!s.drawing) { s.isPanning = true; s.isSpacePanning = true; if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing'; }
          break;
        default: break;
      }
    };
    const onKeyUp = (e) => {
      if (e.key === ' ') {
        const s = stateRef.current;
        s.isPanning = false; s.isSpacePanning = false;
        if (canvasRef.current) canvasRef.current.style.cursor = s.tool === 'select' ? 'default' : 'crosshair';
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); };
  }, [setTool, handleCommand, render, syncObjects]);

  // ── Init ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const s = stateRef.current;
    addDemoObjects(s.objects);
    syncObjects();
    resizeCanvas();
    // center the drawing
    const canvas = canvasRef.current;
    if (canvas) { s.panX = canvas.width / 2 - 400; s.panY = canvas.height / 2 - 300; }
    render();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas, render, syncObjects]);

  // ── Handlers ─────────────────────────────────────────────────────────
  const handleToggleSnap = () => {
    const next = !stateRef.current.snapEnabled;
    stateRef.current.snapEnabled = next;
    setSnapEnabled(next);
  };
  const handleToggleOrtho = () => {
    const next = !stateRef.current.orthoEnabled;
    stateRef.current.orthoEnabled = next;
    setOrthoEnabled(next);
  };
  const handleToggleGrid = () => {
    const next = !stateRef.current.gridEnabled;
    stateRef.current.gridEnabled = next;
    setGridEnabled(next);
    render();
  };
  const handleLayerClick = (layerId) => {
    setActiveLayer(layerId);
    stateRef.current.activeLayer = layerId;
  };
  const handleToggleVisibility = (layerId, e) => {
    e.stopPropagation();
    setLayerVisibility(prev => ({ ...prev, [layerId]: !prev[layerId] }));
  };
  const handleToggleLock = (layerId, e) => {
    e.stopPropagation();
    setLayerLocked(prev => ({ ...prev, [layerId]: !prev[layerId] }));
  };
  const handleSelectObject = (idx) => {
    stateRef.current.selectedIdx = idx;
    stateRef.current.tool = 'select';
    setTool('select');
    syncObjects();
    render();
  };

  const OBJECT_ICONS = { line:'╱', rect:'▭', circle:'○', polyline:'⟋', dimension:'↔', equipment:'▣' };
  const OBJECT_NAMES = { line:'Line', rect:'Rectangle', circle:'Circle', polyline:'Polyline', dimension:'Dimension', equipment:'Equipment' };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className={styles.canvasRoot}>
      {/* ===== TOOLBAR ROW ===== */}
      <div className={styles.toolbarRow}>
        <div className={styles.toolGroup}>
          <span className={styles.toolGroupLabel}>Draw</span>
          {[
            { tool:'line',     tip:'Line (L)',      svg:<line x1="2" y1="14" x2="14" y2="2"/> },
            { tool:'polyline', tip:'Polyline (PL)', svg:<polyline points="2,14 6,4 10,10 14,2"/> },
            { tool:'rect',     tip:'Rectangle (R)', svg:<rect x="2" y="3" width="12" height="10" rx="0.5"/> },
            { tool:'circle',   tip:'Circle (C)',    svg:<circle cx="8" cy="8" r="6"/> },
          ].map(({tool, tip, svg}) => (
            <button key={tool} title={tip} className={`${styles.toolBtn} ${activeTool===tool ? styles.toolBtnActive : ''}`} onClick={() => setTool(tool)}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">{svg}</svg>
            </button>
          ))}
        </div>

        <div className={styles.toolGroup}>
          <span className={styles.toolGroupLabel}>Annotate</span>
          <button title="Dimension (D)" className={`${styles.toolBtn} ${activeTool==='dimension' ? styles.toolBtnActive : ''}`} onClick={() => setTool('dimension')}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="2" y1="12" x2="14" y2="12"/><line x1="2" y1="9" x2="2" y2="15"/><line x1="14" y1="9" x2="14" y2="15"/>
              <line x1="5" y1="12" x2="3" y2="10.5"/><line x1="5" y1="12" x2="3" y2="13.5"/>
              <line x1="11" y1="12" x2="13" y2="10.5"/><line x1="11" y1="12" x2="13" y2="13.5"/>
            </svg>
          </button>
          <button title="Text (T)" className={`${styles.toolBtn} ${activeTool==='text' ? styles.toolBtnActive : ''}`} onClick={() => setTool('text')}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="3" y1="3" x2="13" y2="3"/><line x1="8" y1="3" x2="8" y2="13"/><line x1="5" y1="13" x2="11" y2="13"/>
            </svg>
          </button>
        </div>

        <div className={styles.toolbarFlex} />

        <div className={styles.toolGroup} style={{ borderRight: 'none' }}>
          <button className={`${styles.snapIndicator} ${snapEnabled ? styles.snapOn : styles.snapOff}`} onClick={handleToggleSnap}>
            <svg width="10" height="10" viewBox="0 0 10 10"><rect x="1" y="1" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1.5"/><circle cx="5" cy="5" r="1.5" fill="currentColor"/></svg>
            SNAP
          </button>
          <button className={`${styles.orthoIndicator} ${orthoEnabled ? styles.orthoOn : styles.orthoOff}`} onClick={handleToggleOrtho}>
            <svg width="10" height="10" viewBox="0 0 10 10"><line x1="1" y1="9" x2="1" y2="1" stroke="currentColor" strokeWidth="1.5"/><line x1="1" y1="9" x2="9" y2="9" stroke="currentColor" strokeWidth="1.5"/></svg>
            ORTHO
          </button>
          <button className={styles.gridToggle} onClick={handleToggleGrid}>
            <svg width="10" height="10" viewBox="0 0 10 10"><line x1="0" y1="5" x2="10" y2="5" stroke="currentColor" strokeWidth="0.5"/><line x1="5" y1="0" x2="5" y2="10" stroke="currentColor" strokeWidth="0.5"/></svg>
            GRID
          </button>
        </div>
      </div>

      {/* ===== LEFT TOOL RAIL ===== */}
      <div className={styles.toolRail}>
        <button title="Select (V)" className={`${styles.railBtn} ${activeTool==='select' ? styles.railBtnActive : ''}`} onClick={() => setTool('select')}>
          <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 2l2 14 3-5 5-3z"/></svg>
        </button>
        <button title="Pan (H)" className={`${styles.railBtn} ${activeTool==='pan' ? styles.railBtnActive : ''}`} onClick={() => setTool('pan')}>
          <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 2v14M2 9h14M5 5l4-3 4 3M5 13l4 3 4-3M5 5l-3 4 3 4M13 5l3 4-3 4"/></svg>
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
        <button title="Text (T)" className={`${styles.railBtn} ${activeTool==='text' ? styles.railBtnActive : ''}`} onClick={() => setTool('text')}>
          <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="4" y1="4" x2="14" y2="4"/><line x1="9" y1="4" x2="9" y2="14"/><line x1="6" y1="14" x2="12" y2="14"/></svg>
        </button>
      </div>

      {/* ===== LEFT PANEL ===== */}
      <div className={styles.leftPanel}>
        <div className={styles.panelTabs}>
          {['layers','equipment','blocks'].map(tab => (
            <button key={tab} className={`${styles.panelTab} ${leftTab===tab ? styles.panelTabActive : ''}`} onClick={() => setLeftTab(tab)}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {leftTab === 'layers' && (
          <div className={styles.panelContent}>
            {LAYERS.map(layer => (
              <div
                key={layer.id}
                className={`${styles.layerItem} ${activeLayer===layer.id ? styles.layerItemActive : ''}`}
                onClick={() => handleLayerClick(layer.id)}
              >
                <div className={styles.layerColor} style={{ background: layer.color }} />
                <span className={styles.layerName}>{layer.name}</span>
                <button className={`${styles.layerVis} ${!layerVisibility[layer.id] ? styles.layerVisHidden : ''}`} onClick={(e) => handleToggleVisibility(layer.id, e)} title="Toggle visibility">
                  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M1 6s2-4 5-4 5 4 5 4-2 4-5 4-5-4-5-4z"/><circle cx="6" cy="6" r="1.5"/></svg>
                </button>
                <button className={`${styles.layerLock} ${layerLocked[layer.id] ? styles.layerLockLocked : ''}`} onClick={(e) => handleToggleLock(layer.id, e)} title="Toggle lock">
                  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="2" y="5" width="8" height="6" rx="1"/><path d="M4 5V3a2 2 0 014 0v2"/></svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {leftTab === 'equipment' && (
          <div className={styles.panelContent}>
            {[
              { title: 'Solar Panels', items: [{ icon: '⬛', name: 'REC Alpha Pure-R 430W', detail: '67.8" × 40.6" — Sys 1' }] },
              { title: 'Inverters / Micros', items: [{ icon: '⚡', name: 'Enphase IQ8M-72', detail: 'Microinverter — Sys 1' }, { icon: '⚡', name: 'Enphase IQ Combiner 4C', detail: 'Combiner Panel' }] },
              { title: 'Energy Storage', items: [{ icon: '🔋', name: 'Enphase IQ Battery 5P', detail: '5.0 kWh — Qty: 2' }] },
              { title: 'BOS Equipment', items: [{ icon: '🔌', name: 'AC Disconnect', detail: '60A — New' }, { icon: '📊', name: 'Production Meter', detail: 'APS Required' }, { icon: '⏚', name: 'Ground Rod', detail: '8ft Copper — #6 AWG' }, { icon: '📦', name: 'Junction Box', detail: 'Exterior Rated' }] },
              { title: 'Electrical Symbols', items: [{ icon: '◎', name: 'Main Panel (MSP)', detail: '200A Bus / 200A MCB' }, { icon: '▣', name: 'Sub Panel', detail: '125A Bus' }, { icon: 'Ⓜ', name: 'Utility Meter', detail: 'APS — 200A Service' }] },
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
              { title: 'Title Blocks', items: [{ icon: '📋', name: 'Skyfire Title Block', detail: '24×36 Standard' }] },
              { title: 'Common Details', items: [{ icon: '📐', name: 'Roof Attachment Detail', detail: 'Comp Shingle / Tile' }, { icon: '📐', name: 'Conduit Penetration', detail: 'Roof / Wall' }, { icon: '📐', name: 'Grounding Detail', detail: 'Standard' }, { icon: '🔀', name: 'String Diagram', detail: 'Auto-generate' }] },
              { title: 'Compass / Annotations', items: [{ icon: '🧭', name: 'North Arrow', detail: 'Standard' }, { icon: '📏', name: 'Scale Bar', detail: '1" = 10\'' }] },
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
        <canvas ref={canvasRef} className={styles.drawingCanvas} />

        <div className={styles.canvasToolHint} dangerouslySetInnerHTML={{ __html: toolHint }} />

        <div className={styles.canvasZoomDisplay}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="5" cy="5" r="4"/><line x1="8" y1="8" x2="11" y2="11"/></svg>
          <span className={styles.zoomVal}>{zoom}%</span>
          <span>|</span>
          <span>Scale: 1" = 10'</span>
        </div>

        <div className={styles.canvasCoords}>
          <span><span className={styles.coordLabel}>X:</span> <span className={styles.coordVal}>{coordX}</span></span>
          <span><span className={styles.coordLabel}>Y:</span> <span className={styles.coordVal}>{coordY}</span></span>
          <span><span className={styles.coordLabel}>Δ:</span> <span className={styles.coordVal}>{coordDelta}</span></span>
        </div>

        {showShortcuts && (
          <div className={styles.shortcutOverlay}>
            <div className={styles.shortcutTitle}>Keyboard Shortcuts</div>
            <div className={styles.shortcutGrid}>
              {[['V','Select'],['L','Line'],['PL','Polyline'],['R','Rectangle'],['C','Circle'],['D','Dimension'],['T','Text'],['F8','Toggle Ortho'],['F9','Toggle Snap'],['F7','Toggle Grid'],['Space','Pan (hold)'],['Scroll','Zoom'],['Esc','Cancel / Deselect'],['Ctrl+Z','Undo'],['?','Show shortcuts']].map(([key, desc]) => (
                <React.Fragment key={key}>
                  <div className={styles.shortcutKey}><kbd>{key}</kbd></div>
                  <div className={styles.shortcutDesc}>{desc}</div>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ===== RIGHT PANEL ===== */}
      <div className={styles.rightPanel}>
        <div className={styles.propsHeader}>Properties</div>

        <div className={styles.propsSection}>
          <div className={styles.propsSectionTitle}>Selection</div>
          <div className={styles.selectionInfo}>
            {selectedIdx !== null && stateRef.current.objects[selectedIdx]
              ? `${OBJECT_NAMES[stateRef.current.objects[selectedIdx].type] || stateRef.current.objects[selectedIdx].type} on layer: ${stateRef.current.objects[selectedIdx].layer}`
              : 'No objects selected'}
          </div>
        </div>

        <div className={styles.propsSection}>
          <div className={styles.propsSectionTitle}>Appearance</div>
          <div className={styles.propsRow}>
            <span className={styles.propsLabel}>Layer</span>
            <select className={styles.propsSelect} value={activeLayer} onChange={e => handleLayerClick(e.target.value)}>
              {LAYERS.filter(l => l.id !== 'aerial').map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
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
              <div
                key={i}
                className={`${styles.objectItem} ${i === selectedIdx ? styles.objectItemSelected : ''}`}
                onClick={() => handleSelectObject(i)}
              >
                <span style={{ fontSize: 12, color: LAYER_COLORS[obj.layer] || '#9CA3AF' }}>
                  {OBJECT_ICONS[obj.type] || '?'}
                </span>
                <span className={styles.objectName}>{OBJECT_NAMES[obj.type] || obj.type} {i + 1}</span>
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
          <input
            ref={commandInputRef}
            className={styles.commandInput}
            type="text"
            placeholder="Type a command or press ? for help"
            spellCheck={false}
          />
        </div>
        <div className={styles.statusItems}>
          <div className={styles.statusItem}>
            <div className={`${styles.statusDot} ${snapEnabled ? styles.statusDotGreen : ''}`} style={!snapEnabled ? {background:'var(--text-muted)'} : {}} />
            Snap: {snapEnabled ? 'ON' : 'OFF'}
          </div>
          <div className={styles.statusItem}>
            <div className={`${styles.statusDot} ${orthoEnabled ? styles.statusDotBlue : ''}`} style={!orthoEnabled ? {background:'var(--text-muted)'} : {}} />
            Ortho: {orthoEnabled ? 'ON' : 'OFF'}
          </div>
          <div className={styles.statusItem}>
            <div className={`${styles.statusDot} ${styles.statusDotYellow}`} />
            Grid: 12"
          </div>
          <div className={styles.statusItem}>Objects: {objects.length}</div>
          <div className={styles.statusItem}>Scale: 1" = 10'</div>
        </div>
      </div>
    </div>
  );
};

export default SkyfireCanvas;
