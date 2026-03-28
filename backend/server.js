const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const path = require('path');
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
    }
});

const collabState = {
    // Key format: `${roomId}:${fileId}`
    rooms: new Map()
};

const DEFAULT_AI_AGENTS = ['Planner', 'Refactor', 'BugFixer', 'Performance'];

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

const ensureRealtimeRoom = (roomId, fileId) => {
    const key = getRoomKey(roomId, fileId);
    if (!collabState.rooms.has(key)) {
        collabState.rooms.set(key, {
            content: '',
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
        cursor: m.cursor || 0,
        cursorLine: m.cursorLine || 1,
        cursorColumn: m.cursorColumn || 1,
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

        room.members.set(socket.id, {
            socketId: socket.id,
            user: socket.data.user,
            cursor: 0,
            cursorLine: 1,
            cursorColumn: 1,
            joinedAt: new Date().toISOString()
        });

        socket.emit('room:joined', {
            roomId,
            fileId,
            content: room.content,
            members: serializeMembers(room.members),
            aiBlocks: serializeAiBlocks(room.aiBlocks),
            aiAgents: getAiAgents()
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

        socket.to(channel).emit('editor:update', {
            roomId,
            fileId,
            content,
            by: socket.data.user || null,
            at: new Date().toISOString()
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

        socket.to(channel).emit('editor:op', {
            roomId,
            fileId,
            changes,
            by: socket.data.user || null,
            at: new Date().toISOString()
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

    socket.on('disconnect', () => {
        const roomId = socket.data.roomId;
        const fileId = socket.data.fileId;
        const channel = socket.data.channel;
        if (!roomId || !fileId || !channel) return;

        const key = getRoomKey(roomId, fileId);
        const room = collabState.rooms.get(key);
        if (!room) return;

        room.members.delete(socket.id);

        if (room.members.size === 0) {
            collabState.rooms.delete(key);
            return;
        }

        io.to(channel).emit('presence:state', {
            roomId,
            fileId,
            members: serializeMembers(room.members)
        });
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

const executeProcess = ({ command, args, stdin, timeoutMs }) =>
    new Promise((resolve, reject) => {
        const child = spawn(command, args, { stdio: ['pipe', 'pipe', 'pipe'] });

        let stdout = '';
        let stderr = '';
        let finished = false;

        const timer = setTimeout(() => {
            if (finished) return;
            finished = true;
            child.kill('SIGKILL');
            resolve({
                stdout,
                stderr: `${stderr}\nExecution timed out after ${timeoutMs}ms`.trim(),
                code: 124,
                signal: 'SIGKILL'
            });
        }, timeoutMs);

        child.stdout.on('data', (chunk) => {
            stdout += chunk.toString();
        });

        child.stderr.on('data', (chunk) => {
            stderr += chunk.toString();
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
            resolve({ stdout, stderr, code, signal });
        });

        if (typeof stdin === 'string' && stdin.length > 0) {
            child.stdin.write(stdin);
        }
        child.stdin.end();
    });

const updateRoomFileRecord = async ({ roomId, fileId, content, language, userId }) => {
    const patch = {
        updatedat: new Date().toISOString(),
        updatedby: asPositiveInt(userId)
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
        const { name, userId } = req.body || {};
        const normalizedName = String(name || '').trim();

        if (!normalizedName) {
            return res.status(400).json({ message: 'Room name is required.' });
        }

        const ownerId = asPositiveInt(userId);

        const { data: room, error: roomError } = await supabase
            .from(ROOMS_TABLE)
            .insert({
                name: normalizedName,
                createdby: ownerId,
                createdat: new Date().toISOString(),
                updatedat: new Date().toISOString()
            })
            .select('*')
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

// Join an existing room.
app.post('/api/rooms/:roomId/join', async (req, res, next) => {
    try {
        const roomId = asPositiveInt(req.params.roomId);
        const userId = asPositiveInt(req.body?.userId);

        if (!roomId || !userId) {
            return res.status(400).json({ message: 'Valid roomId and userId are required.' });
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

        return res.status(200).json({ message: 'Joined room successfully.' });
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

        const now = new Date().toISOString();
        const { data, error } = await supabase
            .from(ROOM_FILES_TABLE)
            .insert({
                roomid: roomId,
                path: path.trim(),
                language: language || 'plaintext',
                content: content || '',
                updatedby: asPositiveInt(userId),
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

        const mapped = LOCAL_RUNNER_MAP[String(language).toLowerCase()];
        if (!mapped) {
            return res.status(400).json({
                message: `Language ${language} is not supported by local runner.`,
                supported: Object.keys(LOCAL_RUNNER_MAP)
            });
        }

        const executionTimeout = Math.min(Math.max(Number(timeoutMs) || 5000, 1000), 15000);
        const run = await executeProcess({
            command: mapped.command,
            args: mapped.argsFromCode(code),
            stdin: typeof stdin === 'string' ? stdin : '',
            timeoutMs: executionTimeout
        });

        return res.status(200).json({
            stdout: run.stdout || '',
            stderr: run.stderr || '',
            output: `${run.stdout || ''}${run.stderr || ''}`,
            code: Number.isInteger(run.code) ? run.code : null,
            signal: run.signal || null,
            language: String(language).toLowerCase(),
            runtime: mapped.runtime
        });
    } catch (error) {
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