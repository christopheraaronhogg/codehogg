# codehogg

**18 expert consultant subagents for Claude Code.**

Comprehensive codebase audits, feature planning, and implementation guidance through specialized AI consultants working in parallel.

## Installation

### Quick Start (Project)

```bash
npx codehogg init
```

This installs skills and commands to your project's `.claude/` directory.

### Global Installation

```bash
npx codehogg init --global
```

This installs to `~/.claude/` so commands are available across all projects.

### Keep Up to Date

```bash
# Update project installation
npx codehogg update

# Update global installation
npx codehogg update --global
```

## Commands

After installation, these commands are available in Claude Code:

### Audit Commands (Assessment Mode)

Run expert analysis on existing code:

| Command | Description |
|---------|-------------|
| `/audit-full` | All 18 consultants in 4 waves |
| `/audit-quick` | 7 key consultants (fastest) |
| `/audit-architecture` | System structure evaluation |
| `/audit-security` | OWASP vulnerabilities, auth |
| `/audit-performance` | Bottlenecks, Core Web Vitals |
| `/audit-database` | Schema, queries, indexes |
| `/audit-api` | REST design, endpoints |
| `/audit-ui` | Visual design assessment |
| `/audit-ux` | Usability, accessibility |
| `/audit-copy` | Content quality, voice |
| `/audit-code` | Tech debt, maintainability |
| `/audit-devops` | CI/CD, infrastructure |
| `/audit-qa` | Testing strategy |
| `/audit-docs` | Documentation coverage |
| `/audit-cost` | Cloud costs, FinOps |
| `/audit-compliance` | GDPR, CCPA, privacy |
| `/audit-stack` | Framework best practices |
| `/audit-seo` | Technical SEO |
| `/audit-observability` | Logging, monitoring |
| `/audit-requirements` | Product scope |

#### Bundle Commands

| Command | Consultants |
|---------|-------------|
| `/audit-backend` | API, Database, Stack, Security, Compliance |
| `/audit-frontend` | UI, UX, Copy, Performance, SEO |
| `/audit-ops` | DevOps, Cost, Docs, QA, Observability |
| `/audit-quality` | Architecture, Code Quality, Requirements |

### Plan Commands (Design Mode)

Plan new features before implementation:

| Command | Description |
|---------|-------------|
| `/plan-full` | Full planning with all 18 consultants |
| `/plan-quick` | Fast planning with 7 key consultants |
| `/plan-architecture` | System design planning |
| `/plan-api` | API contract design |
| `/plan-database` | Schema design |
| `/plan-security` | Security requirements |
| `/plan-ui` | Visual design specs |
| `/plan-ux` | User flow design |
| ... | (mirrors all audit commands) |

#### Bundle Commands

| Command | Focus |
|---------|-------|
| `/plan-foundation` | Product spec, Architecture, Code standards |
| `/plan-backend` | API, Database, Stack, Security, Compliance |
| `/plan-frontend` | UI, UX, Copy, Performance, SEO |
| `/plan-ops` | DevOps, Cost, Docs, QA, Observability |

### Implementation Commands

| Command | Description |
|---------|-------------|
| `/implement-solo` | Main agent implements from plan sequentially |
| `/implement-team` | Parallel delegation for independent tasks |

### Creative Commands

| Command | Description |
|---------|-------------|
| `/explore-concepts` | Generate 3 distinct implementation directions |

## The 18 Consultant Domains

Each consultant is a specialized AI expert:

| Consultant | Expertise |
|------------|-----------|
| **architect** | System design, modularity, patterns |
| **backend** | API design, services, data access |
| **database** | Schema, queries, performance |
| **security** | OWASP, auth, vulnerabilities |
| **compliance** | GDPR, CCPA, privacy |
| **stack** | Framework best practices (live research) |
| **devops** | CI/CD, infrastructure |
| **cost** | Cloud costs, FinOps |
| **docs** | Documentation quality |
| **qa** | Testing strategy |
| **observability** | Logging, monitoring |
| **ui-design** | Visual design, aesthetics |
| **ux** | Usability, accessibility |
| **copy** | Content, voice, microcopy |
| **performance** | Bottlenecks, optimization |
| **seo** | Technical SEO |
| **code-quality** | Tech debt, maintainability |
| **product** | Requirements, scope |

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
├── 02-architecture-design.md
├── ...
└── 18-seo-requirements.md
```

## How It Works

### Wave-Based Execution

To prevent context overflow, consultants run in waves:

1. **Wave 1: Quality** (3 consultants) - Architecture, Code Quality, Requirements
2. **Wave 2: Backend** (5 consultants) - API, Database, Stack, Security, Compliance
3. **Wave 3: Ops** (5 consultants) - DevOps, Cost, Docs, QA, Observability
4. **Wave 4: Frontend** (5 consultants) - UI, UX, Copy, Performance, SEO

Each consultant writes their full report to a file and returns only a brief status, keeping context lean.

### Parallel Subagents

Within each wave, consultants run in parallel using Claude's Task tool. This provides:
- Faster analysis (parallel execution)
- Deeper insights (each consultant has full focus)
- Structured output (consistent report format)

## Project Integration

For best results, your project should include:

### CLAUDE.md (recommended)

Project-specific guidelines, voice/tone, conventions.

### DESIGN_SYSTEM.md (recommended)

Design tokens, colors, typography, component patterns.

The consultants read these automatically when gathering context.

## CLI Reference

```bash
# Install to current project
npx codehogg init

# Install globally
npx codehogg init --global
npx codehogg init -g

# Update to latest version
npx codehogg update
npx codehogg update --global

# Check installation status
npx codehogg status

# Uninstall
npx codehogg uninstall
npx codehogg uninstall --global

# Force reinstall (overwrite existing)
npx codehogg init --force

# Show version
npx codehogg version

# Show help
npx codehogg help
```

## Example Workflows

### New Project Audit

```bash
npx codehogg init
```
Then in Claude Code:
```
/audit-full
```
Get a comprehensive 18-consultant analysis of your entire codebase.

### Security Review Before Deploy

```
/audit-security
```
Run the security consultant for OWASP analysis and vulnerability assessment.

### Plan a New Feature

```
/plan-quick "user authentication with OAuth"
```
Get planning documents from 7 consultants covering architecture, security, UX, and more.

### Generate UI Options

```
/explore-concepts "admin dashboard for order analytics"
```
Get 3 distinct implementation directions with evocative physical metaphors.

## License

MIT

## Author

Christopher Hogg
[GitHub](https://github.com/christopheraaronhogg)
