import React, { useRef, useState } from 'react';
import axios from 'axios';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dus9iefbh/video/upload';
const UPLOAD_PRESET = 'whiteboard_upload';

const CanvasRecorder = ({ canvasRef }) => {
  const mediaRecorderRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();
  const chunks = useRef([]);

  const startRecording = () => {
    if (!canvasRef?.current) {
      alert('❗ Canvas not found.');
      return;
    }

    chunks.current = [];

    const stream = canvasRef.current.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.current.push(e.data);
    };

    recorder.onstop = async () => {
      const blob = new Blob(chunks.current, { type: 'video/webm' });
      const file = new File([blob], 'recording.webm', { type: 'video/webm' });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);

      setIsUploading(true);
      try {
        const res = await axios.post(CLOUDINARY_URL, formData);
        const downloadURL = res.data.secure_url;

        // Optional: Auth check
        const auth = getAuth();
        const user = auth.currentUser;

        await addDoc(collection(db, 'recordings'), {
          url: downloadURL,
          createdAt: serverTimestamp(),
          uid: user?.uid || null, // optional
        });

        alert('✅ Recording uploaded successfully!');
      } catch (error) {
        console.error('❌ Upload Error:', error);
        alert('Upload failed. Please try again.');
      } finally {
        setIsUploading(false);
      }
    };

    mediaRecorderRef.current = recorder;
    recorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {!isRecording ? (
        <button
          onClick={startRecording}
          disabled={isUploading}
          className="px-2 py-1 bg-green-500 text-white rounded text-xs"
        >
          {isUploading ? 'Uploading...' : '🔴 Start'}
        </button>
      ) : (
        <button
          onClick={stopRecording}
          className="px-2 py-1 bg-red-500 text-white rounded text-xs"
        >
          ⏹️ Stop
        </button>
      )}
      <button
        onClick={() => navigate('/recordings')}
        className="text-xs px-2 py-1 bg-gray-300 rounded hover:bg-gray-400"
      >
        🎞 View Recordings
      </button>
    </div>
  );
};

export default CanvasRecorder;
