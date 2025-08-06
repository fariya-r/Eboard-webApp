// routes/createTeacher.js
const express = require('express');
const router = express.Router();
const { auth, db } = require('../firebaseAdmin');

router.post('/', async (req, res) => {
  const { email, password, name } = req.body;

  try {
    // 1. Create user
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
    });

    // 2. Set custom claim
    await auth.setCustomUserClaims(userRecord.uid, { role: 'teacher' });

    // 🔁 3. Refresh user (important step)
    const updatedUser = await auth.getUser(userRecord.uid);

    // 4. Save in Firestore
    await db.doc(`users/${userRecord.uid}`).set({
      name,
      email,
      role: 'Teacher',
    });

    res.status(200).json({
      message: 'Teacher created successfully',
      uid: updatedUser.uid,
      role: updatedUser.customClaims?.role,
    });
  } catch (err) {
    console.error('❌ Error creating teacher:', err);
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;
