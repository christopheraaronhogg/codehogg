import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import {
    accessSync,
    constants,
    copyFileSync,
    existsSync,
    mkdirSync,
    readdirSync,
    readFileSync,
    rmSync,
    statSync,
    writeFileSync,
} from 'fs';
import { homedir, platform } from 'os';
import { createInterface } from 'readline';
import updateNotifier from 'update-notifier';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PACKAGE_ROOT = resolve(__dirname, '..');
const TEMPLATES_DIR = join(PACKAGE_ROOT, 'templates');

const TOOL_IDS = ['claude', 'codex', 'opencode'];
const VISION_TEMPLATE_PATH = join(TEMPLATES_DIR, 'VISION_TEMPLATE.md');
const CODEHOGG_LOGS_DIR = '.codehogg/logs';

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
};

// Symbols (use ASCII fallback on Windows if needed)
const isWindows = platform() === 'win32';
const sym = {
    check: isWindows ? '[OK]' : '✓',
    arrow: isWindows ? '>' : '❯',
    bullet: isWindows ? '*' : '•',
    warn: isWindows ? '[!]' : '⚠',
    info: isWindows ? '[i]' : 'ℹ',
};

function getVersion() {
    const pkg = JSON.parse(readFileSync(join(PACKAGE_ROOT, 'package.json'), 'utf8'));
    return pkg.version;
}

