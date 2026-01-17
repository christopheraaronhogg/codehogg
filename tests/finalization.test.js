import { test, describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { finalizeVisionRun } from '../src/cli.js';

describe('finalizeVisionRun', () => {
    let logs = [];
    // Mock console.log to capture output
    const originalLog = console.log;
    
    beforeEach(() => {
        logs = [];
        console.log = (...args) => logs.push(args.join(' '));
    });

    afterEach(() => {
        console.log = originalLog;
    });

    it('should return early if not a git repo', () => {
        finalizeVisionRun({
            prdPath: 'PRD.md',
            visionPath: 'vision.md',
            hasGit: false
        });
        assert.match(logs.join('\n'), /PRD complete \(no git repo detected\)/);
    });

    it('should skip commit if PRD has unchecked tasks', () => {
        const mockCountUnchecked = () => 1; // 1 unchecked task
        const mockReadFileSync = () => 'content';

        finalizeVisionRun({
            prdPath: 'PRD.md',
            visionPath: 'vision.md',
            hasGit: true,
            _countUncheckedPrdTasks: mockCountUnchecked,
            _readFileSync: mockReadFileSync
        });

        assert.match(logs.join('\n'), /PRD still has remaining tasks/);
    });

    it('should commit and push on success', () => {
        const gitCalls = [];
        const mockRunGit = (args) => {
            gitCalls.push(args);
            return { status: 0, stdout: args[0] === 'status' ? 'M file.txt' : '' };
        };
        const mockCountUnchecked = () => 0;
        const mockReadFileSync = () => 'content';

        finalizeVisionRun({
            prdPath: 'PRD.md',
            visionPath: 'vision/roadmap.md',
            hasGit: true,
            noPush: false,
            _runGit: mockRunGit,
            _countUncheckedPrdTasks: mockCountUnchecked,
            _readFileSync: mockReadFileSync
        });

        // Verify calls
        assert.deepStrictEqual(gitCalls[0], ['add', '-A']);
        assert.deepStrictEqual(gitCalls[1], ['status', '--porcelain']);
        assert.deepStrictEqual(gitCalls[2], ['commit', '-m', 'feat: run vision (roadmap)']);
        assert.deepStrictEqual(gitCalls[3], ['push']);
        
        assert.match(logs.join('\n'), /Vision complete/);
    });

    it('should skip push if noPush is true', () => {
        const gitCalls = [];
        const mockRunGit = (args) => {
            gitCalls.push(args);
            return { status: 0, stdout: args[0] === 'status' ? 'M file.txt' : '' };
        };
        const mockCountUnchecked = () => 0;
        const mockReadFileSync = () => 'content';

        finalizeVisionRun({
            prdPath: 'PRD.md',
            visionPath: 'vision/roadmap.md',
            hasGit: true,
            noPush: true,
            _runGit: mockRunGit,
            _countUncheckedPrdTasks: mockCountUnchecked,
            _readFileSync: mockReadFileSync
        });

        // Verify calls
        assert.deepStrictEqual(gitCalls[0], ['add', '-A']);
        assert.deepStrictEqual(gitCalls[1], ['status', '--porcelain']);
        assert.deepStrictEqual(gitCalls[2], ['commit', '-m', 'feat: run vision (roadmap)']);
        assert.strictEqual(gitCalls.length, 3); // No push
    });
    
    it('should retry push with upstream if push fails', () => {
        const gitCalls = [];
        const mockRunGit = (args) => {
            gitCalls.push(args);
            if (args[0] === 'push' && args.length === 1) return { status: 1 }; // Fail first push
            return { status: 0, stdout: args[0] === 'status' ? 'M file.txt' : '' };
        };
        const mockCountUnchecked = () => 0;
        const mockReadFileSync = () => 'content';
        const mockGetCurrentBranch = () => 'feature-branch';

        finalizeVisionRun({
            prdPath: 'PRD.md',
            visionPath: 'vision.md',
            hasGit: true,
            noPush: false,
            _runGit: mockRunGit,
            _countUncheckedPrdTasks: mockCountUnchecked,
            _readFileSync: mockReadFileSync,
            _getCurrentBranch: mockGetCurrentBranch
        });

        // Verify calls
        assert.deepStrictEqual(gitCalls[3], ['push']);
        assert.deepStrictEqual(gitCalls[4], ['push', '-u', 'origin', 'feature-branch']);
    });
});
