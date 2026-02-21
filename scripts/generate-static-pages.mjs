import fs from 'node:fs/promises';
import path from 'node:path';

const DIST_DIR = path.resolve(process.cwd(), 'dist');
const SITEMAP_PATH = path.resolve(process.cwd(), 'public/sitemap.xml');
const INDEX_SOURCE = path.join(DIST_DIR, 'index.html');

async function main() {
  try {
    // 1. Read sitemap
    const sitemapContent = await fs.readFile(SITEMAP_PATH, 'utf-8');
    
    // 2. Extract paths (simple logic to find <loc> content)
    const urlMatches = sitemapContent.matchAll(/<loc>(https?:\/\/[^<]+)<\/loc>/g);
    const pathsToGenerate = [];

    for (const match of urlMatches) {
      const url = new URL(match[1]);
      const pathname = url.pathname;
      
      // Skip root (already has index.html) and empty paths
      if (pathname === '/' || pathname === '') continue;
      
      pathsToGenerate.push(pathname);
    }

    console.log(`🔍 Found ${pathsToGenerate.length} sub-paths to generate...`);

    // 3. Generate physical files
    for (const subPath of pathsToGenerate) {
      // Create folder path in dist
      const targetDir = path.join(DIST_DIR, subPath);
      const targetFile = path.join(targetDir, 'index.html');

      // Ensure directory exists
      await fs.mkdir(targetDir, { recursive: true });

      // Copy index.html
      await fs.copyFile(INDEX_SOURCE, targetFile);
      
      console.log(`✅ Generated: ${subPath}/index.html`);
    }

    console.log('✨ All static pages generated successfully for SEO!');
  } catch (error) {
    console.error('❌ Error generating static pages:', error);
    process.exit(1);
  }
}

main();
