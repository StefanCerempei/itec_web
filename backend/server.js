const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const path = require('path');
const os = require('os');
const fs = require('fs/promises');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const { spawn } = require('child_process');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Import Supabase client
const { supabase, testSupabaseConnection } = require('./config/supabase');
const { configuredModels, generateText } = require('./config/aiClient');

const USERS_TABLE = process.env.AUTH_USERS_TABLE || 'users';
const ROOMS_TABLE = process.env.COLLAB_ROOMS_TABLE || 'rooms';
const ROOM_MEMBERS_TABLE = process.env.COLLAB_ROOM_MEMBERS_TABLE || 'roommembers';
const ROOM_FILES_TABLE = process.env.COLLAB_ROOM_FILES_TABLE || 'roomfiles';
const EDIT_SNAPSHOTS_TABLE = process.env.COLLAB_EDIT_SNAPSHOTS_TABLE || 'editsnapshots';
const SAVED_PROJECTS_TABLE = process.env.COLLAB_SAVED_PROJECTS_TABLE || 'savedprojects';
const allowedOriginRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const isDev = process.env.NODE_ENV !== 'production';
const configuredOrigins = [
    process.env.FRONTEND_URL,
    ...(process.env.FRONTEND_URLS || '').split(',')
]
    .map((value) => String(value || '').trim())
    .filter(Boolean);
const configuredOriginSet = new Set(configuredOrigins);

const isAllowedOrigin = (origin) => {
    if (!origin) return true;
    if (isDev) return true;
    if (configuredOriginSet.has(origin)) return true;
    return allowedOriginRegex.test(origin);
};

const corsOptions = {
    origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) return callback(null, true);
        return callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 204
};

// Initialize Express app
const app = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: (origin, callback) => {
            if (isAllowedOrigin(origin)) return callback(null, true);
            return callback(new Error(`Socket origin not allowed: ${origin}`));
        },
        credentials: true
    },
    pingInterval: 25000,
    pingTimeout: 120000,
    connectionStateRecovery: {
        maxDisconnectionDuration: 5 * 60 * 1000,
        skipMiddlewares: true
    }
});

const collabState = {
    // Key format: `${roomId}:${fileId}`
    rooms: new Map(),
    terminals: new Map()
};

const DEFAULT_AI_AGENTS = ['Planner', 'Refactor', 'BugFixer', 'Performance'];
const MAX_COLLABORATORS_PER_ROOM = 4;
const DISCONNECT_GRACE_MS = 2 * 60 * 1000;
const pendingMemberRemovals = new Map();
const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ROOM_CODE_LENGTH = 8;
const TERMINAL_COMMAND_MAX_LENGTH = 180;
const TERMINAL_OUTPUT_MAX_LENGTH = 200000;
const TERMINAL_TIMEOUT_MS = 15000;
const EXEC_LIMIT_CPU_SECONDS = Math.min(Math.max(Number(process.env.EXEC_LIMIT_CPU_SECONDS) || 4, 1), 30);
const EXEC_LIMIT_MEMORY_BYTES = Math.min(
    Math.max(Number(process.env.EXEC_LIMIT_MEMORY_BYTES) || 268435456, 64 * 1024 * 1024),
    2 * 1024 * 1024 * 1024
);
const EXEC_LIMIT_NPROC = Math.min(Math.max(Number(process.env.EXEC_LIMIT_NPROC) || 96, 16), 512);
const EXEC_OUTPUT_MAX_LENGTH = Math.min(
    Math.max(Number(process.env.EXEC_OUTPUT_MAX_LENGTH) || 200000, 20000),
    2 * 1024 * 1024
);

const TERMINAL_BLOCKED_PATTERN = /(rm\s+-rf\s+\/|shutdown|reboot|poweroff|mkfs|:\s*\(\)\s*\{|dd\s+if=|sudo\s+|\n|\r)/i;

const getUserPresenceKey = (user = {}) => {
    const email = String(user.email || '').trim().toLowerCase();
    if (email) return `email:${email}`;

    const id = asPositiveInt(user.id);
    if (id) return `id:${id}`;

    return null;
};

const getAiAgents = () => {
    const modelBackedAgents = (configuredModels || []).map((model, index) => ({
        id: `model-${index + 1}`,
        label: model,
        model
    }));

    if (modelBackedAgents.length > 0) return modelBackedAgents;

    return DEFAULT_AI_AGENTS.map((label, index) => ({
        id: `default-${index + 1}`,
        label,
        model: null
    }));
};

const getRoomKey = (roomId, fileId) => `${roomId}:${fileId}`;

const ensureTerminalState = (roomId, fileId) => {
    const key = getRoomKey(roomId, fileId);
    if (!collabState.terminals.has(key)) {
        collabState.terminals.set(key, {
            history: '',
            running: false,
            process: null,
            lastCommand: null
        });
    }
    return collabState.terminals.get(key);
};

const appendTerminalHistory = (terminalState, chunk) => {
    if (!terminalState || typeof chunk !== 'string' || chunk.length === 0) return;
    const next = `${terminalState.history || ''}${chunk}`;
    terminalState.history = next.length > TERMINAL_OUTPUT_MAX_LENGTH
        ? next.slice(next.length - TERMINAL_OUTPUT_MAX_LENGTH)
        : next;
};

const sanitizeTerminalCommand = (value) => {
    const command = String(value || '').trim();
    if (!command) return { ok: false, message: 'Command is required.' };
    if (command.length > TERMINAL_COMMAND_MAX_LENGTH) {
        return { ok: false, message: `Command too long (max ${TERMINAL_COMMAND_MAX_LENGTH} chars).` };
    }
    if (TERMINAL_BLOCKED_PATTERN.test(command)) {
        return { ok: false, message: 'Command blocked by safety policy.' };
    }
    return { ok: true, command };
};

const looksLikeMissingExecutableOutput = (stderr, code) => {
    if (code !== 127) return false;
    const msg = String(stderr || '').toLowerCase();
    return msg.includes('no such file') || msg.includes('failed to execute') || msg.includes('not found');
};

const ensureRealtimeRoom = (roomId, fileId) => {
    const key = getRoomKey(roomId, fileId);
    if (!collabState.rooms.has(key)) {
        collabState.rooms.set(key, {
            content: '',
            revision: 0,
            members: new Map(),
            aiBlocks: new Map(),
            nextAiBlockId: 1
        });
    }
    return collabState.rooms.get(key);
};

const serializeMembers = (membersMap) =>
    Array.from(membersMap.values()).map((m) => ({
        socketId: m.socketId,
        user: m.user,
        cursor: Number.isInteger(m.cursor) ? m.cursor : null,
        cursorLine: Number.isInteger(m.cursorLine) ? m.cursorLine : null,
        cursorColumn: Number.isInteger(m.cursorColumn) ? m.cursorColumn : null,
        joinedAt: m.joinedAt
    }));

const serializeAiBlocks = (blocksMap) =>
    Array.from(blocksMap.values())
        .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
        .slice(0, 40)
        .map((block) => ({
            id: block.id,
            status: block.status,
            mode: block.mode,
            prompt: block.prompt,
            suggestion: block.suggestion,
            proposedContent: block.proposedContent,
            baseContent: block.baseContent,
            agentLabel: block.agentLabel,
            model: block.model,
            requestedBy: block.requestedBy,
            decidedBy: block.decidedBy || null,
            createdAt: block.createdAt,
            decidedAt: block.decidedAt || null
        }));

const clampString = (value, maxLength) => {
    if (typeof value !== 'string') return '';
    return value.length > maxLength ? value.slice(0, maxLength) : value;
};

const buildProposedContent = ({ mode, currentContent, suggestion }) => {
    if (mode === 'replace') return suggestion;
    if (!currentContent) return suggestion;

    const separator = currentContent.endsWith('\n') ? '\n' : '\n\n';
    return `${currentContent}${separator}${suggestion}`;
};

const applyTextChanges = (baseContent, changes) => {
    if (!Array.isArray(changes) || changes.length === 0) return baseContent;

    const normalizedChanges = changes
        .map((change) => ({
            rangeOffset: Number.isInteger(change?.rangeOffset) ? change.rangeOffset : 0,
            rangeLength: Number.isInteger(change?.rangeLength) ? change.rangeLength : 0,
            text: typeof change?.text === 'string' ? change.text : ''
        }))
        .sort((a, b) => b.rangeOffset - a.rangeOffset);

    let content = typeof baseContent === 'string' ? baseContent : '';

    for (const change of normalizedChanges) {
        const start = Math.max(0, Math.min(change.rangeOffset, content.length));
        const end = Math.max(start, Math.min(start + Math.max(0, change.rangeLength), content.length));
        content = `${content.slice(0, start)}${change.text}${content.slice(end)}`;
    }

    return content;
};

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

// Middleware
app.use(helmet());

// Explicit preflight fallback to avoid browser-side PATCH rejection when intermediary CORS handling differs.
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (isAllowedOrigin(origin)) {
        res.header('Access-Control-Allow-Origin', origin || '*');
        res.header('Vary', 'Origin');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
        res.header(
            'Access-Control-Allow-Headers',
            req.headers['access-control-request-headers'] || 'Content-Type,Authorization,X-Requested-With'
        );
    }

    if (req.method === 'OPTIONS') {
        res.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.header('Pragma', 'no-cache');
        res.header('Expires', '0');
        res.header('Surrogate-Control', 'no-store');
        return res.sendStatus(204);
    }

    return next();
});

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', limiter);

