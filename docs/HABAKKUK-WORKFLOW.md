# The Habakkuk Workflow

> "I will stand upon my watch, and set me upon the tower, and will watch to see what he will say unto me, and what I shall answer when I am reproved. And the LORD answered me, and said, Write the vision, and make [it] plain upon tables, that he may run that readeth it."
> — Habakkuk 2:1-2 (KJV PCE)

## The Five Stages

```
┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐
│    CRY    │──▶│   WAIT    │──▶│   WRITE   │──▶│    RUN    │──▶│  WORSHIP  │
│    OUT    │   │           │   │  VISION   │   │           │   │           │
├───────────┤   ├───────────┤   ├───────────┤   ├───────────┤   ├───────────┤
│ "I will   │   │ "stand    │   │ "Write    │   │ "that he  │   │ Habakkuk  │
│ stand     │   │ upon my   │   │ the       │   │ may run   │   │ 3 - A     │
│ upon my   │   │ watch...  │   │ vision,   │   │ that      │   │ prayer    │
│ watch"    │   │ watch to  │   │ make it   │   │ readeth   │   │ of praise │
│           │   │ see what  │   │ plain"    │   │ it"       │   │           │
│ Hab 2:1a  │   │ he will   │   │           │   │           │   │ Hab 3:1-19│
│           │   │ say"      │   │ Hab 2:2a  │   │ Hab 2:2b  │   │           │
│           │   │ Hab 2:1b  │   │           │   │           │   │           │
└───────────┘   └───────────┘   └───────────┘   └───────────┘   └───────────┘
   Problem        Waiting         Answer         Execute       Retrospective
   Entry          Seeking         Received       Building      Gratitude
```

## Stage Descriptions

### 1. CRY OUT (Problem Entry)

> "I will stand upon my watch" — Hab 2:1a

The prophet acknowledges he has a burden. Something needs addressing.

**In wtv:** Enter a problem, need, or feature idea. What burden do you carry?

```bash
wtv cry "Users can't reset their passwords"
wtv cry "Need OAuth integration for enterprise clients"
```

### 2. WAIT (Seeking)

> "and will watch to see what he will say unto me" — Hab 2:1b

The prophet positions himself to receive. He waits, watches, listens.

**In wtv:** The problem sits in the waiting lane. You're gathering context, praying, thinking. Not rushing to solutions.

```bash
wtv wait                    # View items in waiting
wtv wait "password-reset"   # Add notes while waiting
```

### 3. WRITE VISION (Answer Received)

> "Write the vision, and make it plain upon tables" — Hab 2:2a

The answer comes. Now capture it clearly so anyone can understand.

**In wtv:** Move from waiting to vision. Document the approach, the plan, the answer received.

```bash
wtv vision "password-reset"   # Move to vision lane
wtv vision edit "password-reset"  # Write the vision document
```

This creates/updates `VISION.md` or a specific vision document for that item.

### 4. RUN (Execute)

> "that he may run that readeth it" — Hab 2:2b

The vision is so clear that whoever reads it can execute immediately.

**In wtv:** Move to execution. The Masterbuilder and artisans do the work.

```bash
wtv run "password-reset"    # Move to run lane, invoke Masterbuilder
```

### 5. WORSHIP (Retrospective)

> Habakkuk 3 — A prayer of praise

After the work, remember what God has done. Build stones of remembrance.

**In wtv:** Complete the work, capture learnings, express gratitude.

```bash
wtv worship "password-reset"   # Move to worship, write retrospective
```

The retrospective captures:
- What was accomplished
- What was learned
- Evidence of God's faithfulness
- Gratitude notes

---

## CLI Commands

### Board View

```bash
wtv board                   # Show kanban board
wtv board --all             # Show all items including completed
```

Output:
```
╭──────────────────────────────────────────────────────────────────────────────╮
│                           THE HABAKKUK BOARD                                 │
│                     "Write the vision, make it plain"                        │
╰──────────────────────────────────────────────────────────────────────────────╯

 CRY OUT          WAIT             VISION           RUN              WORSHIP
 ─────────────    ─────────────    ─────────────    ─────────────    ─────────────
 ┌───────────┐    ┌───────────┐    ┌───────────┐    ┌───────────┐    ┌───────────┐
 │ #4        │    │ #2        │    │ #3        │    │ #1        │    │           │
 │ API rate  │    │ Password  │    │ OAuth     │    │ User      │    │           │
 │ limiting  │    │ reset     │    │ login     │    │ dashboard │    │           │
 │           │    │           │    │           │    │           │    │           │
 │ 2d ago    │    │ 5d ago    │    │ 3d ago    │    │ 1d ago    │    │           │
 └───────────┘    └───────────┘    └───────────┘    └───────────┘    └───────────┘
                  ┌───────────┐
                  │ #5        │
                  │ Dark mode │
                  │           │
                  │ 1d ago    │
                  └───────────┘
```

