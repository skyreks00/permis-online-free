import fs from 'node:fs/promises';
import path from 'node:path';

const SITE_URL = process.env.SITE_URL || 'https://permisfree.be/';
const PUBLIC_DIR = path.resolve(process.cwd(), 'public');
const SITEMAP_PATH = path.join(PUBLIC_DIR, 'sitemap.xml');
const THEMES_PATH = path.join(PUBLIC_DIR, 'data', 'themes.json');

const yyyyMmDd = (date = new Date()) => date.toISOString().slice(0, 10);

const xmlEscape = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

function normalizeSiteUrl(siteUrl) {
  return siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`;
}

function buildUrl(loc, { lastmod, changefreq, priority }) {
  return [
    '  <url>',
    `    <loc>${xmlEscape(loc)}</loc>`,
    lastmod ? `    <lastmod>${xmlEscape(lastmod)}</lastmod>` : null,
    changefreq ? `    <changefreq>${xmlEscape(changefreq)}</changefreq>` : null,
    priority ? `    <priority>${xmlEscape(priority)}</priority>` : null,
    '  </url>',
  ]
    .filter(Boolean)
    .join('\n');
}

async function loadThemes() {
  try {
    const data = await fs.readFile(THEMES_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load themes data:', error);
    return { sections: [] };
  }
}

async function main() {
  const siteUrl = normalizeSiteUrl(SITE_URL);
  const today = yyyyMmDd();

  const urls = [];

  // 1. Static Routes (Clean URLs)
  const staticRoutes = [
    { path: '', priority: '1.0', changefreq: 'weekly' },
    { path: 'profil', priority: '0.8', changefreq: 'monthly' },
    { path: 'resultats', priority: '0.5', changefreq: 'monthly' },
  ];

  for (const route of staticRoutes) {
    let fullPath;
    if (route.path === '') {
      fullPath = siteUrl;
    } else {
      fullPath = `${siteUrl}${route.path}`;
    }

    urls.push(buildUrl(fullPath, {
      lastmod: today,
      changefreq: route.changefreq,
      priority: route.priority
    }));
  }

  // 2. Dynamic Content from Themes (Clean URLs)
  // Quizzes Excluded per user request
  const data = await loadThemes();

  if (data.sections) {
    for (const section of data.sections) {
      const items = section.items || section.themes || [];

      for (const item of items) {
        // Quiz Route - EXCLUDED

        // Lesson Route
        if (item.lessonFile) {
          urls.push(buildUrl(`${siteUrl}lecon/${item.lessonFile}`, {
            lastmod: today,
            changefreq: 'monthly',
            priority: '0.6'
          }));
        }
      }
    }
  }

  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls.join('\n'),
    '</urlset>',
    '',
  ].join('\n');

  await fs.writeFile(SITEMAP_PATH, sitemap, 'utf8');

  console.log(`Generated sitemap with ${urls.length} URLs at: ${SITEMAP_PATH}`);
}

await main();
