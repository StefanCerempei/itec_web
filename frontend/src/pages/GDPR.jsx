import React from 'react';
import { Link } from 'react-router-dom';
import './GDPR.css';

const GDPR = () => {
  return (
    <div className="legal-page">
      <section className="legal-hero">
        <div className="container">
          <Link to="/" className="back-button">← Back to Home</Link>
          <h1>GDPR Compliance</h1>
          <p className="hero-subtitle">General Data Protection Regulation (EU) 2016/679</p>
        </div>
      </section>

      <div className="legal-content">
        <div className="container">
          <div className="legal-section">
            <h2>1. Data Controller</h2>
            <p>iTECify (the platform) acts as a data controller for personal data provided by users. Our contact: <a href="mailto:gdpr@itecify.com">gdpr@itecify.com</a>.</p>
          </div>
          <div className="legal-section">
            <h2>2. Legal Basis for Processing</h2>
            <p>We process your personal data based on:</p>
            <ul>
              <li>Your consent (e.g., for marketing communications)</li>
              <li>Performance of a contract (provision of the Service)</li>
              <li>Legitimate interests (security, improvement of services)</li>
              <li>Compliance with legal obligations</li>
            </ul>
          </div>
          <div className="legal-section">
            <h2>3. Data Subject Rights</h2>
            <p>Under GDPR, you have the right to:</p>
            <ul>
              <li>Access your personal data</li>
              <li>Rectify inaccurate data</li>
              <li>Erasure ("right to be forgotten")</li>
              <li>Restrict processing</li>
              <li>Data portability</li>
              <li>Object to processing</li>
              <li>Withdraw consent at any time</li>
            </ul>
            <p>To exercise these rights, contact <a href="mailto:gdpr@itecify.com">gdpr@itecify.com</a>.</p>
          </div>
          <div className="legal-section">
            <h2>4. Data Transfers</h2>
            <p>Your data may be transferred to and processed in countries outside the European Economic Area (EEA). We ensure appropriate safeguards are in place, such as Standard Contractual Clauses.</p>
          </div>
          <div className="legal-section">
            <h2>5. Data Retention</h2>
            <p>We retain personal data as long as your account is active or as needed to provide the Service. You may request deletion of your data.</p>
          </div>
          <div className="legal-section">
            <h2>6. Supervisory Authority</h2>
            <p>If you believe our processing of your data infringes GDPR, you have the right to lodge a complaint with a supervisory authority.</p>
          </div>
          <div className="legal-footer">
            <p>For GDPR-related inquiries, email <a href="mailto:gdpr@itecify.com">gdpr@itecify.com</a>.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GDPR;