import React from 'react'
import { useNavigate } from 'react-router-dom'
import './EditorNavbar.css'

const EditorNavbar = ({ projectName, onRun, isExecuting, onAISuggest }) => {
    const navigate = useNavigate()

    return (
        <nav className="editor-navbar">
            <div className="navbar-left">
                <button className="back-btn" onClick={() => navigate('/')}>
                    ←
                </button>
                <div className="project-info">
                    <svg className="project-icon" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    <span className="project-name">{projectName}</span>
                </div>
            </div>

            <div className="navbar-center">
                <div className="active-users">
                    <div className="user-avatar" style={{ background: '#667eea' }}>
                        <span>Y</span>
                    </div>
                    <div className="user-avatar" style={{ background: '#f093fb' }}>
                        <span>A</span>
                    </div>
                    <div className="user-avatar ai" style={{ background: '#43e97b' }}>
                        <span>AI</span>
                    </div>
                    <span className="user-count">+2 online</span>
                </div>
            </div>

            <div className="navbar-right">
                <button className="nav-btn ai-btn" onClick={onAISuggest}>
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="M12 2C10 2 8 3 7 5C5 5 4 6 4 8C2 8 2 10 2 12C2 14 2 16 4 16C4 18 5 19 7 19C8 21 10 22 12 22C14 22 16 21 17 19C19 19 20 18 20 16C22 16 22 14 22 12C22 10 22 8 20 8C20 6 19 5 17 5C16 3 14 2 12 2Z" stroke="currentColor" strokeWidth="2"/>
                        <path d="M12 8V16M8 12H16" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    AI Suggest
                </button>
                <button
                    className={`nav-btn run-btn ${isExecuting ? 'running' : ''}`}
                    onClick={onRun}
                    disabled={isExecuting}
                >
                    {isExecuting ? (
                        <>
                            <span className="spinner-small"></span>
                            Running...
                        </>
                    ) : (
                        <>
                            <svg viewBox="0 0 24 24" fill="none">
                                <path d="M5 3L19 12L5 21V3Z" fill="currentColor"/>
                            </svg>
                            Run
                        </>
                    )}
                </button>
            </div>
        </nav>
    )
}

export default EditorNavbar