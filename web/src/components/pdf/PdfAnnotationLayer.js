import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { Canvas, Textbox, Line, Circle, Group, Text, Path, Triangle, Rect } from 'fabric';
import logger from '../../services/devLogger';
import styles from './PdfAnnotationLayer.module.css';

/**
 * PdfAnnotationLayer - Fabric.js canvas overlay for PDF annotations
 *
 * Features:
 * - Transparent canvas overlay on top of PDF iframe
 * - Supports drawing tools: select, text, arrow, delta, revision cloud
 * - Color picker with 4 presets: red, blue, green, yellow
 * - Annotations saved as JSON
 * - Per-page annotation tracking
 *
 * @param {boolean} isActive - Whether annotation mode is active
 * @param {string} currentTool - Current selected tool
 * @param {string} currentColor - Current selected color
 * @param {array} annotations - Existing annotations to load
 * @param {function} onAnnotationsChange - Callback when annotations change
 * @param {function} onToolChange - Callback to switch tools (for auto-switching to select)
 * @param {number} currentPage - Current PDF page number (for multi-page support)
 */
const PdfAnnotationLayer = forwardRef(({
  isActive = false,
  currentTool = 'select',
  currentColor = 'var(--color-danger)', // Red default
  annotations = [],
  onAnnotationsChange,
  onToolChange,
  currentPage = 1
}, ref) => {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const drawingObjectRef = useRef(null);
  const startPointRef = useRef({ x: 0, y: 0 });
  const historyRef = useRef([]);
  const historyStepRef = useRef(0);
  const arrowPartsRef = useRef({ line: null, triangle: null });
  const cloudStartRef = useRef({ x: 0, y: 0 });

  // Leader line state (module-level for proper updates)
  const leaderStateRef = useRef({
    startX: 0,
    startY: 0,
    color: 'var(--color-danger)',
    tempLine: null,
    tempArrowhead: null,
    tempTextbox: null
  });

  // Whiteout tool state
  const whiteoutStateRef = useRef({
    startX: 0,
    startY: 0,
    tempRect: null
  });

  // Line tool state
  const lineStateRef = useRef({
    startX: 0,
    startY: 0,
    tempLine: null
  });

  // Square tool state
  const squareStateRef = useRef({
    startX: 0,
    startY: 0,
    tempRect: null
  });

  // Circle tool state
  const circleStateRef = useRef({
    startX: 0,
    startY: 0,
    tempCircle: null
  });

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current || fabricCanvasRef.current || !isActive) {
      return;
    }

    let resizeHandler = null;

    // Small delay to ensure DOM is ready
    const initTimeout = setTimeout(() => {
      const canvasElement = canvasRef.current;
      if (!canvasElement) return;

      const container = canvasElement.parentElement;
      if (!container) return;

      const canvas = new Canvas(canvasElement, {
        isDrawingMode: false,
        selection: currentTool === 'select',
        backgroundColor: 'transparent',
        renderOnAddRemove: true,
        enableRetinaScaling: true,
        width: container.offsetWidth,
        height: container.offsetHeight
      });

      fabricCanvasRef.current = canvas;

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
            // Ignore resize errors if canvas is being disposed
          }
        }
      };

      window.addEventListener('resize', resizeHandler);

      // Load existing annotations
      if (annotations.length > 0) {
        loadAnnotations(canvas, annotations);
      }

      // Add double-click handler for leader line and whiteout text editing
      canvas.on('mouse:dblclick', (opt) => {
        const target = opt.target;
        if (!target) return;

        if (target.customType === 'leaderLine') {
          handleLeaderDoubleClick(canvas, opt);
        } else if (target.customType === 'whiteout') {
          handleWhiteoutDoubleClick(canvas, opt);
        } else if (target.deltaLetter) {
          handleDeltaDoubleClick(canvas, opt);
        }
      });

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

  // Load annotations from JSON
  const loadAnnotations = async (canvas, annotationsData) => {
    const pageAnnotations = annotationsData.filter(a => a.page === currentPage);

    for (const annotation of pageAnnotations) {
      // In fabric v6+, we need to reconstruct objects manually
      // For now, we'll skip loading saved annotations until Phase 4
      // when we implement proper serialization
    }
  };

  // Update tool mode
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) {
      return;
    }

    // CRITICAL: Disable selection when NOT in select mode
    const isSelectMode = currentTool === 'select';

    canvas.selection = isSelectMode;
    canvas.isDrawingMode = false;

    // Make all objects selectable/non-selectable based on tool
    canvas.forEachObject((obj) => {
      obj.selectable = isSelectMode;
      obj.evented = isSelectMode;
      obj.hoverCursor = isSelectMode ? 'move' : 'default';
    });

    // Update canvas cursor based on tool
    if (isSelectMode) {
      canvas.defaultCursor = 'default';
      canvas.hoverCursor = 'move';
    } else {
      canvas.defaultCursor = 'crosshair';
      canvas.hoverCursor = 'crosshair';
    }

    canvas.renderAll();
  }, [currentTool]);

  // Handle drawing events based on current tool
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !isActive) {
      return;
    }

    const handleMouseDown = (e) => {
      if (currentTool === 'select') {
        return;
      }

      const pointer = canvas.getPointer(e.e);
      startPointRef.current = { x: pointer.x, y: pointer.y };
      setIsDrawing(true);

      switch (currentTool) {
        case 'text':
          addTextBox(canvas, pointer.x, pointer.y, currentColor);
          setIsDrawing(false); // Text doesn't need mouse move
          break;

        case 'whiteout':
          startWhiteout(canvas, pointer.x, pointer.y);
          break;

        case 'leader':
          startLeaderLine(canvas, pointer.x, pointer.y, currentColor);
          break;

        case 'arrow':
          startArrow(canvas, pointer.x, pointer.y, currentColor);
          break;

        case 'delta':
          addDeltaSymbol(canvas, pointer.x, pointer.y, currentColor);
          setIsDrawing(false); // Delta doesn't need mouse move
          break;

        case 'cloud':
          startRevisionCloud(canvas, pointer.x, pointer.y, currentColor);
          break;

        case 'line':
          startLine(canvas, pointer.x, pointer.y, currentColor);
          break;

        case 'square':
          startSquare(canvas, pointer.x, pointer.y, currentColor);
          break;

        case 'circle':
          startCircle(canvas, pointer.x, pointer.y, currentColor);
          break;

        default:
          break;
      }
    };

    const handleMouseMove = (e) => {
      if (!isDrawing) {
        return;
      }

      // Some tools use their own state refs, not drawingObjectRef
      const customStateTools = ['leader', 'whiteout', 'line', 'square', 'circle'];
      if (!customStateTools.includes(currentTool) && !drawingObjectRef.current) {
        return;
      }

      const pointer = canvas.getPointer(e.e);

      if (currentTool === 'arrow') {
        updateArrow(drawingObjectRef.current, startPointRef.current.x, startPointRef.current.y, pointer.x, pointer.y);
        canvas.renderAll();
      } else if (currentTool === 'leader') {
        updateLeaderLine(canvas, pointer.x, pointer.y);
      } else if (currentTool === 'whiteout') {
        updateWhiteout(canvas, pointer.x, pointer.y);
      } else if (currentTool === 'cloud') {
        updateRevisionCloud(drawingObjectRef.current, pointer.x, pointer.y);
        canvas.renderAll();
      } else if (currentTool === 'line') {
        updateLine(canvas, pointer.x, pointer.y);
      } else if (currentTool === 'square') {
        updateSquare(canvas, pointer.x, pointer.y);
      } else if (currentTool === 'circle') {
        updateCircle(canvas, pointer.x, pointer.y);
      }
    };

    const handleMouseUp = () => {
      if (isDrawing) {
        // Special handling for arrow: group line and triangle
        if (currentTool === 'arrow' && arrowPartsRef.current.line && arrowPartsRef.current.triangle) {
          const { line, triangle } = arrowPartsRef.current;

          // Remove individual parts from canvas
          canvas.remove(line);
          canvas.remove(triangle);

          // Create group with both parts
          const arrowGroup = new Group([line, triangle], {
            selectable: true,
            evented: true,
            hasControls: true,
            customType: 'arrow'
          });

          canvas.add(arrowGroup);
          arrowPartsRef.current = { line: null, triangle: null };

          setIsDrawing(false);
          drawingObjectRef.current = null;
          saveAnnotations(canvas);
          saveHistory(canvas);
        } else if (currentTool === 'leader') {
          // Finalize leader line (new implementation)
          finalizeLeaderLine(canvas);

          setIsDrawing(false);
          drawingObjectRef.current = null;
          saveAnnotations(canvas);
          saveHistory(canvas);
        } else if (currentTool === 'whiteout') {
          // Finalize whiteout
          finalizeWhiteout(canvas);

          setIsDrawing(false);
          drawingObjectRef.current = null;
          saveAnnotations(canvas);
          saveHistory(canvas);
        } else if (currentTool === 'cloud' && drawingObjectRef.current) {
          // Make cloud selectable after drawing
          drawingObjectRef.current.set({
            selectable: true,
            evented: true,
            hasControls: true,
            customType: 'cloud'
          });

          setIsDrawing(false);
          drawingObjectRef.current = null;
          saveAnnotations(canvas);
          saveHistory(canvas);
        } else if (currentTool === 'line') {
          // Finalize line
          finalizeLine(canvas);

          setIsDrawing(false);
          drawingObjectRef.current = null;
          saveAnnotations(canvas);
          saveHistory(canvas);
        } else if (currentTool === 'square') {
          // Finalize square
          finalizeSquare(canvas);

          setIsDrawing(false);
          drawingObjectRef.current = null;
          saveAnnotations(canvas);
          saveHistory(canvas);
        } else if (currentTool === 'circle') {
          // Finalize circle
          finalizeCircle(canvas);

          setIsDrawing(false);
          drawingObjectRef.current = null;
          saveAnnotations(canvas);
          saveHistory(canvas);
        } else if (drawingObjectRef.current) {
          setIsDrawing(false);
          drawingObjectRef.current = null;
          saveAnnotations(canvas);
          saveHistory(canvas);
        }

        // Auto-switch back to select mode after drawing
        if (onToolChange && currentTool !== 'select') {
          onToolChange('select');
        }
      }
    };

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
    };
  }, [currentTool, currentColor, isActive, isDrawing, currentPage]);

  // Add text box
  const addTextBox = (canvas, x, y, color) => {
    const textbox = new Textbox('Type here...', {
      left: x,
      top: y,
      width: 200,
      fontSize: 14,
      fill: color,
      fontFamily: 'Arial',
      editable: true,
      selectable: true
    });

    canvas.add(textbox);
    canvas.setActiveObject(textbox);
    textbox.enterEditing();
    canvas.renderAll();
    saveAnnotations(canvas);
    saveHistory(canvas);

    // Auto-switch back to select mode after adding text
    if (onToolChange) {
      onToolChange('select');
    }
  };

  // ===== LEADER LINE TOOL - NEW IMPLEMENTATION =====

  // Start drawing leader line (mouse down)
  const startLeaderLine = (canvas, x, y, color) => {
    const leader = leaderStateRef.current;
    leader.startX = x;
    leader.startY = y;
    leader.color = color;

    logger.debug('PDF', 'Leader line START:', { x, y, color });

    // Create line from click point
    leader.tempLine = new Line([x, y, x, y], {
      stroke: color,
      strokeWidth: 2,
      selectable: false,
      evented: false
    });

    // Create arrowhead at START (where user clicked)
    leader.tempArrowhead = new Triangle({
      left: x,
      top: y,
      width: 12,
      height: 16,
      fill: color,
      originX: 'center',
      originY: 'bottom',
      angle: 180, // Will rotate during drag
      selectable: false,
      evented: false
    });

    // Create textbox (empty initially, but with background for visibility)
    leader.tempTextbox = new Textbox('', {
      left: x + 15,
      top: y - 10,
      width: 120,
      fontSize: 12,
      fontFamily: 'Arial',
      fill: color,
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
      editable: false,
      selectable: false,
      evented: false
    });

    // Add all three objects separately (NOT grouped yet)
    canvas.add(leader.tempLine);
    canvas.add(leader.tempArrowhead);
    canvas.add(leader.tempTextbox);

    logger.debug('PDF', 'Added leader objects to canvas:', {
      line: leader.tempLine,
      arrowhead: leader.tempArrowhead,
      textbox: leader.tempTextbox
    });

    canvas.renderAll();
  };

  // Update leader line during drawing (mouse move)
  const updateLeaderLine = (canvas, currentX, currentY) => {
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

    // Position textbox at drag endpoint
    // Smart offset so text doesn't overlap line
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
  const finalizeLeaderLine = (canvas) => {
    const leader = leaderStateRef.current;

    logger.debug('PDF', 'Leader line FINALIZE called - entering edit mode');

    if (!leader.tempLine || !leader.tempArrowhead || !leader.tempTextbox) {
      logger.warn('PDF', 'Leader line finalize ABORTED - missing objects');
      return null;
    }

    // Remove from canvas temporarily
    canvas.remove(leader.tempLine);
    canvas.remove(leader.tempArrowhead);
    canvas.remove(leader.tempTextbox);

    // Configure textbox for immediate editing
    leader.tempTextbox.set({
      text: '', // Empty so user can type immediately
      editable: true,
      selectable: true,
      evented: true
    });

    // Re-add objects individually (NOT grouped yet)
    canvas.add(leader.tempLine);
    canvas.add(leader.tempArrowhead);
    canvas.add(leader.tempTextbox);

    // Store references for grouping after edit
    const lineRef = leader.tempLine;
    const arrowRef = leader.tempArrowhead;
    const textRef = leader.tempTextbox;

    // Clear temp variables now
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
      const leaderGroup = new Group(
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

      logger.debug('PDF', 'Leader line grouped after text edit');
    };

    textRef.on('editing:exited', groupAfterEdit);
    canvas.renderAll();

    return textRef;
  };

  // Double-click to re-edit leader line text
  const handleLeaderDoubleClick = (canvas, opt) => {
    const target = opt.target;
    if (!target || target.customType !== 'leaderLine') return;

    logger.debug('PDF', 'Double-click on leader - entering edit mode');

    const objects = target.getObjects();
    const line = objects[0];
    const arrowhead = objects[1];
    const textbox = objects[2];

    const groupLeft = target.left || 0;
    const groupTop = target.top || 0;

    // Remove group
    canvas.remove(target);

    // Recreate objects at absolute positions
    const newLine = new Line(
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

    const newArrowhead = new Triangle({
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

    const newTextbox = new Textbox(textbox.text || '', {
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

      const rebuiltGroup = new Group(
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

      logger.debug('PDF', 'Leader line re-grouped after editing');
    };

    newTextbox.on('editing:exited', regroup);
    canvas.renderAll();
  };

  // ===== WHITEOUT TOOL =====

  // Start drawing whiteout rectangle (mouse down)
  const startWhiteout = (canvas, x, y) => {
    const whiteout = whiteoutStateRef.current;
    whiteout.startX = x;
    whiteout.startY = y;

    whiteout.tempRect = new Rect({
      left: x,
      top: y,
      width: 1,
      height: 1,
      fill: 'var(--text-primary)',
      stroke: '#CCCCCC', // Light gray border while drawing
      strokeWidth: 1,
      selectable: false,
      evented: false
    });

    canvas.add(whiteout.tempRect);
    canvas.renderAll();
  };

  // Update whiteout rectangle during drawing (mouse move)
  const updateWhiteout = (canvas, currentX, currentY) => {
    const whiteout = whiteoutStateRef.current;
    if (!whiteout.tempRect) return;

    const width = Math.abs(currentX - whiteout.startX);
    const height = Math.abs(currentY - whiteout.startY);
    const left = Math.min(currentX, whiteout.startX);
    const top = Math.min(currentY, whiteout.startY);

    whiteout.tempRect.set({
      left: left,
      top: top,
      width: width,
      height: height
    });

    canvas.renderAll();
  };

  // Finalize whiteout (mouse up) - Auto-enters edit mode
  const finalizeWhiteout = (canvas) => {
    const whiteout = whiteoutStateRef.current;

    if (!whiteout.tempRect) {
      logger.warn('PDF', 'Whiteout finalize ABORTED - missing rect');
      return null;
    }

    // Remove drawing border
    whiteout.tempRect.set({
      stroke: null,
      strokeWidth: 0
    });

    // Get rect dimensions for text positioning
    const rectLeft = whiteout.tempRect.left;
    const rectTop = whiteout.tempRect.top;
    const rectWidth = whiteout.tempRect.width;
    const rectHeight = whiteout.tempRect.height;

    // Create text box centered in the white rectangle
    // Font size scales with rectangle height
    const fontSize = Math.min(Math.max(rectHeight * 0.7, 8), 24);

    const whiteoutText = new Textbox('', {
      left: rectLeft + 2,
      top: rectTop + (rectHeight - fontSize) / 2,
      width: rectWidth - 4,
      fontSize: fontSize,
      fontFamily: 'Arial, Helvetica, sans-serif',
      fill: 'var(--gray-900)',
      textAlign: 'left',
      editable: true,
      selectable: true,
      evented: true
    });

    canvas.add(whiteoutText);

    // Store references
    const rectRef = whiteout.tempRect;
    const textRef = whiteoutText;

    // Clear temp variable
    whiteout.tempRect = null;

    // Enter edit mode immediately
    canvas.setActiveObject(textRef);
    textRef.enterEditing();

    // Group when done editing
    const groupAfterEdit = () => {
      textRef.off('editing:exited', groupAfterEdit);

      canvas.remove(rectRef);
      canvas.remove(textRef);

      const whiteoutGroup = new Group(
        [rectRef, textRef],
        {
          selectable: true,
          evented: true,
          hasControls: true,
          hasBorders: true,
          customType: 'whiteout',
          subTargetCheck: true
        }
      );

      canvas.add(whiteoutGroup);
      canvas.setActiveObject(whiteoutGroup);
      canvas.renderAll();

      logger.debug('PDF', 'Whiteout grouped after text edit');
    };

    textRef.on('editing:exited', groupAfterEdit);
    canvas.renderAll();

    return textRef;
  };

  // Double-click to re-edit whiteout text
  const handleWhiteoutDoubleClick = (canvas, opt) => {
    const target = opt.target;
    if (!target || target.customType !== 'whiteout') return;

    logger.debug('PDF', 'Double-click on whiteout - entering edit mode');

    const objects = target.getObjects();
    const rect = objects[0];
    const textbox = objects[1];

    const groupLeft = target.left || 0;
    const groupTop = target.top || 0;

    // Remove group
    canvas.remove(target);

    // Recreate objects at absolute positions
    const newRect = new Rect({
      left: groupLeft + (rect.left || 0),
      top: groupTop + (rect.top || 0),
      width: rect.width,
      height: rect.height,
      fill: 'var(--text-primary)',
      selectable: false,
      evented: false
    });

    const newText = new Textbox(textbox.text || '', {
      left: groupLeft + (textbox.left || 0),
      top: groupTop + (textbox.top || 0),
      width: textbox.width,
      fontSize: textbox.fontSize,
      fontFamily: textbox.fontFamily,
      fill: textbox.fill,
      textAlign: textbox.textAlign,
      editable: true,
      selectable: true,
      evented: true
    });

    canvas.add(newRect);
    canvas.add(newText);

    // Enter edit mode
    canvas.setActiveObject(newText);
    newText.enterEditing();
    newText.selectAll();

    // Re-group when done editing
    const regroup = () => {
      newText.off('editing:exited', regroup);

      canvas.remove(newRect);
      canvas.remove(newText);

      const rebuiltGroup = new Group(
        [newRect, newText],
        {
          selectable: true,
          evented: true,
          hasControls: true,
          hasBorders: true,
          customType: 'whiteout',
          subTargetCheck: true
        }
      );

      canvas.add(rebuiltGroup);
      canvas.setActiveObject(rebuiltGroup);
      canvas.renderAll();

      logger.debug('PDF', 'Whiteout re-grouped after editing');
    };

    newText.on('editing:exited', regroup);
    canvas.renderAll();
  };

  // Handle double-click on Delta symbol to edit text
  const handleDeltaDoubleClick = (canvas, opt) => {
    const target = opt.target;
    if (!target || !target.deltaLetter) return;

    logger.debug('PDF', 'Double-click on delta - entering edit mode');

    const objects = target.getObjects();
    const triangle = objects[0];
    const textObj = objects[1];

    const groupLeft = target.left || 0;
    const groupTop = target.top || 0;

    // Remove group
    canvas.remove(target);

    // Recreate triangle at absolute position
    const newTriangle = new Triangle({
      left: groupLeft + (triangle.left || 0),
      top: groupTop + (triangle.top || 0),
      width: triangle.width,
      height: triangle.height,
      fill: triangle.fill,
      stroke: triangle.stroke,
      strokeWidth: triangle.strokeWidth,
      originX: 'center',
      originY: 'center',
      selectable: false,
      evented: false
    });

    // Recreate text as editable Textbox
    const newText = new Textbox(textObj.text || '', {
      left: groupLeft + (textObj.left || 0),
      top: groupTop + (textObj.top || 0) - 5, // Adjust position for editing
      fontSize: textObj.fontSize,
      fontFamily: textObj.fontFamily,
      fontWeight: textObj.fontWeight,
      fill: textObj.fill,
      textAlign: 'center',
      originX: 'center',
      originY: 'center',
      editable: true,
      selectable: true,
      evented: true,
      width: 100
    });

    canvas.add(newTriangle);
    canvas.add(newText);

    // Enter edit mode
    canvas.setActiveObject(newText);
    newText.enterEditing();
    newText.selectAll();

    // Re-group when done editing
    const regroup = () => {
      newText.off('editing:exited', regroup);

      // Convert Textbox back to Text for centered display
      const finalText = new Text(newText.text || target.deltaLetter, {
        fontSize: textObj.fontSize,
        fill: textObj.fill,
        fontFamily: textObj.fontFamily,
        fontWeight: textObj.fontWeight,
        originX: 'center',
        originY: 'center',
        top: 3
      });

      canvas.remove(newTriangle);
      canvas.remove(newText);

      const rebuiltGroup = new Group(
        [newTriangle, finalText],
        {
          left: groupLeft,
          top: groupTop,
          selectable: true,
          evented: true,
          hasControls: true,
          hasBorders: true,
          customType: 'delta',
          subTargetCheck: true
        }
      );

      rebuiltGroup.deltaLetter = target.deltaLetter; // Preserve letter tracking

      canvas.add(rebuiltGroup);
      canvas.setActiveObject(rebuiltGroup);
      canvas.renderAll();

      logger.debug('PDF', 'Delta re-grouped after editing');
    };

    newText.on('editing:exited', regroup);
    canvas.renderAll();
  };

  // ===== LINE TOOL =====
  const startLine = (canvas, x, y, color) => {
    const line = new Line([x, y, x, y], {
      stroke: color,
      strokeWidth: 2,
      selectable: false,
      evented: false
    });

    canvas.add(line);
    lineStateRef.current.startX = x;
    lineStateRef.current.startY = y;
    lineStateRef.current.tempLine = line;
  };

  const updateLine = (canvas, x, y) => {
    const line = lineStateRef.current.tempLine;
    if (!line) return;

    line.set({
      x2: x,
      y2: y
    });
    line.setCoords();
    canvas.renderAll();
  };

  const finalizeLine = (canvas) => {
    const line = lineStateRef.current.tempLine;
    if (!line) return;

    line.set({
      selectable: true,
      evented: true,
      hasControls: true,
      hasBorders: true
    });

    lineStateRef.current.tempLine = null;
    canvas.setActiveObject(line);
    canvas.renderAll();
  };

  // ===== SQUARE TOOL =====
  const startSquare = (canvas, x, y, color) => {
    const rect = new Rect({
      left: x,
      top: y,
      width: 0,
      height: 0,
      fill: 'transparent',
      stroke: color,
      strokeWidth: 2,
      selectable: false,
      evented: false
    });

    canvas.add(rect);
    squareStateRef.current.startX = x;
    squareStateRef.current.startY = y;
    squareStateRef.current.tempRect = rect;
  };

  const updateSquare = (canvas, x, y) => {
    const rect = squareStateRef.current.tempRect;
    if (!rect) return;

    const startX = squareStateRef.current.startX;
    const startY = squareStateRef.current.startY;

    const width = x - startX;
    const height = y - startY;

    rect.set({
      left: width < 0 ? x : startX,
      top: height < 0 ? y : startY,
      width: Math.abs(width),
      height: Math.abs(height)
    });
    rect.setCoords();
    canvas.renderAll();
  };

  const finalizeSquare = (canvas) => {
    const rect = squareStateRef.current.tempRect;
    if (!rect) return;

    rect.set({
      selectable: true,
      evented: true,
      hasControls: true,
      hasBorders: true
    });

    squareStateRef.current.tempRect = null;
    canvas.setActiveObject(rect);
    canvas.renderAll();
  };

  // ===== CIRCLE TOOL =====
  const startCircle = (canvas, x, y, color) => {
    const circle = new Circle({
      left: x,
      top: y,
      radius: 0,
      fill: 'transparent',
      stroke: color,
      strokeWidth: 2,
      selectable: false,
      evented: false,
      originX: 'center',
      originY: 'center'
    });

    canvas.add(circle);
    circleStateRef.current.startX = x;
    circleStateRef.current.startY = y;
    circleStateRef.current.tempCircle = circle;
  };

  const updateCircle = (canvas, x, y) => {
    const circle = circleStateRef.current.tempCircle;
    if (!circle) return;

    const startX = circleStateRef.current.startX;
    const startY = circleStateRef.current.startY;

    const dx = x - startX;
    const dy = y - startY;
    const radius = Math.sqrt(dx * dx + dy * dy);

    circle.set({
      radius: radius
    });
    circle.setCoords();
    canvas.renderAll();
  };

  const finalizeCircle = (canvas) => {
    const circle = circleStateRef.current.tempCircle;
    if (!circle) return;

    circle.set({
      selectable: true,
      evented: true,
      hasControls: true,
      hasBorders: true
    });

    circleStateRef.current.tempCircle = null;
    canvas.setActiveObject(circle);
    canvas.renderAll();
  };

  // Start drawing arrow
  const startArrow = (canvas, x1, y1, color) => {
    // Create the line
    const line = new Line([x1, y1, x1, y1], {
      stroke: color,
      strokeWidth: 2,
      selectable: false,
      evented: false
    });

    // Create the triangle arrowhead
    const triangle = new Triangle({
      left: x1,
      top: y1,
      width: 12,
      height: 12,
      fill: color,
      selectable: false,
      evented: false,
      originX: 'center',
      originY: 'center'
    });

    canvas.add(line);
    canvas.add(triangle);

    arrowPartsRef.current = { line, triangle };
    drawingObjectRef.current = { line, triangle };
  };

  // Update arrow as mouse moves
  const updateArrow = (parts, x1, y1, x2, y2) => {
    const { line, triangle } = parts;

    // Update line
    line.set({ x1, y1, x2, y2 });
    line.setCoords();

    // Calculate angle for triangle rotation
    const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

    // Update triangle position and rotation
    triangle.set({
      left: x2,
      top: y2,
      angle: angle + 90 // +90 to make triangle point in direction of arrow
    });
    triangle.setCoords();
  };

  // Add delta symbol (isosceles triangle with auto-increment letter)
  const addDeltaSymbol = (canvas, x, y, color) => {
    // Count existing deltas on this page to determine next letter
    const existingDeltas = canvas.getObjects().filter(obj =>
      obj.type === 'group' && obj.deltaLetter
    );
    const nextLetterIndex = existingDeltas.length;
    const letter = String.fromCharCode(65 + (nextLetterIndex % 26)); // A, B, C, ... Z, then wraps

    // Create isosceles triangle using Triangle object
    const triangleSize = 30;
    const triangle = new Triangle({
      width: triangleSize,
      height: triangleSize,
      fill: 'transparent',
      stroke: color,
      strokeWidth: 2,
      originX: 'center',
      originY: 'center'
    });

    // Create letter text
    const deltaText = new Text(letter, {
      fontSize: 14,
      fill: color,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      originX: 'center',
      originY: 'center',
      top: 3 // Offset slightly down for better centering
    });

    const group = new Group([triangle, deltaText], {
      left: x,
      top: y,
      selectable: true,
      hasControls: true,
      customType: 'delta',
      subTargetCheck: true
    });

    group.deltaLetter = letter; // Store for tracking

    canvas.add(group);
    canvas.renderAll();
    saveAnnotations(canvas);
    saveHistory(canvas);

    // Auto-switch back to select mode after adding delta
    if (onToolChange) {
      onToolChange('select');
    }
  };

  // Start drawing revision cloud
  const startRevisionCloud = (canvas, x, y, color) => {
    cloudStartRef.current = { x, y };

    // Initialize with empty path array (Fabric v6 format)
    const cloud = new Path([['M', 0, 0]], {
      stroke: color,
      strokeWidth: 2,
      fill: 'transparent',
      selectable: false,
      evented: false,
      objectCaching: false, // Disable caching for dynamic updates
      left: x,
      top: y
    });

    canvas.add(cloud);
    drawingObjectRef.current = cloud;
  };

  // Update revision cloud path (rectangular with outward arc bulges)
  const updateRevisionCloud = (cloud, endX, endY) => {
    const { x: startX, y: startY } = cloudStartRef.current;

    // Calculate rectangle corners (absolute coordinates)
    const left = Math.min(startX, endX);
    const right = Math.max(startX, endX);
    const top = Math.min(startY, endY);
    const bottom = Math.max(startY, endY);

    const width = right - left;
    const height = bottom - top;

    // Skip if rectangle too small
    if (width < 10 || height < 10) {
      return;
    }

    // Arc segment size (standard CAD practice: 10-15px arcs)
    const arcSize = 12;

    // Calculate number of arcs per side
    const topArcs = Math.max(1, Math.floor(width / arcSize));
    const bottomArcs = Math.max(1, Math.floor(width / arcSize));
    const leftArcs = Math.max(1, Math.floor(height / arcSize));
    const rightArcs = Math.max(1, Math.floor(height / arcSize));

    const topSegment = width / topArcs;
    const bottomSegment = width / bottomArcs;
    const leftSegment = height / leftArcs;
    const rightSegment = height / rightArcs;

    // Build path array with RELATIVE coordinates (relative to left, top)
    // Fabric.js Path coordinates are relative to the object's position
    const pathArray = [['M', 0, 0]];

    // Top edge (arcs bulge upward)
    for (let i = 0; i < topArcs; i++) {
      const x1 = i * topSegment;
      const x2 = (i + 1) * topSegment;
      const midX = (x1 + x2) / 2;
      const arcY = -6; // Bulge outward (up) relative to top edge
      pathArray.push(['Q', midX, arcY, x2, 0]);
    }

    // Right edge (arcs bulge rightward)
    for (let i = 0; i < rightArcs; i++) {
      const y1 = i * rightSegment;
      const y2 = (i + 1) * rightSegment;
      const midY = (y1 + y2) / 2;
      const arcX = width + 6; // Bulge outward (right) relative to left edge
      pathArray.push(['Q', arcX, midY, width, y2]);
    }

    // Bottom edge (arcs bulge downward)
    for (let i = bottomArcs - 1; i >= 0; i--) {
      const x1 = (i + 1) * bottomSegment;
      const x2 = i * bottomSegment;
      const midX = (x1 + x2) / 2;
      const arcY = height + 6; // Bulge outward (down) relative to top edge
      pathArray.push(['Q', midX, arcY, x2, height]);
    }

    // Left edge (arcs bulge leftward)
    for (let i = leftArcs - 1; i >= 0; i--) {
      const y1 = (i + 1) * leftSegment;
      const y2 = i * leftSegment;
      const midY = (y1 + y2) / 2;
      const arcX = -6; // Bulge outward (left) relative to left edge
      pathArray.push(['Q', arcX, midY, 0, y2]);
    }

    pathArray.push(['Z']);

    // Set the path and position the cloud at the absolute position
    // Account for arc bulges (6px on each side) in the dimensions
    cloud.set({
      path: pathArray,
      left: left - 6,  // Offset for left arc bulge
      top: top - 6,    // Offset for top arc bulge
      width: width + 12,   // Add space for left + right bulges
      height: height + 12, // Add space for top + bottom bulges
      pathOffset: {
        x: 6,  // Adjust path offset to compensate for position shift
        y: 6
      }
    });
    cloud.setCoords();
  };

  // Save annotations to parent component
  const saveAnnotations = (canvas) => {
    if (!onAnnotationsChange) {
      return;
    }

    const objects = canvas.getObjects();
    const annotationsData = objects.map((obj) => ({
      page: currentPage,
      object: obj.toJSON(['deltaLetter', 'cloudPath', 'customType']) // Include custom properties
    }));

    onAnnotationsChange(annotationsData);
  };

  // Handle object modifications
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) {
      return;
    }

    const handleObjectModified = () => {
      saveAnnotations(canvas);
      saveHistory(canvas);
    };

    canvas.on('object:modified', handleObjectModified);
    canvas.on('object:removed', handleObjectModified);

    return () => {
      canvas.off('object:modified', handleObjectModified);
      canvas.off('object:removed', handleObjectModified);
    };
  }, [currentPage]);

  // Keyboard event handlers (Delete, Undo, Redo)
  useEffect(() => {
    if (!isActive) {
      return;
    }

    const handleKeyDown = (e) => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;

      // Delete selected objects
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Only handle if not in text editing mode
        const activeObject = canvas.getActiveObject();
        if (activeObject && activeObject.isEditing) {
          return; // Don't delete while editing text
        }

        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length > 0) {
          e.preventDefault(); // Prevent browser back navigation on Backspace
          activeObjects.forEach(obj => canvas.remove(obj));
          canvas.discardActiveObject();
          canvas.renderAll();
          saveAnnotations(canvas);
          saveHistory(canvas);
        }
      }

      // Undo (Ctrl+Z)
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undo(canvas);
      }

      // Redo (Ctrl+Y or Ctrl+Shift+Z)
      if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        redo(canvas);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive]);

  // Save canvas state to history
  const saveHistory = (canvas) => {
    const json = canvas.toJSON(['deltaLetter', 'cloudPath', 'customType']);
    historyRef.current = historyRef.current.slice(0, historyStepRef.current + 1);
    historyRef.current.push(json);
    historyStepRef.current = historyRef.current.length - 1;
  };

  // Undo function
  const undo = (canvas) => {
    if (historyStepRef.current > 0) {
      historyStepRef.current -= 1;
      loadCanvasFromHistory(canvas, historyRef.current[historyStepRef.current]);
    }
  };

  // Redo function
  const redo = (canvas) => {
    if (historyStepRef.current < historyRef.current.length - 1) {
      historyStepRef.current += 1;
      loadCanvasFromHistory(canvas, historyRef.current[historyStepRef.current]);
    }
  };

  // Load canvas state from history
  const loadCanvasFromHistory = async (canvas, state) => {
    if (!state) return;

    canvas.clear();
    await canvas.loadFromJSON(state);
    canvas.renderAll();
    saveAnnotations(canvas);
  };

  // Delete selected objects function
  const deleteSelected = (canvas) => {
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length > 0) {
      activeObjects.forEach(obj => canvas.remove(obj));
      canvas.discardActiveObject();
      canvas.renderAll();
      saveAnnotations(canvas);
      saveHistory(canvas);
    }
  };

  // Expose undo/redo/delete functions to parent
  useImperativeHandle(ref, () => ({
    undo: () => {
      const canvas = fabricCanvasRef.current;
      if (canvas) {
        undo(canvas);
      }
    },
    redo: () => {
      const canvas = fabricCanvasRef.current;
      if (canvas) {
        redo(canvas);
      }
    },
    deleteSelected: () => {
      const canvas = fabricCanvasRef.current;
      if (canvas) {
        deleteSelected(canvas);
      }
    }
  }));

  if (!isActive) {
    return null;
  }

  return (
    <div className={styles.annotationLayerContainer}>
      <canvas ref={canvasRef} className={styles.annotationCanvas} />
    </div>
  );
});

export default PdfAnnotationLayer;
