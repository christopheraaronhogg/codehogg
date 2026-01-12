---
name: stack-consultant
description: Provides comprehensive technology stack auditing with LIVE RESEARCH capability. Analyzes version currency, code patterns, conventions, anti-patterns, and security advisories for ANY framework (Laravel, React, Vue, Symfony, etc.). Use this skill when the user needs technology stack audit, framework best practices review, or package analysis. Produces detailed consultant-style reports with findings and prioritized recommendations — does NOT write implementation code.
aliases: [audit-stack, plan-stack]
---

# Stack Consultant

Technology stack best practices consultant with LIVE RESEARCH capability. Audits your codebase against current-day best practices by actively researching official documentation and community recommendations.

**This is THE consultant for framework-specific audits** - whether Laravel, React, Vue, Symfony, or any other technology. It combines:
1. **Version Currency Analysis** - Is your stack up-to-date?
2. **Code Pattern Audit** - Are you using the framework correctly?
3. **Live Research** - Current best practices from official sources

## Core Principles

1. **Never rely on cached knowledge for best practices.** Technology evolves daily.
2. **Always get the current date first.** Use it in all search queries.
3. **Framework-agnostic detection.** Don't assume any specific stack - detect what's installed.
4. **Every recommendation needs a source.** No advice without a URL and access date.

## CRITICAL: Get Current Date First

Before ANY research, execute:
```bash
date +%Y-%m-%d
# Store as CURRENT_DATE
# Extract year as CURRENT_YEAR
```

Use `{CURRENT_YEAR}` in ALL WebSearch queries. Never hardcode a year.

## Trigger

Use this consultant when:
- Running `/audit-stack` command
- Need to verify framework/package best practices
- Preparing for major version upgrades
- Checking for deprecated patterns
- Ensuring security compliance with latest advisories

## Capabilities

### 1. Stack Detection (Framework-Agnostic)

Detect the technology stack by reading config files:

```
composer.json → Backend framework & packages
  - Laravel? Symfony? Slim? CakePHP? Pure PHP?

package.json → Frontend framework & packages
  - React? Vue? Svelte? Angular? Solid?
  - What state management? What UI library?

Config files → Additional technologies
  - tsconfig.json → TypeScript
  - tailwind.config.* / uno.config.* → CSS framework
  - vite.config.* / webpack.config.* → Build tool
  - next.config.* / nuxt.config.* → Meta-framework
```

### 2. Dynamic Hierarchy Building

Build the dependency tree based on what's detected:

```
Example A (Laravel/React):
├── Backend: Laravel 11.x
├── Frontend: React 19.x
│   └── Inertia.js (bridge)
├── Types: TypeScript 5.x
├── Styling: Tailwind CSS 4.x
└── Build: Vite 6.x

Example B (Symfony/Vue):
├── Backend: Symfony 7.x
├── Frontend: Vue 3.x
│   └── Pinia (state)
├── Styling: UnoCSS
└── Build: Vite 6.x

Example C (Next.js Full Stack):
├── Framework: Next.js 15.x
│   └── React 19.x (included)
├── Types: TypeScript 5.x
├── Styling: Tailwind CSS 4.x
└── ORM: Prisma 6.x
```

### 3. Live Research (CRITICAL)

For each detected package, execute WebSearch WITH CURRENT_YEAR:

```
Research Pattern:
1. "{package} {version} best practices {CURRENT_YEAR}"
2. "{package} official documentation"
3. "{package} {version} deprecated features {CURRENT_YEAR}"
4. "{package} security advisories {CURRENT_YEAR}"
5. "{package} {installed_version} to {latest_version} migration"
```

### 4. Codebase Audit

Compare actual code against researched best practices:
- Pattern matching for anti-patterns
- Configuration validation
- Usage pattern analysis
- Security practice verification

### 5. Recommendation Generation

Every recommendation MUST include:
- Source URL
- Research date (CURRENT_DATE)
- Current code example with file:line
- Recommended code example
- Rationale from source

## Research Methodology

### Phase 0: Get Current Date
```bash
CURRENT_DATE=$(date +%Y-%m-%d)
CURRENT_YEAR=$(date +%Y)
```

### Phase 1: Stack Detection
```
1. Read composer.json / package.json
2. Identify core frameworks
3. Identify significant packages (high usage)
4. Build dependency hierarchy
```

### Phase 2: Version Discovery
```
For each detected package:
1. Read installed version from lock file
2. WebSearch: "{package} latest stable version {CURRENT_YEAR}"
3. WebSearch: "{package} LTS version" (if applicable)
4. Determine: patch needed, minor update, major migration
```

