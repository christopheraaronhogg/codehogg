# PRD: Write The Vision (WTV) v7.0

> "Write the vision, and make [it] plain upon tables, that he may run that readeth it." — Habakkuk 2:2 (KJV PCE)

## Executive Summary

**WTV (Write The Vision)** is a spiritual framework for product development built on the book of Habakkuk. Formerly named "codehogg" (Chris Hogg's initials), this CLI tool manages agents and skills for AI-powered CLIs (primarily OpenCode, also Claude Code and Codex CLI).

The Habakkuk workflow is complete and functional. The next phase transforms generic artisans into named Biblical craftsmen with personalities and scripture quotes.

---

## What's Built (v7.0.0 - COMPLETE)

### The Habakkuk Workflow

Five stages based on Habakkuk 2:1-3:

```
CRY OUT → WAIT → VISION → RUN → WORSHIP
```

1. **CRY OUT** — Enter a problem or need (Hab 2:1a)
2. **WAIT** — Position to receive, seek God's answer (Hab 2:1b)
3. **VISION** — The answer comes, write it plainly (Hab 2:2a)
4. **RUN** — Execute with clarity (Hab 2:2b)
5. **WORSHIP** — Retrospective, gratitude, stones of remembrance (Hab 3)

### CLI Commands Working

```bash
wtv board               # ASCII kanban board
wtv cry "description"   # Create item in CRY OUT
wtv wait <id>           # Move to WAIT
wtv vision <id>         # Move to VISION (creates VISION.md)
wtv run <id>            # Move to RUN
wtv worship <id>        # Move to WORSHIP (creates WORSHIP.md)
wtv note <id> "text"    # Add note while waiting
wtv item <id>           # View item details
wtv stones              # View completed works
```

### Data Storage

```
.wtv/habakkuk/ (or legacy .codehogg/habakkuk/)
├── board.json
└── items/
    └── 001-item-slug/
        ├── item.json
        ├── VISION.md
        └── WORSHIP.md
```

### Agent Command Center

```bash
wtv                     # Dashboard with Habakkuk summary
wtv agents              # List agents
wtv agents add <name>   # Create new agent
wtv agents edit <name>  # Open in $EDITOR
wtv agents fav <name>   # Toggle favorite
```

---

## What's Next (v8.0 - THE BIBLICAL ARTISANS)

### 1. Rename to WTV

- Package name: `wtv` (formerly `codehogg`)
- Branding: "Write The Vision"
- Update all references

### 2. Biblical Artisans (Replace Generic Names)

Transform 8 domain artisans into named Biblical craftsmen:

| Current | Biblical Name | Scripture | Domain |
|---------|---------------|-----------|--------|
| masterbuilder | **Paul** | 1 Cor 3:10 "as a wise masterbuilder" | Orchestration |
| security-artisan | **Nehemiah** | Neh 4:17 "builders, every one had his sword" | Security |
| architecture-artisan | **Bezaleel** | Ex 31:3 "filled with the spirit of God, in wisdom" | Architecture |
| backend-artisan | **Hiram** | 1 Ki 7:14 "filled with wisdom and understanding" | Backend/Services |
| frontend-artisan | **Aholiab** | Ex 38:23 "engraver, cunning workman, embroiderer" | Frontend/UI |
| database-artisan | **Solomon** | 1 Ki 4:29 "wisdom exceeding much, largeness of heart" | Data/Schema |
| devops-artisan | **Zerubbabel** | Zech 4:9 "hands have laid the foundation" | Infrastructure |
| qa-artisan | **Ezra** | Ezra 7:10 "prepared his heart to seek the law" | Quality/Testing |
| product-artisan | **Moses** | Heb 8:5 "according to the pattern" | Requirements |

### 3. Include Habakkuk Text in Repo

Create `docs/HABAKKUK-KJV.md` with full PCE KJV text (already fetched - 3 chapters, 56 verses total).

### 4. OpenCode-First Focus

- Primary target: OpenCode (`.opencode/agent/`)
- Secondary: Claude Code (`.claude/agents/`)
- Tertiary: Codex CLI (`.codex/skills/`)

### 5. Automaker Patterns to Consider

From https://github.com/AutoMaker-Org/automaker:
- Event-driven architecture with WebSocket streaming
- File-based storage in `.automaker/` (similar to our `.wtv/` / legacy `.codehogg/`)
- Git worktrees per feature
- Kanban with pipeline stages

---

## Task List for Next Session

### Phase 1: Biblical Foundation
- [ ] Create `docs/HABAKKUK-KJV.md` with full text (3 chapters)
- [ ] Verify all scripture quotations 7 times
- [ ] Research each Biblical artisan's personality/quotes

### Phase 2: Rename Artisans
- [ ] Update `templates/agents/masterbuilder.md` → Paul
- [ ] Create `templates/agents/nehemiah.md` (security)
- [ ] Create `templates/agents/bezaleel.md` (architecture)
- [ ] Create `templates/agents/hiram.md` (backend)
- [ ] Create `templates/agents/aholiab.md` (frontend)
- [ ] Create `templates/agents/solomon.md` (database)
- [ ] Create `templates/agents/zerubbabel.md` (devops)
- [ ] Create `templates/agents/ezra.md` (qa)
- [ ] Create `templates/agents/moses.md` (product)

### Phase 3: Update Skills
- [ ] Update wtv skill to reference Biblical artisans
- [ ] Update artisan-contract skill for Biblical context

### Phase 4: Documentation
- [ ] Update README with Biblical framing
- [ ] Add "The Book of Habakkuk as Template" section
- [ ] Consider renaming package to `wtv`

### Phase 5: Polish
- [ ] Test all commands after rename
- [ ] Ensure OpenCode compatibility
- [ ] Final scripture verification pass

---

## Key Files

| File | Purpose |
|------|---------|
| `src/cli.js` | Main CLI (~3100 lines) |
| `package.json` | v7.0.0 |
| `README.md` | Updated with Habakkuk workflow |
| `docs/HABAKKUK-WORKFLOW.md` | Design document |
| `templates/agents/*.md` | Agent definitions |
| `templates/skills/*/SKILL.md` | Skill definitions |

---

## Scripture References (Verify Carefully)

- Habakkuk 2:1 - "I will stand upon my watch..."
- Habakkuk 2:2 - "Write the vision, make it plain..."
- Habakkuk 2:3 - "For the vision is yet for an appointed time..."
- Habakkuk 3:18 - "Yet I will rejoice in the LORD..."
- 1 Corinthians 3:10 - "as a wise masterbuilder..."
- Proverbs 11:14 - "in the multitude of counsellors..."
- Exodus 31:3 - Bezaleel "filled with the spirit of God"
- Exodus 38:23 - Aholiab "engraver, cunning workman"

---

## Author

Christopher Hogg (codehogg = CHogg initials)
