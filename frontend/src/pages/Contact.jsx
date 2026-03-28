import React, { useState } from 'react'
import './Contact.css'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    })
    
    const [status, setStatus] = useState({
        submitted: false,
        loading: false,
        error: null,
        success: false
    })

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setStatus({ ...status, loading: true, error: null })
        
        try {
            const response = await fetch('https://formspree.io/f/xzdkdyzo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formData)
            })
            
            if (response.ok) {
                setStatus({
                    submitted: true,
                    loading: false,
                    error: null,
                    success: true
                })
                // Reset form
                setFormData({
                    name: '',
                    email: '',
                    subject: '',
                    message: ''
                })
            } else {
                const data = await response.json()
                throw new Error(data.error || 'Something went wrong')
            }
        } catch (error) {
            setStatus({
                submitted: false,
                loading: false,
                error: error.message,
                success: false
            })
        }
    }

    const team = [
        {
            name: 'Jurjita Alexandru',
            role: 'Full Stack Web Developer',
            specialty: 'Backend & API Expert',
            instagram: 'https://www.instagram.com/alexandru.j1/',
            username: '@alexandru.j1'
        },
        {
            name: 'Voicu Bogdan',
            role: 'Full Stack Web Developer',
            specialty: 'Git Expert',
            instagram: 'https://www.instagram.com/voicubogdan14/',
            username: '@voicubogdan14'
        },
        {
            name: 'Stefan Cerempei',
            role: 'Full Stack Web Developer',
            specialty: 'Web Design Expert',
            instagram: 'https://www.instagram.com/stefan.cerempei/',
            username: '@stefan.cerempei'
        },
        {
            name: 'Serban Cristea',
            role: 'Full Stack Web Developer',
            specialty: 'Frontend & UI Expert',
            instagram: 'https://www.instagram.com/_s_e_r_b_a_n/',
            username: '@_s_e_r_b_a_n'
        }
    ]

    return (
        <>
            <Navbar />
            <div className="contact-page">
                <div className="container">
                    <div className="contact-header">
                        <h1 className="contact-title">
                            Get in <span className="gradient-text">touch</span>
                        </h1>
                        <p className="contact-subtitle">
                            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                        </p>
                    </div>

                    <div className="contact-grid">
                        <div className="contact-form-section">
                            <h2>Send us a message</h2>
                            
                            {status.success ? (
                                <div className="success-message">
                                    <svg className="success-icon" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <h3>Message sent successfully!</h3>
                                    <p>Thank you for reaching out. We'll get back to you soon.</p>
                                    <button onClick={() => setStatus({ ...status, success: false })} className="submit-btn">
                                        Send another message
                                    </button>
                                </div>
                            ) : (
                                <form className="contact-form" onSubmit={handleSubmit}>
                                    <div className="form-group">
                                        <label htmlFor="name">Full Name</label>
                                        <input 
                                            type="text" 
                                            id="name" 
                                            placeholder="John Doe" 
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="email">Email Address</label>
                                        <input 
                                            type="email" 
                                            id="email" 
                                            placeholder="john@example.com" 
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="subject">Subject</label>
                                        <input 
                                            type="text" 
                                            id="subject" 
                                            placeholder="How can we help?" 
                                            value={formData.subject}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="message">Message</label>
                                        <textarea 
                                            id="message" 
                                            rows="5" 
                                            placeholder="Tell us more..." 
                                            value={formData.message}
                                            onChange={handleChange}
                                            required
                                        ></textarea>
                                    </div>
                                    
                                    {status.error && (
                                        <div className="error-message">
                                            {status.error}
                                        </div>
                                    )}
                                    
                                    <button 
                                        type="submit" 
                                        className="submit-btn"
                                        disabled={status.loading}
                                    >
                                        {status.loading ? 'Sending...' : 'Send Message →'}
                                    </button>
                                </form>
                            )}
                        </div>

                        <div className="contact-info-section">
                            <div className="info-card">
                                <h3>Meet the team</h3>
                                <p className="team-description">
                                    We're a passionate team of Full Stack Web Developers dedicated to building amazing collaborative coding experiences.
                                </p>
                                <div className="team-list">
                                    {team.map((member, index) => (
                                        <div key={index} className="team-member">
                                            <div className="member-info">
                                                <h4>{member.name}</h4>
                                                <p>{member.role}</p>
                                                <span className="specialty">{member.specialty}</span>
                                            </div>
                                            <a 
                                                href={member.instagram} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="instagram-link"
                                            >
                                                📷 {member.username}
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="info-card">
                                <h3>Other ways to connect</h3>
                                <div className="contact-methods">
                                    <div className="method">
                                        <span className="method-icon">📧</span>
                                        <div>
                                            <strong>Email</strong>
                                            <p>contact@itecify.com</p>
                                        </div>
                                    </div>
                                    <div className="method">
                                        <span className="method-icon">💬</span>
                                        <div>
                                            <strong>Discord</strong>
                                            <p>Join our community server</p>
                                        </div>
                                    </div>
                                    <div className="method">
                                        <span className="method-icon">🐙</span>
                                        <div>
                                            <strong>GitHub</strong>
                                            <p>Check out our open source projects</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    )
}

export default Contact