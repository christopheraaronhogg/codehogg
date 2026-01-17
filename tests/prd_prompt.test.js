import { test, describe, it } from 'node:test';
import assert from 'node:assert';
import { generatePrdPrompt } from '../src/cli.js';

describe('PRD Generation Prompt', () => {
    it('should generate the correct prompt with vision content', () => {
        const visionContent = '# My Vision\n\nBuild a cool app.';
        const prompt = generatePrdPrompt(visionContent);

        assert.ok(prompt.includes('Input vision document:'));
        assert.ok(prompt.includes(visionContent));
        assert.ok(prompt.includes('Must include a section titled "## Tasks"'));
        assert.ok(prompt.includes('write a detailed implementation checklist'));
        assert.ok(prompt.includes("Each item must use '- [ ] ' (unchecked)"));
        assert.ok(prompt.includes('Do NOT implement any code yet'));
        assert.ok(prompt.includes('Output is the updated files on disk (PRD.md)'));
    });
});
