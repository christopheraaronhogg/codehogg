# TUI Analysis: OpenCode vs wtv

*Research conducted 2026-01-14*

## Executive Summary

OpenCode has a **production-grade TUI** built on sophisticated foundations. wtv has a **functional CLI** with basic ANSI coloring. The gap is significant but addressable.

**Key insight**: OpenCode's polish comes not from one library, but from **architectural decisions** about layout, theming, components, and state. We can adopt these patterns incrementally.

---

## OpenCode's TUI Stack

### Architecture Layers

```
┌─────────────────────────────────────────┐
│           Application Layer             │
│  Routes, Session, Sidebar, Commands     │
├─────────────────────────────────────────┤
│            Provider Layer               │
│  Theme, Dialog, Sync, SDK, KV Storage   │
├─────────────────────────────────────────┤
│            Component Layer              │
│  Prompt, Header, Footer, Messages       │
├─────────────────────────────────────────┤
│          Rendering Engine               │
│  OpenTUI (SolidJS + Yoga Layout)        │
├─────────────────────────────────────────┤
│          Terminal Primitives            │
│  ANSI sequences, cursor, colors         │
└─────────────────────────────────────────┘
```

### Framework Details

| Aspect | OpenCode (TypeScript) | OpenCode (Go, older) |
|--------|----------------------|---------------------|
| **UI Framework** | OpenTUI + SolidJS | Bubble Tea |
| **Layout** | Yoga (Flexbox) | Lipgloss |
| **State** | Reactive (SolidJS stores) | Elm Architecture |
| **Rendering** | Custom terminal buffer | Bubble Tea renderer |

### Key Features

1. **Split Pane Layout** - Messages, Editor, Sidebar
2. **Command Palette** - ctrl+k fuzzy search
3. **Slash Commands** - /new, /sessions, /themes, etc.
4. **File Autocomplete** - @ trigger for fuzzy file search
5. **Session Management** - Save/restore conversations
6. **Theming** - JSON-based, dark/light, popular presets
7. **Vim Keybindings** - History navigation
8. **Status Bar** - LSP, MCP, todos, file diffs

---

## wtv's Current CLI

### What We Have

```javascript
// Basic ANSI colors
const c = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    green: '\x1b[32m',
    // ...
};

// Cross-platform symbols
const sym = {
    check: isWindows ? '[OK]' : '✓',
    arrow: isWindows ? '>' : '❯',
    // ...
};
```

### Current Features

- Interactive prompts (select, confirm)
- ASCII art avatars
- Banner and status displays
- Update notifications (via update-notifier)
- Basic menus

### What's Missing

- [ ] Structured layout (boxes, panels)
- [ ] Progress indicators (spinners, bars)
- [ ] Rich text formatting (markdown)
- [ ] Dynamic updates (without clearing screen)
- [ ] Theming system
- [ ] Command palette
- [ ] Responsive width handling

---

## Framework Options for Node.js

### 1. Ink (React for CLIs)

**Maturity**: Production-ready, used by Gatsby, Prisma, GitHub Copilot

```javascript
import {render, Text, Box} from 'ink';

const App = () => (
  <Box borderStyle="round" padding={1}>
    <Text color="green">✓ Installation complete!</Text>
  </Box>
);

render(<App />);
```

**Pros**:
- React mental model
- Flexbox layout (Yoga)
- Component library (ink-ui)
- Testing library

**Cons**:
- React dependency
- Larger bundle

### 2. Simpler Libraries

| Library | Purpose | Size |
|---------|---------|------|
| **ora** | Spinners | Tiny |
| **chalk** | Colors | Tiny |
| **boxen** | Boxes | Small |
| **cli-progress** | Progress bars | Small |
| **listr2** | Task lists | Medium |
| **inquirer** | Prompts | Medium |

### 3. Stay Raw (Enhanced)

Keep pure Node.js but add:
- Better box drawing
- Spinner utilities
- Progress tracking

---

## Design Principles from OpenCode

### 1. Semantic Color Tokens

```json
{
  "defs": {
    "primary": "#7c3aed",
    "success": "#22c55e",
    "warning": "#eab308"
  },
  "text": { "dark": "#fafafa", "light": "#171717" },
  "textMuted": { "dark": "#a1a1aa", "light": "#71717a" },
  "background": { "dark": "#09090b", "light": "#ffffff" },
  "border": { "dark": "#27272a", "light": "#e4e4e7" }
}
```

**Principle**: Don't use raw colors. Use semantic names that map to purposes.

### 2. Max-Width Containers

