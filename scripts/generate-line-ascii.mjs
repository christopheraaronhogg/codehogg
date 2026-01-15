
import { Jimp } from 'jimp';
import fs from 'fs';
import path from 'path';

const AGENTS = {
    'moses': 'moses_techno_pattern_1768520008493.png',
    'paul': 'paul_masterbuilder_hologram_1768520024518.png',
    'david': 'david_voice_neon_1768520042799.png',
    'aholiab': 'aholiab_frontend_clarity_1768520056099.png',
    'bezaleel': 'bezaleel_architect_spirit_1768520071745.png',
    'ezra': 'ezra_qa_scribe_1768520089245.png',
    'hiram': 'hiram_backend_forge_1768520105883.png',
    'nehemiah': 'nehemiah_security_guardian_1768520121577.png',
    'solomon': 'solomon_data_wisdom_1768520135605.png',
    'zerubbabel': 'zerubbabel_devops_finisher_1768520150292.png'
};

const BRAIN_DIR = '/Users/chrishogg/.gemini/antigravity/brain/14635805-b6b5-4657-9057-5286ec00cf8b';
const TEMPLATES_DIR = '/Users/chrishogg/Documents/GitHub/codehogg/templates/agents';

async function generateLineArtASCII(agentName, imageFile) {
    const imagePath = path.join(BRAIN_DIR, imageFile);
    if (!fs.existsSync(imagePath)) return;

    try {
        const image = await Jimp.read(imagePath);

        // Target width for terminal
        const targetWidth = 60;
        const aspectRatio = image.bitmap.width / image.bitmap.height;
        const targetHeight = Math.round(targetWidth / aspectRatio / 2); // Divide by 2 because characters are taller than wide

        image.resize({ w: targetWidth, h: targetHeight });
        image.greyscale();
        image.contrast(0.9); // Extremely high contrast to isolate lines

        // Character ramp for "shading" - very minimal to keep it clean
        const ramp = ' .:-=+*#%@';

        let ascii = '';
        for (let y = 0; y < image.bitmap.height; y++) {
            let row = '';
            let rowEmpty = true;
            for (let x = 0; x < image.bitmap.width; x++) {
                const color = Jimp.intToRGBA(image.getPixelColor(x, y));
                const brightness = (color.r + color.g + color.b) / 3;

                // INVERTED Logic: Source is black on white. 
                // We want character for BLACK ink, space for WHITE background.
                if (brightness < 120) {
                    // It's ink! Use a character based on how dark it is.
                    const charIdx = Math.floor((1 - (brightness / 120)) * (ramp.length - 1));
                    row += ramp[charIdx];
                    rowEmpty = false;
                } else {
                    row += ' ';
                }
            }
            if (!rowEmpty) {
                ascii += row + '\n';
            }
        }

        updateAgentFile(agentName, ascii);

    } catch (err) {
        console.error(`Error converting ${agentName}:`, err);
    }
}

function updateAgentFile(agentName, asciiLines) {
    const filePath = path.join(TEMPLATES_DIR, `${agentName}.md`);
    if (!fs.existsSync(filePath)) return;

    let content = fs.readFileSync(filePath, 'utf8');
    const regex = /```text\n([\s\S]+?)\n```/;
    const newBlock = "```text\n" + asciiLines + "```";

    if (regex.test(content)) {
        content = content.replace(regex, newBlock);
    } else {
        const lines = content.split('\n');
        let insertIndex = lines.findIndex(l => l.startsWith('# '));
        if (insertIndex !== -1) {
            lines.splice(insertIndex + 1, 0, '\n' + newBlock);
            content = lines.join('\n');
        } else {
            content = newBlock + '\n\n' + content;
        }
    }

    fs.writeFileSync(filePath, content);
}

async function main() {
    for (const [name, file] of Object.entries(AGENTS)) {
        await generateLineArtASCII(name, file);
    }
}

main();
