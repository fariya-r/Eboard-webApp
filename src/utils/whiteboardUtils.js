// src/utils/whiteboardUtils.js

/**
 * Generates a unique ID for a whiteboard session.
 * @returns {string} A unique whiteboard ID.
 */
export const generateWhiteboardId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };
  