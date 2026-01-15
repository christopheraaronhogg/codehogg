#!/usr/bin/env node

import { run } from '../src/cli.js';

run(process.argv.slice(2)).catch(err => {
    console.error(`\n\x1b[31mError:\x1b[0m ${err.message}\n`);
    process.exit(1);
});
