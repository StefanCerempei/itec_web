import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../lib/apiBaseUrl';
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
    await fetch(`${apiBaseUrl}/api/rooms/${roomId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id }),
    });

    navigate(`/collab/${roomId}`);
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
    } finally {
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
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Session name"
            />
            <button type="submit" disabled={isBusy}>
              {isBusy ? 'Working...' : 'Create & Open'}
            </button>
          </form>

          <form className="hub-form" onSubmit={handleJoinExisting}>
            <label htmlFor="roomId">Join by room ID</label>
            <input
              id="roomId"
              value={roomIdInput}
              onChange={(e) => setRoomIdInput(e.target.value)}
              placeholder="e.g. 1"
            />
            <button type="submit" disabled={isBusy}>
              {isBusy ? 'Working...' : 'Join Room'}
            </button>
          </form>
        </div>

        <div className="collab-hub-footer">
          <Link to="/" className="hub-home-link">Back Home</Link>
        </div>
      </div>
    </div>
  );
}

export default CollabHub;
