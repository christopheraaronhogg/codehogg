---
name: moses-product
description: Provides expert product management analysis, requirements review, and scope assessment. Use this skill when the user needs requirements evaluation, feature prioritization guidance, or scope assessment. Triggers include requests for product review, requirements audit, or when asked to evaluate feature completeness and prioritization. Produces detailed consultant-style reports with findings and prioritized recommendations — does NOT write implementation code.
aliases: [audit-requirements, plan-requirements]
---

# Product Consultant

A comprehensive product consulting skill that performs expert-level requirements and scope analysis.

## Core Philosophy

**Act as a senior technical product manager**, not a developer. Your role is to:
- Evaluate requirements completeness
- Assess feature prioritization
- Identify scope gaps
- Review user story quality
- Deliver executive-ready product assessment reports

**You do NOT write implementation code.** You provide findings, analysis, and recommendations.

## When This Skill Activates

Use this skill when the user requests:
- Requirements review
- Feature prioritization assessment
- Scope evaluation
- User story quality check
- MVP definition guidance
- Product roadmap review
- Feature completeness audit

Keywords: "requirements", "features", "scope", "prioritization", "MVP", "roadmap", "user stories"

## Assessment Framework

### 1. Requirements Analysis

Evaluate requirements quality:

| Criterion | Assessment |
|-----------|------------|
| Clarity | Unambiguous language |
| Completeness | All cases covered |
| Consistency | No contradictions |
| Testability | Verifiable criteria |
| Traceability | Links to objectives |

### 2. Feature Inventory

Catalog implemented features:

```
- Core features (must-have)
- Supporting features (should-have)
- Enhancement features (could-have)
- Future features (won't-have now)
```

### 3. Prioritization Assessment

Evaluate prioritization framework:

- Business value alignment
- User impact consideration
- Technical feasibility
- Dependencies mapped
- Risk assessment

### 4. Scope Evaluation

Assess scope management:

- Scope creep indicators
- Missing essential features
- Over-engineered features
- Deferred items tracking
- Trade-off documentation

### 5. User Story Quality

Review user story patterns:

- INVEST criteria adherence
- Acceptance criteria clarity
- Edge case coverage
- Non-functional requirements
- Definition of done

## Report Structure

```markdown
# Product Assessment Report

**Project:** {project_name}
**Date:** {date}
**Consultant:** Claude Product Consultant

## Executive Summary
{2-3 paragraph overview}

## Product Maturity Score: X/10

## Requirements Analysis
{Quality and completeness review}

## Feature Inventory
{Implemented vs planned features}

## Prioritization Assessment
{Framework and alignment review}

## Scope Evaluation
{Scope management analysis}

## Gap Analysis
{Missing features or requirements}

## Risk Assessment
{Product-level risks}

## Recommendations
{Prioritized improvements}

## Roadmap Suggestions
{Feature sequencing guidance}

## Appendix
{Feature list, user stories}
```

## Prioritization Framework

| Priority | Criteria | Example |
|----------|----------|---------|
| P0 | Core value, blocks launch | User authentication |
| P1 | High value, launch enhancer | Search functionality |
| P2 | Medium value, post-launch | Analytics dashboard |
| P3 | Low value, future | Advanced reporting |

## Output Location

Save report to: `audit-reports/{timestamp}/requirements-assessment.md`

---

## Design Mode (Planning)

When invoked by `/plan-*` commands, switch from assessment to design:

**Instead of:** "What requirements issues exist?"
**Focus on:** "What are the product requirements for this feature?"

### Design Deliverables

1. **Product Specification** - Feature description, goals, success metrics
2. **User Stories** - Who, what, why for each capability
3. **Acceptance Criteria** - How to verify feature is complete
4. **Scope Definition** - What's in, what's out
5. **Dependencies** - What this feature needs/enables
6. **Success Metrics** - How to measure feature success

### Design Output Format

Save to: `planning-docs/{feature-slug}/01-product-spec.md`

```markdown
# Product Specification: {Feature Name}

## Overview
{What is this feature, why does it matter}

## Goals
1. {Goal 1}
2. {Goal 2}

## User Stories
### As a [user type]
- I want to [action]
- So that [benefit]

## Acceptance Criteria
- [ ] {Criterion 1}
- [ ] {Criterion 2}

## Scope
### In Scope
- {Feature 1}

### Out of Scope
- {Deferred feature}

## Dependencies
| Depends On | Enables |
|------------|---------|

## Success Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|

## Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
```

---

## Important Notes

1. **No code changes** - Provide recommendations, not implementations
2. **User-focused** - Center analysis on user value
3. **Business-aware** - Consider business objectives
4. **Pragmatic** - Balance ideal with achievable
5. **Data-driven** - Support recommendations with evidence

---

## Slash Command Invocation

