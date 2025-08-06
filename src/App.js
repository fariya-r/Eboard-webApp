import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { UserContext } from './context/UserContext';
import Login from './components/Login';
import Signup from './components/Signup';
import WhiteboardActivity from './components/WhiteboardActivity';
import RecordingGallery from './components/RecordingGallery';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import SidePanel from './components/SidePanel';
import WhiteboardCanvas from './components/WhiteboardCanvas';
import ShareButton from './components/ShareButton';
import ProfileModal from './components/ProfileModal';
import TeacherWhiteboards from './components/TeacherWhiteboards';
import Header from './components/Header';
import WhiteboardTextLayer from './components/WhiteboardTextLayer';

import RealtimeCollaborationManager, { generateWhiteboardId } from './components/RealtimeCollaborationManager'; // Adjust the path if your component is in a different folder


import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const { user, role, loading } = useContext(UserContext);

  if (loading) return <div>Loading...</div>;

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            user && role ? (
              <Navigate
                to={role === 'Admin' ? '/admin/dashboard' : '/dashboard'}
                replace
              />
            ) : (
              <Login />
            )
          }
        />
        <Route path="/signup" element={<Signup />} />
        <Route path="/WhiteboardActivity" element={<WhiteboardActivity />} />
        {/* <Route path="/whiteboard/:sessionId" element={<WhiteboardActivity />} /> */}
        <Route path="/recordings" element={<RecordingGallery />} />
        <Route path="/sidepanel" element={<SidePanel />} />
        <Route path="/RealtimeCollaborationManager" element={<RealtimeCollaborationManager />} />
        <Route path="/teacher/whiteboards" element={<TeacherWhiteboards />} />

        <Route
  path="/whiteboard/:sessionId"
  element={<WhiteboardActivity />}
/>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['Teacher', 'Student']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>

      {/* ✅ Toast Notifications Container */}
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}

export default App;
