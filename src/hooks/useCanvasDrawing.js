// src/hooks/useCanvasDrawing.js

import { useState, useEffect, useCallback } from 'react';

const useCanvasDrawing = (canvasRef, contextRef, scale, sessionId, socket, backgroundSnapshot, setBackgroundSnapshot, saveState) => {
    const [tool, setTool] = useState('pen');
    const [color, setColor] = useState('#000000');
    const [lineWidth, setLineWidth] = useState(2);
    const [isDrawing, setIsDrawing] = useState(false);
    const [lineStart, setLineStart] = useState(null);
    const [circles, setCircles] = useState([]);
    const [pivotPoint, setPivotPoint] = useState(null);
    const [currentPoint, setCurrentPoint] = useState(null);
    const [stickyNotes, setStickyNotes] = useState([]);

    const [isDrawingCircle, setIsDrawingCircle] = useState(false);
    const [compassPosition, setCompassPosition] = useState({ x: 100, y: 100 });
    const [isDraggingCompass, setIsDraggingCompass] = useState(false);
    const [dragStartOffset, setDragStartOffset] = useState({ x: 0, y: 0 });
    const [compassAngle, setCompassAngle] = useState(0);
    const COMPASS_WIDTH = 100;
    const COMPASS_HEIGHT = 100;
    const [previousSnapshot, setPreviousSnapshot] = useState(null);
    const prevImg = new Image();


    const getScaledCoordinates = useCallback((e) => {
        // Corrected: Add a check for 'e' to prevent the undefined error
        if (!e || !canvasRef.current) return { x: 0, y: 0 };
        const rect = canvasRef.current.getBoundingClientRect();
        let clientX, clientY;

        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else if (e.changedTouches && e.changedTouches.length > 0) {
            clientX = e.changedTouches[0].clientX;
            clientY = e.changedTouches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        const x = (clientX - rect.left) / scale;
        const y = (clientY - rect.top) / scale;
        return { x, y };
    }, [canvasRef, scale]);

    const startDrawing = useCallback((e) => {
        if (!contextRef.current || tool === 'text') return;
        
        const { x, y } = getScaledCoordinates(e);

        if (tool === 'pen' || tool === 'eraser') {
            contextRef.current.beginPath();
            contextRef.current.moveTo(x, y);
            setIsDrawing(true);
        } else if (['line', 'rectangle', 'circle', 'arrow'].includes(tool)) {
            setLineStart({ x, y });
            setIsDrawing(true);
            // Capture the canvas state *before* starting to draw the temp shape
            setPreviousSnapshot(canvasRef.current.toDataURL());
        } else if (tool === 'stickyNote') {
            const newNote = {
                id: Date.now(),
                x,
                y,
                text: '',
                color: '#ffff00', // Default sticky note color
            };
            setStickyNotes(prevNotes => [...prevNotes, newNote]);
        }
        
        if (socket) {
            socket.emit('drawing', { room: sessionId, action: 'start', x, y, tool, color, lineWidth });
        }
    }, [contextRef, tool, getScaledCoordinates, socket, sessionId, color, lineWidth, setLineStart, setIsDrawing, setPreviousSnapshot, canvasRef, setStickyNotes]);

    const drawLine = useCallback((e) => {
        if (!isDrawing || !contextRef.current) return;
        const { x, y } = getScaledCoordinates(e);
        
        if (tool === 'pen') {
            contextRef.current.lineTo(x, y);
            contextRef.current.stroke();
            if (socket) {
                socket.emit('drawing', { room: sessionId, action: 'draw', x, y, tool, color, lineWidth });
            }
        } else if (tool === 'eraser') {
            contextRef.current.clearRect(x - lineWidth / 2, y - lineWidth / 2, lineWidth, lineWidth);
            if (socket) {
                socket.emit('drawing', { room: sessionId, action: 'draw', x, y, tool, color, lineWidth });
            }
        }
    }, [isDrawing, contextRef, getScaledCoordinates, tool, lineWidth, socket, sessionId, color]);
    
    // Helper function to draw an arrowhead
    const drawArrowhead = (ctx, from, to) => {
        const headlen = 10;
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const angle = Math.atan2(dy, dx);
        
        ctx.beginPath();
        ctx.moveTo(to.x, to.y);
        ctx.lineTo(to.x - headlen * Math.cos(angle - Math.PI / 6), to.y - headlen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(to.x, to.y);
        ctx.lineTo(to.x - headlen * Math.cos(angle + Math.PI / 6), to.y - headlen * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
        ctx.closePath();
    };

    // New function for real-time shape preview
    const drawShapePreview = useCallback((e) => {
        if (!isDrawing || !lineStart || !contextRef.current) return;
        const ctx = contextRef.current;
        const { x, y } = getScaledCoordinates(e);

        // Restore the canvas to the last saved state for the live preview
        if (previousSnapshot) {
            prevImg.src = previousSnapshot;
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            ctx.drawImage(prevImg, 0, 0);
        }

        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();

        if (tool === 'rectangle') {
            const width = x - lineStart.x;
            const height = y - lineStart.y;
            ctx.strokeRect(lineStart.x, lineStart.y, width, height);
        } else if (tool === 'circle') {
            const dx = x - lineStart.x;
            const dy = y - lineStart.y;
            const radius = Math.sqrt(dx * dx + dy * dy);
            ctx.arc(lineStart.x, lineStart.y, radius, 0, 2 * Math.PI);
            ctx.stroke();
        } else if (tool === 'line') {
            ctx.moveTo(lineStart.x, lineStart.y);
            ctx.lineTo(x, y);
            ctx.stroke();
        } else if (tool === 'arrow') {
            ctx.moveTo(lineStart.x, lineStart.y);
            ctx.lineTo(x, y);
            ctx.stroke();
            drawArrowhead(ctx, lineStart, { x, y });
        }
        
        ctx.closePath();
    }, [isDrawing, lineStart, contextRef, getScaledCoordinates, previousSnapshot, color, lineWidth, tool, canvasRef, prevImg]);


    const finishDrawing = useCallback((e) => {
        if (!isDrawing || !contextRef.current) return;
        const { x, y } = getScaledCoordinates(e);
        const ctx = contextRef.current;
        
        if (tool === 'pen' || tool === 'eraser') {
            ctx.closePath();
        } else if (lineStart) {
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.beginPath();
            
            // Draw the final shape here
            if (tool === 'line') {
                ctx.moveTo(lineStart.x, lineStart.y);
                ctx.lineTo(x, y);
                ctx.stroke();
            } else if (tool === 'rectangle') {
                const width = x - lineStart.x;
                const height = y - lineStart.y;
                ctx.strokeRect(lineStart.x, lineStart.y, width, height);
            } else if (tool === 'circle') {
                const dx = x - lineStart.x;
                const dy = y - lineStart.y;
                const radius = Math.sqrt(dx * dx + dy * dy);
                ctx.arc(lineStart.x, lineStart.y, radius, 0, 2 * Math.PI);
                ctx.stroke();
            } else if (tool === 'arrow') {
                ctx.moveTo(lineStart.x, lineStart.y);
                ctx.lineTo(x, y);
                ctx.stroke();
                drawArrowhead(ctx, lineStart, { x, y });
            }
            
            ctx.closePath();
        }
        
        setIsDrawing(false);
        setLineStart(null);
        setPreviousSnapshot(null); // Clear the snapshot once drawing is finished
        
        const snapshot = canvasRef.current.toDataURL();
        setBackgroundSnapshot(snapshot);

        if (socket) {
            socket.emit('drawing', { room: sessionId, action: 'finish', image: snapshot });
        }
        saveState();
    }, [isDrawing, contextRef, getScaledCoordinates, tool, lineStart, color, lineWidth, canvasRef, setBackgroundSnapshot, setLineStart, setIsDrawing, sessionId, socket]);
    
    
    const handleMouseDown = useCallback((e) => {
        if (!contextRef.current) return;
        
        // This unified function now handles all tool types
        startDrawing(e);

    }, [contextRef, getScaledCoordinates, compassPosition, pivotPoint, setIsDraggingCompass, setDragStartOffset, setPivotPoint, setIsDrawingCircle, setCurrentPoint, tool, canvasRef, startDrawing]);


    useEffect(() => {
        const handleMove = (e) => {
            if (!isDrawing || !contextRef.current) return;
            if (['pen', 'eraser'].includes(tool)) {
                drawLine(e);
            } else if (['line', 'rectangle', 'circle', 'arrow'].includes(tool)) {
                drawShapePreview(e);
            }
        };

        const handleUp = (e) => {
            finishDrawing(e);
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
        window.addEventListener('touchmove', handleMove);
        window.addEventListener('touchend', handleUp);
        
        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleUp);
        };
    }, [isDrawing, tool, drawLine, drawShapePreview, finishDrawing, contextRef]);


    return {
        tool, setTool,
        color, setColor,
        lineWidth, setLineWidth,
        isDrawing, setIsDrawing,
        circles, setCircles,
        stickyNotes, setStickyNotes,
        compassPosition, setCompassPosition,
        isDraggingCompass, setIsDraggingCompass,
        compassAngle,
        isDrawingCircle, setIsDrawingCircle,
        pivotPoint, setPivotPoint,
        currentPoint, setCurrentPoint,
        startDrawing, drawLine, finishDrawing, handleMouseDown,
        getScaledCoordinates
    };
};

export default useCanvasDrawing;