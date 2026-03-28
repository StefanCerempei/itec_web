import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../lib/apiBaseUrl';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './CollabHub.css';

function CollabHub() {
    const navigate = useNavigate();
    const apiBaseUrl = API_BASE_URL;

    const toPositiveInt = (value) => {
        const parsed = Number(value);
        return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
    };

    const stablePositiveIntFromSeed = (seed) => {
        const str = String(seed || 'guest-user');
        let hash = 0;
        for (let i = 0; i < str.length; i += 1) {
            hash = (hash << 5) - hash + str.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash) + 1;
    };

    const [roomName, setRoomName] = useState('My Realtime Session');
    const [roomJoinToken, setRoomJoinToken] = useState('');
    const [createRoomPassword, setCreateRoomPassword] = useState('');
    const [joinRoomPassword, setJoinRoomPassword] = useState('');
    const [isBusy, setIsBusy] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [roomNotice, setRoomNotice] = useState('');

    const currentUser = useMemo(() => {
        const fallback = {
            id: 'guest-user',
            numericId: stablePositiveIntFromSeed('guest-user'),
            name: 'Guest User',
            email: null,
        };
        const raw = localStorage.getItem('authUser');
        if (!raw) return fallback;

        try {
            const parsed = JSON.parse(raw);
            const email = parsed?.email || parsed?.user_metadata?.email || null;
            const identitySeed = parsed?.id || email || parsed?.name || 'guest-user';
            const normalizedId = toPositiveInt(parsed?.id) ?? stablePositiveIntFromSeed(identitySeed);
            return {
                id: String(identitySeed),
                numericId: normalizedId,
                name:
                    `${parsed?.firstName || ''} ${parsed?.lastName || ''}`.trim() ||
                    parsed?.name ||
                    email ||
                    'Guest User',
                email,
            };
        } catch {
            return fallback;
        }
    }, []);

    const joinRoom = async ({ roomToken, password = '' }) => {
        try {
            const response = await fetch(`${apiBaseUrl}/api/rooms/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomToken, password, userId: currentUser.numericId }),
            });

            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload.message || 'Failed to join room');
            }

            const roomId = Number(payload.roomId);
            if (!Number.isInteger(roomId) || roomId <= 0) {
                throw new Error('Server did not return a valid room id.');
            }

            navigate(`/collab/${roomId}`);
        } catch (error) {
            throw error;
        }
    };

    const createRoom = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setRoomNotice('');

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
                body: JSON.stringify({
                    name: trimmed,
                    password: createRoomPassword,
                    userId: currentUser.numericId,
                }),
            });

            const payload = await res.json();
            if (!res.ok) throw new Error(payload.message || 'Unable to create room.');

            const createdRoomCode = String(payload?.room?.roomcode || '').trim();
            if (createdRoomCode) {
                setRoomNotice(`Room created. Share this code: ${createdRoomCode}`);
            }

            await joinRoom({
                roomToken: payload.room.id,
                password: createRoomPassword,
            });
        } catch (error) {
            setErrorMessage(error.message || 'Failed to create room.');
            setIsBusy(false);
        }
    };

    const handleJoinExisting = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setRoomNotice('');

        const token = roomJoinToken.trim();
        if (!token) {
            setErrorMessage('Enter a room ID or room code.');
            return;
        }

        setIsBusy(true);
        try {
            await joinRoom({
                roomToken: token,
                password: joinRoomPassword,
            });
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
                        {roomNotice && <p className="hub-success">{roomNotice}</p>}

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
                                <input
                                    id="createRoomPassword"
                                    type="password"
                                    value={createRoomPassword}
                                    onChange={(e) => setCreateRoomPassword(e.target.value)}
                                    placeholder="Optional room password"
                                    disabled={isBusy}
                                />
                                <button type="submit" disabled={isBusy}>
                                    {isBusy ? 'Working...' : 'Create & Open'}
                                </button>
                            </form>

                            <form className="hub-form" onSubmit={handleJoinExisting}>
                                <label htmlFor="roomToken">Join by room ID or code</label>
                                <input
                                    id="roomToken"
                                    type="text"
                                    value={roomJoinToken}
                                    onChange={(e) => setRoomJoinToken(e.target.value)}
                                    placeholder="e.g. 12 or AB4K9Q2M"
                                    disabled={isBusy}
                                />
                                <input
                                    id="joinRoomPassword"
                                    type="password"
                                    value={joinRoomPassword}
                                    onChange={(e) => setJoinRoomPassword(e.target.value)}
                                    placeholder="Room password (if required)"
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
                                            <p>Start a new session with a custom name and optional password, or join with room ID/code</p>
                                        </div>
                                    </div>
                                    <div className="step">
                                        <div className="step-number">2</div>
                                        <div className="step-content">
                                            <strong>Invite Collaborators</strong>
                                            <p>Share the room code and password (if set) with team members to invite them securely</p>
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
                                    <li>🔹 Prefer sharing room codes instead of raw numeric IDs</li>
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