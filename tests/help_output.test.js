
import { test, describe, it } from 'node:test';
import assert from 'node:assert';
import { spawnSync } from 'child_process';
import { join } from 'path';

const wtvBin = join(process.cwd(), 'bin', 'wtv.js');

describe('Help Output', () => {
    it('should document Vision Runner commands and options', () => {
        const res = spawnSync('node', [wtvBin, 'help'], { encoding: 'utf8' });
        assert.strictEqual(res.status, 0);
        
        // Strip ANSI codes
        const output = res.stdout.replace(/\x1b\[[0-9;]*m/g, '');

        // Check for Vision Runner section
        assert.match(output, /Vision Runner\s+"That he may run that readeth it"/);
        assert.match(output, /run\s+Launch Vision Runner \(interactive\)/);
        assert.match(output, /run\s+--vision <f>\s+Execute specific vision file/);
        assert.match(output, /run\s+--resume\s+Resume existing PRD.md/);

        // Check for Commands section update
        assert.match(output, /run\s+Run the vision \(Vision Runner\)/);

        // Check for Habakkuk Workflow update
        assert.match(output, /run <id>\s+Move to run \(execution started\)/);

        // Check for Vision Runner Options
        assert.match(output, /Vision Runner Options/);
        assert.match(output, /--vision <file>/);
        assert.match(output, /--engine <name>/);
        assert.match(output, /--resume/);
        assert.match(output, /--regenerate-prd/);
    });
});
