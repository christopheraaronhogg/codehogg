# AGENTS.md

## What is wtv?

**wtv (Write The Vision) is a management layer, not an AI runtime.**

It installs agent and skill definitions into the native folders of AI-powered CLIs:

```
┌─────────────────────────────────────────────────────────────────┐
│                         wtv CLI                                │
│            (Management Layer - install, list, edit)             │
└─────────────────────────────────────────────────────────────────┘
                              │
                    installs into
                              │
     ┌────────────┬───────────┼───────────┬────────────┐
     ▼            ▼           ▼           ▼            ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ Claude  │ │ OpenCode│ │  Codex  │ │ Gemini  │ │  Future │
│  Code   │ │         │ │   CLI   │ │   CLI   │ │  Tools  │
└─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘
     │            │           │           │            │
     └────────────┴───────────┴───────────┴────────────┘
                              │
                     AI executes here
              (Native Task tool spawns agents,
               skills load as context)
```

The AI tools do the actual work. wtv just manages what's installed.

## Installation Paths

| Tool | Agents | Skills |
|------|--------|--------|
| **Claude Code** | `.claude/agents/` | `.claude/skills/` |
| **OpenCode** | `.opencode/agent/` | `.claude/skills/` (shared) |
| **Codex CLI** | (no agents) | `.codex/skills/` |
| **Gemini CLI** | `.gemini/agents/` | `.gemini/skills/` |
| **Antigravity** | `.agent/rules/` | `.agent/skills/` |

## What Gets Installed

- **10 agents** (Paul + 9 Artisans)
- **21 skills** (wtv, artisan-contract, user-testing + 18 domain consultants)

## Development Workflow

- Make changes in `templates/` (content) and `src/cli.js` (installer behavior)
- Smoke test locally:
  - `node bin/wtv.js help`
  - `node bin/wtv.js status`
  - `node bin/wtv.js agents`
- Don't add git commits unless explicitly requested

## Skill Format Rules (Codex/OpenCode Compatibility)

Every `templates/skills/<skill-name>/SKILL.md` must start with valid YAML frontmatter:

- `name`: must match the directory name
- `description`: single line, **<= 500 characters** (Codex limit)

## Agent Format

Agents in `templates/agents/<name>.md` use frontmatter:

```yaml
---
name: agent-name
description: What this agent does
tools: Bash, Read, Write, Glob, Grep, Task, Edit, WebFetch, WebSearch
model: opus
skills: skill1, skill2, skill3
---
```

For OpenCode, the installer converts this to their format with boolean tool flags.

## Hooks

Hooks are intentionally **not** part of this repo.

## Update Checks

wtv automatically checks for updates weekly via `update-notifier`. To disable during development, set `WTV_NO_UPDATE_CHECK=1` (or legacy `CODEHOGG_NO_UPDATE_CHECK=1`).

## Agent Command Center

The CLI provides a dashboard for managing agents:

```bash
wtv                      # Dashboard
wtv agents               # List all agents
wtv agents add <name>    # Create new agent
wtv agents edit <name>   # Open in $EDITOR
wtv agents fav <name>    # Toggle favorite
wtv agents rm <name>     # Remove agent
```

Config is stored in `.wtv/config.json` (project) or `~/.wtv/config.json` (global).
