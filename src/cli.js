import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { existsSync, mkdirSync, readdirSync, statSync, copyFileSync, readFileSync, writeFileSync, rmSync } from 'fs';
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

// Get the target .claude directory
function getTargetDir(isGlobal) {
    if (isGlobal) {
        // Global: ~/.claude/ (user's home directory)
        return join(homedir(), '.claude');
    }
    // Local: ./.claude/ (current working directory)
    return join(process.cwd(), '.claude');
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
function init(isGlobal, force) {
    const targetDir = getTargetDir(isGlobal);
    const agentsTarget = join(targetDir, 'agents');
    const skillsTarget = join(targetDir, 'skills');
    const commandsTarget = join(targetDir, 'commands');
    const agentsSource = join(TEMPLATES_DIR, 'agents');
    const skillsSource = join(TEMPLATES_DIR, 'skills');
    const commandsSource = join(TEMPLATES_DIR, 'commands');

    const scope = isGlobal ? 'global (~/.claude/)' : 'project (./.claude/)';

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
function update(isGlobal) {
    const targetDir = getTargetDir(isGlobal);
    const scope = isGlobal ? 'global' : 'project';

    if (!existsSync(targetDir)) {
        console.log(`\n  No ${scope} installation found.`);
        console.log('  Run "codehogg init" first.\n');
        process.exit(1);
    }

    console.log(`\n  Updating ${scope} installation...\n`);

    // Force update by calling init with force flag
    init(isGlobal, true);
}

// Uninstall command
function uninstall(isGlobal) {
    const targetDir = getTargetDir(isGlobal);
    const agentsTarget = join(targetDir, 'agents');
    const skillsTarget = join(targetDir, 'skills');
    const commandsTarget = join(targetDir, 'commands');
    const codehoggMdTarget = join(targetDir, 'CODEHOGG.md');
    const timestampFile = join(targetDir, '.codehogg-updated');
    const scope = isGlobal ? 'global' : 'project';

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
function status() {
    const localDir = getTargetDir(false);
    const globalDir = getTargetDir(true);

    console.log(`\n  codehogg v${getVersion()}\n`);

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
    const globalAgents = countFiles(join(globalDir, 'agents'));
    const globalSkills = countDirs(join(globalDir, 'skills'));
    const globalCommands = countFiles(join(globalDir, 'commands'));

    console.log(`\n  Global (~/.claude/):`);
    if (globalAgents > 0 || globalSkills > 0 || globalCommands > 0) {
        console.log(`    ${globalAgents} agents, ${globalSkills} skills, ${globalCommands} commands`);
    } else {
        console.log('    Not installed');
    }

    console.log('');
}

// Help
function showHelp() {
    console.log(`
  codehogg v${getVersion()}

  20 specialized agents with 19 domain skills for Claude Code.

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

  Examples:
    npx codehogg init              # Install to current project
    npx codehogg init -g           # Install globally
    npx codehogg update            # Update project to latest
    npx codehogg status            # Check what's installed

  Architecture:
    agents/   - Specialized workers (run in isolated context)
    skills/   - Domain knowledge (auto-loaded when relevant)
    commands/ - Orchestration (user-invoked slash commands)

  After installation, use these commands in Claude Code:
    /audit-full       Run all 18 consultant agents
    /audit-quick      Run 7 key consultant agents
    /plan-full        Plan with all consultants
    /explore-concepts Generate 3 design directions
`);
}

// Parse args and run
export function run(args) {
    const command = args[0];
    const isGlobal = args.includes('--global') || args.includes('-g');
    const force = args.includes('--force') || args.includes('-f');

    switch (command) {
        case 'init':
            init(isGlobal, force);
            break;
        case 'update':
            update(isGlobal);
            break;
        case 'uninstall':
        case 'remove':
            uninstall(isGlobal);
            break;
        case 'status':
            status();
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