function checkForUpdates() {
    const shouldCheck = process.env.CODEHOGG_NO_UPDATE_CHECK !== '1';
    if (!shouldCheck) return;
    if (!process.stdout.isTTY) return;

    try {
        const notifier = updateNotifier({
            pkg: {
                name: 'codehogg',
                version: getVersion(),
            },
            updateCheckInterval: 1000 * 60 * 60 * 24 * 7,
            shouldNotifyInNpmScript: false,
        });

        const update = notifier.update;
        if (!update) return;

        notifier.notify({
            message: `Update available ${c.dim}${update.current}${c.reset} → ${c.green}${update.latest}${c.reset}
Run ${c.cyan}npx codehogg update${c.reset} to get the latest version`,
            defer: false,
            boxenOpts: {
                padding: 1,
                margin: 1,
                align: 'center',
                borderColor: 'yellow',
                borderStyle: 'round',
            },
        });

        notifier.notify({
            message: `Update available ${c.dim}${notifier.update.current}${c.reset} → ${c.green}${notifier.update.latest}${c.reset}\nRun ${c.cyan}npx codehogg update${c.reset} to get the latest version`,
            defer: false,
            boxenOpts: {
                padding: 1,
                margin: 1,
                align: 'center',
                borderColor: 'yellow',
                borderStyle: 'round',
            },
        });
    } catch (err) {
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
        if (!existsSync(parentDir)) {
            return { valid: false, error: `Parent directory does not exist: ${parentDir}` };
        }
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
    console.log(`\n  ${c.bold}${question}${c.reset}\n`);
    options.forEach((opt, i) => {
        console.log(`    ${c.cyan}${i + 1}${c.reset}) ${opt.label}`);
        if (opt.desc) console.log(`       ${c.dim}${opt.desc}${c.reset}`);
    });

    const answer = await prompt(`\n  Enter choice (1-${options.length}): `);
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
    console.log(`
  ${c.bold}${c.magenta}codehogg${c.reset} ${c.dim}v${getVersion()}${c.reset}
  ${c.dim}9 agents ${sym.bullet} 21 skills for Claude Code, Codex CLI, and OpenCode${c.reset}
`);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ASCII Art Avatars for the team
const AVATARS = {
    masterbuilder: `
       ${c.yellow}___________${c.reset}
      ${c.yellow}/           \\${c.reset}
     ${c.yellow}|  ${c.bold}◈     ◈${c.reset}${c.yellow}  |${c.reset}
     ${c.yellow}|     ${c.bold}▽${c.reset}${c.yellow}     |${c.reset}
     ${c.yellow}|   ${c.bold}═════${c.reset}${c.yellow}   |${c.reset}
      ${c.yellow}\\  ${c.dim}PLAN${c.reset}${c.yellow}  /${c.reset}
       ${c.yellow}╔═══════╗${c.reset}
       ${c.yellow}║${c.dim}VISION${c.reset}${c.yellow}║${c.reset}
       ${c.yellow}╚═══════╝${c.reset}`,

    security: `
       ${c.red}╔═══════╗${c.reset}
       ${c.red}║${c.bold}  ◉ ◉  ${c.reset}${c.red}║${c.reset}
       ${c.red}║   ${c.bold}▼${c.reset}${c.red}   ║${c.reset}
      ${c.red}╔╩═══════╩╗${c.reset}
      ${c.red}║ ${c.bold}◇ ▣ ◇${c.reset}${c.red} ║${c.reset}
      ${c.red}║ ${c.bold}◇ ◇ ◇${c.reset}${c.red} ║${c.reset}
      ${c.red}╚════╦════╝${c.reset}
           ${c.red}║${c.reset}
       ${c.dim}[SHIELD]${c.reset}`,

    architecture: `
          ${c.blue}△${c.reset}
         ${c.blue}╱ ╲${c.reset}
        ${c.blue}╱${c.bold}◈ ◈${c.reset}${c.blue}╲${c.reset}
       ${c.blue}╱  ${c.bold}▽${c.reset}${c.blue}  ╲${c.reset}
      ${c.blue}╱═══════╲${c.reset}
     ${c.blue}║ ║   ║ ║${c.reset}
     ${c.blue}║ ║   ║ ║${c.reset}
     ${c.blue}╩═╩═══╩═╩${c.reset}
     ${c.dim}[PILLARS]${c.reset}`,

    backend: `
      ${c.green}┌─────────┐${c.reset}
      ${c.green}│${c.bold}◉${c.reset}${c.green}──┬──${c.bold}◉${c.reset}${c.green}│${c.reset}
      ${c.green}│  ${c.bold}│${c.reset}${c.green}  │${c.reset}
      ${c.green}├──${c.bold}◇${c.reset}${c.green}──┤${c.reset}
      ${c.green}│  ${c.bold}│${c.reset}${c.green}  │${c.reset}
      ${c.green}│  ${c.bold}▼${c.reset}${c.green}  │${c.reset}
      ${c.green}└──${c.bold}◎${c.reset}${c.green}──┘${c.reset}
      ${c.dim}[SERVER]${c.reset}`,

    frontend: `
      ${c.magenta}╭─────────╮${c.reset}
      ${c.magenta}│ ${c.bold}◐   ◑${c.reset}${c.magenta} │${c.reset}
      ${c.magenta}│   ${c.bold}◡${c.reset}${c.magenta}   │${c.reset}
      ${c.magenta}├─────────┤${c.reset}
      ${c.magenta}│ ${c.bold}▪ ▪ ▪${c.reset}${c.magenta} │${c.reset}
      ${c.magenta}│ ${c.bold}█████${c.reset}${c.magenta} │${c.reset}
      ${c.magenta}╰─────────╯${c.reset}
       ${c.dim}[SCREEN]${c.reset}`,

    database: `
        ${c.cyan}╭───────╮${c.reset}
       ${c.cyan}╱ ${c.bold}◉   ◉${c.reset}${c.cyan} ╲${c.reset}
      ${c.cyan}│    ${c.bold}○${c.reset}${c.cyan}    │${c.reset}
      ${c.cyan}├─────────┤${c.reset}
      ${c.cyan}│${c.bold}═════════${c.reset}${c.cyan}│${c.reset}
      ${c.cyan}│${c.bold}═════════${c.reset}${c.cyan}│${c.reset}
      ${c.cyan}│${c.bold}═════════${c.reset}${c.cyan}│${c.reset}
       ${c.cyan}╲───────╱${c.reset}
        ${c.dim}[DATA]${c.reset}`,

    devops: `
        ${c.yellow}◎${c.reset}
       ${c.yellow}╱│╲${c.reset}
      ${c.yellow}╱ ${c.bold}◉ ◉${c.reset}${c.yellow} ╲${c.reset}
     ${c.yellow}◁──${c.bold}◡${c.reset}${c.yellow}──▷${c.reset}
      ${c.yellow}╲     ╱${c.reset}
       ${c.yellow}◎═══◎${c.reset}
      ${c.yellow}╱     ╲${c.reset}
     ${c.yellow}◎       ◎${c.reset}
     ${c.dim}[PIPELINE]${c.reset}`,

    qa: `
         ${c.blue}○${c.reset}
        ${c.blue}╱ ╲${c.reset}
       ${c.blue}(${c.bold}◉ ◉${c.reset}${c.blue})${c.reset}
       ${c.blue}│ ${c.bold}⌓${c.reset}${c.blue} │${c.reset}
      ${c.blue}╭┴───┴╮${c.reset}
     ${c.blue}(  ${c.bold}◎${c.reset}${c.blue}   )${c.reset}
      ${c.blue}╲  ${c.bold}│${c.reset}${c.blue}  ╱${c.reset}
       ${c.blue}╰───╯${c.reset}
       ${c.dim}[LENS]${c.reset}`,

    product: `
        ${c.green}★${c.reset}
       ${c.green}╱ ╲${c.reset}
      ${c.green}╱${c.bold}◉   ◉${c.reset}${c.green}╲${c.reset}
     ${c.green}│   ${c.bold}◡${c.reset}${c.green}   │${c.reset}
     ${c.green}├───────┤${c.reset}
     ${c.green}│ ${c.bold}☰ ☰${c.reset}${c.green} │${c.reset}
     ${c.green}│ ${c.bold}☰ ☰${c.reset}${c.green} │${c.reset}
     ${c.green}╰───────╯${c.reset}
      ${c.dim}[SCROLL]${c.reset}`,
};

const ARTISAN_DEFS = [
    {
        id: 'security',
        name: 'Security Artisan',
        file: 'security-artisan.md',
        color: c.red,
        domain: 'Auth, vulnerabilities, secrets, compliance',
        voice: 'I see the threats others miss. Every input is suspect until proven safe.',
    },
    {
        id: 'architecture',
        name: 'Architecture Artisan',
        file: 'architecture-artisan.md',
        color: c.blue,
        domain: 'System design, patterns, structure, code quality',
        voice: 'Structure is destiny. I ensure your foundation can bear what you\'ll build.',
    },
    {
        id: 'backend',
        name: 'Backend Artisan',
        file: 'backend-artisan.md',
        color: c.green,
        domain: 'API, services, data access, business logic',
        voice: 'I bridge the gap between data and interface. Clean APIs, solid services.',
    },
    {
        id: 'frontend',
        name: 'Frontend Artisan',
        file: 'frontend-artisan.md',
        color: c.magenta,
        domain: 'UI, UX, components, accessibility',
        voice: 'The user sees my work first. I make complexity feel simple.',
    },
    {
        id: 'database',
        name: 'Database Artisan',
        file: 'database-artisan.md',
        color: c.cyan,
        domain: 'Schema, queries, migrations, optimization',
        voice: 'Data is the foundation. I shape it for speed, integrity, and growth.',
    },
    {
        id: 'devops',
        name: 'DevOps Artisan',
        file: 'devops-artisan.md',
        color: c.yellow,
        domain: 'CI/CD, infrastructure, deployment, observability',
        voice: 'I make shipping reliable. From commit to production, I smooth the path.',
    },
    {
        id: 'qa',
        name: 'QA Artisan',
        file: 'qa-artisan.md',
        color: c.blue,
        domain: 'Testing, quality, reliability',
        voice: 'I find what\'s broken before users do. Trust, but verify.',
    },
    {
        id: 'product',
        name: 'Product Artisan',
        file: 'product-artisan.md',
        color: c.green,
        domain: 'Requirements, scope, documentation',
        voice: 'I guard the scope. What are we building, for whom, and why?',
    },
];

async function selectArtisans() {
    console.log(`\n  ${c.bold}Select Your Artisans${c.reset}`);
    console.log(`  ${c.dim}These domain experts will counsel the Masterbuilder and execute tasks.${c.reset}`);
    console.log(`  ${c.dim}Enter numbers separated by spaces, or press Enter for all.${c.reset}\n`);

    ARTISAN_DEFS.forEach((a, i) => {
        console.log(`    ${a.color}${i + 1}${c.reset}) ${a.color}${c.bold}${a.name}${c.reset}`);
        console.log(`       ${c.dim}${a.domain}${c.reset}`);
    });

    const answer = await prompt(`\n  Select (1-8, space-separated) [${c.dim}all${c.reset}]: `);

    if (!answer.trim()) {
        return ARTISAN_DEFS.map(a => a.id);
    }

    const nums = answer.split(/[\s,]+/).map(n => parseInt(n.trim(), 10)).filter(n => n >= 1 && n <= 8);
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
    console.log(`  ${c.dim}"And the LORD answered me, and said,${c.reset}`);
    console.log(`  ${c.dim} Write the vision, and make it plain upon tables,${c.reset}`);
    console.log(`  ${c.dim} that he may run that readeth it."${c.reset}`);
    console.log(`  ${c.dim}                                    — Habakkuk 2:2${c.reset}`);
    console.log('');

    await sleep(pause);

    // The Masterbuilder
    console.log(`  ${c.bold}${c.yellow}THE MASTERBUILDER${c.reset}`);
    console.log(`  ${c.dim}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}`);
    console.log(AVATARS.masterbuilder);
    await sleep(shortPause);
    console.log(`
  ${c.cyan}"According to the grace of God which is given unto me,${c.reset}
  ${c.cyan} as a wise masterbuilder, I have laid the foundation,${c.reset}
  ${c.cyan} and another buildeth thereon."${c.reset}
  ${c.dim}                                    — 1 Corinthians 3:10${c.reset}

  I am the ${c.bold}Masterbuilder${c.reset}. I read your ${c.bold}VISION.md${c.reset}, consult my artisans,
  synthesize their counsel into a plan, and present it for your approval.
  Only then do I delegate. I verify. I integrate. I report.
`);

    await sleep(pause);

    // The Artisans intro
    console.log(`  ${c.bold}${c.green}THE ARTISANS${c.reset}`);
    console.log(`  ${c.dim}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}`);
    console.log(`
  ${c.dim}"Where no counsel is, the people fall:${c.reset}
  ${c.dim} but in the multitude of counsellors there is safety."${c.reset}
  ${c.dim}                                    — Proverbs 11:14${c.reset}
`);

    await sleep(pause);

    for (const artisan of ARTISAN_DEFS) {
        console.log(`  ${artisan.color}${c.bold}${artisan.name}${c.reset}`);
        console.log(AVATARS[artisan.id]);
        console.log(`  ${c.dim}${artisan.domain}${c.reset}`);
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

    ${c.cyan}/codehogg${c.reset}                    Strategic review against your VISION.md
    ${c.cyan}/codehogg "your mission"${c.reset}     Tactical mission with artisan counsel

  First, define your vision:

    ${c.cyan}npx codehogg init${c.reset}            Creates VISION.md in your project

  ${c.dim}"But let every man take heed how he buildeth thereupon."${c.reset}
  ${c.dim}                                    — 1 Corinthians 3:10${c.reset}

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
    const timestampFile = join(dir, '.codehogg-updated');
    writeFileSync(timestampFile, new Date().toISOString().split('T')[0]);
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

function installSkills(destDir, { force, showProgress, label }) {
    const source = join(TEMPLATES_DIR, 'skills');
    if (!existsSync(source)) {
        throw new Error(`Templates missing: ${source}`);
    }

    if (existsSync(destDir) && !force) {
        throw new Error(`Existing installation found at ${destDir}. Use --force to overwrite.`);
    }

    resetDir(destDir);
    const copied = copyDir(source, destDir);

    if (showProgress) {
        console.log(`    ${c.green}${sym.check}${c.reset} ${label} (${countDirs(destDir)} skills)`);
    }

    return copied;
}

function installClaude(targetDir, { force, showProgress, selectedArtisans = null }) {
    const validation = validatePath(targetDir);
    if (!validation.valid) {
        throw new Error(validation.error);
    }

    ensureDir(targetDir);

    const agentsSource = join(TEMPLATES_DIR, 'agents');
    const agentsDest = join(targetDir, 'agents');

    if (existsSync(agentsDest) && !force) {
        throw new Error(`Existing installation found at ${agentsDest}. Use --force to overwrite.`);
    }

    resetDir(agentsDest);

    // Copy agents - filter by selected artisans if specified
    let agentCount = 0;
    const agentFiles = readdirSync(agentsSource);

    for (const file of agentFiles) {
        const srcPath = join(agentsSource, file);
        const destPath = join(agentsDest, file);

        // Always copy non-artisan agents (masterbuilder, explore-concepts, ux-personas)
        const isArtisan = file.endsWith('-artisan.md');

        if (isArtisan && selectedArtisans) {
            // Check if this artisan is selected
            const artisanId = file.replace('-artisan.md', '');
            if (!selectedArtisans.includes(artisanId)) {
                continue; // Skip unselected artisans
            }
        }

        copyFileSync(srcPath, destPath);
        agentCount++;
    }

    const skillsDest = join(targetDir, 'skills');
    installSkills(skillsDest, { force, showProgress, label: 'Claude skills' });

    const codehoggSrc = join(TEMPLATES_DIR, 'CODEHOGG.md');
    const codehoggDest = join(targetDir, 'CODEHOGG.md');
    if (existsSync(codehoggSrc)) {
        copyFileSync(codehoggSrc, codehoggDest);
    }

    writeTimestamp(targetDir);

    if (showProgress) {
        console.log(`    ${c.green}${sym.check}${c.reset} ${agentCount} Claude agents`);
    }

    return true;
}

function installCodex(targetDir, { force, showProgress }) {
    const validation = validatePath(targetDir);
    if (!validation.valid) {
        throw new Error(validation.error);
    }

    ensureDir(targetDir);

    const skillsDest = join(targetDir, 'skills');
    installSkills(skillsDest, { force, showProgress, label: 'Codex skills' });

    writeTimestamp(targetDir);

    return true;
}

function installOpenCodeAgents(agentDir, { force, showProgress }) {
    const sourceDir = join(TEMPLATES_DIR, 'agents');
    if (!existsSync(sourceDir)) {
        throw new Error(`Templates missing: ${sourceDir}`);
    }

    if (existsSync(agentDir) && !force) {
        throw new Error(`Existing installation found at ${agentDir}. Use --force to overwrite.`);
    }

    resetDir(agentDir);

    const agentFiles = readdirSync(sourceDir)
        .filter(f => f.endsWith('.md'))
        .sort();

    let written = 0;
    for (const file of agentFiles) {
        const inputPath = join(sourceDir, file);
        const { frontmatter, body } = parseClaudeAgentTemplate(inputPath);
        const description = frontmatter.description || `Codehogg agent: ${file.replace(/\.md$/, '')}`;

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

        writeFileSync(join(agentDir, file), out);
        written++;
    }

    if (showProgress) {
        console.log(`    ${c.green}${sym.check}${c.reset} ${written} OpenCode agents`);
    }

    return written;
}

function installOpenCode(scope, { force, showProgress }) {
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
    installOpenCodeAgents(agentDir, { force, showProgress });
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

    return {
        claude: !!claudeRoot && (existsSync(join(claudeRoot, 'agents')) || existsSync(join(claudeRoot, 'skills'))),
        codex: !!codexRoot && existsSync(join(codexRoot, 'skills')),
        opencode: !!opencodeAgentsDir && existsSync(opencodeAgentsDir),
        paths: { claudeRoot, codexRoot, opencodeAgentsDir },
    };
}

async function interactiveInit() {
    printBanner();
    console.log(`  ${c.cyan}Welcome!${c.reset} Let's set up codehogg.\n`);

    const scope = await select('Where would you like to install?', [
        { value: 'project', label: 'Current project', desc: 'Installs to .claude/.codex/.opencode in this repo' },
        { value: 'global', label: 'Global', desc: 'Installs to ~/.claude, ~/.codex, and ~/.config/opencode' },
    ]);

    console.log(`\n  ${c.bold}Targets${c.reset}`);
    const installClaudeFlag = await confirm('Install for Claude Code?', true);
    const installCodexFlag = await confirm('Install for Codex CLI?', false);
    const installOpenCodeFlag = await confirm('Install for OpenCode?', false);

    const tools = [];
    if (installClaudeFlag) tools.push('claude');
    if (installCodexFlag) tools.push('codex');
    if (installOpenCodeFlag) tools.push('opencode');

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
            console.log(`  ${c.dim}Installing all 8 artisans.${c.reset}`);
        }
    }

    const installed = detectInstalled(scope);
    const existing = tools.filter(t => installed[t]);

    let force = true;
    if (existing.length > 0) {
        console.log(`\n  ${c.yellow}${sym.warn}${c.reset} Existing installation(s) detected: ${existing.join(', ')}`);
        force = await confirm('Overwrite existing installation(s)?', false);
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
            console.log(`  ${c.dim}VISION.md lets /codehogg align recommendations with your project goals.${c.reset}\n`);

            const createVision = await confirm('Create VISION.md now?', true);
            if (createVision) {
                await initVision(scope);
            } else {
                console.log(`\n  ${c.dim}You can create it later with 'codehogg init' or by creating VISION.md manually.${c.reset}\n`);
            }
        }
    }

    console.log(`  ${c.bold}Quick start:${c.reset}`);
    if (tools.includes('claude')) {
        console.log(`    ${c.cyan}Claude Code:${c.reset} /codehogg (vision-aligned) or /audit-quick, /plan-full`);
    }
    if (tools.includes('codex')) {
        console.log(`    ${c.cyan}Codex CLI:${c.reset} use $codehogg or $audit-quick`);
    }
    if (tools.includes('opencode')) {
        console.log(`    ${c.cyan}OpenCode:${c.reset} use /codehogg or @team-lead`);
    }

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
            installOpenCode(scope, { force, showProgress });
        }
    }

    return true;
}

