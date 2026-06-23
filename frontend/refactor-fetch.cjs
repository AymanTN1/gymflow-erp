const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src', 'pages');

function walkDir(dir) {
    fs.readdirSync(dir).forEach(file => {
        let fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.jsx') && file !== 'Login.jsx') {
            processFile(fullPath);
        }
    });
}

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Si le fichier contient fetch(
    if (content.includes('fetch(') || content.includes('fetch(')) {
        // Remplacer "await fetch(" par "await apiFetch(" et "fetch(" par "apiFetch("
        content = content.replace(/\bfetch\(/g, 'apiFetch(');
        
        // Calculer le chemin relatif vers utils/api
        const relativePath = path.relative(path.dirname(filePath), path.join(__dirname, 'src', 'utils', 'api'));
        const importPath = relativePath.replace(/\\/g, '/'); // Windows to Posix
        
        // Ajouter l'import
        if (!content.includes('apiFetch')) {
            // Already replaced, so it will contain apiFetch. Check if imported.
        }
        
        const importStatement = `import { apiFetch } from '${importPath}';\n`;
        content = importStatement + content;
        
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
    }
}

walkDir(srcDir);
