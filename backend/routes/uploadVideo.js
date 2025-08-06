const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// storage config
const storage = multer.diskStorage({
  destination: './uploads/videos',
  filename: (req, file, cb) => {
    cb(null, `recording_${Date.now()}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage });

// ✅ Route: POST /api/upload-video
router.post('/upload-video', upload.single('video'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded');
  res.json({
    filename: req.file.filename,
    path: `/videos/${req.file.filename}`,
  });
});

module.exports = router;
