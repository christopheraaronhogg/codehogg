# Codehogg Hooks

Automated task lifecycle management for Claude Code.

## Architecture

Codehogg uses a **loader pattern** for cross-platform compatibility:

```
~/.claude/hooks-global/          # Implementations (single source of truth)
├── on-stop.cjs                  # Full task tracking logic
└── on-prompt-submit.cjs         # Full prompt detection logic

project/.claude/hooks/           # Loaders (tiny, project-local)
├── on-stop.cjs                  # require(~/.claude/hooks-global/on-stop.cjs)
└── on-prompt-submit.cjs         # require(~/.claude/hooks-global/on-prompt-submit.cjs)
```

**Why loaders?**
- Single source of truth: Update implementations once, all projects get the update
- Cross-platform: Uses `os.homedir()` and `path.join()` for Windows/macOS/Linux
- No symlinks: Avoids Windows admin/developer mode requirements
- Git-friendly: Loaders can be committed, implementations stay global

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

Run `npx codehogg init` to install both loaders and implementations automatically.

The CLI will:
1. Copy loaders to your target directory (project or global)
2. Copy implementations to `~/.claude/hooks-global/` (always global)
3. Configure hooks in settings.json

## Manual Configuration

If you need to manually configure hooks, add this to your `.claude/settings.json` or `~/.claude/settings.json`:

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

**Note:** Uses relative paths (`.claude/hooks/...`) which work from any project directory.

## Debugging

Set `DEBUG_HOOK=1` environment variable to enable verbose logging in the implementation files.
