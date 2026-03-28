import React, { useRef, useEffect } from 'react'
import './CollaborativeTerminal.css'

const CollaborativeTerminal = ({ output, onClose, onClear }) => {
    const terminalRef = useRef(null)

    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight
        }
    }, [output])

    const getTypeIcon = (type) => {
        switch(type) {
            case 'success': return '✓'
            case 'error': return '✗'
            case 'info': return 'ℹ'
            default: return '>'
        }
    }

    const getTypeClass = (type) => {
        switch(type) {
            case 'success': return 'success'
            case 'error': return 'error'
            default: return 'info'
        }
    }

    return (
        <div className="collaborative-terminal">
            <div className="terminal-header">
                <div className="terminal-title">
                    <span className="terminal-icon">⚡</span>
                    <span>Collaborative Terminal</span>
                    <span className="live-badge">LIVE</span>
                </div>
                <div className="terminal-actions">
                    <button className="terminal-btn" onClick={onClear}>
                        Clear
                    </button>
                    <button className="terminal-btn close-btn" onClick={onClose}>
                        ✕
                    </button>
                </div>
            </div>
            <div className="terminal-output" ref={terminalRef}>
                {output.length === 0 ? (
                    <div className="terminal-welcome">
                        <span>⚡ Welcome to iTECify Terminal</span>
                        <span>Run your code to see output here</span>
                    </div>
                ) : (
                    output.map(line => (
                        <div key={line.id} className={`terminal-line ${getTypeClass(line.type)}`}>
                            <span className="terminal-prompt">{getTypeIcon(line.type)}</span>
                            <span className="terminal-message">{line.message}</span>
                            <span className="terminal-time">{line.timestamp}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

export default CollaborativeTerminal