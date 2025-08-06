const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// ✅ Path to the folder where videos are stored
const recordingsDir = path.join(__dirname, '..', 'recordings');

router.post('/api/delete-recording', async (req, res) => {
  const { filename } = req.body;

  if (!filename) {
    return res.status(400).json({ error: 'Filename is required' });
  }

  // ✅ Construct full path to the file
  const filePath = path.join(recordingsDir, filename);

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return res.status(200).json({ success: true });
    } else {
      return res.status(404).json({ error: 'File not found' });
    }
  } catch (err) {
    console.error('Delete Error:', err);
    return res.status(500).json({ error: 'Failed to delete file' });
  }
});

module.exports = router;
