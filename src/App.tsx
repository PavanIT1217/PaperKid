import { useEffect, useState } from 'react';
import { AccountButton } from './components/AccountButton';
import { Builder } from './components/Builder';
import { Home } from './components/Home';
import { initAnalytics, trackPage } from './lib/analytics';
import { COUNTRIES, countryOf, guessCountry } from './lib/country';
import type { CommonOptions } from './lib/render';
import { interceptLinks, legacyHashTarget, navigate, onNavigate, parseLocation } from './lib/share';
import { applyHead, copyFor, fullTitle, HOME_COPY } from './seo/copy';
import { SiteFooter } from './components/SiteFooter';
import { load, save } from './lib/storage';
import { findWorksheet } from './worksheets';

function initialCommon(): CommonOptions {
  const saved = load<Partial<CommonOptions>>('common', {});
  const country = saved.country ?? guessCountry();
  return { paper: countryOf(country).paper, childName: '', showNameLine: true, inkSaver: false, ...saved, country };
}


const here = () => location.pathname + location.search;

export function App() {
  const [url, setUrl] = useState(() => {
    // old "#/letters?o=…" links → "/letter-tracing-worksheets/?o=…"
    const legacy = legacyHashTarget(location.hash);
    if (legacy) history.replaceState(null, '', legacy);
    return here();
  });
  const [common, setCommon] = useState<CommonOptions>(initialCommon);

  useEffect(() => {
    initAnalytics();
    const stopLinks = interceptLinks();
    const stopNav = onNavigate(() => {
      setUrl(here());
      window.scrollTo(0, 0);
    });
    return () => {
      stopLinks();
      stopNav();
    };
  }, []);

  useEffect(() => save('common', common), [common]);

  const route = parseLocation(location.pathname, location.search);
  const ws = route.id ? findWorksheet(route.id) : undefined;

  useEffect(() => {
    if (route.id === null) applyHead('Page not found | PaperKid', HOME_COPY.description, route.path, true);
    else if (!route.id) applyHead(HOME_COPY.title, HOME_COPY.description, '/');
    else {
      const c = copyFor(route.id, route.variant, typeof route.opts?.pack === 'string' ? route.opts.pack : undefined);
      // shared-settings links (?o=…) duplicate the main page: keep them out of the index
      if (c) applyHead(fullTitle(c.title), c.description, route.path, new URLSearchParams(location.search).has('o'));
    }
    trackPage(route.path);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="/" aria-label="PaperKid home">
          <span className="brand-mark" aria-hidden>
            <svg viewBox="0 0 64 64" width="30" height="30">
              <rect x="6" y="4" width="46" height="56" rx="7" fill="#fff" stroke="#ff8a3d" strokeWidth="4" />
              <path d="M16 20h26M16 32h26M16 44h16" stroke="#4f8ff7" strokeWidth="4" strokeLinecap="round" strokeDasharray="1 7" />
              <circle cx="48" cy="48" r="10" fill="#ffc933" />
            </svg>
          </span>
          <span>
            Paper<span className="brand-kid">Kid</span>
          </span>
        </a>
        <div className="topbar-right">
          <label className="paper-select country-select" title="Country: picture words, money, dates and paper size">
            <span className="sr-only">Country</span>
            <select
              value={common.country}
              onChange={(e) => {
                const c = countryOf(e.target.value);
                setCommon({ ...common, country: c.code, paper: c.paper });
              }}
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="paper-select">
            <span>Paper</span>
            <select value={common.paper} onChange={(e) => setCommon({ ...common, paper: e.target.value as CommonOptions['paper'] })}>
              <option value="A4">A4</option>
              <option value="Letter">US Letter</option>
            </select>
          </label>
          <AccountButton />
        </div>
      </header>
      {ws ? (
        <Builder key={url} def={ws} route={route} initial={route.opts} common={common} setCommon={setCommon} />
      ) : (
        <>
          {route.id === null && (
            <div className="not-found" role="alert">
              We couldn’t find that page – here are all our worksheets. <button onClick={() => navigate('/', true)}>Go home</button>
            </div>
          )}
          <Home country={common.country} />
        </>
      )}
      <SiteFooter />
    </div>
  );
}
