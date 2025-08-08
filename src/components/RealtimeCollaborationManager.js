import React, { useRef, useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const RealtimeCollaborationManager = () => {
    // ... (All your existing state and refs) ...
    const canvasRef = useRef(null);
    const contextRef = useRef(null);
    const [tool, setTool] = useState('pen');
    const [isDrawing, setIsDrawing] = useState(false);
    const [isPanning, setIsPanning] = useState(false);
    const [lastPanPos, setLastPanPos] = useState({ x: 0, y: 0 });
    const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
    const [color, setColor] = useState('#000000');
    const [lineWidth, setLineWidth] = useState(2);
    const [scale, setScale] = useState(1);
    const [history, setHistory] = useState([]);
    const [redoStack, setRedoStack] = useState([]);
    const [socket, setSocket] = useState(null);
    const [room, setRoom] = useState(null);

    // Socket Connection
    useEffect(() => {
      const newSocket = io(process.env.REACT_APP_API_URL);
      setSocket(newSocket);
        return () => newSocket.disconnect();
    }, []);

    // Socket Event Listeners
    useEffect(() => {
        if (!socket) return;
        
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = contextRef.current;

        socket.on('draw', (data) => {
            context.strokeStyle = data.color;
            context.lineWidth = data.lineWidth;

            if (data.action === 'start') {
                context.beginPath();
                context.moveTo(data.x, data.y);
            } else if (data.action === 'draw') {
                context.lineTo(data.x, data.y);
                context.stroke();
            } else if (data.action === 'finish') {
                context.closePath();
            } else if (data.action === 'erase') {
                context.clearRect(data.x, data.y, data.width, data.height);
            }
        });

        socket.on('initial-state', (initialState) => {
            const image = new Image();
            image.src = initialState;
            image.onload = () => {
                context.clearRect(0, 0, canvas.width, canvas.height);
                context.drawImage(image, 0, 0);
            };
        });

        // Set up room from URL on initial load
        const urlParams = new URLSearchParams(window.location.search);
        const roomId = urlParams.get('room');
        if (roomId) {
            setRoom(roomId);
            socket.emit('join-room', roomId);
        }

    }, [socket]);

    // Initialize Canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        canvas.width = 3000;
        canvas.height = 3000;
        const context = canvas.getContext('2d');
        context.lineCap = 'round';
        context.lineJoin = 'round';
        contextRef.current = context;
        setHistory([canvas.toDataURL()]);
    }, []);

    // ... (rest of your useEffect for color/lineWidth, redrawCanvas, getCanvasCoordinates) ...
    useEffect(() => {
      const context = contextRef.current;
      if (context) {
        context.strokeStyle = color;
        context.lineWidth = lineWidth;
      }
    }, [color, lineWidth]);
    const redrawCanvas = (imageSrc, currentOffset) => {
      const canvas = canvasRef.current;
      const context = contextRef.current;
      if (!context) return;
      context.clearRect(0, 0, canvas.width, canvas.height);
      if (imageSrc) {
        const img = new Image();
        img.src = imageSrc;
        img.onload = () => {
          context.drawImage(img, currentOffset.x, currentOffset.y);
        };
      }
    };
    const getCanvasCoordinates = (clientX, clientY) => {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = (clientX - rect.left) / scale - canvasOffset.x;
      const y = (clientY - rect.top) / scale - canvasOffset.y;
      return { x, y };
    };

    // --- Core Functions ---

    const startDrawing = ({ nativeEvent }) => {
        const { clientX, clientY } = nativeEvent;
        const { x, y } = getCanvasCoordinates(clientX, clientY);

        if (tool === 'pan') {
            setIsPanning(true);
            setLastPanPos({ x: clientX, y: clientY });
        } else { // Pen or Eraser
            contextRef.current.beginPath();
            contextRef.current.moveTo(x, y);
            setIsDrawing(true);
            if (socket && room) {
                socket.emit('drawing', { action: 'start', x, y, color, lineWidth, room });
            }
        }
    };
    
    const finishDrawing = () => {
        if (isDrawing) {
            contextRef.current.closePath();
            // Emit the finish event and the final image state
            if (socket && room) {
                const finalImage = canvasRef.current.toDataURL();
                socket.emit('drawing', { action: 'finish', room, image: finalImage });
            }
        }
        setIsDrawing(false);
        setIsPanning(false);
    };

    const draw = ({ nativeEvent }) => {
        const { clientX, clientY } = nativeEvent;

        if (isPanning && tool === 'pan') {
            const dx = clientX - lastPanPos.x;
            const dy = clientY - lastPanPos.y;
            setCanvasOffset((prev) => {
                const newOffset = { x: prev.x + dx, y: prev.y + dy };
                const currentSnapshot = history[history.length - 1];
                if (currentSnapshot) {
                    redrawCanvas(currentSnapshot, newOffset);
                }
                return newOffset;
            });
            setLastPanPos({ x: clientX, y: clientY });
            return;
        }

        if (!isDrawing) return;

        const { x, y } = getCanvasCoordinates(clientX, clientY);
        
        if (tool === 'pen') {
            contextRef.current.lineTo(x, y);
            contextRef.current.stroke();
            if (socket && room) {
                socket.emit('drawing', { action: 'draw', x, y, room, color, lineWidth });
            }
        } else if (tool === 'eraser') {
            contextRef.current.clearRect(x - lineWidth / 2, y - lineWidth / 2, lineWidth, lineWidth);
            if (socket && room) {
                socket.emit('drawing', {
                    action: 'erase',
                    x: x - lineWidth / 2,
                    y: y - lineWidth / 2,
                    width: lineWidth,
                    height: lineWidth,
                    room,
                });
            }
        }
    };
    
    // ... (rest of your functions like generateShareLink, handleUndo, handleRedo, handleZoom) ...
    const generateShareLink = () => {
      const newRoomId = Math.random().toString(36).substring(2, 9);
      window.history.pushState(null, '', `?room=${newRoomId}`);
      setRoom(newRoomId);
      if (socket) {
        socket.emit('join-room', newRoomId);
      }
      alert(`Share this link: ${window.location.href}`);
    };
    const handleUndo = () => { /* ... */ };
    const handleRedo = () => { /* ... */ };
    const handleZoom = (factor) => { /* ... */ };

    return (
      // ... (your JSX) ...
      <div className="relative w-screen h-screen overflow-hidden bg-gray-100 flex justify-center items-center">
        <canvas
          ref={canvasRef}
          style={{
            width: `${canvasRef.current ? canvasRef.current.width * scale : 3000 * scale}px`,
            height: `${canvasRef.current ? canvasRef.current.height * scale : 3000 * scale}px`,
            transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px)`
          }}
          onMouseDown={startDrawing}
          onMouseUp={finishDrawing}
          onMouseLeave={finishDrawing}
          onMouseMove={draw}
          className="absolute top-0 left-0 cursor-crosshair"
        />

        <div className="fixed bottom-0 w-full bg-white p-2 shadow-inner flex justify-around items-center z-50">
          <button onClick={() => setTool('pen')} className={`btn ${tool === 'pen' ? 'bg-blue-200' : ''}`}>🖊️ Pen</button>
          <button onClick={() => setTool('eraser')} className={`btn ${tool === 'eraser' ? 'bg-blue-200' : ''}`}>🧽 Eraser</button>
          <button onClick={() => setTool('pan')} className={`btn ${tool === 'pan' ? 'bg-blue-200' : ''}`}>✋ Pan</button>
          <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-8 h-8 cursor-pointer" />
          <input
            type="range"
            min="1"
            max="30"
            value={lineWidth}
            onChange={e => setLineWidth(Number(e.target.value))}
            className="w-24"
          />
          <button onClick={handleUndo} className="btn" disabled={history.length <= 1}>↩️ Undo</button>
          <button onClick={handleRedo} className="btn" disabled={redoStack.length === 0}>↪️ Redo</button>
          <button onClick={() => handleZoom(1.2)} className="btn">➕ Zoom In</button>
          <button onClick={() => handleZoom(0.8)} className="btn">➖ Zoom Out</button>
          <button onClick={generateShareLink} className="btn">🔗 Get Share Link</button>
        </div>
      </div>
    );
};

export default RealtimeCollaborationManager;