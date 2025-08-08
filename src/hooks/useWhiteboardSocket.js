// src/hooks/useWhiteboardSocket.js

import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

const useWhiteboardSocket = (
  sessionId,
  navigate,
  canvasRef,
  contextRef,
  socket,
  setSocket,
  setBackgroundSnapshot,
  setTextBoxes,
  setCircles,
  setLines, // Assuming you have a lines state for the 'finish-line' case
  senderIdRef // A ref to store the sender's ID if needed
) => {

  // Effect 1: Handle initial session ID and navigation
  useEffect(() => {
    if (!sessionId) {
      const newSessionId = uuidv4();
      navigate(`/whiteboard/${newSessionId}`, { replace: true });
    }
  }, [sessionId, navigate]);

  // Effect 2: Connect to the socket and join the room
  useEffect(() => {
    if (sessionId) {
      const newSocket = io(process.env.REACT_APP_API_URL);
      setSocket(newSocket);
      
      newSocket.emit('join-room', sessionId);
      console.log(`Socket joined room: ${sessionId}`);

      return () => {
        newSocket.disconnect();
        console.log(`Socket disconnected from room: ${sessionId}`);
      };
    }
  }, [sessionId, setSocket]);

  // Effect 3: Listen for incoming drawing events
  useEffect(() => {
    if (!socket || !contextRef.current) return;

    const ctx = contextRef.current;
    
    // Listen for drawing events from other clients
    socket.on('drawing', (data) => {
      // Prevent processing our own events
      if (data.senderId === socket.id) {
        return;
      }

      const { action, x, y, tool, color, lineWidth, image, lineStart } = data;

      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;

      switch (action) {
        case 'start':
          ctx.beginPath();
          ctx.moveTo(x, y);
          break;

        case 'draw':
          ctx.lineTo(x, y);
          ctx.stroke();
          break;

        case 'finish-line':
          ctx.beginPath();
          const dx = Math.abs(x - lineStart.x);
          const dy = Math.abs(y - lineStart.y);

          if (dx > dy) {
            ctx.moveTo(lineStart.x, lineStart.y);
            ctx.lineTo(x, lineStart.y);
          } else {
            ctx.moveTo(lineStart.x, lineStart.y);
            ctx.lineTo(lineStart.x, y);
          }
          ctx.stroke();
          ctx.closePath();
          break;

        case 'finish':
          setBackgroundSnapshot(image);
          break;

        case 'draw-circle':
          ctx.beginPath();
          ctx.arc(x, y, data.radius, 0, Math.PI * 2);
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.stroke();
          break;
      }
    });

    // Listen for new text boxes from other clients
    socket.on('text-box-created', (data) => {
      if (data.senderId === socket.id) {
        return;
      }
      const { textBox } = data;
      setTextBoxes(prev => [...prev, textBox]);
    });
    
    // Clean up event listeners on unmount
    return () => {
      socket.off('drawing');
      socket.off('text-box-created');
    };
  }, [socket, sessionId, contextRef, setBackgroundSnapshot, setTextBoxes, setCircles, setLines]);
};

export default useWhiteboardSocket;