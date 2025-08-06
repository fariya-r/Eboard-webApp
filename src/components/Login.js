import React, { useState, useContext } from 'react';
import { auth, googleProvider, db, facebookProvider } from '../firebase/firebase';
import { UserContext } from '../context/UserContext';
import { FaGoogle, FaFacebookF } from 'react-icons/fa';
import { signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Link } from 'react-router-dom';
import { useNavigate } from "react-router-dom";
import { FacebookAuthProvider } from "firebase/auth";
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { setUser, setRole } = useContext(UserContext);
  const navigate = useNavigate();

  const loginWithEmail = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const userRole = userData.role;

        setUser(user);
        setRole(userRole);

        if (userRole === 'Admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        alert('User role not found!');
      }
    } catch (error) {
      console.error(error.message);
      alert('Login failed.');
    }
  };
  const loginWithFacebook = async () => {
    try {
      const result = await signInWithPopup(auth, facebookProvider);
      const user = result.user;

      // You can use the same logic here to determine the role
      let role = "Student";
      if (user.email.endsWith("@school.edu")) {
        role = "Teacher";
      }

      await setDoc(doc(db, "users", user.uid), {
        name: user.displayName || 'Facebook User',
        email: user.email,
        role,
        assignedClasses: [],
        savedBoards: [],
        sessionHistory: []
      }, { merge: true });

      if (role === "Teacher") {
        navigate("/dashboard");
      } else {
        alert("You are not authorized to access this app.");
      }

    } catch (error) {
      alert("Facebook login failed: " + error.message);
    }
  };
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

      if (role === "Teacher") {
        navigate("/dashboard");
      } else {
        // ❌ Don’t navigate for other roles
        alert("You are not authorized to access this app.");
      }

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
            <div className="flex justify-center pt-4">
              <button
                onClick={loginWithEmail}
                className="w-full max-w-xs bg-indigo-900 text-white py-2.5 px-4 rounded-lg text-base font-medium shadow-md hover:bg-indigo-800 hover:shadow-lg transition-all duration-300 ease-in-out"
              >
                Login
              </button>
            </div>


          </div>

          <div className="flex-shrink-0 mt-6">
  <div className="text-center text-gray-500 mb-4">or continue with</div>
  <div className="flex justify-center space-x-4">
    <button
      onClick={loginWithFacebook}
      className="w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-300 hover:bg-gray-200 hover:shadow-md transition duration-200"
      aria-label="Login with Facebook"
    >
      <FaFacebookF className="text-blue-600 h-6 w-6" />
    </button>
    <button
      onClick={loginWithGoogle}
      className="w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-300 hover:bg-gray-200 hover:shadow-md transition duration-200"
      aria-label="Login with Google"
    >
      <FaGoogle className="text-red-500 h-6 w-6" />
    </button>
  </div>
</div>

        </div>

        
        <div
          className="w-full lg:w-1/2 rounded-3xl shadow-2xl p-8 sm:p-12 md:p-16 flex items-center justify-center relative overflow-hidden"
          style={{ backgroundColor: '#010141' }}
        >

          <div className="text-white flex flex-col items-center justify-center w-full h-full">
            <img src="assets/logo.png" alt="Logo" className="max-w-xs w-full mb-4" />
            <h2 className="text-2xl font-semibold">eBoard by e.Solutions</h2>
            <p className="text-sm mt-2 text-white text-center">Empowering digital classrooms</p>
          </div>
        </div>

      </div>
    </div>
  );
}
