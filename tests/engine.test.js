import { test, describe, it } from 'node:test';
import assert from 'node:assert';
import { createEngine, EngineAdapter, OpenCodeEngine, CodexEngine, ClaudeEngine } from '../src/engine.js';
import { join } from 'path';

describe('Engine Adapter', () => {
    it('should create OpenCodeEngine', () => {
        const engine = createEngine('opencode');
        assert.ok(engine instanceof OpenCodeEngine);
        assert.strictEqual(engine.getCommand('test').command, 'opencode');
    });

    it('should create CodexEngine', () => {
        const engine = createEngine('codex');
        assert.ok(engine instanceof CodexEngine);
        assert.strictEqual(engine.getCommand('test').command, 'codex');
    });

    it('should create ClaudeEngine', () => {
        const engine = createEngine('claude');
        assert.ok(engine instanceof ClaudeEngine);
        assert.strictEqual(engine.getCommand('test').command, 'claude');
    });

    it('should throw for unsupported engine', () => {
        assert.throws(() => createEngine('invalid'), /Unsupported engine/);
    });

    it('should execute a command via run()', async () => {
        // Create a subclass that runs 'echo' instead of a real AI CLI
        class EchoEngine extends EngineAdapter {
            getCommand(prompt) {
                return {
                    command: 'echo',
                    args: [prompt]
                };
            }
        }

        const engine = new EchoEngine();
        const exitCode = await engine.run('hello world', { stdio: 'pipe' });
        assert.strictEqual(exitCode, 0);
    });
});
