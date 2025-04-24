import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, googleProvider } from '../firebase/config';
import { signInWithEmailAndPassword, signInWithPopup, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';

// Login page styles
const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'calc(100vh - 200px)',
        padding: '40px 20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
        width: '100%',
        maxWidth: '400px',
        padding: '40px',
    },
    title: {
        fontSize: '24px',
        fontWeight: '600',
        color: '#202124',
        marginBottom: '8px',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: '14px',
        color: '#5f6368',
        marginBottom: '24px',
        textAlign: 'center',
    },
    form: {
        marginBottom: '24px',
    },
    formGroup: {
        marginBottom: '20px',
    },
    label: {
        display: 'block',
        fontSize: '14px',
        fontWeight: '500',
        color: '#5f6368',
        marginBottom: '8px',
    },
    input: {
        width: '100%',
        padding: '12px 16px',
        fontSize: '14px',
        color: '#202124',
        backgroundColor: '#ffffff',
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        transition: 'border-color 0.2s',
        boxSizing: 'border-box',
    },
    inputFocus: {
        borderColor: '#1a73e8',
        outline: 'none',
        boxShadow: '0 0 0 2px rgba(26, 115, 232, 0.2)',
    },
    button: {
        width: '100%',
        padding: '12px 16px',
        fontSize: '14px',
        fontWeight: '500',
        color: '#ffffff',
        backgroundColor: '#1a73e8',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        marginTop: '16px',
    },
    buttonHover: {
        backgroundColor: '#0d47a1',
    },
    buttonDisabled: {
        backgroundColor: '#a1c0ea',
        cursor: 'not-allowed',
    },
    errorMessage: {
        backgroundColor: '#ffebee',
        color: '#d32f2f',
        padding: '12px',
        borderRadius: '4px',
        fontSize: '14px',
        marginBottom: '20px',
        textAlign: 'center',
    },
    divider: {
        display: 'flex',
        alignItems: 'center',
        margin: '24px 0',
    },
    dividerLine: {
        flex: '1',
        height: '1px',
        backgroundColor: '#e0e0e0',
    },
    dividerText: {
        padding: '0 16px',
        fontSize: '14px',
        color: '#5f6368',
    },
    googleButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        padding: '12px 16px',
        fontSize: '14px',
        fontWeight: '500',
        color: '#5f6368',
        backgroundColor: '#ffffff',
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
    },
    googleButtonHover: {
        backgroundColor: '#f8f9fa',
    },
    googleLogo: {
        width: '18px',
        height: '18px',
        marginRight: '12px',
    },
    signupLink: {
        fontSize: '14px',
        color: '#5f6368',
        textAlign: 'center',
        marginTop: '24px',
    },
    link: {
        color: '#1a73e8',
        textDecoration: 'none',
        fontWeight: '500',
    },
    linkHover: {
        textDecoration: 'underline',
    },
};

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isButtonHovered, setIsButtonHovered] = useState(false);
    const [isGoogleButtonHovered, setIsGoogleButtonHovered] = useState(false);
    const [isLinkHovered, setIsLinkHovered] = useState(false);
    const [focusedInput, setFocusedInput] = useState(null);
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
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>Welcome Back</h2>
                <p style={styles.subtitle}>Sign in to access your account</p>

                {error && <div style={styles.errorMessage}>{error}</div>}

                <form onSubmit={handleLogin} style={styles.form}>
                    <div style={styles.formGroup}>
                        <label htmlFor="email" style={styles.label}>Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                            style={{
                                ...styles.input,
                                ...(focusedInput === 'email' ? styles.inputFocus : {})
                            }}
                            onFocus={() => setFocusedInput('email')}
                            onBlur={() => setFocusedInput(null)}
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label htmlFor="password" style={styles.label}>Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                            style={{
                                ...styles.input,
                                ...(focusedInput === 'password' ? styles.inputFocus : {})
                            }}
                            onFocus={() => setFocusedInput('password')}
                            onBlur={() => setFocusedInput(null)}
                        />
                    </div>

                    <button
                        type="submit"
                        style={{
                            ...styles.button,
                            ...(isButtonHovered && !loading ? styles.buttonHover : {}),
                            ...(loading ? styles.buttonDisabled : {})
                        }}
                        disabled={loading}
                        onMouseEnter={() => setIsButtonHovered(true)}
                        onMouseLeave={() => setIsButtonHovered(false)}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div style={styles.divider}>
                    <div style={styles.dividerLine}></div>
                    <span style={styles.dividerText}>or</span>
                    <div style={styles.dividerLine}></div>
                </div>

                <button
                    onClick={handleGoogleSignIn}
                    style={{
                        ...styles.googleButton,
                        ...(isGoogleButtonHovered && !loading ? styles.googleButtonHover : {})
                    }}
                    disabled={loading}
                    onMouseEnter={() => setIsGoogleButtonHovered(true)}
                    onMouseLeave={() => setIsGoogleButtonHovered(false)}
                >
                    <img
                        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                        alt="Google logo"
                        style={styles.googleLogo}
                    />
                    Sign in with Google
                </button>

                <p style={styles.signupLink}>
                    Don't have an account? {' '}
                    <Link 
                        to="/signup" 
                        style={{
                            ...styles.link,
                            ...(isLinkHovered ? styles.linkHover : {})
                        }}
                        onMouseEnter={() => setIsLinkHovered(true)}
                        onMouseLeave={() => setIsLinkHovered(false)}
                    >
                        Create an account
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;