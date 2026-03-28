import React, { useState, useEffect } from 'react'
import './StartBuildingModal.css'

const StartBuildingModal = ({ isOpen, onClose }) => {
    const [step, setStep] = useState(1)
    const [projectName, setProjectName] = useState('')
    const [language, setLanguage] = useState('javascript')
    const [template, setTemplate] = useState('blank')
    const [isCreating, setIsCreating] = useState(false)
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePosition({ x: e.clientX, y: e.clientY })
        }
        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [])

    const languages = [
        { id: 'javascript', name: 'JavaScript', icon: '🟨', color: '#f7df1e' },
        { id: 'python', name: 'Python', icon: '🐍', color: '#3776ab' },
        { id: 'typescript', name: 'TypeScript', icon: '💙', color: '#3178c6' },
        { id: 'rust', name: 'Rust', icon: '🦀', color: '#ce5a3a' },
        { id: 'go', name: 'Go', icon: '🐹', color: '#00add8' }
    ]

    const templates = [
        { id: 'blank', name: 'Blank Project', icon: '📄', description: 'Start from scratch' },
        { id: 'react', name: 'React App', icon: '⚛️', description: 'Modern React with Vite' },
        { id: 'express', name: 'Express API', icon: '🚂', description: 'REST API with Node.js' },
        { id: 'flask', name: 'Flask App', icon: '🌶️', description: 'Python web application' }
    ]

    const handleCreateProject = async () => {
        setIsCreating(true)

        // Simulate project creation
        setTimeout(() => {
            setIsCreating(false)
            onClose()
            // Here you would navigate to the editor
            window.location.href = `/editor/${projectName.toLowerCase().replace(/\s/g, '-')}`
        }, 2000)
    }

    const nextStep = () => {
        if (step === 1 && !projectName.trim()) {
            alert('Please enter a project name')
            return
        }
        setStep(step + 1)
    }

    const prevStep = () => {
        setStep(step - 1)
    }

    if (!isOpen) return null

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="modal-bg">
                    <div className="modal-glow" style={{ left: mousePosition.x, top: mousePosition.y }}></div>
                </div>

                <button className="modal-close" onClick={onClose}>
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                </button>

                <div className="modal-header">
                    <div className="steps-indicator">
                        <div className={`step ${step >= 1 ? 'active' : ''}`}>
                            <span>1</span>
                            <span>Name</span>
                        </div>
                        <div className={`step-line ${step >= 2 ? 'active' : ''}`}></div>
                        <div className={`step ${step >= 2 ? 'active' : ''}`}>
                            <span>2</span>
                            <span>Language</span>
                        </div>
                        <div className={`step-line ${step >= 3 ? 'active' : ''}`}></div>
                        <div className={`step ${step >= 3 ? 'active' : ''}`}>
                            <span>3</span>
                            <span>Template</span>
                        </div>
                    </div>
                </div>

                <div className="modal-content">
                    {/* Step 1: Project Name */}
                    {step === 1 && (
                        <div className="step-content">
                            <h2>What's your project name?</h2>
                            <p>Give your project a memorable name</p>

                            <div className="input-group-modal">
                                <div className="input-wrapper-modal">
                                    <svg className="input-icon-modal" viewBox="0 0 24 24" fill="none">
                                        <path d="M3 6H21M3 12H21M3 18H21" stroke="currentColor" strokeWidth="2"/>
                                        <path d="M8 3V21" stroke="currentColor" strokeWidth="2"/>
                                    </svg>
                                    <input
                                        type="text"
                                        value={projectName}
                                        onChange={(e) => setProjectName(e.target.value)}
                                        placeholder="my-awesome-project"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="suggestions">
                                <p>Suggestions:</p>
                                <div className="suggestion-buttons">
                                    <button onClick={() => setProjectName('ai-collab-app')}>ai-collab-app</button>
                                    <button onClick={() => setProjectName('itec-sandbox')}>itec-sandbox</button>
                                    <button onClick={() => setProjectName('real-time-editor')}>real-time-editor</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Language Selection */}
                    {step === 2 && (
                        <div className="step-content">
                            <h2>Choose your language</h2>
                            <p>Select the primary language for your project</p>

                            <div className="language-grid">
                                {languages.map((lang) => (
                                    <button
                                        key={lang.id}
                                        className={`language-card ${language === lang.id ? 'selected' : ''}`}
                                        onClick={() => setLanguage(lang.id)}
                                    >
                                        <span className="language-icon">{lang.icon}</span>
                                        <span className="language-name">{lang.name}</span>
                                        {language === lang.id && (
                                            <svg className="check-icon" viewBox="0 0 24 24" fill="none">
                                                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2"/>
                                            </svg>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Template Selection */}
                    {step === 3 && (
                        <div className="step-content">
                            <h2>Choose a template</h2>
                            <p>Start with a template or blank project</p>

                            <div className="template-grid">
                                {templates.map((temp) => (
                                    <button
                                        key={temp.id}
                                        className={`template-card ${template === temp.id ? 'selected' : ''}`}
                                        onClick={() => setTemplate(temp.id)}
                                    >
                                        <div className="template-icon">{temp.icon}</div>
                                        <div className="template-info">
                                            <h4>{temp.name}</h4>
                                            <p>{temp.description}</p>
                                        </div>
                                        {template === temp.id && (
                                            <svg className="check-icon" viewBox="0 0 24 24" fill="none">
                                                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2"/>
                                            </svg>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    {step > 1 && (
                        <button className="btn-back" onClick={prevStep}>
                            <svg viewBox="0 0 24 24" fill="none">
                                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                            Back
                        </button>
                    )}

                    {step < 3 ? (
                        <button className="btn-next" onClick={nextStep}>
                            Next
                            <svg viewBox="0 0 24 24" fill="none">
                                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                        </button>
                    ) : (
                        <button
                            className={`btn-create ${isCreating ? 'creating' : ''}`}
                            onClick={handleCreateProject}
                            disabled={isCreating}
                        >
                            {isCreating ? (
                                <>
                                    <span className="spinner"></span>
                                    Creating project...
                                </>
                            ) : (
                                <>
                                    Start Building
                                    <svg viewBox="0 0 24 24" fill="none">
                                        <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2"/>
                                    </svg>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default StartBuildingModal