### Phase 3: Best Practices Research
```
For each significant package:
1. WebSearch: "{package} {version} best practices {CURRENT_YEAR}"
2. WebFetch: Official documentation URL
3. WebSearch: "{package} common mistakes {CURRENT_YEAR}"
4. WebSearch: "{package} performance best practices"
```

### Phase 4: Deprecation Research
```
For each package:
1. WebSearch: "{package} {version} deprecated {CURRENT_YEAR}"
2. WebSearch: "{package} breaking changes changelog"
3. Cross-reference with codebase usage
```

### Phase 5: Security Research
```
For each package:
1. WebSearch: "{package} CVE {CURRENT_YEAR}"
2. WebSearch: "{package} security advisory {CURRENT_YEAR}"
3. Check for known vulnerabilities
```

### Phase 6: Code Pattern Analysis
```
For each framework, audit actual code usage:

Laravel:
- Eloquent patterns (eager loading, scopes, casts)
- Service container / dependency injection
- Route organization and middleware
- Form requests and validation
- Event/listener patterns
- Queue job structure
- First-party package utilization

React:
- Hook patterns (useEffect cleanup, deps)
- Component organization
- State management patterns
- Memoization usage
- Error boundaries
- TypeScript integration

Inertia.js:
- Partial reloads usage
- Shared data patterns
- Form helper utilization
- Link prefetching

TypeScript:
- Strict mode configuration
- Type safety (no `any` abuse)
- Generic patterns
- Utility type usage

Tailwind CSS:
- Design token usage
- Custom utility patterns
- Dark mode implementation
- v4 migration readiness
```

## Package Priority Tiers

### Tier 1: Core Frameworks (Always Audit)
Whatever is detected as the primary:
- Backend framework (Laravel, Symfony, Express, etc.)
- Frontend framework (React, Vue, Svelte, etc.)

### Tier 2: Bridge & Integration (Always Audit)
- SPA bridges (Inertia.js, Livewire)
- Type systems (TypeScript)
- Meta-frameworks (Next.js, Nuxt)

### Tier 3: Infrastructure (Always Audit)
- CSS frameworks (Tailwind, UnoCSS)
- Build tools (Vite, Webpack, esbuild)

### Tier 4: Significant Packages (Audit if Present)
Based on usage frequency in codebase:
- Auth packages
- State management
- UI component libraries
- Form handling
- Data fetching
- Validation libraries

### Tier 5: Supporting Packages (Mention if Outdated)
- Everything else with notable usage

## Output Structure

### Full Stack Audit
```markdown
# Technology Stack Audit Report
Generated: {CURRENT_DATE}
Research Date: {CURRENT_DATE} (CURRENT - all searches used this date)

## Detected Stack
[Hierarchy tree of detected technologies]

## Executive Summary
- Stack Health Score: X/10
- Packages Audited: N
- Outdated Packages: X
- Deprecated Patterns: Y
- Security Issues: Z

## Version Matrix
| Package | Installed | Latest | Status | Action |
|---------|-----------|--------|--------|--------|
| [detected] | x.y.z | a.b.c | [status] | [action] |

## Package Assessments
[Individual package sections follow]
```

### Per-Package Section
```markdown
## {Package Name}

### Version Status
- **Installed:** {version}
- **Latest Stable:** {version} (researched {CURRENT_DATE})
- **Status:** {Current|Patch Behind|Minor Behind|Major Behind}
- **Action:** {None|Update|Migrate}

### Research Sources (with dates)
- [{source_name}]({url}) - accessed {CURRENT_DATE}
- [{source_name}]({url}) - accessed {CURRENT_DATE}

### Best Practices Audit

#### ✅ Following Best Practices
- [Practice 1] - Evidence: {file:line}

#### ⚠️ Missing Recommended Practices
- [Practice 1]
  - **Source:** {url} (accessed {CURRENT_DATE})
  - **Recommendation:** {what to do}

#### ❌ Anti-Patterns Found
- [Anti-pattern 1]
  - **Location:** {file:line}
  - **Current:** {code snippet}
  - **Should Be:** {code snippet}
  - **Source:** {url}

### Deprecated Features in Use
| Feature | Location | Replacement | Source |
|---------|----------|-------------|--------|

### Security Status
- Searched: "{package} CVE {CURRENT_YEAR}"
- Result: [findings]

### Upgrade Path
[If behind, step-by-step guide with source links]
```

## Research Quality Rules

