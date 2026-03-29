import React from 'react'
import { Link } from 'react-router-dom'
import './Footer.css'

const Footer = () => {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-content">
                    <div className="footer-section">
                        <h3>iTECify</h3>
                        <p>Building the future of collaborative coding, one line at a time.</p>
                        <div className="social-links">
                            <a href="https://github.com/StefanCerempei/itec_web" target="_blank" rel="noopener noreferrer" className="social-link">🐙 GitHub</a>
                            <a href="#" className="social-link">💬 Discord</a>
                            <a href="#" className="social-link">🐦 Twitter</a>
                        </div>
                    </div>

                    <div className="footer-section">
                        <h4>Product</h4>
                        <Link to="/features" className="nav-link">Features</Link>
                        <Link to="/pricing" className="nav-link">Pricing</Link>
                        <Link to="/documentation" className="nav-link">Documentation</Link>
                        <Link to="/api-reference" className="nav-link">API Reference</Link>
                    </div>

                    <div className="footer-section">
                        <h4>Company</h4>
                        <Link to="/about" className="nav-link">About</Link>
                        <Link to="/blog" className="nav-link">Blog</Link>
                        <Link to="/careers" className="nav-link">Careers</Link>
                        <Link to="/contact" className="nav-link">Contact</Link>
                    </div>

                    <div className="footer-section">
                        <h4>Legal</h4>
                        <Link to="/privacy" className="nav-link">Privacy Policy</Link>
                        <Link to="/terms" className="nav-link">Terms of Service</Link>
                        <Link to="/gdpr" className="nav-link">GDPR</Link>
                        <Link to="/security" className="nav-link">Security</Link>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>© 2026 iTECify. Built with ❤️ for iTEC 2026</p>
                </div>
            </div>
        </footer>
    )
}

export default Footer