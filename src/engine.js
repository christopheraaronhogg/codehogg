import { spawn } from 'child_process';

/**
 * Base class for AI CLI engine adapters.
 */
class EngineAdapter {
    constructor(cwd = process.cwd()) {
        this.cwd = cwd;
    }

    /**
     * Get the command and arguments for the engine.
     * @param {string} prompt - The prompt to execute.
     * @returns {{ command: string, args: string[] }}
     */
    getCommand(prompt) {
        throw new Error('getCommand must be implemented by subclass');
    }

    /**
     * Run the engine with the given prompt.
     * @param {string} prompt - The prompt to execute.
     * @param {object} options - Options for spawn.
     * @returns {Promise<number>} - Exit code.
     */
    async run(prompt, options = {}) {
        const { command, args } = this.getCommand(prompt);
        
        console.log(`[Engine] Running: ${command} ${args.join(' ')}`);

        return new Promise((resolve, reject) => {
            const child = spawn(command, args, {
                cwd: this.cwd,
                stdio: 'inherit', // Stream output to parent stdout/stderr
                shell: true,      // Use shell to resolve command paths
                ...options
            });

            child.on('error', (err) => {
                reject(err);
            });

            child.on('close', (code) => {
                resolve(code);
            });
        });
    }
}

/**
 * Adapter for OpenCode CLI.
 */
class OpenCodeEngine extends EngineAdapter {
    getCommand(prompt) {
        // Assumption: opencode takes the prompt as a single argument string
        return {
            command: 'opencode',
            args: [prompt]
        };
    }
}

/**
 * Adapter for Codex CLI.
 */
class CodexEngine extends EngineAdapter {
    getCommand(prompt) {
        // Assumption: codex takes the prompt as a single argument string
        return {
            command: 'codex',
            args: [prompt]
        };
    }
}

/**
 * Adapter for Claude Code CLI.
 */
class ClaudeEngine extends EngineAdapter {
    getCommand(prompt) {
        // Assumption: claude takes the prompt as a single argument string
        // Note: Check if it needs -p or similar flag
        return {
            command: 'claude',
            args: [prompt]
        };
    }
}

/**
 * Factory to create the appropriate engine adapter.
 * @param {string} name - The name of the engine ('opencode', 'codex', 'claude').
 * @param {string} cwd - Current working directory.
 * @returns {EngineAdapter}
 */
export function createEngine(name, cwd) {
    switch (name.toLowerCase()) {
        case 'opencode':
            return new OpenCodeEngine(cwd);
        case 'codex':
            return new CodexEngine(cwd);
        case 'claude':
            return new ClaudeEngine(cwd);
        default:
            throw new Error(`Unsupported engine: ${name}`);
    }
}

export { EngineAdapter, OpenCodeEngine, CodexEngine, ClaudeEngine };
