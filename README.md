# wtv

**Write The Vision (WTV) — a CLI for vision-driven development.**

WTV installs a Biblical “team” (Paul + artisans) into your AI coding tools (Claude Code, Codex CLI, OpenCode) so they can help you build **any** software: apps, APIs, infrastructure, data, UI, security, docs.

> "And the LORD answered me, and said, Write the vision, and make [it] plain upon tables, that he may run that readeth it."
> — Habakkuk 2:2 (KJV PCE)

> "According to the grace of God which is given unto me, as a wise masterbuilder, I have laid the foundation, and another buildeth thereon. But let every man take heed how he buildeth thereupon."
> — 1 Corinthians 3:10 (KJV PCE)

> "Where no counsel [is], the people fall: but in the multitude of counsellers [there is] safety."
> — Proverbs 11:14 (KJV PCE)

## How It Works

**wtv is a management tool, not an AI runtime.** It installs agent and skill definitions that the native AI CLIs execute so you can apply them to real development work.

```
┌─────────────────────────────────────────────────────────────────┐
│                         wtv CLI                                │
│            (Management Layer - install, list, edit)             │
└─────────────────────────────────────────────────────────────────┘
                              │
                    installs into
                              │
     ┌────────────┬───────────┼───────────┬────────────┬─────────────┐
     ▼            ▼           ▼           ▼            ▼             ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────────┐
│ Claude  │ │ OpenCode│ │  Codex  │ │ Gemini  │ │ Antigravity  │
│  Code   │ │         │ │   CLI   │ │   CLI   │ │ (Agent Rule) │
└─────────┘ └─────────┘ └─────────┘ └─────────┘ └──────────────┘
     │            │           │           │             │
     └────────────┴───────────┴───────────┴─────────────┘
                              │
                     AI executes here
              (Native Task tool spawns agents,
               skills load as context)
```

**The flow:**
1. `wtv init` installs agents/skills into tool-specific folders
2. You work in Claude Code, OpenCode, Codex, Gemini CLI, or Antigravity
3. The AI loads skills as context and spawns agents via native Task tools
4. wtv CLI helps you see and manage what's installed

## Agent Command Center

Run `wtv` anywhere to see your agent landscape:

```bash
wtv                      # Dashboard - agents, vision, quick actions
wtv agents               # List all agents (local + global)
wtv agents info <name>   # Show agent details
wtv agents add <name>    # Create new agent
wtv agents edit <name>   # Open in $EDITOR
wtv agents fav <name>    # Toggle favorite (★)
wtv agents rm <name>     # Remove agent
```

The AI inside these tools can also run `npx wtv agents` to discover what's available before spawning agents.

## Installation

### Quick Start

```bash
npx wtv init
```

Interactive wizard to install for one or more tools.

### Non-Interactive

```bash
# Claude Code (agents + skills)
npx wtv init --claude
npx wtv init --claude --global

# OpenCode (agents + skills)
npx wtv init --opencode
npx wtv init --opencode --global

# Codex CLI (skills only)
npx wtv init --codex
npx wtv init --codex --global

# Gemini CLI (agents + skills)
npx wtv init --gemini

# Antigravity (skills + rule)
npx wtv init --antigravity
```

### Updates

```bash
npx wtv update           # Update project installations
npx wtv update --global  # Update global installations
```

## What Gets Installed

### Agents (10)

Paul (the Masterbuilder) + 9 artisans:

| Agent | Domain |
|-------|--------|
| **paul** | Orchestrates /wtv - reads vision, consults artisans, creates plans |
| **nehemiah** | Security - auth, secrets, compliance |
| **bezaleel** | Architecture - structure, patterns, refactors |
| **hiram** | Backend - services, APIs, workflows |
| **aholiab** | Frontend - UI/UX, accessibility, clarity |
| **solomon** | Data - schema, integrity, migrations |
| **zerubbabel** | DevOps - CI/CD, release, deployment |
| **ezra** | QA - tests, verification, regression prevention |
| **moses** | Product - requirements, scope, acceptance |
| **david** | Voice - copy, tone, worship/remembrance |

Agents run in isolated context windows via the native Task tool. Each consults domain-specific skills for methodology.

### Skills (21)

Domain knowledge that loads as context when relevant:

- **Core:** wtv, artisan-contract, user-testing
- **Domain Consultants:** 18 specialized methodologies (security, architecture, backend, frontend, database, devops, qa, product, ux, ui-design, copy, seo, performance, cost, observability, compliance, docs, stack, code-quality)

Skills contain evaluation frameworks, checklists, and report templates.

### Installation Paths

```
# Claude Code
.claude/
├── agents/      # Agent definitions
└── skills/      # Skill definitions

# OpenCode
.opencode/
└── agent/       # Agent definitions (skills from .claude/skills/)

# Codex CLI
.codex/
└── skills/      # Skill definitions (no agents)

# Gemini CLI
.gemini/
├── agents/
└── skills/

# Antigravity
.agent/
├── rules/       # wtv-bootstrap.md (directs to AGENTS.md + agents/)
├── agents/      # Agent definitions
└── skills/      # Skill definitions
```

## Vision-Driven Development

### VISION.md

Create a vision file that agents align to. You can use a single `VISION.md` in the root, or organize multiple vision documents in a `vision/` directory.

```bash
npx wtv init   # Wizard helps you define it
```

