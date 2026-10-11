import { useEffect, useMemo, useState } from 'react';
import { useAccount } from '../lib/account';
import { PAPER, pageInfo } from '../lib/render';
import { listSaved, removeSaved, type SavedSheet } from '../lib/saved';
import { routeFor } from '../lib/share';
import { WORKSHEETS } from '../worksheets';
import { PACKS } from '../worksheets/packs';
import { CATEGORIES } from '../worksheets/types';
import { PageCanvas } from './PageCanvas';

const INFO = pageInfo({ paper: 'A4', childName: '', showNameLine: true, inkSaver: false }, 0, 1);

export function Home() {
  const { account, version } = useAccount();
  const [saved, setSaved] = useState<SavedSheet[]>([]);
  useEffect(() => {
    let live = true;
    listSaved()
      .then((list) => live && setSaved(list))
      .catch((e) => console.warn('Could not load saved worksheets', e));
    return () => {
      live = false;
    };
  }, [account?.uid, version]);
  const thumbs = useMemo(
    () =>
      WORKSHEETS.map((w) => {
        let page;
        try {
          page = w.build(w.defaults, PAPER.A4)[0];
        } catch {
          page = undefined;
        }
        return { w, page };
      }),
    [],
  );
  const letters = thumbs.find((t) => t.w.id === 'letters');

  return (
    <main className="home">
      <section className="hero">
        <div className="hero-text">
          <h1>
            Practice pages your kids <span className="hl">love</span> to fill in.
          </h1>
          <p>
            Free printable A4 worksheets for Pre-K to Grade 3 – tracing with stroke-order arrows, names and sight words, cursive, Hindi
            & Telugu letters, math, clocks, money, mazes, dot-to-dots and coloring. Ready in seconds, no sign-up.
          </p>
          <div className="hero-cta">
            <a className="btn primary" href="#/daily">
              📅 Today's practice page
            </a>
            <a className="btn" href="#/packs">
              📚 Workbook packs
            </a>
          </div>
        </div>
        <div className="hero-art" aria-hidden>
          <div className="hero-sheet s1" />
          <div className="hero-sheet s2" />
          <div className="hero-sheet s3">{letters?.page && <PageCanvas draw={letters.page} info={INFO} cssWidth={190} />}</div>
        </div>
      </section>

      <section className="pack-strip" aria-label="Workbook packs">
        {Object.entries(PACKS).map(([id, pk]) => (
          <a key={id} className="pack-chip" href={routeFor('packs', { pack: id, cover: true, certificate: true })}>
            <span className="pack-icon">{pk.icon}</span>
            <span>
              <b>{pk.title}</b>
              <small>{pk.grades}</small>
            </span>
          </a>
        ))}
      </section>

      {saved.length > 0 && (
        <section className="saved">
          <h2 className="section-title">My saved worksheets</h2>
          <p className="section-blurb">{account ? `Synced to ${account.email || 'your Google account'}.` : 'Saved on this device. Sign in to keep them on all your devices.'}</p>
          <div className="saved-list">
            {saved.map((s) => (
              <div key={s.key} className="saved-item">
                <a href={routeFor(s.id, s.opts)}>
                  <span className="pack-icon">{s.icon}</span> {s.name}
                </a>
                <button aria-label={`Remove ${s.name}`} onClick={async () => {
                    await removeSaved(s.key);
                    setSaved((list) => list.filter((x) => x.key !== s.key));
                  }}>
                  ×
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {CATEGORIES.map((cat) => (
        <section key={cat.id} className="category">
          <h2 className="section-title">{cat.title}</h2>
          <p className="section-blurb">{cat.blurb}</p>
          <div className="cards">
            {thumbs
              .filter(({ w }) => w.category === cat.id)
              .map(({ w, page }) => (
                <a key={w.id} className="card" href={`#/${w.id}`} style={{ ['--accent' as string]: w.theme.main, ['--soft' as string]: w.theme.soft }}>
                  <div className="card-thumb">{page && <PageCanvas draw={page} info={INFO} cssWidth={150} label={`${w.title} example`} />}</div>
                  <div className="card-body">
                    <div className="card-title">
                      <span className="card-icon">{w.icon}</span>
                      {w.title}
                    </div>
                    <div className="card-grades">{w.grades}</div>
                    <p>{w.blurb}</p>
                    <span className="card-cta">Create →</span>
                  </div>
                </a>
              ))}
          </div>
        </section>
      ))}

      <section className="how">
        <div>
          <b>1</b> Choose a worksheet or pack
        </div>
        <div>
          <b>2</b> Pick letters, numbers or words
        </div>
        <div>
          <b>3</b> Download the PDF & print
        </div>
      </section>
      <footer className="site-footer">Made with ❤️ for little learners · PaperKid</footer>
    </main>
  );
}