io.on('connection', (socket) => {
    socket.on('room:join', (payload = {}) => {
        const roomId = asPositiveInt(payload.roomId);
        const fileId = asPositiveInt(payload.fileId);
        const user = payload.user || {};
        const initialContent = typeof payload.initialContent === 'string' ? payload.initialContent : null;

        if (!roomId || !fileId) {
            socket.emit('room:error', { message: 'Invalid roomId/fileId.' });
            return;
        }

        const channel = `room:${roomId}:file:${fileId}`;
        const room = ensureRealtimeRoom(roomId, fileId);

        if (!room.members.has(socket.id) && room.members.size >= MAX_COLLABORATORS_PER_ROOM) {
            socket.emit('room:error', {
                message: `Room is full. Maximum ${MAX_COLLABORATORS_PER_ROOM} collaborators are allowed.`
            });
            return;
        }

        // Keep in-memory room state aligned with persisted file content loaded by the first participant.
        if (!room.content && initialContent && initialContent.length > 0) {
            room.content = initialContent;
        }

        socket.join(channel);
        socket.data.roomId = roomId;
        socket.data.fileId = fileId;
        socket.data.channel = channel;
        socket.data.user = {
            id: asPositiveInt(user.id),
            name: user.name || user.email || `User-${String(socket.id).slice(0, 4)}`,
            email: user.email || null
        };

        const reconnectingUserKey = getUserPresenceKey(socket.data.user);

        if (reconnectingUserKey) {
            for (const [existingSocketId, existingMember] of room.members.entries()) {
                if (existingSocketId === socket.id) continue;
                if (getUserPresenceKey(existingMember.user) !== reconnectingUserKey) continue;

                room.members.delete(existingSocketId);

                const pendingTimer = pendingMemberRemovals.get(existingSocketId);
                if (pendingTimer) {
                    clearTimeout(pendingTimer);
                    pendingMemberRemovals.delete(existingSocketId);
                }
            }
        }

        const selfPendingTimer = pendingMemberRemovals.get(socket.id);
        if (selfPendingTimer) {
            clearTimeout(selfPendingTimer);
            pendingMemberRemovals.delete(socket.id);
        }

        room.members.set(socket.id, {
            socketId: socket.id,
            user: socket.data.user,
            cursor: null,
            cursorLine: null,
            cursorColumn: null,
            joinedAt: new Date().toISOString()
        });

        socket.emit('room:joined', {
            roomId,
            fileId,
            content: room.content,
            revision: room.revision || 0,
            members: serializeMembers(room.members),
            aiBlocks: serializeAiBlocks(room.aiBlocks),
            aiAgents: getAiAgents()
        });

        const terminalState = ensureTerminalState(roomId, fileId);
        socket.emit('terminal:state', {
            roomId,
            fileId,
            history: terminalState.history,
            running: terminalState.running,
            lastCommand: terminalState.lastCommand
        });

        io.to(channel).emit('presence:state', {
            roomId,
            fileId,
            members: serializeMembers(room.members)
        });
    });

    socket.on('editor:update', (payload = {}) => {
        const roomId = asPositiveInt(payload.roomId || socket.data.roomId);
        const fileId = asPositiveInt(payload.fileId || socket.data.fileId);
        const content = typeof payload.content === 'string' ? payload.content : null;

        if (!roomId || !fileId || content === null) return;

        const channel = socket.data.channel || `room:${roomId}:file:${fileId}`;
        const room = ensureRealtimeRoom(roomId, fileId);
        room.content = content;
        room.revision = (room.revision || 0) + 1;

        socket.to(channel).emit('editor:update', {
            roomId,
            fileId,
            content,
            revision: room.revision,
            by: socket.data.user || null,
            at: new Date().toISOString()
        });

        socket.emit('editor:ack', {
            roomId,
            fileId,
            revision: room.revision
        });
    });

    socket.on('editor:op', (payload = {}) => {
        const roomId = asPositiveInt(payload.roomId || socket.data.roomId);
        const fileId = asPositiveInt(payload.fileId || socket.data.fileId);
        const changes = Array.isArray(payload.changes) ? payload.changes : [];

        if (!roomId || !fileId || changes.length === 0) return;

        const channel = socket.data.channel || `room:${roomId}:file:${fileId}`;
        const room = ensureRealtimeRoom(roomId, fileId);

        room.content = applyTextChanges(room.content, changes);
        room.revision = (room.revision || 0) + 1;

        socket.to(channel).emit('editor:op', {
            roomId,
            fileId,
            changes,
            revision: room.revision,
            by: socket.data.user || null,
            at: new Date().toISOString()
        });

        socket.emit('editor:ack', {
            roomId,
            fileId,
            revision: room.revision
        });
    });

    socket.on('editor:resync:request', (payload = {}) => {
        const roomId = asPositiveInt(payload.roomId || socket.data.roomId);
        const fileId = asPositiveInt(payload.fileId || socket.data.fileId);

        if (!roomId || !fileId) return;

        const room = ensureRealtimeRoom(roomId, fileId);
        socket.emit('editor:resync', {
            roomId,
            fileId,
            content: room.content,
            revision: room.revision || 0,
            source: 'join-resync'
        });
    });

    socket.on('presence:cursor', (payload = {}) => {
        const roomId = asPositiveInt(payload.roomId || socket.data.roomId);
        const fileId = asPositiveInt(payload.fileId || socket.data.fileId);
        const cursor = Number.isInteger(payload.cursor) ? payload.cursor : 0;
        const cursorLine = Number.isInteger(payload.cursorLine) && payload.cursorLine > 0 ? payload.cursorLine : null;
        const cursorColumn = Number.isInteger(payload.cursorColumn) && payload.cursorColumn > 0 ? payload.cursorColumn : null;

        if (!roomId || !fileId) return;

        const channel = socket.data.channel || `room:${roomId}:file:${fileId}`;
        const room = ensureRealtimeRoom(roomId, fileId);

        const member = room.members.get(socket.id);
        if (!member) return;

        member.cursor = Math.max(0, cursor);
        if (cursorLine && cursorColumn) {
            member.cursorLine = cursorLine;
            member.cursorColumn = cursorColumn;
        }

        socket.to(channel).emit('presence:cursor', {
            roomId,
            fileId,
            socketId: socket.id,
            user: member.user,
            cursor: member.cursor,
            cursorLine: member.cursorLine,
            cursorColumn: member.cursorColumn
        });
    });

    socket.on('ai:request', async (payload = {}) => {
        const roomId = asPositiveInt(payload.roomId || socket.data.roomId);
        const fileId = asPositiveInt(payload.fileId || socket.data.fileId);
        const prompt = clampString(payload.prompt, 3000).trim();
        const mode = payload.mode === 'replace' ? 'replace' : 'append';
        const requestedAgents = Array.isArray(payload.agents) ? payload.agents : [];

        if (!roomId || !fileId || !prompt) {
            socket.emit('room:error', { message: 'AI request needs roomId, fileId and prompt.' });
            return;
        }

        const channel = socket.data.channel || `room:${roomId}:file:${fileId}`;
        const room = ensureRealtimeRoom(roomId, fileId);
        const currentContent = typeof payload.content === 'string' ? payload.content : room.content;
        const language = clampString(payload.language || 'plaintext', 30);
        const userName = socket.data.user?.name || 'Unknown user';

        const availableAgents = getAiAgents();
        const filteredAgents = requestedAgents
            .map((agentLabel) => String(agentLabel || '').trim())
            .filter(Boolean)
            .map((agentLabel) => {
                const known = availableAgents.find((candidate) => candidate.label === agentLabel);
                return known || { id: `custom-${agentLabel}`, label: agentLabel, model: agentLabel };
            });

        const selectedAgents = (filteredAgents.length > 0 ? filteredAgents : availableAgents).slice(0, 4);

        io.to(channel).emit('ai:status', {
            roomId,
            fileId,
            phase: 'running',
            requestedBy: socket.data.user || null,
            agentCount: selectedAgents.length
        });

        await Promise.allSettled(
            selectedAgents.map(async (agent) => {
                const system = [
                    `You are ${agent.label}, a coding copilot operating in collaborative editor mode.`,
                    'Return only code with concise comments when useful.',
                    'Do not include markdown code fences.',
                    `Language: ${language}.`,
                    mode === 'replace'
                        ? 'Produce a full replacement for the existing file.'
                        : 'Produce a focused patch-style code block that can be appended safely.'
                ].join(' ');

                const userPrompt = [
                    `Task: ${prompt}`,
                    '',
                    'Current file content:',
                    currentContent || '(empty file)'
                ].join('\n');

                try {
                    const result = await generateText({
                        prompt: userPrompt,
                        system,
                        model: agent.model || undefined,
                        temperature: 0.2,
                        maxTokens: 1000
                    });

                    const suggestion = clampString(result.content, 20000).trim();
                    if (!suggestion) throw new Error('AI returned empty suggestion.');

                    const blockId = `${Date.now()}-${room.nextAiBlockId}`;
                    room.nextAiBlockId += 1;

                    const block = {
                        id: blockId,
                        status: 'pending',
                        mode,
                        prompt,
                        suggestion,
                        baseContent: currentContent,
                        proposedContent: buildProposedContent({
                            mode,
                            currentContent,
                            suggestion
                        }),
                        agentLabel: agent.label,
                        model: result.model || agent.model || null,
                        requestedBy: socket.data.user || null,
                        createdAt: new Date().toISOString()
                    };

                    room.aiBlocks.set(blockId, block);

                    io.to(channel).emit('ai:block:new', {
                        roomId,
                        fileId,
                        block
                    });
                } catch (error) {
                    io.to(channel).emit('ai:block:error', {
                        roomId,
                        fileId,
                        agentLabel: agent.label,
                        message: error.message || 'Failed to generate suggestion.'
                    });
                }
            })
        );

        io.to(channel).emit('ai:status', {
            roomId,
            fileId,
            phase: 'idle',
            requestedBy: socket.data.user || null,
            message: `AI generation finished for ${userName}.`
        });
    });

    socket.on('ai:block:decision', (payload = {}) => {
        const roomId = asPositiveInt(payload.roomId || socket.data.roomId);
        const fileId = asPositiveInt(payload.fileId || socket.data.fileId);
        const blockId = String(payload.blockId || '').trim();
        const decision = payload.decision === 'accept' ? 'accept' : 'reject';

        if (!roomId || !fileId || !blockId) return;

        const channel = socket.data.channel || `room:${roomId}:file:${fileId}`;
        const room = ensureRealtimeRoom(roomId, fileId);
        const block = room.aiBlocks.get(blockId);
        if (!block || block.status !== 'pending') return;

        block.status = decision === 'accept' ? 'accepted' : 'rejected';
        block.decidedBy = socket.data.user || null;
        block.decidedAt = new Date().toISOString();

        io.to(channel).emit('ai:block:update', {
            roomId,
            fileId,
            block
        });

        if (decision === 'accept') {
            room.content = block.proposedContent;

            io.to(channel).emit('editor:update', {
                roomId,
                fileId,
                content: room.content,
                by: {
                    id: null,
                    name: `AI ${block.agentLabel}`,
                    email: null,
                    type: 'ai'
                },
                at: new Date().toISOString(),
                source: 'ai-block-accept'
            });
        }
    });

    socket.on('terminal:run', (payload = {}) => {
        const roomId = asPositiveInt(payload.roomId || socket.data.roomId);
        const fileId = asPositiveInt(payload.fileId || socket.data.fileId);
        const validation = sanitizeTerminalCommand(payload.command);

        if (!roomId || !fileId) return;

        const channel = socket.data.channel || `room:${roomId}:file:${fileId}`;
        const terminalState = ensureTerminalState(roomId, fileId);

        if (!validation.ok) {
            socket.emit('terminal:error', {
                roomId,
                fileId,
                message: validation.message
            });
            return;
        }

        if (terminalState.running) {
            socket.emit('terminal:error', {
                roomId,
                fileId,
                message: 'Another terminal command is already running for this room.'
            });
            return;
        }

        const command = validation.command;
        terminalState.running = true;
        terminalState.lastCommand = command;

        const promptLine = `$ ${command}\n`;
        appendTerminalHistory(terminalState, promptLine);
        io.to(channel).emit('terminal:status', {
            roomId,
            fileId,
            running: true,
            command,
            by: socket.data.user || null
        });
        io.to(channel).emit('terminal:output', {
            roomId,
            fileId,
            stream: 'system',
            chunk: promptLine
        });

        const child = spawn('bash', ['-lc', command], {
            cwd: process.cwd(),
            env: process.env,
            stdio: ['ignore', 'pipe', 'pipe']
        });
        terminalState.process = child;

        let timeoutTriggered = false;
        const timer = setTimeout(() => {
            timeoutTriggered = true;
            child.kill('SIGKILL');
        }, TERMINAL_TIMEOUT_MS);

        const pushChunk = (stream, data) => {
            const chunk = data.toString();
            appendTerminalHistory(terminalState, chunk);
            io.to(channel).emit('terminal:output', {
                roomId,
                fileId,
                stream,
                chunk
            });
        };

        child.stdout.on('data', (data) => pushChunk('stdout', data));
        child.stderr.on('data', (data) => pushChunk('stderr', data));

        child.on('error', (error) => {
            const message = `terminal error: ${error.message || 'unknown error'}\n`;
            appendTerminalHistory(terminalState, message);
            io.to(channel).emit('terminal:output', {
                roomId,
                fileId,
                stream: 'stderr',
                chunk: message
            });
        });

        child.on('close', (code, signal) => {
            clearTimeout(timer);
            terminalState.running = false;
            terminalState.process = null;

            const doneLine = timeoutTriggered
                ? `[done] timed out after ${TERMINAL_TIMEOUT_MS}ms\n`
                : `[done] exit=${code ?? 'unknown'}${signal ? ` signal=${signal}` : ''}\n`;

            appendTerminalHistory(terminalState, doneLine);
            io.to(channel).emit('terminal:output', {
                roomId,
                fileId,
                stream: 'system',
                chunk: doneLine
            });

            io.to(channel).emit('terminal:done', {
                roomId,
                fileId,
                code,
                signal,
                timedOut: timeoutTriggered
            });

            io.to(channel).emit('terminal:status', {
                roomId,
                fileId,
                running: false,
                command,
                by: socket.data.user || null
            });
        });
    });

    socket.on('compile:share', (payload = {}) => {
        const roomId = asPositiveInt(payload.roomId || socket.data.roomId);
        const fileId = asPositiveInt(payload.fileId || socket.data.fileId);
        if (!roomId || !fileId) return;

        const channel = socket.data.channel || `room:${roomId}:file:${fileId}`;
        io.to(channel).emit('compile:shared', {
            roomId,
            fileId,
            language: String(payload.language || ''),
            output: String(payload.output || ''),
            status: payload.status === 'error' ? 'error' : 'ok',
            sourceSocketId: socket.id,
            by: socket.data.user || null,
            at: new Date().toISOString()
        });
    });

    socket.on('disconnect', () => {
        const roomId = socket.data.roomId;
        const fileId = socket.data.fileId;
        const channel = socket.data.channel;
        if (!roomId || !fileId || !channel) return;

        if (pendingMemberRemovals.has(socket.id)) return;

        const removalTimer = setTimeout(() => {
            pendingMemberRemovals.delete(socket.id);

            const key = getRoomKey(roomId, fileId);
            const room = collabState.rooms.get(key);
            if (!room) return;

            room.members.delete(socket.id);

            if (room.members.size === 0) {
                collabState.rooms.delete(key);

                const terminalState = collabState.terminals.get(key);
                if (terminalState?.process) {
                    terminalState.process.kill('SIGKILL');
                }
                collabState.terminals.delete(key);
                return;
            }

            io.to(channel).emit('presence:state', {
                roomId,
                fileId,
                members: serializeMembers(room.members)
            });
        }, DISCONNECT_GRACE_MS);

        pendingMemberRemovals.set(socket.id, removalTimer);
    });
});

