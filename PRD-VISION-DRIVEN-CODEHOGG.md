# PRD: Vision-Driven Codehogg

**Version:** 5.0
**Author:** Christopher Hogg
**Date:** January 2026
**Status:** Ready for Implementation

---

## Executive Summary

Codehogg is pivoting from a collection of audit tools to a **vision-driven development system**. Instead of measuring codebases against universal health standards, codehogg will measure them against the user's declared intent.

**The shift:**
- From: "Is this code healthy?" (generic)
- To: "Is this code becoming what you said you wanted?" (vision-aligned)

**The mechanism:**
- `VISION.md` becomes the single source of truth for project direction (user-owned, never machine-edited)
- A **Team Lead** agent receives the vision and mission, decides whether to handle solo or delegate to specialist counselors
- Progress is tracked as "distance-to-vision" using bands (Far / Medium / Near), not false-precision percentages
- Task logs live in `.codehogg/logs/`, keeping VISION.md clean and conflict-free

**The foundation:**
This system is built on scriptural principles about vision, counsel, and wisdom.

---

## Table of Contents

1. [Philosophical Foundation](#1-philosophical-foundation)
2. [Current State](#2-current-state)
3. [Core Concepts](#3-core-concepts)
4. [Technical Architecture](#4-technical-architecture)
5. [The /codehogg Skill](#5-the-codehogg-skill)
6. [The Team Lead](#6-the-team-lead)
7. [VISION.md Specification](#7-visionmd-specification)
8. [Logging & Storage](#8-logging--storage)
9. [The Counselor Model](#9-the-counselor-model)
10. [Skill Ecosystem Integration](#10-skill-ecosystem-integration)
11. [Quality Assurance](#11-quality-assurance)
12. [CLI Changes](#12-cli-changes)
13. [Migration Path](#13-migration-path)
14. [Non-Goals](#14-non-goals)
15. [Success Metrics](#15-success-metrics)
16. [MVP Scope](#16-mvp-scope)
17. [Appendices](#17-appendices)

---

## 1. Philosophical Foundation

### The Core Scriptures

> **"And the LORD answered me, and said, Write the vision, and make it plain upon tables, that he may run that readeth it."**
> — Habakkuk 2:2 (KJV)

> **"Where no counsel is, the people fall: but in the multitude of counsellors there is safety."**
> — Proverbs 11:14 (KJV)

> **"Without counsel purposes are disappointed: but in the multitude of counsellors they are established."**
> — Proverbs 15:22 (KJV)

> **"For by wise counsel thou shalt make thy war: and in multitude of counsellors there is safety."**
> — Proverbs 24:6 (KJV)

> **"The way of a fool is right in his own eyes: but he that hearkeneth unto counsel is wise."**
> — Proverbs 12:15 (KJV)

> **"Ointment and perfume rejoice the heart: so doth the sweetness of a man's friend by hearty counsel."**
> — Proverbs 27:9 (KJV)

---

## 2. Current State

### What Codehogg Is Today (v4.0)

- **29 agents** across consultant, UX persona, and orchestrator categories
- **43 skills** for audits, planning, and implementation
- **57 commands** for orchestrating agent workflows
- Supports **Claude Code**, **Codex CLI**, and **OpenCode**

### Current Architecture

```
User request → Audit command → Multiple agents → Reports
```

Agents measure against **universal best practices**: OWASP for security, WCAG for accessibility, generic code quality standards, etc.

### The Problem

1. **Context-free judgment**: A prototype with no tests gets flagged as unhealthy, even if that's appropriate for its stage
2. **Generic advice**: Recommendations apply to any project, not this specific project
3. **No user intent**: Agents don't know what the user is trying to build
4. **No progress tracking**: Each audit is independent; we can't measure improvement over time

### The Opportunity

By adding a vision layer, we can transform generic audits into vision-aligned counsel. The same security agent becomes infinitely more valuable when it knows:
- The project is targeting enterprise customers with SOC2 requirements
- The current stage is MVP
- The user explicitly values security over velocity

---

## 3. Core Concepts

### 3.1 VISION.md

The single source of truth for project direction. Human-authored. Machine-readable. Plain Markdown.

**Principles:**
- **User-authored only** — agents never write to VISION.md, ever
- **Blank is valid** — missing sections mean "not specified"
- **Plain language** — no DSLs, no YAML config, just words
- **Living document** — user updates as direction changes

### 3.2 The Team Lead

When `/codehogg` is invoked, a **Team Lead** agent receives the vision and mission. The Team Lead:

1. Assesses: "Can I handle this solo, or do I need specialists?"
2. Decides: Either does it himself OR calls in specific counselors
3. Synthesizes: If he called others, he integrates their input
4. Presents: Enters plan mode for user approval
5. Executes: Implements the approved plan
6. Logs: Records what was done to `.codehogg/logs/`

The Team Lead only delegates when genuinely needed. Simple tasks stay fast and cheap.

### 3.3 Counselors

Specialist agents the Team Lead can call upon. Each counselor:
- Has deep expertise in one domain
- Reads the vision and mission from the Team Lead
- Provides domain-specific counsel with evidence
- Returns findings to the Team Lead for synthesis

Counselors don't act autonomously—they advise the Team Lead.

### 3.4 Distance-to-Vision

Instead of universal health scores, we measure alignment with declared vision using **bands**:

| Band | Meaning | Evidence Required |
|------|---------|-------------------|
| **Near** | Requirements mostly met; only polish/edge cases remain | Direct evidence (tests pass, lint clean, etc.) |
| **Medium** | Core approach exists but gaps block stated outcomes | Partial evidence (some tests, inferring from patterns) |
| **Far** | Missing foundational capabilities or contradicts vision | Minimal evidence (guessing, vision is vague) |

**Blank vision = no distance calculated.** If the user hasn't declared anything about security, the Team Lead reports "Not specified in vision. No alignment to measure."

No percentages. Bands are honest about what we can actually measure.

---

## 4. Technical Architecture

### 4.1 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER                                    │
│                          │                                      │
│              /codehogg "implement OAuth"                        │
│                          │                                      │
│                          ▼                                      │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │                    TEAM LEAD                             │  │
│   │                                                          │  │
│   │  1. Read VISION.md                                       │  │
│   │  2. Parse mission                                        │  │
│   │  3. Decide: solo or delegate?                            │  │
│   │  4. If delegate: call specific counselors                │  │
│   │  5. Synthesize counsel                                   │  │
│   │  6. Present plan (plan mode)                             │  │
│   │  7. Execute with approval                                │  │
│   │  8. Log to .codehogg/logs/                               │  │
│   │                                                          │  │
│   └──────────────────────────────────────────────────────────┘  │
│                          │                                      │
│            ┌─────────────┴─────────────┐                        │
│            ▼                           ▼                        │
│   ┌─────────────────┐         ┌─────────────────┐              │
│   │ Security        │         │ Backend         │   (only if   │
│   │ Counselor       │         │ Counselor       │    needed)   │
│   └─────────────────┘         └─────────────────┘              │
│                                                                 │
│                          │                                      │
│                          ▼                                      │
│              ┌─────────────────────┐                            │
│              │    VISION.md        │ ◄── User-owned (read-only) │
│              └─────────────────────┘                            │
│                                                                 │
│              ┌─────────────────────┐                            │
│              │  .codehogg/logs/    │ ◄── Machine-managed        │
│              └─────────────────────┘                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Component Responsibilities

| Component | Responsibility | Who Writes |
|-----------|---------------|------------|
| **VISION.md** | Store user intent and project direction | User only |
| **Team Lead** | Orchestrate: read vision, decide delegation, synthesize, execute | Agent |
| **Counselors** | Provide domain-specific, vision-aligned advice | Agent (when called) |
| **`.codehogg/logs/`** | Track tasks, counsel given, actions taken | Machine only |
| **Plan Mode** | Get user approval before execution | Agent presents, user approves |

### 4.3 Two Command Modes

```bash
/codehogg                           # Strategic: review distance-to-vision
/codehogg "implement OAuth login"   # Tactical: mission with counsel
```

**Strategic mode:** Team Lead assesses current state against full vision, reports gaps by domain.

**Tactical mode:** Vision provides context, argument provides mission. Team Lead decides how to accomplish the mission within vision constraints.

---

## 5. The /codehogg Skill

### 5.1 Skill Definition

```yaml
---
name: codehogg
description: >
  Vision-driven development. Reads VISION.md, assesses the mission,
  decides whether to handle solo or delegate to specialist counselors,
  synthesizes recommendations, and executes with plan mode approval.
  Use alone for strategic review. Use with an argument for tactical missions.
user-invocable: true
model: claude-opus-4-5-20251101
---
```

### 5.2 Invocation

```
/codehogg                           # "Team Lead, how are we doing against the vision?"
/codehogg "implement user auth"     # "Team Lead, here's the mission. How do we solve it?"
```

---

## 6. The Team Lead

### 6.1 Role

The Team Lead is the single entry point for `/codehogg`. They receive:
- The full VISION.md content
- The mission (if tactical mode)
- Access to the codebase

They decide how to proceed.

### 6.2 Decision Framework

```
IF mission is straightforward AND within my competence:
    → Handle it myself (no delegation)

IF mission touches specialized domains (security, database, etc.):
    → Call relevant counselors
    → Synthesize their input

IF mission requires specific capabilities:
    → Invoke appropriate skills (frontend-design, etc.)
```

### 6.3 Available Counselors

The Team Lead can call upon:

| Counselor | Domain | When to Call |
|-----------|--------|--------------|
| **security** | Auth, vulnerabilities, secrets, compliance | Mission involves auth, data protection, or vision mentions security |
| **architecture** | Structure, patterns, coupling, scale | Mission involves significant structural decisions |
| **backend** | API, services, data access | Mission involves server-side code |
| **frontend** | UI, components, interactions | Mission involves user interface |
| **database** | Schema, queries, performance | Mission involves data modeling or storage |
| **testing** | Coverage, reliability, CI | Mission involves quality assurance |
| **docs** | Documentation, API docs | Mission involves documentation |
| **performance** | Speed, efficiency, optimization | Mission involves performance-sensitive code |
| **devops** | CI/CD, infrastructure, deployment | Mission involves deployment or infrastructure |
| **accessibility** | A11y, WCAG, usability | Mission involves user-facing features |
| **compliance** | GDPR, CCPA, regulations | Mission involves data handling or privacy |
| **cost** | Cloud costs, resource efficiency | Mission involves infrastructure decisions |

### 6.4 Available Skills

The Team Lead can invoke:

| Skill | Capability | When to Use |
|-------|------------|-------------|
| **frontend-design** | High-quality UI implementation | Building user interfaces |
| **pdf, docx** | Document generation | Creating documentation |
| **plan mode** | User approval workflow | Before any execution |

### 6.5 Delegation Reasoning

When the Team Lead delegates, they explain why:

```
"I'm calling the Security counselor because:
- The mission involves authentication
- Your vision says 'SOC2 Type II compliance required'
- I want specialized input on threat modeling"
```

This makes delegation transparent and auditable.

### 6.6 Execution Protocol

```
1. Read VISION.md
   - If missing, prompt user to run `codehogg init`
   - Parse all sections, note which are blank

2. Parse mission (if tactical mode)
   - Understand what needs to be done
   - Identify domains that might be affected

3. Decide: solo or delegate?
   - Simple, within competence → solo
   - Complex or specialized → delegate

4. If delegating:
   - Call relevant counselors with vision + mission context
   - Each counselor returns findings with evidence
   - Synthesize counsel, surface contradictions

5. Enter plan mode
   - Present what we plan to do
   - Explain why (traced to vision)
   - Wait for user approval

6. Execute (if approved)
   - Implement the plan
   - Invoke skills as needed
   - Track progress

7. Log to .codehogg/logs/
   - Record task, counsel, actions, outcome
   - Note distance change if measurable
```

---

## 7. VISION.md Specification

### 7.1 Template

```markdown
# Vision

> "And the LORD answered me, and said, Write the vision, and make it plain upon tables, that he may run that readeth it."
> — Habakkuk 2:2 (KJV)

## Purpose
<!-- Who is this for and what does it do? -->

## Outcomes
<!-- What does success look like? Be concrete. -->

## Values
<!-- What matters most? What tradeoffs are acceptable? -->

## Constraints
<!-- What's off-limits? Time, budget, compliance, dependencies? -->

## Stage
<!-- Where are we? Prototype / MVP / Production / Maintenance -->

## Current Focus
<!-- What's the one thing right now? -->
```

**Note:** No Task Log section. VISION.md is entirely user-owned.

### 7.2 Section Semantics

| Section | Purpose | Team Lead Use |
|---------|---------|---------------|
| **Purpose** | Who and what | Validates all recommendations serve the target user |
| **Outcomes** | Success criteria | Measures distance-to-vision |
| **Values** | Priorities and tradeoffs | Resolves conflicts (e.g., "security over velocity") |
| **Constraints** | Hard limits | Filters out invalid recommendations |
| **Stage** | Project maturity | Calibrates expectations (prototype ≠ production) |
| **Current Focus** | Immediate priority | Prioritizes work for current phase |

### 7.3 Principles

- **User-authored only**: Agents never write to VISION.md. Ever. Not even a Task Log section.
- **Tolerant of blanks**: Missing sections are valid, not errors
- **Flexible structure**: Sections can be in any order
- **Plain language**: No special syntax required within sections

### 7.4 Editing

Users edit VISION.md directly in their editor of choice. This friction is intentional—the user must own and understand their vision.

`codehogg init` provides guided prompts for first-time setup, but after that, the user maintains the file manually.

---

## 8. Logging & Storage

### 8.1 Principle

**VISION.md stays clean. Logs live elsewhere.**

This prevents:
- Merge conflicts when multiple devs run `/codehogg`
- PR noise from machine-generated content
- The vision getting buried under operational history

### 8.2 Log Location

```
.codehogg/
└── logs/
    └── YYYY-MM-DD/
        └── <task-id>.md
```

Example:
```
.codehogg/
└── logs/
    └── 2026-01-15/
        └── implement-oauth-login.md
```

### 8.3 Log Format

Each task log contains:

```markdown
# Task: implement OAuth login

**Date:** 2026-01-15
**Mode:** Tactical
**Status:** Completed

## Vision Context

> Purpose: B2B order management for wholesale distributors
> Values: Security is non-negotiable
> Constraints: SOC2 Type II compliance required
> Stage: MVP

## Mission

Implement OAuth login with Google and GitHub providers.

## Team Lead Assessment

Delegated to: Security, Backend, Frontend

Reasoning: Mission involves authentication (security-sensitive) and
touches multiple layers (backend API + frontend UI).

## Counsel Received

### Security Counselor
- Recommended OAuth 2.0 with PKCE flow
- Flagged need for secure token storage
- Confidence: HIGH (direct evidence from vision constraints)

### Backend Counselor
- Recommended adapter pattern for multiple providers
- Suggested session-based auth over JWT for this use case
- Confidence: HIGH

### Frontend Counselor
- Recommended minimal login page with provider buttons
- No custom form needed (OAuth handles credentials)
- Confidence: MEDIUM

## Synthesis

No contradictions. All counselors agreed on:
- OAuth 2.0 with PKCE
- Server-side session management
- Minimal frontend

## Plan Approved

User approved plan at 14:32.

## Actions Taken

1. Created `src/auth/oauth.js` — OAuth adapter
2. Created `src/auth/providers/google.js`
3. Created `src/auth/providers/github.js`
4. Created `src/pages/login.jsx`
5. Updated `src/middleware/auth.js`

## Outcome

- 5 files created/modified
- Tests passing
- Distance change: Security Far → Medium (auth implemented, audit logging pending)
```

### 8.4 Viewing Logs

```bash
codehogg log                    # Show recent tasks
codehogg log --task <id>        # Show specific task
codehogg log --date 2026-01-15  # Show tasks from date
```

---

## 9. The Counselor Model

### 9.1 Role

Counselors are specialists the Team Lead calls upon. They don't act autonomously—they advise.

### 9.2 Counselor Behavior Contract

Every counselor MUST:

1. **Read context from Team Lead** — vision sections + mission
2. **Cite specific evidence** — file paths, line numbers, test output
3. **Trace to vision** — every recommendation references a vision statement OR explicitly states "vision is silent"
4. **Report confidence** — HIGH/MEDIUM/LOW based on signal quality
5. **Acknowledge blanks** — if vision is silent on their domain, say so
6. **Stay in lane** — don't advise outside their expertise

### 9.3 Counselor Output Format

```markdown
## Counsel: [Domain]

### Vision Alignment
- **Relevant statements:** [quotes from vision]
- **Silence:** [areas where vision doesn't specify]

### Findings
- [Finding] at `file:line` — [evidence]
- [Finding] at `file:line` — [evidence]

### Recommendations
1. [Action] — because vision says [quote] — confidence: [HIGH/MEDIUM/LOW]
2. [Action] — because vision says [quote] — confidence: [HIGH/MEDIUM/LOW]

### Distance Assessment
- Current: [Far/Medium/Near]
- After recommendations: [Far/Medium/Near]
- Confidence: [HIGH/MEDIUM/LOW]
```

### 9.4 Confidence Levels

| Level | Meaning | Example Signals |
|-------|---------|-----------------|
| **HIGH** | Direct evidence available | Test results, lint output, runtime errors, explicit vision statements |
| **MEDIUM** | Inferring from patterns | Code structure, naming conventions, dependencies |
| **LOW** | Guessing or vision is vague | No clear signals, ambiguous vision statements |

---

## 10. Skill Ecosystem Integration

### 10.1 The Landscape

As of January 2026:
- **Agent Skills** is an open standard (agentskills.io)
- **Claude Code**, **OpenCode**, and **Codex CLI** all support SKILL.md format
- **1st party skills** exist: document skills (pdf, docx, pptx, xlsx), frontend-design
- **Partner skills** at claude.com/connectors: Figma, Notion, Stripe, etc.

### 10.2 Integration Strategy

**Codehogg wraps, doesn't rebuild.**

The Team Lead can invoke 1st party and partner skills, injecting vision context:

```
┌─────────────────────────────────────────────────────────────┐
│                    TEAM LEAD                                │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │              Vision Context Injection               │   │
│   │   (Extract constraints from VISION.md)              │   │
│   └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│                          ▼                                  │
│   ┌─────────────────────────────────────────────────────┐   │
│   │              Underlying Skill                       │   │
│   │   (frontend-design, pdf, docx, etc.)                │   │
│   └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│                          ▼                                  │
│   ┌─────────────────────────────────────────────────────┐   │
│   │              Output Validation                      │   │
│   │   (Does output align with vision?)                  │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 11. Quality Assurance

### 11.1 The Problem

AI counsel degrades over time due to:
1. **Context decay** — frameworks evolve, CVEs emerge
2. **Generic advice syndrome** — safe, abstract recommendations
3. **Hallucinated confidence** — sounds authoritative, lacks grounding
4. **No feedback loop** — never learn if advice was good

### 11.2 Systematic Solutions

#### For Context Decay: Live Research

Counselors that touch external dependencies MUST be able to fetch current state:
- Security counselor queries CVE databases
- Stack counselor fetches framework changelogs
- Docs counselor validates referenced APIs still exist

#### For Generic Advice: Codebase Grounding

Every recommendation MUST cite specific evidence:

**Bad:** "Consider adding input validation"
**Good:** "In `src/api/orders.js:147`, the `orderId` parameter is passed directly to the SQL query. This contradicts your vision statement 'SOC2 compliant' which requires parameterized queries."

#### For Hallucinated Confidence: Evidence-Based Bands

Distance bands tied to evidence quality:
- **Near** requires direct evidence (tests pass, lint clean)
- **Medium** requires partial evidence (some tests, inferring from patterns)
- **Far** acknowledges minimal evidence (guessing)

No percentages. Bands are honest.

#### For No Feedback Loop: Task Log Analysis

The logs in `.codehogg/logs/` enable pattern analysis:
- Track counsel given vs actions taken
- Surface patterns: "Security counselor recommended X three times, never implemented"
- Prompt user: "Is this a vision misalignment or intentional deferral?"

### 11.3 Always Ultrathink

All `/codehogg` invocations use extended thinking. This enables:
- Deeper analysis
- More nuanced recommendations
- Better synthesis
- Fewer hallucinations

The tradeoff (cost, time) is acceptable for quality counsel. For simple tasks, the Team Lead handles it solo without calling counselors, keeping costs reasonable.

---

## 12. CLI Changes

### 12.1 New Commands

```bash
# Initialize VISION.md
codehogg init
# Creates VISION.md template with guided prompts

# Show vision status
codehogg vision
# Displays populated vs blank sections

# Show task logs
codehogg log
# Lists recent tasks from .codehogg/logs/

# Show specific task
codehogg log --task <id>
```

### 12.2 Skill Invocation

In Claude Code:
```
/codehogg                           # Strategic review
/codehogg "implement user auth"     # Tactical mission
```

In Codex CLI:
```
$codehogg                           # Strategic review
$codehogg "implement user auth"     # Tactical mission
```

In OpenCode:
```
/codehogg                           # Strategic review
/codehogg "implement user auth"     # Tactical mission
```

### 12.3 Deprecated Commands

The following commands are deprecated in favor of `/codehogg`:

| Deprecated | Replacement |
|------------|-------------|
| `/audit-full` | `/codehogg` (strategic review) |
| `/audit-quick` | `/codehogg` (strategic review) |
| `/plan-full` | `/codehogg "feature description"` |
| `/plan-quick` | `/codehogg "feature description"` |

Individual audit commands (`/audit-security`, etc.) remain available for targeted use.

---

## 13. Migration Path

### 13.1 From v4.0 to v5.0

**Phase 1: Add Vision Layer (non-breaking)**
- Add `codehogg init` command
- Add VISION.md template
- Add `/codehogg` skill with Team Lead
- Existing commands continue to work

**Phase 2: Add Logging Infrastructure**
- Create `.codehogg/logs/` structure
- Team Lead writes logs after task completion
- Add `codehogg log` command

**Phase 3: Upgrade Counselors**
- Add VISION.md reading to each counselor
- Add vision-tracing to output format
- Add distance bands (Far/Medium/Near)

**Phase 4: Deprecate Old Commands**
- Add deprecation warnings to old audit/plan commands
- Point users to `/codehogg` equivalent
- Remove in v6.0

### 13.2 Backward Compatibility

- v5.0 remains fully backward compatible with v4.0 usage
- Projects without VISION.md work exactly as before
- Old commands work but show deprecation notice
- Migration is opt-in via `codehogg init`

---

## 14. Non-Goals

What codehogg v5.0 explicitly is NOT:

| Non-Goal | Rationale |
|----------|-----------|
| **Universal code quality grader** | We measure against user intent, not universal standards |
| **Autonomous execution without approval** | Plan mode approval is mandatory; user agency matters |
| **Replacement for product ownership** | VISION.md is user-authored; we don't invent goals |
| **Precision metrics engine** | Bands (Far/Medium/Near), not percentages; honesty over false precision |
| **Machine-edited vision document** | VISION.md is sacred; only humans write to it |
| **Always-on background monitoring** | Invoked explicitly via `/codehogg`; no surprise behaviors |

---

## 15. Success Metrics

### 15.1 User Outcomes

| Metric | Target | Measurement |
|--------|--------|-------------|
| Vision adoption | 50% of projects have VISION.md within 3 months | Telemetry (opt-in) |
| Counsel actionability | 80% of recommendations cite specific files | Output analysis |
| Distance improvement | Movement toward "Near" over task iterations | Log analysis |
| User satisfaction | "Hearty counsel" — genuinely helpful | User feedback |

### 15.2 Quality Indicators

| Indicator | Target |
|-----------|--------|
| Recommendations trace to vision | 100% |
| Confidence levels present | 100% |
| Contradictions surfaced (not hidden) | 100% |
| Generic advice (no file citations) | <5% |

### 15.3 Anti-Metrics

Things we explicitly do NOT optimize for:
- Number of recommendations (more ≠ better)
- Universal health scores (context-free metrics)
- Automation without approval (user agency matters)
- Percentage precision (bands are more honest)

---

## 16. MVP Scope

### Phase 1: Foundation

**Deliverables:**
- [ ] `codehogg init` command creates VISION.md with guided prompts
- [ ] `codehogg vision` command shows status
- [ ] VISION.md template (no Task Log section)
- [ ] `.codehogg/logs/` directory structure

**Success criteria:**
- User can create and populate VISION.md
- Logs directory exists for future use

### Phase 2: Team Lead Core

**Deliverables:**
- [ ] `/codehogg` skill with Team Lead agent
- [ ] Team Lead reads VISION.md
- [ ] Team Lead handles simple missions solo
- [ ] Plan mode integration
- [ ] Basic logging to `.codehogg/logs/`

**Success criteria:**
- `/codehogg "simple task"` works end-to-end
- Plan mode approval before execution
- Task logged after completion

### Phase 3: Counselor Delegation

**Deliverables:**
- [ ] Team Lead can delegate to counselors
- [ ] 3 counselors upgraded: security, architecture, backend
- [ ] Delegation reasoning visible to user
- [ ] Synthesis of multiple counselor inputs
- [ ] Distance bands (Far/Medium/Near) in output

**Success criteria:**
- `/codehogg "complex task"` delegates appropriately
- User sees which counselors were called and why
- Distance reported as bands, not percentages

### Phase 4: Full Counselor Roster

**Deliverables:**
- [ ] All 12 counselors available to Team Lead
- [ ] `codehogg log` command to view task history
- [ ] Cross-reference analysis in synthesis
- [ ] Contradiction surfacing

**Success criteria:**
- Full range of expertise available
- Historical tasks viewable
- Contradictions visible, not hidden

### Phase 5: Skill Integration

**Deliverables:**
- [ ] Team Lead can invoke frontend-design skill
- [ ] Team Lead can invoke document skills (pdf, docx)
- [ ] Vision context injected into skill invocations

**Success criteria:**
- Skills produce output aligned with vision
- Team Lead manages the full workflow

---

## 17. Appendices

### Appendix A: VISION.md Example

```markdown
# Vision

> "And the LORD answered me, and said, Write the vision, and make it plain upon tables, that he may run that readeth it."
> — Habakkuk 2:2 (KJV)

## Purpose

OrderFlow is a B2B order management system for wholesale distributors. It helps operations teams process, track, and fulfill large orders with multiple line items and complex shipping requirements.

## Outcomes

- Operations staff can process an order in under 2 minutes
- Customers can self-serve order status without calling support
- Zero orders lost or duplicated due to system errors
- Full audit trail for compliance

## Values

- **Reliability over features** — it must work, every time
- **Speed over polish** — operations staff need efficiency, not beauty
- **Security is non-negotiable** — we handle customer PII and payment data
- **Simplicity over flexibility** — we serve one use case well

## Constraints

- Must integrate with existing SAP ERP (read-only)
- SOC2 Type II compliance required
- Budget: 2 engineers, 6 months
- No breaking changes to existing API consumers

## Stage

MVP — core ordering flow complete, adding customer portal

## Current Focus

Customer-facing order status page
```

### Appendix B: Team Lead Output Example

```markdown
## Team Lead: build customer order status page

### Vision Context

> Purpose: B2B order management for wholesale distributors
> Outcomes: Customers can self-serve order status without calling support
> Values: Speed over polish, Security is non-negotiable
> Stage: MVP
> Focus: Customer-facing order status page

### Assessment

This mission involves:
- Customer authentication (security-sensitive)
- New API endpoints (backend)
- New UI components (frontend)

**Decision:** Delegating to Security, Backend, and Frontend counselors.

### Counsel Summary

**Security Counselor** (confidence: HIGH)
- Customer authentication not implemented
- Recommended: magic link auth (simplest, secure)
- Traces to: "Security is non-negotiable"

**Backend Counselor** (confidence: HIGH)
- No customer-facing API exists
- Recommended: `src/api/customer/` with read-only endpoints
- Traces to: "Reliability over features"

**Frontend Counselor** (confidence: MEDIUM)
- No customer UI components exist
- Recommended: minimal status timeline, mobile-first
- Traces to: "Speed over polish"

### Synthesis

All counselors agree on:
- Read-only access pattern
- Minimal, focused implementation
- Security-first approach

No contradictions.

### Proposed Plan

1. Create customer auth (magic link)
2. Create `src/api/customer/orders.js` (read-only)
3. Create status page component (timeline view)
4. Add rate limiting

### Distance Assessment

| Domain | Current | After Plan |
|--------|---------|------------|
| Security | Far | Medium |
| Architecture | Medium | Near |
| Frontend | Far | Medium |

---

*Awaiting plan approval...*
```

### Appendix C: Task Log Example

See Section 8.3 for full task log format.

### Appendix D: Scriptural Foundation

> "And the LORD answered me, and said, Write the vision, and make it plain upon tables, that he may run that readeth it." — Habakkuk 2:2 (KJV)

> "Where no counsel is, the people fall: but in the multitude of counsellors there is safety." — Proverbs 11:14 (KJV)

> "Without counsel purposes are disappointed: but in the multitude of counsellors they are established." — Proverbs 15:22 (KJV)

> "For by wise counsel thou shalt make thy war: and in multitude of counsellors there is safety." — Proverbs 24:6 (KJV)

> "The way of a fool is right in his own eyes: but he that hearkeneth unto counsel is wise." — Proverbs 12:15 (KJV)

> "Ointment and perfume rejoice the heart: so doth the sweetness of a man's friend by hearty counsel." — Proverbs 27:9 (KJV)

---

## Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Author | Christopher Hogg | 2026-01-14 | |
| Technical Review | | | |
| Product Review | | | |

---

*"Write the vision, and make it plain upon tables, that he may run that readeth it."*
