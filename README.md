# codehogg

**9 agents + 46 skills for Claude Code, Codex CLI, and OpenCode.**

Vision-driven development with Masterbuilder + Artisans coordination. The Masterbuilder reads your VISION.md, consults domain artisans for counsel, creates plans for your approval, delegates execution, and verifies results.

> "And the LORD answered me, and said, Write the vision, and make it plain upon tables, that he may run that readeth it."
> — Habakkuk 2:2 (KJV)

> "According to the grace of God which is given unto me, as a wise masterbuilder, I have laid the foundation, and another buildeth thereon."
> — 1 Corinthians 3:10 (KJV)

> "Where no counsel is, the people fall: but in the multitude of counsellors there is safety."
> — Proverbs 11:14 (KJV)

## Installation

### Quick Start (Interactive)

```bash
npx codehogg init
```

This runs an interactive wizard to install codehogg for one or more tools.

### Non-Interactive Installs

```bash
# Claude Code (agents + skills)
npx codehogg init --claude
npx codehogg init --claude --global

# Codex CLI (skills)
npx codehogg init --codex
npx codehogg init --codex --global

# OpenCode (skills + agents)
npx codehogg init --opencode
npx codehogg init --opencode --global
```

**OpenCode note:** skills install to `.claude/skills` (Claude-compatible path); agents install to `.opencode/agent` (global: `~/.config/opencode/agent`).

### Keep Up to Date

codehogg automatically checks for updates weekly and notifies you when a new version is available. You can also manually update:

```bash
# Update installed tools in this project
npx codehogg update

# Update installed tools globally
npx codehogg update --global

# Or target a specific tool
npx codehogg update --tool codex
```

**Disable update checks:** Set `CODEHOGG_NO_UPDATE_CHECK=1` environment variable.

## Vision-Driven Development

The core of codehogg v5.0 is **vision-driven development**. Instead of measuring code against universal standards, codehogg measures against *your declared intent*.

### VISION.md

Create a `VISION.md` in your project root:

```bash
npx codehogg init
```

The wizard guides you through defining:
- **Purpose** — Who is this for and what does it do?
- **Outcomes** — What does success look like?
- **Values** — What matters most? What tradeoffs are acceptable?
- **Constraints** — What's off-limits?
- **Stage** — Prototype / MVP / Production / Maintenance
- **Current Focus** — What's the one thing right now?

### The /codehogg Command

```bash
/codehogg                           # Strategic review: distance-to-vision
/codehogg "implement OAuth login"   # Tactical mission with counsel
```

The **Masterbuilder** agent reads your vision, consults domain artisans for counsel, creates a plan with complete task list for your approval, then delegates execution to artisans. Every recommendation traces back to your VISION.md.

### Distance Bands

Progress is measured in honest bands, not false-precision percentages:

| Band | Meaning |
|------|---------|
| **Near** | Requirements mostly met; only polish remaining |
| **Medium** | Core approach exists but gaps block outcomes |
| **Far** | Missing fundamentals or contradicts vision |

## Architecture

codehogg ships **agents + skills**, installed into tool-specific folders:

```text
# Claude Code
.claude/
├── agents/   # Claude Code agents
└── skills/   # Skills + slash command aliases

# Codex CLI
.codex/
└── skills/   # Skills (invoke as $skill-name)

# OpenCode
.opencode/
└── agent/    # OpenCode subagents
# (OpenCode skills are loaded from .claude/skills)
```

### Agents (9)

The Masterbuilder + 8 domain Artisans. Each agent:
- Runs in its own context window (isolated from main conversation)
- Uses Opus model for deep analysis
- Has restricted tool access appropriate to their role
- References skills for domain knowledge

### Skills (46)

Domain knowledge that Claude loads automatically when your request matches the skill's description. Skills contain:
- Evaluation frameworks and methodologies
- Checklists and assessment criteria
- Report templates and output formats
- Best practices and red flags

### Commands (57)

Slash commands you invoke explicitly. Commands:
- Orchestrate which agents to run
- Define wave-based execution for parallel work
- Handle output file management
- Compile summaries from multiple agents

## The Agents

### Masterbuilder + Artisans (9)

