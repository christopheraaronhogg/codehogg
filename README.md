# codehogg

**20 specialized agents with 19 domain skills for Claude Code.**

Comprehensive codebase audits, feature planning, and implementation guidance through a three-tier architecture of agents, skills, and commands.

## Installation

### Quick Start (Project)

```bash
npx codehogg init
```

This installs agents, skills, and commands to your project's `.claude/` directory.

### Global Installation

```bash
npx codehogg init --global
```

This installs to `~/.claude/` so everything is available across all projects.

### Keep Up to Date

```bash
# Update project installation
npx codehogg update

# Update global installation
npx codehogg update --global
```

## Architecture

codehogg uses a three-tier system that maps to Claude Code's native constructs:

```
.claude/
├── agents/    # Specialized workers (run in isolated context)
├── skills/    # Domain knowledge (auto-loaded when relevant)
└── commands/  # Orchestration (user-invoked slash commands)
```

### Agents (20)

Specialized workers that run in their own context window. Each agent:
- Has a focused persona and expertise
- Uses a specific model (Opus for deep analysis, Sonnet for implementation)
- Has restricted tool access appropriate to their role
- References skills for domain knowledge
- Can be proactively triggered by Claude when relevant

### Skills (19)

Domain knowledge that Claude loads automatically when your request matches the skill's description. Skills contain:
- Evaluation frameworks and methodologies
- Checklists and assessment criteria
- Report templates and output formats
- Best practices and red flags

### Commands (53)

Slash commands you invoke explicitly. Commands:
- Orchestrate which agents to run
- Define wave-based execution for parallel work
- Handle output file management
- Compile summaries from multiple agents

## The Agents

| Agent | Expertise | Model |
|-------|-----------|-------|
| architect-consultant | System design, modularity, patterns | Opus |
| backend-consultant | API design, services, data access | Opus |
| code-quality-consultant | Tech debt, maintainability | Opus |
| compliance-consultant | GDPR, CCPA, privacy | Opus |
| copy-consultant | Content, voice, AI slop detection | Opus |
| cost-consultant | Cloud costs, FinOps | Opus |
| database-consultant | Schema, queries, performance | Opus |
| devops-consultant | CI/CD, infrastructure | Opus |
| docs-consultant | Documentation quality | Opus |
| observability-consultant | Logging, monitoring | Opus |
| performance-consultant | Bottlenecks, optimization | Opus |
| product-consultant | Requirements, scope | Opus |
| qa-consultant | Testing strategy | Opus |
| security-consultant | OWASP, vulnerabilities | Opus |
| seo-consultant | Technical SEO | Opus |
| stack-consultant | Framework best practices | Opus |
| ui-design-consultant | Visual design, AI slop | Opus |
| ux-consultant | Usability, accessibility | Opus |
| explore-concepts | Creative direction generation | Opus |
| implementer | Feature implementation | Sonnet |

## Commands

### Audit Commands

Run expert analysis on existing code:

| Command | Description |
|---------|-------------|
| `/audit-full` | All 18 consultant agents in 4 waves |
| `/audit-quick` | 7 key agents in 2 waves |
| `/audit-architecture` | System structure evaluation |
| `/audit-security` | OWASP vulnerabilities, auth |
| `/audit-performance` | Bottlenecks, Core Web Vitals |
| `/audit-database` | Schema, queries, indexes |
| `/audit-ui` | Visual design, AI slop detection |
| `/audit-ux` | Usability, accessibility |
| ... | (18 individual + 4 bundles) |

### Plan Commands

Plan new features before implementation:

| Command | Description |
|---------|-------------|
| `/plan-full` | Full planning with all 18 consultants |
| `/plan-quick` | Fast planning with 7 key consultants |
| `/plan-architecture` | System design planning |
| `/plan-security` | Security requirements |
| ... | (mirrors audit commands) |

### Creative Commands

| Command | Description |
|---------|-------------|
| `/explore-concepts` | Generate 3 distinct implementation directions |

### Implementation Commands

| Command | Description |
|---------|-------------|
| `/implement-solo` | Main agent implements from plan |
| `/implement-team` | Parallel delegation for independent tasks |

## How It Works

### Proactive Agent Use

With agents defined, Claude can proactively use them:

> **You:** "I just added OAuth login"
> **Claude:** "I notice you added authentication code. Let me have the security-consultant agent review it in a separate context."

### Wave-Based Execution

For full audits, agents run in waves to prevent context overflow:

1. **Wave 1: Quality** (3 agents) - Architecture, Code Quality, Requirements
2. **Wave 2: Backend** (5 agents) - API, Database, Stack, Security, Compliance
3. **Wave 3: Ops** (5 agents) - DevOps, Cost, Docs, QA, Observability
4. **Wave 4: Frontend** (5 agents) - UI, UX, Copy, Performance, SEO

Each agent writes their full report to a file and returns only a brief status.

### Context Isolation

Each agent runs in its own context window, which means:
- Main conversation stays focused on high-level objectives
- Agents can do deep analysis without polluting your context
- Failed agents don't affect others in the wave

## Output Structure

### Audit Reports

```
audit-reports/{timestamp}/
├── 00-executive-summary.md
├── 00-priority-matrix.md
├── 01-architecture-assessment.md
├── 02-code-quality-assessment.md
├── ...
└── 18-seo-assessment.md
```

### Planning Documents

```
planning-docs/{feature-slug}/
├── 00-prd.md
├── 00-implementation-plan.md
├── 01-product-spec.md
├── ...
└── 18-seo-requirements.md
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
# Install to current project
npx codehogg init

# Install globally
npx codehogg init --global

# Update to latest version
npx codehogg update
npx codehogg update --global

# Check installation status
npx codehogg status

# Uninstall
npx codehogg uninstall
npx codehogg uninstall --global

# Force reinstall
npx codehogg init --force

# Show version/help
npx codehogg version
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
The security-consultant agent runs in isolated context with OWASP methodology.

### Plan a New Feature

```
/plan-quick "user authentication with OAuth"
```
Get planning documents from 7 consultant agents.

### Generate UI Options

```
/explore-concepts "admin dashboard for order analytics"
```
Get 3 distinct directions with physical metaphors:
- Industrial Command Center (dense, dark, monospace)
- Editorial Magazine (whitespace, serif, storytelling)
- Playful Mosaic (bento grid, animations, discovery)

## License

MIT

## Author

Christopher Hogg
[GitHub](https://github.com/christopheraaronhogg)