const asPositiveInt = (value) => {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const LOCAL_RUNNER_MAP = {
    javascript: {
        command: process.execPath,
        argsFromCode: (code) => ['-e', code],
        runtime: 'node'
    },
    python: {
        command: 'python3',
        argsFromCode: (code) => ['-c', code],
        runtime: 'python3'
    }
};

const LOCAL_FILE_RUNNER_MAP = {
    go: {
        sourceExt: '.go',
        commands: ['go'],
        argsFromPath: (sourcePath) => ['run', sourcePath],
        runtime: 'go'
    }
};

const LOCAL_COMPILED_RUNNER_MAP = {
    c: {
        compilers: ['gcc', 'clang'],
        sourceExt: '.c',
        compileArgs: (sourcePath, outputPath) => [sourcePath, '-O2', '-std=c11', '-o', outputPath],
        runtime: 'c'
    },
    cpp: {
        compilers: ['g++', 'clang++'],
        sourceExt: '.cpp',
        compileArgs: (sourcePath, outputPath) => [sourcePath, '-O2', '-std=c++17', '-o', outputPath],
        runtime: 'cpp'
    }
};

const LOCAL_VIRTUAL_LANGUAGE_SET = new Set([
    'json',
    'html',
    'css',
    'markdown',
    'sql',
    'yaml',
    'plaintext'
]);

const runSpawnedProcess = ({ command, args, stdin, timeoutMs }) =>
    new Promise((resolve, reject) => {
        const isWindows = process.platform === 'win32';
        const child = spawn(command, args, {
            stdio: ['pipe', 'pipe', 'pipe'],
            detached: !isWindows
        });

        let stdout = '';
        let stderr = '';
        let finished = false;
        let stdoutTruncated = false;
        let stderrTruncated = false;

        const killChildTree = () => {
            try {
                if (isWindows) {
                    child.kill('SIGKILL');
                    return;
                }

                if (typeof child.pid === 'number' && child.pid > 0) {
                    process.kill(-child.pid, 'SIGKILL');
                    return;
                }
            } catch (error) {
                // Ignore ESRCH when the process has already exited.
                if (error?.code !== 'ESRCH') {
                    try {
                        child.kill('SIGKILL');
                    } catch {
                        // noop
                    }
                }
                return;
            }

            try {
                child.kill('SIGKILL');
            } catch {
                // noop
            }
        };

        const appendOutput = (target, chunkText) => {
            const available = EXEC_OUTPUT_MAX_LENGTH - target.length;
            if (available <= 0) {
                return { value: target, truncated: true };
            }

            if (chunkText.length <= available) {
                return { value: target + chunkText, truncated: false };
            }

            return {
                value: target + chunkText.slice(0, available),
                truncated: true
            };
        };

        const buildTruncatedNotice = (streamName) =>
            `\n[${streamName} truncated at ${EXEC_OUTPUT_MAX_LENGTH} bytes]`;

        const finalizeOutput = () => {
            if (stdoutTruncated) stdout = `${stdout}${buildTruncatedNotice('stdout')}`;
            if (stderrTruncated) stderr = `${stderr}${buildTruncatedNotice('stderr')}`;
        };

        const timer = setTimeout(() => {
            if (finished) return;
            finished = true;
            killChildTree();
            finalizeOutput();
            resolve({
                stdout,
                stderr: `${stderr}\nExecution timed out after ${timeoutMs}ms`.trim(),
                code: 124,
                signal: 'SIGKILL'
            });
        }, timeoutMs);

        child.stdout.on('data', (chunk) => {
            const next = appendOutput(stdout, chunk.toString());
            stdout = next.value;
            stdoutTruncated = stdoutTruncated || next.truncated;
        });

        child.stderr.on('data', (chunk) => {
            const next = appendOutput(stderr, chunk.toString());
            stderr = next.value;
            stderrTruncated = stderrTruncated || next.truncated;
        });

        child.on('error', (error) => {
            if (finished) return;
            finished = true;
            clearTimeout(timer);
            reject(error);
        });

        child.on('close', (code, signal) => {
            if (finished) return;
            finished = true;
            clearTimeout(timer);
            finalizeOutput();
            resolve({ stdout, stderr, code, signal });
        });

        if (typeof stdin === 'string' && stdin.length > 0) {
            child.stdin.write(stdin);
        }
        child.stdin.end();
    });

const executeProcess = async ({ command, args, stdin, timeoutMs, applyResourceLimits = true }) => {
    if (!applyResourceLimits) {
        return runSpawnedProcess({ command, args, stdin, timeoutMs });
    }

    try {
        return await runSpawnedProcess({
            command: 'prlimit',
            args: [
                `--cpu=${EXEC_LIMIT_CPU_SECONDS}`,
                `--as=${EXEC_LIMIT_MEMORY_BYTES}`,
                `--nproc=${EXEC_LIMIT_NPROC}`,
                '--',
                command,
                ...(Array.isArray(args) ? args : [])
            ],
            stdin,
            timeoutMs
        });
    } catch (error) {
        // If prlimit is missing on host, continue without hard process caps.
        if (error?.code === 'ENOENT') {
            return runSpawnedProcess({ command, args, stdin, timeoutMs });
        }
        throw error;
    }
};

const executeCompiledCode = async ({ language, code, stdin, timeoutMs }) => {
    const mapped = LOCAL_COMPILED_RUNNER_MAP[language];
    if (!mapped) {
        throw new Error(`No compiled runner configured for language: ${language}`);
    }

    const workspaceDir = await fs.mkdtemp(path.join(os.tmpdir(), 'itecify-compile-'));
    const sourcePath = path.join(workspaceDir, `main${mapped.sourceExt}`);
    const executableName = process.platform === 'win32' ? 'program.exe' : 'program';
    const outputPath = path.join(workspaceDir, executableName);

    try {
        await fs.writeFile(sourcePath, code, 'utf8');

        const compileTimeoutMs = Math.min(timeoutMs, 10000);
        const compilerCandidates = Array.isArray(mapped.compilers) && mapped.compilers.length > 0
            ? mapped.compilers
            : [];

        let selectedCompiler = null;
        let compileRun = null;
        let missingCompilerError = null;

        for (const compiler of compilerCandidates) {
            try {
                compileRun = await executeProcess({
                    command: compiler,
                    args: mapped.compileArgs(sourcePath, outputPath),
                    stdin: '',
                    timeoutMs: compileTimeoutMs,
                    applyResourceLimits: false
                });
                if (looksLikeMissingExecutableOutput(compileRun.stderr, compileRun.code)) {
                    compileRun = null;
                    continue;
                }
                selectedCompiler = compiler;
                break;
            } catch (error) {
                if (error?.code === 'ENOENT') {
                    missingCompilerError = error;
                    continue;
                }
                throw error;
            }
        }

        if (!compileRun || !selectedCompiler) {
            const missingError = missingCompilerError || new Error('No C/C++ compiler found.');
            missingError.code = 'ENOENT';
            missingError.path = compilerCandidates.join(' or ');
            throw missingError;
        }

        if (compileRun.code !== 0) {
            return {
                stage: 'compile',
                runtime: selectedCompiler,
                stdout: compileRun.stdout || '',
                stderr: compileRun.stderr || '',
                code: Number.isInteger(compileRun.code) ? compileRun.code : null,
                signal: compileRun.signal || null
            };
        }

        const run = await executeProcess({
            command: outputPath,
            args: [],
            stdin: typeof stdin === 'string' ? stdin : '',
            timeoutMs
        });

        return {
            stage: 'run',
            runtime: selectedCompiler,
            stdout: run.stdout || '',
            stderr: run.stderr || '',
            code: Number.isInteger(run.code) ? run.code : null,
            signal: run.signal || null
        };
    } finally {
        await fs.rm(workspaceDir, { recursive: true, force: true });
    }
};

const executeWithCommandFallback = async ({ commandCandidates, argsFromCommand, stdin, timeoutMs, applyResourceLimits = true }) => {
    let missingError = null;

    for (const command of commandCandidates || []) {
        try {
            const run = await executeProcess({
                command,
                args: argsFromCommand(command),
                stdin: typeof stdin === 'string' ? stdin : '',
                timeoutMs,
                applyResourceLimits
            });
            if (looksLikeMissingExecutableOutput(run.stderr, run.code)) {
                continue;
            }
            return { run, command };
        } catch (error) {
            if (error?.code === 'ENOENT') {
                missingError = error;
                continue;
            }
            throw error;
        }
    }

    const missingExecutableError = missingError || new Error('No matching executable found.');
    missingExecutableError.code = 'ENOENT';
    missingExecutableError.path = (commandCandidates || []).join(' or ');
    throw missingExecutableError;
};

const executeFileRunnerCode = async ({ language, code, stdin, timeoutMs }) => {
    const mapped = LOCAL_FILE_RUNNER_MAP[language];
    if (!mapped) {
        throw new Error(`No file runner configured for language: ${language}`);
    }

    const workspaceDir = await fs.mkdtemp(path.join(os.tmpdir(), 'itecify-file-run-'));
    const sourcePath = path.join(workspaceDir, `main${mapped.sourceExt}`);

    try {
        await fs.writeFile(sourcePath, code, 'utf8');

        const { run, command } = await executeWithCommandFallback({
            commandCandidates: mapped.commands,
            argsFromCommand: () => mapped.argsFromPath(sourcePath),
            stdin,
            timeoutMs
        });

        return {
            stage: 'run',
            runtime: command || mapped.runtime,
            stdout: run.stdout || '',
            stderr: run.stderr || '',
            code: Number.isInteger(run.code) ? run.code : null,
            signal: run.signal || null
        };
    } finally {
        await fs.rm(workspaceDir, { recursive: true, force: true });
    }
};

const executeTypeScriptCode = async ({ code, stdin, timeoutMs }) => {
    const workspaceDir = await fs.mkdtemp(path.join(os.tmpdir(), 'itecify-ts-run-'));
    const sourcePath = path.join(workspaceDir, 'main.ts');
    const transpiledDir = path.join(workspaceDir, 'dist');
    const transpiledPath = path.join(transpiledDir, 'main.js');

    try {
        await fs.writeFile(sourcePath, code, 'utf8');

        const directRun = await executeWithCommandFallback({
            commandCandidates: ['ts-node', 'tsx'],
            argsFromCommand: () => [sourcePath],
            stdin,
            timeoutMs
        }).catch((error) => {
            if (error?.code === 'ENOENT') return null;
            throw error;
        });

        if (directRun?.run) {
            return {
                stage: 'run',
                runtime: directRun.command,
                stdout: directRun.run.stdout || '',
                stderr: directRun.run.stderr || '',
                code: Number.isInteger(directRun.run.code) ? directRun.run.code : null,
                signal: directRun.run.signal || null
            };
        }

        const compileTimeoutMs = Math.min(timeoutMs, 10000);
        const { run: transpileRun, command: transpileCommand } = await executeWithCommandFallback({
            commandCandidates: ['tsc'],
            argsFromCommand: () => [
                sourcePath,
                '--target',
                'ES2020',
                '--module',
                'commonjs',
                '--outDir',
                transpiledDir
            ],
            stdin: '',
            timeoutMs: compileTimeoutMs,
            applyResourceLimits: false
        });

        if (transpileRun.code !== 0) {
            return {
                stage: 'compile',
                runtime: transpileCommand,
                stdout: transpileRun.stdout || '',
                stderr: transpileRun.stderr || '',
                code: Number.isInteger(transpileRun.code) ? transpileRun.code : null,
                signal: transpileRun.signal || null
            };
        }

        const run = await executeProcess({
            command: process.execPath,
            args: [transpiledPath],
            stdin: typeof stdin === 'string' ? stdin : '',
            timeoutMs
        });

        return {
            stage: 'run',
            runtime: `${transpileCommand}+node`,
            stdout: run.stdout || '',
            stderr: run.stderr || '',
            code: Number.isInteger(run.code) ? run.code : null,
            signal: run.signal || null
        };
    } finally {
        await fs.rm(workspaceDir, { recursive: true, force: true });
    }
};

const executeJavaCode = async ({ code, stdin, timeoutMs }) => {
    const workspaceDir = await fs.mkdtemp(path.join(os.tmpdir(), 'itecify-java-run-'));
    const sourcePath = path.join(workspaceDir, 'Main.java');

    try {
        await fs.writeFile(sourcePath, code, 'utf8');

        const compileTimeoutMs = Math.min(timeoutMs, 10000);
        const { run: compileRun, command: compileCommand } = await executeWithCommandFallback({
            commandCandidates: ['javac'],
            argsFromCommand: () => [sourcePath],
            stdin: '',
            timeoutMs: compileTimeoutMs,
            applyResourceLimits: false
        });

        if (compileRun.code !== 0) {
            return {
                stage: 'compile',
                runtime: compileCommand,
                stdout: compileRun.stdout || '',
                stderr: compileRun.stderr || '',
                code: Number.isInteger(compileRun.code) ? compileRun.code : null,
                signal: compileRun.signal || null
            };
        }

        const { run, command } = await executeWithCommandFallback({
            commandCandidates: ['java'],
            argsFromCommand: () => ['-cp', workspaceDir, 'Main'],
            stdin,
            timeoutMs
        });

        return {
            stage: 'run',
            runtime: `${compileCommand}+${command}`,
            stdout: run.stdout || '',
            stderr: run.stderr || '',
            code: Number.isInteger(run.code) ? run.code : null,
            signal: run.signal || null
        };
    } finally {
        await fs.rm(workspaceDir, { recursive: true, force: true });
    }
};

const executeRustCode = async ({ code, stdin, timeoutMs }) => {
    const workspaceDir = await fs.mkdtemp(path.join(os.tmpdir(), 'itecify-rust-run-'));
    const sourcePath = path.join(workspaceDir, 'main.rs');
    const outputPath = path.join(workspaceDir, process.platform === 'win32' ? 'program.exe' : 'program');

    try {
        await fs.writeFile(sourcePath, code, 'utf8');

        const compileTimeoutMs = Math.min(timeoutMs, 10000);
        const { run: compileRun, command: compileCommand } = await executeWithCommandFallback({
            commandCandidates: ['rustc'],
            argsFromCommand: () => [sourcePath, '-O', '-o', outputPath],
            stdin: '',
            timeoutMs: compileTimeoutMs,
            applyResourceLimits: false
        });

        if (compileRun.code !== 0) {
            return {
                stage: 'compile',
                runtime: compileCommand,
                stdout: compileRun.stdout || '',
                stderr: compileRun.stderr || '',
                code: Number.isInteger(compileRun.code) ? compileRun.code : null,
                signal: compileRun.signal || null
            };
        }

        const run = await executeProcess({
            command: outputPath,
            args: [],
            stdin: typeof stdin === 'string' ? stdin : '',
            timeoutMs
        });

        return {
            stage: 'run',
            runtime: compileCommand,
            stdout: run.stdout || '',
            stderr: run.stderr || '',
            code: Number.isInteger(run.code) ? run.code : null,
            signal: run.signal || null
        };
    } finally {
        await fs.rm(workspaceDir, { recursive: true, force: true });
    }
};

const executeCSharpCode = async ({ code, stdin, timeoutMs }) => {
    const workspaceDir = await fs.mkdtemp(path.join(os.tmpdir(), 'itecify-cs-run-'));
    const sourcePath = path.join(workspaceDir, 'Program.cs');
    const outputPath = path.join(workspaceDir, 'program.exe');

    try {
        await fs.writeFile(sourcePath, code, 'utf8');

        const compileTimeoutMs = Math.min(timeoutMs, 10000);
        const { run: compileRun, command: compileCommand } = await executeWithCommandFallback({
            commandCandidates: ['mcs', 'csc'],
            argsFromCommand: (command) => {
                if (command === 'mcs') return [sourcePath, '-out:' + outputPath];
                return ['-out:' + outputPath, sourcePath];
            },
            stdin: '',
            timeoutMs: compileTimeoutMs,
            applyResourceLimits: false
        });

        if (compileRun.code !== 0) {
            return {
                stage: 'compile',
                runtime: compileCommand,
                stdout: compileRun.stdout || '',
                stderr: compileRun.stderr || '',
                code: Number.isInteger(compileRun.code) ? compileRun.code : null,
                signal: compileRun.signal || null
            };
        }

        const { run, command } = await executeWithCommandFallback({
            commandCandidates: ['mono'],
            argsFromCommand: () => [outputPath],
            stdin,
            timeoutMs
        });

        return {
            stage: 'run',
            runtime: `${compileCommand}+${command}`,
            stdout: run.stdout || '',
            stderr: run.stderr || '',
            code: Number.isInteger(run.code) ? run.code : null,
            signal: run.signal || null
        };
    } finally {
        await fs.rm(workspaceDir, { recursive: true, force: true });
    }
};

const executeVirtualLanguage = ({ language, code }) => {
    if (language === 'json') {
        try {
            const parsed = JSON.parse(code);
            return {
                stage: 'validate',
                runtime: 'json-parser',
                stdout: `${JSON.stringify(parsed, null, 2)}\n`,
                stderr: '',
                code: 0,
                signal: null
            };
        } catch (error) {
            return {
                stage: 'validate',
                runtime: 'json-parser',
                stdout: '',
                stderr: `Invalid JSON: ${error.message}`,
                code: 1,
                signal: null
            };
        }
    }

    return {
        stage: 'preview',
        runtime: `virtual-${language}`,
        stdout: code || '',
        stderr: '',
        code: 0,
        signal: null
    };
};

const updateRoomFileRecord = async ({ roomId, fileId, content, language, userId }) => {
    const validUserId = await resolveExistingUserId(userId);
    const patch = {
        updatedat: new Date().toISOString(),
        updatedby: validUserId
    };

    if (typeof content === 'string') patch.content = content;
    if (typeof language === 'string' && language.trim()) patch.language = language.trim();

    const { data, error } = await supabase
        .from(ROOM_FILES_TABLE)
        .update(patch)
        .eq('id', fileId)
        .eq('roomid', roomId)
        .select('*')
        .maybeSingle();

    return { data, error };
};

const resolveExistingUserId = async (candidateUserId) => {
    const normalized = asPositiveInt(candidateUserId);
    if (!normalized) return null;

    const { data: user, error } = await supabase
        .from(USERS_TABLE)
        .select('id')
        .eq('id', normalized)
        .maybeSingle();

    if (error || !user) return null;
    return normalized;
};

const normalizeUserKey = (value) => {
    const userKey = String(value || '').trim().toLowerCase();
    return userKey || null;
};

const generateRoomCode = () => {
    let next = '';
    for (let i = 0; i < ROOM_CODE_LENGTH; i += 1) {
        const idx = Math.floor(Math.random() * ROOM_CODE_ALPHABET.length);
        next += ROOM_CODE_ALPHABET[idx];
    }
    return next;
};

const getUniqueRoomCode = async () => {
    for (let attempt = 0; attempt < 12; attempt += 1) {
        const candidate = generateRoomCode();
        const { data, error } = await supabase
            .from(ROOMS_TABLE)
            .select('id')
            .eq('roomcode', candidate)
            .maybeSingle();

        if (error) throw error;
        if (!data) return candidate;
    }

    throw new Error('Unable to generate unique room code. Please try again.');
};

const resolveRoomFromToken = async (roomToken) => {
    const normalizedToken = String(roomToken || '').trim();
    if (!normalizedToken) return { room: null, error: null };

    const numericRoomId = asPositiveInt(normalizedToken);
    if (numericRoomId) {
        const { data, error } = await supabase
            .from(ROOMS_TABLE)
            .select('id,name,roomcode,passwordhash')
            .eq('id', numericRoomId)
            .maybeSingle();
        return { room: data || null, error: error || null };
    }

    const code = normalizedToken.toUpperCase();
    const { data, error } = await supabase
        .from(ROOMS_TABLE)
        .select('id,name,roomcode,passwordhash')
        .eq('roomcode', code)
        .maybeSingle();
    return { room: data || null, error: error || null };
};

const getRoomActiveParticipantCounts = () => {
    const perRoomSocketSets = new Map();

    for (const [roomKey, roomState] of collabState.rooms.entries()) {
        const rawRoomId = String(roomKey || '').split(':')[0];
        const roomId = asPositiveInt(rawRoomId);
        if (!roomId) continue;

        if (!perRoomSocketSets.has(roomId)) {
            perRoomSocketSets.set(roomId, new Set());
        }

        const socketSet = perRoomSocketSets.get(roomId);
        for (const socketId of roomState.members.keys()) {
            socketSet.add(socketId);
        }
    }

    const counts = new Map();
    for (const [roomId, socketSet] of perRoomSocketSets.entries()) {
        counts.set(roomId, socketSet.size);
    }
    return counts;
};

// Auth endpoints backed by custom users table.
// Expected schema uses lowercase Postgres identifiers: users(email, password, firstname, lastname, ...).
app.post('/api/auth/signup', async (req, res, next) => {
    try {
        const { email, password, firstName, lastName, role } = req.body || {};

        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({ message: 'email, password, firstName and lastName are required.' });
        }

        if (String(password).length < 6) {
            return res.status(400).json({ message: 'Password must contain at least 6 characters.' });
        }

        const normalizedEmail = String(email).trim().toLowerCase();

        const { data: existingUser, error: existingError } = await supabase
            .from(USERS_TABLE)
            .select('id')
            .eq('email', normalizedEmail)
            .maybeSingle();

        if (existingError) {
            return res.status(400).json({ message: existingError.message, code: existingError.code });
        }

        if (existingUser) {
            return res.status(409).json({ message: 'Email already in use.' });
        }

        const hashedPassword = await bcrypt.hash(String(password), 10);

        const insertPayload = {
            email: normalizedEmail,
            password: hashedPassword,
            firstname: String(firstName).trim(),
            lastname: String(lastName).trim(),
            role: role || 'student',
            isactive: true,
            createdat: new Date().toISOString(),
            updatedat: new Date().toISOString()
        };

        const { data: createdUser, error: createError } = await supabase
            .from(USERS_TABLE)
            .insert(insertPayload)
            .select('id,email,firstname,lastname,role,isactive,createdat')
            .single();

        if (createError) {
            return res.status(400).json({ message: createError.message, code: createError.code });
        }

        return res.status(201).json({
            message: 'Account created successfully.',
            user: createdUser
        });
    } catch (error) {
        next(error);
    }
});