The core 2-tier architecture for vision-driven development:

| Agent | Role | Model |
|-------|------|-------|
| **masterbuilder** | The wise Masterbuilder. Orchestrates all /codehogg operations. | Opus |

**Artisans** — Domain experts that provide counsel AND execute tasks:

| Artisan | Domain |
|---------|--------|
| security-artisan | Auth, vulnerabilities, secrets, compliance |
| architecture-artisan | System design, patterns, structure, code quality |
| backend-artisan | API, services, data access, business logic |
| frontend-artisan | UI, UX, components, accessibility |
| database-artisan | Schema, queries, migrations, optimization |
| devops-artisan | CI/CD, infrastructure, deployment, observability |
| qa-artisan | Testing, quality, reliability |
| product-artisan | Requirements, scope, documentation |

## Commands

### Audit Commands

Run expert analysis on existing code:

| Command | Description |
|---------|-------------|
| `/audit-full` | Comprehensive multi-domain audit with remediation roadmap |
| `/audit-quick` | 7 key agents in 2 waves |
| `/audit-architecture` | System structure evaluation |
| `/audit-security` | OWASP vulnerabilities, auth |
| `/audit-performance` | Bottlenecks, Core Web Vitals |
| `/audit-database` | Schema, queries, indexes |
| `/audit-ui` | Visual design, AI slop detection |
| `/audit-ux` | Usability, accessibility |
| ... | (domain-specific + bundles) |

### Plan Commands

Plan new features with interview → PRD → roundtable → detailed plans:

| Command | Description |
|---------|-------------|
| `/plan-full` | Full planning workflow with discovery and expert input |
| `/plan-full "feature"` | Skip interview, proceed with provided details |
| `/plan-quick` | Streamlined planning with key domains |
| `/plan-architecture` | Architecture-focused planning |
| `/plan-security` | Security-focused planning |
| ... | (domain-specific planning commands) |

### Implementation Commands

| Command | Description |
|---------|-------------|
| `/implement-solo` | Main agent implements from plan |
| `/implement-team` | Parallel delegation for independent tasks |

## User Testing

After implementation, the Masterbuilder can conduct user testing using the `user-testing` skill. Artisans embody user personas to verify the work from real-world perspectives.

### The Personas

| Persona | Archetype | Device | Patience | Focus |
|---------|-----------|--------|----------|-------|
| Sarah | Small business owner | Mobile | Medium | "Is this for me?" |
| Mike | Experienced professional | Desktop | Low | "Worth switching?" |
| Jenny | Rush order handler | Desktop | Very Low | "Need this NOW" |
| Carlos | Mobile-first user | Mobile | Low | "Quick status check" |
| David | Accessibility user | Keyboard | High | "Can I use this?" |
| Patricia | Skeptical shopper | Desktop | High | "Is this legit?" |

### How It Works

1. Masterbuilder identifies what needs testing
2. Assigns personas to artisans (e.g., frontend-artisan → Sarah)
3. Each artisan tests from their domain expertise + persona perspective
4. Masterbuilder synthesizes findings and recommends ship/fix

This combines domain expertise with user empathy — no separate agents needed.

## Feature Planning

A professional-grade planning workflow modeled after real software development firms.

### The 5-Phase Workflow

```
INTERVIEW → PRD DRAFT → ROUNDTABLE → DETAIL → INTEGRATE
```

1. **Interview** — Discover what you want to build (optional if you provide details)
2. **PRD Draft** — Product artisan creates initial requirements
3. **Roundtable** — 9 experts sequentially enrich the PRD
4. **Detail** — Parallel deep planning for each domain
5. **Integrate** — Combine into sequenced implementation plan

### Running a Full Plan

```bash
# Interview mode - asks what you want to build
/plan-full

# Skip interview - proceed with details
/plan-full "OAuth login with Google and GitHub for our Laravel app"
```

### The Expert Roundtable

Each expert reviews the PRD and adds their considerations:

| Expert | Adds |
|--------|------|
| Architect | System structure, patterns |
| Security | Threat model, auth requirements |
| Database | Data model, schema design |
| Backend | API design, services |
| UX | User flows, states, accessibility |
| DevOps | Infrastructure, deployment |
| Performance | Load targets, optimization |
| QA | Test strategy, acceptance criteria |

