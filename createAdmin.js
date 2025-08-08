// createAdmin.js (CommonJS version, works without ES modules)
const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./backend/serviceAccountKey.json');

initializeApp({ credential: cert(serviceAccount) });

const auth = getAuth();
const db = getFirestore();

(async () => {
  const adminUser = await auth.createUser({
    email: 'admin@eboard.com',
    password: '123456',
    displayName: 'Ashar',
  });

  await db.doc(`users/${adminUser.uid}`).set({
    name: 'Ashar',
    email: 'admin@eboard.com',
    role: 'Admin',
  });

  console.log('✅ Admin seeded with UID:', adminUser.uid);
  process.exit();
})();
