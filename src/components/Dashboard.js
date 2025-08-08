import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import {
  LayoutDashboard,
  ClipboardList,
  Video,
  NotebookPen,
} from 'lucide-react';
import ProfileModal from './ProfileModal';
import axios from 'axios';
import Header from './Header'; // Import the new Header component

const Dashboard = () => {
  const navigate = useNavigate();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [teachers, setTeachers] = useState([]);

  const API_BASE = process.env.REACT_APP_API_URL;
  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const fetchTeachers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/teachers`);
      setTeachers(res.data);
    } catch (err) {
      console.error('❌ Error fetching teachers for role determination:', err.message);
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

        const isTeacher = teachers.some(teacher => teacher.email === email);
        if (isTeacher) {
          role = 'Teacher';
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

  const features = [
    {
      title: 'Start Whiteboard',
      description: 'Launch an interactive digital whiteboard session.',
      icon: <LayoutDashboard className="h-8 w-8 text-white" />,
      iconBg: 'bg-indigo-600',
      onClick: () => navigate('/WhiteboardActivity'),
    },
    {
      title: 'Recordings Gallery',
      description: 'Access and review session recordings.',
      icon: <Video className="h-8 w-8 text-white" />,
      iconBg: 'bg-purple-600',
      onClick: () => navigate('/recordings'),
    },
    {
      title: 'My Lesson Plans',
      description: 'View and manage your saved lesson plans.',
      icon: <NotebookPen className="h-8 w-8 text-white" />,
      iconBg: 'bg-emerald-500',
      onClick: () => navigate('/teacher/whiteboards'),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Reusable Header Component */}
      <Header
        userProfile={userProfile}
        handleLogout={handleLogout}
        onProfileClick={() => setShowProfileModal(true)}
      />

      <div className="p-6 sm:p-8 max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-extrabold text-gray-900 leading-tight">
            Welcome to your Dashboard
          </h2>
          <p className="mt-3 text-lg text-gray-600">
            Select a task below to get started.
          </p>
        </div>
        
        {/* Feature Cards with improved styling */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              onClick={feature.onClick}
              className="relative group bg-white p-6 rounded-2xl shadow-lg border border-gray-200 cursor-pointer
                         transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl"
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center ${feature.iconBg} mb-4 transition-all duration-300 group-hover:scale-110`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{feature.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
              <div className="absolute top-6 right-6 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={userProfile}
      />
    </div>
  );
};

export default Dashboard;