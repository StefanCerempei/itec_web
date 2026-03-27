import React, { useState, useEffect } from 'react'
import './Navbar.css'

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const scrollToSection = (sectionId) => {
        const section = document.getElementById(sectionId)
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' })
        }
        setIsMenuOpen(false)
    }

    return (
        <nav className={`navbar-modern ${scrolled ? 'scrolled' : ''}`}>
            <div className="navbar-container-modern">
                <div className="navbar-logo-modern" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
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
                    <button className="nav-link-modern">Pricing</button>
                    <button className="nav-link-modern">Docs</button>
                </div>

                <div className="navbar-buttons-modern">
                    <button className="btn-login-modern">Sign In</button>
                    <button className="btn-signup-modern">Get Started</button>
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