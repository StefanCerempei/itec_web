import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './SignIn.css'
import { supabase, hasSupabaseClientConfig } from '../lib/supabaseClient'
import { API_BASE_URL } from '../lib/apiBaseUrl'

const SignIn = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [rememberMe, setRememberMe] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [socialLoading, setSocialLoading] = useState('')
    const [errorMessage, setErrorMessage] = useState('')
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const navigate = useNavigate()

    const redirectToCollab = () => {
        navigate('/collab', { replace: true })

        // Fallback for environments where hash-based callback state can win over client navigation.
        window.setTimeout(() => {
            if (window.location.pathname !== '/collab') {
                window.location.replace('/collab')
            }
        }, 0)
    }

    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePosition({ x: e.clientX, y: e.clientY })
        }
        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [])

    useEffect(() => {
        const existingToken = localStorage.getItem('authToken')
        if (existingToken) {
            redirectToCollab()
            return
        }

        const syncSupabaseSession = async () => {
            if (!hasSupabaseClientConfig || !supabase) return

            const { data, error } = await supabase.auth.getSession()
            if (error || !data?.session) return

            const { session } = data
            localStorage.setItem('authToken', session.access_token)
            localStorage.setItem('authUser', JSON.stringify(session.user))
            redirectToCollab()
        }

        syncSupabaseSession()
    }, [navigate])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setErrorMessage('')

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/signin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })

            const payload = await response.json()
            if (!response.ok) {
                throw new Error(payload.message || 'Sign in failed.')
            }

            localStorage.setItem('authToken', payload.token)
            localStorage.setItem('authUser', JSON.stringify(payload.user))
            localStorage.setItem('rememberMe', String(rememberMe))

            redirectToCollab()
        } catch (error) {
            setErrorMessage(error.message || 'Unable to sign in.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSocialLogin = async (provider) => {
        setErrorMessage('')

        if (!hasSupabaseClientConfig || !supabase) {
            setErrorMessage('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in frontend .env.')
            return
        }

        try {
            setSocialLoading(provider)

            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`
                }
            })

            if (error) throw error
        } catch (error) {
            setErrorMessage(error.message || `Unable to continue with ${provider}.`)
            setSocialLoading('')
        }
    }

    return (
        <div className="signin-container">
            {/* Animated Background */}
            <div className="signin-bg">
                <div className="bg-gradient"></div>
                <div className="bg-particles"></div>
                <div
                    className="bg-glow"
                    style={{
                        left: mousePosition.x,
                        top: mousePosition.y
                    }}
                ></div>
            </div>

            <div className="signin-wrapper">
                <div className="signin-card">
                    {/* Logo and Header */}
                    <div className="card-header">
                        <div className="logo">
                            <svg className="logo-icon" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" fill="none"/>
                                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" fill="none"/>
                                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" fill="none"/>
                            </svg>
                            <span>iTECify</span>
                        </div>
                        <h1>Welcome back</h1>
                        <p>Sign in to continue coding with your team</p>
                    </div>

                    {/* Social Login Buttons */}
                    <div className="social-login">
                        <button
                            className="social-btn github"
                            onClick={() => handleSocialLogin('github')}
                            type="button"
                            disabled={socialLoading === 'github'}
                        >
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.22-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.86 1.23 1.09 1.83 2.83 1.315 3.525.995.105-.78.42-1.315.765-1.615-2.67-.3-5.46-1.335-5.46-5.925 0-1.31.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                            </svg>
                            Continue with GitHub
                        </button>

                        <button
                            className="social-btn google"
                            onClick={() => handleSocialLogin('google')}
                            type="button"
                            disabled={socialLoading === 'google'}
                        >
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            Continue with Google
                        </button>

                    </div>

                    <div className="divider">
                        <span>or continue with email</span>
                    </div>

                    {/* Sign In Form */}
                    <form className="signin-form" onSubmit={handleSubmit}>
                        {errorMessage && (
                            <p style={{ color: '#f87171', marginBottom: '12px', fontSize: '0.95rem' }}>{errorMessage}</p>
                        )}

                        <div className="input-group">
                            <label htmlFor="email">Email address</label>
                            <div className="input-wrapper">
                                <svg className="input-icon" viewBox="0 0 24 24" fill="none">
                                    <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2"/>
                                    <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2"/>
                                </svg>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="alex@itecify.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label htmlFor="password">Password</label>
                            <div className="input-wrapper">
                                <svg className="input-icon" viewBox="0 0 24 24" fill="none">
                                    <path d="M18 8H17V6C17 3.24 14.76 1 12 1C9.24 1 7 3.24 7 6V8H6C4.9 8 4 8.9 4 10V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V10C20 8.9 19.1 8 18 8ZM12 17C10.9 17 10 16.1 10 15C10 13.9 10.9 13 12 13C13.1 13 14 13.9 14 15C14 16.1 13.1 17 12 17ZM15 8H9V6C9 4.34 10.34 3 12 3C13.66 3 15 4.34 15 6V8Z" fill="currentColor"/>
                                </svg>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                />
                                <button
                                    type="button"
                                    className="toggle-password"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <svg viewBox="0 0 24 24" fill="none">
                                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="currentColor"/>
                                        </svg>
                                    ) : (
                                        <svg viewBox="0 0 24 24" fill="none">
                                            <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" fill="currentColor"/>
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="form-options">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <span>Remember me</span>
                            </label>
                            <Link to="/forgot-password" className="forgot-link">
                                Forgot password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            className={`submit-btn ${isLoading ? 'loading' : ''}`}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <span className="spinner"></span>
                                    Signing in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    <div className="signup-prompt">
                        <span>Don't have an account?</span>
                        <Link to="/signup" className="signup-link">
                            Create account
                            <svg viewBox="0 0 24 24" fill="none">
                                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SignIn