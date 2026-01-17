import { fileURLToPath } from 'url';
import { basename, dirname, join, resolve } from 'path';
import {
    accessSync,
    constants,
    copyFileSync,
    existsSync,
    lstatSync,
    mkdirSync,
    readdirSync,
    readFileSync,
    rmSync,
    statSync,
    writeFileSync,
} from 'fs';
import { homedir, platform } from 'os';
import { spawn, spawnSync } from 'child_process';

async function openInEditor(filePath) {
    const editor = process.env.EDITOR || 'vi';

    // Safety check for raw mode
    const wasRaw = process.stdin.isRaw;
    if (wasRaw) process.stdin.setRawMode(false);

    const child = spawn(editor, [filePath], {
        stdio: 'inherit'
    });

    await new Promise((resolve) => {
        child.on('exit', () => {
            if (wasRaw) {
                process.stdin.setRawMode(true);
                process.stdin.resume();
            }
            resolve();
        });
    });
}

import readline, { createInterface, emitKeypressEvents } from 'readline';
import updateNotifier from 'update-notifier';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PACKAGE_ROOT = resolve(__dirname, '..');
const TEMPLATES_DIR = join(PACKAGE_ROOT, 'templates');

const TOOL_IDS = ['claude', 'codex', 'opencode', 'gemini', 'antigravity'];
const VISION_TEMPLATE_PATH = join(TEMPLATES_DIR, 'VISION_TEMPLATE.md');
const WTV_LOGS_DIR = '.wtv/logs';
const LEGACY_LOGS_DIR = '.codehogg/logs';

// ANSI colors (works on Windows 10+, macOS, Linux)
const c = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    red: '\x1b[31m',
    white: '\x1b[37m',
    bgBlack: '\x1b[40m',
};

// Semantic theme (maps purpose to color)
const theme = {
    success: c.green,
    warning: c.yellow,
    error: c.red,
    info: c.cyan,
    accent: c.magenta,
    muted: c.dim,
    highlight: c.bold,
    brand: c.magenta,
};

// Symbols (use ASCII fallback on Windows if needed)
const isWindows = platform() === 'win32';
const sym = {
    check: isWindows ? '[OK]' : '✓',
    cross: isWindows ? '[X]' : '✗',
    arrow: isWindows ? '>' : '❯',
    bullet: isWindows ? '*' : '•',
    warn: isWindows ? '[!]' : '⚠',
    info: isWindows ? '[i]' : 'ℹ',
    spinner: isWindows
        ? ['|', '/', '-', '\\']
        : ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
};

