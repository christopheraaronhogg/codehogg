import { spawnSync } from 'child_process';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const binPath = resolve(__dirname, '../bin/wtv.js');

console.log('Running routing tests...');

let failed = false;

// Test 1: wtv run <id> -> Habakkuk
// We expect "Item not found" or similar specific Habakkuk output because ID 99999 shouldn't exist
console.log('Test 1: wtv run <id> (Habakkuk routing)');
const habakkukRes = spawnSync(process.execPath, [binPath, 'run', '99999'], { encoding: 'utf8' });
if (habakkukRes.stdout.includes('Item not found') || habakkukRes.stdout.includes('THE HABAKKUK BOARD')) {
    console.log('  PASS: Routed to Habakkuk logic');
} else {
    console.error('  FAIL: Did not route to Habakkuk logic');
    console.error('Output:', habakkukRes.stdout);
    console.error('Error:', habakkukRes.stderr);
    failed = true;
}

// Test 2: wtv run -> Vision Runner
// In non-interactive mode without flags, it should error asking for flags
console.log('Test 2: wtv run (Vision Runner routing)');
const runnerRes = spawnSync(process.execPath, [binPath, 'run'], { encoding: 'utf8' });
if (runnerRes.stdout.includes('run requires interactive TTY') || runnerRes.stdout.includes('Vision Runner')) {
    console.log('  PASS: Routed to Vision Runner logic');
} else {
    console.error('  FAIL: Did not route to Vision Runner logic');
    console.error('Output:', runnerRes.stdout);
    console.error('Error:', runnerRes.stderr);
    failed = true;
}

if (failed) {
    console.error('Tests failed.');
    process.exit(1);
} else {
    console.log('All routing tests passed.');
}
