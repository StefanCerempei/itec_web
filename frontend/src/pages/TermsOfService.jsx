import React from 'react';
import { Link } from 'react-router-dom';
import './TermsOfService.css';

const TermsOfService = () => {
  return (
    <div className="legal-page">
      <section className="legal-hero">
        <div className="container">
          <Link to="/" className="back-button">← Back to Home</Link>
          <h1>Terms of Service</h1>
          <p className="hero-subtitle">Effective: March 28, 2026</p>
        </div>
      </section>

      <div className="legal-content">
        <div className="container">
          <div className="legal-section">
            <h2>1. Acceptance of Terms</h2>
            <p>By accessing or using iTECify ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.</p>
          </div>
          <div className="legal-section">
            <h2>2. Description of Service</h2>
            <p>iTECify provides a collaborative coding platform with real-time editing, sandboxed execution, and AI-assisted features. The Service is intended for developers and teams.</p>
          </div>
          <div className="legal-section">
            <h2>3. User Accounts</h2>
            <p>You are responsible for maintaining the security of your account. You must be at least 13 years old to use the Service. You agree to provide accurate information during registration.</p>
          </div>
          <div className="legal-section">
            <h2>4. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Use the Service for illegal activities</li>
              <li>Attempt to bypass security measures or sandbox restrictions</li>
              <li>Upload malicious code or content</li>
              <li>Interfere with other users' experience</li>
            </ul>
          </div>
          <div className="legal-section">
            <h2>5. Intellectual Property</h2>
            <p>You retain ownership of any code and content you create. iTECify does not claim ownership over your projects. However, you grant us a license to host, display, and share your content as necessary to provide the Service.</p>
          </div>
          <div className="legal-section">
            <h2>6. Termination</h2>
            <p>We may suspend or terminate your account if you violate these Terms. You may delete your account at any time.</p>
          </div>
          <div className="legal-section">
            <h2>7. Disclaimer of Warranties</h2>
            <p>The Service is provided "as is" without warranties of any kind. We do not guarantee that the Service will be error-free or uninterrupted.</p>
          </div>
          <div className="legal-section">
            <h2>8. Limitation of Liability</h2>
            <p>To the fullest extent permitted by law, iTECify shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service.</p>
          </div>
          <div className="legal-section">
            <h2>9. Changes to Terms</h2>
            <p>We may revise these Terms from time to time. Continued use of the Service after changes constitutes acceptance.</p>
          </div>
          <div className="legal-footer">
            <p>For questions, contact <a href="mailto:legal@itecify.com">legal@itecify.com</a>.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;