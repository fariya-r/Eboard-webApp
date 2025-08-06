/* global __firebase_config, __app_id, __initial_auth_token */ // ESLint directive for Canvas globals

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, signInAnonymously, signInWithCustomToken } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from 'firebase/storage';

// 1. User's provided hardcoded Firebase config (as a fallback if Canvas doesn't provide one)
const hardcodedFirebaseConfig = {
    apiKey: "AIzaSyAhu_P9ygO375GB-N6g6KxYqr-__SvBnOA",
    authDomain: "eboard-app-66bb6.firebaseapp.com",
    projectId: "eboard-app-66bb6",
    storageBucket: "eboard-app-66bb6.appspot.com",
    messagingSenderId: "453073006004",
    appId: "1:453073006004:web:da270b6a3cc6986bca56e1",
    measurementId: "G-KE6QR46DHG"
};

// 2. Determine the Firebase config to use: prioritize Canvas global, then fallback to hardcoded
let firebaseConfigToUse = hardcodedFirebaseConfig; // Start with hardcoded as default fallback
let appIdToUse = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
let initialAuthTokenToUse = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

try {
  if (typeof __firebase_config !== 'undefined' && __firebase_config) {
    const canvasConfig = JSON.parse(__firebase_config);
    // Basic validation: check if it has an apiKey, as an empty object is also JSON.parseable
    if (canvasConfig && canvasConfig.apiKey) {
      firebaseConfigToUse = canvasConfig;
      console.log("Firebase: Using config from Canvas environment.");
    } else {
      console.warn("Firebase: Canvas __firebase_config is invalid or missing apiKey. Falling back to hardcoded config.");
    }
  } else {
    console.warn("Firebase: Canvas __firebase_config is undefined or empty. Falling back to hardcoded config.");
  }
} catch (e) {
  console.error("Firebase: Error parsing __firebase_config from Canvas:", e);
  console.warn("Firebase: Falling back to hardcoded Firebase config due to parsing error.");
}

// For appId and initialAuthToken, prioritize Canvas globals as they are usually for auth/storage paths
// These are often used for Firestore paths and custom auth, so Canvas values are preferred if available.
if (typeof __app_id !== 'undefined') {
  appIdToUse = __app_id;
}
if (typeof __initial_auth_token !== 'undefined') {
  initialAuthTokenToUse = __initial_auth_token;
}

// Log the final config being used for debugging
console.log("Firebase: Final config being used:", firebaseConfigToUse);


// 3. Initialize Firebase App only once.
let app;
if (!getApps().length) {
  // Ensure we have an API key before initializing to prevent 'invalid-api-key' error
  if (firebaseConfigToUse.apiKey) {
    app = initializeApp(firebaseConfigToUse);
    console.log("Firebase: App initialized successfully.");
  } else {
    // This case should ideally not be reached if fallbacks are robust
    console.error("Firebase: Initialization skipped. No valid API key found in any configuration.");
    throw new Error("Firebase initialization failed: API Key is missing.");
  }
} else {
  app = getApp();
  console.log("Firebase: App already initialized, reusing existing instance.");
}

// 4. Initialize Firebase services using the single app instance
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// 5. Export providers if needed
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();
// 6. Export the special Canvas globals (or the ones actually used) for other components
// Rename them for clarity when importing into other files
export { initialAuthTokenToUse as initialAuthToken, appIdToUse as appId };

// 7. Export the app instance itself as default if other parts of your app need it
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

