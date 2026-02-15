import fs from 'node:fs/promises';
import path from 'node:path';

const DIST_DIR = path.resolve(process.cwd(), 'dist');
const INDEX_PATH = path.join(DIST_DIR, 'index.html');
const NOT_FOUND_PATH = path.join(DIST_DIR, '404.html');

async function main() {
  try {
    await fs.copyFile(INDEX_PATH, NOT_FOUND_PATH);
    console.log('✅ Copied index.html to 404.html for GitHub Pages SPA support.');
  } catch (error) {
    console.error('❌ Failed to copy to 404.html:', error);
    process.exit(1);
  }
}

main();
