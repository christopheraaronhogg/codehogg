#!/usr/bin/env node
/**
 * CLAUDE.md Task Auto-Updater Hook
 *
 * PostToolUse hook that automatically marks tasks complete in CLAUDE.md
 * when related files are edited.
 *
 * Matching strategies:
 * 1. Exact file path match (e.g., "use-ai-studio-api.ts" in task)
 * 2. File basename match (e.g., "types.ts")
 * 3. Component/class name extraction (e.g., "AiStudioController" from path)
 * 4. Keywords from camelCase/PascalCase/kebab-case parsing
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  // Files to track (glob-like patterns matched against relative paths)
  trackPatterns: [
    /\.(tsx?|jsx?|php|vue|css|scss|json)$/i,
  ],
  // Files to ignore
  ignorePatterns: [
    /CLAUDE\.md$/i,
    /\.claude\//,
    /node_modules\//,
    /vendor\//,
    /\.git\//,
    /package-lock\.json$/,
    /composer\.lock$/,
  ],
  // Task list section markers (regex)
  taskSectionPattern: /^##[#]?\s*(.*Task.*|Backend|Frontend|Verification)/im,
  // Unchecked task pattern
  uncheckedTaskPattern: /^(\s*-\s*\[)( )(\].+)$/,
};

/**
 * Extract meaningful keywords from a file path
 */
function extractKeywords(filePath) {
  const keywords = new Set();

  // Normalize path separators
  const normalizedPath = filePath.replace(/\\/g, '/');

  // Get filename without extension
  const basename = path.basename(normalizedPath);
  const nameWithoutExt = basename.replace(/\.[^.]+$/, '');

  keywords.add(basename.toLowerCase());
  keywords.add(nameWithoutExt.toLowerCase());

  // Split camelCase, PascalCase, kebab-case, snake_case
  const parts = nameWithoutExt
    .replace(/([a-z])([A-Z])/g, '$1 $2')  // camelCase -> camel Case
    .replace(/[-_]/g, ' ')                  // kebab-case -> kebab case
    .toLowerCase()
    .split(/\s+/)
    .filter(p => p.length > 2);             // Skip tiny words

  parts.forEach(p => keywords.add(p));

  // Extract directory names that might be meaningful
  const dirParts = normalizedPath.split('/');
  dirParts.forEach(part => {
    if (part && !['app', 'src', 'resources', 'js', 'php', 'components', 'pages', 'models', 'controllers', 'hooks'].includes(part.toLowerCase())) {
      keywords.add(part.toLowerCase());
    }
  });

  // For files like "AiStudioController.php", also add "ai studio controller"
  const classNameMatch = nameWithoutExt.match(/^([A-Z][a-z]+)+/);
  if (classNameMatch) {
    keywords.add(classNameMatch[0].toLowerCase());
  }

  return keywords;
}

/**
 * Check if a task description matches a file
 */
function taskMatchesFile(taskText, fileKeywords, filePath) {
  const taskLower = taskText.toLowerCase();
  const normalizedPath = filePath.replace(/\\/g, '/').toLowerCase();

  // Strategy 1: Direct file path/name mention
  const basename = path.basename(normalizedPath);
  const nameWithoutExt = basename.replace(/\.[^.]+$/, '');

  if (taskLower.includes(basename)) return { match: true, reason: `contains filename "${basename}"` };
  if (taskLower.includes(nameWithoutExt)) return { match: true, reason: `contains name "${nameWithoutExt}"` };

  // Strategy 2: Check for backtick-quoted identifiers
  const backtickMatches = taskText.match(/`([^`]+)`/g);
  if (backtickMatches) {
    for (const match of backtickMatches) {
      const identifier = match.replace(/`/g, '').toLowerCase();
      // Check if identifier appears in file path
      if (normalizedPath.includes(identifier)) {
        return { match: true, reason: `backtick identifier "${identifier}" in path` };
      }
      // Check if identifier matches a keyword
      for (const keyword of fileKeywords) {
        if (identifier.includes(keyword) || keyword.includes(identifier)) {
          return { match: true, reason: `backtick identifier "${identifier}" matches keyword "${keyword}"` };
        }
      }
    }
  }

  // Strategy 3: Component/class name in task
  // Look for PascalCase words in task that match file keywords
  const pascalCaseWords = taskText.match(/[A-Z][a-z]+(?:[A-Z][a-z]+)*/g) || [];
  for (const word of pascalCaseWords) {
    const wordLower = word.toLowerCase();
    if (fileKeywords.has(wordLower)) {
      return { match: true, reason: `PascalCase "${word}" matches keyword` };
    }
    // Also check if the word is contained in the path
    if (normalizedPath.includes(wordLower)) {
      return { match: true, reason: `PascalCase "${word}" in path` };
    }
  }

  // Strategy 4: Multiple keyword matches (require at least 2)
  let keywordMatches = 0;
  const matchedKeywords = [];
  for (const keyword of fileKeywords) {
    if (keyword.length > 3 && taskLower.includes(keyword)) {
      keywordMatches++;
      matchedKeywords.push(keyword);
    }
  }
  if (keywordMatches >= 2) {
    return { match: true, reason: `multiple keywords: ${matchedKeywords.join(', ')}` };
  }

  return { match: false };
}

