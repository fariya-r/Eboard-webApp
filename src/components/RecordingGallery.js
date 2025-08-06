import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaShareAlt, FaTrash, FaCalendarAlt } from 'react-icons/fa';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { useNavigate } from 'react-router-dom';

import Header from './Header';
const RecordingGallery = () => {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const API_BASE = 'http://localhost:5000/api';

  const fetchRecordings = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/recordings');
      setRecordings(res.data);
    } catch (error) {
      console.error('⚠️ Failed to fetch recordings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (filename) => {
    if (!window.confirm('Are you sure you want to delete this recording?')) return;

    try {
      await axios.post('http://localhost:5000/api/delete-recording', { filename });
      alert('✅ Recording deleted');
      fetchRecordings();
    } catch (err) {
      console.error('Delete failed:', err);
      alert('❌ Failed to delete the recording');
    }
  };

  const handleCopyLink = (url) => {
    if (!document.hasFocus()) {
      alert('Please click the window to activate it before copying.');
      return;
    }

    navigator.clipboard.writeText(url)
      .then(() => alert('🔗 Link copied to clipboard!'))
      .catch((err) => {
        console.error('Clipboard error:', err);
        alert('Failed to copy link.');
      });
  };

  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  useEffect(() => {
    fetchRecordings();
    window.addEventListener('click', () => window.focus());
  }, []);
  

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
<Header
        handleLogout={handleLogout}
        title="My Recordings" // <-- Here is the custom title
      />
      
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
        </div>
      ) : recordings.length === 0 ? (
        <div className="flex justify-center items-center h-64 text-center text-gray-500">
          <div>
            <h3 className="text-2xl font-semibold mb-2">No recordings found.</h3>
            <p>Start a session to create your first recording.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recordings.map((rec) => (
            <div
              key={rec.filename}
              className="relative rounded-2xl shadow-lg border border-gray-200 bg-white p-4 
                         transition-all duration-300 transform hover:shadow-xl hover:-translate-y-1"
            >
              {/* Video with poster at #t=10, as requested */}
              <video
                src={`http://localhost:5000/recordings/${rec.filename}#t=10`}
                controls
                className="w-full h-52 object-cover rounded-xl mb-4 border border-gray-200"
                poster={`http://localhost:5000/recordings/${rec.filename}#t=10`}
              />

              <div className="flex items-center text-sm text-gray-500 mb-4">
                <FaCalendarAlt className="mr-2 text-gray-400" />
                <span>{formatDateTime(rec.createdAt || '')}</span>
              </div>

              <div className="flex justify-end space-x-2">
  <button
    onClick={() => handleCopyLink(`http://localhost:5000/recordings/${rec.filename}`)}
    className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full transition-colors"
    title="Share Link"
  >
    <FaShareAlt className="h-4 w-4" />
  </button>
  <button
    onClick={() => handleDelete(rec.filename)}
    className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-full transition-colors"
    title="Delete Recording"
  >
    <FaTrash className="h-4 w-4" />
  </button>
</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecordingGallery;