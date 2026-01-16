
import fs from 'fs';
import path from 'path';

const TEMPLATES_DIR = 'templates/agents';

// FIGlet font: Standard (roughly)
// Clean, readable, bold text headers.
const FIGLET_HEADERS = {
    paul: `
  ____             _ 
 |  _ \\ __ _ _   _| |
 | |_) / _\` | | | | |
 |  __/ (_| | |_| | |
 |_|   \\__,_|\\__,_|_|
    `,
    nehemiah: `
  _   _      _                      _       _     
 | \\ | | ___| |__   ___ _ __ ___ (_) __ _| |__  
 |  \\| |/ _ \\ '_ \\ / _ \\ '_ \` _ \\| |/ _\` | '_ \\ 
 | |\\  |  __/ | | |  __/ | | | | | | (_| | | | |
 |_| \\_|\\___|_| |_|\\___|_| |_| |_|_|\\__,_|_| |_|
    `,
    bezaleel: `
  ____                _            _ 
 | __ )  ___ ______ _| | ___  ___ | |
 |  _ \\ / _ \\_  / _\` | |/ _ \\/ _ \\| |
 | |_) |  __// / (_| | |  __/  __/| |
 |____/ \\___/___\\__,_|_|\\___|\\___||_|
    `,
    hiram: `
  _   _ _                     
 | | | (_)_ __ __ _ _ __ ___  
 | |_| | | '__/ _\` | '_ \` _ \\ 
 |  _  | | | | (_| | | | | | |
 |_| |_|_|_|  \\__,_|_| |_| |_|
    `,
    aholiab: `
     _     _           _ _       _     
    / \\   | |__   ___ | (_) __ _| |__  
   / _ \\  | '_ \\ / _ \\| | |/ _\` | '_ \\ 
  / ___ \\ | | | | (_) | | | (_| | |_) |
 /_/   \\_\\|_| |_|\\___/|_|_|\\__,_|_.__/ 
    `,
    solomon: `
  ____        _                             
 / ___|  ___ | | ___  _ __ ___   ___  _ __  
 \\___ \\ / _ \\| |/ _ \\| '_ \` _ \\ / _ \\| '_ \\ 
  ___) | (_) | | (_) | | | | | | (_) | | | |
 |____/ \\___/|_|\\___/|_| |_| |_|\\___/|_| |_|
    `,
    zerubbabel: `
  _____                    _     _           _          _ 
 |__  /___ _ __ _   _  ___| |__ | |__   __ _| |__   ___| |
   / // _ \\ '__| | | |/ _ \\ '_ \\| '_ \\ / _\` | '_ \\ / _ \\ |
  / /|  __/ |  | |_| |  __/ |_) | |_) | (_| | |_) |  __/ |
 /____\\___|_|   \\__,_|\\___|_.__/|_.__/ \\__,_|_.__/ \\___|_|
    `,
    ezra: `
  _____              
 | ____|________ __ _ 
 |  _| |_  / _ \\/ _\` |
 | |___ / /|  __/ (_| |
 |_____/___\\___|\\__,_|
    `,
    moses: `
  __  __                  
 |  \\/  | ___  ___  ___ ___ 
 | |\\/| |/ _ \\/ __|/ _ \\ __|
 | |  | | (_) \\__ \\  __\\__ \\
 |_|  |_|\\___/|___/\\___|___/
    `,
    david: `
  ____            _     _ 
 |  _ \\ __ ___   ___  _| |
 | | | / _\` \\ \\ / / |/ _\` |
 | |_| | (_| \\ V /| | (_| |
 |____/ \\__,_|\\_/ |_|\\__,_|
    `
};

function installTextHeaders() {
    for (const [name, ascii] of Object.entries(FIGLET_HEADERS)) {
        const filePath = path.join(TEMPLATES_DIR, `${name}.md`);
        if (!fs.existsSync(filePath)) {
            console.warn(`Warning: Could not find ${filePath}`);
            continue;
        }

        let content = fs.readFileSync(filePath, 'utf8');
        const regex = /```text\n([\s\S]+?)\n```/;

        const cleanAscii = ascii.split('\n').filter(line => line.trim().length > 0).join('\n');
        const newBlock = "```text\n" + cleanAscii + "\n```";

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
        console.log(`Updated ${name} with text header.`);
    }
}

installTextHeaders();
