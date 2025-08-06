// src/components/Header.js (Updated)

import React from 'react';
import { FaUserCircle, FaSignOutAlt } from 'react-icons/fa';
const logo = process.env.PUBLIC_URL + '/assets/logo.png';

const Header = ({ userProfile, handleLogout, onProfileClick, title }) => {
  return (
    <div className="flex justify-between items-center bg-slate-800 text-white rounded-2xl shadow-2xl p-6 mb-8 border border-slate-700">
      {/* Logo and Welcome Message */}
      <div className="flex items-center space-x-4">
        {/* You may need a white or light version of your logo here if the original is dark */}
        <img src={logo} alt="E-Board Logo" className="h-12 w-auto" />
        <div>
          <h1 className="text-3xl font-extrabold text-white">
            {title || (userProfile?.role === 'Admin' ? 'Admin Dashboard' : 'Teacher Dashboard')}
          </h1>
          {userProfile && ( // Conditional rendering for the welcome message
            <p className="mt-1 text-slate-400 text-lg">
              Welcome back, <span className="font-semibold text-indigo-400">{userProfile?.name || 'Loading...'}</span> 👋
            </p>
          )}
        </div>
      </div>
      
      {/* User Actions */}
      <div className="flex items-center space-x-4">
        {userProfile && ( // Conditional rendering for the profile button
          <button
            onClick={onProfileClick}
            className="text-indigo-400 hover:text-indigo-300 text-4xl p-2 rounded-full transition-all hover:bg-slate-700"
            title="View Profile"
          >
            <FaUserCircle />
          </button>
        )}
        <button
          onClick={handleLogout}
          className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-full shadow-lg transition-all flex items-center space-x-2"
        >
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Header;