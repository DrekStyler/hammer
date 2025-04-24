import React, { useState, useEffect } from "react";
import { auth, googleProvider, app } from "../firebase/config";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged
} from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import { getFirestore } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";

const db = getFirestore(app);

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setCurrentUser } = useAuth();

  // Listen for auth state changes
  useEffect(() => {
    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        navigate('/');
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [navigate, setCurrentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Form validation
    if (!email || !password) {
      setError("Please enter both email and password");
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        // Handle login
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        setCurrentUser(userCredential.user);
        navigate('/');
      } else {
        // Handle signup
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        setCurrentUser(userCredential.user);
        navigate('/');
      }
    } catch (err) {
      // Provide specific error messages
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Email is already in use. Try logging in instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      setLoading(true);

      // Standard Google auth flow
      const result = await signInWithPopup(auth, googleProvider);
      setCurrentUser(result.user);
      navigate('/');
    } catch (err) {
      if (!err.message.includes('cancelled')) { // Don't show error for user cancellations
        setError('Failed to sign in with Google: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        {error && <div className="error-message">{error}</div>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div className="auth-buttons">
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Processing...' : isLogin ? "Log In" : "Sign Up"}
          </button>

          <button
            type="button"
            className="google-btn"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            Sign in with Google
          </button>

          <Link
            to={isLogin ? "/signup" : "/login"}
            className="switch-btn"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "Need an account? Sign Up" : "Already have an account? Log In"}
          </Link>
        </div>
      </form>
    </div>
  );
}

export default Auth;
