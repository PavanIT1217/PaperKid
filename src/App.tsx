import { useEffect, useState } from 'react';
import { AccountButton } from './components/AccountButton';
import { Builder } from './components/Builder';
import { Home } from './components/Home';
import { initAnalytics, trackPage } from './lib/analytics';
import { COUNTRIES, countryOf, guessCountry } from './lib/country';
import type { CommonOptions } from './lib/render';
import { parseRoute } from './lib/share';
import { load, save } from './lib/storage';
import { findWorksheet } from './worksheets';

function initialCommon(): CommonOptions {
  const saved = load<Partial<CommonOptions>>('common', {});
  const country = saved.country ?? guessCountry();
  return { paper: countryOf(country).paper, childName: '', showNameLine: true, inkSaver: false, ...saved, country };
}


export function App() {
  const [hash, setHash] = useState(() => location.hash);
  const [common, setCommon] = useState<CommonOptions>(initialCommon);

  useEffect(() => {
    initAnalytics();
    const on = () => {
      setHash(location.hash);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  useEffect(() => save('common', common), [common]);

  const route = parseRoute(hash);
  const ws = findWorksheet(route.id);
  useEffect(() => trackPage(route.id), [route.id]);

  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="#/">
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
      {ws ? <Builder key={hash} def={ws} initial={route.opts} common={common} setCommon={setCommon} /> : <Home country={common.country} />}
    </div>
  );
}