app.post('/api/auth/signin', async (req, res, next) => {
    try {
        const { email, password } = req.body || {};

        if (!email || !password) {
            return res.status(400).json({ message: 'email and password are required.' });
        }

        const normalizedEmail = String(email).trim().toLowerCase();

        const { data: user, error: userError } = await supabase
            .from(USERS_TABLE)
            .select('id,email,password,firstname,lastname,role,isactive')
            .eq('email', normalizedEmail)
            .maybeSingle();

        if (userError) {
            return res.status(400).json({ message: userError.message, code: userError.code });
        }

        if (!user || !user.password) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        if (user.isactive === false) {
            return res.status(403).json({ message: 'Account is inactive.' });
        }

        const passwordOk = await bcrypt.compare(String(password), String(user.password));
        if (!passwordOk) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            return res.status(500).json({ message: 'Missing JWT_SECRET on server.' });
        }

        const token = jwt.sign(
            {
                sub: user.id,
                email: user.email,
                role: user.role,
                name: `${user.firstname || ''} ${user.lastname || ''}`.trim()
            },
            jwtSecret,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        await supabase
            .from(USERS_TABLE)
            .update({ lastlogin: new Date().toISOString(), updatedat: new Date().toISOString() })
            .eq('id', user.id);

        return res.status(200).json({
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstname,
                lastName: user.lastname,
                role: user.role
            }
        });
    } catch (error) {
        next(error);
    }
});

