const fs = require('fs');
const path = require('path');

const replacements = [
    { from: /PulseForge/g, to: 'PolyPulse' },
    { from: /pulseforge/g, to: 'polypulse' },
    { from: /PULSEFORGE/g, to: 'POLYPULSE' }
];

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            if (f !== 'node_modules' && f !== '.git' && f !== '.next' && f !== 'dist') {
                walkDir(dirPath, callback);
            }
        } else {
            callback(path.join(dir, f));
        }
    });
}

walkDir(process.cwd(), (filePath) => {
    // Skip binary files and this script
    if (filePath.endsWith('.png') || filePath.endsWith('.jpg') || filePath.endsWith('.webm') || filePath.endsWith('.mp4') || filePath.endsWith('.ico') || filePath.endsWith('rename_project.js')) {
        return;
    }

    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let newContent = content;
        for (const r of replacements) {
            newContent = newContent.replace(r.from, r.to);
        }

        if (newContent !== content) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`Updated: ${filePath}`);
        }
    } catch (e) {
        // Skip files that can't be read as utf8
    }
});
