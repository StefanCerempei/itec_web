// Demo.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './Demo.css';

const Demo = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('editor');
    const [code, setCode] = useState(`// Welcome to the Collaborative Demo!
// Try typing here - it's real-time!
// Other users will see your changes instantly

function greetUser(name) {
    return \`Hello, \${name}! Welcome to the future of coding.\`;
}

// Try running this code
console.log(greetUser("Developer"));

// AI will provide suggestions as you type
// Click "Run Code" to see the output!`);

    const [output, setOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [isAIActive, setIsAIActive] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState('');
    const [activeUsers, setActiveUsers] = useState([
        { id: 1, name: 'You', color: '#667eea', position: 'editor' },
        { id: 2, name: 'Alex', color: '#f093fb', position: 'editor', isTyping: true },
        { id: 3, name: 'Sarah', color: '#4facfe', position: 'preview' }
    ]);
    const [chatMessages, setChatMessages] = useState([
        { id: 1, user: 'Alex', message: 'Hey! Ready to collaborate?', timestamp: new Date() },
        { id: 2, user: 'Sarah', message: 'This real-time sync is amazing!', timestamp: new Date() }
    ]);
    const [newMessage, setNewMessage] = useState('');
    const [cursorPosition, setCursorPosition] = useState({ line: 1, col: 1 });
    const [theme, setTheme] = useState('dark');
    const [showAIPanel, setShowAIPanel] = useState(true);

    const textareaRef = useRef(null);
    const chatEndRef = useRef(null);
    const outputRef = useRef(null);

    // Simulate real-time updates
    useEffect(() => {
        const interval = setInterval(() => {
            // Simulate other users typing occasionally
            if (Math.random() > 0.7) {
                const typingUser = activeUsers.find(u => u.name !== 'You' && u.isTyping);
                if (typingUser) {
                    setActiveUsers(prev => prev.map(u =>
                        u.id === typingUser.id ? { ...u, isTyping: !u.isTyping } : u
                    ));
                }
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [activeUsers]);

    // Auto-scroll chat to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    // Simulate AI suggestions
    useEffect(() => {
        if (isAIActive && code) {
            const timer = setTimeout(() => {
                const suggestions = [
                    "💡 Tip: You can add error handling with try-catch blocks",
                    "✨ AI Suggestion: Consider adding input validation for better security",
                    "🚀 Performance tip: Memoize this function for better performance",
                    "📝 Documentation: Add JSDoc comments for better code maintainability"
                ];
                setAiSuggestion(suggestions[Math.floor(Math.random() * suggestions.length)]);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [code, isAIActive]);

    const handleCodeChange = (e) => {
        setCode(e.target.value);

        // Simulate cursor position tracking
        const lines = e.target.value.split('\n');
        const cursorLine = e.target.selectionStart ?
            e.target.value.substr(0, e.target.selectionStart).split('\n').length : 1;
        setCursorPosition({ line: cursorLine, col: 1 });

        // Simulate real-time broadcasting
        if (Math.random() > 0.5) {
            // This would normally broadcast to other users
            console.log('Broadcasting changes...');
        }
    };

    const handleRunCode = async () => {
        setIsRunning(true);
        setOutput('Running code...\n');

        // Simulate code execution
        setTimeout(() => {
            try {
                // Create a safe evaluation environment
                const consoleLogs = [];
                const originalLog = console.log;
                console.log = (...args) => {
                    consoleLogs.push(args.join(' '));
                    originalLog(...args);
                };

                // Execute the code (simulated)
                const result = eval(code);
                console.log = originalLog;

                let outputText = '';
                if (consoleLogs.length > 0) {
                    outputText += consoleLogs.join('\n') + '\n';
                }
                if (result !== undefined) {
                    outputText += `\n> Return value: ${JSON.stringify(result, null, 2)}`;
                }

                setOutput(outputText || 'Code executed successfully! No output generated.');
            } catch (error) {
                setOutput(`Error: ${error.message}\n\nStack trace:\n${error.stack}`);
            }
            setIsRunning(false);
        }, 1000);
    };

    const handleClearOutput = () => {
        setOutput('');
        if (outputRef.current) {
            outputRef.current.style.opacity = '0';
            setTimeout(() => {
                outputRef.current.style.opacity = '1';
            }, 100);
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (newMessage.trim()) {
            const message = {
                id: chatMessages.length + 1,
                user: 'You',
                message: newMessage,
                timestamp: new Date()
            };
            setChatMessages([...chatMessages, message]);
            setNewMessage('');

            // Simulate AI response
            setTimeout(() => {
                const aiResponse = {
                    id: chatMessages.length + 2,
                    user: 'AI Assistant',
                    message: 'I can help you with that! What specific aspect would you like to explore?',
                    timestamp: new Date(),
                    isAI: true
                };
                setChatMessages(prev => [...prev, aiResponse]);
            }, 1500);
        }
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(code);
        // Show toast notification
        const toast = document.createElement('div');
        toast.className = 'demo-toast';
        toast.textContent = 'Code copied to clipboard!';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    };

    const handleFormatCode = () => {
        // Simple code formatting
        let formatted = code
            .split('\n')
            .map(line => line.trim())
            .join('\n');
        setCode(formatted);
    };

    const handleClearCode = () => {
        if (window.confirm('Are you sure you want to clear the editor?')) {
            setCode('');
        }
    };

    const handleShareSession = () => {
        const shareUrl = `${window.location.origin}/collab/demo-share`;
        navigator.clipboard.writeText(shareUrl);
        alert('Session link copied to clipboard! Share it with collaborators.');
    };

    const startCollabSession = () => {
        navigate('/collab');
    };

    return (
        <div className="demo-container">
            <Navbar />

            <div className="demo-header">
                <div className="demo-header-content">
                    <div className="demo-badge">
                        <span className="demo-pulse"></span>
                        Live Demo • Real-time Collaboration
                    </div>
                    <h1>Experience Collaborative Coding</h1>
                    <p>See how teams code together in real-time with AI assistance</p>

                    <div className="demo-actions">
                        <button className="demo-btn-primary" onClick={startCollabSession}>
                            Start Your Session
                            <svg viewBox="0 0 24 24" fill="none">
                                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                        </button>
                        <button className="demo-btn-secondary" onClick={handleShareSession}>
                            Share Demo
                            <svg viewBox="0 0 24 24" fill="none">
                                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <div className="demo-main">
                {/* Active Users Bar */}
                <div className="active-users-bar">
                    <div className="users-list">
                        {activeUsers.map(user => (
                            <div key={user.id} className="user-avatar" style={{ borderColor: user.color }}>
                                <span className="user-initial">{user.name[0]}</span>
                                {user.isTyping && <span className="typing-indicator">typing...</span>}
                            </div>
                        ))}
                    </div>
                    <div className="demo-stats">
                        <span>👥 {activeUsers.length} active users</span>
                        <span>⚡ Real-time sync</span>
                    </div>
                </div>

                {/* Main Workspace */}
                <div className="demo-workspace">
                    {/* Sidebar Tabs */}
                    <div className="demo-sidebar">
                        <button
                            className={`sidebar-tab ${activeTab === 'editor' ? 'active' : ''}`}
                            onClick={() => setActiveTab('editor')}
                        >
                            <span>📝</span>
                            <span>Editor</span>
                        </button>
                        <button
                            className={`sidebar-tab ${activeTab === 'chat' ? 'active' : ''}`}
                            onClick={() => setActiveTab('chat')}
                        >
                            <span>💬</span>
                            <span>Chat</span>
                        </button>
                        <button
                            className={`sidebar-tab ${activeTab === 'settings' ? 'active' : ''}`}
                            onClick={() => setActiveTab('settings')}
                        >
                            <span>⚙️</span>
                            <span>Settings</span>
                        </button>
                    </div>

                    {/* Editor Area */}
                    <div className="demo-editor-area">
                        <div className="editor-header">
                            <div className="editor-tabs">
                                <button className="editor-tab active">index.js</button>
                                <button className="editor-tab">styles.css</button>
                                <button className="editor-tab">README.md</button>
                            </div>
                            <div className="editor-actions">
                                <button onClick={handleFormatCode} title="Format Code">
                                    <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                                        <path d="M21 10H3M21 6H3M21 14H3M21 18H3" stroke="currentColor" strokeWidth="2"/>
                                    </svg>
                                </button>
                                <button onClick={handleCopyCode} title="Copy Code">
                                    <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                                        <path d="M8 4v12a2 2 0 002 2h8M16 8v12a2 2 0 01-2 2H6a2 2 0 01-2-2V10a2 2 0 012-2h8a2 2 0 012 2z" stroke="currentColor" strokeWidth="2"/>
                                    </svg>
                                </button>
                                <button onClick={handleClearCode} title="Clear">
                                    <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2"/>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="editor-container">
                            <div className="line-numbers">
                                {code.split('\n').map((_, i) => (
                                    <div key={i} className="line-number">{i + 1}</div>
                                ))}
                            </div>
                            <textarea
                                ref={textareaRef}
                                value={code}
                                onChange={handleCodeChange}
                                className="code-editor"
                                spellCheck="false"
                                placeholder="Start typing your code here..."
                            />
                        </div>

                        {/* Cursor Position Indicator */}
                        <div className="cursor-info">
                            Line {cursorPosition.line}, Col {cursorPosition.col}
                        </div>
                    </div>

                    {/* Right Panel - Output & AI */}
                    <div className="demo-right-panel">
                        <div className="panel-header">
                            <button
                                className={`panel-tab ${!showAIPanel ? 'active' : ''}`}
                                onClick={() => setShowAIPanel(false)}
                            >
                                Output
                            </button>
                            <button
                                className={`panel-tab ${showAIPanel ? 'active' : ''}`}
                                onClick={() => setShowAIPanel(true)}
                            >
                                AI Assistant
                            </button>
                        </div>

                        {!showAIPanel ? (
                            <div className="output-panel" ref={outputRef}>
                                <div className="output-header">
                                    <span>Console Output</span>
                                    <div className="output-actions">
                                        <button onClick={handleRunCode} disabled={isRunning}>
                                            {isRunning ? 'Running...' : '▶ Run Code'}
                                        </button>
                                        <button onClick={handleClearOutput}>Clear</button>
                                    </div>
                                </div>
                                <pre className="output-content">
                                    {output || '// Click "Run Code" to execute your JavaScript\n// The output will appear here'}
                                </pre>
                            </div>
                        ) : (
                            <div className="ai-panel">
                                <div className="ai-header">
                                    <div className="ai-status">
                                        <span className={`ai-dot ${isAIActive ? 'active' : ''}`}></span>
                                        <span>AI Assistant</span>
                                    </div>
                                    <button
                                        className="ai-toggle"
                                        onClick={() => setIsAIActive(!isAIActive)}
                                    >
                                        {isAIActive ? 'Disable' : 'Enable'} AI
                                    </button>
                                </div>

                                {isAIActive && aiSuggestion && (
                                    <div className="ai-suggestion">
                                        <div className="suggestion-icon">🤖</div>
                                        <div className="suggestion-content">
                                            <strong>AI Suggestion</strong>
                                            <p>{aiSuggestion}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="ai-features">
                                    <div className="ai-feature">
                                        <span>🔍</span>
                                        <span>Code Analysis</span>
                                    </div>
                                    <div className="ai-feature">
                                        <span>💡</span>
                                        <span>Smart Suggestions</span>
                                    </div>
                                    <div className="ai-feature">
                                        <span>🐛</span>
                                        <span>Bug Detection</span>
                                    </div>
                                    <div className="ai-feature">
                                        <span>📚</span>
                                        <span>Documentation</span>
                                    </div>
                                </div>

                                <div className="ai-chat-shortcut">
                                    <p>💬 Ask me anything about your code</p>
                                    <small>Try: "How can I optimize this function?"</small>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Panel (only visible when chat tab is active) */}
                {activeTab === 'chat' && (
                    <div className="demo-chat-panel">
                        <div className="chat-header">
                            <h3>Team Chat</h3>
                            <span>{activeUsers.length} online</span>
                        </div>
                        <div className="chat-messages">
                            {chatMessages.map(msg => (
                                <div key={msg.id} className={`chat-message ${msg.isAI ? 'ai-message' : ''}`}>
                                    <div className="message-user" style={msg.isAI ? { color: '#667eea' } : {}}>
                                        {msg.user}
                                    </div>
                                    <div className="message-text">{msg.message}</div>
                                    <div className="message-time">
                                        {msg.timestamp.toLocaleTimeString()}
                                    </div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>
                        <form onSubmit={handleSendMessage} className="chat-input-form">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="chat-input"
                            />
                            <button type="submit" className="chat-send">
                                Send
                            </button>
                        </form>
                    </div>
                )}

                {/* Settings Panel */}
                {activeTab === 'settings' && (
                    <div className="demo-settings-panel">
                        <h3>Workspace Settings</h3>

                        <div className="setting-group">
                            <label>Theme</label>
                            <select value={theme} onChange={(e) => setTheme(e.target.value)}>
                                <option value="dark">Dark</option>
                                <option value="light">Light</option>
                                <option value="auto">Auto</option>
                            </select>
                        </div>

                        <div className="setting-group">
                            <label>Editor Font Size</label>
                            <input type="range" min="12" max="20" defaultValue="14" />
                        </div>

                        <div className="setting-group">
                            <label>Auto-save</label>
                            <input type="checkbox" defaultChecked />
                        </div>

                        <div className="setting-group">
                            <label>Show Line Numbers</label>
                            <input type="checkbox" defaultChecked />
                        </div>

                        <div className="setting-group">
                            <label>AI Suggestions</label>
                            <input type="checkbox" checked={isAIActive} onChange={() => setIsAIActive(!isAIActive)} />
                        </div>

                        <button className="demo-save-settings">Save Settings</button>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
};

export default Demo;