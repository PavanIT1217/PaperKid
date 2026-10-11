import { PACKS } from '../worksheets/packs';
import { pageById, SITE, variantCopy, type PageCopy } from './content';

const CLASSIC_WORDS: Record<string, string> = {
  A: 'Apple', B: 'Butterfly', C: 'Cat', D: 'Dog', E: 'Elephant', F: 'Fish', G: 'Grapes', H: 'House', I: 'Ice cream',
  J: 'Juice', K: 'Kite', L: 'Lion', M: 'Moon', N: 'Nose', O: 'Octopus', P: 'Pig', Q: 'Queen', R: 'Rabbit', S: 'Sun',
  T: 'Tree', U: 'Umbrella', V: 'Violin', W: 'Whale', X: 'Fox', Y: 'Yo-yo', Z: 'Zebra',
};

export const fullTitle = (t: string) => (t.includes('PaperKid') ? t : `${t} | PaperKid`);

export const HOME_COPY = {
  title: 'Free Printable Worksheets for Kids – Tracing, Math & More | PaperKid',
  description: SITE.description,
};

/** Full copy for a worksheet page or one of its variants (letter A, number 5, a pack). */
export function copyFor(id: string, variant: string | null, packId?: string): PageCopy | null {
  const base = pageById(id);
  if (!base) return null;
  if (!variant) return base;
  const pk = packId ? PACKS[packId] : undefined;
  const extra = { packTitle: pk?.title, packBlurb: pk?.blurb, word: id === 'letters' ? CLASSIC_WORDS[variant.toUpperCase()] : undefined };
  return { ...base, ...variantCopy(base, variant, extra) };
}

function setMeta(attr: 'name' | 'property', key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = value;
}

/** Keep <title>, description, canonical and social tags in step with in-app navigation. */
export function applyHead(title: string, description: string, path: string, noindex = false) {
  document.title = title;
  const url = SITE.url + path;
  setMeta('name', 'description', description);
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', description);
  setMeta('property', 'og:url', url);
  setMeta('name', 'twitter:title', title);
  setMeta('name', 'twitter:description', description);
  setMeta('name', 'robots', noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large');
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = url;
}