```
Terminal is 200 chars wide
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│    ┌──────────────────────────────────────────────────────────┐     │
│    │  Content constrained to 80 chars for readability         │     │
│    └──────────────────────────────────────────────────────────┘     │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**Principle**: Wide terminals don't mean wide content. Center at 80 chars.

### 3. Component Hierarchy

```
App
├── Header (status, model, session)
├── Messages (scrollable, markdown)
├── Prompt (multiline, attachments)
├── Sidebar (context, tools)
└── Footer (keybinds, help)
```

**Principle**: Decompose UI into composable pieces with clear responsibilities.

### 4. State Management

```
┌─────────────────┐     ┌─────────────────┐
│   User Input    │────▶│   Update State  │
└─────────────────┘     └────────┬────────┘
                                 │
                                 ▼
┌─────────────────┐     ┌─────────────────┐
│   Render View   │◀────│   Derive View   │
└─────────────────┘     └─────────────────┘
```

**Principle**: Unidirectional data flow. State changes trigger re-renders.

### 5. Overlay Dialogs

```
┌─────────────────────────────────────────┐
│  Base content (dimmed)                  │
│                                         │
│       ┌─────────────────────┐           │
│       │   Dialog on top     │           │
│       │   (focused)         │           │
│       └─────────────────────┘           │
│                                         │
└─────────────────────────────────────────┘
```

**Principle**: Dialogs overlay content, don't replace it. Use backdrop dimming.

---

## Recommended Upgrade Path

### Phase 1: Quick Wins (No New Dependencies)

**Goal**: Improve output quality without changing architecture.

1. **Box Drawing Utility**
```javascript
function box(content, opts = {}) {
    const { width = 60, style = 'round', padding = 1 } = opts;
    const chars = style === 'round'
        ? { tl: '╭', tr: '╮', bl: '╰', br: '╯', h: '─', v: '│' }
        : { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│' };
    // ... implementation
}
```

2. **Spinner Utility**
```javascript
const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
function spinner(text) {
    let i = 0;
    const id = setInterval(() => {
        process.stdout.write(`\r  ${frames[i++ % frames.length]} ${text}`);
    }, 80);
    return { stop: () => clearInterval(id) };
}
```

3. **Semantic Colors**
```javascript
const theme = {
    success: c.green,
    warning: c.yellow,
    error: c.red,
    info: c.blue,
    muted: c.dim,
    accent: c.magenta,
};
```

4. **Width-Constrained Output**
```javascript
const MAX_WIDTH = 80;
function constrainedLog(text) {
    const termWidth = process.stdout.columns || 100;
    const padding = Math.max(0, Math.floor((termWidth - MAX_WIDTH) / 2));
    const prefix = ' '.repeat(padding);
    // Wrap and prefix each line
}
```

### Phase 2: Progressive Enhancement

**Goal**: Add polish libraries one at a time.

1. **Add ora** for spinners during installs
2. **Add boxen** for update notifications (already using via update-notifier)
3. **Add chalk** for color management (if ANSI becomes unwieldy)

### Phase 3: Consider Ink (If TUI Becomes Core)

**Goal**: If we want a persistent TUI like OpenCode, adopt Ink.

This would require:
- React dependency
- Component architecture
- Different rendering model

Only pursue if wtv evolves beyond an installer.

---

## OpenCode Compatibility Considerations

### Skills Installation

OpenCode loads skills from `.claude/skills/` (Claude-compatible path). Our current approach is correct.

### Agent Format

OpenCode expects agents in `.opencode/agent/` with specific frontmatter:

```yaml
---
description: "Agent description"
mode: subagent
tools:
  bash: true
  read: true
  # ...
---
```

Our `installOpenCodeAgents()` function already handles this conversion.

### Theme Compatibility

If we add themes, consider OpenCode's JSON format:

```json
{
  "name": "wtv-dark",
  "defs": {
    "primary": "#f59e0b",
    "accent": "#6366f1"
  },
  "text": { "dark": "#fafafa", "light": "#171717" }
}
```

This would let users share themes between tools.

---

## Immediate Action Items

### Must Do (Before Losing Claude Code Access)

1. **Verify OpenCode compatibility**
   ```bash
   npx wtv init --opencode
   # Then test in OpenCode
   ```

2. **Test skill loading in OpenCode**
   - Do our skills load?
   - Do slash commands work?
   - Any format issues?

3. **Document OpenCode usage**
   - Add OpenCode-specific examples to README
   - Note any differences from Claude Code

### Nice to Have

1. Add simple spinner for install progress
2. Improve box drawing around banner
3. Add width-constrained output

---

## Sources

- [OpenCode GitHub](https://github.com/sst/opencode)
- [OpenCode Docs - TUI](https://opencode.ai/docs/tui/)
- [OpenCode Docs - Themes](https://opencode.ai/docs/themes/)
- [OpenTUI](https://github.com/sst/opentui)
- [Ink (React for CLIs)](https://github.com/vadimdemedes/ink)
- [DeepWiki - OpenCode TUI Components](https://deepwiki.com/sst/opencode/6.2-tui-components)
- [DeepWiki - Terminal UI System](https://deepwiki.com/opencode-ai/opencode/4-terminal-ui-system)
