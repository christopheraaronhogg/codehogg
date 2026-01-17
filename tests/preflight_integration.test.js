
import { spawnSync, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import assert from 'node:assert';
import { describe, it, beforeEach, afterEach } from 'node:test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const wtvBin = path.resolve(__dirname, '../bin/wtv.js');

describe('Vision Runner Preflight Checks', () => {
    let tmpDir;
    let originalCwd;

    beforeEach(() => {
        originalCwd = process.cwd();
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wtv-test-'));
        process.chdir(tmpDir);
    });

    afterEach(() => {
        process.chdir(originalCwd);
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('should warn if not a git repository', () => {
        fs.mkdirSync('vision');
        fs.writeFileSync('vision/test.md', '# Vision');
        fs.writeFileSync('PRD.md', '# PRD\n- [ ] Task 1');

        const res = spawnSync('node', [wtvBin, 'run', '--vision', 'vision/test.md', '--engine', 'opencode', '--dry-run'], {
            encoding: 'utf8'
        });

        // Match "Not a git repository" loosely to avoid color/emoji issues
        assert.match(res.stdout, /Not a git repository/);
        assert.match(res.stdout, /Version control features disabled/);
    });

    it('should fail if working tree is dirty (non-interactive)', () => {
        execSync('git init');
        execSync('git config user.email "you@example.com"');
        execSync('git config user.name "Your Name"');
        
        fs.mkdirSync('vision');
        fs.writeFileSync('vision/test.md', '# Vision');
        execSync('git add .');
        execSync('git commit -m "Initial commit"');

        fs.writeFileSync('dirty_file.txt', 'dirty');

        const res = spawnSync('node', [wtvBin, 'run', '--vision', 'vision/test.md', '--engine', 'opencode'], {
            encoding: 'utf8'
        });

        assert.ok(res.stdout.includes('Working tree is not clean'), 'Should output working tree error');
    });

    it('should record rollback hint', () => {
        execSync('git init');
        execSync('git config user.email "you@example.com"');
        execSync('git config user.name "Your Name"');
        
        fs.mkdirSync('vision');
        fs.writeFileSync('vision/test.md', '# Vision');
        execSync('git add .');
        execSync('git commit -m "Initial commit"');
        
        const startSha = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();

        // Use --dry-run to avoid needing actual engine/hanging
        const res = spawnSync('node', [wtvBin, 'run', '--vision', 'vision/test.md', '--engine', 'opencode', '--dry-run'], {
            encoding: 'utf8'
        });

        // Check console output
        assert.match(res.stdout, new RegExp(`git reset --hard ${startSha}`));
    });
});
