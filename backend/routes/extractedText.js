// src/routes/extractedText.js (or wherever your router is)

const express = require('express');
const router = express.Router();
const admin = require('firebase-admin'); // Assuming Firebase Admin SDK is initialized elsewhere
const db = admin.firestore();

// 1. POST route for saving/updating extracted text
router.post('/extracted-text', async (req, res) => { // Changed path for consistency with client
  const { userId, text } = req.body;
  if (!userId || text === undefined) { // Check for undefined to allow empty strings
    return res.status(400).send('Missing userId or text field');
  }

  try {
    // Use the userId as the document ID to store one document per user
    const extractedTextRef = db.collection('extractedTexts').doc(userId);
    await extractedTextRef.set({
      text,
      timestamp: admin.firestore.FieldValue.serverTimestamp(), // Use server timestamp
    }, { merge: true }); // Use merge: true to update existing fields or create if not exists
    res.status(200).send('Extracted text saved/updated successfully');
  } catch (error) {
    console.error('Error saving/updating extracted text:', error);
    res.status(500).send('Server error saving/updating extracted text');
  }
});

// 2. GET route for fetching extracted text by userId
router.get('/extracted-text/:userId', async (req, res) => {
  const { userId } = req.params;
  if (!userId) {
    return res.status(400).send('Missing User ID in URL parameter');
  }

  try {
    const docRef = db.collection('extractedTexts').doc(userId);
    const doc = await docRef.get();

    if (!doc.exists) {
      // If no document exists for this user, return a 404
      return res.status(404).send('No extracted text found for this user');
    }

    // Return the data from the document
    res.status(200).json(doc.data());
  } catch (error) {
    console.error('Error fetching extracted text:', error);
    res.status(500).send('Server error fetching extracted text');
  }
});

// 3. DELETE route for deleting extracted text by userId
router.delete('/extracted-text/:userId', async (req, res) => {
  const { userId } = req.params;
  if (!userId) {
    return res.status(400).send('Missing User ID in URL parameter');
  }

  try {
    const docRef = db.collection('extractedTexts').doc(userId);
    await docRef.delete(); // Delete the document corresponding to the userId
    res.status(200).send('Extracted text deleted successfully');
  } catch (error) {
    console.error('Error deleting extracted text:', error);
    res.status(500).send('Server error deleting extracted text');
  }
});

module.exports = router;