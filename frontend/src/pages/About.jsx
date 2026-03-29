import React from 'react';
import { Link } from 'react-router-dom';
import './About.css';

// Înlocuiește această cale cu locația reală a imaginii tale
// De exemplu: dacă imaginea se numește "team-photo.jpg" și o pui în folderul public,
// atunci calea va fi "/team-photo.jpg"
import teamPhoto from '../assets/team-photo.jpg'; // ← ajustează calea după cum ai nevoie

const About = () => {
  const teamMembers = [
    {
      name: 'Jurjita Alexandru',
      role: 'Full Stack Developer',
      description: 'Passionate about creating seamless user experiences and scalable backend systems.'
    },
    {
      name: 'Cerempei Stefan',
      role: 'Full Stack Developer',
      description: 'Loves building robust APIs and optimizing database performance.'
    },
    {
      name: 'Voicu Bogdan',
      role: 'DevOps & AI Specialist',
      description: 'Enjoys automating workflows and integrating AI into development tools.'
    },
    {
      name: 'Cristea Serban',
      role: 'Frontend Developer',
      description: 'Obsessed with pixel-perfect designs and interactive UI components.'
    }
  ];

  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="container">
          <Link to="/" className="back-button">← Back to Home</Link>
          <h1>About iTECify</h1>
          <p className="hero-subtitle">
            We are a team of students from UPT AC CTI, on a mission to redefine collaborative coding.
          </p>
        </div>
      </section>

      <div className="about-content">
        <div className="container">
          {/* Our Story */}
          <section className="about-section story-section">
            <h2>Our Story</h2>
            <p>
              iTECify was born out of a shared frustration with traditional development workflows.
              As computer science students at the Politehnica University of Timișoara, Faculty of 
              Automation and Computers (CTI), we experienced first-hand the chaos of coordinating 
              code, the limitations of existing collaboration tools, and the untapped potential 
              of AI in the development process.
            </p>
            <p>
              We asked ourselves: what if coding felt like designing in Figma? What if AI could 
              work alongside us as a true collaborator, not just an autocomplete? What if we could 
              run any code, in any language, without worrying about setup or security?
            </p>
            <p>
              iTECify is our answer. A platform where ideas become reality, together.
            </p>
          </section>

          {/* Team Photo */}
          <section className="about-section team-photo-section">
            <h2>Meet the Team</h2>
            <div className="team-photo-container">
              <img 
                src={teamPhoto} 
                alt="iTECify Team" 
                className="team-photo"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/800x400?text=Team+Photo+Coming+Soon';
                }}
              />
              <p className="photo-caption">
                The iTECify team – shaping the future of collaborative coding.
              </p>
            </div>
          </section>

          {/* Team Members */}
          <section className="about-section team-section">
            <h2>The Minds Behind iTECify</h2>
            <div className="team-grid">
              {teamMembers.map((member, index) => (
                <div key={index} className="team-card">
                  <div className="team-avatar">
                    {/* Poți înlocui cu avataruri individuale dacă dorești */}
                    <div className="avatar-placeholder">
                      {member.name.charAt(0)}
                    </div>
                  </div>
                  <h3>{member.name}</h3>
                  <div className="team-role">{member.role}</div>
                  <p>{member.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Our Mission */}
          <section className="about-section mission-section">
            <h2>Our Mission</h2>
            <div className="mission-grid">
              <div className="mission-card">
                <div className="mission-icon">🎯</div>
                <h3>Innovation</h3>
                <p>Push the boundaries of what's possible in collaborative development.</p>
              </div>
              <div className="mission-card">
                <div className="mission-icon">🤝</div>
                <h3>Collaboration</h3>
                <p>Build tools that bring people together, not drive them apart.</p>
              </div>
              <div className="mission-card">
                <div className="mission-icon">⚡</div>
                <h3>Simplicity</h3>
                <p>Make complex technologies accessible to everyone.</p>
              </div>
              <div className="mission-card">
                <div className="mission-icon">🌍</div>
                <h3>Open Source</h3>
                <p>Give back to the community that made our education possible.</p>
              </div>
            </div>
          </section>

          {/* Join Us */}
          <section className="about-section join-section">
            <h2>Join Our Journey</h2>
            <p>
              We're just getting started. Whether you're a developer, designer, or just curious about 
              the future of coding, we'd love to hear from you.
            </p>
            <Link to="/contact" className="cta-button">Get in Touch →</Link>
          </section>
        </div>
      </div>
    </div>
  );
};

export default About;