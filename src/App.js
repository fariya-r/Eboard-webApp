
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import WhiteboardActivity from './components/WhiteboardActivity';
import RecordingGallery from './components/RecordingGallery';



function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/whiteboardactivity" element={<WhiteboardActivity />} />
      <Route path="/recordings" element={<RecordingGallery />} />

    </Routes>
  );
}

export default App;
