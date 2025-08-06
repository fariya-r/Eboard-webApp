import React, { useEffect, useState } from 'react';
import { db } from '../firebase/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase/firebase';
import { FaCalendarAlt, FaIdCard } from 'react-icons/fa';

const TeacherWhiteboards = () => {
  const [whiteboards, setWhiteboards] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const currentUserUid = auth.currentUser?.uid;

  useEffect(() => {
    const fetchWhiteboards = async () => {
      if (!currentUserUid) {
        setLoading(false);
        return;
      }
      try {
        const q = query(
          collection(db, 'whiteboards'),
          where('createdByUid', '==', currentUserUid),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const boards = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setWhiteboards(boards);
      } catch (err) {
        console.error('Error fetching teacher whiteboards:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWhiteboards();
  }, [currentUserUid]);

  const openWhiteboard = (wb) => {
    navigate('/WhiteboardActivity', {
      state: {
        board: wb,
        isOwner: true, // This flag can be used in WhiteboardActivity to enable editing
      },
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  if (whiteboards.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500 text-lg">You have not created any lesson plans yet.</p>
        <button
          onClick={() => navigate('/WhiteboardActivity')}
          className="mt-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-full shadow-md transition-all"
        >
          Create Your First Lesson Plan
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-8">My Lesson Plans</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {whiteboards.map((wb) => (
          <div
            key={wb.id}
            className="relative rounded-2xl shadow-lg border border-gray-200 bg-white p-4
                       transition-all duration-300 transform hover:shadow-xl hover:-translate-y-1 cursor-pointer"
            onClick={() => openWhiteboard(wb)}
          >
            {/* Snapshot Container */}
            <div className="w-full h-48 bg-gray-100 flex items-center justify-center p-3">
              {wb.snapshot ? (
                <img
                  src={wb.snapshot}
                  alt="Whiteboard Snapshot"
                  className="w-full h-full object-cover rounded-xl border border-gray-200"
                />
              ) : (
                <div className="text-gray-400 text-center text-sm italic p-4">
                  No snapshot available
                </div>
              )}
            </div>

            {/* Card Content */}
            <div className="p-5">
              
              <p className="text-xs text-gray-500 flex items-center">
                <FaCalendarAlt className="text-gray-400 mr-2" />
                {wb.createdAt?.seconds
                  ? new Date(wb.createdAt.seconds * 1000).toLocaleString()
                  : 'Unknown Date'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeacherWhiteboards;