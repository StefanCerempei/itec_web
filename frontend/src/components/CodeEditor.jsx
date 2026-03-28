import React, { useRef, useEffect } from 'react'
import './CodeEditor.css'

const CodeEditor = ({ code, onChange, language, activeUsers }) => {
    const textareaRef = useRef(null)

    const handleChange = (e) => {
        onChange(e.target.value)
    }

    const handleKeyDown = (e) => {
        // Tab key support
        if (e.key === 'Tab') {
            e.preventDefault()
            const start = e.target.selectionStart
            const end = e.target.selectionEnd
            const value = code
            const newValue = value.substring(0, start) + '  ' + value.substring(end)
            onChange(newValue)
            setTimeout(() => {
                e.target.selectionStart = e.target.selectionEnd = start + 2
            }, 0)
        }
    }

    return (
        <div className="code-editor">
            <div className="editor-gutter">
                {code.split('\n').map((_, i) => (
                    <div key={i} className="line-number">
                        {i + 1}
                    </div>
                ))}
            </div>
            <textarea
                ref={textareaRef}
                className="editor-textarea"
                value={code}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                style={{ fontFamily: 'monospace' }}
            />
            {/* Active users cursors */}
            <div className="active-cursors">
                {activeUsers.map(user => (
                    <div
                        key={user.id}
                        className="cursor"
                        style={{
                            top: `${user.cursor.line * 20}px`,
                            left: `${user.cursor.column * 10}px`,
                            borderLeftColor: user.color
                        }}
                    >
            <span className="cursor-label" style={{ background: user.color }}>
              {user.name}
            </span>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default CodeEditor