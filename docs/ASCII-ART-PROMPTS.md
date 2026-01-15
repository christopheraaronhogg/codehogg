# ASCII Art Prompts for wtv

Use these prompts with an AI image generator or ASCII art tool to create character art for the **wtv** CLI.

Each character should be **15–20 lines tall** and **25–35 characters wide** to fit nicely in a terminal.

**Style vision (oldschool + techy):**
- Ancient/Biblical silhouette + modern “terminal” accents
- Mix robes/stone/scroll motifs with subtle circuitry, pixels, UI frames, or pipelines
- Keep it iconic and readable at a glance (personality > realism)

**Style guidelines:**
- Monospace-friendly (renders clean in terminals)
- Use box-drawing characters: `│ ─ ┌ ┐ └ ┘ ├ ┤ ┬ ┴ ┼ ╭ ╮ ╰ ╯`
- Use shading: `░ ▒ ▓ █`
- Use geometric shapes: `◆ ◇ ○ ● □ ■ △ ▽ ◁ ▷`
- Should work in both light and dark terminals

---

## Paul (Masterbuilder)

**Role:** The wise orchestrator who reads `VISION.md`, consults artisans, creates plans, delegates work, and verifies.

**Visual concept:** A masterbuilder holding a blueprint/scroll with foundation stones beneath. Ancient authority + modern planning vibe.

**Prompt:**
```
Create ASCII art of Paul the masterbuilder. He holds an unrolled scroll/blueprint
with gridlines like a plan. Include foundation stones or pillars at the base.
Blend ancient robes with subtle modern “tech” hints (tiny circuit traces, UI
lines, or a terminal frame). Commanding but thoughtful posture.
Style: detailed line art using box-drawing characters and geometric shapes.
Size: 20 lines tall, 30 chars wide.
```

**Color hint:** Gold/yellow (`\x1b[33m`)

---

## Nehemiah (Security)

**Role:** Fortifies security while building (auth, secrets, compliance).

**Visual concept:** Builder-guardian with trowel + weapon/shield. “Work with one hand, guard with the other.”

**Prompt:**
```
Create ASCII art of Nehemiah as a builder-guardian. One hand holds a tool
(trowel/hammer), the other holds a shield with a lock or key symbol.
Ancient armor silhouette with subtle modern security motifs (padlock, circuit
pattern on the shield). Vigilant eyes.
Style: bold, high-contrast, readable. Size: 18 lines tall, 30 chars wide.
```

**Color hint:** Red (`\x1b[31m`)

---

## Bezaleel (Architecture)

**Role:** Crafts structure and patterns so the work endures.

**Visual concept:** Craftsman-architect with compass/protractor + temple geometry. Precision + artistry.

**Prompt:**
```
Create ASCII art of Bezaleel as a craftsman-architect. He holds a compass or
protractor, with geometric temple lines/pillars behind him. Blend ancient
craftsmanship with subtle modern “system design” cues (nodes, edges, small
schematics).
Style: symmetrical, clean structure. Size: 18 lines tall, 32 chars wide.
```

**Color hint:** Blue (`\x1b[34m`)

---

## Hiram (Backend)

**Role:** Forges durable services, APIs, workflows, integrations.

**Visual concept:** Metalworker/engineer among pipes/gears/server symbols. Industrial + dependable.

**Prompt:**
```
Create ASCII art of Hiram as a metalworker/engineer. Include a small forge or
anvil, plus pipes/gears suggesting systems and data flow. Add subtle modern
backend cues (API nodes, request arrows, server block).
Style: mechanical, sturdy, “built to last”. Size: 18 lines tall, 30 chars wide.
```

**Color hint:** Green (`\x1b[32m`)

---

## Aholiab (Frontend)

**Role:** Makes the work plain upon tables (UI/UX clarity, accessibility).

**Visual concept:** Engraver/weaver crafting a “screen” or UI frame. Clarity, hierarchy, and polish.

**Prompt:**
```
Create ASCII art of Aholiab as an engraver/weaver who makes things “plain upon
tables”. Include a framed “screen” or UI window with clean layout lines.
Blend ancient artisan tools (engraving stylus, loom patterns) with modern UI
symbols (layout grid, buttons, focus ring).
Style: clean and friendly, highly readable. Size: 18 lines tall, 30 chars wide.
```

