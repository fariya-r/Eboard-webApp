// src/services/MediaService.js
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '../firebase/firebase';

export const uploadMediaFile = async (file, whiteboardId) => {
  const storageRef = ref(storage, `whiteboards/${whiteboardId}/${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);

  return {
    fileName: file.name,
    contentType: file.type,
    downloadURL,
    uploadedAt: new Date().toISOString(),
  };
};

export const saveMediaMetadata = async (whiteboardId, metadata) => {
  const mediaRef = collection(db, 'whiteboards', whiteboardId, 'media');
  await addDoc(mediaRef, {
    ...metadata,
    uploadedAt: serverTimestamp(),
  });
};
