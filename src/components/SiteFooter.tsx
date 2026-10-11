import { PACK_SLUGS, routeFor } from '../lib/share';
import { WORKSHEETS } from '../worksheets';
import { PACKS } from '../worksheets/packs';
import { CATEGORIES } from '../worksheets/types';

const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');
const NUMBERS = Array.from({ length: 21 }, (_, i) => i);

/** Site-wide footer: crawlable links to every worksheet, letter, number and pack page. */
export function SiteFooter() {
  return (
    <footer className="site-nav">
      <div className="site-nav-inner">
        <div className="site-nav-about">
          <a className="brand" href="/">
            Paper<span className="brand-kid">Kid</span>
          </a>
          <p>Free printable worksheets for Pre-K, Kindergarten and Grades 1–3. Make a PDF in seconds – no sign-up needed.</p>
        </div>
        {CATEGORIES.map((cat) => (
          <nav key={cat.id} aria-label={cat.title}>
            <h3>{cat.title}</h3>
            <ul>
              {WORKSHEETS.filter((w) => w.category === cat.id).map((w) => (
                <li key={w.id}>
                  <a href={routeFor(w.id)}>{w.title}</a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
        <nav aria-label="Workbook packs">
          <h3>Workbooks</h3>
          <ul>
            {Object.entries(PACKS).map(([id, pk]) => (
              <li key={id}>
                <a href={`/workbook-packs/${PACK_SLUGS[id]}/`}>{pk.title}</a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="site-nav-inner quick">
        <nav aria-label="Letter tracing by letter">
          <h3>Letter tracing</h3>
          <p className="quick-links">
            {LETTERS.map((l) => (
              <a key={l} href={`/letter-tracing-worksheets/${l}/`} title={`Letter ${l.toUpperCase()} tracing worksheet`}>
                {l.toUpperCase()}
              </a>
            ))}
          </p>
        </nav>
        <nav aria-label="Number tracing by number">
          <h3>Number tracing</h3>
          <p className="quick-links">
            {NUMBERS.map((n) => (
              <a key={n} href={`/number-tracing-worksheets/${n}/`} title={`Number ${n} tracing worksheet`}>
                {n}
              </a>
            ))}
          </p>
        </nav>
      </div>
      <p className="site-nav-copy">© {new Date().getFullYear()} PaperKid · Made with ❤️ for little learners</p>
    </footer>
  );
}