**Color hint:** Magenta (`\x1b[35m`)

---

## Solomon (Data)

**Role:** Shapes data for integrity, migrations, and long-term wisdom.

**Visual concept:** Wise figure with scroll/tablet showing rows/columns like a data table. Calm, deep.

**Prompt:**
```
Create ASCII art of Solomon as the keeper of data wisdom. He holds a scroll or
tablet showing a grid of rows/columns like a database table. Add subtle modern
data cues (cylinder outline, indexes, keys) without losing ancient dignity.
Style: calm, balanced, “wise”. Size: 18 lines tall, 30 chars wide.
```

**Color hint:** Cyan (`\x1b[36m`)

---

## Zerubbabel (DevOps)

**Role:** Finishes the foundation (shipping, releases, CI/CD discipline).

**Visual concept:** Builder with a foundation stone + pipeline arrows. “From foundation to finish.”

**Prompt:**
```
Create ASCII art of Zerubbabel as the finisher. Include foundation stones at the
base and a pipeline motif (arrows, nodes, linked circles) rising upward.
Blend ancient builder elements with modern deployment cues (container box,
rocket, checkmark, or gear).
Style: energetic but stable. Size: 18 lines tall, 30 chars wide.
```

**Color hint:** Yellow (`\x1b[33m`)

---

## Ezra (QA)

**Role:** Verification, tests, truth-checking, regression prevention.

**Visual concept:** Scribe + inspector with scroll and magnifying glass. Checks, not vibes.

**Prompt:**
```
Create ASCII art of Ezra as a scribe-inspector. He holds a scroll and a large
magnifying glass, with a checklist (checkmarks) nearby. Add subtle modern QA
cues (bug icon, test grid, pass/fail markers).
Style: investigative, detail-oriented. Size: 18 lines tall, 30 chars wide.
```

**Color hint:** Blue (`\x1b[34m`)

---

## Moses (Product)

**Role:** Keeps the pattern (requirements, scope, acceptance).

**Visual concept:** Figure with tablets/blueprint pattern; a “map of the build” rather than code.

**Prompt:**
```
Create ASCII art of Moses as the keeper of the pattern. He holds tablets or a
pattern scroll with clear boundary lines, like a blueprint. Include a compass or
star suggesting direction and scope. Add subtle modern product cues (roadmap
milestones, sticky-note blocks) while keeping an ancient silhouette.
Style: strategic, clear, “defines done”. Size: 18 lines tall, 30 chars wide.
```

**Color hint:** Green (`\x1b[32m`)

---

## David (Voice)

**Role:** Copy, tone, worship/remembrance — words that carry weight.

**Visual concept:** Psalmist with harp + quill, plus subtle waveform/terminal text lines.

**Prompt:**
```
Create ASCII art of David the psalmist as a voice/copy artisan. Include a small
harp (music) and a quill/pen (writing). Add subtle modern “voice” cues like a
waveform, signal bars, or flowing terminal text lines. The character feels warm
and human, not corporate.
Style: expressive, readable. Size: 18 lines tall, 30 chars wide.
```

**Color hint:** Magenta (`\x1b[35m`)

---

## Tools for Generation

1. **AI Image → ASCII converters:**
   - Generate image with your preferred model
   - Convert to ASCII with: https://www.ascii-art-generator.org/

2. **Text-to-ASCII tools:**
   - Figlet/Toilet for text: `figlet -f banner "WTV"`
   - `jp2a` for images
   - ASCII art generators online

3. **Manual refinement:**
   - Start with generated art
   - Refine in a text editor
   - Test in terminal at various widths

---

## Example Format in Code

```javascript
const AVATARS = {
    paul: `...`,
    nehemiah: `...`,
    bezaleel: `...`,
    hiram: `...`,
    aholiab: `...`,
    solomon: `...`,
    zerubbabel: `...`,
    ezra: `...`,
    moses: `...`,
    david: `...`,
};
```

---

## Delivery Format

When you have the ASCII art ready, provide:

1. **Raw ASCII** (plain text, no colors)
2. **Suggested color regions** (which lines/chars should be colored)
3. **Test at 80-char width** (ensure it fits)

Then it can be integrated into `src/cli.js` with proper ANSI color codes.
