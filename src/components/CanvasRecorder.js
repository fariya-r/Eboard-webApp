import React, { useRef, useState } from 'react';
import axios from 'axios';
import { getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const UPLOAD_URL = `${process.env.REACT_APP_API_URL}/upload-recording`;

const CanvasRecorder = () => {
  const mediaRecorderRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();
  const chunks = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' },
        audio: true, // Optional: add audio if needed
      });

      chunks.current = [];

      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunks.current, { type: 'video/webm' });
        const file = new File([blob], 'recording.webm', { type: 'video/webm' });

        const formData = new FormData();
        formData.append('file', file);

        setIsUploading(true);
        try {
          const res = await axios.post(UPLOAD_URL, formData);
          const { fileUrl } = res.data;

          // Optional: Save metadata in Firestore here if needed
          const auth = getAuth();
          const user = auth.currentUser;
          console.log('Uploaded:', fileUrl, user?.email);

          alert('✅ Recording saved!');
        } catch (err) {
          console.error('Upload error:', err);
          alert('❌ Upload failed.');
        } finally {
          setIsUploading(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);

      // Stop if user ends screen share manually
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        stopRecording();
      });
    } catch (err) {
      console.error('Recording failed:', err);
      alert('❗ Screen recording permission denied or failed.');
    }
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
