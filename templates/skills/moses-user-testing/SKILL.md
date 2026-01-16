---
name: moses-user-testing
description: Enables Masterbuilder to conduct UX testing using artisans as user personas. After implementation, artisans embody different user types to verify the work from real-world perspectives.
---

# User Testing Skill

After implementation is complete, the Masterbuilder can conduct user testing by having artisans embody user personas. This combines domain expertise with user perspective.

---

## Available Personas

| Persona | Archetype | Device | Patience | Focus |
|---------|-----------|--------|----------|-------|
| **Sarah** | Small business owner | Mobile | Medium | "Is this for me?" |
| **Mike** | Experienced professional | Desktop | Low | "Worth switching?" |
| **Jenny** | Rush order handler | Desktop | Very Low | "Need this NOW" |
| **Carlos** | Mobile-first user | Mobile | Low | "Quick status check" |
| **David** | Accessibility user | Keyboard | High | "Can I use this?" |
| **Patricia** | Skeptical shopper | Desktop | High | "Is this legit?" |

---

## Persona Details

### Sarah — Small Business Owner
- **Tech comfort:** Low-Medium
- **Device:** Mobile (iPhone, often one-handed)
- **Time:** 10 minutes max
- **Goals:** Find pricing, understand if it's for her, easy signup
- **Red flags:** Jargon, complex forms, unclear pricing
- **Voice:** "I just need to know if this works for my flower shop."

### Mike — Experienced Professional
- **Tech comfort:** High
- **Device:** Desktop (large monitor, multiple tabs)
- **Time:** 5 minutes before deciding
- **Goals:** Compare to current solution, find proof of quality
- **Red flags:** Amateur design, missing features, no social proof
- **Voice:** "I've used [competitor] for 10 years. Convince me."

### Jenny — Rush Order Handler
- **Tech comfort:** Medium
- **Device:** Desktop (work computer)
- **Time:** 2 minutes, NOW
- **Goals:** Complete task immediately, no friction
- **Red flags:** Extra steps, confirmations, slow loading
- **Voice:** "Customer is on hold. I don't have time for this."

### Carlos — Mobile-First User
- **Tech comfort:** High
- **Device:** Mobile (Android, potentially slow connection)
- **Time:** 2 minutes
- **Goals:** Check status, quick actions
- **Red flags:** Desktop-only features, tiny tap targets, heavy pages
- **Voice:** "I'm on the train. Just show me my order status."

### David — Accessibility User
- **Tech comfort:** High
- **Device:** Desktop with screen reader, keyboard-only
- **Time:** Patient, but frustrated by barriers
- **Goals:** Complete task without mouse, clear announcements
- **Red flags:** Missing labels, focus traps, mouse-only interactions
- **Voice:** "Tab, tab, tab... where am I? What did that button do?"

### Patricia — Skeptical Shopper
- **Tech comfort:** Medium
- **Device:** Desktop
- **Time:** Thorough (will spend 15+ minutes investigating)
- **Goals:** Find red flags, verify legitimacy, read reviews
- **Red flags:** Missing contact info, no reviews, pushy tactics
- **Voice:** "This seems too good. What's the catch?"

---

## Suggested Artisan-Persona Pairings

The Masterbuilder may assign any persona to any artisan, but these pairings leverage natural domain alignment:

| Artisan | Persona | Why This Pairing |
|---------|---------|------------------|
| **frontend-artisan** | Sarah | UI/UX expertise tests mobile experience, clarity |
| **security-artisan** | David | Security includes accessibility; tests keyboard nav |
| **backend-artisan** | Carlos | API performance awareness; tests mobile/slow connections |
| **product-artisan** | Patricia | Scope guardian spots missing trust signals |
| **qa-artisan** | Jenny | Quality tester with zero patience reveals friction |
| **devops-artisan** | Mike | Infrastructure pro evaluates reliability, professionalism |
| **database-artisan** | Carlos | Data expert tests response times, caching |
| **architecture-artisan** | Mike | Structure expert evaluates overall coherence |

---

## Testing Protocol

### When to Test
- After implementation tasks complete
- Before marking a mission as complete
- When verifying user-facing changes

### How to Test

1. **Masterbuilder identifies what needs testing**
   - Which user flows were affected?
   - What could break the user experience?

2. **Assign personas to artisans**
   - Choose 2-4 artisans based on what was changed
   - Assign personas that stress-test the changes

3. **Each artisan tests as their persona**
   - Embody the user's mindset, patience, device
   - Attempt the specified task
   - Document friction, confusion, failures
   - Report with evidence

4. **Masterbuilder synthesizes findings**
   - Identify patterns across personas
   - Prioritize fixes by severity
   - Decide: ship or fix first?

---

## Artisan Testing Prompt

When delegating a test to an artisan:

```
You are the [ARTISAN] temporarily embodying [PERSONA].

## Your Persona
- **Archetype:** [description]
- **Device:** [device]
- **Patience:** [level]
- **Focus:** "[their question]"

## Your Task
[What to test — be specific about the flow]

## Instructions
1. Think and act as this user would
2. Attempt the task with their tech level and patience
3. Note every moment of friction, confusion, or failure
4. Judge harshly — this user has alternatives
5. Report whether the task succeeded and why/why not
```

---

## Output Format

Each artisan returns:

```markdown
## [Persona] Test Report

**Tested by:** [Artisan]
**Persona:** [Name] — [Archetype]
**Task:** [What was attempted]
**Result:** ✅ Success / ❌ Failed / ⚠️ Partial

### The Experience
[Narrative of what happened, from the persona's perspective]

### Friction Points
1. [Issue] — [Severity: Critical/High/Medium/Low]
2. [Issue] — [Severity]

### What Worked
- [Positive observation]

### Verdict
[Would this user complete the task? Would they come back?]

### Recommendations
1. [Specific fix]
2. [Specific fix]
```

---

## Summary Report

After all artisan tests complete, the Masterbuilder compiles:

```markdown
## User Testing Summary

**Tested:** [What was tested]
**Personas:** [List]
**Date:** [timestamp]

### Results

| Persona | Artisan | Result | Critical Issues |
|---------|---------|--------|-----------------|
| Sarah | frontend | ✅ | None |
| David | security | ❌ | Focus trap in modal |
| Jenny | qa | ⚠️ | Slow checkout |

### Critical Findings
[Issues that block users]

### Ship or Fix?
[Masterbuilder's recommendation based on vision alignment]
```

---

## Non-Goals

- This is NOT automated browser testing
- This is NOT a replacement for real user research
- This IS expert review through user-perspective lenses
- This IS a sanity check before shipping
