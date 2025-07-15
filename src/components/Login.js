import React, { useState } from 'react';
import { auth, googleProvider, db } from '../firebase/firebase';
import { signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Link } from 'react-router-dom';
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  // 🔐 Email/Password Login
  const loginWithEmail = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userRef);
      const userData = docSnap.data();

      console.log("✅ Logged in as:", userData?.role || "Unknown");
      navigate("/whiteboardactivity");
    } catch (error) {
      alert("Login failed: " + error.message);
    }
  };

  // 🔐 Google Login
  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      let role = "Student";
      if (user.email.endsWith("@school.edu")) {
        role = "Teacher";
      }

      await setDoc(doc(db, "users", user.uid), {
        name: user.displayName || 'Google User',
        email: user.email,
        role,
        assignedClasses: [],
        savedBoards: [],
        sessionHistory: []
      }, { merge: true });

      console.log("✅ Google login as:", role);
      navigate("/whiteboard");
    } catch (error) {
      alert("Google login failed: " + error.message);
    }
  };

  return (
    // Outer container to center the entire content block on the screen
    <div className="min-h-screen flex items-center justify-center bg-white p-0 font-sans overflow-hidden">
      {/* Main layout container: This div holds both the left (form) and right (blue box) sections.
          It does NOT have its own background, shadow, or rounded corners, as per your request. */}
      <div className="flex flex-col lg:flex-row max-w-6xl w-full h-screen">
        {/* Left Section: Login Form and Text - No background, no shadow, no explicit rounded corners.
            It will blend with the 'bg-gray-100' of the outer container. */}
        <div className="w-full lg:w-1/2 p-6 sm:p-8 md:p-10 flex flex-col justify-between h-full overflow-hidden">
          {/* Top part: CRM Logo and Sign In text */}
          <div className="flex-shrink-0">


            <h2 className="text-3xl font-bold mb-2 text-gray-800">Sign in</h2>
            <p className="text-gray-600 mb-6">
              If you don't have an account{' '}
              <span className="font-semibold">register</span>
              <br />
              You can{' '}
              <Link to="/signup" className="text-blue-600 hover:underline">
                Register here !
              </Link>

            </p>
          </div>

          {/* Middle part: Form Inputs - this section will flex-grow to fill available space
              and help prevent the left form area from scrolling. */}
          <div className="flex-grow flex flex-col justify-center space-y-4">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                {/* Bootstrap Email Icon */}
                <i className="bi bi-envelope text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 text-lg"></i>
                <input
                  type="email"
                  id="email"
                  placeholder="Enter your email address"
                  value={email} // ✅ bind state
                  onChange={(e) => setEmail(e.target.value)} // ✅ update state
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                />

              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                {/* Bootstrap Lock Icon */}
                <i className="bi bi-lock text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 text-lg"></i>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder="Enter your Password"
                  value={password} // ✅ bind state
                  onChange={(e) => setPassword(e.target.value)} // ✅ update state
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {/* Bootstrap Eye/Eye-slash Icon */}
                  {showPassword ? (
                    <i className="bi bi-eye-slash text-lg" />
                  ) : (
                    <i className="bi bi-eye text-lg" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember-me"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 text-gray-700">
                  Remember me
                </label>
              </div>
              <a href="#" className="text-blue-600 hover:underline">
                Forgot Password?
              </a>
            </div>

            <button
              onClick={loginWithEmail}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white py-3 rounded-xl text-lg font-semibold shadow-lg hover:from-blue-600 hover:to-blue-800 transition duration-300 transform hover:scale-105"
            >
              Login
            </button>

          </div>

          <div className="flex-shrink-0 mt-6">
            <div className="text-center text-gray-500 mb-4">or continue with</div>
            <div className="flex justify-center space-x-6">
              <button
                className="w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-md hover:shadow-lg transition duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-blue-600">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 5.016 3.657 9.178 8.441 9.878V14.65H8.084v-2.65h2.357V10.05c0-2.327 1.417-3.607 3.504-3.607 1.002 0 1.868.074 2.12.107v2.44h-1.44c-1.13 0-1.348.538-1.348 1.325v1.73H16.8l-.43 2.65h-2.228v7.228C18.343 21.178 22 17.016 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
              </button>

              <button
                onClick={loginWithGoogle}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-md hover:shadow-lg transition duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-red-500">
                  <path d="M12 11.222v2.778h6.25c-.278 1.556-1.111 2.889-2.5 3.778l-2.5 1.944v-2.556c-1.389.278-2.778.444-4.167.444-3.889 0-7.056-2.5-7.056-6.25s3.167-6.25 7.056-6.25c2.056 0 3.889.833 5.167 2.056l2.111-2.111c-1.667-1.667-3.889-2.778-6.167-2.778-5.778 0-10.444 4.667-10.444 10.444s4.667 10.444 10.444 10.444c5.778 0 9.722-4.056 9.722-9.999 0-.667-.056-1.333-.167-1.944H12z" />
                </svg>
              </button>
            </div>
          </div>

        </div>

        {/* Right Section: The Blue Rounded Box with Illustration */}
        {/* This div now explicitly has its own background, rounded corners, and shadow. */}
        <div className="w-full lg:w-1/2 bg-blue-600 rounded-3xl shadow-2xl p-8 sm:p-12 md:p-16 flex items-center justify-center relative overflow-hidden">

          <div className="text-white flex items-center justify-center w-full h-full">
            <img src="assets/logo.png" alt="Logo" className="max-w-xs w-full" />
          </div>

        </div>
      </div>
    </div>
  );
}
