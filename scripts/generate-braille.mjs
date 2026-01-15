
import { Jimp } from 'jimp';
import fs from 'fs';
import path from 'path';

const AGENTS = {
    'moses': 'moses_product_1768512805528.png',
    'paul': 'paul_masterbuilder_1768512821205.png',
    'david': 'david_voice_1768512835402.png',
    'aholiab': 'aholiab_frontend_1768512858411.png',
    'bezaleel': 'bezaleel_architecture_1768512872786.png',
    'ezra': 'ezra_qa_1768512887408.png',
    'hiram': 'hiram_backend_1768512912621.png',
    'nehemiah': 'nehemiah_security_1768512926292.png',
    'solomon': 'solomon_data_1768512942023.png',
    'zerubbabel': 'zerubbabel_devops_1768512958319.png'
};

const BRAIN_DIR = '/Users/chrishogg/.gemini/antigravity/brain/14635805-b6b5-4657-9057-5286ec00cf8b';
const TEMPLATES_DIR = '/Users/chrishogg/Documents/GitHub/codehogg/templates/agents';

// Braille dot mapping
const DOTS = [
    [0x01, 0x08],
    [0x02, 0x10],
    [0x04, 0x20],
    [0x40, 0x80]
];

function intToRGBA(i) {
    return {
        r: (i >>> 24) & 0xff,
        g: (i >>> 16) & 0xff,
        b: (i >>> 8) & 0xff,
        a: i & 0xff,
    };
}

async function generateBrailleArt(agentName, imageFile) {
    const imagePath = path.join(BRAIN_DIR, imageFile);
    if (!fs.existsSync(imagePath)) return;

    try {
        const image = await Jimp.read(imagePath);

        // Constrain to 40 chars wide for TUI-friendly size
        const targetWidthChars = 40;
        const targetWidthPixels = targetWidthChars * 2;
        const aspectRatio = image.bitmap.width / image.bitmap.height;
        const targetHeightPixels = Math.round(targetWidthPixels / aspectRatio);

        // Ensure height is multiple of 4
        const finalHeightPixels = Math.ceil(targetHeightPixels / 4) * 4;

        image.resize({ w: targetWidthPixels, h: finalHeightPixels });

        // High contrast for line art
        image.greyscale();
        image.contrast(0.8);

        let ascii = '';
        for (let y = 0; y < image.bitmap.height; y += 4) {
            let rowEmpty = true;
            let row = '';
            for (let x = 0; x < image.bitmap.width; x += 2) {
                let byte = 0;
                for (let dy = 0; dy < 4; dy++) {
                    for (let dx = 0; dx < 2; dx++) {
                        const pixelColor = image.getPixelColor(x + dx, y + dy);
                        const rgba = intToRGBA(pixelColor);
                        // Very high threshold to catch just the ink lines
                        if (rgba.r < 140) {
                            byte |= DOTS[dy][dx];
                            rowEmpty = false;
                        }
                    }
                }
                row += String.fromCharCode(0x2800 + byte);
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
        await generateBrailleArt(name, file);
    }
}

main();
