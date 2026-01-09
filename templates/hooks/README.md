# Codehogg Hooks

Automated task lifecycle management for Claude Code.

## Hooks Included

### `on-prompt-submit.cjs`
**Event**: `UserPromptSubmit`

When user submits a prompt:
- Detects actionable tasks (not questions)
- Adds task to CLAUDE.md under "## Current Session Tasks"
- Uses `once: true` to run only once per prompt

### `on-stop.cjs`
**Event**: `Stop`

When Claude finishes responding:
- Reads transcript to analyze outcome
- Determines if task was completed, blocked, or errored
- Updates task status in CLAUDE.md

### `update-claude-tasks.cjs`
**Event**: `PostToolUse` (Edit|Write)

When files are edited:
- Matches file changes to tasks in CLAUDE.md
- Auto-checks tasks when relevant files are modified
- Uses smart keyword matching (file names, PascalCase, backticks)

## Task Status Markers

| Marker | Meaning |
|--------|---------|
| `- [ ]` | Pending |
| `- [x]` | Completed |
| `- [!]` | Blocked/Error |

## Configuration

Add to your `.claude/settings.json`:

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/on-prompt-submit.cjs\"",
            "timeout": 5,
            "once": true
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/update-claude-tasks.cjs\"",
            "timeout": 10
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/on-stop.cjs\"",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

## Debugging

Set `DEBUG_HOOK=1` environment variable to enable verbose logging:
- Logs written to `.claude/hook-debug.log`
- Task updates logged to `.claude/task-updates.log`
