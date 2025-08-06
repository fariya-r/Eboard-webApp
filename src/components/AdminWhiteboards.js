import React, { useEffect, useState } from 'react';
import { db } from '../firebase/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaCalendarAlt, FaSearch } from 'react-icons/fa';

const AdminWhiteboards = () => {
  const [whiteboards, setWhiteboards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWhiteboards = async () => {
      try {
        const q = query(collection(db, 'whiteboards'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const boards = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setWhiteboards(boards);
      } catch (err) {
        console.error('Error fetching whiteboards:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWhiteboards();
  }, []);

  const filteredWhiteboards = whiteboards.filter((wb) => {
    const searchLower = searchText.toLowerCase();
    return (
      (wb.createdByName && wb.createdByName.toLowerCase().includes(searchLower)) ||
      (wb.createdByEmail && wb.createdByEmail.toLowerCase().includes(searchLower)) ||
      (wb.id && wb.id.toLowerCase().includes(searchLower))
    );
  });

  const openWhiteboard = (wb) => {
    navigate('/WhiteboardActivity', {
      state: {
        board: wb,
        isAdminView: true,
        teacherUid: wb.createdByUid,
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

  return (
    <div className="p-6">
      {/* Search Input */}
      <div className="relative w-full mb-8">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, email, or ID"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-300"
        />
      </div>

      {/* Whiteboard Cards Grid */}
      {filteredWhiteboards.length === 0 ? (
        <p className="text-center text-gray-500 mt-10 text-lg">No lesson plans found matching your search.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredWhiteboards.map((wb) => (
            <div
              key={wb.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer"
              onClick={() => openWhiteboard(wb)}
            >
              {/* Snapshot Container with new aspect ratio */}
              <div className="w-full aspect-[16/9] bg-gray-100 flex items-center justify-center p-3">
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

              {/* Card Content with reduced padding */}
              <div className="p-4">
                <p className="text-sm text-gray-600 mb-2 flex items-center">
                  <FaUser className="text-blue-500 mr-2" />
                  <span className="font-semibold text-gray-800">{wb.createdByName || 'Unknown'}</span>
                </p>
                
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
      )}
    </div>
  );
};

export default AdminWhiteboards;