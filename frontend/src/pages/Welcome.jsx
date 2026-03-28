import React, { useState, useEffect, useRef } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import StartBuildingModal from '../components/StartBuildingModal'
import './Welcome.css'

const Welcome = () => {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const canvasRef = useRef(null)
    const mouseRef = useRef({ x: 0, y: 0 })

    // Background animation with particles
    useEffect(() => {
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        let particles = []
        let animationFrameId

        const resizeCanvas = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width
                this.y = Math.random() * canvas.height
                this.size = Math.random() * 2 + 0.5
                this.speedX = (Math.random() - 0.5) * 0.5
                this.speedY = (Math.random() - 0.5) * 0.5
                this.color = `hsla(${Math.random() * 60 + 240}, 70%, 60%, ${Math.random() * 0.3})`
            }

            update() {
                this.x += this.speedX
                this.y += this.speedY

                if (this.x < 0) this.x = canvas.width
                if (this.x > canvas.width) this.x = 0
                if (this.y < 0) this.y = canvas.height
                if (this.y > canvas.height) this.y = 0
            }

            draw() {
                ctx.fillStyle = this.color
                ctx.fillRect(this.x, this.y, this.size, this.size)
            }
        }

        const init = () => {
            particles = []
            for (let i = 0; i < 150; i++) {
                particles.push(new Particle())
            }
        }

        const animate = () => {
            ctx.fillStyle = 'rgba(10, 10, 20, 0.1)'
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            particles.forEach(particle => {
                particle.update()
                particle.draw()
            })

            animationFrameId = requestAnimationFrame(animate)
        }

        resizeCanvas()
        init()
        animate()

        window.addEventListener('resize', resizeCanvas)

        return () => {
            cancelAnimationFrame(animationFrameId)
            window.removeEventListener('resize', resizeCanvas)
        }
    }, [])

    const features = [
        {
            icon: "✨",
            title: "AI-Powered Collaboration",
            description: "Real-time code suggestions with intelligent blocks that understand your context.",
            color: "#667eea",
            gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        },
        {
            icon: "🔒",
            title: "Zero-Trust Security",
            description: "Every execution is isolated in ephemeral containers with automatic vulnerability scanning.",
            color: "#f093fb",
            gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
        },
        {
            icon: "⚡",
            title: "Instant Deployments",
            description: "Push to production with one click. Built-in CI/CD that actually works.",
            color: "#4facfe",
            gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
        },
        {
            icon: "🎯",
            title: "Time-Travel Debugging",
            description: "Rewind any session, inspect state, and replay bugs in slow motion.",
            color: "#43e97b",
            gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
        },
        {
            icon: "🌐",
            title: "Multi-Language Sandbox",
            description: "Run Python, Node.js, Rust, Go, and more in isolated, resource-limited containers.",
            color: "#fa709a",
            gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
        },
        {
            icon: "🤝",
            title: "Real-Time Presence",
            description: "See who's typing, where they're typing, and collaborate without conflicts.",
            color: "#30cfd0",
            gradient: "linear-gradient(135deg, #30cfd0 0%, #330867 100%)"
        }
    ]

    const stats = [
        { value: "99.9%", label: "Uptime SLA", icon: "📈" },
        { value: "<50ms", label: "Sync Latency", icon: "⚡" },
        { value: "∞", label: "Languages", icon: "🌍" },
        { value: "24/7", label: "AI Assistance", icon: "🤖" }
    ]

    const handleStartBuilding = () => {
        setIsModalOpen(true)
    }

    return (
        <div className="welcome-modern">
            <canvas ref={canvasRef} className="particle-canvas" />
            <Navbar />

            {/* Hero Section */}
            <section className="hero-modern">
                <div className="hero-glow"></div>
                <div className="container">
                    <div className="hero-badge-modern">
                        <span className="badge-pulse"></span>
                        <span>iTEC 2026 • Innovation Award Winner</span>
                    </div>

                    <h1 className="hero-title-modern">
                        Code Together,
                        <br />
                        <span className="gradient-text-modern">Without Boundaries</span>
                    </h1>

                    <p className="hero-description-modern">
                        The world's first collaborative platform that seamlessly blends human creativity
                        with AI intelligence. Experience coding like never before.
                    </p>

                    <div className="hero-buttons-modern">
                        <button className="btn-primary-modern" onClick={handleStartBuilding}>
                            Start Building Free
                            <svg className="btn-icon" viewBox="0 0 24 24" fill="none">
                                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        </button>
                        <button className="btn-secondary-modern">
                            Watch Demo
                            <svg className="btn-icon" viewBox="0 0 24 24" fill="none">
                                <path d="M5 3L19 12L5 21V3Z" stroke="currentColor" strokeWidth="2" fill="currentColor"/>
                            </svg>
                        </button>
                    </div>

                    <div className="hero-stats-modern">
                        {stats.map((stat, idx) => (
                            <div key={idx} className="stat-modern">
                                <span className="stat-icon">{stat.icon}</span>
                                <div>
                                    <div className="stat-value">{stat.value}</div>
                                    <div className="stat-label">{stat.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="features-modern">
                <div className="container">
                    <div className="section-header-modern">
                        <span className="section-badge">Features</span>
                        <h2>Everything you need to build the future</h2>
                        <p>Powered by cutting-edge technology and designed for teams of any size</p>
                    </div>

                    <div className="features-grid-modern">
                        {features.map((feature, index) => (
                            <div key={index} className="feature-card-modern" style={{ '--gradient': feature.gradient }}>
                                <div className="feature-icon-modern" style={{ background: feature.gradient }}>
                                    {feature.icon}
                                </div>
                                <h3>{feature.title}</h3>
                                <p>{feature.description}</p>
                                <div className="feature-link">
                                    Learn more
                                    <svg viewBox="0 0 24 24" fill="none">
                                        <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2"/>
                                    </svg>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works - Interactive */}
            <section id="how-it-works" className="workflow-modern">
                <div className="container">
                    <div className="section-header-modern">
                        <span className="section-badge">Workflow</span>
                        <h2>Three steps to collaborative nirvana</h2>
                        <p>Simple, intuitive, and powerful</p>
                    </div>

                    <div className="workflow-steps">
                        <div className="workflow-step">
                            <div className="step-number">01</div>
                            <div className="step-content">
                                <div className="step-icon">🎯</div>
                                <h3>Create Session</h3>
                                <p>Start a new workspace or join with a shareable link</p>
                            </div>
                        </div>
                        <div className="workflow-line"></div>
                        <div className="workflow-step">
                            <div className="step-number">02</div>
                            <div className="step-content">
                                <div className="step-icon">🤝</div>
                                <h3>Invite & Collaborate</h3>
                                <p>Add team members and AI agents to your session</p>
                            </div>
                        </div>
                        <div className="workflow-line"></div>
                        <div className="workflow-step">
                            <div className="step-number">03</div>
                            <div className="step-content">
                                <div className="step-icon">🚀</div>
                                <h3>Build & Deploy</h3>
                                <p>Write code together and deploy instantly</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-modern">
                <div className="cta-glow"></div>
                <div className="container">
                    <div className="cta-content-modern">
                        <h2>Ready to transform your coding experience?</h2>
                        <p>Join the future of collaborative development today</p>
                        <div className="cta-buttons">
                            <button className="btn-primary-modern btn-large" onClick={handleStartBuilding}>
                                Get Started Now
                                <svg className="btn-icon" viewBox="0 0 24 24" fill="none">
                                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2"/>
                                </svg>
                            </button>
                            <button className="btn-outline-modern">
                                View Pricing
                            </button>
                        </div>
                        <p className="cta-note">No credit card required • Free forever for teams up to 5</p>
                    </div>
                </div>
            </section>

            <Footer />

            {/* Start Building Modal */}
            <StartBuildingModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    )
}

export default Welcome