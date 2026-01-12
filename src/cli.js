import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { existsSync, mkdirSync, readdirSync, statSync, copyFileSync, readFileSync, writeFileSync, rmSync, accessSync, constants } from 'fs';
import { homedir, platform } from 'os';
import { createInterface } from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PACKAGE_ROOT = resolve(__dirname, '..');
const TEMPLATES_DIR = join(PACKAGE_ROOT, 'templates');

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

// Get version from package.json
function getVersion() {
    const pkg = JSON.parse(readFileSync(join(PACKAGE_ROOT, 'package.json'), 'utf8'));
    return pkg.version;
}

// Get safe home directory
function getHomedir() {
    try {
        const home = homedir();
        if (!home || home === '') return null;
        return home;
    } catch {
        return null;
    }
}

// Get the target .claude directory
function getTargetDir(scope, customPath = null) {
    if (customPath) {
        let p = customPath;
        if (p.startsWith('~')) {
            const home = getHomedir();
            if (home) p = p.replace('~', home);
        }
        return resolve(p);
    }

    if (scope === 'global') {
        const home = getHomedir();
        if (!home) return null;
        return join(home, '.claude');
    }

    return join(process.cwd(), '.claude');
}

// Validate directory is accessible
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

// Recursively copy directory
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

// Count files in directory
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

// Count directories
function countDirs(dir) {
    if (!existsSync(dir)) return 0;
    return readdirSync(dir).filter(e => statSync(join(dir, e)).isDirectory()).length;
}

