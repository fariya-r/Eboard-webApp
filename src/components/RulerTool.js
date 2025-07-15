// src/components/RulerTool.js
import React, { useEffect, useState, useCallback } from 'react';

const RulerTool = ({
  showRuler,
  setShowRuler,
  rulerPosition,
  setRulerPosition,
  isDraggingRuler,
  setIsDraggingRuler,
  // setTool, // Removed as it's not directly used by RulerTool itself for its functionality
  // canvasRef, // Removed as it's not directly used for ruler's own functionality
  // scale // Removed as it's not directly used for ruler's own functionality
}) => {
  const [rulerAngle, setRulerAngle] = useState(0);
  const [isRotating, setIsRotating] = useState(false);
  const [rotationStartMouseAngle, setRotationStartMouseAngle] = useState(0);
  const [rotationStartRulerAngle, setRotationStartRulerAngle] = useState(0);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 }); // For dragging

  // Define fixed dimensions for the ruler image
  const RULER_WIDTH = 250;
  const RULER_HEIGHT = 40;

  // Helper to get mouse angle relative to the ruler's *unrotated* center
  const getMouseAngleRelativeToRulerCenter = useCallback((e) => {
    // Calculate center based on rulerPosition (untransformed top-left) and fixed dimensions
    const centerX = rulerPosition.x + RULER_WIDTH / 2;
    const centerY = rulerPosition.y + RULER_HEIGHT / 2;

    const mouseX = e.clientX;
    const mouseY = e.clientY;

    const dx = mouseX - centerX;
    const dy = mouseY - centerY;

    return Math.atan2(dy, dx) * (180 / Math.PI); // Convert to degrees
  }, [rulerPosition]); // Dependency on rulerPosition to recalculate center if ruler moves

  const handleMouseDown = (e) => {
    e.stopPropagation(); // Prevent canvas drawing

    // Get current mouse position
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    // Define a rotation hotspot (e.g., top-right 30x30px area of the ruler image)
    const rotationHotspotSize = 30;
    // Calculate the top-right corner of the ruler based on its current position and dimensions
    const rulerRight = rulerPosition.x + RULER_WIDTH;
    const rulerTop = rulerPosition.y;

    const isClickInRotationHotspot =
      mouseX >= (rulerRight - rotationHotspotSize) &&
      mouseX <= rulerRight &&
      mouseY >= rulerTop &&
      mouseY <= (rulerTop + rotationHotspotSize);

    if (isClickInRotationHotspot) {
      setIsRotating(true);
      setRotationStartMouseAngle(getMouseAngleRelativeToRulerCenter(e));
      setRotationStartRulerAngle(rulerAngle);
    } else {
      setIsDraggingRuler(true);
      setDragOffset({
        x: mouseX - rulerPosition.x,
        y: mouseY - rulerPosition.y,
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isRotating) {
        const currentMouseAngle = getMouseAngleRelativeToRulerCenter(e);
        const angleDiff = currentMouseAngle - rotationStartMouseAngle;
        setRulerAngle(rotationStartRulerAngle + angleDiff);
      } else if (isDraggingRuler) {
        setRulerPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDraggingRuler(false);
      setIsRotating(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingRuler, isRotating, dragOffset, rulerAngle, rotationStartMouseAngle, rotationStartRulerAngle, setRulerPosition, setRulerAngle, getMouseAngleRelativeToRulerCenter]);

  if (!showRuler) return null;

  return (
    <img
      src="/assets/rulr.jpeg"
      alt="Ruler"
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute',
        left: `${rulerPosition.x}px`,
        top: `${rulerPosition.y}px`,
        width: `${RULER_WIDTH}px`, // Use constants for width
        height: `${RULER_HEIGHT}px`, // Use constants for height
        userSelect: 'none',
        zIndex: 20,
        cursor: isRotating ? 'grabbing' : (isDraggingRuler ? 'grabbing' : 'grab'),
        transform: `rotate(${rulerAngle}deg)`, // Apply rotation
        transformOrigin: 'center center', // Rotate around the center of the image
      }}
    />
  );
};

export default RulerTool;
