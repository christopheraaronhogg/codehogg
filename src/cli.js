import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { existsSync, mkdirSync, readdirSync, statSync, copyFileSync, readFileSync, writeFileSync, rmSync, accessSync, constants } from 'fs';
import { homedir } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PACKAGE_ROOT = resolve(__dirname, '..');
const TEMPLATES_DIR = join(PACKAGE_ROOT, 'templates');

// Get version from package.json
function getVersion() {
    const pkg = JSON.parse(readFileSync(join(PACKAGE_ROOT, 'package.json'), 'utf8'));
    return pkg.version;
}

// Validate a directory path is accessible
function validatePath(dirPath, description) {
    try {
        // Check if parent directory exists and is writable
        const parentDir = dirname(dirPath);
        if (!existsSync(parentDir)) {
            return {
                valid: false,
                error: `Parent directory does not exist: ${parentDir}`
            };
        }

        // Check if we can access the parent
        accessSync(parentDir, constants.W_OK);
        return { valid: true };
    } catch (err) {
        return {
            valid: false,
            error: `Cannot access ${description}: ${err.message}`
        };
    }
}

// Get safe home directory with fallback
function getSafeHomedir() {
    try {
        const home = homedir();
        if (!home || home === '') {
            return null;
        }
        // Normalize path separators for Windows
        return home.replace(/\\/g, '/');
    } catch (err) {
        return null;
    }
}

// Get the target .claude directory
function getTargetDir(isGlobal, customPath = null) {
    // Custom path takes precedence
    if (customPath) {
        return resolve(customPath);
    }

    if (isGlobal) {
        // Global: ~/.claude/ (user's home directory)
        const home = getSafeHomedir();
        if (!home) {
            return null;
        }
        return join(home, '.claude');
    }
    // Local: ./.claude/ (current working directory)
    return join(process.cwd(), '.claude');
}

