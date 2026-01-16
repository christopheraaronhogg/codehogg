
import fs from 'fs';
import path from 'path';
import os from 'os';

const BIBLICAL_ARTISANS = [
    'paul', 'nehemiah', 'bezaleel', 'hiram', 'aholiab',
    'solomon', 'zerubbabel', 'ezra', 'moses', 'david'
];

const TEMPLATES_DIR = path.resolve('templates/agents');
const HOME = os.homedir();

// Directories to clean
const DIRS_TO_CLEAN = [
    path.resolve('.opencode/agent'),
    path.resolve('.claude/agents'),
    path.join(HOME, '.claude/agents'),
    path.join(HOME, '.config/opencode/agent')
];

// Backup location
const BACKUP_DIR = path.join(HOME, '.wtv/backups', `agents-${Date.now()}`);

function cleanSlate() {
    console.log('--- STARTING CLEAN SLATE PROTOCOL ---');
    console.log(`Backup location: ${BACKUP_DIR}\n`);

    for (const dir of DIRS_TO_CLEAN) {
        if (!fs.existsSync(dir)) continue;

        console.log(`Processing: ${dir}`);
        const files = fs.readdirSync(dir);
        let deletedCount = 0;

        for (const file of files) {
            if (!file.endsWith('.md')) continue;

            const name = file.replace('.md', '');

            // If it's NOT a Biblical Artisan, it goes.
            if (!BIBLICAL_ARTISANS.includes(name)) {
                const srcPath = path.join(dir, file);
                const backupPath = path.join(BACKUP_DIR, path.basename(dir), file);

                // Ensure backup dir exists
                fs.mkdirSync(path.dirname(backupPath), { recursive: true });

                // Copy to backup
                fs.copyFileSync(srcPath, backupPath);

                // Delete original
                fs.unlinkSync(srcPath);
                deletedCount++;
            }
        }
        console.log(`  - Removed ${deletedCount} legacy agents.`);
    }

    console.log('\n--- REINSTALLING BIBLICAL TEAM (LOCAL) ---');
    const localInstallDir = path.resolve('.opencode/agent'); // Defaulting to opencode for now
    if (!fs.existsSync(localInstallDir)) fs.mkdirSync(localInstallDir, { recursive: true });

    for (const artisan of BIBLICAL_ARTISANS) {
        const src = path.join(TEMPLATES_DIR, `${artisan}.md`);
        const dest = path.join(localInstallDir, `${artisan}.md`);

        if (fs.existsSync(src)) {
            fs.copyFileSync(src, dest);
            console.log(`  + Installed ${artisan}`);
        } else {
            console.error(`  ! Missing template for ${artisan}`);
        }
    }

    console.log('\n--- CLEAN SLATE COMPLETE ---');
}

cleanSlate();
