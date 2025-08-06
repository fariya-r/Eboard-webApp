import React, { useState } from 'react';
import { FaShareAlt, FaCopy } from 'react-icons/fa';

const ShareButton = ({ sessionId }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const shareableLink = sessionId 
    ? `${window.location.origin}/whiteboard/${sessionId}` 
    : '';

  const handleCopy = () => {
    if (!shareableLink) {
      alert('Cannot share: Whiteboard has no ID.');
      return;
    }

    navigator.clipboard.writeText(shareableLink)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        alert('Could not copy link. Please copy it manually.');
      });
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="btn"
        title="Get shareable link"
      >
        <FaShareAlt /> 
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-50 p-4 transition-opacity duration-300">
          <div className="bg-white p-8 rounded-2xl shadow-3xl w-full max-w-md transform scale-100 transition-transform duration-300">
            
            <h3 className="text-2xl font-extrabold text-gray-900 mb-2">Real-Time Syncing</h3>
            
            <p className="text-sm text-gray-600 mb-6">
              To collaborate in real-time, copy this link and share it with others.
            </p>

            <div className="flex items-center space-x-3 mb-6">
              <input
                type="text"
                readOnly
                value={shareableLink}
                className="flex-grow p-2 border border-slate-300 rounded-md bg-slate-100 text-gray-900 
                           focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all"
              />
              <button
                onClick={handleCopy}
                className="p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors 
                           flex items-center justify-center"
                title="Copy to clipboard"
              >
                {isCopied ? 'Copied!' : <FaCopy className="h-5 w-5" />}
              </button>
            </div>
            
            <button
              onClick={() => setIsModalOpen(false)}
              className="mt-2 w-full px-3 py-2 bg-slate-200 text-slate-800 font-semibold rounded-md 
                         hover:bg-slate-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ShareButton;