/* global __firebase_config, __app_id, __initial_auth_token */ // ESLint directive for Canvas globals

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, signInAnonymously, signInWithCustomToken } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

// const hardcodedFirebaseConfig = {
//     apiKey: "AIzaSyAhu_P9ygO375GB-N6g6KxYqr-__SvBnOA",
//     authDomain: "eboard-app-66bb6.firebaseapp.com",
//     projectId: "eboard-app-66bb6",
//     storageBucket: "eboard-app-66bb6.appspot.com",
//     messagingSenderId: "453073006004",
//     appId: "1:453073006004:web:da270b6a3cc6986bca56e1",
//     measurementId: "G-KE6QR46DHG"
// };

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp(); // reuse existing app
}

// ✅ Export services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// ✅ Export providers
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();

// ✅ Default export of app
export default app;






// import { initializeApp} from "firebase/app";
// import { getAuth, GoogleAuthProvider} from "firebase/auth";
// import { getFirestore } from "firebase/firestore";
// import { getStorage } from 'firebase/storage';

// const firebaseConfig = {
//     apiKey: "AIzaSyAhu_P9ygO375GB-N6g6KxYqr-__SvBnOA",
//     authDomain: "eboard-app-66bb6.firebaseapp.com",
//     projectId: "eboard-app-66bb6",
//     storageBucket: "eboard-app-66bb6.appspot.com",
//     messagingSenderId: "453073006004",
//     appId: "1:453073006004:web:da270b6a3cc6986bca56e1",
//     measurementId: "G-KE6QR46DHG"
// };




// const app = initializeApp(firebaseConfig);
// export const auth = getAuth(app);
// export const db = getFirestore(app);
// const googleProvider = new GoogleAuthProvider();
// export const storage = getStorage(app);

// export { googleProvider };
// export default app;

