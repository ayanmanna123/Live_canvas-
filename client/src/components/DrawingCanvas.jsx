import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef, useReducer } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { nanoid } from 'nanoid';
import { getUserColor } from '../lib/userColor';

const initialState = {
  strokes: [],
  undoStack: [],
  redoStack: []
};

const canvasReducer = (state, action) => {
  switch (action.type) {
    case 'SET_HISTORY':
      return {
        ...state,
        strokes: action.history,
        undoStack: [],
        redoStack: []
      };

    case 'ADD_STROKE':
      // Local stroke: add to strokes and undo stack, clear redo
      return {
        ...state,
        strokes: [...state.strokes, action.stroke],
        undoStack: [...state.undoStack, action.stroke.id],
        redoStack: []
      };

    case 'REMOTE_STROKE':
      return {
        ...state,
        strokes: [...state.strokes, action.stroke]
      };

    case 'UNDO': {
      if (state.undoStack.length === 0) return state;
      const lastId = state.undoStack[state.undoStack.length - 1];
      const strokeToUndo = state.strokes.find(s => s.id === lastId);
      
      if (!strokeToUndo) return state;

      return {
        ...state,
        strokes: state.strokes.filter(s => s.id !== lastId),
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [...state.redoStack, strokeToUndo]
      };
    }

    case 'REDO': {
      if (state.redoStack.length === 0) return state;
      const strokeToRedo = state.redoStack[state.redoStack.length - 1];
      
      return {
        ...state,
        strokes: [...state.strokes, strokeToRedo],
        undoStack: [...state.undoStack, strokeToRedo.id],
        redoStack: state.redoStack.slice(0, -1)
      };
    }

    case 'DELETE_STROKE':
      return {
        ...state,
        strokes: state.strokes.filter(s => s.id !== action.strokeId),
        undoStack: state.undoStack.filter(id => id !== action.strokeId),
        redoStack: state.redoStack.filter(s => s.id !== action.strokeId)
      };

    case 'CLEAR_CANVAS':
      return initialState;

    default:
      return state;
  }
};

