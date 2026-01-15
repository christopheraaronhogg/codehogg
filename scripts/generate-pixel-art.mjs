
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

function intToRGBA(i) {
    return {
        r: (i >>> 24) & 0xff,
        g: (i >>> 16) & 0xff,
        b: (i >>> 8) & 0xff,
        a: i & 0xff,
    };
}

async function generatePixelArt(agentName, imageFile) {
    const imagePath = path.join(BRAIN_DIR, imageFile);
    if (!fs.existsSync(imagePath)) return;

    try {
        const image = await Jimp.read(imagePath);

        // Constrain to 40 pixels wide for TUI-friendly height (roughly 20-30 lines)
        const targetWidth = 40;
        const aspectRatio = image.bitmap.width / image.bitmap.height;
        const targetHeight = Math.round(targetWidth / aspectRatio);

        // Ensure height is even because each character covers 2 pixels vertically
        const finalHeight = targetHeight % 2 === 0 ? targetHeight : targetHeight + 1;

        image.resize({ w: targetWidth, h: finalHeight });

        // Force high contrast for that "park caricature" ink look
        image.contrast(0.2);

        let ascii = '';
        const RESET = '\x1b[0m';

        for (let y = 0; y < image.bitmap.height; y += 2) {
            for (let x = 0; x < image.bitmap.width; x++) {
                const topPixel = intToRGBA(image.getPixelColor(x, y));
                const bottomPixel = intToRGBA(image.getPixelColor(x, y + 1));

                // Convert to grayscale
                const topG = Math.round((topPixel.r + topPixel.g + topPixel.b) / 3);
                const bottomG = Math.round((bottomPixel.r + bottomPixel.g + bottomPixel.b) / 3);

                // Foreground = top pixel, Background = bottom pixel
                // ANSI 24-bit: \x1b[38;2;R;G;Bm (foreground) \x1b[48;2;R;G;Bm (background)
                ascii += `\x1b[38;2;${topG};${topG};${topG};48;2;${bottomG};${bottomG};${bottomG}m▀${RESET}`;
            }
            ascii += '\n';
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
        await generatePixelArt(name, file);
    }
    console.log('High-fidelity Pixel Art generated using ANSI half-blocks.');
}

main();
