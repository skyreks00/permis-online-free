import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_PATH = path.join(__dirname, '../public/data/examen_B.json');

const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
const total = data.questions.length;
let shortCount = 0;
let emptyCount = 0;

data.questions.forEach(q => {
    const exp = String(q.explanation || "");
    if (exp.trim() === "") {
        emptyCount++;
    } else if (exp.length < 50) {
        shortCount++;
    }
});

console.log(`Total: ${total}`);
console.log(`Empty: ${emptyCount}`);
console.log(`Short (<50 chars): ${shortCount}`);
console.log(`Good quality (estimated): ${total - emptyCount - shortCount}`);
