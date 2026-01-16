
import fs from 'fs';
import path from 'path';

const LOCAL_DIR = path.resolve('.opencode/agent');
const CONFIG_FILE = path.resolve('.opencode/config.json'); // Pseudo-config location for checking favorites logic?
// Actually, favorites are usually stored in a config file like `~/.config/claude/config.json` or similar.
// But based on the codebase, we might need to inspect how `wtv` stores favorites.
// Ah, looking at `src/cli.js`, favorites seem to be determined by checking `isFavorite(name)`.

// Let's look at `src/cli.js` to see where `isFavorite` reads from.
// It reads from `~/.claude_cli_config` or similar? 
// Wait, the user just said "active one" which usually means Starred/Favorited.

// Let's just assume we need to update the `wtv` config or whatever stores this state.
// However, since we don't know exactly WHERE `wtv` stores favorites without looking at code,
// I'll start by looking at `src/cli.js` quickly.

// But wait, I can just write a script to UPDATE favorites via the CLI itself? 
// Or I can modify the `templates` to include a default favorite state? No, that's user specific.

// Let's modify the `clean-slate` script or a new one to run `wtv agents fav <name>` for everyone?
// No, running sub-commands is slow.

// Let's read `src/cli.js` first to find the storage mechanism.
const CLI_PATH = path.resolve('src/cli.js');
const cliContent = fs.readFileSync(CLI_PATH, 'utf8');
const favMatch = cliContent.match(/function isFavorite\((.+?)\)/);

// Okay, I'll pause the script writing to check `src/cli.js` for the favorite storage file.
