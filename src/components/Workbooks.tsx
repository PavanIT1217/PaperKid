import { useEffect, useState } from 'react';
import { useAccount } from '../lib/account';
import { routeFor } from '../lib/share';
import { listWorkbooks, removeWorkbook, saveWorkbook, type Workbook } from '../lib/workbooks';

/** "My workbooks" on the home page: packs being worked through, with a tick per part. */
export function Workbooks() {
  const { account, version } = useAccount();
  const [list, setList] = useState<Workbook[]>([]);

  useEffect(() => {
    let live = true;
    listWorkbooks()
      .then((l) => live && setList(l))
      .catch((e) => console.warn('Could not load workbooks', e));
    return () => {
      live = false;
    };
  }, [account?.uid, version]);

  if (!list.length) return null;

  const update = async (w: Workbook) => {
    setList((l) => l.map((x) => (x.pack === w.pack ? w : x)));
    try {
      await saveWorkbook(w);
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <section className="workbooks">
      <h2 className="section-title">My workbooks</h2>
      <p className="section-blurb">
        {account ? `Progress is saved to ${account.email || 'your Google account'}.` : 'Progress is saved on this device. Sign in to keep it everywhere.'}
      </p>
      <div className="workbook-list">
        {list.map((w) => {
          const done = w.done.filter(Boolean).length;
          const total = w.sections.length;
          const complete = total > 0 && done === total;
          return (
            <article key={w.pack} className={`workbook ${complete ? 'complete' : ''}`}>
              <header>
                <span className="pack-icon">{w.icon}</span>
                <div>
                  <b>{w.title}</b>
                  <small>
                    {done} of {total} parts done
                  </small>
                </div>
              </header>
              <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
                <span style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
              </div>
              <ul>
                {w.sections.map((s, i) => (
                  <li key={i}>
                    <label>
                      <input
                        type="checkbox"
                        checked={w.done[i]}
                        onChange={(e) => update({ ...w, done: w.done.map((d, k) => (k === i ? e.target.checked : d)) })}
                      />
                      <span>
                        {s.icon} {s.title}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
              <div className="workbook-actions">
                {complete ? (
                  <a className="btn primary small" href={routeFor('rewards', { kind: 'certificate', award: w.award })}>
                    🏆 Print certificate
                  </a>
                ) : (
                  <a className="btn small" href={routeFor('packs', { pack: w.pack, cover: true, certificate: true })}>
                    🖨 Print again
                  </a>
                )}
                <button
                  className="btn small ghost-text"
                  onClick={async () => {
                    if (!window.confirm(`Remove “${w.title}” from My workbooks?`)) return;
                    setList((l) => l.filter((x) => x.pack !== w.pack));
                    await removeWorkbook(w.pack).catch(() => undefined);
                  }}
                >
                  Remove
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
