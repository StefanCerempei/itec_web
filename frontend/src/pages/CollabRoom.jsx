import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import Editor from '@monaco-editor/react';
import './CollabRoom.css';

function CollabRoom() {
  const { roomId, fileId: fileIdParam } = useParams();
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  const [fileId, setFileId] = useState(fileIdParam ? Number(fileIdParam) : null);
  const [filePath, setFilePath] = useState('main.js');
  const [language, setLanguage] = useState('javascript');
  const [content, setContent] = useState('');
  const [members, setMembers] = useState([]);
  const [stdin, setStdin] = useState('');
  const [runOutput, setRunOutput] = useState('');
  const [runStatus, setRunStatus] = useState('idle');
  const [status, setStatus] = useState('connecting');
  const [saveStatus, setSaveStatus] = useState('idle');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const socketRef = useRef(null);
  const applyingRemoteRef = useRef(false);
  const editorRef = useRef(null);

  const inferLanguageFromPath = (pathValue) => {
    const normalized = String(pathValue || '').toLowerCase();
    if (normalized.endsWith('.js') || normalized.endsWith('.mjs') || normalized.endsWith('.cjs')) return 'javascript';
    if (normalized.endsWith('.ts') || normalized.endsWith('.tsx')) return 'typescript';
    if (normalized.endsWith('.jsx')) return 'javascript';
    if (normalized.endsWith('.py')) return 'python';
    if (normalized.endsWith('.java')) return 'java';
    if (normalized.endsWith('.go')) return 'go';
    if (normalized.endsWith('.rs')) return 'rust';
    if (normalized.endsWith('.cpp') || normalized.endsWith('.cc') || normalized.endsWith('.cxx')) return 'cpp';
    if (normalized.endsWith('.c')) return 'c';
    if (normalized.endsWith('.cs')) return 'csharp';
    if (normalized.endsWith('.json')) return 'json';
    if (normalized.endsWith('.html')) return 'html';
    if (normalized.endsWith('.css')) return 'css';
    if (normalized.endsWith('.md')) return 'markdown';
    if (normalized.endsWith('.sql')) return 'sql';
    if (normalized.endsWith('.yml') || normalized.endsWith('.yaml')) return 'yaml';
    return 'plaintext';
  };

  const colorFromSeed = (seed) => {
    const str = String(seed || 'member');
    let hash = 0;
    for (let i = 0; i < str.length; i += 1) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue} 75% 60%)`;
  };

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

  useEffect(() => {
    let cancelled = false;

    const bootstrapFile = async () => {
      try {
        setErrorMessage('');
        const numericRoomId = Number(roomId);
        if (!Number.isInteger(numericRoomId) || numericRoomId <= 0) {
          throw new Error('Invalid room id in URL.');
        }

        if (fileIdParam) {
          const res = await fetch(`${apiBaseUrl}/api/rooms/${numericRoomId}/files/${fileIdParam}`);
          const payload = await res.json();
          if (!res.ok) throw new Error(payload.message || 'Failed to load file.');
          if (cancelled) return;
          setFileId(payload.file.id);
          setFilePath(payload.file.path || 'main.js');
          setLanguage(payload.file.language || inferLanguageFromPath(payload.file.path));
          setContent(payload.file.content || '');
          setHasUnsavedChanges(false);
          return;
        }

        const listRes = await fetch(`${apiBaseUrl}/api/rooms/${numericRoomId}/files`);
        const listPayload = await listRes.json();
        if (!listRes.ok) throw new Error(listPayload.message || 'Failed to list room files.');

        if (cancelled) return;

        const firstFile = (listPayload.files || [])[0];
        if (firstFile) {
          const fileRes = await fetch(`${apiBaseUrl}/api/rooms/${numericRoomId}/files/${firstFile.id}`);
          const filePayload = await fileRes.json();
          if (!fileRes.ok) throw new Error(filePayload.message || 'Failed to load file.');

          if (cancelled) return;
          setFileId(filePayload.file.id);
          setFilePath(filePayload.file.path || 'main.js');
          setLanguage(filePayload.file.language || inferLanguageFromPath(filePayload.file.path));
          setContent(filePayload.file.content || '');
          setHasUnsavedChanges(false);
          return;
        }

        const createRes = await fetch(`${apiBaseUrl}/api/rooms/${numericRoomId}/files`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: 'main.js',
            language: 'javascript',
            content: '',
            userId: currentUser.id,
          }),
        });

        const createPayload = await createRes.json();
        if (!createRes.ok) throw new Error(createPayload.message || 'Failed to create initial file.');

        if (cancelled) return;
        setFileId(createPayload.file.id);
        setFilePath(createPayload.file.path || 'main.js');
        setLanguage(createPayload.file.language || inferLanguageFromPath(createPayload.file.path));
        setContent(createPayload.file.content || '');
        setHasUnsavedChanges(false);
      } catch (error) {
        if (!cancelled) setErrorMessage(error.message || 'Unable to initialize collaboration file.');
      }
    };

    bootstrapFile();
    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, currentUser.id, fileIdParam, roomId]);

  useEffect(() => {
    const numericRoomId = Number(roomId);
    if (!fileId || !Number.isInteger(numericRoomId) || numericRoomId <= 0) return;

    const socket = io(apiBaseUrl, {
      transports: ['websocket'],
      withCredentials: true,
    });

    socketRef.current = socket;
    setStatus('connecting');

    socket.on('connect', () => {
      setStatus('connected');
      socket.emit('room:join', {
        roomId: numericRoomId,
        fileId,
        user: currentUser,
      });
    });

    socket.on('disconnect', () => {
      setStatus('disconnected');
    });

    socket.on('room:error', (payload) => {
      setErrorMessage(payload?.message || 'Room connection failed.');
    });

    socket.on('room:joined', (payload) => {
      if (typeof payload.content === 'string' && payload.content !== content) {
        applyingRemoteRef.current = true;
        setContent(payload.content);
        setHasUnsavedChanges(false);
      }
      setMembers(payload.members || []);
    });

    socket.on('presence:state', (payload) => {
      setMembers(payload.members || []);
    });

    socket.on('editor:update', (payload) => {
      if (typeof payload?.content !== 'string') return;
      applyingRemoteRef.current = true;
      setContent(payload.content);
      setHasUnsavedChanges(false);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [apiBaseUrl, currentUser, fileId, roomId]);

  const emitCursor = () => {
    const socket = socketRef.current;
    const editor = editorRef.current;
    if (!socket || !editor) return;

    const model = editor.getModel();
    const position = editor.getPosition();
    if (!model || !position) return;

    const offset = model.getOffsetAt(position);

    socket.emit('presence:cursor', {
      roomId: Number(roomId),
      fileId,
      cursor: offset || 0,
    });
  };

  const onLocalContentChange = (nextContent) => {
    if (applyingRemoteRef.current) {
      applyingRemoteRef.current = false;
      setContent(nextContent);
      return;
    }

    setContent(nextContent);
    setHasUnsavedChanges(true);

    const socket = socketRef.current;
    if (!socket) return;

    socket.emit('editor:update', {
      roomId: Number(roomId),
      fileId,
      content: nextContent,
    });
  };

  const saveFile = async (source = 'manual-save') => {
    try {
      setSaveStatus('saving');
      setErrorMessage('');

      const patchUrl = `${apiBaseUrl}/api/rooms/${roomId}/files/${fileId}`;
      let res;
      let payload;

      try {
        res = await fetch(patchUrl, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content,
            language,
            userId: currentUser.id,
          }),
        });

        payload = await res.json();
      } catch (networkError) {
        // Fallback for browsers/environments where PATCH preflight is blocked.
        const formBody = new URLSearchParams({
          content,
          language,
          userId: String(currentUser.id),
        });

        res = await fetch(`${patchUrl}/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formBody.toString(),
        });

        payload = await res.json();
      }

      if (!res.ok) throw new Error(payload?.message || 'Save failed.');

      setSaveStatus('saved');
      setHasUnsavedChanges(false);
      setTimeout(() => setSaveStatus('idle'), 900);
    } catch (error) {
      setSaveStatus('idle');
      const message =
        error?.message === 'Failed to fetch'
          ? 'Unable to reach backend (network/CORS). Check API URL and backend server.'
          : error?.message || 'Unable to save file.';
      setErrorMessage(message);
    }
  };

  useEffect(() => {
    if (!fileId || !hasUnsavedChanges) return undefined;

    const timer = setTimeout(() => {
      // Reuse same save endpoint for lightweight autosave.
      saveFile('autosave');
    }, 1200);

    return () => clearTimeout(timer);
  }, [fileId, hasUnsavedChanges, content]);

  const runCode = async () => {
    try {
      setRunStatus('running');
      setRunOutput('Running...');

      const res = await fetch(`${apiBaseUrl}/api/compile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          code: content,
          stdin,
        }),
      });

      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || 'Run failed.');

      const chunks = [];
      if (payload.stdout) chunks.push(`stdout:\n${payload.stdout}`);
      if (payload.stderr) chunks.push(`stderr:\n${payload.stderr}`);
      if (!payload.stdout && !payload.stderr && payload.output) chunks.push(payload.output);
      chunks.push(`exit: ${payload.code ?? 'unknown'}`);
      setRunOutput(chunks.join('\n\n'));
      setRunStatus('idle');
    } catch (error) {
      setRunStatus('idle');
      setRunOutput(`Run error: ${error.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="collab-shell">
      <header className="collab-header">
        <div>
          <h1>Realtime Room #{roomId}</h1>
          <p>
            File: <strong>{filePath}</strong> ({language})
          </p>
          <label className="language-picker" htmlFor="editorLanguage">
            Language
            <select
              id="editorLanguage"
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                setHasUnsavedChanges(true);
              }}
            >
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="go">Go</option>
              <option value="rust">Rust</option>
              <option value="cpp">C++</option>
              <option value="c">C</option>
              <option value="csharp">C#</option>
              <option value="json">JSON</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="markdown">Markdown</option>
              <option value="sql">SQL</option>
              <option value="yaml">YAML</option>
              <option value="plaintext">Plain Text</option>
            </select>
          </label>
          <p className={`status status-${status}`}>Socket: {status}</p>
          <p className="status">Autosave: {hasUnsavedChanges ? 'pending' : 'synced'}</p>
        </div>

        <div className="collab-actions">
          <button
            type="button"
            onClick={() => saveFile('manual-save')}
            disabled={!fileId || saveStatus === 'saving'}
          >
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Save'}
          </button>
          <button type="button" onClick={runCode} disabled={!fileId || runStatus === 'running'}>
            {runStatus === 'running' ? 'Running...' : 'Run'}
          </button>
          <Link to="/">Back Home</Link>
        </div>
      </header>

      {errorMessage && <p className="collab-error">{errorMessage}</p>}

      <section className="collab-body">
        <aside className="presence-panel">
          <h2>In this room</h2>
          <ul>
            {members.map((member) => (
              <li key={member.socketId}>
                <span className="member-label">
                  <span
                    className="member-dot"
                    style={{ backgroundColor: colorFromSeed(member.user?.email || member.socketId) }}
                  />
                  {member.user?.name || 'Unknown'}
                  {member.user?.id === currentUser.id ? ' (you)' : ''}
                </span>
                <small>cursor {member.cursor ?? 0}</small>
              </li>
            ))}
          </ul>

          <div className="runner-block">
            <h3>Compiler Input</h3>
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="stdin (optional)"
            />
            <h3>Compiler Output</h3>
            <pre>{runOutput || 'No output yet. Click Run.'}</pre>
          </div>
        </aside>

        <div className="editor-panel">
          <Editor
            height="72vh"
            theme="vs-dark"
            language={language}
            value={content}
            onMount={(editorInstance) => {
              editorRef.current = editorInstance;
              editorInstance.onDidChangeCursorPosition(() => {
                emitCursor();
              });
            }}
            onChange={(nextValue) => onLocalContentChange(nextValue || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbersMinChars: 3,
              automaticLayout: true,
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              tabSize: 2,
            }}
          />
        </div>
      </section>
    </div>
  );
}

export default CollabRoom;
