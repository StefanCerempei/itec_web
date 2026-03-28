import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Welcome from './pages/Welcome'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import CollabHub from './pages/CollabHub'
import CollabRoom from './pages/CollabRoom'
import './App.css'

function App() {
    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route path="/" element={<Welcome />} />
                    <Route path="/signin" element={<SignIn />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/collab" element={<CollabHub />} />
                    <Route path="/collab/:roomId" element={<CollabRoom />} />
                    <Route path="/collab/:roomId/:fileId" element={<CollabRoom />} />
                </Routes>
            </div>
        </Router>
    )
}

export default App
