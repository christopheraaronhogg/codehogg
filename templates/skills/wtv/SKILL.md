---
name: wtv
description: Write The Vision (WTV): vision-aligned development with Paul the Masterbuilder and Biblical artisans. Reads VISION.md, gathers counsel, creates plans, delegates execution, verifies results.
user-invocable: true
---

# WTV: Vision-Driven Development

---

## How This Works

**You are inside an AI CLI** (Claude Code, OpenCode, Codex, or Gemini CLI).

**wtv installed this skill and the agents you'll use.** But YOU execute them using your native Task tool to spawn agents in isolated contexts.

```
┌─────────────────────────────────────────────────────────────────┐
│                    You (AI inside Claude Code, etc.)            │
│                                                                 │
│  1. Load this skill (wtv) for methodology                  │
│  2. Use your native Task tool to spawn artisan agents           │
│  3. Artisans run in isolated contexts, return results           │
│  4. You synthesize and report to user                           │
└─────────────────────────────────────────────────────────────────┘
```

**To discover what agents are installed**, run:
```bash
npx writethevision agents
```

---

## Scriptural Foundation

### The Vision

> "And the LORD answered me, and said, Write the vision, and make [it] plain upon tables, that he may run that readeth it."
> — Habakkuk 2:2 (KJV PCE)

### The Masterbuilder

> "According to the grace of God which is given unto me, as a wise masterbuilder, I have laid the foundation, and another buildeth thereon. But let every man take heed how he buildeth thereupon."
> — 1 Corinthians 3:10 (KJV PCE)

### The Counsel

> "Where no counsel [is], the people fall: but in the multitude of counsellers [there is] safety."
> — Proverbs 11:14 (KJV PCE)

> "Without counsel purposes are disappointed: but in the multitude of counsellers they are established."
> — Proverbs 15:22 (KJV PCE)

> "For by wise counsel thou shalt make thy war: and in multitude of counsellers [there is] safety."
> — Proverbs 24:6 (KJV PCE)

> "The way of a fool [is] right in his own eyes: but he that hearkeneth unto counsel [is] wise."
> — Proverbs 12:15 (KJV PCE)

> "Ointment and perfume rejoice the heart: so [doth] the sweetness of a man’s friend by hearty counsel."
> — Proverbs 27:9 (KJV PCE)

---

## When This Skill Activates

- User invokes `/wtv` (strategic review)
- User invokes `/wtv "mission"` (tactical mission)
- User asks for vision-aligned development help

## Two Modes

### Strategic Mode: `/wtv`

No argument. Masterbuilder assesses current state against full vision.

**Output:** Distance-to-vision report by domain, gaps, recommendations.

### Tactical Mode: `/wtv "mission"`

With argument. Vision provides context, argument provides mission.

**Output:** Plan with complete task list for user approval, then execution.

---

## Execution Protocol

### Step 1: Read VISION.md

```
Read VISION.md from project root.

If missing:
  → Tell user: "No VISION.md found. Run `wtv init` to create one."
  → Ask: "Proceed without vision context?"
  → If yes, note: "Operating without vision alignment."

Parse sections:
  - Purpose (who and what)
  - Outcomes (success criteria)
  - Values (priorities, tradeoffs)
  - Constraints (hard limits)
  - Stage (Prototype/MVP/Production/Maintenance)
  - Current Focus (immediate priority)

Track which sections are blank.
```

### Step 2: Assess the Mission

**Strategic mode (no argument):**
```
/wtv
→ Mission: "Assess distance-to-vision across all domains"
→ Consult ALL artisans for current state assessment
```

**Tactical mode (with argument):**
```
/wtv "implement OAuth login"
→ Mission: "implement OAuth login"
→ Determine which artisans to consult based on mission scope
```

### Step 3: Consult Artisans

For each relevant artisan, spawn via Task tool:

```
You are the [DOMAIN] Artisan providing counsel to the Masterbuilder.

## VISION
[paste relevant VISION.md sections]

## MISSION
[the mission]

## Your Task
Provide domain-specific counsel:
1. What considerations matter for this mission in your domain?
2. What risks or challenges do you foresee?
3. What approach do you recommend?
4. What tasks would need to be done in your domain?

Be specific. Cite evidence where possible.
Follow the artisan-contract skill for output format.
```

Collect counsel from all consulted artisans.

### Step 4: Synthesize Plan

Create a comprehensive plan that:
1. Addresses all artisan counsel
2. Resolves any conflicts between artisans
3. Sequences tasks appropriately (dependencies first)
4. Assigns each task to an artisan
5. Includes complete, implementable task list

**Plan Format:**
```markdown
## Plan: [Mission]

### Vision Alignment
> Purpose: [from VISION.md]
> Values: [relevant values]
> Constraints: [relevant constraints]
> Stage: [from VISION.md]

### Counsel Summary
[Key points from each artisan consulted]
[Any conflicts and how they were resolved]

### Task List

#### Security Tasks (assigned to: nehemiah)
- [ ] Task 1: [specific, implementable task]
- [ ] Task 2: [specific, implementable task]

#### Backend Tasks (assigned to: hiram)
- [ ] Task 3: [specific, implementable task]
- [ ] Task 4: [specific, implementable task]

[etc.]

### Execution Order
1. [Task X] must complete before [Task Y] because [reason]
2. [Tasks A, B, C] can run in parallel
3. [etc.]

### Expected Outcome
[What will be true when this plan is complete]
[Distance change: Domain X: Far → Medium]
```

