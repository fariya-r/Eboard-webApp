// src/hooks/useBoardLoader.js

import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getAuth } from 'firebase/auth'; 
import axios from 'axios';

// const API_BASE = 'http://localhost:5000/api';
const API_BASE = process.env.REACT_APP_API_URL;
const useBoardLoader = (
  board,
  setBoard,
  resolved,
  user,
  setMediaFiles,
  auth
) => {
  const location = useLocation();

  const {
    board: boardFromLocation,
    isAdminView: locationAdminView,
    teacherUid: locationTeacherUid,
  } = location.state || {};
  
  // Calculate these values here instead of in separate state
  const isAdminView = locationAdminView !== undefined
    ? locationAdminView
    : user?.email === 'admin@eboard.com';
  
  const teacherUid = locationTeacherUid || board?.uid || null;

  // Effect 1: Set board state from location.state
  useEffect(() => {
    if (resolved && boardFromLocation && boardFromLocation.id !== board?.id) {
        setBoard(boardFromLocation);
    }
  }, [resolved, boardFromLocation, board?.id, setBoard]);

  // Effect 2: Fetch media files (PDFs, images) associated with the board
  useEffect(() => {
    const fetchFiles = async (userId) => {
      if (!userId) {
        console.warn("Cannot fetch files: User ID is missing.");
        return;
      }
      try {
        const res = await axios.get(`${API_BASE}/get-files`, {
          params: { user_id: userId }
        });
        setMediaFiles(res.data);
      } catch (error) {
        console.error('Failed to load media files:', error);
      }
    };
    
    if (resolved && board?.id && auth.currentUser) {
      let userIdToUse = null;
      if (isAdminView && teacherUid) {
        userIdToUse = teacherUid;
      } else if (!isAdminView) {
        userIdToUse = auth.currentUser.uid;
      }
      if (userIdToUse) {
        fetchFiles(userIdToUse);
      }
    }
  }, [resolved, board?.id, isAdminView, teacherUid, setMediaFiles, auth, user]);
  
  return { isAdminView, teacherUid };
};

export default useBoardLoader;