import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  createUserWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetEmailError, setResetEmailError] = useState('');
  const navigate = useNavigate();
  const { setCurrentUser } = useAuth();
  const isComponentMounted = useRef(true);

  // Set up Firebase persistence and listen for auth state changes
  useEffect(() => {
    // Set persistence to LOCAL to keep the user logged in
    setPersistence(auth, browserLocalPersistence)
      .catch(err => console.error("Error setting persistence:", err));

    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        navigate('/');
      }
    });

    // Cleanup subscription on unmount
    return () => {
      isComponentMounted.current = false;
      unsubscribe();
    };
  }, [navigate, setCurrentUser]);

  // Input change handlers
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleResetEmailChange = (e) => {
    setResetEmail(e.target.value);
  };

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();

    // Form validation
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      setError('');
      setLoading(true);

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setCurrentUser(userCredential.user);
      navigate('/');
    } catch (error) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setError('Invalid email or password');
      } else {
        setError('Failed to sign in: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle signup
  const handleSignup = async (e) => {
    e.preventDefault();

    // Form validation
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setError('');
      setLoading(true);

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setCurrentUser(userCredential.user);
      navigate('/');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        setError('This email is already in use. Try logging in instead.');
      } else if (error.code === 'auth/weak-password') {
        setError('Password is too weak. Please use a stronger password.');
      } else {
        setError('Failed to create account: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Google sign-in
  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setLoading(true);

      const result = await signInWithPopup(auth, googleProvider);
      setCurrentUser(result.user);
      navigate('/');
    } catch (error) {
      if (!error.message.includes('cancelled')) { // Don't show error for user cancellations
        setError('Failed to sign in with Google: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle forgot password
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetEmailError('');
    setResetEmailSent(false);

    if (!resetEmail || !resetEmail.includes('@')) {
      setResetEmailError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);

      await sendPasswordResetEmail(auth, resetEmail);
      setResetEmailSent(true);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // For security reasons, we still show success even if the email doesn't exist
        setResetEmailSent(true);
      } else {
        setResetEmailError('Failed to send reset email: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Close the forgot password modal
  const closeForgotPasswordModal = () => {
    setShowForgotPassword(false);
    setResetEmail('');
    setResetEmailSent(false);
    setResetEmailError('');
  };

  return (
    <div className="login-container">
      <h2>{mode === 'login' ? 'Login' : 'Sign Up'}</h2>
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={mode === 'login' ? handleLogin : handleSignup}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={handleEmailChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={handlePasswordChange}
            required
          />
        </div>

        {mode === 'login' && (
          <div className="forgot-password-link">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-button"
            >
              Forgot Password?
            </button>
          </div>
        )}

        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : mode === 'login' ? 'Login' : 'Sign Up'}
        </button>
      </form>
      <div className="social-login">
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="google-signin-btn"
        >
          <i className="fab fa-google"></i> Sign in with Google
        </button>
      </div>
      <div className="mode-switch">
        <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
          {mode === 'login' ? 'Need an account? Sign Up' : 'Already have an account? Log In'}
        </button>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="modal-overlay">
          <div className="modal-content forgot-password-modal">
            <button
              className="modal-close-button"
              onClick={closeForgotPasswordModal}
            >
              ×
            </button>

            <h3>Reset Password</h3>

            {resetEmailSent ? (
              <div className="reset-success">
                <div className="success-icon">✓</div>
                <p>Password reset email sent!</p>
                <p className="reset-instructions">
                  Check your email for instructions to reset your password.
                </p>
                <button
                  className="close-modal-button"
                  onClick={closeForgotPasswordModal}
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="reset-form">
                <p>Enter your email address and we'll send you a link to reset your password.</p>

                {resetEmailError && (
                  <div className="error-message">{resetEmailError}</div>
                )}

                <div className="form-group">
                  <label htmlFor="reset-email">Email</label>
                  <input
                    type="email"
                    id="reset-email"
                    value={resetEmail}
                    onChange={handleResetEmailChange}
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div className="reset-form-actions">
                  <button
                    type="button"
                    onClick={closeForgotPasswordModal}
                    className="cancel-button"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="reset-button"
                    disabled={loading}
                  >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;