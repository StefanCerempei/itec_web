import React from 'react';
import { Link } from 'react-router-dom';
import './Careers.css';

const Careers = () => {
  const jobOpenings = [
    {
      id: 1,
      title: 'Senior Frontend Developer',
      department: 'Engineering',
      location: 'Remote',
      type: 'Full-time',
      description: 'We are looking for a passionate Senior Frontend Developer to join our team and help build the future of collaborative coding.'
    },
    {
      id: 2,
      title: 'Backend Engineer',
      department: 'Engineering',
      location: 'Remote',
      type: 'Full-time',
      description: 'Join our backend team to build scalable, high-performance systems that power real-time collaboration.'
    },
    {
      id: 3,
      title: 'Product Manager',
      department: 'Product',
      location: 'Remote',
      type: 'Full-time',
      description: 'Lead product initiatives and work closely with engineering, design, and marketing teams.'
    },
    {
      id: 4,
      title: 'UX/UI Designer',
      department: 'Design',
      location: 'Remote',
      type: 'Full-time',
      description: 'Create beautiful, intuitive interfaces that developers love to use every day.'
    },
    {
      id: 5,
      title: 'DevOps Engineer',
      department: 'Engineering',
      location: 'Remote',
      type: 'Full-time',
      description: 'Help us build and maintain our cloud infrastructure for maximum reliability and scalability.'
    },
    {
      id: 6,
      title: 'Marketing Specialist',
      department: 'Marketing',
      location: 'Remote',
      type: 'Full-time',
      description: 'Drive growth and awareness for iTECify through creative marketing campaigns.'
    }
  ];

  return (
    <div className="careers-page">
      {/* Hero Section */}
      <section className="careers-hero">
        <div className="container">
          <Link to="/" className="back-button">← Back to Home</Link>
          <h1>Join Our Team</h1>
          <p className="hero-subtitle">
            Help us build the future of collaborative coding. We're looking for passionate 
            individuals who want to make a difference.
          </p>
        </div>
      </section>

      {/* Culture Section */}
      <section className="culture-section">
        <div className="container">
          <h2>Why Join iTECify?</h2>
          <div className="culture-grid">
            <div className="culture-card">
              <div className="culture-icon">🚀</div>
              <h3>Impact</h3>
              <p>Work on products used by thousands of developers worldwide.</p>
            </div>
            <div className="culture-card">
              <div className="culture-icon">💡</div>
              <h3>Innovation</h3>
              <p>Push boundaries with cutting-edge technologies and creative solutions.</p>
            </div>
            <div className="culture-card">
              <div className="culture-icon">🤝</div>
              <h3>Collaboration</h3>
              <p>Join a supportive team that values knowledge sharing and growth.</p>
            </div>
            <div className="culture-card">
              <div className="culture-icon">🌍</div>
              <h3>Remote First</h3>
              <p>Work from anywhere with flexible hours and great work-life balance.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        <div className="container">
          <h2>Benefits & Perks</h2>
          <div className="benefits-grid">
            <div className="benefit-item">
              <span>💰</span>
              <p>Competitive Salary</p>
            </div>
            <div className="benefit-item">
              <span>🏥</span>
              <p>Health Insurance</p>
            </div>
            <div className="benefit-item">
              <span>🏝️</span>
              <p>Unlimited PTO</p>
            </div>
            <div className="benefit-item">
              <span>💻</span>
              <p>Home Office Stipend</p>
            </div>
            <div className="benefit-item">
              <span>📚</span>
              <p>Learning Budget</p>
            </div>
            <div className="benefit-item">
              <span>🎉</span>
              <p>Team Retreats</p>
            </div>
          </div>
        </div>
      </section>

      {/* Open Positions Section */}
      <section className="jobs-section">
        <div className="container">
          <h2>Open Positions</h2>
          <div className="jobs-list">
            {jobOpenings.map((job) => (
              <div key={job.id} className="job-card">
                <div className="job-header">
                  <h3>{job.title}</h3>
                  <span className={`job-badge ${job.department.toLowerCase()}`}>
                    {job.department}
                  </span>
                </div>
                <div className="job-meta">
                  <span>📍 {job.location}</span>
                  <span>⏰ {job.type}</span>
                </div>
                <p className="job-description">{job.description}</p>
                <button className="apply-button">Apply Now →</button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Careers;