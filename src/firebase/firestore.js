// src/firebase/firestore.js
import { db } from './firebase';
import {
  collection, addDoc, onSnapshot, serverTimestamp, query, orderBy
} from 'firebase/firestore';

export const addStroke = async (docId, stroke) => {
  await addDoc(collection(db, 'whiteboards', docId, 'strokes'), {
    ...stroke,
    createdAt: serverTimestamp()
  });
};

export const listenToStrokes = (docId, onUpdate) => {
  const q = query(
    collection(db, 'whiteboards', docId, 'strokes'),
    orderBy('createdAt')
  );

  return onSnapshot(q, (snapshot) => {
    const strokes = snapshot.docs.map(doc => doc.data());
    onUpdate(strokes);
  });
};