// Create a collaboration room.
app.post('/api/rooms', async (req, res, next) => {
    try {
        const { name, userId, password } = req.body || {};
        const normalizedName = String(name || '').trim();
        const normalizedPassword = String(password || '').trim();

        if (!normalizedName) {
            return res.status(400).json({ message: 'Room name is required.' });
        }

        if (normalizedPassword && normalizedPassword.length < 4) {
            return res.status(400).json({ message: 'Room password must have at least 4 characters.' });
        }

        const roomCode = await getUniqueRoomCode();
        const passwordHash = normalizedPassword ? await bcrypt.hash(normalizedPassword, 10) : null;

        let ownerId = asPositiveInt(userId);

        if (ownerId) {
            const { data: owner, error: ownerLookupError } = await supabase
                .from(USERS_TABLE)
                .select('id')
                .eq('id', ownerId)
                .maybeSingle();

            if (ownerLookupError) {
                return res.status(400).json({ message: ownerLookupError.message, code: ownerLookupError.code });
            }

            if (!owner) {
                // If the auth identity does not exist in USERS_TABLE, keep room creation working.
                ownerId = null;
            }
        }

        const { data: room, error: roomError } = await supabase
            .from(ROOMS_TABLE)
            .insert({
                name: normalizedName,
                roomcode: roomCode,
                passwordhash: passwordHash,
                createdby: ownerId || null,
                createdat: new Date().toISOString(),
                updatedat: new Date().toISOString()
            })
            .select('id,name,roomcode,createdby,createdat,updatedat')
            .single();

        if (roomError) {
            return res.status(400).json({ message: roomError.message, code: roomError.code });
        }

        if (ownerId) {
            await supabase
                .from(ROOM_MEMBERS_TABLE)
                .insert({
                    roomid: room.id,
                    userid: ownerId,
                    role: 'owner',
                    joinedat: new Date().toISOString()
                });
        }

        return res.status(201).json({ room });
    } catch (error) {
        next(error);
    }
});

