import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { nanoid } from 'nanoid';

const DrawingCanvas = forwardRef(({ roomId, userName, color, size, tool, onPan }, ref) => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [lastPanPos, setLastPanPos] = useState({ x: 0, y: 0 });
  const [strokes, setStrokes] = useState([]);
  
  // Undo/Redo State
  const [undoStack, setUndoStack] = useState([]); // Array of IDs created by THIS user
  const [redoStack, setRedoStack] = useState([]); // Array of full stroke objects
  
  const currentStroke = useRef(null);
  const { socket } = useSocket();

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    undo: () => {
      if (undoStack.length === 0) return;
      const lastStrokeId = undoStack[undoStack.length - 1];
      const strokeToUndo = strokes.find(s => s.id === lastStrokeId);
      
      if (strokeToUndo) {
        setRedoStack(prev => [...prev, strokeToUndo]);
        setUndoStack(prev => prev.slice(0, -1));
        setStrokes(prev => prev.filter(s => s.id !== lastStrokeId));
        socket.emit('delete-stroke', { roomId, strokeId: lastStrokeId });
      }
    },
    redo: () => {
      if (redoStack.length === 0) return;
      const strokeToRedo = redoStack[redoStack.length - 1];
      setRedoStack(prev => prev.slice(0, -1));
      setUndoStack(prev => [...prev, strokeToRedo.id]);
      setStrokes(prev => [...prev, strokeToRedo]);
      socket.emit('draw', { roomId, stroke: strokeToRedo });
    },
    getPanOffset: () => panOffset,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0
  }));

  // Initialize Canvas
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = window.innerWidth * 2;
      canvas.height = window.innerHeight * 2;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      const context = canvas.getContext('2d');
      context.scale(2, 2);
      context.lineCap = 'round';
      context.lineJoin = 'round';
      contextRef.current = context;
      redrawCanvas();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const setBrushStyle = (ctx, stroke) => {
    ctx.globalAlpha = 1;
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (stroke.tool) {
      case 'highlighter':
        ctx.globalAlpha = 0.5;
        ctx.lineCap = 'butt';
        ctx.lineJoin = 'bevel';
        break;
      case 'neon':
        ctx.shadowBlur = stroke.size * 1.5;
        ctx.shadowColor = stroke.color;
        break;
      case 'dotted':
        ctx.setLineDash([1, stroke.size * 2]);
        break;
      default:
        break;
    }
  };

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width / 2, canvas.height / 2);
    
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    
    strokes.forEach(stroke => {
      if (stroke.points.length < 2) return;
      
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      
      setBrushStyle(ctx, stroke);
      
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
      ctx.restore();
    });
    
    ctx.restore();
  }, [strokes, panOffset]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Point-to-segment distance helper
  const getDistancePointToSegment = (px, py, x1, y1, x2, y2) => {
    const l2 = (x1 - x2) ** 2 + (y1 - y2) ** 2;
    if (l2 === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.sqrt((px - (x1 + t * (x2 - x1))) ** 2 + (py - (y1 + t * (y2 - y1))) ** 2);
  };

  const handleEraserCollision = (worldX, worldY) => {
    const eraseRadius = size * 2;
    let found = false;
    
    setStrokes(prevStrokes => {
      const remainingStrokes = prevStrokes.filter(stroke => {
        for (let i = 0; i < stroke.points.length - 1; i++) {
          const dist = getDistancePointToSegment(
            worldX, worldY, 
            stroke.points[i].x, stroke.points[i].y, 
            stroke.points[i+1].x, stroke.points[i+1].y
          );
          if (dist < eraseRadius + (stroke.size / 2)) {
            socket.emit('delete-stroke', { roomId, strokeId: stroke.id });
            setUndoStack(prev => prev.filter(id => id !== stroke.id));
            found = true;
            return false;
          }
        }
        return true;
      });
      return found ? remainingStrokes : prevStrokes;
    });
  };

  // Socket Listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('draw-remote', (stroke) => {
      setStrokes(prev => [...prev, stroke]);
    });

    socket.on('canvas-history', (history) => {
      const formattedHistory = history.map(s => ({
        id: s._id || s.id,
        points: s.points,
        color: s.color,
        size: s.size,
        tool: s.tool
      }));
      setStrokes(formattedHistory);
    });

    socket.on('delete-stroke-remote', (strokeId) => {
      setStrokes(prev => prev.filter(s => s.id !== strokeId));
      setUndoStack(prev => prev.filter(id => id !== strokeId));
    });

    socket.on('clear-canvas-remote', () => {
      setStrokes([]);
      setUndoStack([]);
      setRedoStack([]);
    });

    return () => {
      socket.off('draw-remote');
      socket.off('canvas-history');
      socket.off('delete-stroke-remote');
      socket.off('clear-canvas-remote');
    };
  }, [socket, roomId]);

  const startInteraction = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;
    
    // Panning interaction (Middle click, Right click, or Shift key)
    if (e.button === 1 || e.button === 2 || tool === 'pan' || (e.shiftKey)) {
      setIsPanning(true);
      setLastPanPos({ x: offsetX, y: offsetY });
      return;
    }

    const worldX = offsetX - panOffset.x;
    const worldY = offsetY - panOffset.y;

    if (tool === 'eraser') {
      setIsDrawing(true);
      handleEraserCollision(worldX, worldY);
      return;
    }

    setIsDrawing(true);
    currentStroke.current = {
      id: nanoid(),
      points: [{ x: worldX, y: worldY }],
      color,
      size,
      tool
    };
  };

  const performInteraction = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;

    // Broadcast cursor position in world space
    socket.emit('cursor-move', {
      roomId,
      userName,
      position: { x: offsetX - panOffset.x, y: offsetY - panOffset.y }
    });

    if (isPanning) {
      const dx = offsetX - lastPanPos.x;
      const dy = offsetY - lastPanPos.y;
      const newOffset = { x: panOffset.x + dx, y: panOffset.y + dy };
      setPanOffset(newOffset);
      onPan?.(newOffset);
      setLastPanPos({ x: offsetX, y: offsetY });
      return;
    }

    if (!isDrawing) return;

    const worldX = offsetX - panOffset.x;
    const worldY = offsetY - panOffset.y;

    if (tool === 'eraser') {
      handleEraserCollision(worldX, worldY);
      return;
    }

    const newPoint = { x: worldX, y: worldY };
    currentStroke.current.points.push(newPoint);
    
    // Immediate localized feedback
    const ctx = contextRef.current;
    if (ctx) {
      ctx.save();
      ctx.translate(panOffset.x, panOffset.y);
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
      setBrushStyle(ctx, currentStroke.current);
      
      const pts = currentStroke.current.points;
      ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
      ctx.stroke();
      ctx.restore();
    }
  };

  const stopInteraction = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (!isDrawing) return;
    setIsDrawing(false);

    if (tool === 'eraser') return;

    if (currentStroke.current && currentStroke.current.points.length >= 2) {
      const finalStroke = { ...currentStroke.current };
      setStrokes(prev => [...prev, finalStroke]);
      setUndoStack(prev => [...prev, finalStroke.id]);
      setRedoStack([]); 
      socket.emit('draw', { roomId, stroke: finalStroke });
    }
    currentStroke.current = null;
  };

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={startInteraction}
      onPointerMove={performInteraction}
      onPointerUp={stopInteraction}
      onPointerLeave={stopInteraction}
      onContextMenu={(e) => e.preventDefault()}
      className={`block bg-md-background touch-none ${isPanning ? 'cursor-grabbing' : tool === 'pan' ? 'cursor-grab' : 'cursor-crosshair'}`}
    />
  );
});

export default DrawingCanvas;
