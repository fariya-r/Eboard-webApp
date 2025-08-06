import React, { useState, useEffect } from 'react';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase/firebase';
import AddTeacherForm from './AddTeacherForm';
import DataTable from 'react-data-table-component';
import { FaTrash, FaPlus, FaSearch } from 'react-icons/fa'; // Removed FaUserCircle, FaSignOutAlt as they are in Header
import AdminWhiteboards from './AdminWhiteboards';
import axios from 'axios';
import ProfileModal from './ProfileModal';
import Header from './Header'; // Import the new Header component

export default function AdminDashboard() {
  const [showForm, setShowForm] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const navigate = useNavigate();

  const API_BASE = 'http://localhost:5000/api';
  const ADMIN_EMAIL = 'admin@eboard.com';

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/teachers`);
      const data = await res.json();
      setTeachers(data);
    } catch (err) {
      console.error('❌ Error fetching teachers:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const email = user.email;
        let role = 'User';

        if (email === ADMIN_EMAIL) {
          role = 'Admin';
        } else {
          const isTeacher = teachers.some(teacher => teacher.email === email);
          if (isTeacher) {
            role = 'Teacher';
          }
        }

        setUserProfile({
          name: user.displayName || 'Guest User',
          email: user.email,
          role: role,
          uid: user.uid
        });
      } else {
        setUserProfile(null);
      }
    });

    return () => unsubscribe();
  }, [auth, teachers]);

  const handleAddTeacher = async ({ email, name, password }) => {
    try {
      const response = await fetch(`${API_BASE}/create-teacher`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to add teacher');
      }

      alert('✅ Teacher created successfully!');
      fetchTeachers();
    } catch (err) {
      console.error('❌ Error adding teacher:', err.message);
      alert('❌ Error: ' + err.message);
    } finally {
      setShowForm(false);
    }
  };

  const handleDeleteTeacher = async (uid) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this teacher?');
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://localhost:5000/api/teacher/${uid}`);
      alert('🗑️ Teacher deleted!');
      fetchTeachers();
    } catch (err) {
      console.error('Error deleting teacher:', err);
      alert('❌ Error deleting teacher: ' + (err.response?.data?.message || err.message));
    }
  };

  const filteredTeachers = teachers.filter((t) =>
    (t.name + t.email).toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      name: 'Name',
      selector: row => row.name,
      sortable: true,
      grow: 2,
    },
    {
      name: 'Email',
      selector: row => row.email,
      sortable: true,
      grow: 3,
    },
    {
      name: 'Actions',
      cell: row => (
        <button
          onClick={() => handleDeleteTeacher(row.uid)}
          className="text-red-500 hover:text-red-700 transition-colors"
          title="Delete Teacher"
        >
          <FaTrash className="w-4 h-4" />
        </button>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    }
  ];

  return (
    <div className="p-8 min-h-screen bg-slate-100 font-sans text-gray-800">
      {/* Header Section - Now using the reusable Header component */}
      <Header
        userProfile={userProfile}
        handleLogout={handleLogout}
        onProfileClick={() => setShowProfileModal(true)}
      />

      {/* Main Content Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Teacher Management Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Manage Teachers</h2>
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <div className="relative w-full sm:w-64">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search teachers..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-10 pr-4 py-2 border border-slate-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 w-full"
              />
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-2 bg-slate-800 hover:bg-indigo-700 text-white font-semibold rounded-full shadow-md transition-all flex items-center space-x-2 w-full sm:w-auto"
            >
              <FaPlus />
              <span>Add Teacher</span>
            </button>
          </div>
          
          {/* Teachers DataTable */}
          <DataTable
            columns={columns}
            data={filteredTeachers}
            progressPending={loading}
            pagination
            highlightOnHover
            responsive
            noHeader
            customStyles={{
              headCells: {
                style: {
                  fontWeight: 'bold',
                  fontSize: '15px',
                  backgroundColor: '#e2e8f0', // Slate-200
                  borderBottom: '2px solid #cbd5e1',
                  color: '#475569',
                },
              },
              rows: {
                style: {
                  minHeight: '60px',
                  '&:not(:last-of-type)': {
                    borderBottom: '1px solid #e2e8f0',
                  },
                },
              },
            }}
            noDataComponent="No teachers found."
          />
        </div>

        {/* All Whiteboards Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">All Lesson Plans</h2>
          <AdminWhiteboards searchText={searchText} />
        </div>

      </div>

      {showForm && (
        <AddTeacherForm
          onClose={() => setShowForm(false)}
          onAdd={handleAddTeacher}
        />
      )}

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={userProfile}
      />
    </div>
  );
}