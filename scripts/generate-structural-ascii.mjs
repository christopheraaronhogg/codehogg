
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

function intToRGBA(i) {
    return {
        r: (i >>> 24) & 0xff,
        g: (i >>> 16) & 0xff,
        b: (i >>> 8) & 0xff,
        a: i & 0xff,
    };
}

// Directional ASCII Line mapping
function getCharForAngle(magnitude, angle) {
    if (magnitude < 30) return ' '; // Threshold for empty space (white background)

    // Normalize angle to 0-PI
    let a = angle;
    if (a < 0) a += Math.PI;

    // Map angle to chars
    // 0 is horizontal (-)
    // PI/2 is vertical (|)
    // PI/4 is diagonal down-right (\)
    // 3PI/4 is diagonal up-right (/)

    if (a < 0.3 || a > 2.8) return '-';
    if (a > 1.2 && a < 1.9) return '|';
    if (a >= 0.3 && a <= 1.2) return '\\'; // Image coords y is down, so positive slope in math is down-right visually?
    // Wait, atan2(y, x). visual y increases down. 
    // visual \ is dx>0, dy>0 => angle > 0. Correct.
    return '/';
}

async function generateStructuralASCII(agentName, imageFile) {
    const imagePath = path.join(BRAIN_DIR, imageFile);
    if (!fs.existsSync(imagePath)) return;

    try {
        const image = await Jimp.read(imagePath);

        const targetWidth = 50;
        const aspectRatio = image.bitmap.width / image.bitmap.height;
        // Characters are roughly 2x as tall as wide, so we divide height by 2
        const targetHeight = Math.round(targetWidth / aspectRatio / 2);

        image.resize({ w: targetWidth, h: targetHeight });
        image.greyscale();

        let ascii = '';
        const width = image.bitmap.width;
        const height = image.bitmap.height;

        for (let y = 0; y < height - 1; y++) {
            let row = '';
            let rowEmpty = true;
            for (let x = 0; x < width - 1; x++) {
                // Sobel Operator for Edge Detection
                // Gx = [ -1 0 +1 ]
                //      [ -2 0 +2 ]
                //      [ -1 0 +1 ]

                // Gy = [ -1 -2 -1 ]
                //      [  0  0  0 ]
                //      [ +1 +2 +1 ]

                const p00 = Jimp.intToRGBA(image.getPixelColor(x, y)).r;
                const p10 = Jimp.intToRGBA(image.getPixelColor(x + 1, y)).r;
                const p20 = Jimp.intToRGBA(image.getPixelColor(x + 2, y)).r || p10;

                const p01 = Jimp.intToRGBA(image.getPixelColor(x, y + 1)).r;
                const p21 = Jimp.intToRGBA(image.getPixelColor(x + 2, y + 1)).r || p10;

                const p02 = Jimp.intToRGBA(image.getPixelColor(x, y + 2)).r || p01;
                const p12 = Jimp.intToRGBA(image.getPixelColor(x + 1, y + 2)).r || p01;
                const p22 = Jimp.intToRGBA(image.getPixelColor(x + 2, y + 2)).r || p01;

                // Simple gradient approximation
                // Gx ≈ (p00 + 2*p01 + p02) - (p20 + 2*p21 + p22) ? No, that's left minus right
                // Correct Sobel Gx (right - left):
                // (p20 + 2*p21 + p22) - (p00 + 2*p01 + p02)

                // Use simplified 2x2 Roberts Cross/Difference for speed and smaller kernel at this low res
                const px = intToRGBA(image.getPixelColor(x, y)).r;
                const px_right = intToRGBA(image.getPixelColor(x + 1, y)).r;
                const px_down = intToRGBA(image.getPixelColor(x, y + 1)).r;

                const gx = px - px_right;
                const gy = px - px_down;

                const magnitude = Math.sqrt(gx * gx + gy * gy);
                const angle = Math.atan2(gy, gx);

                // Add some "fill" for very dark areas that aren't edges
                if (px < 50 && magnitude < 30) {
                    row += '@'; // Dark fill
                    rowEmpty = false;
                } else if (px < 100 && magnitude < 30) {
                    row += '.'; // Light fill
                    rowEmpty = false;
                } else {
                    const char = getCharForAngle(magnitude, angle);
                    row += char;
                    if (char !== ' ') rowEmpty = false;
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
        await generateStructuralASCII(name, file);
    }
}

main();