const handleJoinRoom = async (req, res, next) => {
    try {
        const roomToken = req.body?.roomToken || req.params.roomId;
        const joinPassword = String(req.body?.password || '').trim();
        let userId = asPositiveInt(req.body?.userId);

        if (!roomToken) {
            return res.status(400).json({ message: 'Room ID or room code is required.' });
        }

        const { room, error: roomLookupError } = await resolveRoomFromToken(roomToken);
        if (roomLookupError) {
            return res.status(400).json({ message: roomLookupError.message, code: roomLookupError.code });
        }
        if (!room) {
            return res.status(404).json({ message: 'Room not found.' });
        }

        const roomId = asPositiveInt(room.id);
        if (!roomId) {
            return res.status(400).json({ message: 'Invalid room id.' });
        }

        if (room.passwordhash) {
            if (!joinPassword) {
                return res.status(401).json({ message: 'Room password is required.' });
            }
            const passwordMatch = await bcrypt.compare(joinPassword, String(room.passwordhash));
            if (!passwordMatch) {
                return res.status(401).json({ message: 'Invalid room password.' });
            }
        }

        if (!userId) {
            return res.status(200).json({ message: 'Joined room as guest (no userId provided).', roomId, roomCode: room.roomcode || null });
        }

        const { data: joiningUser, error: joiningUserLookupError } = await supabase
            .from(USERS_TABLE)
            .select('id')
            .eq('id', userId)
            .maybeSingle();

        if (joiningUserLookupError) {
            return res.status(400).json({ message: joiningUserLookupError.message, code: joiningUserLookupError.code });
        }

        if (!joiningUser) {
            return res.status(200).json({
                message: 'Joined room as guest (user not found in users table).',
                roomId,
                roomCode: room.roomcode || null
            });
        }

        const { error } = await supabase
            .from(ROOM_MEMBERS_TABLE)
            .upsert({
                roomid: roomId,
                userid: userId,
                role: 'member',
                joinedat: new Date().toISOString()
            }, { onConflict: 'roomid,userid' });

        if (error) {
            return res.status(400).json({ message: error.message, code: error.code });
        }

        return res.status(200).json({ message: 'Joined room successfully.', roomId, roomCode: room.roomcode || null });
    } catch (error) {
        next(error);
    }
};

// Join an existing room using numeric ID, or alphanumeric room code in request body.
app.post('/api/rooms/:roomId/join', handleJoinRoom);
app.post('/api/rooms/join', handleJoinRoom);

// List user's recent sessions with live participant counts.
app.get('/api/rooms/sessions', async (req, res, next) => {
    try {
        const userId = asPositiveInt(req.query?.userId);
        if (!userId) {
            return res.status(400).json({ message: 'Valid userId query parameter is required.' });
        }

        const roomIds = new Set();

        const { data: ownedRooms, error: ownedError } = await supabase
            .from(ROOMS_TABLE)
            .select('id')
            .eq('createdby', userId)
            .limit(100);
        if (ownedError) {
            return res.status(400).json({ message: ownedError.message, code: ownedError.code });
        }
        (ownedRooms || []).forEach((room) => {
            const id = asPositiveInt(room?.id);
            if (id) roomIds.add(id);
        });

        const { data: memberRows, error: memberError } = await supabase
            .from(ROOM_MEMBERS_TABLE)
            .select('roomid')
            .eq('userid', userId)
            .limit(200);
        if (memberError) {
            return res.status(400).json({ message: memberError.message, code: memberError.code });
        }
        (memberRows || []).forEach((row) => {
            const id = asPositiveInt(row?.roomid);
            if (id) roomIds.add(id);
        });

        // Include currently active rooms in realtime memory for users that are guests (not persisted in roommembers).
        for (const [roomKey, roomState] of collabState.rooms.entries()) {
            const rawRoomId = String(roomKey || '').split(':')[0];
            const roomId = asPositiveInt(rawRoomId);
            if (!roomId) continue;

            const hasMatchingLiveMember = Array.from(roomState.members.values()).some(
                (member) => asPositiveInt(member?.user?.id) === userId
            );
            if (hasMatchingLiveMember) {
                roomIds.add(roomId);
            }
        }

        if (roomIds.size === 0) {
            return res.status(200).json({ sessions: [] });
        }

        const roomIdList = Array.from(roomIds);
        const { data: rooms, error: roomsError } = await supabase
            .from(ROOMS_TABLE)
            .select('id,name,roomcode,createdby,updatedat,passwordhash')
            .in('id', roomIdList)
            .order('updatedat', { ascending: false })
            .limit(25);

        if (roomsError) {
            return res.status(400).json({ message: roomsError.message, code: roomsError.code });
        }

        const activeCounts = getRoomActiveParticipantCounts();
        const sessions = (rooms || []).map((room) => {
            const roomId = asPositiveInt(room?.id);
            const activeParticipants = roomId ? activeCounts.get(roomId) || 0 : 0;
            return {
                id: roomId,
                name: room?.name || `Room ${roomId}`,
                roomCode: room?.roomcode || null,
                passwordProtected: Boolean(room?.passwordhash),
                isOwner: asPositiveInt(room?.createdby) === userId,
                activeParticipants,
                updatedAt: room?.updatedat || null
            };
        });

        return res.status(200).json({ sessions });
    } catch (error) {
        next(error);
    }
});

// Save a room to user's project shelf.
app.post('/api/projects', async (req, res, next) => {
    try {
        const userKey = normalizeUserKey(req.body?.userKey);
        const userId = asPositiveInt(req.body?.userId);
        const validUserId = await resolveExistingUserId(userId);
        const roomId = asPositiveInt(req.body?.roomId);
        const title = String(req.body?.title || '').trim();

        if (!userKey) {
            return res.status(400).json({ message: 'userKey is required.' });
        }
        if (!roomId) {
            return res.status(400).json({ message: 'Valid roomId is required.' });
        }

        const { data: room, error: roomError } = await supabase
            .from(ROOMS_TABLE)
            .select('id,name,roomcode,passwordhash,updatedat')
            .eq('id', roomId)
            .maybeSingle();

        if (roomError) {
            return res.status(400).json({ message: roomError.message, code: roomError.code });
        }
        if (!room) {
            return res.status(404).json({ message: 'Room not found.' });
        }

        const now = new Date().toISOString();
        const projectPayload = {
            userkey: userKey,
            userid: validUserId,
            roomid: roomId,
            title: title || room.name || `Room ${roomId}`,
            updatedat: now,
            createdat: now,
        };

        const { data: project, error: projectError } = await supabase
            .from(SAVED_PROJECTS_TABLE)
            .upsert(projectPayload, { onConflict: 'userkey,roomid' })
            .select('*')
            .single();

        if (projectError) {
            return res.status(400).json({ message: projectError.message, code: projectError.code });
        }

        return res.status(201).json({
            project: {
                id: project.id,
                roomId: room.id,
                roomCode: room.roomcode || null,
                title: project.title,
                roomName: room.name,
                passwordProtected: Boolean(room.passwordhash),
                updatedAt: project.updatedat || room.updatedat || null,
            },
        });
    } catch (error) {
        next(error);
    }
});

