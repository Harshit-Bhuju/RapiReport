import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, '../src');
const enPath = path.join(srcDir, 'translations/en.json');
const nePath = path.join(srcDir, 'translations/ne.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ne = JSON.parse(fs.readFileSync(nePath, 'utf8'));

// Helper to check if key exists in object
function hasKey(obj, keyPath) {
    const keys = keyPath.split('.');
    let current = obj;
    for (const key of keys) {
        if (current === undefined || current === null) return false;
        current = current[key];
    }
    return current !== undefined;
}

// Recursively find all JSX/JS files
function getFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(getFiles(file));
        } else {
            if (file.endsWith('.jsx') || file.endsWith('.js')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = getFiles(srcDir);
const usedKeys = new Set();
const missingEn = [];
const missingNe = [];

// Regex to find t('key') or t("key")
const regex = /[^a-zA-Z]t\s*\(\s*["']([^"']+)["']\s*\)/g;

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = regex.exec(content)) !== null) {
        usedKeys.add(match[1]);
    }
});

console.log(`Found ${usedKeys.size} unique translation keys used in code.`);

usedKeys.forEach(key => {
    if (!hasKey(en, key)) missingEn.push(key);
    if (!hasKey(ne, key)) missingNe.push(key);
});

console.log('\n--- Missing in EN ---');
missingEn.forEach(k => console.log(k));

console.log('\n--- Missing in NE ---');
missingNe.forEach(k => console.log(k));

if (missingEn.length === 0 && missingNe.length === 0) {
    console.log('\nAll keys are present!');
}
