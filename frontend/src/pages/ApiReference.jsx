import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './ApiReference.css';

const ApiReference = () => {
  const [activeSection, setActiveSection] = useState('authentication');
  const [copiedEndpoint, setCopiedEndpoint] = useState(null);

  const endpoints = [
    {
      method: 'GET',
      path: '/api/sandboxes',
      description: 'Get all sandboxes for the authenticated user',
      auth: 'Required',
      response: `{
  "sandboxes": [
    {
      "id": "sbx_123",
      "name": "My Project",
      "language": "javascript",
      "createdAt": "2026-03-28T10:00:00Z",
      "files": ["index.js", "package.json"]
    }
  ]
}`
    },
    {
      method: 'POST',
      path: '/api/sandboxes',
      description: 'Create a new sandbox',
      auth: 'Required',
      body: `{
  "name": "New Project",
  "language": "javascript",
  "template": "react"
}`,
      response: `{
  "id": "sbx_456",
  "name": "New Project",
  "language": "javascript",
  "createdAt": "2026-03-28T10:30:00Z",
  "status": "active"
}`
    },
    {
      method: 'GET',
      path: '/api/sandboxes/:id',
      description: 'Get a specific sandbox by ID',
      auth: 'Required',
      response: `{
  "id": "sbx_123",
  "name": "My Project",
  "language": "javascript",
  "files": [
    {
      "name": "index.js",
      "content": "console.log('Hello World');",
      "language": "javascript"
    }
  ],
  "collaborators": ["user@example.com"]
}`
    },
    {
      method: 'PUT',
      path: '/api/sandboxes/:id',
      description: 'Update an existing sandbox',
      auth: 'Required',
      body: `{
  "name": "Updated Project Name",
  "files": [
    {
      "name": "index.js",
      "content": "const greeting = 'Hello World';\\nconsole.log(greeting);"
    }
  ]
}`,
      response: `{
  "id": "sbx_123",
  "name": "Updated Project Name",
  "updatedAt": "2026-03-28T11:00:00Z"
}`
    },
    {
      method: 'DELETE',
      path: '/api/sandboxes/:id',
      description: 'Delete a sandbox',
      auth: 'Required',
      response: `{
  "message": "Sandbox deleted successfully",
  "id": "sbx_123"
}`
    },
    {
      method: 'POST',
      path: '/api/collab/rooms',
      description: 'Create a new collaboration room',
      auth: 'Required',
      body: `{
  "name": "Team Meeting",
  "sandboxId": "sbx_123",
  "maxParticipants": 5
}`,
      response: `{
  "roomId": "room_789",
  "joinUrl": "https://itecify.com/collab/room_789",
  "expiresAt": "2026-03-28T12:00:00Z"
}`
    },
    {
      method: 'POST',
      path: '/api/collab/rooms/:roomId/join',
      description: 'Join an existing collaboration room',
      auth: 'Required',
      body: `{
  "userId": "user_456"
}`,
      response: `{
  "roomId": "room_789",
  "participants": ["user_123", "user_456"],
  "sandbox": {
    "id": "sbx_123",
    "files": [...]
  }
}`
    }
  ];

  const copyToClipboard = (text, endpoint) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(endpoint);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const sections = [
    { id: 'authentication', title: 'Authentication', icon: '🔐' },
    { id: 'sandboxes', title: 'Sandboxes', icon: '📦' },
    { id: 'collaboration', title: 'Collaboration', icon: '👥' },
    { id: 'errors', title: 'Error Handling', icon: '⚠️' },
    { id: 'rateLimits', title: 'Rate Limits', icon: '⏱️' }
  ];

  return (
    <div className="api-reference-page">
      {/* Hero Section */}
      <section className="api-hero">
        <div className="container">
          <Link to="/" className="back-button">← Back to Home</Link>
          <h1>API Reference</h1>
          <p className="hero-subtitle">
            Build powerful integrations with iTECify's REST API. Everything you need to 
            create, manage, and collaborate on code programmatically.
          </p>
          <div className="api-badge">
            <span className="badge">Base URL: https://api.itecify.com/v1</span>
          </div>
        </div>
      </section>

      <div className="api-content">
        <div className="container">
          <div className="api-layout">
            {/* Sidebar */}
            <aside className="api-sidebar">
              <nav className="api-nav">
                <h3>API Reference</h3>
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
            <main className="api-main">
              {/* Authentication Section */}
              {activeSection === 'authentication' && (
                <section className="api-section">
                  <h2>Authentication</h2>
                  <p>
                    All API requests require authentication using an API key. You can generate 
                    your API keys from your account dashboard.
                  </p>
                  
                  <div className="auth-methods">
                    <h3>API Key Authentication</h3>
                    <div className="code-block">
                      <div className="code-header">
                        <span className="code-language">HTTP Header</span>
                        <button 
                          className="copy-button"
                          onClick={() => copyToClipboard('Authorization: Bearer YOUR_API_KEY', 'auth')}
                        >
                          {copiedEndpoint === 'auth' ? '✓ Copied!' : 'Copy'}
                        </button>
                      </div>
                      <pre className="code-content">
                        <code>Authorization: Bearer YOUR_API_KEY</code>
                      </pre>
                    </div>

                    <h3>Example Request</h3>
                    <div className="code-block">
                      <div className="code-header">
                        <span className="code-language">cURL</span>
                        <button 
                          className="copy-button"
                          onClick={() => copyToClipboard('curl -X GET https://api.itecify.com/v1/sandboxes \\\n  -H "Authorization: Bearer YOUR_API_KEY"', 'curl')}
                        >
                          {copiedEndpoint === 'curl' ? '✓ Copied!' : 'Copy'}
                        </button>
                      </div>
                      <pre className="code-content">
                        <code>{`curl -X GET https://api.itecify.com/v1/sandboxes \\
  -H "Authorization: Bearer YOUR_API_KEY"`}</code>
                      </pre>
                    </div>
                  </div>
                </section>
              )}

              {/* Sandboxes Section */}
              {activeSection === 'sandboxes' && (
                <section className="api-section">
                  <h2>Sandboxes Endpoints</h2>
                  <p>
                    Create, read, update, and delete sandboxes. Sandboxes are isolated 
                    development environments where you can write and run code.
                  </p>
                  
                  {endpoints.filter(ep => ep.path.includes('sandboxes')).map((endpoint, idx) => (
                    <div key={idx} className="endpoint-card">
                      <div className="endpoint-header">
                        <span className={`method ${endpoint.method.toLowerCase()}`}>
                          {endpoint.method}
                        </span>
                        <code className="endpoint-path">{endpoint.path}</code>
                        <button 
                          className="copy-endpoint"
                          onClick={() => copyToClipboard(endpoint.path, `endpoint-${idx}`)}
                        >
                          {copiedEndpoint === `endpoint-${idx}` ? '✓' : '📋'}
                        </button>
                      </div>
                      <p className="endpoint-description">{endpoint.description}</p>
                      <div className="endpoint-details">
                        <div className="detail-item">
                          <strong>Authentication:</strong> {endpoint.auth}
                        </div>
                        {endpoint.body && (
                          <div className="detail-item">
                            <strong>Request Body:</strong>
                            <div className="code-block small">
                              <div className="code-header">
                                <span className="code-language">JSON</span>
                                <button 
                                  className="copy-button"
                                  onClick={() => copyToClipboard(endpoint.body, `body-${idx}`)}
                                >
                                  {copiedEndpoint === `body-${idx}` ? '✓' : 'Copy'}
                                </button>
                              </div>
                              <pre className="code-content">
                                <code>{endpoint.body}</code>
                              </pre>
                            </div>
                          </div>
                        )}
                        <div className="detail-item">
                          <strong>Response:</strong>
                          <div className="code-block small">
                            <div className="code-header">
                              <span className="code-language">JSON</span>
                              <button 
                                className="copy-button"
                                onClick={() => copyToClipboard(endpoint.response, `response-${idx}`)}
                              >
                                {copiedEndpoint === `response-${idx}` ? '✓' : 'Copy'}
                              </button>
                            </div>
                            <pre className="code-content">
                              <code>{endpoint.response}</code>
                            </pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </section>
              )}

              {/* Collaboration Section */}
              {activeSection === 'collaboration' && (
                <section className="api-section">
                  <h2>Collaboration Endpoints</h2>
                  <p>
                    Manage real-time collaboration sessions, rooms, and participant interactions.
                  </p>
                  
                  {endpoints.filter(ep => ep.path.includes('collab')).map((endpoint, idx) => (
                    <div key={idx} className="endpoint-card">
                      <div className="endpoint-header">
                        <span className={`method ${endpoint.method.toLowerCase()}`}>
                          {endpoint.method}
                        </span>
                        <code className="endpoint-path">{endpoint.path}</code>
                        <button 
                          className="copy-endpoint"
                          onClick={() => copyToClipboard(endpoint.path, `collab-${idx}`)}
                        >
                          {copiedEndpoint === `collab-${idx}` ? '✓' : '📋'}
                        </button>
                      </div>
                      <p className="endpoint-description">{endpoint.description}</p>
                      <div className="endpoint-details">
                        <div className="detail-item">
                          <strong>Authentication:</strong> {endpoint.auth}
                        </div>
                        {endpoint.body && (
                          <div className="detail-item">
                            <strong>Request Body:</strong>
                            <div className="code-block small">
                              <div className="code-header">
                                <span className="code-language">JSON</span>
                                <button 
                                  className="copy-button"
                                  onClick={() => copyToClipboard(endpoint.body, `collab-body-${idx}`)}
                                >
                                  {copiedEndpoint === `collab-body-${idx}` ? '✓' : 'Copy'}
                                </button>
                              </div>
                              <pre className="code-content">
                                <code>{endpoint.body}</code>
                              </pre>
                            </div>
                          </div>
                        )}
                        <div className="detail-item">
                          <strong>Response:</strong>
                          <div className="code-block small">
                            <div className="code-header">
                              <span className="code-language">JSON</span>
                              <button 
                                className="copy-button"
                                onClick={() => copyToClipboard(endpoint.response, `collab-response-${idx}`)}
                              >
                                {copiedEndpoint === `collab-response-${idx}` ? '✓' : 'Copy'}
                              </button>
                            </div>
                            <pre className="code-content">
                              <code>{endpoint.response}</code>
                            </pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </section>
              )}

              {/* Error Handling Section */}
              {activeSection === 'errors' && (
                <section className="api-section">
                  <h2>Error Handling</h2>
                  <p>
                    The API uses standard HTTP status codes to indicate the success or failure of a request.
                  </p>
                  
                  <div className="error-codes">
                    <h3>Common Error Codes</h3>
                    <div className="error-table">
                      <div className="error-row">
                        <span className="error-code">400</span>
                        <span className="error-message">Bad Request - The request was invalid</span>
                      </div>
                      <div className="error-row">
                        <span className="error-code">401</span>
                        <span className="error-message">Unauthorized - Missing or invalid API key</span>
                      </div>
                      <div className="error-row">
                        <span className="error-code">403</span>
                        <span className="error-message">Forbidden - You don't have permission</span>
                      </div>
                      <div className="error-row">
                        <span className="error-code">404</span>
                        <span className="error-message">Not Found - The resource doesn't exist</span>
                      </div>
                      <div className="error-row">
                        <span className="error-code">429</span>
                        <span className="error-message">Too Many Requests - Rate limit exceeded</span>
                      </div>
                      <div className="error-row">
                        <span className="error-code">500</span>
                        <span className="error-message">Internal Server Error - Something went wrong</span>
                      </div>
                    </div>

                    <h3>Error Response Format</h3>
                    <div className="code-block">
                      <div className="code-header">
                        <span className="code-language">JSON</span>
                        <button 
                          className="copy-button"
                          onClick={() => copyToClipboard(`{
  "error": {
    "code": "invalid_request",
    "message": "The request was invalid",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  }
}`, 'error')}
                        >
                          {copiedEndpoint === 'error' ? '✓ Copied!' : 'Copy'}
                        </button>
                      </div>
                      <pre className="code-content">
                        <code>{`{
  "error": {
    "code": "invalid_request",
    "message": "The request was invalid",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  }
}`}</code>
                      </pre>
                    </div>
                  </div>
                </section>
              )}

              {/* Rate Limits Section */}
              {activeSection === 'rateLimits' && (
                <section className="api-section">
                  <h2>Rate Limits</h2>
                  <p>
                    API requests are rate limited to ensure fair usage and platform stability.
                  </p>
                  
                  <div className="rate-limits">
                    <div className="limit-card">
                      <h3>Free Tier</h3>
                      <div className="limit-value">100 requests/hour</div>
                      <p>Perfect for testing and small projects</p>
                    </div>
                    <div className="limit-card">
                      <h3>Pro Tier</h3>
                      <div className="limit-value">1,000 requests/hour</div>
                      <p>For production applications</p>
                    </div>
                    <div className="limit-card">
                      <h3>Enterprise</h3>
                      <div className="limit-value">Custom limits</div>
                      <p>Contact us for custom rate limits</p>
                    </div>
                  </div>

                  <h3>Rate Limit Headers</h3>
                  <div className="code-block">
                    <div className="code-header">
                      <span className="code-language">Headers</span>
                      <button 
                        className="copy-button"
                        onClick={() => copyToClipboard(`X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1617123600`, 'headers')}
                      >
                        {copiedEndpoint === 'headers' ? '✓ Copied!' : 'Copy'}
                      </button>
                    </div>
                    <pre className="code-content">
                      <code>{`X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1617123600`}</code>
                    </pre>
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

export default ApiReference;