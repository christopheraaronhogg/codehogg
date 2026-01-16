
import fs from 'fs';
import path from 'path';

const BIBLICAL_ARTISANS = [
    'paul', 'nehemiah', 'bezaleel', 'hiram', 'aholiab',
    'solomon', 'zerubbabel', 'ezra', 'moses', 'david'
];

const CONFIG_DIR = '.wtv';
const CONFIG_FILE = 'config.json';
const LEGACY_CONFIG_DIR = '.codehogg';

function activateAgents() {
    const cwd = process.cwd();
    let configPath = path.join(cwd, CONFIG_DIR, CONFIG_FILE);

    // Check for legacy if main doesn't exist
    if (!fs.existsSync(configPath) && fs.existsSync(path.join(cwd, LEGACY_CONFIG_DIR, CONFIG_FILE))) {
        configPath = path.join(cwd, LEGACY_CONFIG_DIR, CONFIG_FILE);
    }

    // Default config if none exists
    let config = { favorites: [] };

    // Create dir if needed
    if (!fs.existsSync(configPath)) {
        if (!fs.existsSync(path.join(cwd, CONFIG_DIR))) {
            fs.mkdirSync(path.join(cwd, CONFIG_DIR), { recursive: true });
        }
        // configPath is already set to .wtv/config.json
    } else {
        try {
            config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        } catch (e) {
            console.warn('Could not parse existing config, creating new one.');
        }
    }

    if (!config.favorites) config.favorites = [];

    // Add all biblical artisans
    let addedCount = 0;
    for (const artisan of BIBLICAL_ARTISANS) {
        if (!config.favorites.includes(artisan)) {
            config.favorites.push(artisan);
            addedCount++;
        }
    }

    // Sort valid agents to top (optional, but nice)
    // config.favorites.sort(); 

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    console.log(`Activated ${addedCount} new agents.`);
    console.log('Active Team:', config.favorites.join(', '));
}

activateAgents();
