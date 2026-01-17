import { test, describe, it, afterEach } from 'node:test';
import assert from 'node:assert';
import { ensureProgressHeader } from '../src/cli.js';
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('ensureProgressHeader', () => {
    const tmpFile = join(tmpdir(), `wtv_progress_${Date.now()}.txt`);

    afterEach(() => {
        if (existsSync(tmpFile)) {
            unlinkSync(tmpFile);
        }
    });

    it('should create header in empty file', () => {
        ensureProgressHeader(tmpFile, {
            visionPath: '/vision/VISION.md',
            engine: 'claude',
            startSha: 'abc1234'
        });

        const content = readFileSync(tmpFile, 'utf8');
        assert.ok(content.includes('WTV Vision Runner'));
        assert.ok(content.includes('Started:'));
        assert.ok(content.includes('Vision: /vision/VISION.md'));
        assert.ok(content.includes('Engine: claude'));
        assert.ok(content.includes('Start SHA: abc1234'));
    });

    it('should append header to existing content', () => {
        writeFileSync(tmpFile, 'Existing log content\n');

        ensureProgressHeader(tmpFile, {
            visionPath: '/vision/VISION.md',
            engine: 'claude',
            startSha: 'abc1234'
        });

        const content = readFileSync(tmpFile, 'utf8');
        // Existing content should be preserved
        assert.ok(content.startsWith('Existing log content\n'), 'Should preserve existing content');
        
        // New header should be appended
        // Note: checking for Vision path which is unique to the header
        assert.ok(content.includes('Vision: /vision/VISION.md'), 'Should contain new header info');
    });
});