### Flexible Interview

All questions are **optional**. Say "skip" or "idk" and the orchestrator:
- Makes reasonable assumptions
- Uses context from CLAUDE.md and codebase
- Notes assumptions for your confirmation
- Keeps moving forward

## How It Works

### Proactive Agent Use

With agents defined, Claude can proactively use them:

> **You:** "I just added OAuth login"
> **Claude:** "I notice you added authentication code. Let me have the security-artisan review it in a separate context."

### Wave-Based Execution

For full audits, agents run in waves to prevent context overflow:

1. **Wave 1: Quality** (3 agents) - Architecture, Code Quality, Requirements
2. **Wave 2: Backend** (5 agents) - API, Database, Stack, Security, Compliance
3. **Wave 3: Ops** (5 agents) - DevOps, Cost, Docs, QA, Observability
4. **Wave 4: Frontend** (5 agents) - UI, UX, Copy, Performance, SEO

Each agent writes their full report to a file and returns only a brief status.

### Integration Phase

After domain audits complete, findings are synthesized:

1. **Cross-references findings** - Issues flagged by multiple domains get priority boost
2. **Identifies systemic patterns** - "Technical debt concentrated in OrderService"
3. **Maps dependencies** - "Fix input validation BEFORE addressing SQL injection"
4. **Creates remediation roadmap** - Phased plan respecting dependencies

This transforms isolated reports into ONE coherent action plan.

### Context Isolation

Each agent runs in its own context window, which means:
- Main conversation stays focused on high-level objectives
- Agents can do deep analysis without polluting your context
- Failed agents don't affect others in the wave

## Output Structure

### Audit Reports

```
audit-reports/{timestamp}/
├── 00-executive-summary.md      # Combined findings + cross-domain insights
├── 00-priority-matrix.md        # All findings ranked with corroboration
├── 00-remediation-roadmap.md    # Phased action plan with dependencies
├── 01-architecture-assessment.md
├── 02-security-assessment.md
├── ...
└── [domain]-assessment.md
```

### Planning Documents

```
planning-docs/{feature-slug}/
├── 00-interview-notes.md       # Discovery conversation (if happened)
├── 01-prd-draft.md             # Initial PRD
├── 02-prd-enriched.md          # PRD after expert roundtable
├── plans/
│   ├── architecture.md
│   ├── security.md
│   ├── database.md
│   ├── backend.md
│   ├── frontend.md
│   └── ...
└── 99-implementation-plan.md   # Final sequenced plan
```

## Project Integration

For best results, your project should include:

### CLAUDE.md (recommended)

Project-specific guidelines, voice/tone, conventions.

### DESIGN_SYSTEM.md (recommended)

Design tokens, colors, typography, component patterns.

Agents read these automatically when gathering context.

## CLI Reference

```bash
# Interactive wizard (choose tool(s) + scope)
npx codehogg init

# Non-interactive installs
npx codehogg init --claude
npx codehogg init --codex
npx codehogg init --opencode

# Global installs
npx codehogg init --claude --global
npx codehogg init --codex --global
npx codehogg init --opencode --global

# Update (defaults to what's installed)
npx codehogg update
npx codehogg update --global
npx codehogg update --tool codex

# Check installation status
npx codehogg status

# Uninstall
npx codehogg uninstall            # interactive
npx codehogg uninstall --tool codex

# Show version/help
npx codehogg --version
npx codehogg help
```

## Example Workflows

### Quick Health Check

```bash
npx codehogg init
```
Then in Claude Code:
```
/audit-quick
```
Get analysis from 7 key agents in about 5 minutes.

### Deep Security Review

```
/audit-security
```
The security-artisan runs in isolated context with OWASP methodology.

### Plan a New Feature

```
/plan-full "user authentication with OAuth"
```
Full 5-phase planning: interview (skipped with input), PRD, expert roundtable, detailed plans, integrated implementation plan.

Or for faster planning:
```
/plan-quick "user authentication with OAuth"
```

## License

MIT

## Author

Christopher Hogg
[GitHub](https://github.com/christopheraaronhogg)