// List saved projects for a user.
app.get('/api/projects', async (req, res, next) => {
    try {
        const userKey = normalizeUserKey(req.query?.userKey);
        if (!userKey) {
            return res.status(400).json({ message: 'userKey query parameter is required.' });
        }

        const { data: projects, error } = await supabase
            .from(SAVED_PROJECTS_TABLE)
            .select('id,roomid,title,updatedat,createdat')
            .eq('userkey', userKey)
            .order('updatedat', { ascending: false })
            .limit(40);

        if (error) {
            return res.status(400).json({ message: error.message, code: error.code });
        }

        const roomIds = (projects || []).map((project) => asPositiveInt(project.roomid)).filter(Boolean);
        let roomMap = new Map();

        if (roomIds.length > 0) {
            const { data: rooms, error: roomsError } = await supabase
                .from(ROOMS_TABLE)
                .select('id,name,roomcode,passwordhash,updatedat')
                .in('id', roomIds);

            if (roomsError) {
                return res.status(400).json({ message: roomsError.message, code: roomsError.code });
            }

            roomMap = new Map((rooms || []).map((room) => [asPositiveInt(room.id), room]));
        }

        const result = (projects || [])
            .map((project) => {
                const projectRoomId = asPositiveInt(project.roomid);
                if (!projectRoomId) return null;
                const room = roomMap.get(projectRoomId);
                if (!room) return null;

                return {
                    id: project.id,
                    roomId: projectRoomId,
                    roomCode: room.roomcode || null,
                    title: project.title || room.name || `Room ${projectRoomId}`,
                    roomName: room.name || `Room ${projectRoomId}`,
                    passwordProtected: Boolean(room.passwordhash),
                    updatedAt: project.updatedat || room.updatedat || null,
                };
            })
            .filter(Boolean);

        return res.status(200).json({ projects: result });
    } catch (error) {
        next(error);
    }
});

// Remove one saved project bookmark.
app.delete('/api/projects/:projectId', async (req, res, next) => {
    try {
        const projectId = asPositiveInt(req.params.projectId);
        const userKey = normalizeUserKey(req.query?.userKey);

        if (!projectId) {
            return res.status(400).json({ message: 'Valid projectId is required.' });
        }
        if (!userKey) {
            return res.status(400).json({ message: 'userKey query parameter is required.' });
        }

        const { data: removed, error } = await supabase
            .from(SAVED_PROJECTS_TABLE)
            .delete()
            .eq('id', projectId)
            .eq('userkey', userKey)
            .select('id')
            .maybeSingle();

        if (error) {
            return res.status(400).json({ message: error.message, code: error.code });
        }
        if (!removed) {
            return res.status(404).json({ message: 'Saved project not found.' });
        }

        return res.status(200).json({ message: 'Project removed from shelf.' });
    } catch (error) {
        next(error);
    }
});

// Get room metadata for share UX in editor.
app.get('/api/rooms/:roomId(\\d+)', async (req, res, next) => {
    try {
        const roomId = asPositiveInt(req.params.roomId);
        if (!roomId) {
            return res.status(400).json({ message: 'Valid roomId is required.' });
        }

        const { data: room, error } = await supabase
            .from(ROOMS_TABLE)
            .select('id,name,roomcode,passwordhash,updatedat')
            .eq('id', roomId)
            .maybeSingle();

        if (error) {
            return res.status(400).json({ message: error.message, code: error.code });
        }
        if (!room) {
            return res.status(404).json({ message: 'Room not found.' });
        }

        return res.status(200).json({
            room: {
                id: room.id,
                name: room.name,
                roomCode: room.roomcode || null,
                passwordProtected: Boolean(room.passwordhash),
                updatedAt: room.updatedat || null
            }
        });
    } catch (error) {
        next(error);
    }
});

// List files from a room.
app.get('/api/rooms/:roomId/files', async (req, res, next) => {
    try {
        const roomId = asPositiveInt(req.params.roomId);
        if (!roomId) return res.status(400).json({ message: 'Invalid roomId.' });

        const { data, error } = await supabase
            .from(ROOM_FILES_TABLE)
            .select('id,roomid,path,language,updatedat')
            .eq('roomid', roomId)
            .order('updatedat', { ascending: false });

        if (error) {
            return res.status(400).json({ message: error.message, code: error.code });
        }

        return res.status(200).json({ files: data || [] });
    } catch (error) {
        next(error);
    }
});

// Create file in room.
app.post('/api/rooms/:roomId/files', async (req, res, next) => {
    try {
        const roomId = asPositiveInt(req.params.roomId);
        const { path, language, content, userId } = req.body || {};

        if (!roomId) return res.status(400).json({ message: 'Invalid roomId.' });
        if (!path || typeof path !== 'string') {
            return res.status(400).json({ message: 'File path is required.' });
        }

        const validUserId = await resolveExistingUserId(userId);

        const now = new Date().toISOString();
        const { data, error } = await supabase
            .from(ROOM_FILES_TABLE)
            .insert({
                roomid: roomId,
                path: path.trim(),
                language: language || 'plaintext',
                content: content || '',
                updatedby: validUserId,
                createdat: now,
                updatedat: now
            })
            .select('*')
            .single();

        if (error) {
            return res.status(400).json({ message: error.message, code: error.code });
        }

        return res.status(201).json({ file: data });
    } catch (error) {
        next(error);
    }
});

// Fetch file by id in room.
app.get('/api/rooms/:roomId/files/:fileId', async (req, res, next) => {
    try {
        const roomId = asPositiveInt(req.params.roomId);
        const fileId = asPositiveInt(req.params.fileId);

        if (!roomId || !fileId) {
            return res.status(400).json({ message: 'Invalid roomId or fileId.' });
        }

        const { data, error } = await supabase
            .from(ROOM_FILES_TABLE)
            .select('*')
            .eq('id', fileId)
            .eq('roomid', roomId)
            .maybeSingle();

        if (error) {
            return res.status(400).json({ message: error.message, code: error.code });
        }

        if (!data) {
            return res.status(404).json({ message: 'File not found.' });
        }

        return res.status(200).json({ file: data });
    } catch (error) {
        next(error);
    }
});

// Update file content/language.
app.patch('/api/rooms/:roomId/files/:fileId', async (req, res, next) => {
    try {
        const roomId = asPositiveInt(req.params.roomId);
        const fileId = asPositiveInt(req.params.fileId);
        const { content, language, userId } = req.body || {};

        if (!roomId || !fileId) {
            return res.status(400).json({ message: 'Invalid roomId or fileId.' });
        }

        const { data, error } = await updateRoomFileRecord({ roomId, fileId, content, language, userId });

        if (error) {
            return res.status(400).json({ message: error.message, code: error.code });
        }

        if (!data) {
            return res.status(404).json({ message: 'File not found.' });
        }

        return res.status(200).json({ file: data });
    } catch (error) {
        next(error);
    }
});

// Fallback save route using POST for environments where PATCH preflight is blocked.
app.post('/api/rooms/:roomId/files/:fileId/save', async (req, res, next) => {
    try {
        const roomId = asPositiveInt(req.params.roomId);
        const fileId = asPositiveInt(req.params.fileId);
        const { content, language, userId } = req.body || {};

        if (!roomId || !fileId) {
            return res.status(400).json({ message: 'Invalid roomId or fileId.' });
        }

        const { data, error } = await updateRoomFileRecord({ roomId, fileId, content, language, userId });

        if (error) {
            return res.status(400).json({ message: error.message, code: error.code });
        }

        if (!data) {
            return res.status(404).json({ message: 'File not found.' });
        }

        return res.status(200).json({ file: data, savedVia: 'post-fallback' });
    } catch (error) {
        next(error);
    }
});

// Create content snapshot for timeline/replay.
app.post('/api/rooms/:roomId/files/:fileId/snapshots', async (req, res, next) => {
    try {
        const roomId = asPositiveInt(req.params.roomId);
        const fileId = asPositiveInt(req.params.fileId);
        const { content, language, source, userId } = req.body || {};

        if (!roomId || !fileId) {
            return res.status(400).json({ message: 'Invalid roomId or fileId.' });
        }

        let snapshotContent = typeof content === 'string' ? content : null;
        let snapshotLanguage = typeof language === 'string' && language.trim() ? language.trim() : null;

        if (snapshotContent === null || snapshotLanguage === null) {
            const { data: fileData, error: fileError } = await supabase
                .from(ROOM_FILES_TABLE)
                .select('content,language')
                .eq('id', fileId)
                .eq('roomid', roomId)
                .maybeSingle();

            if (fileError) {
                return res.status(400).json({ message: fileError.message, code: fileError.code });
            }

            if (!fileData) {
                return res.status(404).json({ message: 'File not found.' });
            }

            if (snapshotContent === null) snapshotContent = fileData.content || '';
            if (snapshotLanguage === null) snapshotLanguage = fileData.language || 'plaintext';
        }

        const { data, error } = await supabase
            .from(EDIT_SNAPSHOTS_TABLE)
            .insert({
                roomid: roomId,
                fileid: fileId,
                userid: asPositiveInt(userId),
                source: typeof source === 'string' && source.trim() ? source.trim() : 'manual-save',
                language: snapshotLanguage,
                content: snapshotContent,
                createdat: new Date().toISOString()
            })
            .select('*')
            .single();

        if (error) {
            return res.status(400).json({ message: error.message, code: error.code });
        }

        return res.status(201).json({ snapshot: data });
    } catch (error) {
        next(error);
    }
});

