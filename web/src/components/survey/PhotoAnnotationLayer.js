import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import * as fabric from 'fabric';
import logger from '../../services/devLogger';
import styles from './PhotoAnnotationLayer.module.css';

/**
 * PhotoAnnotationLayer - Fabric.js canvas overlay for photo annotations
 *
 * Based on PdfAnnotationLayer but simplified for single images
 * - No page tracking needed (single image)
 * - Canvas sized to image dimensions
 * - Tools: select, text, arrow, line, square, circle, leader line, revision cloud
 */
const PhotoAnnotationLayer = forwardRef(({
  isActive = false,
  currentTool = 'select',
  currentColor = '#DC2626',
  annotations = [],
  onAnnotationsChange,
  onToolChange,
}, ref) => {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const drawingObjectRef = useRef(null);
  const startPointRef = useRef({ x: 0, y: 0 });
  const historyRef = useRef([]);
  const historyStepRef = useRef(0);

  // Tool-specific state refs
  const arrowPartsRef = useRef({ line: null, triangle: null });
  const lineStateRef = useRef({ startX: 0, startY: 0, tempLine: null });
  const squareStateRef = useRef({ startX: 0, startY: 0, tempRect: null });
  const circleStateRef = useRef({ startX: 0, startY: 0, tempCircle: null });
  const cloudStartRef = useRef({ x: 0, y: 0 });
  const leaderStateRef = useRef({
    startX: 0,
    startY: 0,
    color: '#DC2626',
    tempLine: null,
    tempArrowhead: null,
    tempTextbox: null
  });

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current || fabricCanvasRef.current || !isActive) {
      logger.debug('PhotoAnnotationLayer', 'Canvas init skipped:', {
        hasCanvasRef: !!canvasRef.current,
        hasFabricCanvas: !!fabricCanvasRef.current,
        isActive
      });
      return;
    }

    logger.log('PhotoAnnotationLayer', 'Initializing canvas...');

    let resizeHandler = null;

    const initTimeout = setTimeout(() => {
      const canvasElement = canvasRef.current;
      if (!canvasElement) {
        logger.warn('PhotoAnnotationLayer', 'Canvas element not found');
        return;
      }

      const container = canvasElement.parentElement;
      if (!container) {
        logger.warn('PhotoAnnotationLayer', 'Container not found');
        return;
      }

      logger.log('PhotoAnnotationLayer', 'Creating Fabric canvas:', {
        width: container.offsetWidth,
        height: container.offsetHeight
      });

      const canvas = new fabric.Canvas(canvasElement, {
        isDrawingMode: false,
        selection: currentTool === 'select',
        backgroundColor: 'transparent',
        renderOnAddRemove: true,
        enableRetinaScaling: true,
        width: container.offsetWidth,
        height: container.offsetHeight
      });

      fabricCanvasRef.current = canvas;

      // Initialize history with empty canvas state
      const initialState = canvas.toJSON();
      historyRef.current = [initialState];
      historyStepRef.current = 0;

      logger.log('PhotoAnnotationLayer', 'Canvas initialized successfully');

      // Handle canvas resize
      resizeHandler = () => {
        if (fabricCanvasRef.current && canvasRef.current?.parentElement) {
          try {
            const rect = canvasRef.current.parentElement.getBoundingClientRect();
            fabricCanvasRef.current.setDimensions({
              width: rect.width,
              height: rect.height
            });
            fabricCanvasRef.current.renderAll();
          } catch (err) {
            logger.error('PhotoAnnotationLayer', 'Resize error:', err);
          }
        }
      };

      window.addEventListener('resize', resizeHandler);
      canvas.renderAll();
    }, 100);

    return () => {
      clearTimeout(initTimeout);
      if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler);
      }
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, [isActive]);

  // Update tool mode
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const isSelectMode = currentTool === 'select';
    canvas.selection = isSelectMode;
    canvas.isDrawingMode = false;

    canvas.forEachObject((obj) => {
      obj.selectable = isSelectMode;
      obj.evented = isSelectMode;
      obj.hoverCursor = isSelectMode ? 'move' : 'default';
    });

    canvas.defaultCursor = isSelectMode ? 'default' : 'crosshair';
    canvas.hoverCursor = isSelectMode ? 'move' : 'crosshair';

    canvas.renderAll();
  }, [currentTool]);

  // Save to history
  const saveHistory = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const json = canvas.toJSON();
    historyRef.current = historyRef.current.slice(0, historyStepRef.current + 1);
    historyRef.current.push(json);
    historyStepRef.current++;

    if (onAnnotationsChange) {
      onAnnotationsChange(canvas.getObjects());
    }
  };

  // Undo
  const undo = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || historyStepRef.current <= 0) return;

    historyStepRef.current--;
    const previousState = historyRef.current[historyStepRef.current];

    canvas.loadFromJSON(previousState, () => {
      canvas.renderAll();
      if (onAnnotationsChange) {
        onAnnotationsChange(canvas.getObjects());
      }
    });
  };

  // Redo
  const redo = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || historyStepRef.current >= historyRef.current.length - 1) return;

    historyStepRef.current++;
    const nextState = historyRef.current[historyStepRef.current];

    canvas.loadFromJSON(nextState, () => {
      canvas.renderAll();
      if (onAnnotationsChange) {
        onAnnotationsChange(canvas.getObjects());
      }
    });
  };

  // Delete selected
  const deleteSelected = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length > 0) {
      activeObjects.forEach(obj => canvas.remove(obj));
      canvas.discardActiveObject();
      canvas.renderAll();
      saveHistory();
    }
  };

  // Handle drawing events based on current tool
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !isActive) {
      logger.debug('PhotoAnnotationLayer', 'Event handler attachment skipped:', { hasCanvas: !!canvas, isActive });
      return;
    }

    logger.log('PhotoAnnotationLayer', 'Attaching event handlers');

    // Mouse down handler - defined inside useEffect to capture current closure
    const handleMouseDown = (e) => {
      logger.log('PhotoAnnotationLayer', 'Mouse down:', {
        currentTool,
        pointer: canvas.getPointer(e.e)
      });

      if (currentTool === 'select') return;

      const pointer = canvas.getPointer(e.e);
      startPointRef.current = { x: pointer.x, y: pointer.y };
      setIsDrawing(true);

      switch (currentTool) {
        case 'text':
          addTextBox(pointer.x, pointer.y);
          setIsDrawing(false);
          break;
        case 'arrow':
          startArrow(pointer.x, pointer.y);
          break;
        case 'circle':
          startCircle(pointer.x, pointer.y);
          break;
        case 'square':
          startSquare(pointer.x, pointer.y);
          break;
        case 'line':
          startLine(pointer.x, pointer.y);
          break;
        case 'cloud':
          startRevisionCloud(pointer.x, pointer.y);
          break;
        case 'leader':
          startLeaderLine(pointer.x, pointer.y);
          break;
        default:
          break;
      }
    };

    // Mouse move handler - defined inside useEffect
    const handleMouseMove = (e) => {
      if (!isDrawing || currentTool === 'select') return;

      const pointer = canvas.getPointer(e.e);

      switch (currentTool) {
        case 'arrow':
          updateArrow(pointer.x, pointer.y);
          break;
        case 'circle':
          updateCircle(pointer.x, pointer.y);
          break;
        case 'square':
          updateSquare(pointer.x, pointer.y);
          break;
        case 'line':
          updateLine(pointer.x, pointer.y);
          break;
        case 'cloud':
          updateRevisionCloud(pointer.x, pointer.y);
          break;
        case 'leader':
          updateLeaderLine(pointer.x, pointer.y);
          break;
        default:
          break;
      }
    };

    // Mouse up handler - defined inside useEffect
    const handleMouseUp = () => {
      if (!isDrawing) return;
      setIsDrawing(false);

      switch (currentTool) {
        case 'arrow':
          finishArrow();
          break;
        case 'leader':
          finalizeLeaderLine();
          break;
        case 'circle':
        case 'square':
        case 'line':
        case 'cloud':
          saveHistory();
          break;
        default:
          break;
      }
    };

    // Double-click handler for leader line editing
    const handleDblClick = (opt) => {
      const target = opt.target;
      if (!target || target.customType !== 'leaderLine') return;
      handleLeaderDoubleClick(opt);
    };

    // Attach mouse event handlers
    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);
    canvas.on('mouse:dblclick', handleDblClick);

    // Cleanup on unmount or when handlers change
    return () => {
      logger.log('PhotoAnnotationLayer', 'Removing event handlers');
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
      canvas.off('mouse:dblclick', handleDblClick);
    };
  }, [currentTool, currentColor, isActive, isDrawing]);

  // Text tool
  const addTextBox = (x, y) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const textbox = new fabric.Textbox('Type here...', {
      left: x,
      top: y,
      width: 200,
      fontSize: 16,
      fill: currentColor,
      fontFamily: 'Arial',
      editable: true,
      selectable: true
    });

    canvas.add(textbox);
    canvas.setActiveObject(textbox);
    textbox.enterEditing();
    textbox.selectAll();

    saveHistory();
    if (onToolChange) {
      onToolChange('select');
    }
  };

  // Arrow tool
  const startArrow = (x, y) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const line = new fabric.Line([x, y, x, y], {
      stroke: currentColor,
      strokeWidth: 3,
      selectable: false,
      evented: false
    });

    const triangle = new fabric.Triangle({
      left: x,
      top: y,
      width: 10,
      height: 10,
      fill: currentColor,
      selectable: false,
      evented: false,
      angle: 0
    });

    canvas.add(line);
    canvas.add(triangle);

    arrowPartsRef.current = { line, triangle };
  };

  const updateArrow = (x, y) => {
    const { line, triangle } = arrowPartsRef.current;
    if (!line || !triangle) return;

    const start = startPointRef.current;
    line.set({ x2: x, y2: y });

    const angle = Math.atan2(y - start.y, x - start.x) * 180 / Math.PI;
    triangle.set({
      left: x - 5,
      top: y - 5,
      angle: angle + 90
    });

    fabricCanvasRef.current?.renderAll();
  };

  const finishArrow = () => {
    const { line, triangle } = arrowPartsRef.current;
    if (!line || !triangle) return;

    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const group = new fabric.Group([line, triangle], {
      selectable: true,
      evented: true
    });

    canvas.remove(line);
    canvas.remove(triangle);
    canvas.add(group);

    arrowPartsRef.current = { line: null, triangle: null };
    saveHistory();
  };

  // Circle tool
  const startCircle = (x, y) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const circle = new fabric.Circle({
      left: x,
      top: y,
      radius: 1,
      stroke: currentColor,
      strokeWidth: 3,
      fill: 'transparent',
      selectable: false,
      evented: false
    });

    canvas.add(circle);
    circleStateRef.current = { startX: x, startY: y, tempCircle: circle };
  };

  const updateCircle = (x, y) => {
    const { startX, startY, tempCircle } = circleStateRef.current;
    if (!tempCircle) return;

    const radius = Math.sqrt(Math.pow(x - startX, 2) + Math.pow(y - startY, 2)) / 2;
    const centerX = (startX + x) / 2;
    const centerY = (startY + y) / 2;

    tempCircle.set({
      left: centerX - radius,
      top: centerY - radius,
      radius: radius
    });

    fabricCanvasRef.current?.renderAll();
  };

  // Square tool
  const startSquare = (x, y) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const rect = new fabric.Rect({
      left: x,
      top: y,
      width: 1,
      height: 1,
      stroke: currentColor,
      strokeWidth: 3,
      fill: 'transparent',
      selectable: false,
      evented: false
    });

    canvas.add(rect);
    squareStateRef.current = { startX: x, startY: y, tempRect: rect };
  };

  const updateSquare = (x, y) => {
    const { startX, startY, tempRect } = squareStateRef.current;
    if (!tempRect) return;

    const width = Math.abs(x - startX);
    const height = Math.abs(y - startY);
    const left = Math.min(startX, x);
    const top = Math.min(startY, y);

    tempRect.set({ left, top, width, height });
    fabricCanvasRef.current?.renderAll();
  };

  // Line tool
  const startLine = (x, y) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const line = new fabric.Line([x, y, x, y], {
      stroke: currentColor,
      strokeWidth: 3,
      selectable: false,
      evented: false
    });

    canvas.add(line);
    lineStateRef.current = { startX: x, startY: y, tempLine: line };
  };

  const updateLine = (x, y) => {
    const { tempLine } = lineStateRef.current;
    if (!tempLine) return;

    tempLine.set({ x2: x, y2: y });
    fabricCanvasRef.current?.renderAll();
  };

  // Revision Cloud tool
  const startRevisionCloud = (x, y) => {
    cloudStartRef.current = { x, y };
  };

  const updateRevisionCloud = (x, y) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const start = cloudStartRef.current;
    const path = generateCloudPath(start.x, start.y, x, y);

    if (drawingObjectRef.current) {
      canvas.remove(drawingObjectRef.current);
    }

    const cloudPath = new fabric.Path(path, {
      stroke: currentColor,
      strokeWidth: 3,
      fill: 'transparent',
      selectable: false,
      evented: false
    });

    canvas.add(cloudPath);
    drawingObjectRef.current = cloudPath;
    canvas.renderAll();
  };

  // Generate cloud path (simplified)
  const generateCloudPath = (x1, y1, x2, y2) => {
    const arcRadius = 10;
    const numArcs = 12;

    const width = Math.abs(x2 - x1);
    const height = Math.abs(y2 - y1);
    const perimeter = 2 * (width + height);
    const arcLength = perimeter / numArcs;

    let pathData = `M ${x1} ${y1}`;

    // Simplified rectangular cloud
    for (let i = 0; i < numArcs; i++) {
      const progress = i / numArcs;
      let x, y;

      if (progress < 0.25) {
        x = x1 + (x2 - x1) * (progress * 4);
        y = y1;
      } else if (progress < 0.5) {
        x = x2;
        y = y1 + (y2 - y1) * ((progress - 0.25) * 4);
      } else if (progress < 0.75) {
        x = x2 - (x2 - x1) * ((progress - 0.5) * 4);
        y = y2;
      } else {
        x = x1;
        y = y2 - (y2 - y1) * ((progress - 0.75) * 4);
      }

      pathData += ` Q ${x} ${y} ${x} ${y}`;
    }

    pathData += ' Z';
    return pathData;
  };

  // ===== LEADER LINE TOOL =====

  // Start drawing leader line (mouse down)
  const startLeaderLine = (x, y) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const leader = leaderStateRef.current;
    leader.startX = x;
    leader.startY = y;
    leader.color = currentColor;

    logger.debug('PhotoAnnotationLayer', 'Leader line START:', { x, y, color: currentColor });

    // Create line from click point
    leader.tempLine = new fabric.Line([x, y, x, y], {
      stroke: currentColor,
      strokeWidth: 3,
      selectable: false,
      evented: false
    });

    // Create arrowhead at START (where user clicked)
    leader.tempArrowhead = new fabric.Triangle({
      left: x,
      top: y,
      width: 12,
      height: 16,
      fill: currentColor,
      originX: 'center',
      originY: 'bottom',
      angle: 180,
      selectable: false,
      evented: false
    });

    // Create textbox (empty initially)
    leader.tempTextbox = new fabric.Textbox('', {
      left: x + 15,
      top: y - 10,
      width: 120,
      fontSize: 12,
      fontFamily: 'Arial',
      fill: currentColor,
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
      editable: false,
      selectable: false,
      evented: false
    });

    // Add all three objects separately
    canvas.add(leader.tempLine);
    canvas.add(leader.tempArrowhead);
    canvas.add(leader.tempTextbox);

    canvas.renderAll();
  };

  // Update leader line during drawing (mouse move)
  const updateLeaderLine = (currentX, currentY) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const leader = leaderStateRef.current;
    if (!leader.tempLine || !leader.tempArrowhead || !leader.tempTextbox) return;

    const x1 = leader.startX;
    const y1 = leader.startY;
    const x2 = currentX;
    const y2 = currentY;

    // Update line endpoint
    leader.tempLine.set({ x2, y2 });
    leader.tempLine.setCoords();

    // Calculate angle: arrowhead points FROM end TOWARD start
    const angleRad = Math.atan2(y1 - y2, x1 - x2);
    const angleDeg = (angleRad * 180 / Math.PI) + 90;

    // Rotate arrowhead (stays at start point)
    leader.tempArrowhead.set({ angle: angleDeg });
    leader.tempArrowhead.setCoords();

    // Position textbox at drag endpoint with smart offset
    const dragRight = x2 >= x1;
    const dragDown = y2 >= y1;
    const textOffsetX = dragRight ? 10 : -110;
    const textOffsetY = dragDown ? 5 : -25;

    leader.tempTextbox.set({
      left: x2 + textOffsetX,
      top: y2 + textOffsetY
    });
    leader.tempTextbox.setCoords();

    canvas.renderAll();
  };

  // Finalize leader line (mouse up) - Auto-enters edit mode
  const finalizeLeaderLine = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const leader = leaderStateRef.current;

    logger.debug('PhotoAnnotationLayer', 'Leader line FINALIZE - entering edit mode');

    if (!leader.tempLine || !leader.tempArrowhead || !leader.tempTextbox) {
      logger.warn('PhotoAnnotationLayer', 'Leader finalize ABORTED - missing objects');
      return;
    }

    // Remove from canvas temporarily
    canvas.remove(leader.tempLine);
    canvas.remove(leader.tempArrowhead);
    canvas.remove(leader.tempTextbox);

    // Configure textbox for immediate editing
    leader.tempTextbox.set({
      text: '',
      editable: true,
      selectable: true,
      evented: true
    });

    // Re-add objects individually
    canvas.add(leader.tempLine);
    canvas.add(leader.tempArrowhead);
    canvas.add(leader.tempTextbox);

    // Store references for grouping after edit
    const lineRef = leader.tempLine;
    const arrowRef = leader.tempArrowhead;
    const textRef = leader.tempTextbox;

    // Clear temp variables
    leader.tempLine = null;
    leader.tempArrowhead = null;
    leader.tempTextbox = null;

    // Enter text editing mode immediately
    canvas.setActiveObject(textRef);
    textRef.enterEditing();

    // When user exits editing, group everything
    const groupAfterEdit = () => {
      textRef.off('editing:exited', groupAfterEdit);

      // If text is empty, set placeholder
      if (!textRef.text || textRef.text.trim() === '') {
        textRef.set({ text: 'Note...' });
      }

      // Remove individual objects
      canvas.remove(lineRef);
      canvas.remove(arrowRef);
      canvas.remove(textRef);

      // Create final group
      const leaderGroup = new fabric.Group(
        [lineRef, arrowRef, textRef],
        {
          selectable: true,
          evented: true,
          hasControls: true,
          hasBorders: true,
          customType: 'leaderLine',
          subTargetCheck: true
        }
      );

      canvas.add(leaderGroup);
      canvas.setActiveObject(leaderGroup);
      canvas.renderAll();
      saveHistory();

      logger.debug('PhotoAnnotationLayer', 'Leader line grouped after text edit');
    };

    textRef.on('editing:exited', groupAfterEdit);
    canvas.renderAll();
  };

  // Double-click to re-edit leader line text
  const handleLeaderDoubleClick = (opt) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const target = opt.target;
    if (!target || target.customType !== 'leaderLine') return;

    logger.debug('PhotoAnnotationLayer', 'Double-click on leader - entering edit mode');

    const objects = target.getObjects();
    const line = objects[0];
    const arrowhead = objects[1];
    const textbox = objects[2];

    const groupLeft = target.left || 0;
    const groupTop = target.top || 0;

    // Remove group
    canvas.remove(target);

    // Recreate objects at absolute positions
    const newLine = new fabric.Line(
      [
        groupLeft + (line.x1 || 0),
        groupTop + (line.y1 || 0),
        groupLeft + (line.x2 || 0),
        groupTop + (line.y2 || 0)
      ],
      {
        stroke: line.stroke,
        strokeWidth: line.strokeWidth,
        selectable: false,
        evented: false
      }
    );

    const newArrowhead = new fabric.Triangle({
      left: groupLeft + (arrowhead.left || 0),
      top: groupTop + (arrowhead.top || 0),
      width: arrowhead.width,
      height: arrowhead.height,
      fill: arrowhead.fill,
      originX: arrowhead.originX,
      originY: arrowhead.originY,
      angle: arrowhead.angle,
      selectable: false,
      evented: false
    });

    const newTextbox = new fabric.Textbox(textbox.text || '', {
      left: groupLeft + (textbox.left || 0),
      top: groupTop + (textbox.top || 0),
      width: textbox.width,
      fontSize: textbox.fontSize,
      fontFamily: textbox.fontFamily,
      fill: textbox.fill,
      editable: true,
      selectable: true,
      evented: true
    });

    canvas.add(newLine);
    canvas.add(newArrowhead);
    canvas.add(newTextbox);

    // Enter edit mode
    canvas.setActiveObject(newTextbox);
    newTextbox.enterEditing();
    newTextbox.selectAll();

    // Re-group when done editing
    const regroup = () => {
      newTextbox.off('editing:exited', regroup);

      // If text is empty, set placeholder
      if (!newTextbox.text || newTextbox.text.trim() === '') {
        newTextbox.set({ text: 'Note...' });
      }

      canvas.remove(newLine);
      canvas.remove(newArrowhead);
      canvas.remove(newTextbox);

      const rebuiltGroup = new fabric.Group(
        [newLine, newArrowhead, newTextbox],
        {
          selectable: true,
          evented: true,
          hasControls: true,
          hasBorders: true,
          customType: 'leaderLine',
          subTargetCheck: true
        }
      );

      canvas.add(rebuiltGroup);
      canvas.setActiveObject(rebuiltGroup);
      canvas.renderAll();
      saveHistory();

      logger.debug('PhotoAnnotationLayer', 'Leader line re-grouped after editing');
    };

    newTextbox.on('editing:exited', regroup);
    canvas.renderAll();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isActive) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelected();
      } else if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' || e.key === 'Z') {
          e.preventDefault();
          undo();
        } else if (e.key === 'y' || e.key === 'Y') {
          e.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    undo,
    redo,
    deleteSelected,
    getCanvas: () => fabricCanvasRef.current,
    toDataURL: () => fabricCanvasRef.current?.toDataURL('image/png'),
  }));

  if (!isActive) return null;

  return (
    <div className={styles.annotationLayerContainer}>
      <canvas ref={canvasRef} className={styles.annotationCanvas} />
    </div>
  );
});

PhotoAnnotationLayer.displayName = 'PhotoAnnotationLayer';

export default PhotoAnnotationLayer;