// Prompt helper using readline
function prompt(question) {
    return new Promise((resolve) => {
        const rl = createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

// Interactive menu selection
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
    // Default to first option
    return options[0].value;
}

// Yes/No prompt
async function confirm(question, defaultYes = true) {
    const hint = defaultYes ? 'Y/n' : 'y/N';
    const answer = await prompt(`  ${question} (${hint}): `);

    if (answer === '') return defaultYes;
    return answer.toLowerCase().startsWith('y');
}

// Get hooks configuration object
function getHooksConfig(scope) {
    // Use relative paths for project scope, but need absolute for global
    // Actually, relative paths work from cwd, so they work for both!
    return {
        UserPromptSubmit: [{
            hooks: [{
                type: "command",
                command: "node .claude/hooks/on-prompt-submit.cjs",
                timeout: 5,
                once: true
            }]
        }],
        Stop: [{
            hooks: [{
                type: "command",
                command: "node .claude/hooks/on-stop.cjs",
                timeout: 10
            }]
        }]
    };
}

// Merge hooks into existing settings.json
function configureHooks(settingsPath, scope) {
    let settings = {};

    if (existsSync(settingsPath)) {
        try {
            settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
        } catch {
            // If parse fails, start fresh
            settings = {};
        }
    }

    // Merge hooks config
    settings.hooks = getHooksConfig(scope);

    // Write back
    const dir = dirname(settingsPath);
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }

    writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
    return true;
}

// Remove hooks from settings.json
function removeHooksConfig(settingsPath) {
    if (!existsSync(settingsPath)) return false;

    try {
        const settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
        if (settings.hooks) {
            delete settings.hooks;
            writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
            return true;
        }
    } catch {
        // Ignore errors
    }
    return false;
}

// Print banner
function printBanner() {
    console.log(`
  ${c.bold}${c.magenta}codehogg${c.reset} ${c.dim}v${getVersion()}${c.reset}
  ${c.dim}29 agents ${sym.bullet} 43 skills for Claude Code${c.reset}
`);
}

// Interactive install
async function interactiveInit() {
    printBanner();

    console.log(`  ${c.cyan}Welcome!${c.reset} Let's set up codehogg for Claude Code.\n`);

    // Step 1: Choose scope
    const scope = await select('Where would you like to install?', [
        {
            value: 'project',
            label: 'Current project (./.claude/)',
            desc: 'Best for project-specific customization'
        },
        {
            value: 'global',
            label: 'Global (~/.claude/)',
            desc: 'Available in all projects'
        }
    ]);

    const targetDir = getTargetDir(scope);

    if (!targetDir) {
        console.log(`\n  ${c.red}Error:${c.reset} Cannot determine ${scope} directory.`);
        if (scope === 'global') {
            console.log(`  ${c.dim}Try: npx codehogg init --path ~/.claude${c.reset}\n`);
        }
        process.exit(1);
    }

    const validation = validatePath(targetDir);
    if (!validation.valid) {
        console.log(`\n  ${c.red}Error:${c.reset} ${validation.error}\n`);
        process.exit(1);
    }

    // Check for existing installation
    const hasExisting = existsSync(join(targetDir, 'agents')) ||
                        existsSync(join(targetDir, 'skills'));

    if (hasExisting) {
        const overwrite = await confirm(`${c.yellow}${sym.warn}${c.reset} Existing installation found. Overwrite?`, false);
        if (!overwrite) {
            console.log(`\n  ${c.dim}Use 'codehogg update' to update existing installation.${c.reset}\n`);
            process.exit(0);
        }
    }

    // Step 2: Hooks
    console.log(`\n  ${c.bold}Task Tracking Hooks${c.reset}`);
    console.log(`  ${c.dim}Automatically track tasks in CLAUDE.md:${c.reset}`);
    console.log(`  ${c.dim}  ${sym.bullet} on-prompt-submit: Adds tasks when you give commands${c.reset}`);
    console.log(`  ${c.dim}  ${sym.bullet} on-stop: Updates task status when Claude finishes${c.reset}\n`);

    const enableHooks = await confirm('Enable task tracking hooks?', true);

    // Step 3: Install
    console.log(`\n  ${c.bold}Installing...${c.reset}\n`);

    await doInstall(targetDir, scope, enableHooks, true);

    // Step 4: Success
    console.log(`\n  ${c.green}${c.bold}Installation complete!${c.reset}\n`);

    console.log(`  ${c.bold}Quick start:${c.reset}`);
    console.log(`    ${c.cyan}/audit-quick${c.reset}      - Run 7 key consultant agents`);
    console.log(`    ${c.cyan}/audit-full${c.reset}       - Run all 18 consultant agents`);
    console.log(`    ${c.cyan}/plan-full${c.reset}        - Full 5-phase planning workflow`);
    console.log(`    ${c.cyan}/explore-concepts${c.reset} - Generate 3 design directions`);
    console.log(`\n  ${c.dim}Run /help in Claude Code to see all commands.${c.reset}\n`);
}

// Do the actual installation
async function doInstall(targetDir, scope, enableHooks, showProgress = false) {
    const sources = {
        agents: join(TEMPLATES_DIR, 'agents'),
        skills: join(TEMPLATES_DIR, 'skills'),
        hooks: join(TEMPLATES_DIR, 'hooks'),
    };

    const targets = {
        agents: join(targetDir, 'agents'),
        skills: join(targetDir, 'skills'),
        hooks: join(targetDir, 'hooks'),
    };

    // Create target directory
    if (!existsSync(targetDir)) {
        mkdirSync(targetDir, { recursive: true });
    }

    // Copy each component
    for (const [name, source] of Object.entries(sources)) {
        if (!existsSync(source)) continue;

        const target = targets[name];
        if (existsSync(target)) {
            rmSync(target, { recursive: true, force: true });
        }

        const count = copyDir(source, target);
        const label = name === 'skills' ? `${countDirs(target)} skills` : `${count} ${name}`;

        if (showProgress) {
            console.log(`    ${c.green}${sym.check}${c.reset} ${label}`);
        }
    }

    // Copy CODEHOGG.md
    const codehoggSrc = join(TEMPLATES_DIR, 'CODEHOGG.md');
    const codehoggDest = join(targetDir, 'CODEHOGG.md');
    if (existsSync(codehoggSrc)) {
        copyFileSync(codehoggSrc, codehoggDest);
    }

    // Write timestamp
    const timestampFile = join(targetDir, '.codehogg-updated');
    writeFileSync(timestampFile, new Date().toISOString().split('T')[0]);

    // Configure hooks if requested
    if (enableHooks) {
        // Determine settings path
        let settingsPath;
        if (scope === 'global') {
            settingsPath = join(targetDir, 'settings.json');
        } else {
            // For project scope, use settings.local.json in project .claude/
            settingsPath = join(targetDir, 'settings.local.json');
        }

        configureHooks(settingsPath, scope);

        if (showProgress) {
            console.log(`    ${c.green}${sym.check}${c.reset} hooks configured in ${scope === 'global' ? 'settings.json' : 'settings.local.json'}`);
        }
    }

    return true;
}

// Non-interactive init
function init(scope, force, customPath = null, skipHooks = false) {
    const targetDir = getTargetDir(scope, customPath);

    if (!targetDir) {
        console.error(`\n  ${c.red}Error:${c.reset} Cannot determine installation directory.\n`);
        if (scope === 'global') {
            console.log(`  ${c.dim}Try: npx codehogg init --path ~/.claude${c.reset}\n`);
        }
        process.exit(1);
    }

    const validation = validatePath(targetDir);
    if (!validation.valid) {
        console.error(`\n  ${c.red}Error:${c.reset} ${validation.error}\n`);
        process.exit(1);
    }

    const scopeLabel = customPath ? `custom (${targetDir})` : (scope === 'global' ? 'global (~/.claude/)' : 'project (./.claude/)');

    console.log(`\n  ${c.bold}codehogg${c.reset} v${getVersion()}`);
    console.log(`  Installing to ${scopeLabel}\n`);

    // Check for existing
    const hasExisting = existsSync(join(targetDir, 'agents')) ||
                        existsSync(join(targetDir, 'skills'));

    if (hasExisting && !force) {
        console.log(`  ${c.yellow}${sym.warn}${c.reset} Existing installation detected.`);
        console.log(`  Use --force to overwrite, or 'codehogg update' to update.\n`);
        process.exit(1);
    }

    doInstall(targetDir, scope, !skipHooks, true);

    console.log(`\n  ${c.green}Installation complete!${c.reset}`);
    console.log(`\n  ${c.dim}Run /help in Claude Code to see all commands.${c.reset}\n`);
}

// Update command
function update(scope, customPath = null) {
    const targetDir = getTargetDir(scope, customPath);

    if (!targetDir || !existsSync(targetDir)) {
        console.log(`\n  ${c.red}Error:${c.reset} No installation found.`);
        console.log(`  Run 'codehogg init' first.\n`);
        process.exit(1);
    }

    console.log(`\n  ${c.bold}codehogg${c.reset} v${getVersion()}`);
    console.log(`  Updating ${scope} installation...\n`);

    // Check if hooks were enabled
    const settingsPath = scope === 'global'
        ? join(targetDir, 'settings.json')
        : join(targetDir, 'settings.local.json');

    let hasHooks = false;
    if (existsSync(settingsPath)) {
        try {
            const settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
            hasHooks = !!settings.hooks;
        } catch {}
    }

    doInstall(targetDir, scope, hasHooks, true);

    console.log(`\n  ${c.green}Update complete!${c.reset}\n`);
}

// Uninstall command
function uninstall(scope, customPath = null) {
    const targetDir = getTargetDir(scope, customPath);

    if (!targetDir) {
        console.error(`\n  ${c.red}Error:${c.reset} Cannot determine installation directory.\n`);
        process.exit(1);
    }

    console.log(`\n  ${c.bold}codehogg${c.reset} v${getVersion()}`);
    console.log(`  Uninstalling from ${scope}...\n`);

    let removed = false;

    const dirs = ['agents', 'skills', 'hooks'];
    for (const dir of dirs) {
        const p = join(targetDir, dir);
        if (existsSync(p)) {
            rmSync(p, { recursive: true, force: true });
            console.log(`    ${c.green}${sym.check}${c.reset} Removed ${dir}/`);
            removed = true;
        }
    }

    // Clean up files
    for (const file of ['CODEHOGG.md', '.codehogg-updated']) {
        const p = join(targetDir, file);
        if (existsSync(p)) {
            rmSync(p);
            removed = true;
        }
    }

    // Remove hooks from settings
    const settingsPath = scope === 'global'
        ? join(targetDir, 'settings.json')
        : join(targetDir, 'settings.local.json');

    if (removeHooksConfig(settingsPath)) {
        console.log(`    ${c.green}${sym.check}${c.reset} Removed hooks from settings`);
    }

    if (removed) {
        console.log(`\n  ${c.green}Uninstall complete.${c.reset}\n`);
    } else {
        console.log(`  Nothing to uninstall.\n`);
    }
}

// Status command
function status(customPath = null) {
    console.log(`\n  ${c.bold}codehogg${c.reset} v${getVersion()}\n`);

    const showScope = (label, dir) => {
        if (!dir) {
            console.log(`  ${label}: ${c.dim}Unable to determine directory${c.reset}`);
            return;
        }

        const agents = countFiles(join(dir, 'agents'));
        const skills = countDirs(join(dir, 'skills'));
        const hooks = countFiles(join(dir, 'hooks'));

        console.log(`  ${label}:`);
        if (agents > 0 || skills > 0) {
            console.log(`    ${c.green}${sym.check}${c.reset} ${agents} agents, ${skills} skills, ${hooks} hooks`);

            // Check hooks config
            const settingsPath = label.includes('Global')
                ? join(dir, 'settings.json')
                : join(dir, 'settings.local.json');

            if (existsSync(settingsPath)) {
                try {
                    const settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
                    if (settings.hooks) {
                        console.log(`    ${c.green}${sym.check}${c.reset} Hooks enabled`);
                    }
                } catch {}
            }
        } else {
            console.log(`    ${c.dim}Not installed${c.reset}`);
        }
    };

    if (customPath) {
        showScope(`Custom (${customPath})`, getTargetDir('project', customPath));
    } else {
        showScope('Project (./.claude/)', getTargetDir('project'));
        console.log('');
        showScope('Global (~/.claude/)', getTargetDir('global'));
    }

    console.log('');
}

// Help
function showHelp() {
    console.log(`
  ${c.bold}codehogg${c.reset} v${getVersion()}

  ${c.dim}29 agents with 43 skills for Claude Code.${c.reset}

  ${c.bold}Usage:${c.reset}
    codehogg [command] [options]

  ${c.bold}Commands:${c.reset}
    ${c.cyan}init${c.reset}              Interactive installation wizard
    ${c.cyan}init --global${c.reset}     Install globally (~/.claude/)
    ${c.cyan}init --local${c.reset}      Install to current project (./.claude/)
    ${c.cyan}update${c.reset}            Update project installation
    ${c.cyan}update --global${c.reset}   Update global installation
    ${c.cyan}uninstall${c.reset}         Remove from project
    ${c.cyan}status${c.reset}            Show installation status
    ${c.cyan}help${c.reset}              Show this help

  ${c.bold}Options:${c.reset}
    --global, -g      Target global ~/.claude/
    --local, -l       Target project ./.claude/ (non-interactive)
    --force, -f       Overwrite existing installation
    --no-hooks        Skip hooks configuration
    --path <dir>      Install to custom directory

  ${c.bold}Examples:${c.reset}
    npx codehogg init              ${c.dim}# Interactive wizard${c.reset}
    npx codehogg init -g           ${c.dim}# Quick global install${c.reset}
    npx codehogg init -l           ${c.dim}# Quick project install${c.reset}
    npx codehogg update -g         ${c.dim}# Update global installation${c.reset}

  ${c.bold}After installation:${c.reset}
    /audit-full       ${c.dim}Run all 18 consultant agents${c.reset}
    /audit-quick      ${c.dim}Run 7 key consultant agents${c.reset}
    /plan-full        ${c.dim}Full 5-phase planning workflow${c.reset}
    /explore-concepts ${c.dim}Generate 3 design directions${c.reset}
`);
}

// Parse arguments
function parseArgs(args) {
    return {
        command: args.find(a => !a.startsWith('-')) || null,
        global: args.includes('--global') || args.includes('-g'),
        local: args.includes('--local') || args.includes('-l'),
        force: args.includes('--force') || args.includes('-f'),
        noHooks: args.includes('--no-hooks'),
        path: (() => {
            const idx = args.indexOf('--path');
            return idx !== -1 ? args[idx + 1] : null;
        })(),
    };
}

// Main entry point
export async function run(args) {
    const opts = parseArgs(args);

    switch (opts.command) {
        case 'init':
            if (opts.global || opts.local || opts.path) {
                // Non-interactive mode
                const scope = opts.global ? 'global' : 'project';
                init(scope, opts.force, opts.path, opts.noHooks);
            } else {
                // Interactive mode
                await interactiveInit();
            }
            break;

        case 'update':
            update(opts.global ? 'global' : 'project', opts.path);
            break;

        case 'uninstall':
        case 'remove':
            uninstall(opts.global ? 'global' : 'project', opts.path);
            break;

        case 'status':
            status(opts.path);
            break;

        case 'version':
        case '-v':
        case '--version':
            console.log(getVersion());
            break;

        case 'help':
        case '--help':
        case '-h':
            showHelp();
            break;

        case null:
            // No command - show interactive or help
            if (process.stdout.isTTY) {
                await interactiveInit();
            } else {
                showHelp();
            }
            break;

        default:
            console.log(`\n  ${c.red}Unknown command:${c.reset} ${opts.command}`);
            console.log(`  Run 'codehogg help' for usage.\n`);
            process.exit(1);
    }
}
