// Build-time only (vite build --ssr): describes every public page so scripts/prerender.mjs can
// write static HTML with its own title, meta tags, structured data and readable content.
import { PACK_SLUGS } from '../lib/share';
import { WORKSHEETS } from '../worksheets';
import { PACKS } from '../worksheets/packs';
import { CATEGORIES } from '../worksheets/types';
import { PAGES, SITE, pageById, type PageCopy } from './content';
import { copyFor, fullTitle, HOME_COPY } from './copy';

export interface PrerenderPage {
  path: string;
  title: string;
  description: string;
  jsonLd: object[];
  body: string;
  priority: number;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const abs = (path: string) => SITE.url + path;
const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');
const NUMBERS = Array.from({ length: 21 }, (_, i) => String(i));

const ORG = {
  '@type': 'Organization',
  '@id': `${SITE.url}/#org`,
  name: SITE.name,
  url: SITE.url + '/',
  logo: `${SITE.url}/apple-touch-icon.png`,
};

function breadcrumbs(items: [string, string][]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(path) })),
  };
}

function learningResource(c: PageCopy, path: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: c.h1,
    description: c.description,
    url: abs(path),
    learningResourceType: 'Worksheet',
    educationalLevel: c.levels,
    audience: { '@type': 'EducationalAudience', educationalRole: ['parent', 'teacher'] },
    inLanguage: 'en',
    isAccessibleForFree: true,
    keywords: c.keywords.join(', '),
    image: SITE.image,
    provider: { '@id': `${SITE.url}/#org` },
  };
}

function faqLd(c: PageCopy) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: c.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
}

/** Footer with links to every page – the same crawl paths the app's footer offers. */
function siteNav(): string {
  const cats = CATEGORIES.map(
    (cat) =>
      `<nav aria-label="${esc(cat.title)}"><h3>${esc(cat.title)}</h3><ul>${WORKSHEETS.filter((w) => w.category === cat.id)
        .map((w) => `<li><a href="/${pageById(w.id)?.slug}/">${esc(w.title)}</a></li>`)
        .join('')}</ul></nav>`,
  ).join('');
  const packs = `<nav aria-label="Workbook packs"><h3>Workbooks</h3><ul>${Object.entries(PACKS)
    .map(([id, p]) => `<li><a href="/workbook-packs/${PACK_SLUGS[id]}/">${esc(p.title)}</a></li>`)
    .join('')}</ul></nav>`;
  const letters = `<nav aria-label="Letter tracing by letter"><h3>Letter tracing</h3><p>${LETTERS.map((l) => `<a href="/letter-tracing-worksheets/${l}/">Letter ${l.toUpperCase()}</a>`).join(' ')}</p></nav>`;
  const numbers = `<nav aria-label="Number tracing by number"><h3>Number tracing</h3><p>${NUMBERS.map((n) => `<a href="/number-tracing-worksheets/${n}/">Number ${n}</a>`).join(' ')}</p></nav>`;
  return `<footer class="site-nav"><div class="site-nav-inner">${cats}${packs}</div><div class="site-nav-inner quick">${letters}${numbers}</div></footer>`;
}

const header = `<header class="topbar"><a class="brand" href="/">Paper<span class="brand-kid">Kid</span></a></header>`;

function pageBody(c: PageCopy, crumbs: [string, string][]): string {
  const crumbHtml = crumbs.map(([n, p], i) => (i === crumbs.length - 1 ? `<span aria-current="page">${esc(n)}</span>` : `<a href="${p}">${esc(n)}</a>`)).join(' › ');
  return `${header}<main class="ssr-page"><nav class="breadcrumbs" aria-label="Breadcrumb">${crumbHtml}</nav>
<h1>${esc(c.h1)}</h1>
<p>${esc(c.intro)}</p>
<h2>What's included</h2><ul>${c.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
<p><b>Best for:</b> ${esc(c.levels.join(', '))}. Free to download as a PDF in A4 or US Letter.</p>
<h2>Questions parents ask</h2>${c.faq.map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join('')}
</main>${siteNav()}`;
}

function homeBody(): string {
  const sections = CATEGORIES.map(
    (cat) =>
      `<section><h2>${esc(cat.title)}</h2><p>${esc(cat.blurb)}</p><ul>${WORKSHEETS.filter((w) => w.category === cat.id)
        .map((w) => {
          const c = pageById(w.id)!;
          return `<li><a href="/${c.slug}/">${esc(c.h1)}</a> – ${esc(c.description)}</li>`;
        })
        .join('')}</ul></section>`,
  ).join('');
  return `${header}<main class="ssr-page"><h1>Free printable worksheets for kids</h1>
<p>${esc(SITE.description)}</p>${sections}</main>${siteNav()}`;
}

export function pages(): PrerenderPage[] {
  const out: PrerenderPage[] = [];
  out.push({
    path: '/',
    title: HOME_COPY.title,
    description: HOME_COPY.description,
    priority: 1,
    body: homeBody(),
    jsonLd: [
      { '@context': 'https://schema.org', '@type': 'WebSite', '@id': `${SITE.url}/#site`, name: SITE.name, url: SITE.url + '/', description: SITE.description, publisher: { '@id': `${SITE.url}/#org` } },
      { '@context': 'https://schema.org', ...ORG },
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: SITE.name,
        url: SITE.url + '/',
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Web, iOS, Android',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        description: SITE.description,
        image: SITE.image,
      },
    ],
  });

  for (const base of PAGES) {
    const path = `/${base.slug}/`;
    const crumbs: [string, string][] = [
      ['Home', '/'],
      [base.h1, path],
    ];
    out.push({
      path,
      title: fullTitle(base.title),
      description: base.description,
      priority: 0.9,
      body: pageBody(base, crumbs),
      jsonLd: [breadcrumbs(crumbs), learningResource(base, path), faqLd(base)],
    });
  }

  const variant = (id: string, v: string, path: string, label: string, packId?: string) => {
    const base = pageById(id)!;
    const c = copyFor(id, v, packId)!;
    const crumbs: [string, string][] = [
      ['Home', '/'],
      [base.h1, `/${base.slug}/`],
      [label, path],
    ];
    out.push({
      path,
      title: fullTitle(c.title),
      description: c.description,
      priority: 0.7,
      body: pageBody(c, crumbs),
      jsonLd: [breadcrumbs(crumbs), learningResource(c, path), faqLd(c)],
    });
  };
  for (const l of LETTERS) variant('letters', l, `/letter-tracing-worksheets/${l}/`, `Letter ${l.toUpperCase()}`);
  for (const n of NUMBERS) variant('numbers', n, `/number-tracing-worksheets/${n}/`, `Number ${n}`);
  for (const [id, slug] of Object.entries(PACK_SLUGS)) variant('packs', slug, `/workbook-packs/${slug}/`, PACKS[id].title, id);
  return out;
}

export const siteUrl = SITE.url;
