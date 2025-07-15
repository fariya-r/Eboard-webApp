// src/services/whiteboardService.js
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  where,
} from 'firebase/firestore';

import { db } from '../firebase/firebase';
import { getAuth } from 'firebase/auth';

// Save a new whiteboard (including textBoxes)
export const saveWhiteboard = async (dataUrl, tool, color, lineWidth, textBoxes) => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('User not logged in');

  const docRef = await addDoc(collection(db, 'whiteboards'), {
    uid: user.uid,
    snapshot: dataUrl,
    tool,
    color,
    lineWidth,
    textBoxes, // ✅ Add this
    createdAt: new Date(),
  });

  return docRef.id;
};

// Get whiteboards for current user only
export const getWhiteboards = async () => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) throw new Error('User not logged in');

  const q = query(
    collection(db, 'whiteboards'),
    where('uid', '==', user.uid),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// Update an existing whiteboard (including textBoxes)
export const updateWhiteboard = async (id, dataUrl, tool, color, lineWidth, textBoxes) => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('User not logged in');

  const docRef = doc(db, 'whiteboards', id);
  await updateDoc(docRef, {
    snapshot: dataUrl,
    tool,
    color,
    lineWidth,
    textBoxes, // ✅ Update with boxes
    createdAt: new Date(),
  });
};

// Delete whiteboard
export const deleteWhiteboard = async (id) => {
  const docRef = doc(db, 'whiteboards', id);
  await deleteDoc(docRef);
};
