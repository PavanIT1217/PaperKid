import { useMemo } from 'react';
import { PAPER, pageInfo } from '../lib/render';
import { WORKSHEETS } from '../worksheets';
import { PageCanvas } from './PageCanvas';

export function Home() {
  const thumbs = useMemo(
    () =>
      WORKSHEETS.map((w) => {
        const pages = w.build(w.defaults, PAPER.A4);
        return { w, page: pages[0], info: pageInfo({ paper: 'A4', childName: '', showNameLine: true, inkSaver: false }, 0, 1) };
      }),
    [],
  );

  return (
    <main className="home">
      <section className="hero">
        <div className="hero-text">
          <h1>
            Practice pages your kids <span className="hl">love</span> to fill in.
          </h1>
          <p>
            Make printable A4 worksheets in seconds – trace letters and numbers with stroke-order arrows, write names and sight words,
            practice math, shapes, pre-writing lines and coloring. Free, no sign-up.
          </p>
          <div className="hero-tags">
            <span>✏️ Pre-K</span>
            <span>🎒 Kindergarten</span>
            <span>📘 Grade 1</span>
            <span>📗 Grade 2</span>
            <span>📙 Grade 3</span>
          </div>
        </div>
        <div className="hero-art" aria-hidden>
          <div className="hero-sheet s1" />
          <div className="hero-sheet s2" />
          <div className="hero-sheet s3">
            {thumbs[0] && <PageCanvas draw={thumbs[0].page} info={thumbs[0].info} cssWidth={190} />}
          </div>
        </div>
      </section>

      <h2 className="section-title">Pick a worksheet</h2>
      <section className="cards">
        {thumbs.map(({ w, page, info }) => (
          <a key={w.id} className="card" href={`#/${w.id}`} style={{ ['--accent' as string]: w.theme.main, ['--soft' as string]: w.theme.soft }}>
            <div className="card-thumb">{page && <PageCanvas draw={page} info={info} cssWidth={150} label={`${w.title} example`} />}</div>
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
      </section>

      <section className="how">
        <div>
          <b>1</b> Choose a worksheet
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