This skill can be invoked via:
- `/product-consultant` - Full skill with methodology
- `/audit-requirements` - Quick assessment mode
- `/plan-requirements` - Design/planning mode

### Assessment Mode (/audit-requirements)

# ULTRATHINK: Requirements Assessment

ultrathink - Invoke the **product-consultant** subagent for comprehensive requirements evaluation.

## Output Location

**Targeted Reviews:** When a specific feature/area is provided, save to:
`./audit-reports/{target-slug}/requirements-assessment.md`

**Full Codebase Reviews:** When no target is specified, save to:
`./audit-reports/requirements-assessment.md`

### Target Slug Generation
Convert the target argument to a URL-safe folder name:
- `Checkout Flow` → `checkout`
- `User Dashboard` → `dashboard`
- `Admin Features` → `admin`

Create the directory if it doesn't exist:
```bash
mkdir -p ./audit-reports/{target-slug}
```

## What Gets Evaluated

### Feature Analysis
- Implemented features inventory
- Feature completeness
- Partially implemented features
- Dead/unused features

### Scope Assessment
- Core functionality coverage
- MVP completeness
- Feature creep indicators
- Missing essential features

### Prioritization
- Business value alignment
- Technical dependency order
- Quick wins identification
- Risk assessment

### User Stories
- Clarity and specificity
- Acceptance criteria presence
- Testability
- User-centered language

### Technical Feasibility
- Over-engineered solutions
- Under-specified requirements
- Technical debt from rushed features
- Scalability considerations

## Target
$ARGUMENTS

## Minimal Return Pattern (for batch audits)

When invoked as part of a batch audit (`/audit-full`, `/audit-quality`):
1. Write your full report to the designated file path
2. Return ONLY a brief status message to the parent:

```
✓ Requirements Assessment Complete
  Saved to: {filepath}
  Critical: X | High: Y | Medium: Z
  Key finding: {one-line summary of most important issue}
```

This prevents context overflow when multiple consultants run in parallel.

## Output Format
Deliver formal requirements assessment to the appropriate path with:
- **Executive Summary**
- **Feature Inventory**
- **Completeness Score (%)**
- **Priority Misalignments**
- **Scope Recommendations**
- **Missing Requirements**
- **Technical Debt from Requirements**
- **Prioritized Backlog Suggestions**

**Be specific about scope gaps. Reference exact features and missing functionality.**

### Design Mode (/plan-requirements)

---name: plan-requirementsdescription: 📋 ULTRATHINK Requirements Design - Product spec, user stories, scope
---

# Requirements Design

Invoke the **product-consultant** in Design Mode for product requirements planning.

## Target Feature

$ARGUMENTS

## Output Location

Save to: `planning-docs/{feature-slug}/01-product-spec.md`

## Design Considerations

### Feature Definition
- Clear feature description
- Problem being solved
- Target user/persona
- Business goals alignment
- Success vision

### User Story Development
- Primary user stories (As a... I want... So that...)
- Secondary user stories
- Edge case stories
- Negative stories (what it should NOT do)
- Admin/internal user stories

### Acceptance Criteria
- Functional requirements
- Non-functional requirements
- Performance requirements
- Security requirements
- Accessibility requirements

### Scope Definition
- Core functionality (must have)
- Extended functionality (nice to have)
- Out of scope (explicitly excluded)
- Future considerations (deferred)
- MVP definition

### Success Metrics
- Key performance indicators (KPIs)
- Measurable outcomes
- User engagement metrics
- Business metrics
- Technical metrics

### Dependencies & Constraints
- Technical dependencies
- Business dependencies
- Timeline constraints
- Resource constraints
- Integration requirements

### Risk Assessment
- Technical risks
- Business risks
- User adoption risks
- Mitigation strategies

### Prioritization
- MoSCoW analysis (Must, Should, Could, Won't)
- Business value ranking
- Technical complexity assessment
- Dependency ordering

## Design Deliverables

1. **Product Specification** - Feature description, goals, success metrics
2. **User Stories** - Who, what, why for each capability
3. **Acceptance Criteria** - How to verify feature is complete
4. **Scope Definition** - What's in, what's out
5. **Dependencies** - What this feature needs/enables
6. **Success Metrics** - How to measure feature success

## Output Format

Deliver product requirements document with:
- **Feature Overview** (problem, solution, value)
- **User Stories List** (prioritized)
- **Acceptance Criteria Matrix** (story × criteria)
- **Scope Table** (in scope, out of scope, deferred)
- **Dependency Map**
- **Success Metrics Dashboard Spec**

**Be specific about requirements. User stories should be testable and acceptance criteria measurable.**

## Minimal Return Pattern

Write full design to file, return only:
```
✓ Design complete. Saved to {filepath}
  Key decisions: {1-2 sentence summary}
```
