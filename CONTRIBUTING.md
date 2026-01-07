# Contributing to codehogg

## Development Workflow

### Making Changes

1. **Edit files** in `templates/` (agents, skills, commands) or `src/`
2. **Test locally** by running `node bin/codehogg.js` commands
3. **Commit and push** to GitHub

```bash
git add -A
git commit -m "feat: description of changes"
git push origin main
```

### Publishing to npm

npm and GitHub are **separate**. After pushing to GitHub, you must also publish to npm for `npx codehogg` to get the updates.

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
node /path/to/codehogg/bin/codehogg.js init

# Or use npm link for development
cd /path/to/codehogg
npm link

cd /path/to/test-project
npx codehogg init
```

## Project Structure

```
codehogg/
├── bin/
│   └── codehogg.js      # CLI entry point
├── src/
│   └── cli.js           # CLI implementation
├── templates/
│   ├── agents/          # Agent definitions (27)
│   ├── skills/          # Domain knowledge (20)
│   └── commands/        # Slash commands (57)
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
# Skill Name

## Overview
[What this skill provides]

## Methodology
[Framework, checklist, or evaluation criteria]

## Report Template
[Output format]
```

### New Command

Create `templates/commands/{name}.md`:

```markdown
---
description: 🔧 Command Name - Brief description for /help listing
---

# Command Title

Run the **agent-name** agent for [purpose].

## Usage
$ARGUMENTS

## Output
`./audit-reports/{output-path}.md`
```

## Questions?

Open an issue at [github.com/christopheraaronhogg/codehogg/issues](https://github.com/christopheraaronhogg/codehogg/issues)
