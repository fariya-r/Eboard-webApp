import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAhu_P9ygO375GB-N6g6KxYqr-__SvBnOA",
    authDomain: "eboard-app-66bb6.firebaseapp.com",
    projectId: "eboard-app-66bb6",
    storageBucket: "eboard-app-66bb6.firebasestorage.app",
    messagingSenderId: "453073006004",
    appId: "1:453073006004:web:da270b6a3cc6986bca56e1",
    measurementId: "G-KE6QR46DHG"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
export const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { auth,  googleProvider };

