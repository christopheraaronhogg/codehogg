# Agent Command Center Design

## Biblical Foundation

> "And the LORD answered me, and said, Write the vision, and make [it] plain upon tables, that he may run that readeth it." — Habakkuk 2:2 (KJV PCE)

The CLI becomes the "tables" where the vision is made plain. When you run `wtv`, you see your agents, your vision, your mission.

---

## Command Structure

### Dashboard (No Args)

```bash
wtv
```

Shows the **agent landscape** for current location:

```
╭──────────────────────────────────────────────────────────────────────╮
│  wtv v5.2.0                                                     │
│  Agent Command Center                                                │
╰──────────────────────────────────────────────────────────────────────╯

  VISION: ~/projects/myapp/VISION.md
  ├─ Purpose: SaaS for small business invoicing
  ├─ Stage: MVP
  └─ Focus: Payment integration

  LOCAL AGENTS (.claude/agents/)
  ┌────────────────────────────────────────────────────────────────────┐
  │ ★ paul      The wise orchestrator                        │
  │ ★ nehemiah   Auth, vulnerabilities, secrets               │
  │   hiram    API, services, data access                   │
  │   aholiab   UI, UX, components                           │
  └────────────────────────────────────────────────────────────────────┘

  GLOBAL AGENTS (~/.claude/agents/)
  ┌────────────────────────────────────────────────────────────────────┐
  │   bezaleel   System design, patterns                  │
  │   solomon       Schema, queries, optimization            │
  └────────────────────────────────────────────────────────────────────┘

  Quick actions:
    wtv agents add <name>    Create new agent
    wtv agents fav <name>    Toggle favorite
    wtv vision               Edit VISION.md
```

### Agent Management

```bash
wtv agents                    # List all agents (local + global)
wtv agents list               # Same as above
wtv agents add <name>         # Create new agent (interactive)
wtv agents edit <name>        # Open in $EDITOR
wtv agents info <name>        # Show agent details
wtv agents fav <name>         # Toggle favorite
wtv agents remove <name>      # Remove agent
wtv agents copy <name> <new>  # Duplicate and rename
```

### Skill Management

```bash
wtv skills                    # List all skills
wtv skills add <name>         # Create new skill
wtv skills edit <name>        # Open in $EDITOR
```

### Config

```bash
wtv config                    # Show current config
wtv config set <key> <value>  # Set a preference
wtv config reset              # Reset to defaults
```

---

## Config File Structure

**Location:**
- Global: `~/.wtv/config.json`
- Project: `.wtv/config.json`

```json
{
  "favorites": [
    "paul",
    "nehemiah",
    "hiram"
  ],
  "defaultTool": "claude",
  "editor": "$EDITOR",
  "theme": "default"
}
```

---

## Agent Template

When creating a new agent with `wtv agents add`:

```yaml
---
name: {name}
description: {description}
tools: Read, Glob, Grep, Edit, Write, Bash, WebFetch, WebSearch
model: opus
skills: artisan-contract
---

# {Name}

You are the **{Name}**.

## Your Expertise

- [Add your areas of expertise]

## Mode of Operation

The Masterbuilder will invoke you in one of two modes:

### Counsel Mode
Provide domain-specific advice for a mission.

### Execution Mode
Implement assigned tasks from an approved plan.

## Follow the Contract

Always follow the `artisan-contract` skill for output format.

## Domain-Specific Guidance

[Add your specific guidance here]

## Your Lane

[Define what's in scope and what to defer to other artisans]
```

---

## Implementation Notes

### File Discovery

```javascript
function discoverAgents(scope) {
  const locations = [];

  // Local project
  if (scope !== 'global') {
    locations.push({
      label: 'Local',
      path: join(process.cwd(), '.claude/agents'),
      type: 'local'
    });
    locations.push({
      label: 'Local (OpenCode)',
      path: join(process.cwd(), '.opencode/agent'),
      type: 'local'
    });
  }

  // Global
  if (scope !== 'local') {
    locations.push({
      label: 'Global',
      path: join(homedir(), '.claude/agents'),
      type: 'global'
    });
    locations.push({
      label: 'Global (OpenCode)',
      path: join(homedir(), '.config/opencode/agent'),
      type: 'global'
    });
  }

  // Scan each location
  return locations.flatMap(loc => scanAgents(loc));
}
```

### Agent Parsing

```javascript
function parseAgent(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const { frontmatter, body } = parseFrontmatter(content);

  return {
    name: frontmatter.name || basename(filePath, '.md'),
    description: frontmatter.description || extractFirstParagraph(body),
    tools: frontmatter.tools?.split(',').map(t => t.trim()) || [],
    model: frontmatter.model || 'opus',
    skills: frontmatter.skills?.split(',').map(s => s.trim()) || [],
    path: filePath,
    content: body
  };
}
```

### Favorites Storage

```javascript
function loadConfig() {
  const globalPath = join(homedir(), '.wtv/config.json');
  const localPath = join(process.cwd(), '.wtv/config.json');

  const global = existsSync(globalPath)
    ? JSON.parse(readFileSync(globalPath))
    : {};
  const local = existsSync(localPath)
    ? JSON.parse(readFileSync(localPath))
    : {};

  // Local overrides global
  return { ...global, ...local };
}

function isFavorite(agentName) {
  const config = loadConfig();
  return config.favorites?.includes(agentName) || false;
}
```

---

## UX Patterns

### List Display

```
  AGENTS

  Local (.claude/agents/)
  ★ paul         The wise orchestrator
  ★ nehemiah      Auth, vulnerabilities, secrets
    hiram       API, services, data access
    aholiab      UI, UX, components

  Global (~/.claude/agents/)
    bezaleel  System design, patterns
    solomon      Schema, queries
```

### Agent Info

```
  AGENT: nehemiah

  ╭────────────────────────────────────────────────────────────────────╮
  │  Security Artisan                                                  │
  │  ★ Favorite                                                        │
  ╰────────────────────────────────────────────────────────────────────╯

  Description: Auth, vulnerabilities, secrets, compliance
  Model: opus
  Tools: Read, Glob, Grep, Edit, Write, Bash, WebFetch, WebSearch
  Skills: artisan-contract, security-consultant, compliance-consultant

  Location: /Users/chris/projects/myapp/.claude/agents/nehemiah.md

  Actions:
    wtv agents edit nehemiah
    wtv agents fav nehemiah
```

---

## Priority for Implementation

1. **Dashboard** - `wtv` with no args shows agent landscape
2. **List** - `wtv agents` lists all available agents
3. **Info** - `wtv agents info <name>` shows details
4. **Favorites** - `wtv agents fav <name>` toggles favorite
5. **Add** - `wtv agents add <name>` creates new agent
6. **Edit** - `wtv agents edit <name>` opens in $EDITOR
