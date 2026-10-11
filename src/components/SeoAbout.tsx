import type { PageCopy } from '../seo/content';
import { routeFor } from '../lib/share';
import { WORKSHEETS } from '../worksheets';

/** Visible "about" text + FAQ under the preview: helps parents and search engines alike. */
export function SeoAbout({ copy }: { copy: PageCopy }) {
  const related = WORKSHEETS.filter((w) => w.id !== copy.id).filter((w) => {
    const self = WORKSHEETS.find((x) => x.id === copy.id);
    return self && w.category === self.category;
  });
  return (
    <section className="seo-about" aria-labelledby="about-title">
      <h2 id="about-title">About these worksheets</h2>
      <p>{copy.intro}</p>
      <h3>What's included</h3>
      <ul className="seo-bullets">
        {copy.bullets.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
      <p className="seo-levels">
        <b>Best for:</b> {copy.levels.join(', ')}
      </p>
      <h3>Questions parents ask</h3>
      <div className="faq">
        {copy.faq.map((f) => (
          <details key={f.q}>
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </div>
      {related.length > 0 && (
        <>
          <h3>More worksheets like this</h3>
          <p className="related">
            {related.map((w) => (
              <a key={w.id} href={routeFor(w.id)}>
                {w.icon} {w.title}
              </a>
            ))}
          </p>
        </>
      )}
    </section>
  );
}
