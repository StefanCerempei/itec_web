import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Welcome from './pages/Welcome'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import CollabHub from './pages/CollabHub'
import CollabRoom from './pages/CollabRoom'
import Demo from './pages/Demo'
import Pricing from './pages/Pricing'
import Contact from './pages/Contact'
import Careers from './pages/Careers'
import ApiReference from './pages/ApiReference'
import Documentation from './pages/Documentation'
import About from './pages/About'
import Blog from './pages/Blog'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'
import GDPR from './pages/GDPR'
import Security from './pages/Security'
import './App.css'

function HomeEntry() {
    if (typeof window === 'undefined') return <Welcome />
    const isAuthenticated = Boolean(window.localStorage.getItem('authToken'))
    return isAuthenticated ? <Navigate to="/collab" replace /> : <Welcome />
}

function FallbackEntry() {
    if (typeof window === 'undefined') return <Navigate to="/" replace />
    const isAuthenticated = Boolean(window.localStorage.getItem('authToken'))
    return isAuthenticated ? <Navigate to="/collab" replace /> : <Navigate to="/" replace />
}

function App() {
    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route path="/" element={<HomeEntry />} />
                    <Route path="/signin" element={<SignIn />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/collab" element={<CollabHub />} />
                    <Route path="/collab/:roomId" element={<CollabRoom />} />
                    <Route path="/collab/:roomId/:fileId" element={<CollabRoom />} />
                    <Route path="/demo" element={<Demo />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/careers" element={<Careers />} />
                    <Route path="/api-reference" element={<ApiReference />} />
                    <Route path="/documentation" element={<Documentation />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/blog" element={<Blog />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/terms" element={<TermsOfService />} />
                    <Route path="/gdpr" element={<GDPR />} />
                    <Route path="/security" element={<Security />} />
                    <Route path="*" element={<FallbackEntry />} />
                </Routes>
            </div>
        </Router>
    )
}

export default App