import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Navbar.css'
import { supabase } from '../lib/supabaseClient'

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [userLabel, setUserLabel] = useState('')
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

            setIsLoggedIn(Boolean(token))

            if (!rawUser) {
                setUserLabel('')
                return
            }

            try {
                const parsed = JSON.parse(rawUser)
                const label = parsed?.email || parsed?.user_metadata?.email || ''
                setUserLabel(label)
            } catch {
                setUserLabel('')
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

        if (supabase) {
            try {
                await supabase.auth.signOut()
            } catch {
                // Ignore provider logout errors and still clear local app session.
            }
        }

        setIsLoggedIn(false)
        setUserLabel('')
        setIsMenuOpen(false)
        navigate('/')
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
                <div className="navbar-logo-modern" onClick={handleLogoClick}>
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
                    <button className="nav-link-modern" onClick={() => navigate('/collab')}>
                        Collab
                    </button>
                </div>

                <div className="navbar-buttons-modern">
                    {isLoggedIn ? (
                        <>
                            <button className="btn-login-modern" type="button" onClick={handleLogout}>
                                Log Out
                            </button>
                            <button className="btn-signup-modern" type="button" onClick={() => navigate('/')}>
                                {userLabel || 'Account'}
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