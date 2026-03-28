import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Navbar.css'
import { supabase, hasSupabaseClientConfig } from '../lib/supabaseClient'

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [accountLabel, setAccountLabel] = useState('Account')
    const navigate = useNavigate()

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    useEffect(() => {
        const syncAuthState = () => {
            const token = localStorage.getItem('authToken')
            const rawUser = localStorage.getItem('authUser')

            setIsAuthenticated(Boolean(token))

            if (!rawUser) {
                setAccountLabel('Account')
                return
            }

            try {
                const user = JSON.parse(rawUser)
                const label =
                    `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
                    user?.name ||
                    user?.email ||
                    user?.user_metadata?.email ||
                    'Account'

                setAccountLabel(label)
            } catch {
                setAccountLabel('Account')
            }
        }

        syncAuthState()
        window.addEventListener('storage', syncAuthState)

        return () => window.removeEventListener('storage', syncAuthState)
    }, [])

    const scrollToSection = (sectionId) => {
        // Verificăm dacă suntem pe pagina principală
        if (window.location.pathname === '/') {
            const section = document.getElementById(sectionId)
            if (section) {
                section.scrollIntoView({ behavior: 'smooth' })
            }
        } else {
            // Dacă nu suntem pe pagina principală, navigăm acolo mai întâi
            navigate('/')
            setTimeout(() => {
                const section = document.getElementById(sectionId)
                if (section) {
                    section.scrollIntoView({ behavior: 'smooth' })
                }
            }, 100)
        }
        setIsMenuOpen(false)
    }

    const handleSignIn = () => {
        navigate('/signin')
        setIsMenuOpen(false)
    }

    const handleSignUp = () => {
        navigate('/signup')
        setIsMenuOpen(false)
    }

    const handleLogout = async () => {
        localStorage.removeItem('authToken')
        localStorage.removeItem('authUser')
        localStorage.removeItem('rememberMe')

        if (hasSupabaseClientConfig && supabase) {
            try {
                await supabase.auth.signOut()
            } catch {
                // Local sign-out already completed.
            }
        }

        setIsAuthenticated(false)
        setAccountLabel('Account')
        navigate('/')
        setIsMenuOpen(false)
    }

    const handleLogoClick = () => {
        if (window.location.pathname === '/') {
            window.scrollTo({ top: 0, behavior: 'smooth' })
        } else {
            navigate('/')
        }
    }

    return (
        <nav className={`navbar-modern ${scrolled ? 'scrolled' : ''}`}>
            <div className="navbar-container-modern">
                <div className="navbar-logo-modern">
                    <svg className="logo-icon-modern" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" fill="none"/>
                        <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" fill="none"/>
                        <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" fill="none"/>
                    </svg>
                    <span className="logo-text-modern">iTECify</span>
                </div>

                <div className={`navbar-menu-modern ${isMenuOpen ? 'active' : ''}`}>
                    <button onClick={() => scrollToSection('features')} className="nav-link-modern">
                        Features
                    </button>
                    <button onClick={() => scrollToSection('how-it-works')} className="nav-link-modern">
                        How it works
                    </button>
                    <button className="nav-link-modern" onClick={() => navigate('/pricing')}>
                        Pricing
                    </button>
                </div>

                <div className="navbar-buttons-modern">
                    {isAuthenticated ? (
                        <>
                            <button className="btn-login-modern" onClick={handleLogout}>
                                Log Out
                            </button>
                            <button className="btn-signup-modern" onClick={() => navigate('/create')}>
                                {accountLabel}
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="btn-login-modern" onClick={handleSignIn}>
                                Sign In
                            </button>
                            <button className="btn-signup-modern" onClick={handleSignUp}>
                                Get Started
                            </button>
                        </>
                    )}
                </div>

                <div className="mobile-menu-btn-modern" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </nav>
    )
}

export default Navbar