### Item Management

```bash
# Create new item (enters CRY OUT)
wtv cry "Description of the problem or need"

# View item details
wtv item <id>
wtv item password-reset

# Move between stages
wtv wait <id>      # CRY OUT → WAIT
wtv vision <id>    # WAIT → VISION
wtv run <id>       # VISION → RUN
wtv worship <id>   # RUN → WORSHIP

# Add notes to an item
wtv note <id> "Insight received during prayer"

# Edit vision document
wtv vision edit <id>

# Complete worship retrospective
wtv worship <id> --complete
```

---

## Data Model

### Storage Location

```
.wtv/
├── config.json           # Favorites, preferences
├── habakkuk/
│   ├── board.json        # Board state
│   └── items/
│       ├── 001-password-reset.json
│       ├── 002-oauth-login.json
│       └── ...
└── logs/                 # Task execution logs
```

### Item Schema

```json
{
  "id": "001",
  "slug": "password-reset",
  "title": "Users can't reset their passwords",
  "stage": "wait",
  "created": "2026-01-15T10:30:00Z",
  "updated": "2026-01-15T14:20:00Z",
  "history": [
    { "stage": "cry", "entered": "2026-01-15T10:30:00Z" },
    { "stage": "wait", "entered": "2026-01-15T10:35:00Z" }
  ],
  "notes": [
    { "date": "2026-01-15T12:00:00Z", "text": "Researched email providers" },
    { "date": "2026-01-15T14:20:00Z", "text": "Clarity on approach: magic links" }
  ],
  "vision": null,
  "execution": null,
  "worship": null
}
```

### Vision Document

When moving to VISION stage, create a vision document:

```
.wtv/habakkuk/items/001-password-reset/VISION.md
```

```markdown
# Vision: Password Reset

> Received: 2026-01-15

## The Answer

Magic links over email. No passwords to remember, no reset flows to build.

## The Plan

1. Add email service (Resend)
2. Create magic link generation endpoint
3. Create magic link verification endpoint
4. Update login flow to offer "Email me a link"

## Success Criteria

- User can request magic link
- Link arrives within 30 seconds
- Link works once, expires in 15 minutes
- User is logged in after clicking

## Constraints

- Must work with existing session system
- No breaking changes to current login
```

### Worship Document

When completing WORSHIP stage:

```
.wtv/habakkuk/items/001-password-reset/WORSHIP.md
```

```markdown
# Worship: Password Reset

> Completed: 2026-01-20

## What Was Accomplished

- Integrated Resend for email delivery
- Magic link flow working end-to-end
- 100% test coverage on auth flows

## What Was Learned

- Magic links simpler than expected
- Resend API excellent developer experience
- Users love not having passwords

## Evidence of Faithfulness

- The answer (magic links) came during morning prayer
- Every blocker resolved within hours
- Final solution cleaner than original design

## Gratitude

Thank you Lord for:
- Clarity on the approach
- Smooth implementation
- Happy users

## Stones of Remembrance

This feature serves as a reminder that waiting produces better solutions than rushing.
```

---

## Integration with Masterbuilder

When you move an item to RUN, the Masterbuilder can be invoked:

```bash
wtv run "password-reset"
```

This:
1. Moves item to RUN stage
2. Reads the vision document
3. Invokes `/wtv` with the vision as context
4. Masterbuilder consults artisans, creates plan, executes

The Masterbuilder skill will be updated to understand Habakkuk items.

---

## The Retrospective Cycle

### Weekly Review

```bash
wtv review           # Show items moved this week
wtv review --month   # Monthly review
```

### Stones of Remembrance

Over time, the WORSHIP documents become a record of God's faithfulness:

```bash
wtv stones           # List all completed items with worship notes
wtv stones --year    # This year's completed items
```

---

## Why This Matters

This isn't productivity theater. It's a spiritual discipline.

1. **CRY OUT** forces you to articulate the real problem
2. **WAIT** prevents premature optimization and rushed solutions
3. **VISION** requires clarity before action
4. **RUN** enables confident execution
5. **WORSHIP** builds gratitude and remembrance

The secular world rushes from problem to solution. We wait on the watchtower.

> "For the vision is yet for an appointed time, but at the end it shall speak, and not lie: though it tarry, wait for it; because it will surely come, it will not tarry."
> — Habakkuk 2:3 (KJV)
