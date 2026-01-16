
import fs from 'fs';
import path from 'path';

// Source of truth: The Biblical Artisans
const BIBLICAL_ARTISANS = [
    'paul',
    'nehemiah',
    'bezaleel',
    'hiram',
    'aholiab',
    'solomon',
    'zerubbabel',
    'ezra',
    'moses',
    'david'
];

// Mapping of Legacy -> Biblical
const LEGACY_MAP = {
    'masterbuilder': 'paul',
    'architecture-artisan': 'bezaleel',
    'backend-artisan': 'hiram',
    'frontend-artisan': 'aholiab',
    'database-artisan': 'solomon',
    'devops-artisan': 'zerubbabel',
    'qa-artisan': 'ezra',
    'product-artisan': 'moses',
    'security-artisan': 'nehemiah',
    // David is new (Voice), so we might not have a direct legacy mapping,
    // but if 'copy-artisan' existed, it would map to him.
};

const TEMPLATES_DIR = path.resolve('templates/agents');
const LOCAL_DIR = path.resolve('.opencode/agent');
const CLAUDE_DIR = path.resolve('.claude/agents');

function migrateDirectory(targetDir) {
    if (!fs.existsSync(targetDir)) {
        console.log(`Directory not found: ${targetDir}, skipping.`);
        return;
    }

    console.log(`Migrating agents in: ${targetDir}`);
    const files = fs.readdirSync(targetDir);

    for (const file of files) {
        if (!file.endsWith('.md')) continue;

        const name = file.replace('.md', '');

        // Case 1: Is it a legacy agent?
        if (LEGACY_MAP[name]) {
            const biblicalName = LEGACY_MAP[name];
            console.log(`  - Found legacy agent: ${name} -> Migrating to ${biblicalName}`);

            // Delete legacy file
            fs.unlinkSync(path.join(targetDir, file));

            // Install new biblical file
            copyTemplate(biblicalName, targetDir);
        }
        // Case 2: Is it already a Biblical agent?
        else if (BIBLICAL_ARTISANS.includes(name)) {
            console.log(`  - Found biblical agent: ${name} -> Updating template`);
            copyTemplate(name, targetDir);
        }
        // Case 3: Is it a custom user agent?
        else {
            console.log(`  - Found custom/unknown agent: ${name} -> Preserving`);
        }
    }

    // Ensure all Biblical artisans are present
    for (const artisan of BIBLICAL_ARTISANS) {
        const artisanPath = path.join(targetDir, `${artisan}.md`);
        if (!fs.existsSync(artisanPath)) {
            console.log(`  - Missing artisan: ${artisan} -> Installing`);
            copyTemplate(artisan, targetDir);
        }
    }
}

function copyTemplate(name, destDir) {
    const src = path.join(TEMPLATES_DIR, `${name}.md`);
    const dest = path.join(destDir, `${name}.md`);

    if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
    } else {
        console.error(`  ! Critical: Template for ${name} not found at ${src}`);
    }
}

console.log('--- WTV AGENT MIGRATION ---');
migrateDirectory(LOCAL_DIR);
migrateDirectory(CLAUDE_DIR);
console.log('--- MIGRATION COMPLETE ---');
console.log('Run `node bin/wtv.js agents` to see your new team.');