### Directory Structure (Optional)
For complex projects, use a `vision/` folder:
- `vision/VISION.md` (Primary)
- `vision/roadmap.md`
- `vision/ideas.md`
- `vision/values.md`

Paul and the artisans will read **all markdown files** in the `vision/` directory to understand the full context.

Sections:
- **Purpose** — Who is this for and what does it do?
- **Outcomes** — What does success look like?
- **Values** — What matters most? What tradeoffs are acceptable?
- **Constraints** — What's off-limits?
- **Stage** — Prototype / MVP / Production / Maintenance
- **Current Focus** — What's the one thing right now?

### The /wtv Command

Inside Claude Code, OpenCode, or Codex:

```
/wtv                           # Strategic review: distance-to-vision
/wtv "implement OAuth login"   # Tactical mission with counsel
```

The Masterbuilder:
1. Reads VISION.md
2. Consults relevant artisans for counsel
3. Creates a plan with complete task list
4. Awaits your approval
5. Delegates execution to artisans
6. Verifies and integrates results

### Distance Bands

Progress measured in honest bands, not percentages:

| Band | Meaning |
|------|---------|
| **Near** | Requirements mostly met; only polish remaining |
| **Medium** | Core approach exists but gaps block outcomes |
| **Far** | Missing fundamentals or contradicts vision |

## The Habakkuk Workflow

A spiritual framework for product development based on Habakkuk 2:1-3.

> "I will stand upon my watch, and set me upon the tower, and will watch to see what he will say unto me... Write the vision, and make it plain upon tables, that he may run that readeth it."
> — Habakkuk 2:1-2 (KJV)

### The Five Stages

```
┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐
│  CRY OUT  │──▶│   WAIT    │──▶│  VISION   │──▶│    RUN    │──▶│  WORSHIP  │
│  Problem  │   │  Seeking  │   │  Answer   │   │  Execute  │   │  Gratitude│
└───────────┘   └───────────┘   └───────────┘   └───────────┘   └───────────┘
```

1. **CRY OUT** — Enter a problem or need ("I will stand upon my watch")
2. **WAIT** — Position to receive, gather context, pray ("watch to see what he will say")
3. **VISION** — The answer comes, write it plainly ("Write the vision, make it plain")
4. **RUN** — Execute with clarity ("that he may run that readeth it")
5. **WORSHIP** — Retrospective, gratitude, stones of remembrance (Habakkuk 3)

### Workflow Commands

```bash
# View your board
wtv board               # Show kanban board

# Create and move items
wtv cry "description"   # Enter a problem or need
wtv wait <id>           # Move to waiting (seeking)
wtv vision <id>         # Move to vision (answer received)
wtv run <id>            # Move to execution
wtv worship <id>        # Complete with retrospective

# Manage items
wtv note <id> "text"    # Add note while waiting
wtv item <id>           # View item details
wtv stones              # View completed works
```

### Vision and Worship Documents

When an item moves to **VISION**, a template is created:

```
.wtv/habakkuk/items/001-password-reset/VISION.md
```

When completing **WORSHIP**, a retrospective template is created:

```
.wtv/habakkuk/items/001-password-reset/WORSHIP.md
```

These documents capture:
- What was accomplished
- What was learned
- Evidence of God's faithfulness
- Gratitude notes
- Stones of remembrance

### Integration with Masterbuilder

When you move an item to RUN, invoke the Masterbuilder inside your AI CLI:

```
/wtv "password-reset"
```

The Masterbuilder reads your vision document and coordinates the artisans.

## Creating Custom Agents

```bash
wtv agents add my-artisan
```

This creates a new agent from template. Edit it:

```bash
wtv agents edit my-artisan
```

The template follows the artisan-contract pattern:
- Counsel mode (provide advice)
- Execution mode (implement tasks)
- Vision alignment
- Evidence citations

## CLI Reference

```bash
# Dashboard & Agents
wtv                      # Dashboard
wtv agents               # List agents
wtv agents add <name>    # Create agent
wtv agents edit <name>   # Edit agent
wtv agents fav <name>    # Toggle favorite
wtv agents rm <name>     # Remove agent

# Habakkuk Workflow
wtv board                # Show kanban board
wtv cry "description"    # Enter a problem
wtv wait <id>            # Move to waiting
wtv vision <id>          # Move to vision
wtv run <id>             # Move to execution
wtv worship <id>         # Complete with retrospective
wtv note <id> "text"     # Add note to item
wtv item <id>            # Show item details
wtv stones               # View completed works

# Installation
wtv init                 # Interactive install
wtv init --claude        # Claude Code
wtv init --opencode      # OpenCode
wtv init --codex         # Codex CLI
wtv init --gemini        # Gemini CLI
wtv init --antigravity   # Antigravity
wtv update               # Update installations
wtv status               # Show what's installed

# Vision
wtv vision               # Show VISION.md status

# Help
wtv help                 # Show help
wtv --version            # Show version
```

## Example Workflow

```bash
# 1. Install wtv for Claude Code
npx wtv init --claude

# 2. Create your vision
# (wizard runs during init, or edit VISION.md directly)

# 3. Start Claude Code and use your agents
claude

# 4. Inside Claude Code:
/wtv "implement user authentication"
# → Masterbuilder consults security, backend, database artisans
# → Creates plan with tasks
# → You approve
# → Artisans execute in parallel
# → Masterbuilder integrates and reports
```

## License

MIT

## Author

Christopher Hogg
[GitHub](https://github.com/christopheraaronhogg)
