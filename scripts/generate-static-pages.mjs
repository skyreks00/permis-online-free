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

    // Definition of specific metadata
    const PAGE_METADATA = {
      '/lecons': {
        title: 'Leçons de Code de la Route Gratuit - Permis Online',
        description: 'Apprenez le code de la route belge gratuitement. Leçons complètes, illustrées et à jour pour le permis B.'
      },
      '/quiz': {
        title: 'Quiz Code de la Route Gratuit - Séries par Thèmes',
        description: 'Entraînez-vous avec nos quiz de code de la route gratuits. Des centaines de questions classées par thèmes pour réussir votre examen.'
      },
      '/examen-b': {
        title: 'Examen Blanc Permis de Conduire B - Simulation Gratuite',
        description: 'Passez un examen blanc du code de la route (Permis B) dans les conditions réelles. 50 questions, chronomètre et correction détaillée.'
      },
      '/profil': {
        title: 'Mon Profil - Suivi de Progression Permis Online',
        description: 'Suivez votre progression, analysez vos résultats et identifiez vos points faibles pour obtenir votre permis de conduire.'
      },
      '/revision': {
        title: 'Révision Code de la Route - Permis Online',
        description: 'Révisez vos erreurs et approfondissez vos connaissances du code de la route.'
      },
      '/resultats': {
        title: 'Mes Résultats - Permis Online Free',
        description: 'Consultez l\'historique de vos scores aux examens blancs et quiz.'
      }
    };

    // 4. Generate physical files
    for (const subPath of pathsToGenerate) {
      const isHtml = subPath.toLowerCase().endsWith('.html');
      // For directory paths, add a trailing slash to match server behavior and avoid redirects
      const normalizedPath = isHtml ? subPath : (subPath.endsWith('/') ? subPath : `${subPath}/`);
      const fullUrl = `${SITE_URL}${normalizedPath}`;
      
      // Get specific metadata or default
      // Remove trailing slash for matching if needed
      const lookupPath = subPath.endsWith('/') && subPath.length > 1 ? subPath.slice(0, -1) : subPath;
      const meta = PAGE_METADATA[lookupPath] || {};
      
      // Update metadata to avoid "Redirect Error" (fixed canonical tag issues)
      let pageContent = template
        .replaceAll('<link rel="canonical" href="https://permisfree.be/"', `<link rel="canonical" href="${fullUrl}"`)
        .replaceAll('<meta property="og:url" content="https://permisfree.be/"', `<meta property="og:url" content="${fullUrl}"`)
        .replaceAll('<meta property="twitter:url" content="https://permisfree.be/"', `<meta property="twitter:url" content="${fullUrl}"`);

      // Inject specific Title
      if (meta.title) {
        pageContent = pageContent
          .replace(/<title>.*?<\/title>/, `<title>${meta.title}</title>`)
          .replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${meta.title}" />`)
          .replace(/<meta property="twitter:title" content=".*?" \/>/, `<meta property="twitter:title" content="${meta.title}" />`);
      }

      // Inject specific Description
      if (meta.description) {
        pageContent = pageContent
          .replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${meta.description}" />`)
          .replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${meta.description}" />`)
          .replace(/<meta property="twitter:description" content=".*?" \/>/, `<meta property="twitter:description" content="${meta.description}" />`);
      }

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
