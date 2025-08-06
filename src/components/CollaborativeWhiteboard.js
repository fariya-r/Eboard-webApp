// // src/components/CollaborativeWhiteboard.jsx
// import React, { useEffect, useRef, useState } from 'react';
// import WhiteboardCanvas from '../components/WhiteboardCanvas';
// import { addStrokeToSession, subscribeToStrokes } from '../services/realtimeService';
// import { useParams } from 'react-router-dom';

// export default function CollaborativeWhiteboard() {
//   const { sessionId } = useParams(); // URL like /collab/:sessionId
//   const [remoteStrokes, setRemoteStrokes] = useState([]);

//   useEffect(() => {
//     const unsubscribe = subscribeToStrokes(sessionId, (strokes) => {
//       setRemoteStrokes(strokes);
//     });

//     return () => unsubscribe();
//   }, [sessionId]);

//   const handleStroke = async (stroke) => {
//     await addStrokeToSession(sessionId, stroke); // Send to Firestore
//   };

//   return (
//     <div>
//       <h2 className="text-xl font-semibold mb-2">Real-time Whiteboard: {sessionId}</h2>
//       <WhiteboardCanvas
//         onLocalStroke={handleStroke}
//         remoteStrokes={remoteStrokes}
//       />
//     </div>
//   );
// }