const DrawingCanvas = forwardRef(({ roomId, userName, color, size, tool, onPan, showRopes }, ref) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const textareaRef = useRef(null);
  const contextRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [lastPanPos, setLastPanPos] = useState({ x: 0, y: 0 });
  
  // Consolidated Canvas State (Strokes + History)
  const [state, dispatch] = useReducer(canvasReducer, initialState);
  const { strokes, undoStack, redoStack } = state;
  
  // Text Input State
  const [textInput, setTextInput] = useState(null); // { x, y, value, worldX, worldY }
  
  const currentStroke = useRef(null);
  const deletedStrokesThisSession = useRef(new Set());
  const { socket } = useSocket();

  // Focus textarea when it appears
  useEffect(() => {
    if (textInput && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [textInput]);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    undo: () => {
      // Find the stroke to undo before dispatching to handle signaling
      if (undoStack.length === 0) return;
      const lastId = undoStack[undoStack.length - 1];
      
      dispatch({ type: 'UNDO' });
      
      if (socket) {
        socket.emit('delete-stroke', { roomId, strokeId: lastId });
      }
    },
    redo: () => {
      if (redoStack.length === 0) return;
      const strokeToRedo = redoStack[redoStack.length - 1];
      
      dispatch({ type: 'REDO' });
      
      if (socket) {
        socket.emit('draw', { roomId, stroke: strokeToRedo });
      }
    },
    getPanOffset: () => panOffset,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0
  }));

  // Initialize Canvas
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!canvas || !container) return;
      
      const { width, height } = container.getBoundingClientRect();
      canvas.width = width * 2;
      canvas.height = height * 2;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      
      const context = canvas.getContext('2d');
      context.scale(2, 2);
      context.lineCap = 'round';
      context.lineJoin = 'round';
      contextRef.current = context;
      redrawCanvas();
    };

    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    
    return () => resizeObserver.disconnect();
  }, []);

  const setBrushStyle = (ctx, stroke) => {
    ctx.globalAlpha = 1;
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (stroke.type === 'text') {
      ctx.font = `bold ${stroke.size * 2}px Roboto, sans-serif`;
      ctx.fillStyle = stroke.color;
      ctx.textBaseline = 'middle';
      return;
    }

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

    const { width, height } = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, width, height);
    
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    
    // Draw ropes first (behind text and strokes)
    if (showRopes) {
      const textStrokesByUser = strokes
        .filter(s => s.type === 'text')
        .reduce((acc, s) => {
          // Use userId, or socket.id as fallback, or 'anonymous'
          const uid = s.userId || 'anonymous';
          if (!acc[uid]) acc[uid] = [];
          acc[uid].push(s);
          return acc;
        }, {});

      Object.entries(textStrokesByUser).forEach(([uid, userStrokes]) => {
        if (userStrokes.length < 2) return;
        
        ctx.save();
        ctx.beginPath();
        const uColor = getUserColor(uid);
        ctx.strokeStyle = uColor;
        ctx.lineWidth = 4; // Slightly thicker
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.setLineDash([8, 6]); // More distinct dashed style
        ctx.globalAlpha = 0.7;
        ctx.shadowBlur = 6;
        ctx.shadowColor = uColor;

        for (let i = 0; i < userStrokes.length - 1; i++) {
          const p1 = userStrokes[i].points[0];
          const p2 = userStrokes[i+1].points[0];
          
          if (!p1 || !p2) continue;

          ctx.moveTo(p1.x, p1.y);
          
          // Calculate control point for the "carve" (curve)
          const mx = (p1.x + p2.x) / 2;
          const my = (p1.y + p2.y) / 2;
          const dist = Math.sqrt((p2.x - p1.x)**2 + (p2.y - p1.y)**2);
          const hang = Math.min(dist * 0.25, 100); // Dynamic hang
          
          ctx.quadraticCurveTo(mx, my + hang, p2.x, p2.y);
        }
        ctx.stroke();
        ctx.restore();
      });
    }

    strokes.forEach(stroke => {
      if (stroke.type === 'text') {
        ctx.save();
        setBrushStyle(ctx, stroke);
        ctx.fillText(stroke.content, stroke.points[0].x, stroke.points[0].y);
        ctx.restore();
        return;
      }

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
    // Increased radius for better feel (base size * 3 + 5px buffer)
    const eraseRadius = (size * 3) + 5;
    
    strokes.forEach(stroke => {
      // Don't try to delete the same stroke multiple times in one drag
      if (deletedStrokesThisSession.current.has(stroke.id)) return;

      let collided = false;
      if (stroke.type === 'text') {
        const dist = Math.sqrt((worldX - stroke.points[0].x) ** 2 + (worldY - stroke.points[0].y) ** 2);
        // Larger buffer for text collision
        if (dist < eraseRadius + 15) collided = true;
      } else {
        for (let i = 0; i < stroke.points.length - 1; i++) {
          const dist = getDistancePointToSegment(
            worldX, worldY, 
            stroke.points[i].x, stroke.points[i].y, 
            stroke.points[i+1].x, stroke.points[i+1].y
          );
          // Combine eraser radius with stroke width for accurate hit testing
          if (dist < eraseRadius + (stroke.size / 2)) {
            collided = true;
            break;
          }
        }
      }

      if (collided) {
        deletedStrokesThisSession.current.add(stroke.id);
        dispatch({ type: 'DELETE_STROKE', strokeId: stroke.id });
        socket.emit('delete-stroke', { roomId, strokeId: stroke.id });
      }
    });
  };

  // Socket Listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('draw-remote', (stroke) => {
      dispatch({ type: 'REMOTE_STROKE', stroke });
    });

    socket.on('canvas-history', (history) => {
      const formattedHistory = history.map(s => ({
        id: s.id || s._id,
        userId: s.userId,
        points: s.points,
        color: s.color,
        size: s.size,
        tool: s.tool,
        type: s.type,
        content: s.content
      }));
      dispatch({ type: 'SET_HISTORY', history: formattedHistory });
    });

    socket.on('delete-stroke-remote', (strokeId) => {
      dispatch({ type: 'DELETE_STROKE', strokeId });
    });

    socket.on('clear-canvas-remote', () => {
      dispatch({ type: 'CLEAR_CANVAS' });
    });

    return () => {
      socket.off('draw-remote');
      socket.off('canvas-history');
      socket.off('delete-stroke-remote');
      socket.off('clear-canvas-remote');
    };
  }, [socket, roomId]);

  const startInteraction = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    // Panning interaction (Middle click, Right click, or Shift key)
    if (e.button === 1 || e.button === 2 || tool === 'pan' || (e.shiftKey)) {
      setIsPanning(true);
      setLastPanPos({ x: offsetX, y: offsetY });
      return;
    }

    if (tool === 'text') return; // Handled in stopInteraction or Click

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
      userId: socket.id, // Track local user
      type: 'freehand',
      points: [{ x: worldX, y: worldY }],
      color,
      size,
      tool
    };
  };

  const performInteraction = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    // Broadcast cursor position in world space
    if (socket) {
      socket.emit('cursor-move', {
        roomId,
        userName,
        position: { x: offsetX - panOffset.x, y: offsetY - panOffset.y }
      });
    }

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
    if (tool === 'text') return; 

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

  const handleCanvasClick = (e) => {
    if (tool !== 'text') return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    const worldX = offsetX - panOffset.x;
    const worldY = offsetY - panOffset.y;

    setTextInput({
      x: offsetX,
      y: offsetY,
      worldX,
      worldY,
      value: ''
    });
  };

  const stopInteraction = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (!isDrawing) return;
    setIsDrawing(false);
    deletedStrokesThisSession.current.clear();

    if (tool === 'eraser' || tool === 'text') return;

    if (currentStroke.current && currentStroke.current.points.length >= 2) {
      const finalStroke = { ...currentStroke.current };
      dispatch({ type: 'ADD_STROKE', stroke: finalStroke });
      socket.emit('draw', { roomId, stroke: finalStroke });
    }
    currentStroke.current = null;
  };

  const handleTextCommit = (e) => {
    // Only commit if they pressed Enter or we explicitly want to on blur
    if ((e.key === 'Enter' && !e.shiftKey) || e.type === 'blur') {
      const val = textInput?.value?.trim();
      if (val) {
        const textStroke = {
          id: nanoid(),
          userId: socket.id,
          type: 'text',
          content: val,
          points: [{ x: textInput.worldX, y: textInput.worldY }],
          color,
          size: size * 2.5,
          tool: 'text'
        };
        dispatch({ type: 'ADD_STROKE', stroke: textStroke });
        socket.emit('draw', { roomId, stroke: textStroke });
        setTextInput(null);
      } else if (e.type === 'blur') {
        // Only close empty input on blur if it wasn't just opened
        // But for simplicity, let's just close it if it's empty on blur
        setTextInput(null);
      }
    } else if (e.key === 'Escape') {
      setTextInput(null);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      <canvas
        ref={canvasRef}
        onPointerDown={startInteraction}
        onPointerMove={performInteraction}
        onPointerUp={stopInteraction}
        onPointerLeave={stopInteraction}
        onClick={handleCanvasClick}
        onContextMenu={(e) => e.preventDefault()}
        className={`block touch-none ${isPanning ? 'cursor-grabbing' : tool === 'pan' ? 'cursor-grab' : tool === 'text' ? 'cursor-text' : 'cursor-crosshair'}`}
      />
      
      {textInput && (
        <div 
          className="absolute z-[100]"
          style={{ 
            left: textInput.x, 
            top: textInput.y,
            transform: 'translate(-4px, -50%)'
          }}
        >
          <div className="bg-white border-4 border-md-primary rounded-lg shadow-[0_0_30px_rgba(0,0,0,0.6)] p-1 flex flex-col gap-1 min-w-[200px]">
            <textarea
              ref={textareaRef}
              autoFocus
              placeholder="Type your text..."
              value={textInput.value}
              onChange={(e) => setTextInput({ ...textInput, value: e.target.value })}
              onKeyDown={handleTextCommit}
              onBlur={handleTextCommit}
              onPointerDown={(e) => e.stopPropagation()}
              className="p-2 text-black focus:outline-none resize-none overflow-hidden h-auto block leading-tight font-sans bg-transparent"
              style={{ 
                fontSize: `${size * 2.5}px`,
                minHeight: `${size * 4}px`
              }}
              rows={1}
            />
            <div className="flex justify-end p-1 border-t border-gray-100">
               <button 
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevent blur before commit
                  handleTextCommit({ key: 'Enter', type: 'click' });
                }}
                className="px-3 py-1 bg-md-primary text-white text-xs rounded-full hover:brightness-110 active:scale-95 transition-all font-bold"
               >
                 DONE
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default DrawingCanvas;
