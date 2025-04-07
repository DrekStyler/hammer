import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, googleProvider } from '../firebase/config';
import { signInWithEmailAndPassword, signInWithPopup, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { setCurrentUser } = useAuth();

    // Set Firebase persistence when component mounts
    useEffect(() => {
        setPersistence(auth, browserLocalPersistence)
            .then(() => {
                console.log("Login page: Firebase persistence set to LOCAL");
            })
            .catch(err => {
                console.error("Login page: Error setting persistence:", err);
            });
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            setError('Please enter both email and password');
            return;
        }

        try {
            setError('');
            setLoading(true);
            console.log("Attempting login for:", email);

            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log("Login successful:", userCredential.user.email);

            // Explicitly update the auth context
            setCurrentUser(userCredential.user);

            // Store authentication data in localStorage for backup
            localStorage.setItem('authUser', JSON.stringify({
                uid: userCredential.user.uid,
                email: userCredential.user.email,
                displayName: userCredential.user.displayName
            }));

            // Navigate to dashboard
            navigate('/dashboard');
        } catch (error) {
            console.error('Login error:', error);
            setError(error.message.includes('auth/')
                ? 'Invalid email or password'
                : 'Failed to login. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            setError('');
            setLoading(true);
            console.log("Attempting Google sign in");

            const result = await signInWithPopup(auth, googleProvider);
            console.log("Google sign in successful:", result.user.email);

            // Explicitly update the auth context
            setCurrentUser(result.user);

            // Store authentication data in localStorage for backup
            localStorage.setItem('authUser', JSON.stringify({
                uid: result.user.uid,
                email: result.user.email,
                displayName: result.user.displayName
            }));

            navigate('/dashboard');
        } catch (error) {
            console.error('Google sign in error:', error);
            if (!error.message.includes('cancelled')) { // Don't show error for user cancellations
                setError('Failed to sign in with Google');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2>Welcome Back</h2>
                <p className="login-subtitle">Sign in to access your account</p>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleLogin} className="login-form">
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="login-button primary-button"
                        disabled={loading}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="divider">
                    <span>or</span>
                </div>

                <button
                    onClick={handleGoogleSignIn}
                    className="google-button"
                    disabled={loading}
                >
                    <img
                        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                        alt="Google logo"
                    />
                    Sign in with Google
                </button>

                <p className="signup-link">
                    Don't have an account? <Link to="/signup">Create an account</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;