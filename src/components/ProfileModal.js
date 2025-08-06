import React from 'react';
import { FaUserCircle, FaEnvelope, FaIdBadge, FaTimes } from 'react-icons/fa';

const ProfileModal = ({ isOpen, onClose, user }) => {
  if (!isOpen) return null;

  return (
    // Backdrop with a darker, blurred effect
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      {/* Modal content container */}
      <div
        className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md mx-auto relative transform transition-all duration-300 scale-100 opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button at the top-right */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"
          aria-label="Close profile modal"
        >
          <FaTimes className="w-6 h-6" />
        </button>

        {/* Profile Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full p-3 shadow-md mb-4">
            <FaUserCircle className="w-16 h-16 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Your Profile</h2>
        </div>
        
        {/* User Details Section */}
        {user ? (
          <div className="space-y-5 text-gray-700">
            {/* Name */}
            <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-xl">
              <FaIdBadge className="text-indigo-500 w-5 h-5" />
              <p className="flex-1 text-lg">
                <span className="font-semibold text-gray-900">Name:</span> {user.name}
              </p>
            </div>
            
            {/* Email */}
            <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-xl">
              <FaEnvelope className="text-indigo-500 w-5 h-5" />
              <p className="flex-1 text-lg">
                <span className="font-semibold text-gray-900">Email:</span> {user.email}
              </p>
            </div>
            
            {/* Role */}
            <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-xl">
              <FaIdBadge className="text-indigo-500 w-5 h-5" />
              <p className="flex-1 text-lg">
                <span className="font-semibold text-gray-900">Role:</span> {user.role}
              </p>
            </div>
            
          </div>
        ) : (
          <p className="text-gray-600 text-center">No profile data available.</p>
        )}
      </div>
    </div>
  );
};

export default ProfileModal;