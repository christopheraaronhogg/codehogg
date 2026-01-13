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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PACKAGE_ROOT = resolve(__dirname, '..');
const TEMPLATES_DIR = join(PACKAGE_ROOT, 'templates');

const TOOL_IDS = ['claude', 'codex', 'opencode'];

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
  ${c.dim}29 agents ${sym.bullet} 43 skills for Claude Code, Codex CLI, and OpenCode${c.reset}
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

function installClaude(targetDir, { force, showProgress }) {
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
    const agentCount = copyDir(agentsSource, agentsDest);

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

    doInstall({ scope, tools, force, showProgress: true, customPath: null });

    console.log(`\n  ${c.green}${c.bold}Installation complete!${c.reset}\n`);

    console.log(`  ${c.bold}Quick start:${c.reset}`);
    if (tools.includes('claude')) {
        console.log(`    ${c.cyan}Claude Code:${c.reset} /audit-quick, /audit-full, /plan-full`);
    }
    if (tools.includes('codex')) {
        console.log(`    ${c.cyan}Codex CLI:${c.reset} use $audit-quick (or /skills to browse)`);
    }
    if (tools.includes('opencode')) {
        console.log(`    ${c.cyan}OpenCode:${c.reset} use skills (audit-quick) or @architect-consultant`);
    }

    console.log('');
}

function doInstall({ scope, tools, force, showProgress, customPath }) {
    const selected = normalizeTools(tools);

    if (customPath && selected.length !== 1) {
        throw new Error('Custom --path is only supported when installing a single tool.');
    }

    for (const tool of selected) {
        if (tool === 'claude') {
            const targetDir = getRootDirForTool('claude', scope, customPath);
            if (!targetDir) throw new Error('Cannot determine .claude directory.');
            installClaude(targetDir, { force, showProgress });
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

function showHelp() {
    console.log(`
  ${c.bold}codehogg${c.reset} v${getVersion()}

  ${c.dim}29 agents with 43 skills for Claude Code, Codex CLI, and OpenCode.${c.reset}

  ${c.bold}Usage:${c.reset}
    codehogg [command] [options]

  ${c.bold}Commands:${c.reset}
    ${c.cyan}init${c.reset}              Interactive installation wizard
    ${c.cyan}update${c.reset}            Update installations (defaults to what's installed)
    ${c.cyan}uninstall${c.reset}         Remove installations (interactive by default)
    ${c.cyan}status${c.reset}            Show installation status
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
    --version, -v     Show version
    --help, -h        Show this help

  ${c.bold}Examples:${c.reset}
    npx codehogg init
    npx codehogg init --tool codex
    npx codehogg init --claude --codex
    npx codehogg update --global
    npx codehogg uninstall --tool opencode
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
