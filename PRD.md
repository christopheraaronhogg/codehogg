# WTV v7.1 — Vision Runner (Ralphy-style execution)

## Overview
WTV already helps users *write the vision* (VISION.md) and install agents/skills into their AI CLI of choice.

v7.1 adds the missing half of Habakkuk 2:2: *"that he may run that readeth it"*.

When a user runs `wtv run` (with no Habakkuk item ID), WTV will:
1) Let the user pick a vision document to execute.
2) Generate a detailed `PRD.md` checklist from that vision.
3) Maintain a `progress.txt` checkpoint log.
4) Run an autonomous loop with the chosen CLI engine until all PRD tasks are complete.
5) Commit and push once at the end (by default).

## Non-Goals (v7.1)
- Gemini engine support (ship as a later patch).
- Parallel execution / worktrees / PR-per-task (keep v7.1 straightforward and safe).

## Target Engines (v7.1)
- OpenCode (first-class)
- Codex CLI
- Claude Code

## Files / Contracts
- Vision input:
  - `VISION.md` (repo root) and/or markdown files in `vision/`
- Execution artifacts (project root):
  - `PRD.md` (source of truth checklist; must use `- [ ]` and `- [x]`)
  - `progress.txt` (append-only checkpoint log)

## UX / Command Design
- Preserve Habakkuk workflow:
  - `wtv run <id|slug>` keeps existing Habakkuk behavior.
- Add Vision Runner:
  - `wtv run` (no args) launches the Vision Runner wizard.

## Acceptance Criteria
- `wtv run` in an interactive TTY:
  - prompts for vision doc selection (root + `vision/*.md`)
  - prompts for engine selection (opencode/codex/claude)
  - generates `PRD.md` and `progress.txt` (unless `--resume`)
  - iterates until no `- [ ]` remain in `PRD.md`
  - produces exactly one git commit and one git push (unless `--no-push`)
- `wtv run --dry-run` makes no file changes and does not invoke the engine.
- `wtv run --resume` does not rewrite `PRD.md` and continues from current state.
- If the loop fails mid-run, WTV stops, prints rollback instructions, and does not auto-push.

## Tasks
- [ ] Update `wtv run` routing so `wtv run <id>` stays Habakkuk and `wtv run` starts Vision Runner
- [ ] Implement vision document discovery + interactive picker (root `VISION.md` + `vision/*.md`)
- [ ] Add Vision Runner CLI flags: `--vision`, `--engine`, `--resume`, `--regenerate-prd`, `--max-iterations`, `--dry-run`, `--fast`, `--no-tests`, `--no-lint`, `--no-push`
- [ ] Add engine adapter interface (spawn + streaming output) with support for: `opencode`, `codex`, `claude`
- [ ] Implement PRD generation prompt that produces `PRD.md` with a `## Tasks` checklist
- [ ] Create/append `progress.txt` header including start timestamp and start git SHA
- [ ] Implement loop controller:
- [ ] Read `PRD.md`, select next `- [ ]` item, and build a strict “one-task only” execution prompt
- [ ] Invoke engine, then verify the PRD changed and the selected task was marked `- [x]`
- [ ] Append a checkpoint entry to `progress.txt` after each successful task
- [ ] Stop when no unchecked tasks remain, or when `--max-iterations` is reached
- [ ] Add preflight safety checks:
- [ ] Require git repo (or warn + disable commit/push)
- [ ] Require clean working tree (or prompt to proceed)
- [ ] Record rollback hint: `git reset --hard <start-sha>`
- [ ] Add finalization step:
- [ ] `git add -A` and create one summary commit at completion
- [ ] Push once at the end by default; skip when `--no-push`
- [ ] Update `wtv help` output to document Vision Runner usage
- [ ] Update `README.md` with Vision Runner (`wtv run`) workflow and file contracts