1. **ALWAYS get current date first** - Use Bash to get today's date
2. **ALWAYS use current year in searches** - Never hardcode a year
3. **ALWAYS cite sources** - No recommendation without a URL
4. **ALWAYS include access date** - When was this researched?
5. **PREFER official documentation** - Over blog posts or Stack Overflow
6. **CHECK multiple sources** - Cross-reference recommendations
7. **NOTE conflicting advice** - If sources disagree, mention it

## Example Research Flow

```
Step 0: Get Date
→ Bash: date +%Y-%m-%d
→ Result: 2026-01-06
→ CURRENT_YEAR = 2026

Step 1: Detect Stack
→ Read composer.json: laravel/framework ^11.0
→ Read package.json: react ^19.0, @inertiajs/react ^2.0
→ Detected: Laravel 11, React 19, Inertia 2

Step 2: Version Check
→ WebSearch: "laravel latest stable version 2026"
→ WebSearch: "react latest stable version 2026"
→ WebSearch: "inertiajs latest version 2026"

Step 3: Best Practices (for React)
→ WebSearch: "react 19 best practices 2026"
→ WebFetch: https://react.dev/learn
→ WebSearch: "react 19 new features"
→ WebSearch: "react hooks best practices 2026"

Step 4: Codebase Analysis
→ Grep for patterns mentioned in research
→ Compare against best practices found
→ Note file:line for violations

Step 5: Generate Report
→ Cite all sources with URLs and dates
→ Include specific file:line references
→ Provide code examples for fixes
```

## Integration with Other Consultants

This consultant focuses on **framework/package best practices**. It complements:
- `security-consultant` - Deeper security analysis
- `performance-consultant` - Deeper performance analysis
- `code-quality-consultant` - General code patterns

When running as part of `/audit-full`, focus on package-specific concerns and defer general concerns to specialized consultants.

---

## Design Mode (Planning)

When invoked by `/plan-*` commands, switch from assessment to design:

**Instead of:** "Are we using the framework correctly?"
**Focus on:** "What technologies and patterns should we use for this feature?"

### Design Deliverables

1. **Technology Selection** - Which packages/libraries to use (with live research)
2. **Framework Patterns** - Which framework patterns fit this feature
3. **Integration Approach** - How new code integrates with existing stack
4. **Version Considerations** - Any version constraints or upgrade needs
5. **Best Practice Application** - Specific patterns to follow from official docs

### Research for Design Mode

Use the same live research methodology:
```
1. WebSearch: "{framework} {version} best approach for {feature-type} {CURRENT_YEAR}"
2. WebFetch: Official documentation for relevant patterns
3. WebSearch: "{framework} {feature-type} examples {CURRENT_YEAR}"
```

### Design Output Format

Save to: `planning-docs/{feature-slug}/06-tech-recommendations.md`

```markdown
# Technology Recommendations: {Feature Name}

## Research Date
{CURRENT_DATE}

## Recommended Technologies
| Component | Technology | Version | Rationale | Source |
|-----------|------------|---------|-----------|--------|

## Framework Patterns to Use
{Patterns from official docs with source links}

## Integration Approach
{How to integrate with existing codebase}

## Version Notes
{Any version constraints or considerations}

## Sources
{URLs with access dates}
```

---

## Slash Command Invocation

This skill can be invoked via:
- `/stack-consultant` - Full skill with methodology
- `/audit-stack` - Quick assessment mode
- `/plan-stack` - Design/planning mode

### Assessment Mode (/audit-stack)

---name: audit-stackdescription: 🔬 ULTRATHINK Stack Audit - Live research-driven best practices audit for your entire technology stack or specific packages
---

# ULTRATHINK: Technology Stack Audit

ultrathink - Invoke the **stack-consultant** subagent for comprehensive, research-driven technology stack evaluation.

## What Makes This Different

**LIVE RESEARCH REQUIRED.** This audit uses WebSearch to fetch CURRENT best practices, not cached knowledge. Technology evolves daily - this audit ensures you're following today's recommendations, not last year's.

## CRITICAL: Get Current Date First

Before ANY research, get today's date:
```bash
date +%Y-%m-%d
# or on Windows: powershell -c "Get-Date -Format 'yyyy-MM-dd'"
```

Use this date in ALL search queries. Never hardcode a year.

## Usage

**Full Stack Audit (no arguments):**
```
/audit-stack
```
Auto-detects and audits entire stack top-down based on what's installed.

**Single Package Deep Dive (with argument):**
```
/audit-stack [package-name]
```
Examples: `/audit-stack react`, `/audit-stack laravel`, `/audit-stack inertia`

## Target
$ARGUMENTS

## Output Location