function initNonInteractive(scope, force, tools, customPath = null) {
    const selected = normalizeTools(tools.length ? tools : ['claude']);

    const scopeLabel = scope === 'global' ? 'global' : 'project';
    console.log(`\n  ${c.bold}codehogg${c.reset} v${getVersion()}`);
    console.log(`  Installing (${scopeLabel}) for: ${selected.join(', ')}\n`);

    doInstall({ scope, tools: selected, force, showProgress: true, customPath });

    console.log(`\n  ${c.green}Installation complete!${c.reset}\n`);
}

function update(scope, tools) {
    const installed = detectInstalled(scope);
    const selected = normalizeTools(tools.length ? tools : TOOL_IDS.filter(t => installed[t]));

    if (selected.length === 0) {
        console.log(`\n  ${c.red}Error:${c.reset} No installations found to update.`);
        console.log(`  Run 'codehogg init' first.\n`);
        process.exit(1);
    }

    console.log(`\n  ${c.bold}codehogg${c.reset} v${getVersion()}`);
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

function uninstall(scope, tools) {
    const selected = normalizeTools(tools);
    const home = getHomedir();

    const claudeRoot = scope === 'global'
        ? (home ? join(home, '.claude') : null)
        : join(process.cwd(), '.claude');

    const codexRoot = scope === 'global'
        ? (home ? join(home, '.codex') : null)
        : join(process.cwd(), '.codex');

    const opencodeRoot = getOpenCodeAgentRoot(scope);
    const opencodeAgentsDir = getOpenCodeAgentDir(scope);

    const keepingClaudeSkills =
        (selected.includes('claude') && !selected.includes('opencode') && opencodeAgentsDir && existsSync(opencodeAgentsDir)) ||
        (selected.includes('opencode') && !selected.includes('claude') && claudeRoot && existsSync(join(claudeRoot, 'agents')));

    console.log(`\n  ${c.bold}codehogg${c.reset} v${getVersion()}`);
    console.log(`  Uninstalling (${scope}) for: ${selected.join(', ')}\n`);

    let removed = false;

    if (selected.includes('claude') && claudeRoot) {
        const agentsDir = join(claudeRoot, 'agents');
        if (existsSync(agentsDir)) {
            rmSync(agentsDir, { recursive: true, force: true });
            console.log(`    ${c.green}${sym.check}${c.reset} Removed .claude/agents/`);
            removed = true;
        }

        if (!keepingClaudeSkills) {
            const skillsDir = join(claudeRoot, 'skills');
            if (existsSync(skillsDir)) {
                rmSync(skillsDir, { recursive: true, force: true });
                console.log(`    ${c.green}${sym.check}${c.reset} Removed .claude/skills/`);
                removed = true;
            }
        } else {
            console.log(`    ${c.dim}Keeping .claude/skills/ (shared with other tool)${c.reset}`);
        }

        for (const file of ['CODEHOGG.md', '.codehogg-updated']) {
            const p = join(claudeRoot, file);
            if (existsSync(p)) {
                rmSync(p);
                removed = true;
            }
        }
    }

    if (selected.includes('codex') && codexRoot) {
        const skillsDir = join(codexRoot, 'skills');
        if (existsSync(skillsDir)) {
            rmSync(skillsDir, { recursive: true, force: true });
            console.log(`    ${c.green}${sym.check}${c.reset} Removed .codex/skills/`);
            removed = true;
        }
        const ts = join(codexRoot, '.codehogg-updated');
        if (existsSync(ts)) {
            rmSync(ts);
            removed = true;
        }
    }

    if (selected.includes('opencode')) {
        if (opencodeAgentsDir && existsSync(opencodeAgentsDir)) {
            rmSync(opencodeAgentsDir, { recursive: true, force: true });
            console.log(`    ${c.green}${sym.check}${c.reset} Removed .opencode/agent/`);
            removed = true;
        }

        if (opencodeRoot) {
            const ts = join(opencodeRoot, '.codehogg-updated');
            if (existsSync(ts)) {
                rmSync(ts);
                removed = true;
            }
        }

        if (!keepingClaudeSkills && claudeRoot) {
            // If OpenCode was installed without Claude, its skills live in .claude/skills.
            const skillsDir = join(claudeRoot, 'skills');
            if (existsSync(skillsDir) && !existsSync(join(claudeRoot, 'agents'))) {
                rmSync(skillsDir, { recursive: true, force: true });
                console.log(`    ${c.green}${sym.check}${c.reset} Removed .claude/skills/ (OpenCode skill path)`);
                removed = true;
            }
        }
    }

    if (removed) {
        console.log(`\n  ${c.green}Uninstall complete.${c.reset}\n`);
    } else {
        console.log(`\n  ${c.dim}Nothing to uninstall.${c.reset}\n`);
    }
}

function status(customPath = null) {
    console.log(`\n  ${c.bold}codehogg${c.reset} v${getVersion()}\n`);

    const home = getHomedir();

    const showClaude = (label, root) => {
        const agents = countFiles(join(root, 'agents'));
        const skills = countDirs(join(root, 'skills'));

        console.log(`  ${label}:`);
        if (agents > 0 || skills > 0) {
            console.log(`    ${c.green}${sym.check}${c.reset} ${agents} agents, ${skills} skills`);
        } else {
            console.log(`    ${c.dim}Not installed${c.reset}`);
        }
    };

    const showCodex = (label, root) => {
        const skills = countDirs(join(root, 'skills'));
        console.log(`  ${label}:`);
        if (skills > 0) {
            console.log(`    ${c.green}${sym.check}${c.reset} ${skills} skills`);
        } else {
            console.log(`    ${c.dim}Not installed${c.reset}`);
        }
    };

    const showOpenCode = (label, agentsDir, claudeSkillsDir) => {
        const agents = countFilesFlat(agentsDir, '.md');
        const skills = countDirs(claudeSkillsDir);
        console.log(`  ${label}:`);
        if (agents > 0 || skills > 0) {
            console.log(`    ${c.green}${sym.check}${c.reset} ${agents} agents, ${skills} skills (via .claude/skills)`);
        } else {
            console.log(`    ${c.dim}Not installed${c.reset}`);
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
    return join(process.cwd(), 'VISION.md');
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

    console.log(`\n  ${c.bold}Create VISION.md${c.reset}`);
    console.log(`  ${c.dim}All questions are optional. Press Enter to skip.${c.reset}\n`);

    const purpose = await prompt(`  ${c.cyan}Purpose${c.reset} (Who is this for and what does it do?):\n  > `);
    const outcomes = await prompt(`  ${c.cyan}Outcomes${c.reset} (What does success look like?):\n  > `);
    const values = await prompt(`  ${c.cyan}Values${c.reset} (What matters most? Tradeoffs?):\n  > `);
    const constraints = await prompt(`  ${c.cyan}Constraints${c.reset} (Off-limits? Time, budget, compliance?):\n  > `);

    const stageChoice = await select('Current stage?', [
        { value: 'Prototype', label: 'Prototype', desc: 'Exploring ideas, nothing production-ready' },
        { value: 'MVP', label: 'MVP', desc: 'Core functionality, shipping to early users' },
        { value: 'Production', label: 'Production', desc: 'Live product, real users, stability matters' },
        { value: 'Maintenance', label: 'Maintenance', desc: 'Stable product, bug fixes and minor features' },
        { value: '', label: 'Skip', desc: 'Leave unspecified' },
    ]);

    const focus = await prompt(`  ${c.cyan}Current Focus${c.reset} (What's the one thing right now?):\n  > `);

    // Build VISION.md content
    let content = `# Vision

> "And the LORD answered me, and said, Write the vision, and make it plain upon tables, that he may run that readeth it."
> — Habakkuk 2:2 (KJV)

## Purpose
${purpose || '<!-- Who is this for and what does it do? -->'}

## Outcomes
${outcomes || '<!-- What does success look like? Be concrete. -->'}

## Values
${values || '<!-- What matters most? What tradeoffs are acceptable? -->'}

## Constraints
${constraints || '<!-- What\'s off-limits? Time, budget, compliance, dependencies? -->'}

## Stage
${stageChoice || '<!-- Where are we? Prototype / MVP / Production / Maintenance -->'}

## Current Focus
${focus || '<!-- What\'s the one thing right now? -->'}
`;

    writeFileSync(visionPath, content);
    console.log(`\n  ${c.green}${sym.check}${c.reset} Created VISION.md at: ${visionPath}\n`);

    return true;
}

function showVisionStatus(scope) {
    const visionPath = getVisionPath(scope);

    console.log(`\n  ${c.bold}codehogg${c.reset} v${getVersion()}`);
    console.log(`  ${c.bold}Vision Status${c.reset}\n`);

    if (!visionPath || !existsSync(visionPath)) {
        console.log(`  ${c.yellow}${sym.warn}${c.reset} No VISION.md found.`);
        console.log(`  ${c.dim}Run 'codehogg init' to create one.${c.reset}\n`);
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
    if (scope === 'global') {
        const home = getHomedir();
        return home ? join(home, CODEHOGG_LOGS_DIR) : null;
    }
    return join(process.cwd(), CODEHOGG_LOGS_DIR);
}

function showLogs(scope, opts = {}) {
    const logsDir = getLogsDir(scope);

    console.log(`\n  ${c.bold}codehogg${c.reset} v${getVersion()}`);
    console.log(`  ${c.bold}Task Logs${c.reset}\n`);

    if (!logsDir || !existsSync(logsDir)) {
        console.log(`  ${c.dim}No logs found.${c.reset}`);
        console.log(`  ${c.dim}Logs are created when you run /codehogg commands.${c.reset}\n`);
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

    console.log(`  ${c.dim}Use 'codehogg log --task <id>' to view a specific task.${c.reset}\n`);
}

function showHelp() {
    console.log(`
  ${c.bold}codehogg${c.reset} v${getVersion()}

  ${c.dim}9 agents + 21 skills for Claude Code, Codex CLI, and OpenCode.${c.reset}

  ${c.bold}Usage:${c.reset}
    codehogg [command] [options]

  ${c.bold}Commands:${c.reset}
    ${c.cyan}init${c.reset}              Interactive installation wizard + VISION.md setup
    ${c.cyan}meet${c.reset}              Meet the Masterbuilder and Artisans
    ${c.cyan}update${c.reset}            Update installations (defaults to what's installed)
    ${c.cyan}uninstall${c.reset}         Remove installations (interactive by default)
    ${c.cyan}status${c.reset}            Show installation status
    ${c.cyan}vision${c.reset}            Show VISION.md status (populated vs blank sections)
    ${c.cyan}log${c.reset}               Show task logs from /codehogg commands
    ${c.cyan}help${c.reset}              Show this help

  ${c.bold}Options:${c.reset}
    --global, -g      Target global install locations
    --local, -l       Target current project install locations
    --force, -f       Overwrite existing installation
    --tool <name>     Install/update/uninstall for a tool (repeatable)
    --claude          Alias for --tool claude
    --codex           Alias for --tool codex
    --opencode        Alias for --tool opencode
    --path <dir>      Custom directory (single-tool installs only)
    --task <id>       (log) View a specific task log by ID
    --date <YYYY-MM-DD> (log) Filter logs by date
    --version, -v     Show version
    --help, -h        Show this help

  ${c.bold}Examples:${c.reset}
    npx codehogg init                    # Interactive install + VISION.md setup
    npx codehogg init --claude --codex   # Non-interactive install
    npx codehogg update --global         # Update global installations
    npx codehogg vision                  # Show VISION.md status
    npx codehogg log                     # Show recent task logs
    npx codehogg log --date 2026-01-15   # Show logs from specific date
    npx codehogg log --task implement-oauth # View specific task log
`);
}

function parseArgs(args) {
    const opts = {
        command: null,
        global: false,
        local: false,
        force: false,
        path: null,
        tools: [],
        task: null,
        date: null,
    };

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

        if (a === '--path') {
            opts.path = args[i + 1] ?? null;
            i++;
            continue;
        }

        if (a === '--tool') {
            opts.tools.push(args[i + 1] ?? null);
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

        if (a === '--task') {
            opts.task = args[i + 1] ?? null;
            i++;
            continue;
        }

        if (a === '--date') {
            opts.date = args[i + 1] ?? null;
            i++;
            continue;
        }

        if (a.startsWith('-')) {
            continue;
        }

        if (!opts.command) {
            opts.command = a;
        }
    }

    return opts;
}

export async function run(args) {
    const opts = parseArgs(args);
    const scope = opts.global ? 'global' : 'project';

    if (opts.command !== 'version') {
        checkForUpdates();
    }

    switch (opts.command) {
        case 'init': {
            const nonInteractive = opts.global || opts.local || opts.force || opts.path || opts.tools.length > 0;
            if (nonInteractive) {
                initNonInteractive(scope, opts.force, opts.tools, opts.path);
            } else {
                await interactiveInit();
            }
            break;
        }

        case 'update': {
            update(scope, opts.tools);
            break;
        }

        case 'uninstall':
        case 'remove': {
            if (opts.tools.length > 0) {
                uninstall(scope, opts.tools);
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
            showVisionStatus(scope);
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
            } else if (process.stdout.isTTY) {
                await interactiveInit();
            } else {
                showHelp();
            }

            break;
        }

        default: {
            console.log(`\n  ${c.red}Unknown command:${c.reset} ${opts.command}`);
            console.log(`  Run 'codehogg help' for usage.\n`);
            process.exit(1);
        }
    }
}
