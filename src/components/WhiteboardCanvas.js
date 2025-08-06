// import React, { useRef, useEffect, useState } from 'react';

// const drawStroke = (ctx, stroke) => {
//   if (!stroke.points || stroke.points.length < 2) return;
//   ctx.strokeStyle = stroke.color || '#000';
//   ctx.lineWidth = stroke.lineWidth || 2;
//   ctx.beginPath();
//   ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
//   stroke.points.forEach(p => ctx.lineTo(p.x, p.y));
//   ctx.stroke();
// };

// export default function WhiteboardCanvas({ remoteStrokes = [], onLocalStroke, sessionId }) {
//   const canvasRef = useRef(null);
//   const ctxRef = useRef(null);
//   const [drawing, setDrawing] = useState(false);
//   const [currentStroke, setCurrentStroke] = useState([]);

//   // Initialize canvas
//   useEffect(() => {
//     const canvas = canvasRef.current;
//     canvas.width = window.innerWidth;
//     canvas.height = window.innerHeight;

//     const ctx = canvas.getContext('2d');
//     ctx.lineCap = 'round';
//     ctx.lineJoin = 'round';
//     ctxRef.current = ctx;
//   }, []);

//   // Render strokes from other users
//   useEffect(() => {
//     const ctx = ctxRef.current;
//     if (!ctx) return;
//     ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
//     remoteStrokes.forEach(stroke => drawStroke(ctx, stroke));
//   }, [remoteStrokes]);

//   // Handle drawing logic
//   const handlePointerDown = (e) => {
//     setDrawing(true);
//     const point = getRelativePoint(e);
//     setCurrentStroke([point]);
//   };

//   const handlePointerMove = (e) => {
//     if (!drawing) return;
//     const point = getRelativePoint(e);
//     const updatedStroke = [...currentStroke, point];
//     setCurrentStroke(updatedStroke);

//     // Real-time draw on local canvas
//     const ctx = ctxRef.current;
//     if (ctx) {
//       drawStroke(ctx, {
//         ...defaultStroke(),
//         points: updatedStroke.slice(-2), // only draw the new segment
//       });
//     }
//   };

//   const handlePointerUp = () => {
//     setDrawing(false);
//     if (currentStroke.length < 2) return;

//     const newStroke = {
//       ...defaultStroke(),
//       points: currentStroke,
//     };

//     if (onLocalStroke) {
//       onLocalStroke(newStroke); // Send to Firestore
//     }

//     setCurrentStroke([]);
//   };

//   const defaultStroke = () => ({
//     tool: 'pencil',
//     color: '#000',
//     lineWidth: 2,
//   });

//   const getRelativePoint = (e) => {
//     const rect = canvasRef.current.getBoundingClientRect();
//     const x = e.clientX || (e.touches?.[0]?.clientX ?? 0);
//     const y = e.clientY || (e.touches?.[0]?.clientY ?? 0);
//     return { x: x - rect.left, y: y - rect.top };
//   };

//   return (
//     <div style={{ position: 'relative', width: '100%', height: '100%' }}>
//       <canvas
//         ref={canvasRef}
//         onMouseDown={handlePointerDown}
//         onMouseMove={handlePointerMove}
//         onMouseUp={handlePointerUp}
//         onTouchStart={handlePointerDown}
//         onTouchMove={handlePointerMove}
//         onTouchEnd={handlePointerUp}
//         style={{
//           border: '1px solid #ccc',
//           width: '100%',
//           height: '100%',
//           touchAction: 'none'
//         }}
//       />
//     </div>
//   );
// }
