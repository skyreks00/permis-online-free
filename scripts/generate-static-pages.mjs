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
    
    // 3. Load index.html once for template
    const template = await fs.readFile(INDEX_SOURCE, 'utf-8');
    const SITE_URL = 'https://permisfree.be';

    // 4. Generate physical files
    for (const subPath of pathsToGenerate) {
      const isHtml = subPath.toLowerCase().endsWith('.html');
      // For directory paths, add a trailing slash to match server behavior and avoid redirects
      const normalizedPath = isHtml ? subPath : (subPath.endsWith('/') ? subPath : `${subPath}/`);
      const fullUrl = `${SITE_URL}${normalizedPath}`;
      
      // Update metadata to avoid "Redirect Error" (fixed canonical tag issues)
      let pageContent = template
        .replaceAll('<link rel="canonical" href="https://permisfree.be/"', `<link rel="canonical" href="${fullUrl}"`)
        .replaceAll('<meta property="og:url" content="https://permisfree.be/"', `<meta property="og:url" content="${fullUrl}"`)
        .replaceAll('<meta property="twitter:url" content="https://permisfree.be/"', `<meta property="twitter:url" content="${fullUrl}"`);

      if (isHtml) {
        // For paths like /cours/lesson.html -> create dist/cours/lesson.html as a file
        const targetFile = path.join(DIST_DIR, subPath);
        const targetDir = path.dirname(targetFile);

        // Ensure parent directory exists
        await fs.mkdir(targetDir, { recursive: true });

        // Write modified content
        await fs.writeFile(targetFile, pageContent, 'utf-8');
        console.log(`✅ Generated File: ${subPath}`);
      } else {
        // For clean URLs like /examen-b -> create dist/examen-b/index.html
        const targetDir = path.join(DIST_DIR, subPath);
        const targetFile = path.join(targetDir, 'index.html');

        // Ensure directory exists
        await fs.mkdir(targetDir, { recursive: true });

        // Write modified content
        await fs.writeFile(targetFile, pageContent, 'utf-8');
        console.log(`✅ Generated Folder: ${subPath}/index.html`);
      }
    }

    console.log('✨ All static pages generated successfully for SEO!');
  } catch (error) {
    console.error('❌ Error generating static pages:', error);
    process.exit(1);
  }
}

main();
