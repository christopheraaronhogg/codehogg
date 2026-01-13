# Hook Implementations

These are the actual hook implementations that get installed to `~/.claude/hooks-global/`.

The loader files in `../hooks/` use Node.js `os.homedir()` and `path.join()` to find and `require()` these files, providing cross-platform compatibility.

## Files

- `on-stop.cjs` - Task tracking when Claude finishes responding
- `on-prompt-submit.cjs` - Task detection when user submits a prompt

## Why Global?

Hook implementations are always installed globally so that:
1. Updates to codehogg automatically update hooks for all projects
2. Only tiny loader files (4 lines) need to be in each project
3. No duplication of complex logic across projects

See `../hooks/README.md` for the full architecture explanation.
