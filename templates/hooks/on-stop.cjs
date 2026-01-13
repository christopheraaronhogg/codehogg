#!/usr/bin/env node
/**
 * Hook Loader - Cross-Platform
 *
 * This loader finds and runs the actual hook implementation from ~/.claude/hooks/
 * Works identically on Windows, macOS, and Linux using Node.js path APIs.
 */
const path = require('path');
const os = require('os');

const globalHook = path.join(os.homedir(), '.claude', 'hooks-global', 'on-stop.cjs');
require(globalHook);
