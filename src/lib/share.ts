// Routing with real, crawlable paths:
//   /                                   home
//   /<slug>/                            a worksheet, e.g. /letter-tracing-worksheets/
//   /letter-tracing-worksheets/a/       letter A only (also numbers/5, workbook-packs/kindergarten-week)
//   /<slug>/?o=<base64url(JSON)>        shared link carrying the exact settings
// Old "#/<id>?o=…" links are redirected to the new paths.
import { PACKS } from '../worksheets/packs';
import { pageById, pageBySlug } from '../seo/content';

export const PACK_SLUGS: Record<string, string> = {
  alphabet: 'alphabet-a-z',
  numbers: 'numbers-0-20',
  prek: 'pre-k-starter',
  kweek: 'kindergarten-week',
  grade1: 'grade-1',
  grade2: 'grade-2-3',
  summer: 'summer-fun',
};
const PACK_BY_SLUG = Object.fromEntries(Object.entries(PACK_SLUGS).map(([id, s]) => [s, id]));

function toB64Url(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64Url(s: string): string {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '==='.slice((b64.length + 3) % 4));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

function decodeOpts(o: string | null): Record<string, unknown> | null {
  if (!o) return null;
  try {
    const v = JSON.parse(fromB64Url(o));
    return v && typeof v === 'object' && !Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
}

export interface Route {
  /** worksheet id, or '' for home, or null for an unknown path */
  id: string | null;
  /** letter / number / pack slug for variant pages */
  variant: string | null;
  /** settings from the variant and/or a shared link */
  opts: Record<string, unknown> | null;
  /** canonical path of this page (no query) */
  path: string;
}

/** Preset options for a variant page, or null if the variant doesn't exist. */
export function variantOpts(id: string, variant: string): Record<string, unknown> | null {
  if (id === 'letters' && /^[a-z]$/i.test(variant)) return { letters: [variant.toUpperCase()] };
  if (id === 'numbers' && /^\d{1,2}$/.test(variant) && Number(variant) <= 20) return { from: Number(variant), to: Number(variant) };
  if (id === 'packs' && PACK_BY_SLUG[variant] && PACKS[PACK_BY_SLUG[variant]]) return { pack: PACK_BY_SLUG[variant], cover: true, certificate: true };
  return null;
}

export function parseLocation(pathname: string, search: string): Route {
  const parts = pathname.split('/').filter(Boolean);
  const shared = decodeOpts(new URLSearchParams(search).get('o'));
  if (!parts.length) return { id: '', variant: null, opts: null, path: '/' };
  const page = pageBySlug(parts[0]);
  if (!page || parts.length > 2) return { id: null, variant: null, opts: null, path: pathname };
  if (parts.length === 2) {
    const preset = variantOpts(page.id, parts[1]);
    if (!preset) return { id: null, variant: null, opts: null, path: pathname };
    const variant = parts[1].toLowerCase();
    return { id: page.id, variant, opts: { ...preset, ...(shared ?? {}) }, path: `/${page.slug}/${variant}/` };
  }
  return { id: page.id, variant: null, opts: shared, path: `/${page.slug}/` };
}

/** Path for a worksheet, optionally carrying settings. */
export function routeFor(id: string, opts?: Record<string, unknown>): string {
  // packs open on their own pack page when only the pack is chosen
  if (id === 'packs' && opts && typeof opts.pack === 'string' && PACK_SLUGS[opts.pack] && Object.keys(opts).every((k) => ['pack', 'cover', 'certificate'].includes(k))) {
    return `/workbook-packs/${PACK_SLUGS[opts.pack]}/`;
  }
  const slug = pageById(id)?.slug ?? id;
  return opts ? `/${slug}/?o=${toB64Url(JSON.stringify(opts))}` : `/${slug}/`;
}

export function shareUrl(id: string, opts: Record<string, unknown>): string {
  return `${location.origin}${routeFor(id, opts)}`;
}

/** Old "#/<id>?o=…" links → new path (or null if not a legacy link). */
export function legacyHashTarget(hash: string): string | null {
  if (!hash.startsWith('#/')) return null;
  const [id, query = ''] = hash.slice(2).split('?');
  if (!id) return '/';
  const opts = decodeOpts(new URLSearchParams(query).get('o'));
  return pageById(id) ? routeFor(id, opts ?? undefined) : '/';
}

// ---------------------------------------------------------------- client-side navigation

const NAV_EVENT = 'paperkid:navigate';

export function navigate(url: string, replace = false) {
  if (replace) history.replaceState(null, '', url);
  else history.pushState(null, '', url);
  window.dispatchEvent(new Event(NAV_EVENT));
}

/** Calls `cb` on back/forward and on in-app navigation. */
export function onNavigate(cb: () => void): () => void {
  window.addEventListener('popstate', cb);
  window.addEventListener(NAV_EVENT, cb);
  return () => {
    window.removeEventListener('popstate', cb);
    window.removeEventListener(NAV_EVENT, cb);
  };
}

/** Turn plain <a href="/…"> clicks into in-app navigation (no full page reload). */
export function interceptLinks(): () => void {
  const on = (e: MouseEvent) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element | null)?.closest?.('a');
    if (!a || a.target || a.hasAttribute('download')) return;
    const href = a.getAttribute('href');
    if (!href || !href.startsWith('/') || href.startsWith('//')) return;
    e.preventDefault();
    if (href !== location.pathname + location.search) navigate(href);
  };
  document.addEventListener('click', on);
  return () => document.removeEventListener('click', on);
}
