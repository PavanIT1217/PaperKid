// Writes a static HTML file for every public page (title, meta tags, structured data and
// readable content), plus sitemap.xml, robots.txt and a 404 page. The React app takes over
// in the browser. Run after `vite build` and `vite build --ssr src/seo/entry.ts`.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const ssrDir = join(root, 'dist-ssr');
const { pages, siteUrl } = await import(pathToFileURL(join(ssrDir, 'entry.js')).href);

const template = readFileSync(join(dist, 'index.html'), 'utf8');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// "</script>" can't appear inside JSON-LD
const jsonLd = (o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`;

function render(page, { noindex = false } = {}) {
  const url = siteUrl + page.path;
  const head = [
    `<title>${esc(page.title)}</title>`,
    `<meta name="description" content="${esc(page.description)}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta name="robots" content="${noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'}" />`,
    `<meta property="og:title" content="${esc(page.title)}" />`,
    `<meta property="og:description" content="${esc(page.description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta name="twitter:title" content="${esc(page.title)}" />`,
    `<meta name="twitter:description" content="${esc(page.description)}" />`,
    ...page.jsonLd.map(jsonLd),
  ].join('\n    ');
  const out = template
    .replace(/<!--seo:head-->[\s\S]*?<!--\/seo:head-->/, head)
    .replace('<!--seo:body-->', page.body);
  if (out === template) throw new Error('SEO markers missing from dist/index.html');
  return out;
}

const list = pages();
for (const page of list) {
  const file = page.path === '/' ? join(dist, 'index.html') : join(dist, page.path, 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, render(page));
}

// 404: the app shows "page not found"; GitHub Pages serves this with a 404 status.
writeFileSync(join(dist, '404.html'), render({ ...list[0], title: 'Page not found | PaperKid', path: '/', jsonLd: [] }, { noindex: true }));

const today = new Date().toISOString().slice(0, 10);
writeFileSync(
  join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${list
  .map((p) => `  <url><loc>${siteUrl}${p.path}</loc><lastmod>${today}</lastmod><priority>${p.priority.toFixed(1)}</priority></url>`)
  .join('\n')}
</urlset>
`,
);
writeFileSync(join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`);

rmSync(ssrDir, { recursive: true, force: true });
console.log(`prerendered ${list.length} pages + 404, sitemap.xml, robots.txt`);
