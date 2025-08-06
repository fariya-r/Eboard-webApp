const express = require('express');
const router = express.Router();
const { auth, db } = require('../firebaseAdmin'); // Ensure firebaseAdmin.js exports auth and db

// DELETE /api/teacher/:uid
router.delete('/:uid', async (req, res) => {
  const teacherUid = req.params.uid; // Renamed for clarity

  console.log(`DEBUG: Attempting to delete teacher with UID: ${teacherUid}`);

  try {
    // 1. Delete all whiteboards owned by this teacher
    const whiteboardsRef = db.collection('whiteboards');
    // CORRECTED: Use 'createdByUid' as per your Firestore document structure
    const q = whiteboardsRef.where('createdByUid', '==', teacherUid); // <-- THIS IS THE CHANGE!

    const snapshot = await q.get();

    console.log(`DEBUG: Found ${snapshot.size} whiteboards for UID: ${teacherUid}`);

    if (!snapshot.empty) {
      const batch = db.batch(); // Create a batch for atomic deletion
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref); // Add each whiteboard document to the batch
        console.log(`DEBUG: Adding whiteboard ${doc.id} to batch for deletion.`);
      });
      await batch.commit(); // Commit the batch deletion
      console.log(`✅ Deleted ${snapshot.size} whiteboards for teacher UID: ${teacherUid}`);
    } else {
      console.log(`No whiteboards found for teacher UID: ${teacherUid}`);
    }

    // 2. Delete the teacher's user account from Firebase Authentication
    await auth.deleteUser(teacherUid);
    console.log(`✅ Deleted user from Firebase Auth: ${teacherUid}`);

    // 3. Delete the teacher's document from your 'users' collection (or 'teachers' if you have one)
    await db.collection('users').doc(teacherUid).delete();
    console.log(`✅ Deleted user document from Firestore: ${teacherUid}`);

    res.status(200).json({ message: 'Teacher and associated whiteboards deleted successfully.' });

  } catch (err) {
    console.error('❌ Error deleting teacher or whiteboards:', err);
    // Provide more specific error messages for the client
    if (err.code === 'auth/user-not-found') {
      return res.status(404).json({ message: 'Teacher not found in authentication system.' });
    }
    res.status(500).json({ message: 'Failed to delete teacher and associated whiteboards.', error: err.message });
  }
});

module.exports = router;