// Optional Google Analytics 4. Enabled only when the site is built with VITE_GA_ID set
// (e.g. a repository variable passed in the deploy workflow). Without it, nothing loads.

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const GA_ID = import.meta.env.VITE_GA_ID as string | undefined;
let started = false;

export function initAnalytics() {
  if (!GA_ID || started || typeof document === 'undefined') return;
  started = true;
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag('js', new Date());
  // hash routes are tracked manually below
  window.gtag('config', GA_ID, { send_page_view: false, anonymize_ip: true });
}

export function track(event: string, params: Record<string, string | number> = {}) {
  if (!GA_ID || !window.gtag) return;
  window.gtag('event', event, params);
}

export function trackPage(id: string) {
  track('page_view', { page_title: id || 'home', page_location: `${location.origin}${location.pathname}#/${id}` });
}
