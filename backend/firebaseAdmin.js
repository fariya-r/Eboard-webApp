

// firebaseAdmin.js jo Railway py deploy krny k liye change kia ha 
// const { initializeApp, cert } = require('firebase-admin/app');
// const { getAuth } = require('firebase-admin/auth');
// const { getFirestore } = require('firebase-admin/firestore');

// // Load the service account credentials from the environment variable
// const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS);

// initializeApp({ credential: cert(serviceAccount) });

// const auth = getAuth();
// const db = getFirestore();

// module.exports = { auth, db };














// firebaseAdmin.js jo local py kam kr rha tha 
const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = require('./serviceAccountKey.json');

initializeApp({ credential: cert(serviceAccount) });

const auth = getAuth();
const db = getFirestore();

module.exports = { auth, db };
