import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import Editor from '@monaco-editor/react';
import { API_BASE_URL } from '../lib/apiBaseUrl';
import './CollabRoom.css';

function CollabRoom() {
  const { roomId, fileId: fileIdParam } = useParams();
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

  const [aiPrompt, setAiPrompt] = useState('');
  const [aiMode, setAiMode] = useState('append');
  const [aiStatus, setAiStatus] = useState('idle');
  const [aiAgents, setAiAgents] = useState([]);
  const [selectedAiAgents, setSelectedAiAgents] = useState([]);
  const [aiBlocks, setAiBlocks] = useState([]);

  const socketRef = useRef(null);
  const mySocketIdRef = useRef(null);
  const applyingRemoteRef = useRef(false);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);
  const cursorWidgetsRef = useRef(new Map());
  const contentRef = useRef('');
  const suppressLocalOpsRef = useRef(false);
  const roomIdRef = useRef(null);
  const fileIdRef = useRef(null);
  const roomRevisionRef = useRef(0);
  const presenceStyleElRef = useRef(null);
  const presenceClassCacheRef = useRef(new Map());
  const nextPresenceStyleIdRef = useRef(1);

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

  const hashFromSeed = (seed) => {
    const str = String(seed || 'member');
    let hash = 0;
    for (let i = 0; i < str.length; i += 1) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
  };

  const getCollaboratorPalette = (seed) => {
    const hash = Math.abs(hashFromSeed(seed));
    const isGreenFamily = hash % 2 === 0;
    const baseHue = isGreenFamily ? 146 : 6;
    const hue = (baseHue + (hash % 42) - 21 + 360) % 360;

    return {
      dot: `hsl(${hue} 80% 62%)`,
      lineBg: `hsla(${hue} 85% 58% / 0.2)`,
      lineBorder: `hsla(${hue} 92% 70% / 0.5)`,
      labelBg: `hsla(${hue} 58% 16% / 0.95)`,
      labelText: `hsl(${hue} 95% 88%)`,
      caret: `hsl(${hue} 92% 74%)`,
      caretGlow: `hsla(${hue} 95% 72% / 0.42)`,
    };
  };

  const colorFromSeed = (seed) => getCollaboratorPalette(seed).dot;

  const buildCollaboratorBadgeText = (member) => {
    const rawName = String(member?.user?.name || '').trim();
    const rawEmail = String(member?.user?.email || '').trim();

    if (rawName && rawName.toLowerCase() !== 'collaborator' && rawName.toLowerCase() !== 'unknown') {
      const firstWord = rawName.split(/\s+/)[0] || rawName;
      return firstWord.length > 12 ? `${firstWord.slice(0, 11)}…` : firstWord;
    }

    if (rawEmail.includes('@')) {
      const localPart = rawEmail.split('@')[0].replace(/[^a-zA-Z0-9._-]/g, '') || 'user';
      return localPart.length > 12 ? `${localPart.slice(0, 11)}…` : localPart;
    }

    return 'Collaborator';
  };

  const ensurePresenceStyleSheet = () => {
    if (presenceStyleElRef.current) return presenceStyleElRef.current;

    const styleEl = document.createElement('style');
    styleEl.setAttribute('data-collab-presence-styles', 'true');
    document.head.appendChild(styleEl);
    presenceStyleElRef.current = styleEl;
    return styleEl;
  };

  const ensureCollaboratorClasses = (member) => {
    const memberSeed =
      member?.user?.email ||
      member?.user?.name ||
      member?.user?.id ||
      member?.socketId ||
      'collaborator';

    const cacheKey = String(memberSeed);
    const cached = presenceClassCacheRef.current.get(cacheKey);
    if (cached) return cached;

    const palette = getCollaboratorPalette(memberSeed);
    const suffix = `u${nextPresenceStyleIdRef.current}`;
    nextPresenceStyleIdRef.current += 1;
    const lineClass = `remote-cursor-line-${suffix}`;
    const labelClass = `remote-cursor-label-${suffix}`;
    const caretClass = `remote-cursor-caret-${suffix}`;

    const styleEl = ensurePresenceStyleSheet();
    styleEl.appendChild(
      document.createTextNode(`
        .${lineClass} {
          background: ${palette.lineBg} !important;
          border-left: 2px solid ${palette.lineBorder};
          border-radius: 6px;
        }

        .${labelClass} {
          display: inline-block;
          color: ${palette.labelText};
          background: ${palette.labelBg};
          border: 1px solid ${palette.lineBorder};
          box-shadow: 0 6px 16px ${palette.caretGlow};
          border-radius: 999px;
          padding: 2px 7px;
          margin-left: 8px;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.02em;
          line-height: 1;
          white-space: nowrap;
        }

        .${caretClass} {
          display: inline-block;
          width: 2px;
          height: 1.15em;
          margin-right: 1px;
          border-radius: 999px;
          vertical-align: text-top;
          background: ${palette.caret};
          box-shadow: 0 0 10px ${palette.caretGlow};
        }
      `)
    );

    const result = { lineClass, labelClass, caretClass };
    presenceClassCacheRef.current.set(cacheKey, result);
    return result;
  };

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

  const syncRemoteCursorDecorations = () => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const model = editor?.getModel();
    if (!editor || !monaco || !model) return;

    const remoteMembers = members.filter((member) => member.socketId !== mySocketIdRef.current);
    const nextDecorations = [];
    const nextWidgetIds = new Set();

    const upsertCursorWidget = ({ member, position, labelClass, initial }) => {
      const widgetId = `collab-cursor-widget-${member.socketId}`;
      nextWidgetIds.add(widgetId);

      const existing = cursorWidgetsRef.current.get(widgetId);
      if (existing) {
        existing.node.className = `remote-cursor-initial ${labelClass}`;
        existing.node.textContent = initial;
        existing.setPosition(position);
        editor.layoutContentWidget(existing.widget);
        return;
      }

      const node = document.createElement('div');
      node.className = `remote-cursor-initial ${labelClass}`;
      node.textContent = initial;

      let currentPosition = position;
      const widget = {
        getId: () => widgetId,
        getDomNode: () => node,
        getPosition: () => ({
          position: currentPosition,
          preference: [monaco.editor.ContentWidgetPositionPreference.ABOVE],
        }),
        allowEditorOverflow: true,
        suppressMouseDown: true,
      };

      const setPosition = (nextPosition) => {
        currentPosition = nextPosition;
      };

      editor.addContentWidget(widget);
      cursorWidgetsRef.current.set(widgetId, {
        widget,
        node,
        setPosition,
      });
    };

    const pruneStaleCursorWidgets = () => {
      cursorWidgetsRef.current.forEach((entry, widgetId) => {
        if (nextWidgetIds.has(widgetId)) return;
        editor.removeContentWidget(entry.widget);
        cursorWidgetsRef.current.delete(widgetId);
      });
    };

    remoteMembers.forEach((member) => {
      const collaboratorClasses = ensureCollaboratorClasses(member);
      const collaboratorName = member.user?.name || 'Collaborator';
      const collaboratorBadgeText = buildCollaboratorBadgeText(member);
      const hasLineColumn =
        Number.isInteger(member.cursorLine) &&
        member.cursorLine > 0 &&
        Number.isInteger(member.cursorColumn) &&
        member.cursorColumn > 0;

      const position = hasLineColumn
        ? {
          lineNumber: Math.min(member.cursorLine, model.getLineCount()),
          column: Math.min(
            member.cursorColumn,
            model.getLineMaxColumn(Math.min(member.cursorLine, model.getLineCount()))
          ),
        }
        : (() => {
          const rawCursor = Number.isInteger(member.cursor) ? member.cursor : 0;
          const clampedOffset = Math.max(0, Math.min(rawCursor, model.getValueLength()));
          return model.getPositionAt(clampedOffset);
        })();
      if (!position) return;

      const lineRange = new monaco.Range(
        position.lineNumber,
        1,
        position.lineNumber,
        model.getLineMaxColumn(position.lineNumber)
      );

      nextDecorations.push({
        range: lineRange,
        options: {
          isWholeLine: true,
          className: collaboratorClasses.lineClass,
          hoverMessage: { value: `${collaboratorName} cursor` },
        },
      });

      const labelRange = new monaco.Range(
        position.lineNumber,
        position.column,
        position.lineNumber,
        position.column
      );

      nextDecorations.push({
        range: labelRange,
        options: {
          before: {
            content: ' ',
            inlineClassName: collaboratorClasses.caretClass,
          },
        },
      });

      upsertCursorWidget({
        member,
        position,
        labelClass: collaboratorClasses.labelClass,
        initial: collaboratorBadgeText,
      });
    });

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, nextDecorations);
    pruneStaleCursorWidgets();
  };

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  const replaceEditorContent = (nextContent) => {
    const editor = editorRef.current;
    const model = editor?.getModel();
    if (!editor || !model) return false;

    if (model.getValue() === nextContent) return true;

    suppressLocalOpsRef.current = true;
    model.setValue(nextContent);
    suppressLocalOpsRef.current = false;
    return true;
  };

  useEffect(() => {
    const numericRoomId = Number(roomId);
    roomIdRef.current = Number.isInteger(numericRoomId) && numericRoomId > 0 ? numericRoomId : null;
  }, [roomId]);

  useEffect(() => {
    fileIdRef.current = fileId;
  }, [fileId]);

  useEffect(() => () => {
    if (editorRef.current) {
      cursorWidgetsRef.current.forEach((entry) => {
        editorRef.current.removeContentWidget(entry.widget);
      });
    }
    cursorWidgetsRef.current.clear();

    if (presenceStyleElRef.current) {
      presenceStyleElRef.current.remove();
      presenceStyleElRef.current = null;
    }
    presenceClassCacheRef.current.clear();
  }, []);

  useEffect(() => {
    syncRemoteCursorDecorations();
  }, [members]);

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
            userId: currentUser.numericId,
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

    const fetchAiModels = async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/api/ai/models`);
        const payload = await res.json();
        if (!res.ok) return;

        const models = Array.isArray(payload.models)
          ? payload.models.filter((value) => typeof value === 'string' && value.trim())
          : [];

        if (cancelled || models.length === 0) return;
        setAiAgents(models);
        setSelectedAiAgents(models.slice(0, 2));
      } catch {
        // Optional endpoint. Ignore if unavailable.
      }
    };

    bootstrapFile();
    fetchAiModels();

    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, currentUser.numericId, fileIdParam, roomId]);

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
      mySocketIdRef.current = socket.id;
      setStatus('connected');
      socket.emit('room:join', {
        roomId: numericRoomId,
        fileId,
        user: {
          id: currentUser.numericId,
          name: currentUser.name,
          email: currentUser.email,
        },
        initialContent: contentRef.current,
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
        replaceEditorContent(payload.content);
        applyingRemoteRef.current = true;
        setContent(payload.content);
        setHasUnsavedChanges(false);
      }

      if (Number.isInteger(payload?.revision)) {
        roomRevisionRef.current = payload.revision;
      }

      setMembers(payload.members || []);
      setAiBlocks(Array.isArray(payload.aiBlocks) ? payload.aiBlocks : []);

      const incomingAgents = Array.isArray(payload.aiAgents)
        ? payload.aiAgents.map((agent) => agent?.label).filter((label) => typeof label === 'string' && label.trim())
        : [];

      if (incomingAgents.length > 0) {
        setAiAgents(incomingAgents);
        setSelectedAiAgents((previous) => (previous.length > 0 ? previous : incomingAgents.slice(0, 2)));
      }
    });

    socket.on('presence:state', (payload) => {
      setMembers(payload.members || []);
    });

    socket.on('presence:cursor', (payload) => {
      if (!payload?.socketId) return;

      setMembers((previousMembers) => {
        const nextMembers = previousMembers.map((member) =>
          member.socketId === payload.socketId
            ? {
              ...member,
              cursor: payload.cursor,
              cursorLine: payload.cursorLine,
              cursorColumn: payload.cursorColumn,
            }
            : member
        );

        if (nextMembers.some((member) => member.socketId === payload.socketId)) {
          return nextMembers;
        }

        return [...nextMembers, {
          socketId: payload.socketId,
          user: payload.user,
          cursor: payload.cursor,
          cursorLine: payload.cursorLine,
          cursorColumn: payload.cursorColumn,
          joinedAt: new Date().toISOString(),
        }];
      });
    });

    socket.on('editor:update', (payload) => {
      if (typeof payload?.content !== 'string') return;

      if (Number.isInteger(payload?.revision)) {
        roomRevisionRef.current = payload.revision;
      }

      replaceEditorContent(payload.content);
      applyingRemoteRef.current = true;
      setContent(payload.content);
      setHasUnsavedChanges(false);
    });

    socket.on('editor:op', (payload) => {
      const editor = editorRef.current;
      const monaco = monacoRef.current;
      const model = editor?.getModel();
      const changes = Array.isArray(payload?.changes) ? payload.changes : [];

      if (!editor || !monaco || !model || changes.length === 0) return;

      const edits = changes
        .map((change) => {
          const rangeOffset = Number.isInteger(change?.rangeOffset) ? change.rangeOffset : null;
          const rangeLength = Number.isInteger(change?.rangeLength) ? change.rangeLength : null;
          const text = typeof change?.text === 'string' ? change.text : '';
          if (rangeOffset === null || rangeLength === null) return null;

          const safeStart = Math.max(0, Math.min(rangeOffset, model.getValueLength()));
          const safeEnd = Math.max(safeStart, Math.min(safeStart + Math.max(0, rangeLength), model.getValueLength()));

          return {
            range: new monaco.Range(
              model.getPositionAt(safeStart).lineNumber,
              model.getPositionAt(safeStart).column,
              model.getPositionAt(safeEnd).lineNumber,
              model.getPositionAt(safeEnd).column,
            ),
            text,
            forceMoveMarkers: true,
          };
        })
        .filter(Boolean);

      if (edits.length === 0) return;

      if (Number.isInteger(payload?.revision)) {
        roomRevisionRef.current = payload.revision;
      }

      suppressLocalOpsRef.current = true;
      model.pushEditOperations([], edits, () => null);
      suppressLocalOpsRef.current = false;

      applyingRemoteRef.current = true;
      setContent(model.getValue());
    });

    socket.on('editor:ack', (payload) => {
      if (Number.isInteger(payload?.revision)) {
        roomRevisionRef.current = payload.revision;
      }
    });

    socket.on('editor:resync', (payload) => {
      if (typeof payload?.content !== 'string') return;

      if (Number.isInteger(payload?.revision)) {
        roomRevisionRef.current = payload.revision;
      }

      replaceEditorContent(payload.content);
      applyingRemoteRef.current = true;
      setContent(payload.content);
      setHasUnsavedChanges(false);
    });

    socket.on('ai:status', (payload) => {
      setAiStatus(payload?.phase === 'running' ? 'running' : 'idle');
    });

    socket.on('ai:block:new', (payload) => {
      if (!payload?.block) return;
      setAiBlocks((previous) => [payload.block, ...previous]);
    });

    socket.on('ai:block:update', (payload) => {
      if (!payload?.block?.id) return;
      setAiBlocks((previous) => previous.map((block) => (block.id === payload.block.id ? payload.block : block)));
    });

    socket.on('ai:block:error', (payload) => {
      const agent = payload?.agentLabel || 'AI';
      const reason = payload?.message || 'Suggestion failed';
      setErrorMessage(`${agent}: ${reason}`);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      mySocketIdRef.current = null;
    };
  }, [apiBaseUrl, currentUser, fileId, roomId]);

  useEffect(() => () => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.deltaDecorations(decorationsRef.current, []);
  }, []);

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
      cursorLine: position.lineNumber,
      cursorColumn: position.column,
    });
  };

  const requestAiAssistance = () => {
    const socket = socketRef.current;
    const prompt = aiPrompt.trim();

    if (!socket) {
      setErrorMessage('Socket is disconnected. Reconnect to request AI.');
      return;
    }

    if (!prompt) {
      setErrorMessage('Write a prompt before asking AI.');
      return;
    }

    socket.emit('ai:request', {
      roomId: Number(roomId),
      fileId,
      prompt,
      mode: aiMode,
      agents: selectedAiAgents,
      content,
      language,
    });
  };

  const decideAiBlock = (blockId, decision) => {
    const socket = socketRef.current;
    if (!socket || !blockId) return;

    socket.emit('ai:block:decision', {
      roomId: Number(roomId),
      fileId,
      blockId,
      decision,
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
            userId: currentUser.numericId,
          }),
        });

        payload = await res.json();
      } catch (networkError) {
        // Fallback for browsers/environments where PATCH preflight is blocked.
        const formBody = new URLSearchParams({
          content,
          language,
          userId: String(currentUser.numericId),
        });

        res = await fetch(`${patchUrl}/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formBody.toString(),
        });

        payload = await res.json();
      }

      if (!res.ok) throw new Error(payload?.message || 'Save failed.');

      if (source !== 'autosave') {
        await fetch(`${patchUrl}/snapshots`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content,
            language,
            source,
            userId: currentUser.numericId,
          }),
        });
      }

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
              onChange={(event) => {
                setLanguage(event.target.value);
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
          <p className="status">AI: {aiStatus}</p>
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
                </span>
                <small>cursor {member.cursor ?? 0}</small>
              </li>
            ))}
          </ul>

          <div className="runner-block">
            <h3>Compiler Input</h3>
            <textarea
              value={stdin}
              onChange={(event) => setStdin(event.target.value)}
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
            defaultValue={content}
            onMount={(editorInstance, monaco) => {
              editorRef.current = editorInstance;
              monacoRef.current = monaco;

              editorInstance.onDidChangeCursorPosition(() => {
                emitCursor();
              });

              editorInstance.onDidChangeModelContent((event) => {
                if (suppressLocalOpsRef.current || applyingRemoteRef.current) return;

                const latest = editorInstance.getValue();
                setContent(latest);
                setHasUnsavedChanges(true);

                const socket = socketRef.current;
                const currentRoomId = roomIdRef.current;
                const currentFileId = fileIdRef.current;

                if (!socket || !currentRoomId || !currentFileId) return;

                const changes = (event.changes || []).map((change) => ({
                  rangeOffset: change.rangeOffset,
                  rangeLength: change.rangeLength,
                  text: change.text,
                }));

                if (changes.length === 0) return;

                socket.emit('editor:op', {
                  roomId: currentRoomId,
                  fileId: currentFileId,
                  baseRevision: roomRevisionRef.current,
                  changes,
                });
              });
            }}
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

        <aside className="ai-side-panel">
          <div className="ai-panel ai-panel-root">
            <h3>AI Copilot</h3>
            <textarea
              value={aiPrompt}
              onChange={(event) => setAiPrompt(event.target.value)}
              placeholder="Describe what AI should change in the file"
            />

            <label className="ai-control" htmlFor="aiModeSelect">
              Apply mode
              <select id="aiModeSelect" value={aiMode} onChange={(event) => setAiMode(event.target.value)}>
                <option value="append">Append suggestion</option>
                <option value="replace">Replace file</option>
              </select>
            </label>

            <div className="ai-agent-list">
              {aiAgents.map((agentLabel) => (
                <label className="ai-agent-item" key={agentLabel}>
                  <input
                    type="checkbox"
                    checked={selectedAiAgents.includes(agentLabel)}
                    onChange={(event) => {
                      setSelectedAiAgents((previous) => {
                        if (event.target.checked) {
                          return Array.from(new Set([...previous, agentLabel]));
                        }
                        return previous.filter((value) => value !== agentLabel);
                      });
                    }}
                  />
                  <span>{agentLabel}</span>
                </label>
              ))}
            </div>

            <button
              type="button"
              onClick={requestAiAssistance}
              disabled={!fileId || status !== 'connected' || aiStatus === 'running'}
            >
              {aiStatus === 'running' ? 'Agents working...' : 'Ask AI'}
            </button>

            <div className="ai-block-list">
              {aiBlocks.length === 0 ? (
                <p className="ai-empty">No AI blocks yet.</p>
              ) : (
                aiBlocks.map((block) => (
                  <article className="ai-block" key={block.id}>
                    <header>
                      <strong>{block.agentLabel || 'AI agent'}</strong>
                      <span className={`ai-block-status ai-block-status-${block.status}`}>{block.status}</span>
                    </header>
                    <p className="ai-block-meta">mode: {block.mode || 'append'}</p>
                    <pre>{block.suggestion || ''}</pre>
                    <div className="ai-block-actions">
                      <button
                        type="button"
                        onClick={() => decideAiBlock(block.id, 'accept')}
                        disabled={block.status !== 'pending'}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => decideAiBlock(block.id, 'reject')}
                        disabled={block.status !== 'pending'}
                      >
                        Reject
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

export default CollabRoom;
