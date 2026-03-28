import React from 'react'
import { Link } from 'react-router-dom'
import
    './Footer.css'

const Footer = () => {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-content">
                    <div className="footer-section">
                        <h3>iTECify</h3>
                        <p>Building the future of collaborative coding, one line at a time.</p>
                        <div className="social-links">
                            <a href="#" className="social-link">🐙 GitHub</a>
                            <a href="#" className="social-link">💬 Discord</a>
                            <a href="#" className="social-link">🐦 Twitter</a>
                        </div>
                    </div>

                    <div className="footer-section">
                        <h4>Product</h4>
                        <a href="#">Features</a>
                        <a href="#">Pricing</a>
                        <a href="#">Documentation</a>
                        <a href="#">API Reference</a>
                    </div>

                    <div className="footer-section">
                        <h4>Company</h4>
                        <a href="#">About</a>
                        <a href="#">Blog</a>
                        <a href="#">Careers</a>
                        <Link to="/contact">Contact</Link>
                    </div>

                    <div className="footer-section">
                        <h4>Legal</h4>
                        <a href="#">Privacy Policy</a>
                        <a href="#">Terms of Service</a>
                        <a href="#">GDPR</a>
                        <a href="#">Security</a>
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