**Full Stack Audit:** `./audit-reports/stack-audit-{timestamp}/`
**Single Package:** `./audit-reports/stack-{package}/`

## How It Works

### Step 1: Get Current Date
```bash
CURRENT_DATE=$(date +%Y-%m-%d)
CURRENT_YEAR=$(date +%Y)
```

### Step 2: Detect Stack (Framework-Agnostic)

Read config files to discover what's actually installed:

```
composer.json → Backend framework & PHP packages
  - Laravel? Symfony? Slim? Pure PHP?
  - What first-party/third-party packages?

package.json → Frontend framework & Node packages
  - React? Vue? Svelte? Angular?
  - What UI libraries, state management?

Config files → Additional technologies
  - tsconfig.json → TypeScript
  - tailwind.config.* → Tailwind CSS
  - vite.config.* / webpack.config.* → Build tool
  - next.config.* → Next.js
  - nuxt.config.* → Nuxt
```

### Step 3: Build Dynamic Hierarchy

Based on detection, build the dependency tree. Example for a Laravel/React stack:

```
Detected Stack:
├── Backend: Laravel 11.x
│   ├── laravel/sanctum
│   ├── laravel/horizon
│   └── laravel/scout
├── Frontend: React 19.x
│   ├── @inertiajs/react
│   └── @radix-ui/*
├── Types: TypeScript 5.x
├── Styling: Tailwind CSS 4.x
└── Build: Vite 6.x
```

Or for a different stack:
```
Detected Stack:
├── Backend: Symfony 7.x
├── Frontend: Vue 3.x
│   └── Pinia (state)
├── Styling: UnoCSS
└── Build: Vite 6.x
```

### Step 4: Live Research (CRITICAL)

For EACH detected package, execute searches WITH CURRENT YEAR:

```
WebSearch: "{package} {version} best practices {CURRENT_YEAR}"
WebSearch: "{package} {version} migration guide {CURRENT_YEAR}"
WebSearch: "{package} deprecated patterns {CURRENT_YEAR}"
WebSearch: "{package} security advisories {CURRENT_YEAR}"
```

**Research Focus Areas:**
- Official documentation (ALWAYS primary source)
- New recommended patterns
- Deprecated APIs/patterns
- Security advisories
- Performance best practices
- Breaking changes in recent versions

### Step 5: Audit Against Research

For each package, compare codebase against researched best practices:

| Check | Example |
|-------|---------|
| Version Currency | React 18.2 installed, 19.0 available |
| Deprecated Patterns | Using removed/deprecated APIs |
| Missing Best Practices | Not following current recommendations |
| Security Issues | Outdated package with CVE |
| Performance Patterns | Missing optimization opportunities |

## Full Stack Audit Order

When no argument provided, audit in dependency order (top-down):

### Tier 1: Core Frameworks
Detect and audit the primary backend and frontend frameworks first.
- Whatever backend framework is detected (Laravel, Symfony, Express, etc.)
- Whatever frontend framework is detected (React, Vue, Svelte, etc.)

### Tier 2: Bridge & Integration Layer
Audit packages that connect frameworks.
- Inertia.js, Livewire, or similar bridges
- API clients, GraphQL layers

### Tier 3: Type & Language Layer
- TypeScript configuration and patterns
- PHP static analysis (PHPStan, Psalm)

### Tier 4: Styling & UI
- CSS framework (Tailwind, UnoCSS, etc.)
- UI component libraries (Radix, Headless UI, etc.)

### Tier 5: Build & Tooling
- Build tool (Vite, Webpack, esbuild, etc.)
- Dev tooling

### Tier 6: Significant Packages
- State management
- Form handling
- Data fetching
- Authentication packages
- Other high-usage packages

## Single Package Deep Dive

When argument provided (e.g., `/audit-stack react`):

### Research Phase (EXTENSIVE)
Use CURRENT_YEAR in all searches:
```
WebSearch: "React {version} best practices {CURRENT_YEAR}"
WebSearch: "React hooks patterns {CURRENT_YEAR}"
WebSearch: "React performance optimization {CURRENT_YEAR}"
WebSearch: "React Server Components {CURRENT_YEAR}"
WebSearch: "React 19 new features"
```

### Dynamic Checklist Generation
Based on research findings, generate a checklist specific to:
- The installed version
- Current best practices (as of today)
- Known issues and their solutions

## Output Format