/**
 * Update CLAUDE.md with completed tasks
 */
function updateClaudeMd(claudeMdPath, filePath, dryRun = false) {
  if (!fs.existsSync(claudeMdPath)) {
    return { updated: false, reason: 'CLAUDE.md not found' };
  }

  const content = fs.readFileSync(claudeMdPath, 'utf8');
  const lines = content.split('\n');
  const fileKeywords = extractKeywords(filePath);

  let updated = false;
  const updates = [];

  const newLines = lines.map((line, index) => {
    // Check if this is an unchecked task
    const match = line.match(CONFIG.uncheckedTaskPattern);
    if (!match) return line;

    const [fullMatch, prefix, checkbox, suffix] = match;
    const taskText = suffix;

    // Check if task matches file
    const matchResult = taskMatchesFile(taskText, fileKeywords, filePath);
    if (matchResult.match) {
      updated = true;
      updates.push({
        line: index + 1,
        task: taskText.trim().substring(0, 60) + (taskText.length > 60 ? '...' : ''),
        reason: matchResult.reason,
      });
      return `${prefix}x${suffix}`;
    }

    return line;
  });

  if (updated && !dryRun) {
    fs.writeFileSync(claudeMdPath, newLines.join('\n'));
  }

  return { updated, updates };
}

// Set to true to enable debug logging (or set DEBUG_HOOK=1 env var)
const DEBUG = process.env.DEBUG_HOOK === '1';

/**
 * Debug logging helper (only logs if DEBUG is enabled)
 */
function debugLog(cwd, message, data = null) {
  if (!DEBUG) return;
  try {
    const logPath = path.join(cwd || process.cwd(), '.claude', 'hook-debug.log');
    const entry = `${new Date().toISOString()} - ${message}${data ? ': ' + JSON.stringify(data) : ''}\n`;
    fs.appendFileSync(logPath, entry);
  } catch (e) {
    // Ignore
  }
}

/**
 * Main hook entry point
 */
async function main() {
  let input = '';

  // Read JSON from stdin
  for await (const chunk of process.stdin) {
    input += chunk;
  }

  let cwd = process.cwd();

  try {
    const data = JSON.parse(input);
    cwd = data.cwd || cwd;

    debugLog(cwd, 'Hook started', { tool: data.tool_name });

    // Extract file path from tool input
    const filePath = data.tool_input?.file_path;

    if (!filePath || !cwd) {
      debugLog(cwd, 'Missing filePath or cwd, exiting');
      process.exit(0);
    }

    // Get relative path for pattern matching
    const relativePath = path.relative(cwd, filePath).replace(/\\/g, '/');
    debugLog(cwd, 'Processing file', { relativePath });

    // Check if we should track this file
    const shouldTrack = CONFIG.trackPatterns.some(p => p.test(relativePath));
    const shouldIgnore = CONFIG.ignorePatterns.some(p => p.test(relativePath));

    debugLog(cwd, 'Track/Ignore check', { shouldTrack, shouldIgnore });

    if (!shouldTrack || shouldIgnore) {
      debugLog(cwd, 'Skipping file (track/ignore rules)');
      process.exit(0);
    }

    // Update CLAUDE.md
    const claudeMdPath = path.join(cwd, 'CLAUDE.md');
    debugLog(cwd, 'Updating CLAUDE.md', { claudeMdPath, exists: fs.existsSync(claudeMdPath) });

    const result = updateClaudeMd(claudeMdPath, relativePath);
    debugLog(cwd, 'Update result', result);

    if (result.updated && result.updates.length > 0) {
      // Log to a file for debugging (optional)
      const logPath = path.join(cwd, '.claude', 'task-updates.log');
      const logEntry = {
        timestamp: new Date().toISOString(),
        file: relativePath,
        updates: result.updates,
      };

      let existingLog = [];
      if (fs.existsSync(logPath)) {
        try {
          existingLog = JSON.parse(fs.readFileSync(logPath, 'utf8'));
        } catch (e) {
          existingLog = [];
        }
      }
      existingLog.push(logEntry);

      // Keep only last 100 entries
      if (existingLog.length > 100) {
        existingLog = existingLog.slice(-100);
      }

      fs.writeFileSync(logPath, JSON.stringify(existingLog, null, 2));
      debugLog(cwd, 'Task updates logged', { count: result.updates.length });
    }

    debugLog(cwd, 'Hook completed successfully');
    process.exit(0);
  } catch (e) {
    // Log error for debugging
    debugLog(cwd, 'Hook error', { error: e.message, stack: e.stack });
    try {
      const errorLogPath = path.join(cwd, '.claude', 'hook-errors.log');
      fs.appendFileSync(errorLogPath, `${new Date().toISOString()} - ${e.message}\n${e.stack}\n\n`);
    } catch (logError) {
      // Ignore logging errors
    }
    process.exit(0);
  }
}

main();
