import React, { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

const RecordingGallery = () => {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRecordings = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'recordings'));
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRecordings(list);
    } catch (error) {
      console.error('⚠️ Failed to fetch recordings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'recordings', id));
      setRecordings((prev) => prev.filter((rec) => rec.id !== id));
      alert('🗑️ Deleted successfully');
    } catch (err) {
      console.error('❌ Delete Error:', err);
      alert('Delete failed.');
    }
  };

  const handleCopyLink = (url) => {
    if (!document.hasFocus()) {
      alert('Please click the window to activate it before copying.');
      return;
    }
  
    navigator.clipboard.writeText(url)
      .then(() => {
        alert('🔗 Link copied to clipboard!');
      })
      .catch((err) => {
        console.error('Clipboard error:', err);
        alert('Failed to copy link.');
      });
  };
  
  useEffect(() => {
    window.addEventListener('click', () => window.focus());
  }, []);
  

  useEffect(() => {
    fetchRecordings();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">🎥 Saved Recordings</h2>

      {loading ? (
        <p className="text-gray-500">Loading recordings...</p>
      ) : recordings.length === 0 ? (
        <p>No recordings found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recordings.map((rec) => (
            <div key={rec.id} className="border p-3 rounded shadow bg-white">
              <video
                src={rec.url}
                controls
                className="w-full h-auto rounded"
              />
              <p className="text-sm text-gray-500 mt-2">
                {rec.createdAt?.toDate()?.toLocaleString() || 'Unknown time'}
              </p>

              <div className="flex space-x-2 mt-2">
                <button
                  onClick={() => handleCopyLink(rec.url)}
                  className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
                >
                  🔗 Share
                </button>
                <button
                  onClick={() => handleDelete(rec.id)}
                  className="text-xs bg-red-500 text-white px-2 py-1 rounded"
                >
                  🗑️ Delete
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