// Box drawing characters
const box = {
    round: { tl: '╭', tr: '╮', bl: '╰', br: '╯', h: '─', v: '│' },
    square: { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│' },
    double: { tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║' },
    heavy: { tl: '┏', tr: '┓', bl: '┗', br: '┛', h: '━', v: '┃' },
};

// Layout constants
const MAX_WIDTH = 70;
const PADDING = 2;

// Get terminal width, constrained to readable max
function getWidth() {
    const termWidth = process.stdout.columns || 80;
    return Math.min(termWidth - PADDING * 2, MAX_WIDTH);
}

// Center text within terminal
function centerPad() {
    const termWidth = process.stdout.columns || 80;
    const contentWidth = Math.min(termWidth, MAX_WIDTH + PADDING * 2);
    return ' '.repeat(Math.max(0, Math.floor((termWidth - contentWidth) / 2)));
}

// Draw a box around content
function drawBox(lines, opts = {}) {
    const { style = 'round', color = '', padding = 1 } = opts;
    const chars = box[style] || box.round;
    const width = getWidth();
    const innerWidth = width - 2;

    const padLine = ' '.repeat(innerWidth);
    const output = [];
    const prefix = centerPad();
    const col = color || '';
    const reset = color ? c.reset : '';

    // Top border
    output.push(`${prefix}${col}${chars.tl}${chars.h.repeat(innerWidth)}${chars.tr}${reset}`);

    // Padding top
    for (let i = 0; i < padding; i++) {
        output.push(`${prefix}${col}${chars.v}${reset}${padLine}${col}${chars.v}${reset}`);
    }

    // Content lines
    for (const line of lines) {
        const stripped = line.replace(/\x1b\[[0-9;]*m/g, '');
        const padRight = Math.max(0, innerWidth - stripped.length);
        output.push(`${prefix}${col}${chars.v}${reset}${line}${' '.repeat(padRight)}${col}${chars.v}${reset}`);
    }

    // Padding bottom
    for (let i = 0; i < padding; i++) {
        output.push(`${prefix}${col}${chars.v}${reset}${padLine}${col}${chars.v}${reset}`);
    }

    // Bottom border
    output.push(`${prefix}${col}${chars.bl}${chars.h.repeat(innerWidth)}${chars.br}${reset}`);

    return output.join('\n');
}

// Simple spinner for async operations
function createSpinner(text) {
    if (!process.stdout.isTTY) {
        console.log(`  ${sym.bullet} ${text}`);
        return { stop: () => { }, succeed: () => { }, fail: () => { } };
    }

    let i = 0;
    const frames = sym.spinner;
    const id = setInterval(() => {
        process.stdout.write(`\r  ${c.cyan}${frames[i++ % frames.length]}${c.reset} ${text}`);
    }, 80);

    return {
        stop: (finalText) => {
            clearInterval(id);
            process.stdout.write(`\r  ${c.dim}${sym.bullet}${c.reset} ${finalText || text}\n`);
        },
        succeed: (finalText) => {
            clearInterval(id);
            process.stdout.write(`\r  ${c.green}${sym.check}${c.reset} ${finalText || text}\n`);
        },
        fail: (finalText) => {
            clearInterval(id);
            process.stdout.write(`\r  ${c.red}${sym.cross}${c.reset} ${finalText || text}\n`);
        },
    };
}

function getPackageJson() {
    return JSON.parse(readFileSync(join(PACKAGE_ROOT, 'package.json'), 'utf8'));
}

function getVersion() {
    return getPackageJson().version;
}

function getPackageName() {
    return getPackageJson().name;
}

// ============================================================================
// CONFIG SYSTEM
// ============================================================================

const WTV_CONFIG_DIR = '.wtv';
const LEGACY_CONFIG_DIR = '.codehogg';
const WTV_CONFIG_FILE = 'config.json';

const LEGACY_AGENT_NAME_ALIASES = {
    masterbuilder: 'paul',
    'security-artisan': 'nehemiah',
    'architecture-artisan': 'bezaleel',
    'backend-artisan': 'hiram',
    'frontend-artisan': 'aholiab',
    'database-artisan': 'solomon',
    'devops-artisan': 'zerubbabel',
    'qa-artisan': 'ezra',
    'product-artisan': 'moses',
};

function normalizeAgentName(name) {
    return LEGACY_AGENT_NAME_ALIASES[name] || name;
}

function normalizeFavorites(favorites) {
    if (!Array.isArray(favorites)) return [];
    const out = [];

    for (const fav of favorites) {
        if (!fav) continue;
        const normalized = normalizeAgentName(fav);
        if (!normalized) continue;
        if (!out.includes(normalized)) out.push(normalized);
    }

    return out;
}

function getConfigPaths(scope) {
    if (scope === 'global') {
        const home = getHomedir();
        if (!home) return [];
        return [
            join(home, WTV_CONFIG_DIR, WTV_CONFIG_FILE),
            join(home, LEGACY_CONFIG_DIR, WTV_CONFIG_FILE),
        ];
    }

    return [
        join(process.cwd(), WTV_CONFIG_DIR, WTV_CONFIG_FILE),
        join(process.cwd(), LEGACY_CONFIG_DIR, WTV_CONFIG_FILE),
    ];
}

function getPrimaryConfigPath(scope) {
    const paths = getConfigPaths(scope);
    return paths.length ? paths[0] : null;
}

function loadConfig() {
    const [globalWtv, globalLegacy] = getConfigPaths('global');
    const [localWtv, localLegacy] = getConfigPaths('project');

    const globalPath = globalWtv && existsSync(globalWtv)
        ? globalWtv
        : (globalLegacy && existsSync(globalLegacy) ? globalLegacy : null);

    const localPath = localWtv && existsSync(localWtv)
        ? localWtv
        : (localLegacy && existsSync(localLegacy) ? localLegacy : null);

    let globalConfig = {};
    let localConfig = {};

    if (globalPath) {
        try {
            globalConfig = JSON.parse(readFileSync(globalPath, 'utf8'));
        } catch { /* ignore parse errors */ }
    }

    if (localPath) {
        try {
            localConfig = JSON.parse(readFileSync(localPath, 'utf8'));
        } catch { /* ignore parse errors */ }
    }

    // Merge: local overrides global, but arrays are replaced not merged
    const rawFavorites = localConfig.favorites || globalConfig.favorites || [];

    return {
        favorites: normalizeFavorites(rawFavorites),
        defaultTool: localConfig.defaultTool || globalConfig.defaultTool || 'claude',
        editor: localConfig.editor || globalConfig.editor || null,
    };
}

function saveConfig(config, scope = 'project') {
    const configPath = getPrimaryConfigPath(scope);
    if (!configPath) return false;

    const configDir = dirname(configPath);
    ensureDir(configDir);

    writeFileSync(configPath, JSON.stringify(config, null, 2));
    return true;
}

function isFavorite(agentName) {
    const config = loadConfig();
    const normalized = normalizeAgentName(agentName);
    return config.favorites.includes(normalized);
}

function toggleFavorite(agentName, scope = 'project') {
    const normalized = normalizeAgentName(agentName);
    const config = loadConfig();
    const idx = config.favorites.indexOf(normalized);

    if (idx === -1) {
        config.favorites.push(normalized);
    } else {
        config.favorites.splice(idx, 1);
    }

    saveConfig({ favorites: config.favorites }, scope);
    return idx === -1; // Returns true if now a favorite
}

// ============================================================================
// AGENT DISCOVERY
// ============================================================================

function getAgentLocations() {
    const home = getHomedir();
    const locations = [];

    // Local (project-level)
    locations.push({
        label: 'Local',
        path: join(process.cwd(), '.claude', 'agents'),
        tool: 'claude',
        scope: 'local',
    });
    locations.push({
        label: 'Local (OpenCode)',
        path: join(process.cwd(), '.opencode', 'agent'),
        tool: 'opencode',
        scope: 'local',
    });
    locations.push({
        label: 'Local (Gemini)',
        path: join(process.cwd(), '.gemini', 'agents'),
        tool: 'gemini',
        scope: 'local',
    });
    // Antigravity does not use "agent definition files" locally like Claude/OpenCode.
    // However, for visualization, we might want to check for something, or just rely on rules.
    // For now, we will track .agent/rules/ as a proxy for "local configuration".
    locations.push({
        label: 'Local (Antigravity Rules)',
        path: join(process.cwd(), '.agent', 'rules'),
        tool: 'antigravity',
        scope: 'local',
    });

    // Global
    if (home) {
        locations.push({
            label: 'Global',
            path: join(home, '.claude', 'agents'),
            tool: 'claude',
            scope: 'global',
        });
        locations.push({
            label: 'Global (OpenCode)',
            path: join(home, '.config', 'opencode', 'agent'),
            tool: 'opencode',
            scope: 'global',
        });
        locations.push({
            label: 'Global (Gemini)',
            path: join(home, '.gemini', 'agents'),
            tool: 'gemini',
            scope: 'global',
        });
        // Antigravity global
        locations.push({
            label: 'Global (Antigravity)',
            path: join(home, '.gemini', 'antigravity'),
            tool: 'antigravity',
            scope: 'global',
        });
    }

    // Templates (Available to be installed)
    locations.push({
        label: 'Available',
        path: join(TEMPLATES_DIR, 'agents'),
        tool: 'all',
        scope: 'available',
    });

    return locations;
}

const BLOCK_FONT_3X5 = {
    A: ['███', '█ █', '███', '█ █', '█ █'],
    B: ['██ ', '█ █', '██ ', '█ █', '██ '],
    C: ['███', '█  ', '█  ', '█  ', '███'],
    D: ['██ ', '█ █', '█ █', '█ █', '██ '],
    E: ['███', '█  ', '██ ', '█  ', '███'],
    F: ['███', '█  ', '██ ', '█  ', '█  '],
    G: ['███', '█  ', '█ █', '█ █', '███'],
    H: ['█ █', '█ █', '███', '█ █', '█ █'],
    I: ['███', ' █ ', ' █ ', ' █ ', '███'],
    J: [' ██', '  █', '  █', '█ █', '██ '],
    K: ['█ █', '█ █', '██ ', '█ █', '█ █'],
    L: ['█  ', '█  ', '█  ', '█  ', '███'],
    M: ['█ █', '███', '███', '█ █', '█ █'],
    N: ['█ █', '███', '███', '███', '█ █'],
    O: ['███', '█ █', '█ █', '█ █', '███'],
    P: ['███', '█ █', '███', '█  ', '█  '],
    Q: ['███', '█ █', '█ █', '███', '  █'],
    R: ['███', '█ █', '███', '█ █', '█ █'],
    S: ['███', '█  ', '███', '  █', '███'],
    T: ['███', ' █ ', ' █ ', ' █ ', ' █ '],
    U: ['█ █', '█ █', '█ █', '█ █', '███'],
    V: ['█ █', '█ █', '█ █', '█ █', ' █ '],
    W: ['█ █', '█ █', '███', '███', '█ █'],
    X: ['█ █', '█ █', ' █ ', '█ █', '█ █'],
    Y: ['█ █', '█ █', ' █ ', ' █ ', ' █ '],
    Z: ['███', '  █', ' █ ', '█  ', '███'],
    ' ': ['   ', '   ', '   ', '   ', '   '],
    '-': ['   ', '   ', '███', '   ', '   '],
    '?': ['███', '  █', ' ██', '   ', ' █ '],
};

function renderBlockText(text, { maxWidth = null, color = null, bold = false } = {}) {
    const normalized = String(text || '').toUpperCase();
    const glyphWidth = 3;
    const letterGap = 1;
    const maxCharsPerLine = maxWidth
        ? Math.max(1, Math.floor((maxWidth + letterGap) / (glyphWidth + letterGap)))
        : normalized.length;

    const chunks = [];
    for (let i = 0; i < normalized.length; i += maxCharsPerLine) {
        chunks.push(normalized.slice(i, i + maxCharsPerLine));
    }

    const renderedLines = [];
    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
        const chunk = chunks[chunkIndex];
        for (let row = 0; row < 5; row++) {
            const rowText = chunk
                .split('')
                .map(ch => (BLOCK_FONT_3X5[ch] ? BLOCK_FONT_3X5[ch][row] : BLOCK_FONT_3X5['?']?.[row] || '???'))
                .join(' '.repeat(letterGap));

            const prefix = color ? (bold ? color + c.bold : color) : '';
            const suffix = color ? c.reset : '';
            renderedLines.push(prefix + rowText + suffix);
        }

        if (chunkIndex !== chunks.length - 1) {
            renderedLines.push('');
        }
    }

    return renderedLines.join('\n');
}

function parseAgentFile(filePath) {
    if (!existsSync(filePath)) return null;

    try {
        const content = readFileSync(filePath, 'utf8');
        const name = filePath.split('/').pop().replace(/\.md$/, '');

        // Parse frontmatter
        let description = '';
        let model = 'opus';
        let tools = [];
        let skills = [];

        if (content.startsWith('---')) {
            const endIdx = content.indexOf('\n---\n', 4);
            if (endIdx !== -1) {
                const fm = content.slice(4, endIdx);
                for (const line of fm.split('\n')) {
                    const match = line.match(/^([a-z]+):\s*(.+)$/i);
                    if (match) {
                        const [, key, val] = match;
                        if (key === 'description') description = val.replace(/^["']|["']$/g, '');
                        if (key === 'model') model = val;
                        if (key === 'tools') tools = val.split(',').map(t => t.trim());
                        if (key === 'skills') skills = val.split(',').map(s => s.trim());
                    }
                }
            }
        }

        // Fallback: extract first paragraph if no description
        if (!description) {
            const bodyMatch = content.match(/\n---\n\s*\n(.+)/);
            if (bodyMatch) {
                description = bodyMatch[1].slice(0, 80).replace(/[#*_]/g, '').trim();
            }
        }

        // Extract ASCII Art (looking for text blocks)
        let asciiArt = '';
        const asciiMatch = content.match(/```text\n([\s\S]+?)\n```/);
        if (asciiMatch) {
            asciiArt = asciiMatch[1];
        }

        return {
            name,
            description: description || 'No description',
            model,
            tools,
            skills,
            path: filePath,
            favorite: isFavorite(name),
            asciiArt,
        };
    } catch {
        return null;
    }
}

function discoverAgents(scopeFilter = null) {
    const locations = getAgentLocations();
    const agents = [];
    const seenNames = new Set();

    for (const loc of locations) {
        // Filter by scope if specified
        if (scopeFilter && loc.scope !== scopeFilter) continue;

        if (!existsSync(loc.path)) continue;

        try {
            const files = readdirSync(loc.path).filter(f => f.endsWith('.md'));
            for (const file of files) {
                const agent = parseAgentFile(join(loc.path, file));
                if (agent && !seenNames.has(agent.name)) {
                    seenNames.add(agent.name);
                    agents.push({
                        ...agent,
                        location: loc,
                    });
                }
            }
        } catch { /* ignore read errors */ }
    }

    // Sort: favorites first, then alphabetically
    return agents.sort((a, b) => {
        if (a.favorite && !b.favorite) return -1;
        if (!a.favorite && b.favorite) return 1;
        return a.name.localeCompare(b.name);
    });
}

function findAgent(name) {
    const agents = discoverAgents();
    return agents.find(a => a.name === name || a.name === `${name}-artisan`);
}

// ============================================================================
// AGENT TEMPLATE
// ============================================================================

const AGENT_TEMPLATE = `---
name: {{NAME}}
description: {{DESCRIPTION}}
tools: Read, Glob, Grep, Edit, Write, Bash, WebFetch, WebSearch
model: opus
skills: artisan-contract
---

# {{TITLE}}

You are the **{{TITLE}}**.

## Your Expertise

- [Define your areas of expertise]
- [What domains do you cover?]
- [What problems do you solve?]

## Mode of Operation

Paul (the Masterbuilder) will invoke you in one of two modes:

### Counsel Mode
Provide domain-specific advice for a mission. Identify concerns, recommend approaches, suggest implementations.

### Execution Mode
Implement assigned tasks from an approved plan. Build, test, verify, report.

## Follow the Contract

Always follow the \`artisan-contract\` skill for:
- Output format (Counsel or Execution)
- Evidence citations
- Vision alignment
- Distance assessment
- Confidence levels

## Domain-Specific Guidance

When providing counsel or executing:

1. **[First check]** — What to verify first
2. **[Second check]** — What to assess next
3. **[Third check]** — What to evaluate
4. **[Fourth check]** — What to consider
5. **[Fifth check]** — What to review

## Your Lane

Your domain includes:
- [List what's in scope]
- [List related technologies]
- [List relevant patterns]

If you see issues in other domains, note them for Paul but don't attempt to fix them.
`;

function createAgentFromTemplate(name, description) {
    const title = name
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    return AGENT_TEMPLATE
        .replace(/\{\{NAME\}\}/g, name)
        .replace(/\{\{TITLE\}\}/g, title)
        .replace(/\{\{DESCRIPTION\}\}/g, description);
}

// ============================================================================
// HABAKKUK WORKFLOW SYSTEM
// "Write the vision, and make it plain upon tables" — Habakkuk 2:2
// ============================================================================

const HABAKKUK_DIR = '.wtv/habakkuk';
const LEGACY_HABAKKUK_DIR = '.codehogg/habakkuk';
const HABAKKUK_STAGES = ['cry', 'wait', 'vision', 'run', 'worship'];
const HABAKKUK_STAGE_LABELS = {
    cry: 'CRY OUT',
    wait: 'WAIT',
    vision: 'VISION',
    run: 'RUN',
    worship: 'WORSHIP',
};
const HABAKKUK_STAGE_VERSES = {
    cry: 'Hab 2:1a',
    wait: 'Hab 2:1b',
    vision: 'Hab 2:2a',
    run: 'Hab 2:2b',
    worship: 'Hab 3',
};

function getHabakkukDir() {
    const wtv = join(process.cwd(), HABAKKUK_DIR);
    if (existsSync(wtv)) return wtv;

    const legacy = join(process.cwd(), LEGACY_HABAKKUK_DIR);
    if (existsSync(legacy)) return legacy;

    return wtv;
}

function getHabakkukItemsDir() {
    return join(getHabakkukDir(), 'items');
}

function ensureHabakkukDirs() {
    ensureDir(getHabakkukDir());
    ensureDir(getHabakkukItemsDir());
}

function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 50);
}

function loadHabakkukBoard() {
    const boardPath = join(getHabakkukDir(), 'board.json');
    if (!existsSync(boardPath)) {
        return { nextId: 1, items: {} };
    }
    try {
        return JSON.parse(readFileSync(boardPath, 'utf8'));
    } catch {
        return { nextId: 1, items: {} };
    }
}

function saveHabakkukBoard(board) {
    ensureHabakkukDirs();
    const boardPath = join(getHabakkukDir(), 'board.json');
    writeFileSync(boardPath, JSON.stringify(board, null, 2));
}

function loadHabakkukItem(id) {
    const board = loadHabakkukBoard();
    const itemRef = board.items[id];
    if (!itemRef) return null;

    const itemPath = join(getHabakkukItemsDir(), `${itemRef.file}.json`);
    if (!existsSync(itemPath)) return null;

    try {
        return JSON.parse(readFileSync(itemPath, 'utf8'));
    } catch {
        return null;
    }
}

function saveHabakkukItem(item) {
    ensureHabakkukDirs();
    const itemPath = join(getHabakkukItemsDir(), `${item.id}-${item.slug}.json`);
    writeFileSync(itemPath, JSON.stringify(item, null, 2));
}

function findHabakkukItem(idOrSlug) {
    const board = loadHabakkukBoard();

    // Try direct ID match
    if (board.items[idOrSlug]) {
        return loadHabakkukItem(idOrSlug);
    }

    // Try slug match
    for (const [id, ref] of Object.entries(board.items)) {
        if (ref.slug === idOrSlug || ref.file.includes(idOrSlug)) {
            return loadHabakkukItem(id);
        }
    }

    return null;
}

function createHabakkukItem(title) {
    const board = loadHabakkukBoard();
    const id = String(board.nextId).padStart(3, '0');
    const slug = slugify(title);
    const now = new Date().toISOString();

    const item = {
        id,
        slug,
        title,
        stage: 'cry',
        created: now,
        updated: now,
        history: [
            { stage: 'cry', entered: now }
        ],
        notes: [],
        vision: null,
        execution: null,
        worship: null,
    };

    // Save item
    saveHabakkukItem(item);

    // Update board
    board.nextId++;
    board.items[id] = { slug, file: `${id}-${slug}` };
    saveHabakkukBoard(board);

    return item;
}

function moveHabakkukItem(item, newStage) {
    const currentIdx = HABAKKUK_STAGES.indexOf(item.stage);
    const newIdx = HABAKKUK_STAGES.indexOf(newStage);

    if (newIdx < 0) return null;
    if (newIdx !== currentIdx + 1 && newStage !== 'worship') {
        // Can only move forward one stage (except worship can be reached from run)
        return null;
    }

    const now = new Date().toISOString();
    item.stage = newStage;
    item.updated = now;
    item.history.push({ stage: newStage, entered: now });

    saveHabakkukItem(item);
    return item;
}

function addHabakkukNote(item, note) {
    const now = new Date().toISOString();
    item.notes.push({ date: now, text: note });
    item.updated = now;
    saveHabakkukItem(item);
    return item;
}

function getItemsByStage() {
    const board = loadHabakkukBoard();
    const byStage = {
        cry: [],
        wait: [],
        vision: [],
        run: [],
        worship: [],
    };

    for (const id of Object.keys(board.items)) {
        const item = loadHabakkukItem(id);
        if (item && byStage[item.stage]) {
            byStage[item.stage].push(item);
        }
    }

    return byStage;
}

function formatTimeAgo(isoDate) {
    const now = Date.now();
    const then = new Date(isoDate).getTime();
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
}

// ============================================================================
// HABAKKUK CLI COMMANDS
// ============================================================================

function habakkukBoard(showAll = false) {
    const pad = centerPad();
    const byStage = getItemsByStage();

    console.log('');
    console.log(drawBox([
        `  ${c.bold}THE HABAKKUK BOARD${c.reset}`,
        `  ${c.dim}"Write the vision, make it plain"${c.reset}`,
    ], { style: 'double', color: c.yellow, padding: 0 }));
    console.log('');

    // Calculate column widths
    const colWidth = 14;
    const stages = showAll ? HABAKKUK_STAGES : HABAKKUK_STAGES.filter(s => s !== 'worship' || byStage.worship.length > 0);

    // Header row
    let header = pad;
    for (const stage of stages) {
        const label = HABAKKUK_STAGE_LABELS[stage];
        header += ` ${c.bold}${label.padEnd(colWidth)}${c.reset}`;
    }
    console.log(header);

    // Divider row
    let divider = pad;
    for (const stage of stages) {
        divider += ` ${c.dim}${'─'.repeat(colWidth)}${c.reset}`;
    }
    console.log(divider);

    // Find max items in any column
    const maxItems = Math.max(...stages.map(s => byStage[s].length), 1);

    // Item rows
    for (let i = 0; i < maxItems; i++) {
        let row = pad;
        for (const stage of stages) {
            const item = byStage[stage][i];
            if (item) {
                const shortTitle = item.title.slice(0, colWidth - 4);
                row += ` ${c.cyan}#${item.id}${c.reset} ${shortTitle.padEnd(colWidth - 4)}`;
            } else {
                row += ' '.repeat(colWidth + 1);
            }
        }
        console.log(row);

        // Time ago row
        row = pad;
        for (const stage of stages) {
            const item = byStage[stage][i];
            if (item) {
                const ago = formatTimeAgo(item.updated);
                row += ` ${c.dim}${ago.padEnd(colWidth)}${c.reset}`;
            } else {
                row += ' '.repeat(colWidth + 1);
            }
        }
        console.log(row);
        console.log('');
    }

    // Empty state
    const totalItems = Object.values(byStage).flat().length;
    if (totalItems === 0) {
        console.log(`${pad}${c.dim}No items yet. Start with:${c.reset}`);
        console.log(`${pad}  ${c.green}wtv cry "Your burden or need"${c.reset}`);
        console.log('');
    }

    // Scripture
    console.log(`${pad}${c.dim}"I will stand upon my watch... and will watch to see${c.reset}`);
    console.log(`${pad}${c.dim} what he will say unto me" — Habakkuk 2:1${c.reset}`);
    console.log('');
}

function habakkukCry(title) {
    const pad = centerPad();

    if (!title) {
        console.log(`\n${pad}${c.red}${sym.cross}${c.reset} Please provide a description of your burden.`);
        console.log(`${pad}${c.dim}Usage: wtv cry "Description of need"${c.reset}\n`);
        return;
    }

    const item = createHabakkukItem(title);

    console.log('');
    console.log(`${pad}${c.yellow}${sym.bullet}${c.reset} ${c.bold}CRY OUT${c.reset} — Item created`);
    console.log(`${pad}  ${c.cyan}#${item.id}${c.reset} ${item.title}`);
    console.log('');
    console.log(`${pad}${c.dim}"I will stand upon my watch" — Hab 2:1a${c.reset}`);
    console.log('');
    console.log(`${pad}Next: When ready to seek, run:`);
    console.log(`${pad}  ${c.green}wtv wait ${item.id}${c.reset}`);
    console.log('');
}

function habakkukWait(idOrSlug, note) {
    const pad = centerPad();
    const item = findHabakkukItem(idOrSlug);

    if (!item) {
        console.log(`\n${pad}${c.red}${sym.cross}${c.reset} Item not found: ${idOrSlug}\n`);
        return;
    }

    // If just adding a note
    if (note && item.stage === 'wait') {
        addHabakkukNote(item, note);
        console.log(`\n${pad}${c.green}${sym.check}${c.reset} Note added to #${item.id}\n`);
        return;
    }

    // Move from cry to wait
    if (item.stage !== 'cry') {
        console.log(`\n${pad}${c.yellow}${sym.warn}${c.reset} Item #${item.id} is already in ${HABAKKUK_STAGE_LABELS[item.stage]}\n`);
        return;
    }

    moveHabakkukItem(item, 'wait');

    console.log('');
    console.log(`${pad}${c.blue}${sym.bullet}${c.reset} ${c.bold}WAIT${c.reset} — Moved to watchtower`);
    console.log(`${pad}  ${c.cyan}#${item.id}${c.reset} ${item.title}`);
    console.log('');
    console.log(`${pad}${c.dim}"...and will watch to see what he will say unto me" — Hab 2:1b${c.reset}`);
    console.log('');
    console.log(`${pad}Add notes while waiting:`);
    console.log(`${pad}  ${c.green}wtv note ${item.id} "Insight received"${c.reset}`);
    console.log('');
    console.log(`${pad}When the vision comes:`);
    console.log(`${pad}  ${c.green}wtv vision ${item.id}${c.reset}`);
    console.log('');
}

function habakkukVision(idOrSlug) {
    const pad = centerPad();
    const item = findHabakkukItem(idOrSlug);

    if (!item) {
        console.log(`\n${pad}${c.red}${sym.cross}${c.reset} Item not found: ${idOrSlug}\n`);
        return;
    }

    if (item.stage !== 'wait') {
        console.log(`\n${pad}${c.yellow}${sym.warn}${c.reset} Item must be in WAIT stage to receive vision.`);
        console.log(`${pad}${c.dim}Current stage: ${HABAKKUK_STAGE_LABELS[item.stage]}${c.reset}\n`);
        return;
    }

    moveHabakkukItem(item, 'vision');

    // Create vision directory and template
    const visionDir = join(getHabakkukItemsDir(), `${item.id}-${item.slug}`);
    ensureDir(visionDir);

    const visionPath = join(visionDir, 'VISION.md');
    if (!existsSync(visionPath)) {
        const visionTemplate = `# Vision: ${item.title}

> Received: ${new Date().toISOString().split('T')[0]}

## The Answer

[What solution or approach has become clear?]

## The Plan

1. [First step]
2. [Second step]
3. [Third step]

## Success Criteria

- [What will be true when complete?]

## Constraints

- [Any limitations or boundaries?]
`;
        writeFileSync(visionPath, visionTemplate);
    }

    console.log('');
    console.log(`${pad}${c.magenta}${sym.bullet}${c.reset} ${c.bold}VISION${c.reset} — Answer received`);
    console.log(`${pad}  ${c.cyan}#${item.id}${c.reset} ${item.title}`);
    console.log('');
    console.log(`${pad}${c.dim}"Write the vision, and make it plain upon tables" — Hab 2:2a${c.reset}`);
    console.log('');
    console.log(`${pad}Vision document created at:`);
    console.log(`${pad}  ${c.dim}${visionPath}${c.reset}`);
    console.log('');
    console.log(`${pad}Edit the vision, then run:`);
    console.log(`${pad}  ${c.green}wtv run ${item.id}${c.reset}`);
    console.log('');
}

function habakkukRun(idOrSlug) {
    const pad = centerPad();
    const item = findHabakkukItem(idOrSlug);

    if (!item) {
        console.log(`\n${pad}${c.red}${sym.cross}${c.reset} Item not found: ${idOrSlug}\n`);
        return;
    }

    if (item.stage !== 'vision') {
        console.log(`\n${pad}${c.yellow}${sym.warn}${c.reset} Item must be in VISION stage to run.`);
        console.log(`${pad}${c.dim}Current stage: ${HABAKKUK_STAGE_LABELS[item.stage]}${c.reset}\n`);
        return;
    }

    moveHabakkukItem(item, 'run');

    console.log('');
    console.log(`${pad}${c.green}${sym.bullet}${c.reset} ${c.bold}RUN${c.reset} — Execution started`);
    console.log(`${pad}  ${c.cyan}#${item.id}${c.reset} ${item.title}`);
    console.log('');
    console.log(`${pad}${c.dim}"...that he may run that readeth it" — Hab 2:2b${c.reset}`);
    console.log('');
    console.log(`${pad}Inside your AI CLI, invoke Paul (the Masterbuilder):`);
    console.log(`${pad}  ${c.cyan}/wtv "${item.title}"${c.reset}`);
    console.log('');
    console.log(`${pad}When complete:`);
    console.log(`${pad}  ${c.green}wtv worship ${item.id}${c.reset}`);
    console.log('');
}

async function habakkukWorship(idOrSlug) {
    const pad = centerPad();
    const item = findHabakkukItem(idOrSlug);

    if (!item) {
        console.log(`\n${pad}${c.red}${sym.cross}${c.reset} Item not found: ${idOrSlug}\n`);
        return;
    }

    if (item.stage !== 'run') {
        console.log(`\n${pad}${c.yellow}${sym.warn}${c.reset} Item must be in RUN stage to complete.`);
        console.log(`${pad}${c.dim}Current stage: ${HABAKKUK_STAGE_LABELS[item.stage]}${c.reset}\n`);
        return;
    }

    // Create worship document
    const worshipDir = join(getHabakkukItemsDir(), `${item.id}-${item.slug}`);
    ensureDir(worshipDir);

    const worshipPath = join(worshipDir, 'WORSHIP.md');
    if (!existsSync(worshipPath)) {
        const worshipTemplate = `# Worship: ${item.title}

> Completed: ${new Date().toISOString().split('T')[0]}

## What Was Accomplished

- [List what was built/fixed/created]

## What Was Learned

- [Insights gained during this work]

## Evidence of Faithfulness

- [How did God provide during this work?]

## Gratitude

Thank you Lord for:
- [What are you thankful for?]

## Stones of Remembrance

[What should be remembered about this work?]
`;
        writeFileSync(worshipPath, worshipTemplate);
    }

    moveHabakkukItem(item, 'worship');

    console.log('');
    console.log(`${pad}${c.yellow}★${c.reset} ${c.bold}WORSHIP${c.reset} — Complete!`);
    console.log(`${pad}  ${c.cyan}#${item.id}${c.reset} ${item.title}`);
    console.log('');
    console.log(`${pad}${c.dim}"Yet I will rejoice in the LORD, I will joy in the${c.reset}`);
    console.log(`${pad}${c.dim} God of my salvation." — Habakkuk 3:18${c.reset}`);
    console.log('');
    console.log(`${pad}Retrospective document created at:`);
    console.log(`${pad}  ${c.dim}${worshipPath}${c.reset}`);
    console.log('');
    console.log(`${pad}Edit to capture what God has done.`);
    console.log('');
}

function habakkukNote(idOrSlug, note) {
    const pad = centerPad();
    const item = findHabakkukItem(idOrSlug);

    if (!item) {
        console.log(`\n${pad}${c.red}${sym.cross}${c.reset} Item not found: ${idOrSlug}\n`);
        return;
    }

    if (!note) {
        // Show existing notes
        console.log('');
        console.log(`${pad}${c.bold}Notes for #${item.id}${c.reset} ${item.title}`);
        console.log('');
        if (item.notes.length === 0) {
            console.log(`${pad}${c.dim}No notes yet.${c.reset}`);
        } else {
            for (const n of item.notes) {
                const date = new Date(n.date).toLocaleDateString();
                console.log(`${pad}  ${c.dim}${date}${c.reset} ${n.text}`);
            }
        }
        console.log('');
        return;
    }

    addHabakkukNote(item, note);
    console.log(`\n${pad}${c.green}${sym.check}${c.reset} Note added to #${item.id}\n`);
}

function habakkukItem(idOrSlug) {
    const pad = centerPad();
    const item = findHabakkukItem(idOrSlug);

    if (!item) {
        console.log(`\n${pad}${c.red}${sym.cross}${c.reset} Item not found: ${idOrSlug}\n`);
        return;
    }

    const stageLabel = HABAKKUK_STAGE_LABELS[item.stage];
    const stageVerse = HABAKKUK_STAGE_VERSES[item.stage];

    console.log('');
    console.log(drawBox([
        `  ${c.cyan}#${item.id}${c.reset} ${c.bold}${item.title}${c.reset}`,
        `  ${c.dim}Stage: ${stageLabel} (${stageVerse})${c.reset}`,
    ], { style: 'round', color: c.cyan, padding: 0 }));
    console.log('');

    console.log(`${pad}${c.bold}Timeline${c.reset}`);
    for (const h of item.history) {
        const date = new Date(h.entered).toLocaleDateString();
        const label = HABAKKUK_STAGE_LABELS[h.stage];
        console.log(`${pad}  ${c.dim}${date}${c.reset} → ${label}`);
    }
    console.log('');

    if (item.notes.length > 0) {
        console.log(`${pad}${c.bold}Notes${c.reset}`);
        for (const n of item.notes.slice(-3)) {
            const date = new Date(n.date).toLocaleDateString();
            console.log(`${pad}  ${c.dim}${date}${c.reset} ${n.text}`);
        }
        if (item.notes.length > 3) {
            console.log(`${pad}  ${c.dim}...and ${item.notes.length - 3} more${c.reset}`);
        }
        console.log('');
    }

    // Show next action based on stage
    const nextActions = {
        cry: `wtv wait ${item.id}`,
        wait: `wtv vision ${item.id}`,
        vision: `wtv run ${item.id}`,
        run: `wtv worship ${item.id}`,
        worship: null,
    };

    if (nextActions[item.stage]) {
        console.log(`${pad}${c.dim}Next:${c.reset} ${c.green}${nextActions[item.stage]}${c.reset}`);
        console.log('');
    }
}

function habakkukStones() {
    const pad = centerPad();
    const byStage = getItemsByStage();
    const completed = byStage.worship;

    console.log('');
    console.log(drawBox([
        `  ${c.bold}STONES OF REMEMBRANCE${c.reset}`,
        `  ${c.dim}Evidence of God's faithfulness${c.reset}`,
    ], { style: 'round', color: c.yellow, padding: 0 }));
    console.log('');

    if (completed.length === 0) {
        console.log(`${pad}${c.dim}No completed items yet.${c.reset}`);
        console.log(`${pad}${c.dim}As you complete work through the Habakkuk workflow,${c.reset}`);
        console.log(`${pad}${c.dim}your stones of remembrance will appear here.${c.reset}`);
    } else {
        for (const item of completed) {
            const completed = item.history.find(h => h.stage === 'worship');
            const date = completed ? new Date(completed.entered).toLocaleDateString() : '';
            console.log(`${pad}${c.yellow}★${c.reset} ${c.cyan}#${item.id}${c.reset} ${item.title} ${c.dim}(${date})${c.reset}`);
        }
    }
    console.log('');
}

async function checkForUpdates() {
    const shouldCheck = process.env.WTV_NO_UPDATE_CHECK !== '1' && process.env.CODEHOGG_NO_UPDATE_CHECK !== '1';
    if (!shouldCheck) return;
    if (!process.stdout.isTTY) return;

    try {
        const packageName = getPackageName();
        const notifier = updateNotifier({
            pkg: {
                name: packageName,
                version: getVersion(),
            },
            updateCheckInterval: 1000 * 60 * 60 * 24 * 7,
            shouldNotifyInNpmScript: false,
        });

        const update = notifier.update;
        if (!update) return;

        const npmGlobalCmd = `npm install -g ${packageName}@latest`;
        const npxCmd = `npx -y ${packageName}@latest`;

        notifier.notify({
            message: `Update available ${c.dim}${update.current}${c.reset} → ${c.green}${update.latest}${c.reset}

Update global install:
  ${c.cyan}${npmGlobalCmd}${c.reset}

Or run latest once:
  ${c.cyan}${npxCmd}${c.reset}
`,
            defer: false,
            boxenOpts: {
                padding: 1,
                margin: 1,
                align: 'left',
                borderColor: 'yellow',
                borderStyle: 'round',
            },
        });

        const shouldPrompt = process.stdin.isTTY && process.env.WTV_NO_AUTO_UPDATE !== '1' && !process.env.CI;
        if (!shouldPrompt) return;

        const isDevCheckout = existsSync(join(PACKAGE_ROOT, '.git'));
        if (isDevCheckout) return;

        const wantsUpdate = await confirm(`Update ${packageName} to v${update.latest} now?`, false);
        if (!wantsUpdate) return;

        const argv1 = process.argv[1] || '';
        const userAgent = process.env.npm_config_user_agent || '';
        const runningViaNpx = argv1.includes('_npx') || userAgent.includes('npx/');

        if (runningViaNpx) {
            console.log(`
  ${c.yellow}${sym.warn}${c.reset} You're running via npx cache.`);
            console.log(`  Next run: ${c.cyan}${npxCmd}${c.reset}
`);
            return;
        }

        const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm';
        const result = spawnSync(npmBin, ['install', '-g', `${packageName}@latest`], { stdio: 'inherit' });

        if (result.status !== 0) {
            console.log(`
  ${c.red}${sym.cross}${c.reset} Update failed.`);
            console.log(`  Try manually: ${c.cyan}${npmGlobalCmd}${c.reset}
`);
            return;
        }

        console.log(`
  ${c.green}${sym.check}${c.reset} Updated ${packageName} to ${update.latest}.`);
        console.log(`  Re-run ${c.cyan}wtv${c.reset} to use the new version.
`);
        process.exit(0);
    } catch {
    }
}

function getHomedir() {
    try {
        const home = homedir();
        if (!home || home === '') return null;
        return home;
    } catch {
        return null;
    }
}

function validatePath(dirPath) {
    try {
        const parentDir = dirname(dirPath);
        ensureDir(parentDir);
        accessSync(parentDir, constants.W_OK);
        return { valid: true };
    } catch (err) {
        return { valid: false, error: `Cannot access directory: ${err.message}` };
    }
}

function copyDir(src, dest) {
    if (!existsSync(dest)) {
        mkdirSync(dest, { recursive: true });
    }

    const entries = readdirSync(src);
    let copied = 0;

    for (const entry of entries) {
        const srcPath = join(src, entry);
        const destPath = join(dest, entry);
        const stat = statSync(srcPath);

        if (stat.isDirectory()) {
            copied += copyDir(srcPath, destPath);
        } else {
            copyFileSync(srcPath, destPath);
            copied++;
        }
    }

    return copied;
}

// ============================================================================
// WTV SECTION MARKERS (for safe append/remove in tool config files)
// ============================================================================

const WTV_SECTION_START = '<!-- WTV:START -->';
const WTV_SECTION_END = '<!-- WTV:END -->';

const WTV_SECTION_CONTENT = `${WTV_SECTION_START}
## Vision-Driven Development

This project uses WTV for vision-driven AI development.

### Vision Context
- Read \`VISION.md\` from project root for core project vision
- Read all markdown files in \`vision/\` directory for additional context (roadmap, values, ideas)
- If no vision exists, suggest running \`wtv init\` to create one

### Agent System
- Expert agents are defined in the tool's agents directory
- Read \`AGENTS.md\` for agent coordination rules
${WTV_SECTION_END}`;

function appendWtvSection(filePath) {
    let content = '';
    if (existsSync(filePath)) {
        content = readFileSync(filePath, 'utf8');
        // Already has WTV section? Skip.
        if (content.includes(WTV_SECTION_START)) {
            return false;
        }
    }

    // Append with newlines
    const newContent = content.trimEnd() + '\n\n' + WTV_SECTION_CONTENT + '\n';
    writeFileSync(filePath, newContent);
    return true;
}

function removeWtvSection(filePath) {
    if (!existsSync(filePath)) return false;

    let content = readFileSync(filePath, 'utf8');
    if (!content.includes(WTV_SECTION_START)) {
        return false;
    }

    // Remove WTV section using regex
    const startEscaped = WTV_SECTION_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const endEscaped = WTV_SECTION_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\n*${startEscaped}[\\s\\S]*?${endEscaped}\n*`, 'g');
    const newContent = content.replace(regex, '\n');
    writeFileSync(filePath, newContent.trimEnd() + '\n');
    return true;
}

function countFiles(dir) {
    if (!existsSync(dir)) return 0;
    let count = 0;
    for (const entry of readdirSync(dir)) {
        const p = join(dir, entry);
        const stat = statSync(p);
        count += stat.isDirectory() ? countFiles(p) : 1;
    }
    return count;
}

function countDirs(dir) {
    if (!existsSync(dir)) return 0;
    return readdirSync(dir).filter(e => statSync(join(dir, e)).isDirectory()).length;
}

function countFilesFlat(dir, ext = null) {
    if (!existsSync(dir)) return 0;
    return readdirSync(dir)
        .filter(e => {
            const p = join(dir, e);
            if (!statSync(p).isFile()) return false;
            return ext ? e.endsWith(ext) : true;
        }).length;
}

function prompt(question) {
    return new Promise((resolve) => {
        const rl = createInterface({ input: process.stdin, output: process.stdout });
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

async function select(question, options) {
    console.log(`\n  ${c.bold}${question}${c.reset} \n`);
    options.forEach((opt, i) => {
        console.log(`    ${c.cyan}${i + 1}${c.reset}) ${opt.label} `);
        if (opt.desc) console.log(`       ${c.dim}${opt.desc}${c.reset} `);
    });

    const answer = await prompt(`\n  Enter choice(1 - ${options.length}): `);
    const idx = parseInt(answer, 10) - 1;

    if (idx >= 0 && idx < options.length) {
        return options[idx].value;
    }
    return options[0].value;
}

async function confirm(question, defaultYes = true) {
    const hint = defaultYes ? 'Y/n' : 'y/N';
    const answer = await prompt(`  ${question} (${hint}): `);

    if (answer === '') return defaultYes;
    return answer.toLowerCase().startsWith('y');
}

function printBanner() {
    const version = getVersion();
    console.log('');
    console.log(drawBox([
        `  ${c.bold}${c.magenta}wtv${c.reset} ${c.dim}v${version}${c.reset} `,
        `  ${c.dim} 10 agents ${sym.bullet} 21 skills${c.reset} `,
        `  ${c.dim} Claude • Codex • OpenCode • Gemini • Antigravity${c.reset} `,
    ], { style: 'round', color: c.magenta, padding: 0 }));
    console.log('');
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ASCII Art Avatars for the team
const AVATARS = {
    paul: `
       ${c.yellow}___________${c.reset}
      ${c.yellow}/           \\${c.reset}
     ${c.yellow}| ${c.bold}◈     ◈${c.reset}${c.yellow}  | ${c.reset}
     ${c.yellow}| ${c.bold}▽${c.reset}${c.yellow}     | ${c.reset}
     ${c.yellow}| ${c.bold}═════${c.reset}${c.yellow}   | ${c.reset}
      ${c.yellow} \\  ${c.dim}PLAN${c.reset}${c.yellow}  /${c.reset}
       ${c.yellow}╔═══════╗${c.reset}
       ${c.yellow}║${c.dim}VISION${c.reset}${c.yellow}║${c.reset}
       ${c.yellow}╚═══════╝${c.reset} `,

    nehemiah: `
       ${c.red}╔═══════╗${c.reset}
       ${c.red}║${c.bold}  ◉ ◉  ${c.reset}${c.red}║${c.reset}
       ${c.red}║   ${c.bold}▼${c.reset}${c.red}   ║${c.reset}
      ${c.red}╔╩═══════╩╗${c.reset}
      ${c.red}║ ${c.bold}◇ ▣ ◇${c.reset}${c.red} ║${c.reset}
      ${c.red}║ ${c.bold}◇ ◇ ◇${c.reset}${c.red} ║${c.reset}
      ${c.red}╚════╦════╝${c.reset}
           ${c.red}║${c.reset}
       ${c.dim} [SHIELD]${c.reset} `,

    bezaleel: `
          ${c.blue}△${c.reset}
         ${c.blue}╱ ╲${c.reset}
        ${c.blue}╱${c.bold}◈ ◈${c.reset}${c.blue}╲${c.reset}
       ${c.blue}╱  ${c.bold}▽${c.reset}${c.blue}  ╲${c.reset}
      ${c.blue}╱═══════╲${c.reset}
     ${c.blue}║ ║   ║ ║${c.reset}
     ${c.blue}║ ║   ║ ║${c.reset}
     ${c.blue}╩═╩═══╩═╩${c.reset}
     ${c.dim} [PILLARS]${c.reset} `,

    hiram: `
      ${c.green}┌─────────┐${c.reset}
      ${c.green}│${c.bold}◉${c.reset}${c.green}──┬──${c.bold}◉${c.reset}${c.green}│${c.reset}
      ${c.green}│  ${c.bold}│${c.reset}${c.green}  │${c.reset}
      ${c.green}├──${c.bold}◇${c.reset}${c.green}──┤${c.reset}
      ${c.green}│  ${c.bold}│${c.reset}${c.green}  │${c.reset}
      ${c.green}│  ${c.bold}▼${c.reset}${c.green}  │${c.reset}
      ${c.green}└──${c.bold}◎${c.reset}${c.green}──┘${c.reset}
      ${c.dim} [SERVER]${c.reset} `,

    aholiab: `
      ${c.magenta}╭─────────╮${c.reset}
      ${c.magenta}│ ${c.bold}◐   ◑${c.reset}${c.magenta} │${c.reset}
      ${c.magenta}│   ${c.bold}◡${c.reset}${c.magenta}   │${c.reset}
      ${c.magenta}├─────────┤${c.reset}
      ${c.magenta}│ ${c.bold}▪ ▪ ▪${c.reset}${c.magenta} │${c.reset}
      ${c.magenta}│ ${c.bold}█████${c.reset}${c.magenta} │${c.reset}
      ${c.magenta}╰─────────╯${c.reset}
       ${c.dim} [SCREEN]${c.reset} `,

    solomon: `
        ${c.cyan}╭───────╮${c.reset}
       ${c.cyan}╱ ${c.bold}◉   ◉${c.reset}${c.cyan} ╲${c.reset}
      ${c.cyan}│    ${c.bold}○${c.reset}${c.cyan}    │${c.reset}
      ${c.cyan}├─────────┤${c.reset}
      ${c.cyan}│${c.bold}═════════${c.reset}${c.cyan}│${c.reset}
      ${c.cyan}│${c.bold}═════════${c.reset}${c.cyan}│${c.reset}
      ${c.cyan}│${c.bold}═════════${c.reset}${c.cyan}│${c.reset}
       ${c.cyan}╲───────╱${c.reset}
        ${c.dim} [DATA]${c.reset} `,

    zerubbabel: `
        ${c.yellow}◎${c.reset}
       ${c.yellow}╱│╲${c.reset}
      ${c.yellow}╱ ${c.bold}◉ ◉${c.reset}${c.yellow} ╲${c.reset}
     ${c.yellow}◁──${c.bold}◡${c.reset}${c.yellow}──▷${c.reset}
      ${c.yellow}╲     ╱${c.reset}
       ${c.yellow}◎═══◎${c.reset}
      ${c.yellow}╱     ╲${c.reset}
     ${c.yellow}◎       ◎${c.reset}
     ${c.dim} [PIPELINE]${c.reset} `,

    ezra: `
         ${c.blue}○${c.reset}
        ${c.blue}╱ ╲${c.reset}
       ${c.blue} (${c.bold}◉ ◉${c.reset}${c.blue})${c.reset}
       ${c.blue}│ ${c.bold}⌓${c.reset}${c.blue} │${c.reset}
      ${c.blue}╭┴───┴╮${c.reset}
     ${c.blue} (${c.bold}◎${c.reset}${c.blue}   )${c.reset}
      ${c.blue}╲  ${c.bold}│${c.reset}${c.blue}  ╱${c.reset}
       ${c.blue}╰───╯${c.reset}
       ${c.dim} [LENS]${c.reset} `,

    moses: `
         ${c.green}★${c.reset}
        ${c.green}╱ ╲${c.reset}
       ${c.green}╱${c.bold}◉   ◉${c.reset}${c.green}╲${c.reset}
      ${c.green}│   ${c.bold}◡${c.reset}${c.green}   │${c.reset}
      ${c.green}├───────┤${c.reset}
      ${c.green}│ ${c.bold}☰ ☰${c.reset}${c.green} │${c.reset}
      ${c.green}│ ${c.bold}☰ ☰${c.reset}${c.green} │${c.reset}
      ${c.green}╰───────╯${c.reset}
       ${c.dim} [SCROLL]${c.reset} `,

    david: `
       ${c.magenta}╭─────────╮${c.reset}
       ${c.magenta}│ ${c.bold}♪   ♫${c.reset}${c.magenta} │${c.reset}
       ${c.magenta}│   ${c.bold}╲│╱${c.reset}${c.magenta}  │${c.reset}
       ${c.magenta}│   ${c.bold}╱╲${c.reset}${c.magenta}  │${c.reset}
       ${c.magenta}│  ${c.bold}✎${c.reset}${c.magenta}    │${c.reset}
       ${c.magenta}╰─────────╯${c.reset}
       ${c.dim} [HARP]${c.reset} `,
};

const ARTISAN_DEFS = [
    {
        id: 'nehemiah',
        name: 'Nehemiah',
        file: 'nehemiah.md',
        color: c.red,
        domain: 'Security — build + guard (trust, secrets, compliance)',
        voice: 'Builders work; watchers watch. I fortify your wall as you build it.',
        verse: {
            ref: 'Ne 4:17',
            text: 'They which builded on the wall, and they that bare burdens, with those that laded, [every one] with one of his hands wrought in the work, and with the other [hand] held a weapon.',
        },
    },
    {
        id: 'bezaleel',
        name: 'Bezaleel',
        file: 'bezaleel.md',
        color: c.blue,
        domain: 'Architecture — craft, structure, and seams',
        voice: 'Craft matters. I design the joinery so the work can endure.',
        verse: {
            ref: 'Ex 31:3',
            text: 'And I have filled him with the spirit of God, in wisdom, and in understanding, and in knowledge, and in all manner of workmanship,',
        },
    },
    {
        id: 'hiram',
        name: 'Hiram',
        file: 'hiram.md',
        color: c.green,
        domain: 'Backend — services, workflows, and integrations',
        voice: 'Strong internals beat clever shortcuts. I forge durable systems.',
        verse: {
            ref: '1Ki 7:14',
            text: 'He [was] a widow’s son of the tribe of Naphtali, and his father [was] a man of Tyre, a worker in brass: and he was filled with wisdom, and understanding, and cunning to work all works in brass. And he came to king Solomon, and wrought all his work.',
        },
    },
    {
        id: 'aholiab',
        name: 'Aholiab',
        file: 'aholiab.md',
        color: c.magenta,
        domain: 'Frontend — make it plain upon tables (UX, clarity)',
        voice: 'I engrave clarity. What users see should be simple and sure.',
        verse: {
            ref: 'Ex 38:23',
            text: 'And with him [was] Aholiab, son of Ahisamach, of the tribe of Dan, an engraver, and a cunning workman, and an embroiderer in blue, and in purple, and in scarlet, and fine linen.',
        },
    },
    {
        id: 'solomon',
        name: 'Solomon',
        file: 'solomon.md',
        color: c.cyan,
        domain: 'Data — integrity, queries, and migrations',
        voice: 'Wisdom first. Data must remain true as the work grows.',
        verse: {
            ref: '1Ki 4:29',
            text: 'And God gave Solomon wisdom and understanding exceeding much, and largeness of heart, even as the sand that [is] on the sea shore.',
        },
    },
    {
        id: 'zerubbabel',
        name: 'Zerubbabel',
        file: 'zerubbabel.md',
        color: c.yellow,
        domain: 'DevOps — releases, installs, and shipping discipline',
        voice: 'The foundation must finish. I make shipping reliable and repeatable.',
        verse: {
            ref: 'Zec 4:9',
            text: 'The hands of Zerubbabel have laid the foundation of this house; his hands shall also finish it; and thou shalt know that the LORD of hosts hath sent me unto you.',
        },
    },
    {
        id: 'ezra',
        name: 'Ezra',
        file: 'ezra.md',
        color: c.blue,
        domain: 'QA — verification, tests, and truth-checking',
        voice: 'Trust, but verify. I compare what we claim against what we shipped.',
        verse: {
            ref: 'Ezr 7:10',
            text: 'For Ezra had prepared his heart to seek the law of the LORD, and to do [it], and to teach in Israel statutes and judgments.',
        },
    },
    {
        id: 'moses',
        name: 'Moses',
        file: 'moses.md',
        color: c.green,
        domain: 'Product — requirements, scope, and the pattern',
        voice: 'Name the thing. Define the edges. Build to the pattern.',
        verse: {
            ref: 'Heb 8:5',
            text: 'Who serve unto the example and shadow of heavenly things, as Moses was admonished of God when he was about to make the tabernacle: for, See, saith he, [that] thou make all things according to the pattern shewed to thee in the mount.',
        },
    },
    {
        id: 'david',
        name: 'David',
        file: 'david.md',
        color: c.magenta,
        domain: 'Voice — copy, tone, worship, and remembrance',
        voice: 'Cut the slop. Keep the song. Words should carry weight.',
        verse: {
            ref: 'Ps 45:1',
            text: '...my tongue [is] the pen of a ready writer.',
        },
    },
];

async function selectArtisans() {
    console.log(`\n  ${c.bold}Select Your Artisans${c.reset} `);
    console.log(`  ${c.dim}These artisans will counsel Paul and execute tasks.${c.reset} `);
    console.log(`  ${c.dim}Enter numbers separated by spaces, or press Enter for all.${c.reset}\n`);

    ARTISAN_DEFS.forEach((a, i) => {
        console.log(`    ${a.color}${i + 1}${c.reset}) ${a.color}${c.bold}${a.name}${c.reset} `);
        console.log(`       ${c.dim}${a.domain}${c.reset} `);
    });

    const answer = await prompt(`\n  Select(1 - ${ARTISAN_DEFS.length}, space - separated)[${c.dim}all${c.reset}]: `);

    if (!answer.trim()) {
        return ARTISAN_DEFS.map(a => a.id);
    }

    const nums = answer
        .split(/[\s,]+/)
        .map(n => parseInt(n.trim(), 10))
        .filter(n => n >= 1 && n <= ARTISAN_DEFS.length);
    if (nums.length === 0) {
        return ARTISAN_DEFS.map(a => a.id);
    }

    return nums.map(n => ARTISAN_DEFS[n - 1].id);
}

async function meetTheTeam() {
    const fast = !process.stdout.isTTY;
    const pause = fast ? 0 : 800;
    const shortPause = fast ? 0 : 400;

    console.log(`
  ${c.bold}${c.magenta}═══════════════════════════════════════════════════════════════${c.reset}
  ${c.bold}                     MEET YOUR TEAM${c.reset}
  ${c.magenta}═══════════════════════════════════════════════════════════════${c.reset}
    `);

    await sleep(pause);

    // The Vision
    console.log(`  ${c.dim} "And the LORD answered me, and said,${c.reset}`);
    console.log(`  ${c.dim} Write the vision, and make [it] plain upon tables,${c.reset}`);
    console.log(`  ${c.dim} that he may run that readeth it."${c.reset}`);
    console.log(`  ${c.dim}                                    — Habakkuk 2:2 (KJV PCE)${c.reset}`);
    console.log('');

    await sleep(pause);

    // The Masterbuilder
    console.log(`  ${c.bold}${c.yellow}PAUL — THE MASTERBUILDER${c.reset}`);
    console.log(`  ${c.dim}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}`);
    const paulAgent = parseAgentFile(join(TEMPLATES_DIR, 'agents', 'paul.md'));
    console.log(AVATARS.paul || (paulAgent && paulAgent.asciiArt ? paulAgent.asciiArt : ''));
    await sleep(shortPause);
    console.log(`
  ${c.cyan}"According to the grace of God which is given unto me,${c.reset}
  ${c.cyan} as a wise masterbuilder, I have laid the foundation,${c.reset}
  ${c.cyan} and another buildeth thereon."${c.reset}
  ${c.dim}                                    — 1 Corinthians 3:10 (KJV PCE)${c.reset}

  I am ${c.bold}Paul${c.reset}, the masterbuilder. I read your ${c.bold}VISION.md${c.reset}, consult the artisans,
  synthesize counsel into a plan, and present it for your approval.
  Only then do I delegate. I verify. I integrate. I report.
`);

    await sleep(pause);

    // The Artisans intro
    console.log(`  ${c.bold}${c.green}THE ARTISANS${c.reset}`);
    console.log(`  ${c.dim}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}`);
    console.log(`
  ${c.dim}"Where no counsel [is], the people fall:${c.reset}
  ${c.dim} but in the multitude of counsellers [there is] safety."${c.reset}
  ${c.dim}                                    — Proverbs 11:14 (KJV PCE)${c.reset}
`);

    await sleep(pause);

    for (const artisan of ARTISAN_DEFS) {
        console.log(`  ${artisan.color}${c.bold}${artisan.name}${c.reset}`);
        const templatePath = join(TEMPLATES_DIR, 'agents', artisan.file);
        const agent = parseAgentFile(templatePath);
        console.log(AVATARS[artisan.id] || (agent && agent.asciiArt ? agent.asciiArt : ''));
        console.log(`  ${c.dim}${artisan.domain}${c.reset}`);
        if (artisan.verse) {
            console.log(`  ${c.dim}${artisan.verse.ref}${c.reset} ${c.dim}"${artisan.verse.text}"${c.reset}`);
        }
        console.log(`  ${c.dim}"${artisan.voice}"${c.reset}`);
        console.log('');
        await sleep(shortPause);
    }

    await sleep(pause);

    // The Workflow
    console.log(`  ${c.bold}${c.magenta}THE WORKFLOW${c.reset}`);
    console.log(`  ${c.dim}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}`);
    console.log(`
                        ┌─────────────┐
                        │  VISION.md  │
                        │ ${c.dim}Your intent${c.reset} │
                        └──────┬──────┘
                               │
                        ┌──────▼──────┐
                        │ MASTERBUILDER│
                        │ ${c.dim}Orchestrates${c.reset} │
                        └──────┬──────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
    ┌─────▼─────┐        ┌─────▼─────┐        ┌─────▼─────┐
    │  ARTISAN  │        │  ARTISAN  │        │  ARTISAN  │
    │ ${c.dim}Counsel +${c.reset} │   ...   │ ${c.dim}Counsel +${c.reset} │   ...   │ ${c.dim}Counsel +${c.reset} │
    │ ${c.dim}Execute${c.reset}   │        │ ${c.dim}Execute${c.reset}   │        │ ${c.dim}Execute${c.reset}   │
    └───────────┘        └───────────┘        └───────────┘
`);

    await sleep(pause);

    // Call to action
    console.log(`  ${c.bold}${c.green}READY TO BUILD${c.reset}`);
    console.log(`  ${c.dim}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}`);
    console.log(`
  Your team is installed and ready. Here's how to work with them:

    ${c.cyan}/wtv${c.reset}                    Strategic review against your VISION.md
    ${c.cyan}/wtv "your mission"${c.reset}     Tactical mission with artisan counsel

  First, define your vision:

    ${c.cyan}npx writethevision init${c.reset}            Creates VISION.md in your project

  ${c.dim}"But let every man take heed how he buildeth thereupon."${c.reset}
  ${c.dim}                                    — 1 Corinthians 3:10 (KJV PCE)${c.reset}

  ${c.bold}${c.magenta}═══════════════════════════════════════════════════════════════${c.reset}
`);
}

function yamlQuote(value) {
    const v = String(value ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    return `"${v}"`;
}

function normalizeTools(tools) {
    const normalized = [];

    for (const raw of tools) {
        if (!raw) continue;
        const t = String(raw).toLowerCase();
        const mapped = t === 'claude-code' ? 'claude'
            : t === 'codex-cli' ? 'codex'
                : t;

        if (!TOOL_IDS.includes(mapped)) {
            console.error(`\n  ${c.red}Error:${c.reset} Unknown tool '${raw}'.`);
            console.log(`  Valid tools: ${TOOL_IDS.join(', ')}\n`);
            process.exit(1);
        }

        if (!normalized.includes(mapped)) normalized.push(mapped);
    }

    return normalized;
}

function getRootDirForTool(tool, scope, customPath = null) {
    if (customPath) {
        let p = customPath;
        if (p.startsWith('~')) {
            const home = getHomedir();
            if (home) p = p.replace('~', home);
        }
        return resolve(p);
    }

    const home = getHomedir();
    if (!home && scope === 'global') return null;

    switch (tool) {
        case 'claude':
            return scope === 'global' ? join(home, '.claude') : join(process.cwd(), '.claude');
        case 'codex':
            return scope === 'global' ? join(home, '.codex') : join(process.cwd(), '.codex');
        case 'gemini':
            return scope === 'global' ? join(home, '.gemini') : join(process.cwd(), '.gemini');
        case 'antigravity':
            if (scope === 'global') {
                return join(home, '.gemini', 'antigravity');
            }
            return join(process.cwd(), '.agent');
        default:
            return null;
    }
}

function getOpenCodeAgentDir(scope) {
    const home = getHomedir();
    if (scope === 'global') {
        if (!home) return null;
        return join(home, '.config', 'opencode', 'agent');
    }
    return join(process.cwd(), '.opencode', 'agent');
}

function getOpenCodeAgentRoot(scope) {
    const home = getHomedir();
    if (scope === 'global') {
        if (!home) return null;
        return join(home, '.config', 'opencode');
    }
    return join(process.cwd(), '.opencode');
}

function ensureDir(p) {
    if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

function resetDir(p) {
    if (existsSync(p)) {
        rmSync(p, { recursive: true, force: true });
    }
    mkdirSync(p, { recursive: true });
}

function writeTimestamp(dir) {
    ensureDir(dir);
    const timestampFile = join(dir, '.wtv-updated');
    writeFileSync(timestampFile, new Date().toISOString().split('T')[0]);

    const legacy = join(dir, '.codehogg-updated');
    if (existsSync(legacy)) {
        rmSync(legacy, { force: true });
    }
}

function parseClaudeAgentTemplate(agentPath) {
    const raw = readFileSync(agentPath, 'utf8');
    const parts = raw.split(/\n---\n/);

    if (!raw.startsWith('---\n') || parts.length < 2) {
        return { frontmatter: {}, body: raw };
    }

    const fmText = parts[0].replace(/^---\n/, '');
    const body = raw.slice(parts[0].length + '\n---\n'.length);

    const fm = {};
    for (const line of fmText.split('\n')) {
        const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
        if (m) {
            fm[m[1]] = m[2];
        }
    }

    return { frontmatter: fm, body };
}

function getTemplateSkillDirs() {
    const source = join(TEMPLATES_DIR, 'skills');
    if (!existsSync(source)) return [];

    return readdirSync(source).filter(name => {
        try {
            return statSync(join(source, name)).isDirectory();
        } catch {
            return false;
        }
    });
}

function getTemplateAgentFiles() {
    const source = join(TEMPLATES_DIR, 'agents');
    if (!existsSync(source)) return [];
    return readdirSync(source).filter(f => f.endsWith('.md'));
}

function getLegacyAgentFiles() {
    return Object.keys(LEGACY_AGENT_NAME_ALIASES).map(name => `${name}.md`);
}

function countInstalledDirs(dir, dirNames) {
    if (!dir || !existsSync(dir)) return 0;
    let count = 0;
    for (const name of dirNames) {
        if (existsSync(join(dir, name))) count++;
    }
    return count;
}

function countInstalledFiles(dir, fileNames) {
    if (!dir || !existsSync(dir)) return 0;
    let count = 0;
    for (const name of fileNames) {
        if (existsSync(join(dir, name))) count++;
    }
    return count;
}

function installSkills(destDir, { force, showProgress, label }) {
    const source = join(TEMPLATES_DIR, 'skills');
    if (!existsSync(source)) {
        throw new Error(`Templates missing: ${source}`);
    }

    const skillDirs = getTemplateSkillDirs();
    ensureDir(destDir);

    for (const name of skillDirs) {
        const srcSkillDir = join(source, name);
        const destSkillDir = join(destDir, name);

        if (existsSync(destSkillDir)) {
            if (!force) {
                throw new Error(`Existing skill found at ${destSkillDir}. Use --force to overwrite.`);
            }
            rmSync(destSkillDir, { recursive: true, force: true });
        }

        copyDir(srcSkillDir, destSkillDir);
    }

    if (force) {
        const legacyCoreSkillDir = join(destDir, 'codehogg');
        if (existsSync(legacyCoreSkillDir)) {
            rmSync(legacyCoreSkillDir, { recursive: true, force: true });
        }
    }

    if (showProgress) {
        console.log(`    ${c.green}${sym.check}${c.reset} ${label} (${skillDirs.length} skills)`);
    }

    return skillDirs.length;
}

function installStandardTool(toolName, targetDir, { force, showProgress, selectedArtisans = null }) {
    const validation = validatePath(targetDir);
    if (!validation.valid) {
        throw new Error(validation.error);
    }

    ensureDir(targetDir);

    const agentsSource = join(TEMPLATES_DIR, 'agents');
    const agentsDest = join(targetDir, 'agents');

    if (!existsSync(agentsSource)) {
        throw new Error(`Templates missing: ${agentsSource}`);
    }

    ensureDir(agentsDest);

    if (force) {
        for (const legacyFile of getLegacyAgentFiles()) {
            const p = join(agentsDest, legacyFile);
            if (existsSync(p)) {
                rmSync(p, { force: true });
            }
        }
    }

    // Copy agents - optionally filter by selected artisans
    let agentCount = 0;
    const agentFiles = getTemplateAgentFiles();
    const artisanFiles = new Set(ARTISAN_DEFS.map(a => a.file));
    const artisanByFile = new Map(ARTISAN_DEFS.map(a => [a.file, a]));

    for (const file of agentFiles) {
        const srcPath = join(agentsSource, file);
        const destPath = join(agentsDest, file);

        const isArtisan = artisanFiles.has(file);
        if (isArtisan && selectedArtisans) {
            const artisan = artisanByFile.get(file);
            const selected = artisan && selectedArtisans.includes(artisan.id);

            if (!selected) {
                if (force && existsSync(destPath)) {
                    rmSync(destPath, { force: true });
                }
                continue;
            }
        }

        if (existsSync(destPath) && !force) {
            throw new Error(`Existing agent found at ${destPath}. Use --force to overwrite.`);
        }

        copyFileSync(srcPath, destPath);
        agentCount++;
    }

    const skillsDest = join(targetDir, 'skills');
    installSkills(skillsDest, { force, showProgress, label: `${toolName} skills` });

    const wtvSrc = join(TEMPLATES_DIR, 'WTV.md');
    const wtvDest = join(targetDir, 'WTV.md');
    if (existsSync(wtvSrc)) {
        copyFileSync(wtvSrc, wtvDest);
    }

    if (force) {
        const legacyPluginDoc = join(targetDir, 'CODEHOGG.md');
        if (existsSync(legacyPluginDoc)) {
            rmSync(legacyPluginDoc, { force: true });
        }
    }

    writeTimestamp(targetDir);

    // Append WTV section to tool's config file (if it exists)
    const toolConfigMap = {
        'Claude': join(process.cwd(), 'CLAUDE.md'),
        'Codex': join(process.cwd(), 'AGENTS.md'),
        'Gemini': join(process.cwd(), 'GEMINI.md'),
        'Antigravity': join(process.cwd(), 'AGENTS.md'),
    };
    const configFile = toolConfigMap[toolName];
    if (configFile) {
        appendWtvSection(configFile);
    }

    if (showProgress) {
        console.log(`    ${c.green}${sym.check}${c.reset} ${agentCount} ${toolName} agents`);
    }

    return true;
}

function installClaude(targetDir, options) {
    return installStandardTool('Claude', targetDir, options);
}

function installGemini(targetDir, options) {
    return installStandardTool('Gemini', targetDir, options);
}

function installAntigravity(targetDir, options) {
    const success = installStandardTool('Antigravity', targetDir, options);
    if (!success) return false;

    // Create Antigravity Rule file to bootstrap agents and AGENTS.md
    const rulesDir = join(targetDir, 'rules');
    ensureDir(rulesDir);
    const rulePath = join(rulesDir, 'wtv-bootstrap.md');

    if (!existsSync(rulePath) || options.force) {
        const ruleContent = `# WTV Configuration

This workspace uses the WTV agent system.

## Core Instructions
1. **Source of Truth**: Always read and adhere to \`./AGENTS.md\` in the repository root.
   - If \`./AGENTS.override.md\` exists in a subdirectory, it takes precedence for that directory.

## Expert Agents
The following expert agents are available in \`.agent/agents/\`. When acting as or consulting them, read their definition file:
- **Paul** (Masterbuilder): \`.agent/agents/paul.md\`
- **Nehemiah** (Security): \`.agent/agents/nehemiah.md\`
- **Bezaleel** (Architecture): \`.agent/agents/bezaleel.md\`
- **Hiram** (Backend): \`.agent/agents/hiram.md\`
- **Aholiab** (Frontend): \`.agent/agents/aholiab.md\`
- **Solomon** (Data): \`.agent/agents/solomon.md\`
- **Zerubbabel** (DevOps): \`.agent/agents/zerubbabel.md\`
- **Ezra** (QA): \`.agent/agents/ezra.md\`
- **Moses** (Product): \`.agent/agents/moses.md\`
- **David** (Voice): \`.agent/agents/david.md\`
`;
        writeFileSync(rulePath, ruleContent);
        if (options.showProgress) {
            console.log(`    ${c.green}${sym.check}${c.reset} Antigravity bootstrap rule created`);
        }
    }

    return true;
}

function installCodex(targetDir, options) {
    return installStandardTool('Codex', targetDir, options);
}

function installOpenCodeAgents(agentDir, { force, showProgress, selectedArtisans = null }) {
    const sourceDir = join(TEMPLATES_DIR, 'agents');
    if (!existsSync(sourceDir)) {
        throw new Error(`Templates missing: ${sourceDir}`);
    }

    ensureDir(agentDir);

    if (force) {
        for (const legacyFile of getLegacyAgentFiles()) {
            const p = join(agentDir, legacyFile);
            if (existsSync(p)) {
                rmSync(p, { force: true });
            }
        }
    }

    const artisanFiles = new Set(ARTISAN_DEFS.map(a => a.file));
    const artisanByFile = new Map(ARTISAN_DEFS.map(a => [a.file, a]));

    const agentFiles = getTemplateAgentFiles().sort();

    let written = 0;
    for (const file of agentFiles) {
        const destPath = join(agentDir, file);
        const isArtisan = artisanFiles.has(file);

        if (isArtisan && selectedArtisans) {
            const artisan = artisanByFile.get(file);
            const selected = artisan && selectedArtisans.includes(artisan.id);

            if (!selected) {
                if (force && existsSync(destPath)) {
                    rmSync(destPath, { force: true });
                }
                continue;
            }
        }

        if (existsSync(destPath) && !force) {
            throw new Error(`Existing agent found at ${destPath}. Use --force to overwrite.`);
        }

        const inputPath = join(sourceDir, file);
        const { frontmatter, body } = parseClaudeAgentTemplate(inputPath);
        const description = frontmatter.description || `WTV agent: ${file.replace(/\.md$/, '')}`;

        const out = [
            '---',
            `description: ${yamlQuote(description)}`,
            'mode: subagent',
            'tools:',
            '  bash: true',
            '  read: true',
            '  grep: true',
            '  glob: true',
            '  webfetch: true',
            '  edit: true',
            '  write: true',
            '  skill: true',
            '---',
            '',
            body.trimStart(),
        ].join('\n');

        writeFileSync(destPath, out);
        written++;
    }

    if (showProgress) {
        console.log(`    ${c.green}${sym.check}${c.reset} ${written} OpenCode agents`);
    }

    return written;
}

function installOpenCode(scope, { force, showProgress, selectedArtisans = null }) {
    // Skills: use OpenCode's Claude-compatible skill lookup.
    const claudeRoot = getRootDirForTool('claude', scope);
    if (!claudeRoot) throw new Error('Cannot determine ~/.claude directory.');
    const validation = validatePath(claudeRoot);
    if (!validation.valid) {
        throw new Error(validation.error);
    }

    ensureDir(claudeRoot);
    installSkills(join(claudeRoot, 'skills'), { force, showProgress, label: 'OpenCode skills (via .claude/skills)' });
    writeTimestamp(claudeRoot);

    // Agents: native OpenCode agent path.
    const agentRoot = getOpenCodeAgentRoot(scope);
    const agentDir = getOpenCodeAgentDir(scope);
    if (!agentRoot || !agentDir) throw new Error('Cannot determine OpenCode agent directory.');

    const agentValidation = validatePath(agentRoot);
    if (!agentValidation.valid) {
        throw new Error(agentValidation.error);
    }

    ensureDir(agentRoot);
    installOpenCodeAgents(agentDir, { force, showProgress, selectedArtisans });
    writeTimestamp(agentRoot);

    return true;
}

function detectInstalled(scope) {
    const home = getHomedir();

    const claudeRoot = scope === 'global'
        ? (home ? join(home, '.claude') : null)
        : join(process.cwd(), '.claude');

    const codexRoot = scope === 'global'
        ? (home ? join(home, '.codex') : null)
        : join(process.cwd(), '.codex');

    const opencodeAgentsDir = getOpenCodeAgentDir(scope);

    const templateAgentFiles = getTemplateAgentFiles();
    const legacyAgentFiles = getLegacyAgentFiles();

    const claudeAgentsDir = claudeRoot ? join(claudeRoot, 'agents') : null;
    const codexSkillsDir = codexRoot ? join(codexRoot, 'skills') : null;

    const hasClaudeAgents =
        countInstalledFiles(claudeAgentsDir, templateAgentFiles) > 0 ||
        countInstalledFiles(claudeAgentsDir, legacyAgentFiles) > 0;

    const hasClaudeMarker = !!claudeRoot && (
        existsSync(join(claudeRoot, 'WTV.md')) ||
        existsSync(join(claudeRoot, 'CODEHOGG.md'))
    );

    const hasCodexCoreSkill = !!codexSkillsDir && (
        existsSync(join(codexSkillsDir, 'wtv')) ||
        existsSync(join(codexSkillsDir, 'codehogg'))
    );

    const hasOpenCodeAgents =
        countInstalledFiles(opencodeAgentsDir, templateAgentFiles) > 0 ||
        countInstalledFiles(opencodeAgentsDir, legacyAgentFiles) > 0;

    return {
        claude: !!claudeRoot && (hasClaudeMarker || hasClaudeAgents),
        codex: !!codexRoot && hasCodexCoreSkill,
        opencode: !!opencodeAgentsDir && hasOpenCodeAgents,
        paths: { claudeRoot, codexRoot, opencodeAgentsDir },
    };
}

async function interactiveInit() {
    printBanner();
    console.log(`  ${c.cyan}Welcome!${c.reset} Let's set up wtv.\n`);

    const scope = await select('Where would you like to install?', [
        { value: 'project', label: 'Current project', desc: 'Installs to .claude/.codex/.opencode in this repo' },
        { value: 'global', label: 'Global', desc: 'Installs to ~/.claude, ~/.codex, and ~/.config/opencode' },
    ]);

    console.log(`\n  ${c.bold}Targets${c.reset}`);
    const installClaudeFlag = await confirm('Install for Claude Code?', true);
    const installCodexFlag = await confirm('Install for Codex CLI?', false);
    const installOpenCodeFlag = await confirm('Install for OpenCode?', false);
    const installGeminiFlag = await confirm('Install for Gemini Type? (Gemini CLI)', false);
    const installAntigravityFlag = await confirm('Install for Antigravity?', false);

    const tools = [];
    if (installClaudeFlag) tools.push('claude');
    if (installCodexFlag) tools.push('codex');
    if (installOpenCodeFlag) tools.push('opencode');
    if (installGeminiFlag) tools.push('gemini');
    if (installAntigravityFlag) tools.push('antigravity');

    if (tools.length === 0) {
        console.log(`\n  ${c.dim}No tools selected. Nothing to do.${c.reset}\n`);
        process.exit(0);
    }

    // Ask which artisans to install (for Claude Code or OpenCode)
    let selectedArtisans = null;
    if (tools.includes('claude') || tools.includes('opencode')) {
        const customizeArtisans = await confirm('\n  Customize which Artisans to install?', false);
        if (customizeArtisans) {
            selectedArtisans = await selectArtisans();
            const selectedNames = selectedArtisans.map(id => {
                const a = ARTISAN_DEFS.find(x => x.id === id);
                return a ? a.name : id;
            });
            console.log(`\n  ${c.green}${sym.check}${c.reset} Selected: ${selectedNames.join(', ')}`);
        } else {
            console.log(`  ${c.dim}Installing all ${ARTISAN_DEFS.length} artisans.${c.reset}`);
        }
    }

    const installed = detectInstalled(scope);
    const existing = tools.filter(t => installed[t]);

    let force = false;
    if (existing.length > 0) {
        console.log(`\n  ${c.yellow}${sym.warn}${c.reset} Existing installation(s) detected: ${existing.join(', ')}`);
        force = await confirm('Overwrite existing WTV files? (custom files are preserved)', false);
        if (!force) {
            console.log(`\n  ${c.dim}Aborted.${c.reset}\n`);
            process.exit(0);
        }
    }

    console.log(`\n  ${c.bold}Installing...${c.reset}\n`);

    doInstall({ scope, tools, force, showProgress: true, customPath: null, selectedArtisans });

    console.log(`\n  ${c.green}${c.bold}Installation complete!${c.reset}\n`);

    // Offer to create VISION.md for project-scope installs
    if (scope === 'project') {
        const visionPath = getVisionPath(scope);
        if (!existsSync(visionPath)) {
            console.log(`  ${c.bold}Vision-Driven Development${c.reset}`);
            console.log(`  ${c.dim}VISION.md lets /wtv align recommendations with your project goals.${c.reset}\n`);

            const createVision = await confirm('Create VISION.md now?', true);
            if (createVision) {
                await initVision(scope);
            } else {
                console.log(`\n  ${c.dim}You can create it later with 'wtv init' or by creating VISION.md manually.${c.reset}\n`);
            }
        }
    }

    console.log(`  ${c.bold}Quick start:${c.reset}`);
    if (tools.includes('claude')) {
        console.log(`    ${c.cyan}Claude Code:${c.reset} use /wtv or /wtv "your mission"`);
    }
    if (tools.includes('codex')) {
        console.log(`    ${c.cyan}Codex CLI:${c.reset} use $wtv`);
    }
    if (tools.includes('opencode')) {
        console.log(`    ${c.cyan}OpenCode:${c.reset} use @paul (masterbuilder) and ask for a plan`);
    }
    console.log(`    ${c.dim}Tip:${c.reset} run 'wtv meet' to see the team`);

    console.log('');
}

function doInstall({ scope, tools, force, showProgress, customPath, selectedArtisans = null }) {
    const selected = normalizeTools(tools);

    if (customPath && selected.length !== 1) {
        throw new Error('Custom --path is only supported when installing a single tool.');
    }

    for (const tool of selected) {
        if (tool === 'claude') {
            const targetDir = getRootDirForTool('claude', scope, customPath);
            if (!targetDir) throw new Error('Cannot determine .claude directory.');
            installClaude(targetDir, { force, showProgress, selectedArtisans });
        }

        if (tool === 'codex') {
            const targetDir = getRootDirForTool('codex', scope, customPath);
            if (!targetDir) throw new Error('Cannot determine .codex directory.');
            installCodex(targetDir, { force, showProgress });
        }

        if (tool === 'opencode') {
            if (customPath) {
                throw new Error('Custom --path is not supported for OpenCode installs.');
            }
            installOpenCode(scope, { force, showProgress, selectedArtisans });
        }

        if (tool === 'gemini') {
            const targetDir = getRootDirForTool('gemini', scope, customPath);
            if (!targetDir) throw new Error('Cannot determine .gemini directory.');
            installGemini(targetDir, { force, showProgress, selectedArtisans });
        }

        if (tool === 'antigravity') {
            const targetDir = getRootDirForTool('antigravity', scope, customPath);
            if (!targetDir) throw new Error('Cannot determine .antigravity directory.');
            installAntigravity(targetDir, { force, showProgress, selectedArtisans });
        }
    }

    return true;
}

function initNonInteractive(scope, force, tools, customPath = null) {
    const selected = normalizeTools(tools.length ? tools : ['claude']);

    const scopeLabel = scope === 'global' ? 'global' : 'project';
    console.log(`\n  ${c.bold}wtv${c.reset} v${getVersion()}`);
    console.log(`  Installing (${scopeLabel}) for: ${selected.join(', ')}\n`);

    doInstall({ scope, tools: selected, force, showProgress: true, customPath });

    console.log(`\n  ${c.green}Installation complete!${c.reset}\n`);
}

function update(scope, tools, customPath = null) {
    if (customPath) {
        const selected = normalizeTools(tools);

        if (selected.length !== 1) {
            console.log(`\n  ${c.red}Error:${c.reset} Custom --path requires exactly one tool.`);
            console.log(`  Example: wtv update --tool claude --path /tmp/claude-root\n`);
            process.exit(1);
        }

        if (selected[0] === 'opencode') {
            console.log(`\n  ${c.red}Error:${c.reset} Custom --path is not supported for OpenCode installs.`);
            console.log(`  OpenCode installs to .opencode/ (project) or ~/.config/opencode (global).\n`);
            process.exit(1);
        }

        console.log(`\n  ${c.bold}wtv${c.reset} v${getVersion()}`);
        console.log(`  Updating custom installation: ${selected[0]} (${customPath})\n`);

        doInstall({ scope, tools: selected, force: true, showProgress: true, customPath });

        console.log(`\n  ${c.green}Update complete!${c.reset}\n`);
        return;
    }

    const installed = detectInstalled(scope);
    const selected = normalizeTools(tools.length ? tools : TOOL_IDS.filter(t => installed[t]));

    if (selected.length === 0) {
        console.log(`\n  ${c.red}Error:${c.reset} No installations found to update.`);
        console.log(`  Run 'wtv init' first.\n`);
        process.exit(1);
    }

    console.log(`\n  ${c.bold}wtv${c.reset} v${getVersion()}`);
    console.log(`  Updating ${scope} installation(s): ${selected.join(', ')}\n`);

    doInstall({ scope, tools: selected, force: true, showProgress: true, customPath: null });

    console.log(`\n  ${c.green}Update complete!${c.reset}\n`);
}

async function uninstallInteractive(scope) {
    printBanner();

    const installed = detectInstalled(scope);
    const candidates = TOOL_IDS.filter(t => installed[t]);

    if (candidates.length === 0) {
        console.log(`\n  ${c.dim}Nothing to uninstall.${c.reset}\n`);
        process.exit(0);
    }

    console.log(`  ${c.bold}Installed:${c.reset} ${candidates.join(', ')}\n`);

    const removeClaude = candidates.includes('claude')
        ? await confirm('Uninstall Claude Code assets?', true)
        : false;
    const removeCodex = candidates.includes('codex')
        ? await confirm('Uninstall Codex CLI assets?', true)
        : false;
    const removeOpenCode = candidates.includes('opencode')
        ? await confirm('Uninstall OpenCode assets?', true)
        : false;

    const selected = [];
    if (removeClaude) selected.push('claude');
    if (removeCodex) selected.push('codex');
    if (removeOpenCode) selected.push('opencode');

    if (selected.length === 0) {
        console.log(`\n  ${c.dim}Nothing selected. Aborted.${c.reset}\n`);
        process.exit(0);
    }

    const ok = await confirm(`${c.yellow}${sym.warn}${c.reset} This will remove files from disk. Continue?`, false);
    if (!ok) {
        console.log(`\n  ${c.dim}Aborted.${c.reset}\n`);
        process.exit(0);
    }

    uninstall(scope, selected);
}

function uninstall(scope, tools, customPath = null) {
    const selected = normalizeTools(tools);

    const templateAgentFiles = getTemplateAgentFiles();
    const templateSkillDirs = getTemplateSkillDirs();

    const removeAgentFiles = (dir) => {
        if (!dir || !existsSync(dir)) return 0;
        let removedCount = 0;
        for (const file of templateAgentFiles) {
            const p = join(dir, file);
            if (existsSync(p)) {
                rmSync(p, { force: true });
                removedCount++;
            }
        }
        return removedCount;
    };

    const removeSkillDirs = (dir) => {
        if (!dir || !existsSync(dir)) return 0;
        let removedCount = 0;
        for (const name of templateSkillDirs) {
            const p = join(dir, name);
            if (existsSync(p)) {
                rmSync(p, { recursive: true, force: true });
                removedCount++;
            }
        }
        return removedCount;
    };

    if (customPath) {
        if (selected.length !== 1) {
            console.log(`\n  ${c.red}Error:${c.reset} Custom --path requires exactly one tool.`);
            console.log(`  Example: wtv uninstall --tool claude --path /tmp/claude-root\n`);
            process.exit(1);
        }

        if (selected[0] === 'opencode') {
            console.log(`\n  ${c.red}Error:${c.reset} Custom --path is not supported for OpenCode installs.`);
            console.log(`  OpenCode installs to .opencode/ (project) or ~/.config/opencode (global).\n`);
            process.exit(1);
        }

        const tool = selected[0];
        const root = getRootDirForTool(tool, scope, customPath);
        if (!root) {
            console.log(`\n  ${c.red}Error:${c.reset} Unable to determine directory for ${tool}.\n`);
            process.exit(1);
        }

        console.log(`\n  ${c.bold}wtv${c.reset} v${getVersion()}`);
        console.log(`  Uninstalling custom installation: ${tool} (${customPath})\n`);

        let removed = false;

        if (tool === 'claude') {
            const removedAgents = removeAgentFiles(join(root, 'agents'));
            if (removedAgents > 0) {
                console.log(`    ${c.green}${sym.check}${c.reset} Removed ${removedAgents} Claude agents`);
                removed = true;
            }

            const removedSkills = removeSkillDirs(join(root, 'skills'));
            if (removedSkills > 0) {
                console.log(`    ${c.green}${sym.check}${c.reset} Removed ${removedSkills} Claude skills`);
                removed = true;
            }

            for (const file of ['WTV.md', 'CODEHOGG.md', '.wtv-updated', '.codehogg-updated']) {
                const p = join(root, file);
                if (existsSync(p)) {
                    rmSync(p, { force: true });
                    removed = true;
                }
            }
        }

        if (tool === 'codex') {
            const removedSkills = removeSkillDirs(join(root, 'skills'));
            if (removedSkills > 0) {
                console.log(`    ${c.green}${sym.check}${c.reset} Removed ${removedSkills} Codex skills`);
                removed = true;
            }

            for (const file of ['.wtv-updated', '.codehogg-updated']) {
                const p = join(root, file);
                if (existsSync(p)) {
                    rmSync(p, { force: true });
                    removed = true;
                }
            }
        }

        if (removed) {
            console.log(`\n  ${c.green}Uninstall complete.${c.reset}\n`);
        } else {
            console.log(`\n  ${c.dim}Nothing to uninstall.${c.reset}\n`);
        }

        return;
    }

    const home = getHomedir();
    const installed = detectInstalled(scope);

    const claudeRoot = scope === 'global'
        ? (home ? join(home, '.claude') : null)
        : join(process.cwd(), '.claude');

    const codexRoot = scope === 'global'
        ? (home ? join(home, '.codex') : null)
        : join(process.cwd(), '.codex');

    const opencodeRoot = getOpenCodeAgentRoot(scope);
    const opencodeAgentsDir = getOpenCodeAgentDir(scope);

    const remainingClaude = installed.claude && !selected.includes('claude');
    const remainingOpenCode = installed.opencode && !selected.includes('opencode');
    const keepWtvSkills = remainingClaude || remainingOpenCode;

    console.log(`\n  ${c.bold}wtv${c.reset} v${getVersion()}`);
    console.log(`  Uninstalling (${scope}) for: ${selected.join(', ')}\n`);

    let removed = false;
    let removedWtvSkillsFromClaude = false;

    if (selected.includes('claude') && claudeRoot) {
        const agentsDir = join(claudeRoot, 'agents');
        const removedAgents = removeAgentFiles(agentsDir);
        if (removedAgents > 0) {
            console.log(`    ${c.green}${sym.check}${c.reset} Removed ${removedAgents} Claude agents`);
            removed = true;
        }

        if (!keepWtvSkills) {
            const skillsDir = join(claudeRoot, 'skills');
            const removedSkills = removeSkillDirs(skillsDir);
            if (removedSkills > 0) {
                console.log(`    ${c.green}${sym.check}${c.reset} Removed ${removedSkills} Claude skills`);
                removed = true;
            }
            removedWtvSkillsFromClaude = true;

            for (const tsFile of ['.wtv-updated', '.codehogg-updated']) {
                const ts = join(claudeRoot, tsFile);
                if (existsSync(ts)) {
                    rmSync(ts, { force: true });
                    removed = true;
                }
            }
        } else {
            console.log(`    ${c.dim}Keeping wtv skills in .claude/skills (still needed)${c.reset}`);
        }

        for (const file of ['WTV.md', 'CODEHOGG.md']) {
            const p = join(claudeRoot, file);
            if (existsSync(p)) {
                rmSync(p, { force: true });
                removed = true;
            }
        }
    }

    if (selected.includes('codex') && codexRoot) {
        const skillsDir = join(codexRoot, 'skills');
        const removedSkills = removeSkillDirs(skillsDir);
        if (removedSkills > 0) {
            console.log(`    ${c.green}${sym.check}${c.reset} Removed ${removedSkills} Codex skills`);
            removed = true;
        }

        for (const tsFile of ['.wtv-updated', '.codehogg-updated']) {
            const ts = join(codexRoot, tsFile);
            if (existsSync(ts)) {
                rmSync(ts, { force: true });
                removed = true;
            }
        }
    }

    if (selected.includes('opencode')) {
        const removedAgents = removeAgentFiles(opencodeAgentsDir);
        if (removedAgents > 0) {
            console.log(`    ${c.green}${sym.check}${c.reset} Removed ${removedAgents} OpenCode agents`);
            removed = true;
        }

        if (opencodeRoot) {
            for (const tsFile of ['.wtv-updated', '.codehogg-updated']) {
                const ts = join(opencodeRoot, tsFile);
                if (existsSync(ts)) {
                    rmSync(ts, { force: true });
                    removed = true;
                }
            }
        }

        // OpenCode skills live in .claude/skills
        if (!keepWtvSkills && claudeRoot && !removedWtvSkillsFromClaude) {
            const skillsDir = join(claudeRoot, 'skills');
            const removedSkills = removeSkillDirs(skillsDir);
            if (removedSkills > 0) {
                console.log(`    ${c.green}${sym.check}${c.reset} Removed ${removedSkills} OpenCode skills (via .claude/skills)`);
                removed = true;
            }

            for (const tsFile of ['.wtv-updated', '.codehogg-updated']) {
                const ts = join(claudeRoot, tsFile);
                if (existsSync(ts)) {
                    rmSync(ts, { force: true });
                    removed = true;
                }
            }
        }
    }

    // Remove WTV section from config files if uninstalling relevant tools
    const configFilesToClean = [];
    if (selected.includes('claude')) configFilesToClean.push(join(process.cwd(), 'CLAUDE.md'));
    if (selected.includes('codex')) configFilesToClean.push(join(process.cwd(), 'AGENTS.md'));
    if (selected.includes('gemini')) configFilesToClean.push(join(process.cwd(), 'GEMINI.md'));
    if (selected.includes('antigravity')) configFilesToClean.push(join(process.cwd(), 'AGENTS.md'));

    for (const configFile of [...new Set(configFilesToClean)]) {
        if (removeWtvSection(configFile)) {
            console.log(`    ${c.green}${sym.check}${c.reset} Removed WTV section from ${basename(configFile)}`);
            removed = true;
        }
    }

    if (removed) {
        console.log(`\n  ${c.green}Uninstall complete.${c.reset}\n`);
    } else {
        console.log(`\n  ${c.dim}Nothing to uninstall.${c.reset}\n`);
    }
}

function status(customPath = null) {
    console.log(`\n  ${c.bold}wtv${c.reset} v${getVersion()}\n`);

    const home = getHomedir();

    const templateAgentFiles = getTemplateAgentFiles();
    const legacyAgentFiles = getLegacyAgentFiles();
    const templateSkillDirs = getTemplateSkillDirs();

    const showClaude = (label, root) => {
        const agentsDir = join(root, 'agents');
        const skillsDir = join(root, 'skills');

        const agents = countInstalledFiles(agentsDir, templateAgentFiles);
        const skills = countInstalledDirs(skillsDir, templateSkillDirs);
        const legacyAgents = countInstalledFiles(agentsDir, legacyAgentFiles);

        const hasLegacyCoreSkill = existsSync(join(skillsDir, 'codehogg'));
        const hasNewCoreSkill = existsSync(join(skillsDir, 'wtv'));
        const hasTimestamp = existsSync(join(root, '.wtv-updated')) || existsSync(join(root, '.codehogg-updated'));
        const hasMarkerDoc = existsSync(join(root, 'WTV.md')) || existsSync(join(root, 'CODEHOGG.md'));

        const installed = hasTimestamp || hasMarkerDoc || hasNewCoreSkill || hasLegacyCoreSkill || agents > 0 || legacyAgents > 0;

        console.log(`  ${label}:`);
        if (installed) {
            console.log(`    ${c.green}${sym.check}${c.reset} ${agents}/${templateAgentFiles.length} agents, ${skills}/${templateSkillDirs.length} skills`);
            if (legacyAgents > 0 && agents === 0) {
                console.log(`    ${c.yellow}${sym.warn}${c.reset} Legacy agents detected (run: wtv update --tool claude)`);
            } else if (skills > 0 && agents === 0) {
                console.log(`    ${c.yellow}${sym.warn}${c.reset} Agents missing (run: wtv init --claude)`);
            }

            if (agents > 0 && skills === 0) {
                console.log(`    ${c.yellow}${sym.warn}${c.reset} Skills missing (run: wtv init --claude)`);
            }

            if (!hasNewCoreSkill && hasLegacyCoreSkill) {
                console.log(`    ${c.yellow}${sym.warn}${c.reset} Legacy core skill detected (codehogg). Run: wtv update --tool claude`);
            } else if (!hasNewCoreSkill && !hasLegacyCoreSkill) {
                console.log(`    ${c.yellow}${sym.warn}${c.reset} Core skill missing (wtv). Run: wtv update --tool claude`);
            }

            if (skills > 0 && skills < templateSkillDirs.length) {
                console.log(`    ${c.yellow}${sym.warn}${c.reset} ${templateSkillDirs.length - skills} skills missing (run: wtv update --tool claude)`);
            }

            if (agents > 0 && agents < templateAgentFiles.length) {
                console.log(`    ${c.dim}${sym.info}${c.reset} Partial agent set installed (custom selection?)`);
            }
        } else {
            console.log(`    ${c.dim}Not installed${c.reset}`);
            if (skills > 0) {
                console.log(`    ${c.dim}${sym.info}${c.reset} Found ${skills}/${templateSkillDirs.length} matching skills (run: wtv init --claude)`);
            }
        }
    };

    const showCodex = (label, root) => {
        const skillsDir = join(root, 'skills');
        const skills = countInstalledDirs(skillsDir, templateSkillDirs);

        const hasLegacyCoreSkill = existsSync(join(skillsDir, 'codehogg'));
        const hasNewCoreSkill = existsSync(join(skillsDir, 'wtv'));
        const hasTimestamp = existsSync(join(root, '.wtv-updated')) || existsSync(join(root, '.codehogg-updated'));

        const installed = hasTimestamp || hasNewCoreSkill || hasLegacyCoreSkill;

        console.log(`  ${label}:`);
        if (installed) {
            console.log(`    ${c.green}${sym.check}${c.reset} ${skills}/${templateSkillDirs.length} skills`);

            if (!hasNewCoreSkill && hasLegacyCoreSkill) {
                console.log(`    ${c.yellow}${sym.warn}${c.reset} Legacy core skill detected (codehogg). Run: wtv update --tool codex`);
            } else if (!hasNewCoreSkill && !hasLegacyCoreSkill) {
                console.log(`    ${c.yellow}${sym.warn}${c.reset} Core skill missing (wtv). Run: wtv update --tool codex`);
            }

            if (skills > 0 && skills < templateSkillDirs.length) {
                console.log(`    ${c.yellow}${sym.warn}${c.reset} ${templateSkillDirs.length - skills} skills missing (run: wtv update --tool codex)`);
            }
        } else {
            console.log(`    ${c.dim}Not installed${c.reset}`);
            if (skills > 0) {
                console.log(`    ${c.dim}${sym.info}${c.reset} Found ${skills}/${templateSkillDirs.length} matching skills (run: wtv init --codex)`);
            }
        }
    };

    const showOpenCode = (label, agentsDir, claudeSkillsDir) => {
        const agents = countInstalledFiles(agentsDir, templateAgentFiles);
        const skills = countInstalledDirs(claudeSkillsDir, templateSkillDirs);
        const legacyAgents = countInstalledFiles(agentsDir, legacyAgentFiles);

        const agentRoot = dirname(agentsDir);
        const hasTimestamp = existsSync(join(agentRoot, '.wtv-updated')) || existsSync(join(agentRoot, '.codehogg-updated'));

        const hasLegacyCoreSkill = existsSync(join(claudeSkillsDir, 'codehogg'));
        const hasNewCoreSkill = existsSync(join(claudeSkillsDir, 'wtv'));

        const installed = hasTimestamp || agents > 0 || legacyAgents > 0;

        console.log(`  ${label}:`);
        if (installed) {
            const suffix = skills > 0 ? ' (via .claude/skills)' : '';
            console.log(`    ${c.green}${sym.check}${c.reset} ${agents}/${templateAgentFiles.length} agents, ${skills}/${templateSkillDirs.length} skills${suffix}`);
            if (legacyAgents > 0 && agents === 0) {
                console.log(`    ${c.yellow}${sym.warn}${c.reset} Legacy agents detected (run: wtv update --tool opencode)`);
            } else if (skills > 0 && agents === 0) {
                console.log(`    ${c.yellow}${sym.warn}${c.reset} Agents missing (run: wtv init --opencode)`);
            }

            if (agents > 0 && skills === 0) {
                console.log(`    ${c.yellow}${sym.warn}${c.reset} Skills missing (run: wtv init --opencode)`);
            }

            if (!hasNewCoreSkill && hasLegacyCoreSkill) {
                console.log(`    ${c.yellow}${sym.warn}${c.reset} Legacy core skill detected (codehogg). Run: wtv update --tool opencode`);
            } else if (!hasNewCoreSkill && !hasLegacyCoreSkill) {
                console.log(`    ${c.yellow}${sym.warn}${c.reset} Core skill missing (wtv). Run: wtv update --tool opencode`);
            }

            if (skills > 0 && skills < templateSkillDirs.length) {
                console.log(`    ${c.yellow}${sym.warn}${c.reset} ${templateSkillDirs.length - skills} skills missing (run: wtv update --tool opencode)`);
            }

            if (agents > 0 && agents < templateAgentFiles.length) {
                console.log(`    ${c.dim}${sym.info}${c.reset} Partial agent set installed (custom selection?)`);
            }
        } else {
            console.log(`    ${c.dim}Not installed${c.reset}`);
            if (skills > 0 || hasNewCoreSkill || hasLegacyCoreSkill) {
                console.log(`    ${c.dim}${sym.info}${c.reset} Skills present in .claude/skills (run: wtv init --opencode)`);
            }
        }
    };

    if (customPath) {
        const root = getRootDirForTool('claude', 'project', customPath);
        if (!root) {
            console.log(`  Custom (${customPath}): ${c.dim}Unable to determine directory${c.reset}`);
            console.log('');
            return;
        }
        showClaude(`Custom (.claude-like) (${customPath})`, root);
        console.log('');
        return;
    }

    // Project
    console.log(`  ${c.bold}Project${c.reset}`);
    showClaude('Claude Code (.claude/)', join(process.cwd(), '.claude'));
    showCodex('Codex CLI (.codex/)', join(process.cwd(), '.codex'));
    showOpenCode('OpenCode (.opencode/)', join(process.cwd(), '.opencode', 'agent'), join(process.cwd(), '.claude', 'skills'));

    console.log('');

    // Global
    if (home) {
        console.log(`  ${c.bold}Global${c.reset}`);
        showClaude('Claude Code (~/.claude/)', join(home, '.claude'));
        showCodex('Codex CLI (~/.codex/)', join(home, '.codex'));
        showOpenCode('OpenCode (~/.config/opencode/)', join(home, '.config', 'opencode', 'agent'), join(home, '.claude', 'skills'));
    }

    console.log('');
}

// ============================================================================
// VISION.md Management
// ============================================================================

function getVisionPath(scope) {
    if (scope === 'global') {
        const home = getHomedir();
        return home ? join(home, 'VISION.md') : null;
    }

    // Project scope: Prefer vision/VISION.md
    const hasVisionDir = existsSync(join(process.cwd(), 'vision'));
    const visionDirFile = join(process.cwd(), 'vision', 'VISION.md');
    const rootFile = join(process.cwd(), 'VISION.md');

    if (existsSync(visionDirFile)) return visionDirFile;
    if (existsSync(rootFile)) return rootFile;

    // Default for new files: vision/VISION.md
    return visionDirFile;
}

function parseVisionSections(content) {
    const sections = {
        purpose: null,
        outcomes: null,
        values: null,
        constraints: null,
        stage: null,
        focus: null,
    };

    const sectionPatterns = [
        { key: 'purpose', pattern: /## Purpose\s*\n([\s\S]*?)(?=\n## |$)/ },
        { key: 'outcomes', pattern: /## Outcomes\s*\n([\s\S]*?)(?=\n## |$)/ },
        { key: 'values', pattern: /## Values\s*\n([\s\S]*?)(?=\n## |$)/ },
        { key: 'constraints', pattern: /## Constraints\s*\n([\s\S]*?)(?=\n## |$)/ },
        { key: 'stage', pattern: /## Stage\s*\n([\s\S]*?)(?=\n## |$)/ },
        { key: 'focus', pattern: /## Current Focus\s*\n([\s\S]*?)(?=\n## |$)/ },
    ];

    for (const { key, pattern } of sectionPatterns) {
        const match = content.match(pattern);
        if (match) {
            // Remove HTML comments and trim
            let text = match[1]
                .replace(/<!--[\s\S]*?-->/g, '')
                .trim();
            // Only mark as filled if there's actual content
            sections[key] = text.length > 0 ? text : null;
        }
    }

    return sections;
}

async function initVision(scope) {
    const visionPath = getVisionPath(scope);
    if (!visionPath) {
        console.log(`\n  ${c.red}Error:${c.reset} Cannot determine vision path.\n`);
        return false;
    }

    if (existsSync(visionPath)) {
        console.log(`\n  ${c.yellow}${sym.warn}${c.reset} VISION.md already exists at: ${visionPath}`);
        const overwrite = await confirm('Overwrite existing VISION.md?', false);
        if (!overwrite) {
            console.log(`\n  ${c.dim}Keeping existing VISION.md.${c.reset}\n`);
            return false;
        }
    }

    console.log(`\n  ${c.magenta}${c.bold}Write the Vision${c.reset}\n`);
    console.log(`  ${c.dim}> "And the LORD answered me, and said, Write the vision,${c.reset}`);
    console.log(`  ${c.dim}>  and make [it] plain upon tables, that he may run that readeth it."${c.reset}`);
    console.log(`  ${c.dim}>  — Habakkuk 2:2 (KJV PCE)${c.reset}\n`);

    // Create template
    const template = `${c.dim}# Vision

<!-- Who is this for and what does it do? -->
## Purpose
Project Purpose...

<!-- What does success look like? -->
## Outcomes
- Success Metric 1
- Success Metric 2

<!-- What matters most? Tradeoffs? -->
## Values
- Value 1
- Value 2

<!-- Off-limits? Time, budget, compliance? -->
## Constraints
- Constraint 1

<!-- Prototype / MVP / Production / Maintenance -->
## Stage
Prototype

<!-- What's the one thing right now? -->
## Current Focus
One Thing
${c.reset}`;

    // Clean Markdown for file (no colors)
    const cleanTemplate = `# Vision

<!-- Who is this for and what does it do? -->
## Purpose
<!-- Summarize the "Why". Who is it for? what problem does it solve? -->


<!-- What does success look like? -->
## Outcomes
<!-- Specific, measurable results -->
- 

<!-- What matters most? Tradeoffs? -->
## Values
<!-- e.g. Speed over Features, Privacy over Convenience -->
- 

<!-- Off-limits? Time, budget, compliance? -->
## Constraints
<!-- Hard stops and boundaries -->
- 

<!-- Prototype / MVP / Production / Maintenance -->
## Stage
Prototype

<!-- What's the one thing right now? -->
## Current Focus
<!-- The single most important next step -->
`;

    ensureDir(dirname(visionPath));
    writeFileSync(visionPath, cleanTemplate);

    console.log(`  ${c.bold}Opening editor...${c.reset}`);
    console.log(`  ${c.dim}(Close editor to save)${c.reset}\n`);

    await openInEditor(visionPath);

    console.log(`\n  ${c.green}${sym.check}${c.reset} Vision saved at: ${visionPath}\n`);
    return true;
}

// ============================================================================
// VISION RUNNER (Ralphy-style execution)
// ============================================================================

const VISION_RUNNER_ENGINES = ['opencode', 'codex', 'claude'];

function normalizeVisionRunnerEngine(engine) {
    if (!engine) return null;
    return String(engine).trim().toLowerCase();
}

function isSupportedVisionRunnerEngine(engine) {
    return VISION_RUNNER_ENGINES.includes(engine);
}

function discoverVisionDocs() {
    const visionDirPath = join(process.cwd(), 'vision');
    const rootVisionPath = join(process.cwd(), 'VISION.md');

    const files = [];
    if (existsSync(rootVisionPath)) {
        files.push({
            path: rootVisionPath,
            label: 'VISION.md (Root)',
        });
    }

    if (existsSync(visionDirPath) && lstatSync(visionDirPath).isDirectory()) {
        const vFiles = readdirSync(visionDirPath)
            .filter(f => f.endsWith('.md'))
            .sort((a, b) => a.localeCompare(b))
            .map(f => ({
                path: join(visionDirPath, f),
                label: `vision/${f}`,
            }));
        files.push(...vFiles);
    }

    return files;
}

function countUncheckedPrdTasks(prdContent) {
    const matches = prdContent.match(/^- \[ \] .+$/gm);
    return matches ? matches.length : 0;
}

function getNextUncheckedPrdTask(prdContent) {
    const match = prdContent.match(/^- \[ \] (.+)$/m);
    return match ? match[1].trim() : null;
}

function runGit(args) {
    return spawnSync('git', args, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
    });
}

function isGitRepo() {
    const res = runGit(['rev-parse', '--is-inside-work-tree']);
    return res.status === 0 && String(res.stdout || '').trim() === 'true';
}

function getGitHeadSha() {
    const res = runGit(['rev-parse', 'HEAD']);
    if (res.status !== 0) return null;
    const sha = String(res.stdout || '').trim();
    return sha ? sha : null;
}

function isWorkingTreeClean() {
    const res = runGit(['status', '--porcelain']);
    if (res.status !== 0) return false;
    return String(res.stdout || '').trim().length === 0;
}

function getCurrentBranch() {
    const res = runGit(['rev-parse', '--abbrev-ref', 'HEAD']);
    if (res.status !== 0) return null;
    const branch = String(res.stdout || '').trim();
    return branch ? branch : null;
}

function commandExists(cmd) {
    const locator = process.platform === 'win32' ? 'where' : 'which';
    const res = spawnSync(locator, [cmd], { stdio: ['ignore', 'ignore', 'ignore'] });
    return res.status === 0;
}

async function runEngine(engine, promptText) {
    const normalized = normalizeVisionRunnerEngine(engine);

    if (normalized === 'opencode') {
        const env = {
            ...process.env,
            OPENCODE_PERMISSION: '{"*":"allow"}',
        };

        return await new Promise((resolve, reject) => {
            const child = spawn('opencode', ['run', '--format', 'json', promptText], { stdio: 'inherit', env });
            child.on('error', reject);
            child.on('exit', (code) => resolve(code ?? 1));
        });
    }

    if (normalized === 'codex') {
        return await new Promise((resolve, reject) => {
            const child = spawn('codex', ['exec', '--full-auto', '--json', promptText], { stdio: 'inherit' });
            child.on('error', reject);
            child.on('exit', (code) => resolve(code ?? 1));
        });
    }

    if (normalized === 'claude') {
        return await new Promise((resolve, reject) => {
            const child = spawn('claude', ['--dangerously-skip-permissions', '--output-format', 'stream-json', '-p', promptText], { stdio: 'inherit' });
            child.on('error', reject);
            child.on('exit', (code) => resolve(code ?? 1));
        });
    }

    throw new Error(`Unsupported engine: ${engine}`);
}

function ensureProgressHeader(progressPath, { visionPath, engine, startSha }) {
    if (!existsSync(progressPath)) {
        writeFileSync(progressPath, '');
    }

    const existing = readFileSync(progressPath, 'utf8');
    if (existing.trim().length > 0) return;

    const startedAt = new Date().toISOString();
    const header = [
        `WTV Vision Runner`,
        `Started: ${startedAt}`,
        `Vision: ${visionPath}`,
        `Engine: ${engine}`,
        startSha ? `Start SHA: ${startSha}` : `Start SHA: (not a git repo)`,
        '',
    ].join('\n');

    writeFileSync(progressPath, header);
}

async function generatePrdFromVision({ engine, visionPath, prdPath }) {
    const visionContent = readFileSync(visionPath, 'utf8');

    const promptText = `You are generating a PRD for a software project.

Input vision document:
---
${visionContent}
---

Create or overwrite PRD.md in the project root.

Requirements:
- Must include a section titled "## Tasks".
- Under "## Tasks", write a detailed implementation checklist using GitHub-flavored markdown checkboxes:
  - Each item must use '- [ ] ' (unchecked).
  - Tasks must be small, sequential, and unambiguous.
- Do NOT implement any code yet.
- Do NOT run git commit or git push.
- Output is the updated files on disk (PRD.md).`;

    const code = await runEngine(engine, promptText);
    if (code !== 0) {
        throw new Error(`Engine exited with code ${code} while generating PRD.md`);
    }

    if (!existsSync(prdPath)) {
        throw new Error('PRD.md was not created');
    }

    const prdContent = readFileSync(prdPath, 'utf8');
    if (countUncheckedPrdTasks(prdContent) === 0) {
        throw new Error('PRD.md has no unchecked tasks (- [ ])');
    }
}

async function runVisionTaskIteration({ engine, prdPath, progressPath, taskText, noTests, noLint }) {
    const promptText = `You are an autonomous coding agent executing a PRD.

Files:
- PRD.md (checklist)
- progress.txt (checkpoint log)

Task to implement (ONLY this task):
"${taskText}"

Rules:
- Implement ONLY the task above.
- Update PRD.md: change that exact task from '- [ ]' to '- [x]'.
- Append a short checkpoint entry to progress.txt.
- Do NOT run git commit.
- Do NOT run git push.

Verification:
${noTests ? '- Skip tests.' : '- Write and run tests; they must pass.'}
${noLint ? '- Skip lint.' : '- Run linting; it must pass.'}

Stop after completing this one task.`;

    const beforePrd = readFileSync(prdPath, 'utf8');
    const beforeUnchecked = countUncheckedPrdTasks(beforePrd);

    const progressBefore = existsSync(progressPath) ? readFileSync(progressPath, 'utf8') : '';

    const code = await runEngine(engine, promptText);
    if (code !== 0) {
        throw new Error(`Engine exited with code ${code}`);
    }

    const afterPrd = readFileSync(prdPath, 'utf8');
    const afterUnchecked = countUncheckedPrdTasks(afterPrd);

    const stillUnchecked = afterPrd.includes(`- [ ] ${taskText}`);
    const nowChecked = afterPrd.includes(`- [x] ${taskText}`);

    if (stillUnchecked || (!nowChecked && afterUnchecked >= beforeUnchecked)) {
        throw new Error('PRD.md was not updated to mark the task complete');
    }

    const progressAfter = existsSync(progressPath) ? readFileSync(progressPath, 'utf8') : '';
    if (progressAfter === progressBefore) {
        const stamp = new Date().toISOString();
        writeFileSync(progressPath, progressAfter + `\n[${stamp}] Completed: ${taskText}\n`);
    }
}

async function visionRunner(opts) {
    const config = loadConfig();
    const interactive = process.stdout.isTTY && process.stdin.isTTY;

    const prdPath = join(process.cwd(), 'PRD.md');
    const progressPath = join(process.cwd(), 'progress.txt');

    const defaultEngine = normalizeVisionRunnerEngine(opts.engine || config.defaultTool || 'opencode');
    let engine = defaultEngine;

    if (!engine || !isSupportedVisionRunnerEngine(engine)) {
        engine = null;
    }

    if (!engine) {
        if (!interactive) {
            console.log(`\n  ${c.red}Error:${c.reset} --engine is required when not running interactively.\n`);
            return;
        }

        engine = await select('Engine:', [
            { value: 'opencode', label: 'OpenCode (recommended)' },
            { value: 'codex', label: 'Codex CLI' },
            { value: 'claude', label: 'Claude Code' },
        ]);
    }

    if (!engine || !isSupportedVisionRunnerEngine(engine)) {
        console.log(`\n  ${c.red}Error:${c.reset} Unsupported engine: ${engine}\n`);
        return;
    }

    if (!commandExists(engine === 'claude' ? 'claude' : engine)) {
        console.log(`\n  ${c.red}Error:${c.reset} Required CLI not found in PATH for engine: ${engine}\n`);
        return;
    }

    let visionPath = null;
    if (opts.vision) {
        visionPath = resolve(process.cwd(), opts.vision);
        if (!existsSync(visionPath)) {
            console.log(`\n  ${c.red}Error:${c.reset} Vision file not found: ${visionPath}\n`);
            return;
        }
    } else {
        let docs = discoverVisionDocs();
        if (docs.length === 0) {
            if (!interactive) {
                console.log(`\n  ${c.red}Error:${c.reset} No vision documents found. Pass --vision to run non-interactively.\n`);
                return;
            }

            console.log(`\n  ${c.yellow}${sym.warn}${c.reset} No vision documents found.`);
            const create = await confirm('Create VISION.md now?', true);
            if (!create) return;
            await initVision('project');
        }

        docs = discoverVisionDocs();
        if (docs.length === 0) {
            console.log(`\n  ${c.red}Error:${c.reset} No vision documents available to run.\n`);
            return;
        }

        visionPath = await select('Select vision document:', docs.map(d => ({ value: d.path, label: d.label })));
        if (!visionPath) return;
    }

    const hasGit = isGitRepo();
    const startSha = hasGit ? getGitHeadSha() : null;

    if (hasGit && !isWorkingTreeClean() && !opts.dryRun) {
        if (!interactive) {
            console.log(`\n  ${c.red}Error:${c.reset} Working tree is not clean (non-interactive mode).\n`);
            return;
        }

        const proceed = await confirm('Working tree is not clean. Continue anyway?', false);
        if (!proceed) return;
    }

    if (interactive && !opts.dryRun) {
        const proceed = await confirm(`Run vision with ${engine} (will modify files)?`, false);
        if (!proceed) return;
    }

    const shouldPush = hasGit && !opts.noPush;

    if (opts.dryRun) {
        console.log(`\n  ${c.bold}Dry run${c.reset}`);
        console.log(`  Vision: ${visionPath}`);
        console.log(`  Engine: ${engine}`);
        console.log(`  PRD: ${prdPath}`);
        console.log(`  Progress: ${progressPath}`);
        console.log(`  Commit+push at end: ${shouldPush ? 'yes' : 'no'}`);
        console.log('');
        return;
    }

    let resume = opts.resume;

    if (!resume && existsSync(prdPath) && !opts.regeneratePrd) {
        if (!interactive) {
            // Safe non-interactive default: continue existing PRD.
            resume = true;
        } else {
            const choice = await select('PRD.md already exists. What do you want to do?', [
                { value: 'resume', label: 'Resume existing PRD.md (recommended)' },
                { value: 'regenerate', label: 'Regenerate PRD.md from vision' },
                { value: 'cancel', label: 'Cancel' },
            ]);

            if (choice === 'cancel') return;
            if (choice === 'resume') resume = true;
            if (choice === 'regenerate') resume = false;
        }
    }

    if (!resume) {
        await generatePrdFromVision({ engine, visionPath, prdPath });
    } else {
        if (!existsSync(prdPath)) {
            console.log(`\n  ${c.red}Error:${c.reset} PRD.md not found (use without --resume to generate one).\n`);
            return;
        }
    }

    ensureProgressHeader(progressPath, { visionPath, engine, startSha });

    let iteration = 0;

    while (true) {
        const prdContent = readFileSync(prdPath, 'utf8');
        const nextTask = getNextUncheckedPrdTask(prdContent);

        if (!nextTask) {
            break;
        }

        if (opts.maxIterations > 0 && iteration >= opts.maxIterations) {
            console.log(`\n  ${c.yellow}${sym.warn}${c.reset} Stopped after max iterations (${opts.maxIterations}).`);
            console.log(`  Remaining tasks: ${countUncheckedPrdTasks(prdContent)}\n`);
            return;
        }

        iteration++;
        console.log(`\n  ${c.cyan}${sym.bullet}${c.reset} Task ${iteration}: ${nextTask}`);

        try {
            await runVisionTaskIteration({
                engine,
                prdPath,
                progressPath,
                taskText: nextTask,
                noTests: opts.noTests,
                noLint: opts.noLint,
            });
        } catch (err) {
            console.log(`\n  ${c.red}${sym.cross}${c.reset} Vision Runner failed: ${err.message}`);
            if (startSha) {
                console.log(`  Rollback: ${c.cyan}git reset --hard ${startSha}${c.reset}`);
            }
            console.log('');
            return;
        }
    }

    if (!hasGit) {
        console.log(`\n  ${c.green}${sym.check}${c.reset} PRD complete (no git repo detected).\n`);
        return;
    }

    const prdFinal = readFileSync(prdPath, 'utf8');
    if (countUncheckedPrdTasks(prdFinal) > 0) {
        console.log(`\n  ${c.yellow}${sym.warn}${c.reset} PRD still has remaining tasks; skipping commit/push.\n`);
        return;
    }

    const visionName = basename(visionPath).replace(/\.md$/, '');
    const commitMessage = `feat: run vision (${visionName})`;

    const addRes = runGit(['add', '-A']);
    if (addRes.status !== 0) {
        console.log(`\n  ${c.red}${sym.cross}${c.reset} git add failed.\n`);
        return;
    }

    const statusRes = runGit(['status', '--porcelain']);
    if (statusRes.status === 0 && String(statusRes.stdout || '').trim().length === 0) {
        console.log(`\n  ${c.green}${sym.check}${c.reset} Nothing to commit.\n`);
        return;
    }

    const commitRes = runGit(['commit', '-m', commitMessage]);
    if (commitRes.status !== 0) {
        console.log(`\n  ${c.red}${sym.cross}${c.reset} git commit failed.\n`);
        return;
    }

    if (!opts.noPush) {
        const pushRes = runGit(['push']);
        if (pushRes.status !== 0) {
            const branch = getCurrentBranch();
            if (branch) {
                runGit(['push', '-u', 'origin', branch]);
            }
        }
    }

    console.log(`\n  ${c.green}${sym.check}${c.reset} Vision complete.`);
    if (startSha) {
        console.log(`  Started from: ${c.dim}${startSha}${c.reset}`);
    }
    console.log('');
}

// ============================================================================
// DASHBOARD (Agent Command Center)
// ============================================================================

async function interactiveVision() {
    console.clear();
    console.log(`  ${c.magenta}${c.bold}
██╗   ██╗██╗███████╗██╗ ██████╗ ███╗   ██╗
██║   ██║██║██╔════╝██║██╔═══██╗████╗  ██║
██║   ██║██║███████╗██║██║   ██║██╔██╗ ██║
╚██╗ ██╔╝██║╚════██║██║██║   ██║██║╚██╗██║
 ╚████╔╝ ██║███████║██║╚██████╔╝██║ ╚████║
  ╚═══╝  ╚═╝╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝
     ${c.reset}`);
    console.log(`  ${c.dim}Write the vision, make it plain.${c.reset}\n`);

    const visionDirPath = join(process.cwd(), 'vision');
    const rootVisionPath = join(process.cwd(), 'VISION.md');

    // Build file list
    const files = [];
    if (existsSync(rootVisionPath)) {
        files.push({
            path: rootVisionPath,
            label: 'VISION.md (Root)',
            type: 'root'
        });
    }

    if (existsSync(visionDirPath) && lstatSync(visionDirPath).isDirectory()) {
        const vFiles = readdirSync(visionDirPath)
            .filter(f => f.endsWith('.md'))
            .map(f => ({
                path: join(visionDirPath, f),
                label: `vision/${f}`,
                type: 'vision'
            }));
        files.push(...vFiles);
    }

    // Actions
    const choices = [];

    if (files.length === 0) {
        console.log(`  ${c.yellow}No vision documents found.${c.reset}\n`);
        console.log(`  ${c.dim}> "Write the vision, and make [it] plain upon tables,${c.reset}`);
        console.log(`  ${c.dim}>  that he may run that readeth it."${c.reset}`);
        console.log(`  ${c.dim}>  — Habakkuk 2:2 (KJV PCE)${c.reset}\n`);
        console.log(`  ${c.bold}Start by defining the core vision for this project.${c.reset}\n`);
        choices.push({ value: 'create_root', label: 'Create Project Vision (VISION.md)', desc: 'The main vision for the project' });
    } else {
        console.log(`  ${c.bold}Existing Documents:${c.reset}`);
        files.forEach(f => console.log(`  - ${f.label}`));
        console.log('');

        choices.push({ value: 'view', label: 'Read / Edit Existing Vision', desc: 'View or modify a vision document' });
        choices.push({ value: 'create_sub', label: 'Add New Vision Document', desc: 'Create a new strategy/roadmap file in vision/' });
    }

    choices.push({ value: 'exit', label: 'Return to Dashboard' });

    const action = await select('Action:', choices);

    if (action === 'exit') return;

    if (action === 'create_root') {
        await initVision('project');
        await interactiveVision(); // Loop back
        return;
    }

    if (action === 'create_sub') {
        const name = await prompt(`  ${c.cyan}Filename${c.reset} (e.g. roadmap, values):\n  > `);
        if (!name) return interactiveVision();

        const filename = name.endsWith('.md') ? name : `${name}.md`;
        const filepath = join(visionDirPath, filename);

        ensureDir(visionDirPath);

        if (existsSync(filepath)) {
            console.log(`  ${c.yellow}File already exists.${c.reset}`);
            // Fall through to edit logic? Or just loop.
            await new Promise(r => setTimeout(r, 1000));
            return interactiveVision();
        }

        // Use a simpler prompt flow for sub-visions
        console.log(`\n  ${c.bold}Opening editor for ${filename}...${c.reset}`);

        const content = `# ${name.replace('.md', '')}\n\n<!-- Vision support document. Describe your thoughts here... -->\n`;

        writeFileSync(filepath, content);
        await openInEditor(filepath);

        console.log(`\n  ${c.green}${sym.check}${c.reset} Created vision/${filename}`);
        await new Promise(r => setTimeout(r, 1000));
        return interactiveVision();
    }

    if (action === 'view') {
        const fileChoices = files.map(f => ({ value: f.path, label: f.label }));
        const targetPath = await select('Select document:', fileChoices);

        if (targetPath) {
            // Read and show content
            const content = readFileSync(targetPath, 'utf8');
            console.clear();
            console.log(`  ${c.bold}Reading: ${basename(targetPath)}${c.reset}\n`);
            console.log(content);
            console.log('\n  ' + '-'.repeat(40) + '\n');

            const subAction = await select('Options:', [
                { value: 'back', label: 'Back to Vision Board' },
                { value: 'edit', label: 'Edit File', desc: `Open in ${process.env.EDITOR || 'default editor'}` }
            ]);

            if (subAction === 'edit') {
                await openInEditor(targetPath);
            }
        }
        return interactiveVision();
    }
}

async function dashboard() {
    // Check if we can run interactive mode
    if (!process.stdin.isTTY) {
        return dashboardStatic();
    }

    const config = loadConfig();
    const tool = config.defaultTool || 'claude';

    const menuItems = [
        { label: 'MANAGE AGENTS', action: 'agents' },
        { label: 'VISION BOARD', action: 'vision' },
        { label: 'EXIT', action: 'exit' }
    ];

    let selectedIndex = 1; // Default to VISION BOARD

    function render() {
        // Clear screen
        process.stdout.write('\x1b[2J\x1b[3J\x1b[H');
        process.stdout.write('\x1b[?25l'); // Hide cursor

        // Header
        console.log(
            `  ${c.magenta}${c.bold}
██╗    ██╗████████╗██╗   ██╗
██║    ██║╚══██╔══╝██║   ██║
██║ █╗ ██║   ██║   ██║   ██║
██║███╗██║   ██║   ╚██╗ ██╔╝
╚███╔███╔╝   ██║    ╚████╔╝ 
 ╚══╝╚══╝    ╚═╝     ╚═══╝  
${c.reset}`
        );

        console.log(`  ${c.dim}v${getVersion()} • ${tool.toUpperCase()} MODE${c.reset}\n`);

        // Menu
        menuItems.forEach((item, idx) => {
            if (idx === selectedIndex) {
                console.log(`  ${c.magenta}❯ ${c.bold}${item.label}${c.reset}`);
            } else {
                console.log(`    ${c.dim}${item.label}${c.reset}`);
            }
        });

        console.log(`\n  ${c.dim}↑/↓: Navigate • Enter: Select${c.reset}`);
    }

    render();

    // Input loop
    process.stdin.setRawMode(true);
    process.stdin.resume();
    emitKeypressEvents(process.stdin);

    return new Promise((resolve) => {
        const handler = async (str, key) => {
            if (key.ctrl && key.name === 'c') {
                process.stdin.setRawMode(false);
                process.stdout.write('\x1b[?25h');
                process.exit();
            }

            if (key.name === 'up') {
                selectedIndex = (selectedIndex - 1 + menuItems.length) % menuItems.length;
                render();
            } else if (key.name === 'down') {
                selectedIndex = (selectedIndex + 1) % menuItems.length;
                render();
            } else if (key.name === 'return') {
                const action = menuItems[selectedIndex].action;

                // Cleanup before action
                process.stdin.removeListener('keypress', handler);
                process.stdin.setRawMode(false);
                process.stdout.write('\x1b[?25h'); // Show cursor

                if (action === 'exit') {
                    process.exit(0);
                } else if (action === 'agents') {
                    await agentsInteractive();
                    await dashboard();
                    resolve();
                } else if (action === 'vision') {
                    await interactiveVision();
                    await dashboard(); // Re-render dashboard after return
                    resolve();
                }
            } else if (key.name === 'q' || key.name === 'escape') {
                process.stdin.setRawMode(false);
                process.stdout.write('\x1b[?25h');
                process.exit(0);
            }
        };

        process.stdin.on('keypress', handler);
    });
}

function dashboardStatic() {
    const pad = centerPad();

    // Banner
    console.log('');
    const wtvAscii = `
  ${c.magenta}${c.bold}██╗    ██╗████████╗██╗   ██╗${c.reset}
  ${c.magenta}${c.bold}██║    ██║╚══██╔══╝██║   ██║${c.reset}
  ${c.magenta}${c.bold}██║ █╗ ██║   ██║   ██║   ██║${c.reset}
  ${c.magenta}${c.bold}██║███╗██║   ██║   ╚██╗ ██╔╝${c.reset}
  ${c.magenta}${c.bold}╚███╔███╔╝   ██║    ╚████╔╝ ${c.reset}
  ${c.magenta}${c.bold} ╚══╝╚══╝    ╚═╝     ╚═══╝  ${c.reset}`;

    console.log(wtvAscii);
    console.log(drawBox([
        `  ${c.dim}v${getVersion()}${c.reset}`,
        `  ${c.dim}By the power of Biblical Artisans${c.reset}`,
        ``,
        `  ${c.green}Run 'wtv meet' to be introduced to the team.${c.reset}`,
    ], { style: 'round', color: c.magenta, padding: 0 }));
    console.log('');

    // Vision status (if exists)
    const visionPath = getVisionPath('project');
    if (visionPath && existsSync(visionPath)) {
        const content = readFileSync(visionPath, 'utf8');
        const sections = parseVisionSections(content);

        console.log(`${pad}${c.bold}VISION${c.reset} ${c.dim}./VISION.md${c.reset}`);
        if (sections.purpose) {
            const preview = sections.purpose.length > 50 ? sections.purpose.slice(0, 50) + '...' : sections.purpose;
            console.log(`${pad}├─ Purpose: ${c.dim}${preview}${c.reset}`);
        }
        if (sections.stage) {
            console.log(`${pad}├─ Stage: ${c.cyan}${sections.stage}${c.reset}`);
        }
        if (sections.focus) {
            const preview = sections.focus.length > 50 ? sections.focus.slice(0, 50) + '...' : sections.focus;
            console.log(`${pad}└─ Focus: ${c.green}${preview}${c.reset}`);
        }
        console.log('');
    }

    // Habakkuk Board summary (if items exist)
    const habakkukPath = join(process.cwd(), HABAKKUK_DIR);
    if (existsSync(habakkukPath)) {
        const byStage = getItemsByStage();
        const totalItems = Object.values(byStage).flat().length;

        if (totalItems > 0) {
            // Count items by stage
            const counts = {};
            for (const stage of HABAKKUK_STAGES) {
                counts[stage] = byStage[stage].length;
            }

            const activeStages = HABAKKUK_STAGES.filter((s) => counts[s] > 0 && s !== 'worship');
            const worshipCount = counts['worship'] || 0;

            console.log(`${pad}${c.bold}HABAKKUK BOARD${c.reset} ${c.dim}"Write the vision, make it plain"${c.reset}`);

            if (activeStages.length > 0) {
                const parts = activeStages.map((s) => `${HABAKKUK_STAGE_LABELS[s]}: ${c.cyan}${counts[s]}${c.reset}`);
                console.log(`${pad}├─ ${parts.join(' • ')}`);
            }

            if (worshipCount > 0) {
                console.log(`${pad}└─ ${c.yellow}★${c.reset} ${worshipCount} completed (Stones of Remembrance)`);
            } else if (activeStages.length > 0) {
                console.log(`${pad}└─ ${c.dim}View full board:${c.reset} ${c.green}wtv board${c.reset}`);
            }

            console.log('');
        }
    }

    // Discover agents
    const localAgents = discoverAgents('local');
    const globalAgents = discoverAgents('global');

    const star = isWindows ? '*' : '★';
    const noStar = ' ';

    // Local agents
    if (localAgents.length > 0) {
        console.log(`${pad}${c.bold}LOCAL AGENTS${c.reset} ${c.dim}(.claude/agents/ or .opencode/agent/)${c.reset}`);
        for (const agent of localAgents) {
            const fav = agent.favorite ? `${c.yellow}${star}${c.reset}` : noStar;
            const desc = agent.description.length > 40 ? agent.description.slice(0, 40) + '...' : agent.description;
            console.log(`${pad}  ${fav} ${c.cyan}${agent.name.padEnd(22)}${c.reset} ${c.dim}${desc}${c.reset}`);
        }
        console.log('');
    }

    // Global agents
    if (globalAgents.length > 0) {
        console.log(`${pad}${c.bold}GLOBAL AGENTS${c.reset} ${c.dim}(~/.claude/agents/)${c.reset}`);
        for (const agent of globalAgents.slice(0, 5)) { // Show top 5
            const fav = agent.favorite ? `${c.yellow}${star}${c.reset}` : noStar;
            const desc = agent.description.length > 40 ? agent.description.slice(0, 40) + '...' : agent.description;
            console.log(`${pad}  ${fav} ${c.cyan}${agent.name.padEnd(22)}${c.reset} ${c.dim}${desc}${c.reset}`);
        }
        if (globalAgents.length > 5) {
            console.log(`${pad}  ${c.dim}... and ${globalAgents.length - 5} more${c.reset}`);
        }
        console.log('');
    }

    // No agents found
    if (localAgents.length === 0 && globalAgents.length === 0) {
        console.log(`${pad}${c.yellow}${sym.warn}${c.reset} No agents found.\n`);
        console.log(`${pad}Run ${c.cyan}wtv init${c.reset} to install Paul and the Artisans.`);
        console.log('');
        return;
    }

    // Quick actions
    console.log(`${pad}${c.dim}Quick actions:${c.reset}`);
    console.log(`${pad}  ${c.green}wtv agents${c.reset}            ${c.dim}List all agents${c.reset}`);
    console.log(`${pad}  ${c.green}wtv agents add <name>${c.reset} ${c.dim}Create new agent${c.reset}`);
    console.log(`${pad}  ${c.green}wtv agents fav <name>${c.reset} ${c.dim}Toggle favorite${c.reset}`);
    console.log(`${pad}  ${c.green}wtv init${c.reset}             ${c.dim}Install/update agents${c.reset}`);
    console.log('');
}

// ============================================================================
// AGENT COMMANDS
// ============================================================================

async function agentsInteractive() {
    // 1. Gather all potential agents match against scopes
    const templatesPath = join(TEMPLATES_DIR, 'agents');
    if (!existsSync(templatesPath)) {
        console.log(`\n  ${c.red}Error:${c.reset} Templates not found at ${templatesPath}`);
        return;
    }

    const templateFiles = readdirSync(templatesPath).filter(f => f.endsWith('.md'));

    // Sort logic: Favorites first, then alpha
    const getSortKey = (name, isFav) => (isFav ? '0-' : '1-') + name;

    const locations = getAgentLocations();
    // Helper to get installed path for a scope
    const getInstallPath = (scope) => {
        const loc = locations.find(l => l.scope === scope);
        return loc ? loc.path : null;
    };

    const localPath = getInstallPath('local');
    const globalPath = getInstallPath('global');

    // Build unified agent list
    let agents = templateFiles.map(file => {
        const fullPath = join(templatesPath, file);
        const data = parseAgentFile(fullPath);
        if (!data) return null;

        const isLocal = localPath && existsSync(join(localPath, file));
        const isGlobal = globalPath && existsSync(join(globalPath, file));

        return {
            ...data,
            fileName: file,
            // Source of truth
            isLocal,
            isGlobal,
            // Pending state: Default to TRUE (Auto-Select All)
            wantsLocal: true,
            wantsGlobal: true
        };
    }).filter(a => a !== null);

    // Initial Sort
    agents.sort((a, b) => getSortKey(a.name, a.favorite).localeCompare(getSortKey(b.name, b.favorite)));

    let selectedIndex = 0;

    // No more sub-menu!

    const render = () => {
        // Clear screen
        process.stdout.write('\x1b[2J\x1b[H');

        console.log(`  ${c.bold}${c.magenta}wtv${c.reset} ${c.dim}Agent Manager${c.reset}\n`);

        const sidebarWidth = 35;
        const star = isWindows ? '*' : '★';

        // Header for columns
        console.log(`  ${c.dim}   [L] [G]  NAME${c.reset}`);

        for (let i = 0; i < agents.length; i++) {
            const agent = agents[i];
            const isSelected = i === selectedIndex;
            const isFav = agent.favorite;

            const cursor = isSelected ? c.magenta + sym.arrow + c.reset : ' ';
            const favIcon = isFav ? c.yellow + star + c.reset : ' ';

            // Status indicators with changed state logic
            // We use specific colors for local vs global columns to differentiate columns visually? 
            // Actually reusing logic is clearer. Let's tweak slightly for "Global" vs "Local" letters.
            const localIndRaw = agent.wantsLocal ? (agent.isLocal ? c.green + '[L]' : c.green + '[+]') : (agent.isLocal ? c.red + '[-]' : c.dim + '[ ]');
            const globalIndRaw = agent.wantsGlobal ? (agent.isGlobal ? c.blue + '[G]' : c.blue + '[+]') : (agent.isGlobal ? c.red + '[-]' : c.dim + '[ ]');

            // Restore color reset
            const localInd = localIndRaw + c.reset;
            const globalInd = globalIndRaw + c.reset;

            // Formatting
            const nameColor = isSelected ? c.magenta + c.bold : (isFav ? c.reset : c.dim);

            // Construct line
            let line = `  ${cursor} ${localInd} ${globalInd}  ${nameColor}${agent.name.padEnd(14)}${c.reset}`;
            line += c.dim + ' │ ' + c.reset;

            if (i < 20) {
                process.stdout.write(line + '\n');
            }
        }

        // --- Detail Pane ---
        const detailStartY = 4;
        const detailStartX = sidebarWidth + 5;
        const agent = agents[selectedIndex];

        // Status Text
        let statusText = '';
        if (agent.wantsLocal) statusText += c.green + 'Local ' + c.reset;
        if (agent.wantsGlobal) statusText += c.blue + 'Global ' + c.reset;
        if (!agent.wantsLocal && !agent.wantsGlobal) statusText = c.dim + 'None' + c.reset;

        const terminalWidth = process.stdout.columns || 80;
        const detailWidth = Math.max(20, terminalWidth - detailStartX - 1);
        const nameBanner = renderBlockText(agent.name, { maxWidth: detailWidth, color: c.magenta, bold: true });

        const details = [
            nameBanner,
            `Status: ${statusText}`,
            '',
            `${c.dim}${agent.description}${c.reset}`,
        ];

        // Draw details
        const allDetailLines = details.flatMap(d => d.split('\n'));
        for (let i = 0; i < allDetailLines.length; i++) {
            process.stdout.write(`\x1b[${detailStartY + i};${detailStartX}H${allDetailLines[i]}`);
        }

        // Footer
        process.stdout.write(`\x1b[${Math.max(agents.length + 6, 25)};1H`);

        // Calc pending changes
        let pendingCount = 0;
        agents.forEach(a => {
            if (a.isLocal !== a.wantsLocal) pendingCount++;
            if (a.isGlobal !== a.wantsGlobal) pendingCount++;
        });

        const actionPrompt = pendingCount > 0
            ? `${c.yellow}Enter: Apply ${pendingCount} Changes${c.reset}`
            : `${c.dim}Enter: Done${c.reset}`;

        console.log(`\n  ${c.dim}L: Toggle Local • G: Toggle Global • ${actionPrompt} ${c.dim}• Esc: Cancel${c.reset}`);
    };

    render();

    // Input Handling
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) process.stdin.setRawMode(true);

    return new Promise((resolve) => {
        const applyChanges = () => {
            let changed = false;

            // Process all agents
            agents.forEach(agent => {
                // LOCAL
                if (localPath && agent.isLocal !== agent.wantsLocal) {
                    const dest = join(localPath, agent.fileName);
                    if (agent.wantsLocal) {
                        ensureDir(localPath);
                        copyFileSync(agent.path, dest);
                    } else {
                        if (existsSync(dest)) fs.unlinkSync(dest);
                    }
                    changed = true;
                }

                // GLOBAL
                if (globalPath && agent.isGlobal !== agent.wantsGlobal) {
                    const dest = join(globalPath, agent.fileName);
                    if (agent.wantsGlobal) {
                        ensureDir(globalPath);
                        copyFileSync(agent.path, dest);
                    } else {
                        if (existsSync(dest)) fs.unlinkSync(dest);
                    }
                    changed = true;
                }
            });

            if (changed) {
                console.log(`\n  ${c.green}${sym.check}${c.reset} Changes applied.`);
            }
        };

        const onKey = async (str, key) => {
            if (key.ctrl && key.name === 'c') {
                cleanup(); process.exit();
            }

            if (key.name === 'up') {
                selectedIndex = (selectedIndex - 1 + agents.length) % agents.length;
                render();
            } else if (key.name === 'down') {
                selectedIndex = (selectedIndex + 1) % agents.length;
                render();
            } else if (key.name === 'l') {
                if (key.shift) {
                    // Toggle ALL based on majority
                    const installCount = agents.filter(a => a.wantsLocal).length;
                    const majorityInstalled = installCount >= (agents.length / 2);
                    const targetState = !majorityInstalled;
                    agents.forEach(a => a.wantsLocal = targetState);
                } else {
                    const agent = agents[selectedIndex];
                    agent.wantsLocal = !agent.wantsLocal;
                }
                render();
            } else if (key.name === 'g') {
                if (key.shift) {
                    // Toggle ALL based on majority
                    const installCount = agents.filter(a => a.wantsGlobal).length;
                    const majorityInstalled = installCount >= (agents.length / 2);
                    const targetState = !majorityInstalled;
                    agents.forEach(a => a.wantsGlobal = targetState);
                } else {
                    const agent = agents[selectedIndex];
                    agent.wantsGlobal = !agent.wantsGlobal;
                }
                render();
            } else if (key.name === 'space') {
                // Toggle Favorite (Still instant for config)
                const agent = agents[selectedIndex];
                agent.favorite = !agent.favorite;
                toggleFavorite(agent.name);
                render();
            } else if (key.name === 'return') {
                cleanup();
                applyChanges();
                resolve();
            } else if (key.name === 'q' || key.name === 'escape') {
                cleanup();
                resolve();
            }
        };

        const cleanup = () => {
            process.stdin.removeListener('keypress', onKey);
            if (process.stdin.isTTY) process.stdin.setRawMode(false);
            rl.close();
            process.stdout.write('\x1b[2J\x1b[H');
        };

        process.stdin.on('keypress', onKey);
    });
}

async function agentsList() {
    if (process.stdout.isTTY && !process.env.NON_INTERACTIVE) {
        await agentsInteractive();
        return;
    }

    const pad = centerPad();

    console.log('');
    console.log(drawBox([
        `  ${c.bold}${c.magenta}wtv${c.reset} ${c.dim}agents${c.reset}`,
    ], { style: 'round', color: c.magenta, padding: 0 }));
    console.log('');

    const localAgents = discoverAgents('local');
    const globalAgents = discoverAgents('global');

    const star = isWindows ? '*' : '★';
    const noStar = ' ';

    if (localAgents.length > 0) {
        console.log(`${pad}${c.bold}LOCAL${c.reset} ${c.dim}(project-level)${c.reset}`);
        for (const agent of localAgents) {
            const fav = agent.favorite ? `${c.yellow}${star}${c.reset}` : noStar;
            console.log(`${pad}  ${fav} ${c.cyan}${agent.name.padEnd(24)}${c.reset} ${c.dim}${agent.description.slice(0, 45)}${c.reset}`);
        }
        console.log('');
    }

    if (globalAgents.length > 0) {
        console.log(`${pad}${c.bold}GLOBAL${c.reset} ${c.dim}(~/.claude/agents/)${c.reset}`);
        for (const agent of globalAgents) {
            const fav = agent.favorite ? `${c.yellow}${star}${c.reset}` : noStar;
            console.log(`${pad}  ${fav} ${c.cyan}${agent.name.padEnd(24)}${c.reset} ${c.dim}${agent.description.slice(0, 45)}${c.reset}`);
        }
        console.log('');
    }

    if (localAgents.length === 0 && globalAgents.length === 0) {
        console.log(`${pad}${c.yellow}${sym.warn}${c.reset} No agents found.`);
        console.log(`${pad}${c.dim}Run 'wtv init' to install agents.${c.reset}`);
        console.log('');
    }
}

async function agentsInfo(name) {
    const pad = centerPad();
    const agent = findAgent(name);

    if (!agent) {
        console.log(`\n${pad}${c.red}${sym.cross}${c.reset} Agent not found: ${name}`);
        console.log(`${pad}${c.dim}Run 'wtv agents' to see available agents.${c.reset}\n`);
        return;
    }

    const star = isWindows ? '*' : '★';

    console.log('');
    console.log(drawBox([
        `  ${c.bold}${agent.name}${c.reset}`,
        agent.favorite ? `  ${c.yellow}${star} Favorite${c.reset}` : '',
    ].filter(Boolean), { style: 'round', color: c.cyan, padding: 0 }));
    console.log('');

    console.log(`${pad}${c.bold}Description${c.reset}`);
    console.log(`${pad}  ${agent.description}`);
    console.log('');

    console.log(`${pad}${c.bold}Details${c.reset}`);
    console.log(`${pad}  Model: ${c.cyan}${agent.model}${c.reset}`);
    console.log(`${pad}  Tools: ${c.dim}${agent.tools.join(', ') || 'none'}${c.reset}`);
    console.log(`${pad}  Skills: ${c.dim}${agent.skills.join(', ') || 'none'}${c.reset}`);
    console.log('');

    console.log(`${pad}${c.bold}Location${c.reset}`);
    console.log(`${pad}  ${c.dim}${agent.path}${c.reset}`);
    console.log('');

    console.log(`${pad}${c.dim}Actions:${c.reset}`);
    console.log(`${pad}  ${c.green}wtv agents edit ${agent.name}${c.reset}`);
    console.log(`${pad}  ${c.green}wtv agents fav ${agent.name}${c.reset}`);
    console.log('');
}

function agentsFav(name, scope = 'project') {
    const pad = centerPad();
    const agent = findAgent(name);

    if (!agent) {
        console.log(`\n${pad}${c.red}${sym.cross}${c.reset} Agent not found: ${name}`);
        console.log(`${pad}${c.dim}Run 'wtv agents' to see available agents.${c.reset}\n`);
        return;
    }

    const nowFavorite = toggleFavorite(agent.name, scope);
    const star = isWindows ? '*' : '★';

    if (nowFavorite) {
        console.log(`\n${pad}${c.yellow}${star}${c.reset} ${c.bold}${agent.name}${c.reset} is now a favorite.\n`);
    } else {
        console.log(`\n${pad}${c.dim}${sym.bullet}${c.reset} ${c.bold}${agent.name}${c.reset} removed from favorites.\n`);
    }
}

async function agentsAdd(name, scope = 'project') {
    const pad = centerPad();

    if (!name) {
        name = await prompt(`${pad}Agent name (e.g., my-artisan): `);
        if (!name.trim()) {
            console.log(`\n${pad}${c.red}${sym.cross}${c.reset} Name required.\n`);
            return;
        }
        name = name.trim().toLowerCase().replace(/\s+/g, '-');
    }

    // Check if already exists
    const existing = findAgent(name);
    if (existing) {
        console.log(`\n${pad}${c.yellow}${sym.warn}${c.reset} Agent '${name}' already exists at:`);
        console.log(`${pad}  ${c.dim}${existing.path}${c.reset}\n`);
        return;
    }

    const description = await prompt(`${pad}Description: `);

    // Determine target directory
    const targetDir = scope === 'global'
        ? join(getHomedir(), '.claude', 'agents')
        : join(process.cwd(), '.claude', 'agents');

    ensureDir(targetDir);

    const content = createAgentFromTemplate(name, description || 'Custom agent');
    const filePath = join(targetDir, `${name}.md`);

    writeFileSync(filePath, content);

    console.log(`\n${pad}${c.green}${sym.check}${c.reset} Created: ${c.cyan}${name}${c.reset}`);
    console.log(`${pad}  ${c.dim}${filePath}${c.reset}`);
    console.log(`\n${pad}Edit with: ${c.green}wtv agents edit ${name}${c.reset}\n`);
}

async function agentsEdit(name) {
    const pad = centerPad();
    const agent = findAgent(name);

    if (!agent) {
        console.log(`\n${pad}${c.red}${sym.cross}${c.reset} Agent not found: ${name}`);
        console.log(`${pad}${c.dim}Run 'wtv agents' to see available agents.${c.reset}\n`);
        return;
    }

    const config = loadConfig();
    const editor = config.editor || process.env.EDITOR || 'vim';

    console.log(`\n${pad}Opening ${c.cyan}${agent.name}${c.reset} in ${editor}...`);

    const { execSync } = await import('child_process');
    try {
        execSync(`${editor} "${agent.path}"`, { stdio: 'inherit' });
        console.log(`${pad}${c.green}${sym.check}${c.reset} Done.\n`);
    } catch (err) {
        console.log(`${pad}${c.red}${sym.cross}${c.reset} Failed to open editor: ${err.message}\n`);
    }
}

async function agentsRemove(name) {
    const pad = centerPad();
    const agent = findAgent(name);

    if (!agent) {
        console.log(`\n${pad}${c.red}${sym.cross}${c.reset} Agent not found: ${name}`);
        console.log(`${pad}${c.dim}Run 'wtv agents' to see available agents.${c.reset}\n`);
        return;
    }

    console.log(`\n${pad}${c.yellow}${sym.warn}${c.reset} About to remove: ${c.bold}${agent.name}${c.reset}`);
    console.log(`${pad}  ${c.dim}${agent.path}${c.reset}\n`);

    const confirmed = await confirm(`${pad}Are you sure?`, false);

    if (!confirmed) {
        console.log(`\n${pad}${c.dim}Cancelled.${c.reset}\n`);
        return;
    }

    rmSync(agent.path);
    console.log(`\n${pad}${c.green}${sym.check}${c.reset} Removed: ${agent.name}\n`);
}

function showVisionStatus(scope) {
    const visionPath = getVisionPath(scope);

    console.log(`\n  ${c.bold}wtv${c.reset} v${getVersion()}`);
    console.log(`  ${c.bold}Vision Status${c.reset}\n`);

    if (!visionPath || !existsSync(visionPath)) {
        console.log(`  ${c.yellow}${sym.warn}${c.reset} No VISION.md found.`);
        console.log(`  ${c.dim}Run 'wtv init' to create one.${c.reset}\n`);
        return;
    }

    const content = readFileSync(visionPath, 'utf8');
    const sections = parseVisionSections(content);

    console.log(`  ${c.dim}Path:${c.reset} ${visionPath}\n`);

    const sectionNames = {
        purpose: 'Purpose',
        outcomes: 'Outcomes',
        values: 'Values',
        constraints: 'Constraints',
        stage: 'Stage',
        focus: 'Current Focus',
    };

    let filledCount = 0;
    const totalCount = Object.keys(sections).length;

    for (const [key, value] of Object.entries(sections)) {
        const name = sectionNames[key];
        if (value) {
            filledCount++;
            const preview = value.length > 60 ? value.substring(0, 60) + '...' : value;
            console.log(`  ${c.green}${sym.check}${c.reset} ${name}: ${c.dim}${preview}${c.reset}`);
        } else {
            console.log(`  ${c.dim}${sym.bullet} ${name}: (blank)${c.reset}`);
        }
    }

    console.log(`\n  ${c.bold}Summary:${c.reset} ${filledCount}/${totalCount} sections populated`);

    if (filledCount < totalCount) {
        console.log(`  ${c.dim}Edit VISION.md directly to add more detail.${c.reset}`);
    }

    console.log('');
}

// ============================================================================
// Task Logging
// ============================================================================

function getLogsDir(scope) {
    const base = scope === 'global'
        ? (() => {
            const home = getHomedir();
            return home || null;
        })()
        : process.cwd();

    if (!base) return null;

    const wtv = join(base, WTV_LOGS_DIR);
    if (existsSync(wtv)) return wtv;

    const legacy = join(base, LEGACY_LOGS_DIR);
    if (existsSync(legacy)) return legacy;

    // Default to new location (created on first write)
    return wtv;
}

function showLogs(scope, opts = {}) {
    const logsDir = getLogsDir(scope);

    console.log(`\n  ${c.bold}wtv${c.reset} v${getVersion()}`);
    console.log(`  ${c.bold}Task Logs${c.reset}\n`);

    if (!logsDir || !existsSync(logsDir)) {
        console.log(`  ${c.dim}No logs found.${c.reset}`);
        console.log(`  ${c.dim}Logs are created when you run /wtv commands.${c.reset}\n`);
        return;
    }

    // Get date directories
    const dateDirs = readdirSync(logsDir)
        .filter(d => {
            const p = join(logsDir, d);
            return statSync(p).isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(d);
        })
        .sort()
        .reverse();

    if (dateDirs.length === 0) {
        console.log(`  ${c.dim}No logs found.${c.reset}\n`);
        return;
    }

    // Filter by date if specified
    const targetDate = opts.date;
    const taskId = opts.task;

    // If task ID specified, find and show that task
    if (taskId) {
        for (const dateDir of dateDirs) {
            const taskPath = join(logsDir, dateDir, `${taskId}.md`);
            if (existsSync(taskPath)) {
                console.log(`  ${c.dim}Date:${c.reset} ${dateDir}`);
                console.log(`  ${c.dim}Task:${c.reset} ${taskId}\n`);
                const content = readFileSync(taskPath, 'utf8');
                console.log(content);
                return;
            }
        }
        console.log(`  ${c.yellow}${sym.warn}${c.reset} Task not found: ${taskId}\n`);
        return;
    }

    // Show logs by date
    const filteredDates = targetDate
        ? dateDirs.filter(d => d === targetDate)
        : dateDirs.slice(0, 5); // Show last 5 days by default

    if (filteredDates.length === 0) {
        console.log(`  ${c.dim}No logs found for date: ${targetDate}${c.reset}\n`);
        return;
    }

    for (const dateDir of filteredDates) {
        const datePath = join(logsDir, dateDir);
        const tasks = readdirSync(datePath)
            .filter(f => f.endsWith('.md'))
            .sort();

        if (tasks.length === 0) continue;

        console.log(`  ${c.bold}${dateDir}${c.reset}`);

        for (const task of tasks) {
            const taskId = task.replace('.md', '');
            const taskPath = join(datePath, task);
            const content = readFileSync(taskPath, 'utf8');

            // Extract status from log
            const statusMatch = content.match(/\*\*Status:\*\*\s*(\w+)/);
            const status = statusMatch ? statusMatch[1] : 'Unknown';

            // Extract mode from log
            const modeMatch = content.match(/\*\*Mode:\*\*\s*(\w+)/);
            const mode = modeMatch ? modeMatch[1] : '';

            const statusIcon = status === 'Completed' ? c.green + sym.check : c.yellow + sym.bullet;

            console.log(`    ${statusIcon}${c.reset} ${taskId} ${c.dim}(${mode})${c.reset}`);
        }

        console.log('');
    }

    console.log(`  ${c.dim}Use 'wtv log --task <id>' to view a specific task.${c.reset}\n`);
}

function showHelp() {
    printBanner();

    const pad = centerPad();
    console.log(`${pad}${c.bold}Usage${c.reset}`);
    console.log(`${pad}  wtv [command] [options]\n`);

    console.log(`${pad}${c.bold}Commands${c.reset}`);
    console.log(`${pad}  ${c.cyan}(no command)${c.reset}  Dashboard - show agents and vision`);
    console.log(`${pad}  ${c.cyan}agents${c.reset}        List and manage agents`);
    console.log(`${pad}  ${c.cyan}init${c.reset}          Install agents and create VISION.md`);
    console.log(`${pad}  ${c.cyan}update${c.reset}        Update installed tools`);
    console.log(`${pad}  ${c.cyan}uninstall${c.reset}     Remove installed tools`);
    console.log(`${pad}  ${c.cyan}status${c.reset}        Show installation status`);
    console.log(`${pad}  ${c.cyan}vision${c.reset}        Show VISION.md status`);
    console.log(`${pad}  ${c.cyan}log${c.reset}           Show task logs`);
    console.log(`${pad}  ${c.cyan}meet${c.reset}          Meet Paul and the Artisans`);
    console.log(`${pad}  ${c.cyan}run${c.reset}           Run the vision (PRD loop)`);
    console.log(`${pad}  ${c.cyan}help${c.reset}          Show this help\n`);

    console.log(`${pad}${c.bold}Agent Commands${c.reset}`);
    console.log(`${pad}  ${c.cyan}agents${c.reset}              List all agents`);
    console.log(`${pad}  ${c.cyan}agents info${c.reset} <name>  Show agent details`);
    console.log(`${pad}  ${c.cyan}agents add${c.reset} <name>   Create new agent`);
    console.log(`${pad}  ${c.cyan}agents edit${c.reset} <name>  Open in $EDITOR`);
    console.log(`${pad}  ${c.cyan}agents fav${c.reset} <name>   Toggle favorite`);
    console.log(`${pad}  ${c.cyan}agents rm${c.reset} <name>    Remove agent\n`);

    console.log(`${pad}${c.bold}Habakkuk Workflow${c.reset}  ${c.dim}"Write the vision, make it plain"${c.reset}`);
    console.log(`${pad}  ${c.cyan}board${c.reset} [--all]        Show kanban board`);
    console.log(`${pad}  ${c.cyan}cry${c.reset} "desc"          Enter a problem or need`);
    console.log(`${pad}  ${c.cyan}wait${c.reset} <id>           Move to waiting (seeking)`);
    console.log(`${pad}  ${c.cyan}vision${c.reset} <id>         Move to vision (answer received)`);
    console.log(`${pad}  ${c.cyan}run${c.reset} [id]           Run the vision, or move item to run`);
    console.log(`${pad}  ${c.cyan}worship${c.reset} <id>        Move to worship (retrospective)`);
    console.log(`${pad}  ${c.cyan}note${c.reset} <id> "text"    Add note to item`);
    console.log(`${pad}  ${c.cyan}item${c.reset} <id>           Show item details`);
    console.log(`${pad}  ${c.cyan}stones${c.reset}              View completed works\n`);

    console.log(`${pad}${c.bold}Options${c.reset}`);
    console.log(`${pad}  ${c.dim}--global, -g${c.reset}      Global scope`);
    console.log(`${pad}  ${c.dim}--local, -l${c.reset}       Project scope (default)`);
    console.log(`${pad}  ${c.dim}--force, -f${c.reset}       Overwrite existing`);
    console.log(`${pad}  ${c.dim}--tool <tool>${c.reset}     Tool: claude | codex | opencode | gemini | antigravity`);
    console.log(`${pad}  ${c.dim}--path <dir>${c.reset}      Install/check a custom directory`);
    console.log(`${pad}  ${c.dim}--claude${c.reset}          Target Claude Code`);
    console.log(`${pad}  ${c.dim}--codex${c.reset}           Target Codex CLI`);
    console.log(`${pad}  ${c.dim}--opencode${c.reset}         Target OpenCode`);
    console.log(`${pad}  ${c.dim}--gemini${c.reset}           Target Gemini CLI`);
    console.log(`${pad}  ${c.dim}--antigravity${c.reset}      Target Antigravity\n`);

    console.log(`${pad}${c.bold}Examples${c.reset}`);
    console.log(`${pad}  ${c.green}wtv${c.reset}                          ${c.dim}# Dashboard${c.reset}`);
    console.log(`${pad}  ${c.green}wtv agents${c.reset}                   ${c.dim}# List agents${c.reset}`);
    console.log(`${pad}  ${c.green}wtv init --claude${c.reset}            ${c.dim}# Install for Claude Code${c.reset}`);
    console.log(`${pad}  ${c.green}wtv init --opencode${c.reset}          ${c.dim}# Install for OpenCode${c.reset}`);
    console.log(`${pad}  ${c.green}wtv init --codex${c.reset}            ${c.dim}# Install for Codex CLI${c.reset}`);
    console.log(`${pad}  ${c.green}wtv run${c.reset}                      ${c.dim}# Execute a vision with PRD.md${c.reset}`);
    console.log(`${pad}  ${c.green}wtv board --all${c.reset}              ${c.dim}# Show full kanban board${c.reset}`);
    console.log(`${pad}  ${c.green}wtv uninstall --tool opencode${c.reset} ${c.dim}# Remove OpenCode install${c.reset}`);
    console.log('');
}

function parseArgs(args) {
    const opts = {
        command: null,
        subcommand: null,
        agentName: null,
        global: false,
        local: false,
        force: false,
        path: null,
        tools: [],
        task: null,
        date: null,
        all: false,

        // Vision Runner (Ralphy-style)
        engine: null,
        vision: null,
        resume: false,
        regeneratePrd: false,
        maxIterations: 0,
        dryRun: false,
        fast: false,
        noTests: false,
        noLint: false,
        noPush: false,
    };

    let positionalCount = 0;

    for (let i = 0; i < args.length; i++) {
        const a = args[i];

        if (a === '--help' || a === '-h') {
            opts.command = 'help';
            continue;
        }

        if (a === '--version' || a === '-v') {
            opts.command = 'version';
            continue;
        }

        if (a === '--global' || a === '-g') {
            opts.global = true;
            continue;
        }

        if (a === '--local' || a === '-l') {
            opts.local = true;
            continue;
        }

        if (a === '--force' || a === '-f') {
            opts.force = true;
            continue;
        }

        if (a === '--all') {
            opts.all = true;
            continue;
        }

        if (a === '--vision') {
            const v = args[i + 1];
            if (!v || v.startsWith('-')) {
                throw new Error("--vision requires a file path (e.g. '--vision vision/roadmap.md')");
            }
            opts.vision = v;
            i++;
            continue;
        }

        if (a === '--engine') {
            const v = args[i + 1];
            if (!v || v.startsWith('-')) {
                throw new Error("--engine requires a value: opencode | codex | claude");
            }
            opts.engine = v;
            i++;
            continue;
        }

        if (a === '--resume') {
            opts.resume = true;
            continue;
        }

        if (a === '--regenerate-prd') {
            opts.regeneratePrd = true;
            continue;
        }

        if (a === '--max-iterations') {
            const v = args[i + 1];
            if (!v || v.startsWith('-')) {
                throw new Error("--max-iterations requires a number (e.g. '--max-iterations 3')");
            }
            const n = parseInt(v, 10);
            if (Number.isNaN(n) || n < 0) {
                throw new Error('--max-iterations must be a non-negative number');
            }
            opts.maxIterations = n;
            i++;
            continue;
        }

        if (a === '--dry-run') {
            opts.dryRun = true;
            continue;
        }

        if (a === '--no-push') {
            opts.noPush = true;
            continue;
        }

        if (a === '--no-tests' || a === '--skip-tests') {
            opts.noTests = true;
            continue;
        }

        if (a === '--no-lint' || a === '--skip-lint') {
            opts.noLint = true;
            continue;
        }

        if (a === '--fast') {
            opts.fast = true;
            opts.noTests = true;
            opts.noLint = true;
            continue;
        }

        if (a === '--path') {
            const v = args[i + 1];
            if (!v || v.startsWith('-')) {
                throw new Error("--path requires a directory (e.g. '--path /tmp/my-claude')");
            }
            opts.path = v;
            i++;
            continue;
        }

        if (a === '--tool') {
            const v = args[i + 1];
            if (!v || v.startsWith('-')) {
                throw new Error("--tool requires a value: claude | codex | opencode");
            }
            opts.tools.push(v);
            i++;
            continue;
        }

        if (a === '--claude') {
            opts.tools.push('claude');
            continue;
        }

        if (a === '--codex') {
            opts.tools.push('codex');
            continue;
        }

        if (a === '--opencode') {
            opts.tools.push('opencode');
            continue;
        }

        if (a === '--gemini') {
            opts.tools.push('gemini');
            continue;
        }

        if (a === '--antigravity') {
            opts.tools.push('antigravity');
            continue;
        }

        if (a === '--task') {
            const v = args[i + 1];
            if (!v || v.startsWith('-')) {
                throw new Error("--task requires a task id (e.g. '--task 2026-01-15-001')");
            }
            opts.task = v;
            i++;
            continue;
        }

        if (a === '--date') {
            const v = args[i + 1];
            if (!v || v.startsWith('-')) {
                throw new Error("--date requires YYYY-MM-DD (e.g. '--date 2026-01-15')");
            }
            opts.date = v;
            i++;
            continue;
        }

        if (a.startsWith('-')) {
            throw new Error(`Unknown option: ${a}`);
        }

        // Positional arguments
        positionalCount++;
        if (positionalCount === 1) {
            opts.command = a;
        } else if (positionalCount === 2) {
            opts.subcommand = a;
        } else if (positionalCount === 3) {
            opts.agentName = a;
        }
    }

    return opts;
}

export async function run(args) {
    let opts;
    try {
        opts = parseArgs(args);
    } catch (err) {
        console.log(`\n  ${c.red}Error:${c.reset} ${err.message}\n`);
        showHelp();
        process.exit(1);
    }

    const scope = opts.global ? 'global' : 'project';

    if (opts.command !== 'version') {
        await checkForUpdates();
    }

    switch (opts.command) {
        case 'init': {
            const nonInteractive = opts.global || opts.local || opts.force || opts.path || opts.tools.length > 0;
            if (nonInteractive) {
                initNonInteractive(scope, opts.force, opts.tools, opts.path);
            } else {
                if (!process.stdout.isTTY) {
                    console.log(`\n  ${c.red}Error:${c.reset} init requires interactive TTY, or pass flags.`);
                    console.log(`  Example: wtv init --claude\n`);
                    process.exit(1);
                }
                await interactiveInit();
            }
            break;
        }

        case 'update': {
            update(scope, opts.tools, opts.path);
            break;
        }

        case 'uninstall':
        case 'remove': {
            if (opts.path && opts.tools.length === 0) {
                console.log(`\n  ${c.red}Error:${c.reset} uninstall with --path requires --tool.\n`);
                process.exit(1);
            }

            if (opts.tools.length > 0) {
                uninstall(scope, opts.tools, opts.path);
            } else if (process.stdout.isTTY) {
                await uninstallInteractive(scope);
            } else {
                console.log(`\n  ${c.red}Error:${c.reset} uninstall requires --tool when not running interactively.\n`);
                process.exit(1);
            }
            break;
        }

        case 'status': {
            status(opts.path);
            break;
        }

        case 'vision': {
            // If subcommand is provided, it's a Habakkuk stage transition
            // Otherwise, show VISION.md status
            if (opts.subcommand) {
                habakkukVision(opts.subcommand);
            } else {
                showVisionStatus(scope);
            }
            break;
        }

        case 'meet':
        case 'team': {
            await meetTheTeam();
            break;
        }

        case 'log':
        case 'logs': {
            showLogs(scope, { task: opts.task, date: opts.date });
            break;
        }

        case 'agents':
        case 'agent': {
            // Handle subcommands: list, info, add, edit, fav, remove
            const subcommand = opts.subcommand;
            const agentName = opts.agentName;

            switch (subcommand) {
                case 'list':
                case null:
                case undefined:
                    await agentsList();
                    break;
                case 'info':
                    if (!agentName) {
                        console.log(`\n  ${c.red}Error:${c.reset} Agent name required.`);
                        console.log(`  Usage: wtv agents info <name>\n`);
                    } else {
                        await agentsInfo(agentName);
                    }
                    break;
                case 'add':
                case 'new':
                case 'create':
                    await agentsAdd(agentName, scope);
                    break;
                case 'edit':
                    if (!agentName) {
                        console.log(`\n  ${c.red}Error:${c.reset} Agent name required.`);
                        console.log(`  Usage: wtv agents edit <name>\n`);
                    } else {
                        await agentsEdit(agentName);
                    }
                    break;
                case 'fav':
                case 'favorite':
                case 'star':
                    if (!agentName) {
                        console.log(`\n  ${c.red}Error:${c.reset} Agent name required.`);
                        console.log(`  Usage: wtv agents fav <name>\n`);
                    } else {
                        agentsFav(agentName, scope);
                    }
                    break;
                case 'remove':
                case 'rm':
                case 'delete':
                    if (!agentName) {
                        console.log(`\n  ${c.red}Error:${c.reset} Agent name required.`);
                        console.log(`  Usage: wtv agents remove <name>\n`);
                    } else {
                        await agentsRemove(agentName);
                    }
                    break;
                default:
                    // Assume subcommand is an agent name for quick info
                    await agentsInfo(subcommand);
            }
            break;
        }

        // ===== HABAKKUK WORKFLOW COMMANDS =====

        case 'board': {
            const showAll = opts.all || opts.subcommand === 'all';
            habakkukBoard(showAll);
            break;
        }

        case 'cry': {
            if (!opts.subcommand) {
                console.log(`\n  ${c.red}Error:${c.reset} Description required.`);
                console.log(`  Usage: wtv cry "Description of the problem or need"\n`);
                process.exit(1);
            }
            habakkukCry(opts.subcommand);
            break;
        }

        case 'wait': {
            if (!opts.subcommand) {
                console.log(`\n  ${c.red}Error:${c.reset} Item ID or slug required.`);
                console.log(`  Usage: wtv wait <id|slug> [note]\n`);
                process.exit(1);
            }
            habakkukWait(opts.subcommand, opts.agentName);
            break;
        }

        case 'run': {
            if (opts.subcommand) {
                habakkukRun(opts.subcommand);
                break;
            }

            if (!process.stdout.isTTY && (!opts.vision || !opts.engine)) {
                console.log(`\n  ${c.red}Error:${c.reset} run requires interactive TTY, or pass --vision and --engine.`);
                console.log(`  Example: wtv run --vision vision/VISION.md --engine opencode\n`);
                process.exit(1);
            }

            await visionRunner(opts);
            break;
        }

        case 'worship': {
            if (!opts.subcommand) {
                console.log(`\n  ${c.red}Error:${c.reset} Item ID or slug required.`);
                console.log(`  Usage: wtv worship <id|slug>\n`);
                process.exit(1);
            }
            await habakkukWorship(opts.subcommand);
            break;
        }

        case 'note': {
            if (!opts.subcommand) {
                console.log(`\n  ${c.red}Error:${c.reset} Item ID or slug required.`);
                console.log(`  Usage: wtv note <id|slug> "Your note text"\n`);
                process.exit(1);
            }
            if (!opts.agentName) {
                console.log(`\n  ${c.red}Error:${c.reset} Note text required.`);
                console.log(`  Usage: wtv note <id|slug> "Your note text"\n`);
                process.exit(1);
            }
            habakkukNote(opts.subcommand, opts.agentName);
            break;
        }

        case 'item': {
            if (!opts.subcommand) {
                console.log(`\n  ${c.red}Error:${c.reset} Item ID or slug required.`);
                console.log(`  Usage: wtv item <id|slug>\n`);
                process.exit(1);
            }
            habakkukItem(opts.subcommand);
            break;
        }

        case 'stones': {
            habakkukStones();
            break;
        }

        // ===== END HABAKKUK WORKFLOW COMMANDS =====

        case 'version':
        case '-v':
        case '--version': {
            console.log(getVersion());
            break;
        }

        case 'help':
        case '--help':
        case '-h': {
            showHelp();
            break;
        }

        case null: {
            const wantsInit = opts.global || opts.local || opts.force || opts.path || opts.tools.length > 0;

            if (wantsInit) {
                initNonInteractive(scope, opts.force, opts.tools, opts.path);
            } else {
                // NEW: Show dashboard by default
                await dashboard();
            }

            break;
        }

        default: {
            console.log(`\n  ${c.red}Unknown command:${c.reset} ${opts.command}`);
            console.log(`  Run 'wtv help' for usage.\n`);
            process.exit(1);
        }
    }
}
