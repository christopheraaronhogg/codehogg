# Contributing to wtv

## Development Workflow

### Making Changes

1. **Edit files** in `templates/` (agents, skills) or `src/`
2. **Test locally** by running `node bin/wtv.js` commands
3. **Commit and push** to GitHub

```bash
git add -A
git commit -m "feat: description of changes"
git push origin main
```

### Publishing to npm

npm and GitHub are **separate**. After pushing to GitHub, you must also publish to npm for `npx wtv` to get the updates.

```bash
# 1. Bump the version (choose one)
npm version patch   # 2.1.0 → 2.1.1 (bug fixes)
npm version minor   # 2.1.0 → 2.2.0 (new features)
npm version major   # 2.1.0 → 3.0.0 (breaking changes)

# 2. Push the version tag
git push origin main --tags

# 3. Publish to npm (requires OTP from authenticator app)
npm publish --otp=XXXXXX
```

### Version Guidelines

| Change Type | Version Bump | Example |
|-------------|--------------|---------|
| Bug fix in existing agent/skill | `patch` | Fix typo in security-consultant |
| New agent, skill, or command | `minor` | Add ux-personas system |
| Breaking change to existing behavior | `major` | Restructure command output format |

### First-Time Setup

If you haven't published before:

```bash
# 1. Create npm account at npmjs.com
# 2. Login from terminal
npm login

# 3. Verify you're logged in
npm whoami
```

### Testing Before Publishing

```bash
# Install locally to test
cd /path/to/test-project
node /path/to/wtv/bin/wtv.js init

# Or use npm link for development
cd /path/to/wtv
npm link

cd /path/to/test-project
npx wtv init
```

## Project Structure

```
wtv/
├── bin/
│   └── wtv.js           # CLI entry point
├── src/
│   └── cli.js           # CLI implementation
├── templates/
│   ├── agents/          # Agent templates
│   ├── skills/          # Skills for Claude/Codex/OpenCode
│   └── WTV.md           # Claude Code project guidance
├── package.json
├── README.md
└── CONTRIBUTING.md      # You are here
```

## Adding New Content

### New Agent

Create `templates/agents/{name}.md`:

```markdown
---
name: agent-name
description: When to use this agent (shows in Claude's agent list)
tools: Bash, Read, Write, Glob, Grep
model: opus
skills: related-skill-name
---

You are a [role]. Embody this persona completely.

## Approach

ULTRATHINK: [guidance for deep analysis]

## Context Gathering

Before analysis, read:
1. `CLAUDE.md` - Project guidelines
2. [relevant files]

## Output

Write findings to: `audit-reports/{filename}.md`
```

### New Skill

Create `templates/skills/{name}/SKILL.md`:

```markdown
---
name: skill-name
description: Brief description for /help listing
aliases: [alias1, alias2]  # Optional alternative command names
---

# Skill Name

## Overview
[What this skill provides]

## Methodology
[Framework, checklist, or evaluation criteria]

## Report Template
[Output format]

## Slash Command Invocation

This skill can be invoked via:
- `/skill-name` - Full skill with methodology
- `/alias1` - Alternative invocation

### Mode Details

[Any mode-specific instructions]
```

**Note:** As of v3.0.0, commands and skills are unified. Each skill can have aliases that become separate slash commands.

## Questions?

Open an issue at [github.com/christopheraaronhogg/codehogg/issues](https://github.com/christopheraaronhogg/codehogg/issues) (repo rename pending)
