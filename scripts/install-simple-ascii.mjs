
import fs from 'fs';
import path from 'path';

const TEMPLATES_DIR = 'templates/agents';

const AVATARS = {
    paul: `
      .---.
     /_____\\
     ( o o )
      \\ - /
      /---\\
     // | \\\\
    //  |  \\\\
   [  HOLO   ]
    `,
    nehemiah: `
      ,---.
     | [-] |
     | ò ó |
     (_^_)
     /| |\\
    / | | \\
   [ FWALL  ]
    `,
    david: `
      _\\W/_
      (o o)
       ~*~
      / | \\
     (  MIC  )
    `,
    solomon: `
      _===_
      (O O)
      ((v))
      / | \\
     <  DB   >
    `,
    moses: `
      /~~~\\
     ( -- )
     //_\\\\
    //   \\\\
   (( SPEC  ))
    `,
    bezaleel: `
      (o o)
     @( _ )@
      / | \\
     ( TECH  )
    `,
    aholiab: `
      _(-)_
     ( ^ ^ )
      \\ O /
      / | \\
     [ UX/UI ]
    `,
    hiram: `
     .----.
     |xxxx|
     (o o)
     (\\_/)
     /| |\\
    (  API  )
    `,
    ezra: `
      _____
     ( 0-0 )
      \\_-_/
      / | \\
     [ BUGS  ]
    `,
    zerubbabel: `
      /   \\
     |  ^  |
     ( o o )
      \\ = /
      / | \\
     ( CI/CD )
    `
};

function installSimpleAscii() {
    for (const [name, ascii] of Object.entries(AVATARS)) {
        const filePath = path.join(TEMPLATES_DIR, `${name}.md`);
        if (!fs.existsSync(filePath)) {
            console.warn(`Warning: Could not find ${filePath}`);
            continue;
        }

        let content = fs.readFileSync(filePath, 'utf8');
        const regex = /```text\n([\s\S]+?)\n```/;

        // Clean formatting - remove leading empty line if present and trim indentation
        const cleanAscii = ascii.split('\n').filter(line => line.trim().length > 0).join('\n') + '\n';

        const newBlock = "```text\n" + cleanAscii + "```";

        if (regex.test(content)) {
            content = content.replace(regex, newBlock);
        } else {
            const lines = content.split('\n');
            let insertIndex = lines.findIndex(l => l.startsWith('# '));
            if (insertIndex !== -1) {
                // Insert after title
                lines.splice(insertIndex + 1, 0, '\n' + newBlock);
                content = lines.join('\n');
            } else {
                // Insert at top
                content = newBlock + '\n\n' + content;
            }
        }

        fs.writeFileSync(filePath, content);
        console.log(`Updated ${name} with simple ASCII art.`);
    }
}

installSimpleAscii();
