# AGENTS.md

## Repo Overview

codehogg is an npm package that installs a curated set of **agent templates** and **skills** into tool-specific folders:

- **Claude Code**: installs to `.claude/` (agents + skills)
- **Codex CLI**: installs to `.codex/skills/`
- **OpenCode**: installs agents to `.opencode/agent/` and loads skills from `.claude/skills/` (Claude-compatible skill path)

## Development Workflow

- Make changes in `templates/` (content) and `src/cli.js` (installer behavior).
- Smoke test locally by running:
  - `node bin/codehogg.js help`
  - `node bin/codehogg.js status`
- Don’t add git commits unless explicitly requested.

## Skill Format Rules (Codex/OpenCode Compatibility)

Every `templates/skills/<skill-name>/SKILL.md` must start with valid YAML frontmatter:

- `name`: must match the directory name (`<skill-name>`)
- `description`: single line, **<= 500 characters** (Codex limit)

Avoid malformed frontmatter and avoid extra-long descriptions.

## Hooks

Hooks are intentionally **not** part of this repo.