// Show helpful error for path issues
function showPathError(isGlobal) {
    console.error('\n  Error: Cannot determine installation directory.\n');

    if (isGlobal) {
        console.error('  This usually means your npm/node configuration has issues.');
        console.error('  Common fixes:\n');
        console.error('  1. Reset npm prefix (if you see "ENOENT: no such file or directory"):');
        console.error('     npm config delete prefix\n');
        console.error('  2. Use a custom path instead:');
        console.error('     npx codehogg init --path ~/.claude\n');
        console.error('  3. Or install to current project instead:');
        console.error('     npx codehogg init\n');
    } else {
        console.error('  Cannot access current directory.');
        console.error('  Try specifying a path: npx codehogg init --path /path/to/.claude\n');
    }
    process.exit(1);
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

// Count files in directory recursively
function countFiles(dir) {
    if (!existsSync(dir)) return 0;

    let count = 0;
    const entries = readdirSync(dir);

    for (const entry of entries) {
        const path = join(dir, entry);
        const stat = statSync(path);

        if (stat.isDirectory()) {
            count += countFiles(path);
        } else {
            count++;
        }
    }

    return count;
}

// Count directories (skills/agents)
function countDirs(dir) {
    if (!existsSync(dir)) return 0;

    return readdirSync(dir).filter(entry => {
        return statSync(join(dir, entry)).isDirectory();
    }).length;
}

// Init command
function init(isGlobal, force, customPath = null) {
    const targetDir = getTargetDir(isGlobal, customPath);

    // Validate target directory
    if (!targetDir) {
        showPathError(isGlobal);
        return;
    }

    const validation = validatePath(targetDir, isGlobal ? 'home directory' : 'current directory');
    if (!validation.valid) {
        console.error(`\n  Error: ${validation.error}\n`);
        showPathError(isGlobal);
        return;
    }

    const agentsTarget = join(targetDir, 'agents');
    const skillsTarget = join(targetDir, 'skills');
    const commandsTarget = join(targetDir, 'commands');
    const agentsSource = join(TEMPLATES_DIR, 'agents');
    const skillsSource = join(TEMPLATES_DIR, 'skills');
    const commandsSource = join(TEMPLATES_DIR, 'commands');

    const scope = customPath ? `custom (${targetDir})` : (isGlobal ? 'global (~/.claude/)' : 'project (./.claude/)');

    console.log(`\n  codehogg v${getVersion()}`);
    console.log(`  Installing to ${scope}\n`);

    // Check if templates exist
    if (!existsSync(agentsSource) || !existsSync(skillsSource) || !existsSync(commandsSource)) {
        console.error('  Error: Templates not found. Package may be corrupted.');
        console.error('  Try reinstalling: npm install -g codehogg');
        process.exit(1);
    }

    // Check for existing installation
    const hasAgents = existsSync(agentsTarget);
    const hasSkills = existsSync(skillsTarget);
    const hasCommands = existsSync(commandsTarget);

    if ((hasAgents || hasSkills || hasCommands) && !force) {
        console.log('  Existing installation detected.');
        console.log('  Use --force to overwrite, or use "codehogg update" instead.\n');
        process.exit(1);
    }

    // Create target directory
    if (!existsSync(targetDir)) {
        mkdirSync(targetDir, { recursive: true });
    }

    // Copy agents
    console.log('  Copying agents...');
    if (hasAgents && force) {
        rmSync(agentsTarget, { recursive: true, force: true });
    }
    const agentsCopied = copyDir(agentsSource, agentsTarget);
    console.log(`    ${agentsCopied} agents`);

    // Copy skills
    console.log('  Copying skills...');
    if (hasSkills && force) {
        rmSync(skillsTarget, { recursive: true, force: true });
    }
    const skillsCopied = copyDir(skillsSource, skillsTarget);
    const skillCount = countDirs(skillsTarget);
    console.log(`    ${skillCount} skills (${skillsCopied} files)`);

    // Copy commands
    console.log('  Copying commands...');
    if (hasCommands && force) {
        rmSync(commandsTarget, { recursive: true, force: true });
    }
    const commandsCopied = copyDir(commandsSource, commandsTarget);
    console.log(`    ${commandsCopied} commands`);

    // Copy CODEHOGG.md (auto-update instructions for Claude)
    const codehoggMdSource = join(TEMPLATES_DIR, 'CODEHOGG.md');
    const codehoggMdTarget = join(targetDir, 'CODEHOGG.md');
    if (existsSync(codehoggMdSource)) {
        copyFileSync(codehoggMdSource, codehoggMdTarget);
    }

    // Write timestamp for auto-update tracking
    const timestampFile = join(targetDir, '.codehogg-updated');
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    writeFileSync(timestampFile, today);

    console.log('\n  Installation complete!\n');
    console.log('  Architecture:');
    console.log('    agents/   - Specialized workers (proactive, isolated context)');
    console.log('    skills/   - Domain knowledge (auto-loaded when relevant)');
    console.log('    commands/ - Slash commands (user-invoked orchestration)');
    console.log('\n  Quick start:');
    console.log('    /audit-quick     - Run 7 key consultant agents');
    console.log('    /audit-full      - Run all 18 consultant agents');
    console.log('    /explore-concepts - Generate 3 design directions');
    console.log('\n  Run /help in Claude Code to see all commands.\n');
}

// Update command
function update(isGlobal, customPath = null) {
    const targetDir = getTargetDir(isGlobal, customPath);

    if (!targetDir) {
        showPathError(isGlobal);
        return;
    }

    const scope = customPath ? 'custom' : (isGlobal ? 'global' : 'project');

    if (!existsSync(targetDir)) {
        console.log(`\n  No ${scope} installation found at: ${targetDir}`);
        console.log('  Run "codehogg init" first.\n');
        process.exit(1);
    }

    console.log(`\n  Updating ${scope} installation...\n`);

    // Force update by calling init with force flag
    init(isGlobal, true, customPath);
}

// Uninstall command
function uninstall(isGlobal, customPath = null) {
    const targetDir = getTargetDir(isGlobal, customPath);

    if (!targetDir) {
        showPathError(isGlobal);
        return;
    }

    const agentsTarget = join(targetDir, 'agents');
    const skillsTarget = join(targetDir, 'skills');
    const commandsTarget = join(targetDir, 'commands');
    const codehoggMdTarget = join(targetDir, 'CODEHOGG.md');
    const timestampFile = join(targetDir, '.codehogg-updated');
    const scope = customPath ? 'custom' : (isGlobal ? 'global' : 'project');

    console.log(`\n  codehogg v${getVersion()}`);
    console.log(`  Uninstalling from ${scope}...\n`);

    let removed = false;

    if (existsSync(agentsTarget)) {
        rmSync(agentsTarget, { recursive: true, force: true });
        console.log('    Removed agents/');
        removed = true;
    }

    if (existsSync(skillsTarget)) {
        rmSync(skillsTarget, { recursive: true, force: true });
        console.log('    Removed skills/');
        removed = true;
    }

    if (existsSync(commandsTarget)) {
        rmSync(commandsTarget, { recursive: true, force: true });
        console.log('    Removed commands/');
        removed = true;
    }

    // Clean up meta files
    if (existsSync(codehoggMdTarget)) {
        rmSync(codehoggMdTarget);
        removed = true;
    }
    if (existsSync(timestampFile)) {
        rmSync(timestampFile);
        removed = true;
    }

    if (removed) {
        console.log('\n  Uninstall complete.\n');
        console.log('  Note: settings.local.json was preserved.\n');
    } else {
        console.log('  Nothing to uninstall.\n');
    }
}

// Status command
function status(customPath = null) {
    const localDir = getTargetDir(false, customPath);
    const globalDir = getTargetDir(true);

    console.log(`\n  codehogg v${getVersion()}\n`);

    // Check custom path if provided
    if (customPath) {
        const customAgents = countFiles(join(localDir, 'agents'));
        const customSkills = countDirs(join(localDir, 'skills'));
        const customCommands = countFiles(join(localDir, 'commands'));

        console.log(`  Custom (${localDir}):`);
        if (customAgents > 0 || customSkills > 0 || customCommands > 0) {
            console.log(`    ${customAgents} agents, ${customSkills} skills, ${customCommands} commands`);
        } else {
            console.log('    Not installed');
        }
        console.log('');
        return;
    }

    // Check local
    const localAgents = countFiles(join(localDir, 'agents'));
    const localSkills = countDirs(join(localDir, 'skills'));
    const localCommands = countFiles(join(localDir, 'commands'));

    console.log('  Project (./.claude/):');
    if (localAgents > 0 || localSkills > 0 || localCommands > 0) {
        console.log(`    ${localAgents} agents, ${localSkills} skills, ${localCommands} commands`);
    } else {
        console.log('    Not installed');
    }

    // Check global
    if (globalDir) {
        const globalAgents = countFiles(join(globalDir, 'agents'));
        const globalSkills = countDirs(join(globalDir, 'skills'));
        const globalCommands = countFiles(join(globalDir, 'commands'));

        console.log(`\n  Global (~/.claude/):`);
        if (globalAgents > 0 || globalSkills > 0 || globalCommands > 0) {
            console.log(`    ${globalAgents} agents, ${globalSkills} skills, ${globalCommands} commands`);
        } else {
            console.log('    Not installed');
        }
    } else {
        console.log('\n  Global (~/.claude/):');
        console.log('    Unable to determine home directory');
    }

    console.log('');
}

// Help
function showHelp() {
    console.log(`
  codehogg v${getVersion()}

  28 specialized agents with 21 domain skills for Claude Code.

  Usage:
    codehogg <command> [options]

  Commands:
    init              Install to current project (./.claude/)
    init --global     Install globally (~/.claude/)
    update            Update project installation
    update --global   Update global installation
    uninstall         Remove from project
    uninstall --global Remove global installation
    status            Show installation status
    version           Show version
    help              Show this help

  Options:
    --global, -g      Target global ~/.claude/ instead of project
    --force, -f       Overwrite existing installation
    --path <dir>      Install to custom directory (useful for npm prefix issues)

  Examples:
    npx codehogg init              # Install to current project
    npx codehogg init -g           # Install globally
    npx codehogg init --path ~/.claude  # Custom path (workaround for npm issues)
    npx codehogg update            # Update project to latest
    npx codehogg status            # Check what's installed

  Troubleshooting:
    If you get "ENOENT: no such file or directory" errors:
      1. Run: npm config delete prefix
      2. Or use: npx codehogg init --path ~/.claude

  Architecture:
    agents/   - Specialized workers (run in isolated context)
    skills/   - Domain knowledge (auto-loaded when relevant)
    commands/ - Orchestration (user-invoked slash commands)

  After installation, use these commands in Claude Code:
    /audit-full       Run all 18 consultant agents
    /audit-quick      Run 7 key consultant agents
    /plan-full        Full 5-phase planning workflow
    /test-ux-personas Simulate 6 user personas testing your app
    /explore-concepts Generate 3 design directions
`);
}

// Parse --path argument
function getCustomPath(args) {
    const pathIndex = args.indexOf('--path');
    if (pathIndex !== -1 && args[pathIndex + 1]) {
        let customPath = args[pathIndex + 1];
        // Expand ~ to home directory
        if (customPath.startsWith('~')) {
            const home = getSafeHomedir();
            if (home) {
                customPath = customPath.replace('~', home);
            }
        }
        return customPath;
    }
    return null;
}

// Parse args and run
export function run(args) {
    const command = args[0];
    const isGlobal = args.includes('--global') || args.includes('-g');
    const force = args.includes('--force') || args.includes('-f');
    const customPath = getCustomPath(args);

    switch (command) {
        case 'init':
            init(isGlobal, force, customPath);
            break;
        case 'update':
            update(isGlobal, customPath);
            break;
        case 'uninstall':
        case 'remove':
            uninstall(isGlobal, customPath);
            break;
        case 'status':
            status(customPath);
            break;
        case 'version':
        case '-v':
        case '--version':
            console.log(getVersion());
            break;
        case 'help':
        case '--help':
        case '-h':
        case undefined:
            showHelp();
            break;
        default:
            console.log(`\n  Unknown command: ${command}`);
            console.log('  Run "codehogg help" for usage.\n');
            process.exit(1);
    }
}
