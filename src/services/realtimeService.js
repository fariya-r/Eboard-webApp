// src/services/realtimeService.js
import {
    collection,
    addDoc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp,
  } from 'firebase/firestore';
  import { db } from '../firebase/firebase';
  
  // Add stroke to session
  export const addStrokeToSession = async (sessionId, stroke) => {
    const sessionRef = collection(db, 'sessions', sessionId, 'strokes');
    await addDoc(sessionRef, {
      ...stroke,
      createdAt: serverTimestamp(),
    });
  };
  
  // Listen to real-time strokes
  export const subscribeToStrokes = (sessionId, callback) => {
    const strokesRef = collection(db, 'sessions', sessionId, 'strokes');
    const q = query(strokesRef, orderBy('createdAt'));
  
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const strokes = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(strokes);
    });
  
    return unsubscribe;
  };
  