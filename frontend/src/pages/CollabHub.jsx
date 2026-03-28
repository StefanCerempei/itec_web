import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../lib/apiBaseUrl';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './CollabHub.css';

function CollabHub() {
    const navigate = useNavigate();
    const apiBaseUrl = API_BASE_URL;

    const [roomName, setRoomName] = useState('My Realtime Session');
    const [roomIdInput, setRoomIdInput] = useState('');
    const [isBusy, setIsBusy] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const currentUser = useMemo(() => {
        const fallback = { id: 1, name: 'Guest User', email: null };
        const raw = localStorage.getItem('authUser');
        if (!raw) return fallback;

        try {
            const parsed = JSON.parse(raw);
            return {
                id: parsed?.id || 1,
                name:
                    `${parsed?.firstName || ''} ${parsed?.lastName || ''}`.trim() ||
                    parsed?.name ||
                    parsed?.email ||
                    'Guest User',
                email: parsed?.email || parsed?.user_metadata?.email || null,
            };
        } catch {
            return fallback;
        }
    }, []);

    const joinRoom = async (roomId) => {
        try {
            const response = await fetch(`${apiBaseUrl}/api/rooms/${roomId}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser.id }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to join room');
            }

            navigate(`/collab/${roomId}`);
        } catch (error) {
            throw error;
        }
    };

    const createRoom = async (e) => {
        e.preventDefault();
        setErrorMessage('');

        const trimmed = roomName.trim();
        if (!trimmed) {
            setErrorMessage('Please add a room name.');
            return;
        }

        setIsBusy(true);
        try {
            const res = await fetch(`${apiBaseUrl}/api/rooms`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: trimmed, userId: currentUser.id }),
            });

            const payload = await res.json();
            if (!res.ok) throw new Error(payload.message || 'Unable to create room.');

            await joinRoom(payload.room.id);
        } catch (error) {
            setErrorMessage(error.message || 'Failed to create room.');
            setIsBusy(false);
        }
    };

    const handleJoinExisting = async (e) => {
        e.preventDefault();
        setErrorMessage('');

        const roomId = Number(roomIdInput);
        if (!Number.isInteger(roomId) || roomId <= 0) {
            setErrorMessage('Enter a valid numeric room id.');
            return;
        }

        setIsBusy(true);
        try {
            await joinRoom(roomId);
        } catch (error) {
            setErrorMessage(error.message || 'Failed to join room.');
            setIsBusy(false);
        }
    };

    return (
        <div className="collab-hub-container">
            <Navbar />

            <main className="collab-hub-main">
                <div className="collab-hub-shell">
                    <div className="collab-hub-glow" />

                    <div className="collab-hub-card">
                        <div className="collab-hub-heading">
                            <span className="collab-hub-badge">Realtime Workspace</span>
                            <h1>Create Session</h1>
                            <p>Start your own collaboration session, then jump straight into your editor with realtime sync.</p>
                            <div className="collab-hub-user">Signed in as: <strong>{currentUser.name}</strong></div>
                        </div>

                        {errorMessage && <p className="hub-error">{errorMessage}</p>}

                        <div className="collab-hub-grid">
                            <form className="hub-form" onSubmit={createRoom}>
                                <label htmlFor="roomName">Create a new room</label>
                                <input
                                    id="roomName"
                                    type="text"
                                    value={roomName}
                                    onChange={(e) => setRoomName(e.target.value)}
                                    placeholder="Session name"
                                    disabled={isBusy}
                                />
                                <button type="submit" disabled={isBusy}>
                                    {isBusy ? 'Working...' : 'Create & Open'}
                                </button>
                            </form>

                            <form className="hub-form" onSubmit={handleJoinExisting}>
                                <label htmlFor="roomId">Join by room ID</label>
                                <input
                                    id="roomId"
                                    type="number"
                                    value={roomIdInput}
                                    onChange={(e) => setRoomIdInput(e.target.value)}
                                    placeholder="e.g. 1"
                                    disabled={isBusy}
                                />
                                <button type="submit" disabled={isBusy}>
                                    {isBusy ? 'Working...' : 'Join Room'}
                                </button>
                            </form>
                        </div>

                        {/* Additional Information Sections */}
                        <div className="collab-hub-info-sections">
                            {/* Features Section */}
                            <div className="info-section">
                                <div className="info-header">
                                    <span className="info-icon">✨</span>
                                    <h3>Features</h3>
                                </div>
                                <div className="features-grid">
                                    <div className="feature-item">
                                        <span className="feature-icon">⚡</span>
                                        <div>
                                            <strong>Real-time Sync</strong>
                                            <p>Changes appear instantly for all participants</p>
                                        </div>
                                    </div>
                                    <div className="feature-item">
                                        <span className="feature-icon">👥</span>
                                        <div>
                                            <strong>Multiple Participants</strong>
                                            <p>Collaborate with team members in real-time</p>
                                        </div>
                                    </div>
                                    <div className="feature-item">
                                        <span className="feature-icon">💾</span>
                                        <div>
                                            <strong>Auto-save</strong>
                                            <p>Your work is automatically saved</p>
                                        </div>
                                    </div>
                                    <div className="feature-item">
                                        <span className="feature-icon">🔒</span>
                                        <div>
                                            <strong>Secure Sessions</strong>
                                            <p>Private rooms with secure access</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* How It Works Section */}
                            <div className="info-section">
                                <div className="info-header">
                                    <span className="info-icon">📖</span>
                                    <h3>How It Works</h3>
                                </div>
                                <div className="steps-container">
                                    <div className="step">
                                        <div className="step-number">1</div>
                                        <div className="step-content">
                                            <strong>Create or Join a Room</strong>
                                            <p>Start a new session with a custom name or join an existing one using the room ID</p>
                                        </div>
                                    </div>
                                    <div className="step">
                                        <div className="step-number">2</div>
                                        <div className="step-content">
                                            <strong>Invite Collaborators</strong>
                                            <p>Share the room ID with team members to invite them to your session</p>
                                        </div>
                                    </div>
                                    <div className="step">
                                        <div className="step-number">3</div>
                                        <div className="step-content">
                                            <strong>Start Collaborating</strong>
                                            <p>Edit, chat, and work together in real-time with instant updates</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tips Section */}
                            <div className="info-section tips-section">
                                <div className="info-header">
                                    <span className="info-icon">💡</span>
                                    <h3>Pro Tips</h3>
                                </div>
                                <ul className="tips-list">
                                    <li>🔹 Use descriptive room names to easily identify your sessions</li>
                                    <li>🔹 Share room IDs securely with your intended collaborators only</li>
                                    <li>🔹 You can join multiple rooms simultaneously in different tabs</li>
                                    <li>🔹 All sessions are automatically saved - never lose your work</li>
                                    <li>🔹 Use the chat feature to communicate with team members in real-time</li>
                                </ul>
                            </div>

                            {/* Active Rooms Section (Placeholder) */}
                            <div className="info-section active-rooms">
                                <div className="info-header">
                                    <span className="info-icon">🟢</span>
                                    <h3>Active Sessions</h3>
                                </div>
                                <p className="active-rooms-note">Your recent and active sessions will appear here once you start collaborating.</p>
                                <div className="rooms-placeholder">
                                    <div className="placeholder-item">
                                        <span className="placeholder-icon">🏠</span>
                                        <span>No active sessions yet. Create or join a room to get started!</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default CollabHub;