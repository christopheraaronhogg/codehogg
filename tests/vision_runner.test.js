import { test, describe, it, afterEach, beforeEach } from 'node:test';
import assert from 'node:assert';
import { runVisionTaskIteration } from '../src/cli.js';
import { writeFileSync, readFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Vision Runner Task Iteration', () => {
    const tmpDir = tmpdir();
    const prdPath = join(tmpDir, `PRD_${Date.now()}.md`);
    const progressPath = join(tmpDir, `progress_${Date.now()}.txt`);

    beforeEach(() => {
        writeFileSync(prdPath, `
# PRD

## Tasks
- [ ] Task 1
- [ ] Task 2
`);
        writeFileSync(progressPath, '');
    });

    afterEach(() => {
        if (existsSync(prdPath)) unlinkSync(prdPath);
        if (existsSync(progressPath)) unlinkSync(progressPath);
    });

    it('should successfully complete a task', async () => {
        const taskText = 'Task 1';
        
        // Mock engine that updates the PRD
        const mockRunEngine = async (engine, prompt) => {
            // Verify prompt contains expected instructions
            assert.ok(prompt.includes(taskText));
            assert.ok(prompt.includes('Implement ONLY the task above'));
            
            // Simulate agent work: update PRD
            const currentPrd = readFileSync(prdPath, 'utf8');
            const updatedPrd = currentPrd.replace(`- [ ] ${taskText}`, `- [x] ${taskText}`);
            writeFileSync(prdPath, updatedPrd);
            
            return 0; // Success exit code
        };

        await runVisionTaskIteration({
            engine: 'opencode',
            prdPath,
            progressPath,
            taskText,
            _runEngine: mockRunEngine
        });

        // Verify PRD is updated
        const finalPrd = readFileSync(prdPath, 'utf8');
        assert.ok(finalPrd.includes(`- [x] ${taskText}`));

        // Verify progress is updated
        const finalProgress = readFileSync(progressPath, 'utf8');
        assert.ok(finalProgress.includes(`Completed: ${taskText}`));
    });

    it('should fail if PRD is not updated', async () => {
        const taskText = 'Task 1';
        
        // Mock engine that does NOT update the PRD
        const mockRunEngine = async () => {
            return 0;
        };

        await assert.rejects(async () => {
            await runVisionTaskIteration({
                engine: 'opencode',
                prdPath,
                progressPath,
                taskText,
                _runEngine: mockRunEngine
            });
        }, /PRD.md was not updated/);
    });

    it('should fail if engine exits with error', async () => {
        const taskText = 'Task 1';
        
        const mockRunEngine = async () => {
            return 1; // Error code
        };

        await assert.rejects(async () => {
            await runVisionTaskIteration({
                engine: 'opencode',
                prdPath,
                progressPath,
                taskText,
                _runEngine: mockRunEngine
            });
        }, /Engine exited with code 1/);
    });

    it('should not update progress if PRD update fails', async () => {
        const taskText = 'Task 1';
        
        const mockRunEngine = async () => {
            return 0;
        };

        try {
            await runVisionTaskIteration({
                engine: 'opencode',
                prdPath,
                progressPath,
                taskText,
                _runEngine: mockRunEngine
            });
        } catch (e) {
            // Expected error
        }

        const finalProgress = readFileSync(progressPath, 'utf8');
        assert.strictEqual(finalProgress, '');
    });
});
