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

## Task Status Markers

| Marker | Meaning |
|--------|---------|
| `- [ ]` | Pending |
| `- [x]` | Completed |
| `- [!]` | Blocked/Error |

## Installation

After running `npx codehogg init`, add this to your `.claude/settings.json` or `~/.claude/settings.json`:

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/on-prompt-submit.cjs",
            "timeout": 5,
            "once": true
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/on-stop.cjs",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

**Note:** Uses relative paths (`.claude/hooks/...`) which work on Windows, macOS, and Linux.

## Debugging

Set `DEBUG_HOOK=1` environment variable to enable verbose logging.
