import React from 'react';
import { Link } from 'react-router-dom';
import './PrivacyPolicy.css';

const PrivacyPolicy = () => {
  return (
    <div className="legal-page">
      <section className="legal-hero">
        <div className="container">
          <Link to="/" className="back-button">← Back to Home</Link>
          <h1>Privacy Policy</h1>
          <p className="hero-subtitle">Last updated: March 28, 2026</p>
        </div>
      </section>

      <div className="legal-content">
        <div className="container">
          <div className="legal-section">
            <h2>1. Information We Collect</h2>
            <p>We collect information you provide directly to us, such as when you create an account, use our services, or communicate with us. This may include:</p>
            <ul>
              <li>Name, email address, and profile information</li>
              <li>Account credentials</li>
              <li>Code, files, and projects you create or collaborate on</li>
              <li>Communications with us (support tickets, feedback)</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2>2. How We Use Your Information</h2>
            <p>We use your information to provide, maintain, and improve our services, including:</p>
            <ul>
              <li>Facilitating real-time collaboration features</li>
              <li>Operating and securing our platform</li>
              <li>Communicating with you about updates and support</li>
              <li>Analyzing usage to improve user experience</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2>3. Sharing of Information</h2>
            <p>We do not sell your personal data. We may share information:</p>
            <ul>
              <li>With your consent (e.g., when you invite collaborators)</li>
              <li>For legal reasons or to protect rights and safety</li>
              <li>With service providers who assist in operating the platform (e.g., hosting, analytics)</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2>4. Data Security</h2>
            <p>We implement industry-standard security measures to protect your data. All data is encrypted in transit and at rest. We regularly review our security practices.</p>
          </div>

          <div className="legal-section">
            <h2>5. Your Rights</h2>
            <p>Depending on your location, you may have rights to access, correct, or delete your personal data. Contact us at <a href="mailto:privacy@itecify.com">privacy@itecify.com</a> to exercise these rights.</p>
          </div>

          <div className="legal-section">
            <h2>6. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of significant changes via email or through the platform.</p>
          </div>

          <div className="legal-footer">
            <p>For any questions, please contact us at <a href="mailto:privacy@itecify.com">privacy@itecify.com</a>.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;