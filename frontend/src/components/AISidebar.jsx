import React from 'react'
import './AISidebar.css'

const AISidebar = ({ suggestions, onAccept, onReject, isOpen }) => {
    if (!isOpen) return null

    return (
        <div className="ai-sidebar">
            <div className="sidebar-header">
                <div className="header-icon">
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="M12 2C10 2 8 3 7 5C5 5 4 6 4 8C2 8 2 10 2 12C2 14 2 16 4 16C4 18 5 19 7 19C8 21 10 22 12 22C14 22 16 21 17 19C19 19 20 18 20 16C22 16 22 14 22 12C22 10 22 8 20 8C20 6 19 5 17 5C16 3 14 2 12 2Z" stroke="currentColor" strokeWidth="2"/>
                        <path d="M12 8V16M8 12H16" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                </div>
                <h3>AI Assistant</h3>
                <p>Intelligent code suggestions</p>
            </div>

            <div className="suggestions-list">
                {suggestions.length === 0 ? (
                    <div className="no-suggestions">
                        <div className="empty-state">
                            <span className="empty-icon">🤖</span>
                            <p>Click "AI Suggest" to get intelligent recommendations</p>
                        </div>
                    </div>
                ) : (
                    suggestions.map(suggestion => (
                        <div key={suggestion.id} className={`suggestion-card ${suggestion.accepted ? 'accepted' : ''}`}>
                            <div className="suggestion-header">
                                <h4>{suggestion.title}</h4>
                                {!suggestion.accepted && (
                                    <div className="suggestion-actions">
                                        <button
                                            className="accept-btn"
                                            onClick={() => onAccept(suggestion.id)}
                                            title="Accept suggestion"
                                        >
                                            ✓
                                        </button>
                                        <button
                                            className="reject-btn"
                                            onClick={() => onReject(suggestion.id)}
                                            title="Reject suggestion"
                                        >
                                            ✗
                                        </button>
                                    </div>
                                )}
                                {suggestion.accepted && (
                                    <span className="accepted-badge">Accepted ✓</span>
                                )}
                            </div>
                            <p className="suggestion-description">{suggestion.description}</p>
                            <pre className="suggestion-code">
                <code>{suggestion.code}</code>
              </pre>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

export default AISidebar