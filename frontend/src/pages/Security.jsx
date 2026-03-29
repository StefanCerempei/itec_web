import React from 'react';
import { Link } from 'react-router-dom';
import './Security.css';

const Security = () => {
  return (
    <div className="legal-page">
      <section className="legal-hero">
        <div className="container">
          <Link to="/" className="back-button">← Back to Home</Link>
          <h1>Security</h1>
          <p className="hero-subtitle">Our commitment to protecting your data</p>
        </div>
      </section>

      <div className="legal-content">
        <div className="container">
          <div className="legal-section">
            <h2>1. Security Overview</h2>
            <p>At iTECify, we take security seriously. We implement multiple layers of protection to ensure your code and data remain safe.</p>
          </div>
          <div className="legal-section">
            <h2>2. Data Encryption</h2>
            <p>All data is encrypted in transit using TLS 1.3. Data at rest is encrypted with AES-256.</p>
          </div>
          <div className="legal-section">
            <h2>3. Sandbox Isolation</h2>
            <p>Each execution environment runs in a separate Docker container with strict resource limits. We perform pre-execution vulnerability scanning.</p>
          </div>
          <div className="legal-section">
            <h2>4. Authentication & Access Control</h2>
            <p>We support strong password policies and encourage two-factor authentication (2FA). Session management follows best practices.</p>
          </div>
          <div className="legal-section">
            <h2>5. Vulnerability Management</h2>
            <p>We regularly scan dependencies and infrastructure for vulnerabilities. Security patches are applied promptly.</p>
          </div>
          <div className="legal-section">
            <h2>6. Reporting a Vulnerability</h2>
            <p>If you discover a security issue, please contact us at <a href="mailto:security@itecify.com">security@itecify.com</a>. We will respond promptly and responsibly disclose.</p>
          </div>
          <div className="legal-section">
            <h2>7. Compliance</h2>
            <p>We follow industry standards and regularly undergo security audits. Our platform is designed with GDPR and other regulations in mind.</p>
          </div>
          <div className="legal-footer">
            <p>For security questions, email <a href="mailto:security@itecify.com">security@itecify.com</a>.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Security;