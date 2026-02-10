import fs from 'node:fs/promises';
import path from 'node:path';

const SITE_URL = process.env.SITE_URL || 'https://skyreks00.github.io/permis-online-free/';
const PUBLIC_DIR = path.resolve(process.cwd(), 'public');
const LESSON_DIR = path.join(PUBLIC_DIR, 'lecon');
const SITEMAP_PATH = path.join(PUBLIC_DIR, 'sitemap.xml');
const INDEX_HTML_PATH = path.resolve(process.cwd(), 'index.html');

const yyyyMmDd = (date = new Date()) => date.toISOString().slice(0, 10);

async function lastModifiedDateOrToday(filePath) {
  try {
    const stat = await fs.stat(filePath);
    return yyyyMmDd(stat.mtime);
  } catch {
    return yyyyMmDd(new Date());
  }
}

const xmlEscape = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

async function listLessonHtmlFiles() {
  try {
    const dirEntries = await fs.readdir(LESSON_DIR, { withFileTypes: true });
    return dirEntries
      .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.html'))
      .map((e) => e.name)
      .sort((a, b) => a.localeCompare(b, 'fr'));
  } catch (e) {
    if (e && (e.code === 'ENOENT' || e.code === 'ENOTDIR')) return [];
    throw e;
  }
}

function normalizeSiteUrl(siteUrl) {
  // Ensure trailing slash.
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

async function main() {
  const siteUrl = normalizeSiteUrl(SITE_URL);
  const today = yyyyMmDd();

  const homeLastmod = await lastModifiedDateOrToday(INDEX_HTML_PATH);

  const lessonFiles = await listLessonHtmlFiles();

  const urls = [];

  // Home
  urls.push(
    buildUrl(siteUrl, {
      lastmod: homeLastmod,
      changefreq: 'weekly',
      priority: '1.0',
    })
  );

  // Lessons (static HTML in /public/lecon)
  for (const file of lessonFiles) {
    const lessonLastmod = await lastModifiedDateOrToday(path.join(LESSON_DIR, file));
    urls.push(
      buildUrl(`${siteUrl}lecon/${encodeURIComponent(file)}`, {
        lastmod: lessonLastmod || today,
        changefreq: 'monthly',
        priority: '0.7',
      })
    );
  }

  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls.join('\n'),
    '</urlset>',
    '',
  ].join('\n');

  await fs.writeFile(SITEMAP_PATH, sitemap, 'utf8');

  console.log(`Generated sitemap with ${1 + lessonFiles.length} URLs at: ${SITEMAP_PATH}`);
}

await main();