// List latest snapshots for a room file.
app.get('/api/rooms/:roomId/files/:fileId/snapshots', async (req, res, next) => {
    try {
        const roomId = asPositiveInt(req.params.roomId);
        const fileId = asPositiveInt(req.params.fileId);
        const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);

        if (!roomId || !fileId) {
            return res.status(400).json({ message: 'Invalid roomId or fileId.' });
        }

        const { data, error } = await supabase
            .from(EDIT_SNAPSHOTS_TABLE)
            .select('*')
            .eq('roomid', roomId)
            .eq('fileid', fileId)
            .order('createdat', { ascending: false })
            .limit(limit);

        if (error) {
            return res.status(400).json({ message: error.message, code: error.code });
        }

        return res.status(200).json({ snapshots: data || [] });
    } catch (error) {
        next(error);
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Supabase connectivity check endpoint
app.get('/api/db/test', async (req, res, next) => {
    try {
        await testSupabaseConnection();
        res.status(200).json({ status: 'OK', message: 'Supabase connection works' });
    } catch (error) {
        next(error);
    }
});

// Basic table read endpoint for quick testing.
// Example: /api/db/table?name=profiles&limit=5
app.get('/api/db/table', async (req, res, next) => {
    try {
        const tableName = req.query.name;
        const limit = Math.min(Number(req.query.limit) || 10, 100);

        if (!tableName || typeof tableName !== 'string') {
            return res.status(400).json({ message: 'Query param "name" is required.' });
        }

        const { data, error } = await supabase.from(tableName).select('*').limit(limit);
        if (error) {
            return res.status(400).json({ message: error.message, code: error.code });
        }

        res.status(200).json({ data });
    } catch (error) {
        next(error);
    }
});

// AI configuration debug endpoint (safe: no keys exposed)
app.get('/api/ai/models', (req, res) => {
    res.status(200).json({ models: configuredModels });
});

// Compile/execute code for editor runner using local runtimes.
app.post('/api/compile', async (req, res, next) => {
    try {
        const { language, code, stdin, timeoutMs } = req.body || {};

        if (!language || !code || typeof code !== 'string') {
            return res.status(400).json({ message: 'language and code are required.' });
        }

        const normalizedLanguage = String(language).toLowerCase();
        const interpretedRunner = LOCAL_RUNNER_MAP[normalizedLanguage];
        const fileRunner = LOCAL_FILE_RUNNER_MAP[normalizedLanguage];
        const compiledRunner = LOCAL_COMPILED_RUNNER_MAP[normalizedLanguage];
        const isVirtualLanguage = LOCAL_VIRTUAL_LANGUAGE_SET.has(normalizedLanguage);

        if (!interpretedRunner && !fileRunner && !compiledRunner && normalizedLanguage !== 'typescript' && normalizedLanguage !== 'java' && normalizedLanguage !== 'rust' && normalizedLanguage !== 'csharp' && !isVirtualLanguage) {
            return res.status(400).json({
                message: `Language ${language} is not supported by local runner.`,
                supported: [
                    ...Object.keys(LOCAL_RUNNER_MAP),
                    ...Object.keys(LOCAL_FILE_RUNNER_MAP),
                    ...Object.keys(LOCAL_COMPILED_RUNNER_MAP),
                    'typescript',
                    'java',
                    'rust',
                    'csharp',
                    ...Array.from(LOCAL_VIRTUAL_LANGUAGE_SET)
                ]
            });
        }

        const executionTimeout = Math.min(Math.max(Number(timeoutMs) || 5000, 1000), 15000);
        let run;

        if (interpretedRunner) {
            run = await executeProcess({
                command: interpretedRunner.command,
                args: interpretedRunner.argsFromCode(code),
                stdin: typeof stdin === 'string' ? stdin : '',
                timeoutMs: executionTimeout
            });

            return res.status(200).json({
                stdout: run.stdout || '',
                stderr: run.stderr || '',
                output: `${run.stdout || ''}${run.stderr || ''}`,
                code: Number.isInteger(run.code) ? run.code : null,
                signal: run.signal || null,
                language: normalizedLanguage,
                runtime: interpretedRunner.runtime,
                stage: 'run'
            });
        }

        if (fileRunner) {
            run = await executeFileRunnerCode({
                language: normalizedLanguage,
                code,
                stdin,
                timeoutMs: executionTimeout
            });

            return res.status(200).json({
                stdout: run.stdout || '',
                stderr: run.stderr || '',
                output: `${run.stdout || ''}${run.stderr || ''}`,
                code: Number.isInteger(run.code) ? run.code : null,
                signal: run.signal || null,
                language: normalizedLanguage,
                runtime: run.runtime || fileRunner.runtime,
                stage: run.stage || 'run'
            });
        }

        if (normalizedLanguage === 'typescript') {
            run = await executeTypeScriptCode({ code, stdin, timeoutMs: executionTimeout });
            return res.status(200).json({
                stdout: run.stdout || '',
                stderr: run.stderr || '',
                output: `${run.stdout || ''}${run.stderr || ''}`,
                code: Number.isInteger(run.code) ? run.code : null,
                signal: run.signal || null,
                language: normalizedLanguage,
                runtime: run.runtime || 'typescript',
                stage: run.stage || 'run'
            });
        }

        if (normalizedLanguage === 'java') {
            run = await executeJavaCode({ code, stdin, timeoutMs: executionTimeout });
            return res.status(200).json({
                stdout: run.stdout || '',
                stderr: run.stderr || '',
                output: `${run.stdout || ''}${run.stderr || ''}`,
                code: Number.isInteger(run.code) ? run.code : null,
                signal: run.signal || null,
                language: normalizedLanguage,
                runtime: run.runtime || 'java',
                stage: run.stage || 'run'
            });
        }

        if (normalizedLanguage === 'rust') {
            run = await executeRustCode({ code, stdin, timeoutMs: executionTimeout });
            return res.status(200).json({
                stdout: run.stdout || '',
                stderr: run.stderr || '',
                output: `${run.stdout || ''}${run.stderr || ''}`,
                code: Number.isInteger(run.code) ? run.code : null,
                signal: run.signal || null,
                language: normalizedLanguage,
                runtime: run.runtime || 'rust',
                stage: run.stage || 'run'
            });
        }

        if (normalizedLanguage === 'csharp') {
            run = await executeCSharpCode({ code, stdin, timeoutMs: executionTimeout });
            return res.status(200).json({
                stdout: run.stdout || '',
                stderr: run.stderr || '',
                output: `${run.stdout || ''}${run.stderr || ''}`,
                code: Number.isInteger(run.code) ? run.code : null,
                signal: run.signal || null,
                language: normalizedLanguage,
                runtime: run.runtime || 'csharp',
                stage: run.stage || 'run'
            });
        }

        if (isVirtualLanguage) {
            run = executeVirtualLanguage({ language: normalizedLanguage, code });
            return res.status(200).json({
                stdout: run.stdout || '',
                stderr: run.stderr || '',
                output: `${run.stdout || ''}${run.stderr || ''}`,
                code: Number.isInteger(run.code) ? run.code : null,
                signal: run.signal || null,
                language: normalizedLanguage,
                runtime: run.runtime || `virtual-${normalizedLanguage}`,
                stage: run.stage || 'preview'
            });
        }

        run = await executeCompiledCode({
            language: normalizedLanguage,
            code,
            stdin,
            timeoutMs: executionTimeout
        });

        return res.status(200).json({
            stdout: run.stdout || '',
            stderr: run.stderr || '',
            output: `${run.stdout || ''}${run.stderr || ''}`,
            code: Number.isInteger(run.code) ? run.code : null,
            signal: run.signal || null,
            language: normalizedLanguage,
            runtime: run.runtime || compiledRunner.runtime,
            stage: run.stage || 'run'
        });
    } catch (error) {
        if (error?.code === 'ENOENT') {
            const missingExecutable = error?.path || 'required runtime/compiler';
            return res.status(500).json({
                message: `Missing executable on backend server: ${missingExecutable}. Install it and redeploy.`
            });
        }
        next(error);
    }
});

// AI generation endpoint for quick backend testing.
app.post('/api/ai/generate', async (req, res, next) => {
    try {
        const { prompt, system, model, temperature, maxTokens } = req.body || {};

        if (!prompt) {
            return res.status(400).json({ message: 'Body field "prompt" is required.' });
        }

        const result = await generateText({
            prompt,
            system,
            model,
            temperature: typeof temperature === 'number' ? temperature : 0.2,
            maxTokens: typeof maxTokens === 'number' ? maxTokens : 800
        });

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // Validate Supabase early, but don't block local startup if it is temporarily unavailable.
        await testSupabaseConnection();
        console.log('Supabase connection OK');
    } catch (error) {
        console.warn('Supabase check failed during startup. Server will still start:', error?.message || error);
    }

    // Start HTTP server even when initial Supabase connectivity check fails.
    httpServer.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();

module.exports = { app, io };