// src/components/MeasurementToolsMenu.js

import React, { useState } from 'react';
import { FaRulerCombined, FaRuler, FaCompass } from 'react-icons/fa';

const MeasurementToolsMenu = ({ tool, setTool, setShowRuler }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleRulerClick = () => {
    // Show ruler and set line tool
    setShowRuler(true);
    setTool('line');
    setIsMenuOpen(false);
  };

  const handleCompassClick = () => {
    // Toggle compass tool
    setTool(prev => prev === 'compass' ? null : 'compass');
    setShowRuler(false); // Hide ruler if compass is selected
    setIsMenuOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsMenuOpen(prev => !prev)}
        className={`btn ${isMenuOpen || tool === 'compass' || tool === 'line' ? 'bg-blue-200' : ''}`}
        title="Measurement Tools"
      >
        <FaRulerCombined />
      </button>

      {isMenuOpen && (
        <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-2 flex space-x-2 border border-gray-200">
          <button
            onClick={handleRulerClick}
            className={`p-2 rounded-full hover:bg-gray-200 transition-colors ${tool === 'line' && 'bg-blue-200'}`}
            title="Ruler"
          >
            <FaRuler />
          </button>
          <button
            onClick={handleCompassClick}
            className={`p-2 rounded-full hover:bg-gray-200 transition-colors ${tool === 'compass' && 'bg-blue-200'}`}
            title="Compass"
          >
            <FaCompass />
          </button>
        </div>
      )}
    </div>
  );
};

export default MeasurementToolsMenu;