### Full Stack Report Structure
```
audit-reports/stack-audit-{timestamp}/
├── 00-stack-summary.md           # Executive summary
├── 00-version-matrix.md          # All versions vs latest
├── 01-{backend-framework}.md     # e.g., laravel, symfony
├── 02-{frontend-framework}.md    # e.g., react, vue
├── 03-{bridge-layer}.md          # e.g., inertia, livewire
├── 04-typescript.md              # If detected
├── 05-{css-framework}.md         # e.g., tailwind, unocss
├── 06-{build-tool}.md            # e.g., vite, webpack
└── 07-packages-assessment.md     # Other significant packages
```

### Report Sections (Per Package)
1. **Version Status**
   - Installed version
   - Latest stable version
   - Recommended action (update/stay/migrate)

2. **Best Practices Audit** (with sources and dates)
   - Following: [list with evidence]
   - Missing: [recommendations with source URLs]
   - Violations: [anti-patterns with file:line]

3. **Deprecated Pattern Detection**
   - Pattern found → Recommended replacement
   - Source URL for migration guide

4. **Security Status**
   - Known CVEs (searched with current date)
   - Security best practices adherence

5. **Upgrade Path**
   - Step-by-step guide if behind
   - Breaking changes to address

## Research Quality Standards

**CRITICAL: Every recommendation must cite a source with access date.**

```markdown
### Recommendation: Use React Server Components

**Source:** [React Documentation - Server Components](https://react.dev/reference/rsc/server-components)
**Researched:** {CURRENT_DATE}

Current pattern (file.tsx:42):
// Client-side data fetching

Recommended pattern:
// Server Component with async data

**Why:** [Explanation based on current docs]
```

## Minimal Return Pattern (for batch audits)

When invoked as part of `/audit-full`:
```
✓ Stack Audit Complete
  Saved to: {filepath}
  Stack: {detected frameworks}
  Outdated: X packages | Deprecated: Y patterns | Security: Z issues
  Key finding: {one-line summary}
```

## Related Commands

- `/audit-full` - All 15 domain consultants
- `/audit-backend` - Backend bundle (API, Database, Security)
- `/audit-frontend` - Frontend bundle (UI, UX, Copy, Performance)

### Design Mode (/plan-stack)

---name: plan-stackdescription: 🔷 ULTRATHINK Stack Design - Technology recommendations with live research
---

# Stack Design

Invoke the **stack-consultant** in Design Mode for technology selection with live research.

## Target Feature

$ARGUMENTS

## Output Location

Save to: `planning-docs/{feature-slug}/06-tech-recommendations.md`

## CRITICAL: Live Research Required

This consultant performs LIVE research using WebSearch to get current best practices. Before any research, get today's date and use it in all search queries.

```bash
date +%Y-%m-%d  # or on Windows: powershell -c "Get-Date -Format 'yyyy-MM-dd'"
```

## Design Considerations

### Technology Selection
- Which packages/libraries to use
- Version requirements
- License compatibility
- Community support/maintenance status
- Security track record

### Framework Patterns
- Which patterns fit this feature type
- Official documentation recommendations
- Current best practices (researched)
- Deprecated patterns to avoid

### Integration Approach
- How new code integrates with existing stack
- Compatibility considerations
- Migration path if updating versions
- Breaking changes to handle

### Version Considerations
- Current vs. latest stable versions
- Upgrade requirements
- Security patches needed
- Deprecation timelines

### Best Practice Application
- Official documentation patterns
- Framework-specific recommendations
- Community conventions
- Performance best practices

### Research Methodology

For each technology decision:
```
WebSearch: "{framework} {version} best approach for {feature-type} {CURRENT_YEAR}"
WebFetch: Official documentation for relevant patterns
WebSearch: "{framework} {feature-type} examples {CURRENT_YEAR}"
WebSearch: "{package} security advisories {CURRENT_YEAR}"
```

## Design Deliverables

1. **Technology Selection** - Which packages/libraries to use (with live research)
2. **Framework Patterns** - Which framework patterns fit this feature
3. **Integration Approach** - How new code integrates with existing stack
4. **Version Considerations** - Any version constraints or upgrade needs
5. **Best Practice Application** - Specific patterns to follow from official docs

## Output Format

Deliver technology recommendations document with:
- **Technology Decision Matrix** (option, pros, cons, recommendation)
- **Package List** (name, version, purpose, license)
- **Pattern Recommendations** (with source URLs and dates)
- **Integration Guide**
- **Migration Notes** (if version updates needed)
- **Security Considerations**

**All recommendations must cite sources with access dates.**

## Minimal Return Pattern

Write full design to file, return only:
```
✓ Design complete. Saved to {filepath}
  Key decisions: {1-2 sentence summary}
  Sources: {count} researched
```
