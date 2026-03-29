import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Documentation.css';

const Documentation = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [copiedCode, setCopiedCode] = useState(null);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const sections = [
    { id: 'overview', title: 'Overview', icon: '📖' },
    { id: 'collaboration', title: 'Collaboration', icon: '👥' },
    { id: 'sandboxing', title: 'Sandboxing', icon: '📦' },
    { id: 'security', title: 'Security', icon: '🔒' },
    { id: 'ai-integration', title: 'AI Integration', icon: '🤖' },
    { id: 'quick-start', title: 'Quick Start', icon: '🚀' }
  ];

  const codeExamples = {
    websocket: `// Connect to collaboration room
const ws = new WebSocket('wss://api.itecify.com/collab/room_123');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Update received:', data);
};

// Send cursor position
ws.send(JSON.stringify({
  type: 'cursor',
  position: { line: 10, column: 5 },
  userId: 'user_123'
}));`,

    docker: `# Dockerfile for sandbox environment
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "start"]`,

    crdt: `// CRDT-based synchronization
import { CRDT } from 'itecify-crdt';

const document = new CRDT();

// Apply local changes
document.insert(0, 'console.log("Hello World");');

// Sync with remote changes
document.merge(remoteChanges);`
  };

  return (
    <div className="documentation-page">
      {/* Hero Section */}
      <section className="docs-hero">
        <div className="container">
          <Link to="/" className="back-button">← Back to Home</Link>
          <h1>Documentation</h1>
          <p className="hero-subtitle">
            Everything you need to know about iTECify - the future of collaborative coding.
            Build, collaborate, and deploy with AI-powered sandboxes.
          </p>
        </div>
      </section>

      <div className="docs-content">
        <div className="container">
          <div className="docs-layout">
            {/* Sidebar */}
            <aside className="docs-sidebar">
              <nav className="docs-nav">
                <h3>Getting Started</h3>
                <ul>
                  {sections.map(section => (
                    <li key={section.id}>
                      <button
                        className={`nav-section ${activeSection === section.id ? 'active' : ''}`}
                        onClick={() => setActiveSection(section.id)}
                      >
                        <span className="nav-icon">{section.icon}</span>
                        {section.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>

            {/* Main Content */}
            <main className="docs-main">
              {/* Overview Section */}
              {activeSection === 'overview' && (
                <section className="docs-section">
                  <h2>Welcome to iTECify</h2>
                  <p className="lead">
                    Imagine this: It's 3 AM. You, your teammate, and an AI agent are desperately 
                    trying to finish a prototype. Everything happens in the same file, the same 
                    window, without Git conflicts. This is how software should be built today.
                  </p>

                  <div className="feature-highlight">
                    <h3>What Makes iTECify Different?</h3>
                    <div className="highlight-grid">
                      <div className="highlight-card">
                        <div className="highlight-icon">🎯</div>
                        <h4>Real-time Collaboration</h4>
                        <p>Multi-cursor support for both humans and AI agents. No more "wait, let me push so you can see what I wrote."</p>
                      </div>
                      <div className="highlight-card">
                        <div className="highlight-icon">🔒</div>
                        <h4>Secure Sandboxing</h4>
                        <p>Isolated Docker containers with live vulnerability scanning before execution.</p>
                      </div>
                      <div className="highlight-card">
                        <div className="highlight-icon">🤖</div>
                        <h4>AI-Powered Development</h4>
                        <p>AI-generated code appears as movable blocks, similar to Notion, that can be accepted or rejected with one click.</p>
                      </div>
                      <div className="highlight-card">
                        <div className="highlight-icon">🚀</div>
                        <h4>Multi-language Support</h4>
                        <p>Run Node.js, Python, Rust, and more in isolated environments with on-the-fly image building.</p>
                      </div>
                    </div>
                  </div>

                  <div className="quote-block">
                    <p>"iTECify is the Figma for code - collaborative, intuitive, and powerful."</p>
                    <span>- iTEC 2026 Vision</span>
                  </div>
                </section>
              )}

              {/* Collaboration Section */}
              {activeSection === 'collaboration' && (
                <section className="docs-section">
                  <h2>Collaboration Features</h2>
                  
                  <div className="collab-features">
                    <h3>Multi-Cursor Collaboration</h3>
                    <p>
                      iTECify provides true real-time collaboration where multiple users and AI agents 
                      can work simultaneously in the same document. Every cursor is visible, every change 
                      is synchronized instantly.
                    </p>

                    <div className="feature-detail">
                      <h4>✨ Key Features</h4>
                      <ul>
                        <li><strong>Presence Awareness:</strong> See who's currently in the session and where they're working</li>
                        <li><strong>Real-time Cursors:</strong> Live cursor positions with user avatars</li>
                        <li><strong>Selection Sharing:</strong> See what others are highlighting</li>
                        <li><strong>Instant Sync:</strong> Changes appear within milliseconds using WebSockets</li>
                      </ul>
                    </div>

                    <div className="code-block">
                      <div className="code-header">
                        <span className="code-language">WebSocket Connection</span>
                        <button 
                          className="copy-button"
                          onClick={() => copyToClipboard(codeExamples.websocket, 'websocket')}
                        >
                          {copiedCode === 'websocket' ? '✓ Copied!' : 'Copy'}
                        </button>
                      </div>
                      <pre className="code-content">
                        <code>{codeExamples.websocket}</code>
                      </pre>
                    </div>

                    <div className="feature-detail">
                      <h4>🔧 CRDT-Based Synchronization</h4>
                      <p>
                        We use Conflict-Free Replicated Data Types (CRDTs) to ensure eventual consistency 
                        without requiring a central server. This means:
                      </p>
                      <ul>
                        <li>Offline-first support</li>
                        <li>Automatic conflict resolution</li>
                        <li>No data loss during network interruptions</li>
                        <li>Scalable to hundreds of concurrent users</li>
                      </ul>
                    </div>
                  </div>
                </section>
              )}

              {/* Sandboxing Section */}
              {activeSection === 'sandboxing' && (
                <section className="docs-section">
                  <h2>Sandboxing & Execution</h2>
                  
                  <div className="sandbox-features">
                    <h3>Isolated Environments with Docker</h3>
                    <p>
                      Every code execution happens in a secure Docker container, providing complete isolation 
                      and resource control. Our platform builds images on-the-fly for any language you need.
                    </p>

                    <div className="language-support">
                      <h4>Supported Languages</h4>
                      <div className="language-badges">
                        <span className="lang-badge">Node.js</span>
                        <span className="lang-badge">Python</span>
                        <span className="lang-badge">Rust</span>
                        <span className="lang-badge">Go</span>
                        <span className="lang-badge">Java</span>
                        <span className="lang-badge">C++</span>
                      </div>
                    </div>

                    <div className="code-block">
                      <div className="code-header">
                        <span className="code-language">Docker Configuration</span>
                        <button 
                          className="copy-button"
                          onClick={() => copyToClipboard(codeExamples.docker, 'docker')}
                        >
                          {copiedCode === 'docker' ? '✓ Copied!' : 'Copy'}
                        </button>
                      </div>
                      <pre className="code-content">
                        <code>{codeExamples.docker}</code>
                      </pre>
                    </div>

                    <div className="feature-detail">
                      <h4>📊 Resource Management</h4>
                      <p>
                        Smart resource limits prevent infinite loops and memory leaks from affecting the platform:
                      </p>
                      <ul>
                        <li>CPU limits per container</li>
                        <li>Memory quotas</li>
                        <li>Execution timeouts</li>
                        <li>Automatic container cleanup</li>
                      </ul>
                    </div>

                    <div className="feature-detail">
                      <h4>📡 Real-time Output Streaming</h4>
                      <p>
                        stdout and stderr are captured and streamed back to the web interface in real-time, 
                        giving you immediate feedback on your code execution.
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {/* Security Section */}
              {activeSection === 'security' && (
                <section className="docs-section">
                  <h2>Security First Approach</h2>
                  
                  <div className="security-features">
                    <h3>Pre-execution Vulnerability Scanning</h3>
                    <p>
                      Before any container starts, our system performs a thorough security scan of the code 
                      to identify potential vulnerabilities and malicious patterns.
                    </p>

                    <div className="security-checkpoints">
                      <div className="checkpoint">
                        <div className="checkpoint-icon">🔍</div>
                        <div className="checkpoint-content">
                          <h4>Dependency Scanning</h4>
                          <p>Checks package.json, requirements.txt, and Cargo.toml for known vulnerabilities</p>
                        </div>
                      </div>
                      <div className="checkpoint">
                        <div className="checkpoint-icon">🚫</div>
                        <div className="checkpoint-content">
                          <h4>Malicious Code Detection</h4>
                          <p>Scans for dangerous patterns, system calls, and suspicious behavior</p>
                        </div>
                      </div>
                      <div className="checkpoint">
                        <div className="checkpoint-icon">🔐</div>
                        <div className="checkpoint-content">
                          <h4>Network Isolation</h4>
                          <p>Containers run in isolated networks with controlled outbound access</p>
                        </div>
                      </div>
                    </div>

                    <div className="feature-detail">
                      <h4>🛡️ Security Best Practices</h4>
                      <ul>
                        <li>Each sandbox runs with minimal privileges</li>
                        <li>No persistent storage between sessions</li>
                        <li>Automatic container cleanup after session ends</li>
                        <li>Rate limiting to prevent abuse</li>
                        <li>Encrypted data at rest and in transit</li>
                      </ul>
                    </div>

                    <div className="warning-box">
                      <strong>⚠️ Important:</strong> Always review AI-generated code before execution. 
                      While our security scanning catches most threats, human oversight is still recommended.
                    </div>
                  </div>
                </section>
              )}

              {/* AI Integration Section */}
              {activeSection === 'ai-integration' && (
                <section className="docs-section">
                  <h2>AI Integration</h2>
                  
                  <div className="ai-features">
                    <h3>AI as a Collaborative Partner</h3>
                    <p>
                      In iTECify, AI isn't just an autocomplete tool - it's a full collaborator that works 
                      alongside you and your team.
                    </p>

                    <div className="ai-blocks">
                      <h4>📦 AI-Generated Code Blocks</h4>
                      <p>
                        Code generated by AI appears as movable blocks (similar to Notion blocks) that can be:
                      </p>
                      <ul>
                        <li><strong>Accepted</strong> - One click to integrate into your code</li>
                        <li><strong>Rejected</strong> - Remove with a single click</li>
                        <li><strong>Modified</strong> - Edit before accepting</li>
                        <li><strong>Discussed</strong> - Add comments and feedback</li>
                      </ul>
                    </div>

                    <div className="visual-difference">
                      <h4>👤 Human vs 🤖 AI Code</h4>
                      <div className="comparison">
                        <div className="comparison-item human">
                          <span className="comparison-label">Human-written:</span>
                          <code className="comparison-code">function calculateTotal(items) &#123; ... &#125;</code>
                        </div>
                        <div className="comparison-item ai">
                          <span className="comparison-label">AI-generated:</span>
                          <code className="comparison-code block">[AI Block] Optimized algorithm suggestion</code>
                        </div>
                      </div>
                      <p className="note">
                        AI code is visually distinct and can be accepted, rejected, or modified with one click.
                      </p>
                    </div>

                    <div className="feature-detail">
                      <h4>🎯 AI Capabilities</h4>
                      <ul>
                        <li>Code completion and suggestion</li>
                        <li>Automated refactoring suggestions</li>
                        <li>Bug detection and fixes</li>
                        <li>Documentation generation</li>
                        <li>Test case generation</li>
                      </ul>
                    </div>
                  </div>
                </section>
              )}

              {/* Quick Start Section */}
              {activeSection === 'quick-start' && (
                <section className="docs-section">
                  <h2>Quick Start Guide</h2>
                  
                  <div className="quick-start-steps">
                    <div className="step">
                      <div className="step-number">1</div>
                      <div className="step-content">
                        <h3>Create an Account</h3>
                        <p>Sign up for free at <Link to="/signup">itecify.com/signup</Link>. No credit card required for the free tier.</p>
                      </div>
                    </div>

                    <div className="step">
                      <div className="step-number">2</div>
                      <div className="step-content">
                        <h3>Create Your First Sandbox</h3>
                        <p>Click "New Sandbox" and choose your language. Your environment will be ready in seconds.</p>
                      </div>
                    </div>

                    <div className="step">
                      <div className="step-number">3</div>
                      <div className="step-content">
                        <h3>Invite Collaborators</h3>
                        <p>Share the room link with your teammates. They can join instantly without installation.</p>
                      </div>
                    </div>

                    <div className="step">
                      <div className="step-number">4</div>
                      <div className="step-content">
                        <h3>Start Coding Together</h3>
                        <p>Write code, see cursors, and collaborate in real-time. AI suggestions appear as you type.</p>
                      </div>
                    </div>

                    <div className="step">
                      <div className="step-number">5</div>
                      <div className="step-content">
                        <h3>Run and Test</h3>
                        <p>Execute your code directly in the sandbox. View output in real-time through the integrated terminal.</p>
                      </div>
                    </div>
                  </div>

                  <div className="feature-detail">
                    <h4>🚀 Bonus Features to Explore</h4>
                    <ul>
                      <li><strong>Shared Terminal:</strong> Run commands together and see output live</li>
                      <li><strong>Time-Travel Debugging:</strong> Rewind to any point in your coding session</li>
                      <li><strong>Resource Monitoring:</strong> Track CPU and memory usage in real-time</li>
                    </ul>
                  </div>

                  <div className="cta-box">
                    <h3>Ready to Build the Future?</h3>
                    <p>Join thousands of developers already using iTECify for collaborative coding.</p>
                    <Link to="/signup" className="cta-button">Start Building →</Link>
                  </div>
                </section>
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documentation;