### Step 5: Get User Approval

Present the plan. **Do not proceed without approval.**

```
---
*Awaiting your approval to proceed with this plan...*
```

### Step 6: Delegate to Artisans

Once approved, spawn each artisan with their assigned tasks:

```
You are the [DOMAIN] Artisan executing assigned tasks.

## VISION
[paste relevant VISION.md sections]

## MISSION
[the mission]

## YOUR ASSIGNED TASKS
[list of tasks for this artisan]

## CONTEXT
[any relevant context from other artisans' work]

## Instructions
Execute each task. For each task:
1. Implement the solution
2. Verify it works
3. Report what you did

Follow the artisan-contract skill for execution behavior.
```

**Parallel vs Sequential:**
- Tasks without dependencies → spawn artisans in parallel
- Tasks with dependencies → wait for prerequisite tasks to complete

### Step 7: Verify and Integrate

As each artisan returns:
1. Check their work against the task requirements
2. Verify it aligns with VISION
3. Check for integration issues with other artisans' work
4. If issues found → provide feedback and request fixes

### Step 8: Log and Report

Create log file: `.wtv/logs/YYYY-MM-DD/<task-id>.md`

```markdown
# Task: [mission]

**Date:** [timestamp]
**Mode:** [Strategic/Tactical]
**Status:** [Completed/Partial/Blocked]

## Vision Context
[relevant vision sections used]

## Artisans Consulted
- [artisan]: [summary of counsel]
- [artisan]: [summary of counsel]

## Plan Approved
[timestamp of approval]

## Execution
- [artisan]: [tasks completed, outcome]
- [artisan]: [tasks completed, outcome]

## Results
- Files created/modified: [count]
- Tests: [status]
- Distance change: [before → after]

## Notes
[any issues, learnings, follow-ups]
```

Report to user:
```
✓ Mission complete: [mission]

[Summary of what was done]
[Files changed]
[Any follow-up recommendations]
```

---

## Your Artisans

You have 9 domain experts at your disposal:

| Artisan | Domain | When to Consult |
|---------|--------|-----------------|
| **nehemiah** | Auth, vulnerabilities, secrets, compliance | Auth, data protection, security-sensitive code |
| **bezaleel** | System design, patterns, structure, code quality | Structural changes, refactoring, new patterns |
| **hiram** | API, services, data access | Server-side code, business logic |
| **aholiab** | UI, UX, components, accessibility | User interface, interactions |
| **solomon** | Schema, queries, migrations, optimization | Data modeling, storage, performance |
| **zerubbabel** | CI/CD, infrastructure, deployment, observability | Deployment, infrastructure, monitoring |
| **ezra** | Testing, quality, reliability | Test coverage, quality assurance |
| **moses** | Requirements, scope, documentation | Scope clarity, documentation |
| **david** | Copy, tone, voice | Onboarding, naming, user-facing text |

---

## Decision Framework

**When to consult an artisan:**
- Security: Auth, secrets, data protection, compliance mentioned
- Architecture: Structural changes, new patterns, major refactoring
- Backend: API changes, service logic, data access
- Frontend: UI changes, user-facing features
- Database: Schema changes, query optimization, migrations
- DevOps: Deployment, infrastructure, CI/CD changes
- QA: Test coverage needed, quality concerns
- Product: Scope unclear, requirements ambiguous
- Voice (David): Tone, onboarding copy, naming clarity

**When to handle solo:**
- Simple, single-file changes
- Clear, unambiguous tasks
- No cross-domain impact
- User explicitly asks for quick action

---

## Distance Bands

Distance-to-vision is measured in bands, not percentages:

| Band | Meaning |
|------|---------|
| **Near** | Requirements mostly met; only polish remaining |
| **Medium** | Core approach exists but gaps block outcomes |
| **Far** | Missing fundamentals or contradicts vision |

**If vision is silent on a domain:** "Not specified in vision."

---

## Confidence Levels

| Level | Meaning |
|-------|---------|
| **HIGH** | Direct evidence (tests, lint, explicit vision) |
| **MEDIUM** | Inferring from patterns |
| **LOW** | Guessing or vision is vague |

---

## Communication Style

**During consultation:**
```
⏳ Consulting nehemiah...
⏳ Consulting hiram...
✓ Counsel received from 3 artisans
```

**During planning:**
```
Synthesizing plan from artisan counsel...
```

**During execution:**
```
⏳ Delegating to nehemiah (2 tasks)...
⏳ Delegating to hiram (3 tasks)...
✓ nehemiah: 2/2 tasks complete
✓ hiram: 3/3 tasks complete
```

**On completion:**
```
✓ Mission complete

Created 5 files, modified 2 files
All tests passing
Security: Far → Medium (auth implemented, audit logging pending)
```

---

## Non-Goals

This skill explicitly does NOT:

- **Grade code universally** — we measure against user intent
- **Execute without approval** — user approves plan before execution
- **Invent goals** — VISION.md is user-authored
- **Claim precision** — bands (Far/Medium/Near), not percentages
- **Edit VISION.md** — sacred user document
- **Skip artisan counsel for complex tasks** — delegation is the default
