import { useEffect, useMemo, useRef, useState } from 'react';
import { useAccount } from '../lib/account';
import { track } from '../lib/analytics';
import { getRecord, putRecord } from '../lib/userdata';
import { startWorkbook } from '../lib/workbooks';
import { nextStartLetter, type DailyOpts } from '../worksheets/daily';
import { buildPdf, type CommonOptions, pageInfo, paperFor, printPdf, savePdf } from '../lib/render';
import { addSaved } from '../lib/saved';
import { shareUrl } from '../lib/share';
import { load, save } from '../lib/storage';
import type { WorksheetDef } from '../worksheets/types';
import { OptionsForm } from './OptionsForm';
import { PageCanvas } from './PageCanvas';

interface Props {
  def: WorksheetDef;
  /** options from a shared link, if any */
  initial?: Record<string, unknown> | null;
  common: CommonOptions;
  setCommon: (c: CommonOptions) => void;
}

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function usePreviewWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(360);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const avail = el.clientWidth;
      // one page per row on phones, two side by side on wide screens
      const cols = avail > 900 ? 2 : 1;
      setW(Math.floor(Math.min(560, (avail - (cols - 1) * 24) / cols)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

export function Builder({ def, initial, common, setCommon }: Props) {
  const [opts, setOpts] = useState<Record<string, unknown>>(() => ({ ...def.defaults, ...(initial ?? load(`ws:${def.id}`, {})) }));
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const share = async () => {
    const url = shareUrl(def.id, opts);
    track('share_link', { worksheet: def.id });
    try {
      if (navigator.share && /Android|iPhone|iPad/.test(navigator.userAgent)) {
        await navigator.share({ title: `PaperKid – ${def.title}`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setToast('Link copied! Anyone with it gets these same settings.');
    } catch {
      window.prompt('Copy this link:', url);
    }
  };

  const { account } = useAccount();
  const saveSheet = async () => {
    const name = window.prompt('Name for this worksheet', def.title);
    if (name === null) return;
    try {
      await addSaved({ id: def.id, name: name.trim() || def.title, icon: def.icon, opts });
      track('save_sheet', { worksheet: def.id });
      setToast(
        account
          ? 'Saved to your account! It’s on the home page on every device you sign in on.'
          : 'Saved on this device. Sign in with Google to keep it on all your devices.',
      );
    } catch (e) {
      console.error(e);
      setToast('Sorry, it could not be saved. Please check your connection and try again.');
    }
  };
  const [ref, cssWidth] = usePreviewWidth();

  useEffect(() => save(`ws:${def.id}`, opts), [def.id, opts]);

  // Daily practice: continue the A→Z sequence from where this family stopped (device or account).
  useEffect(() => {
    if (def.id !== 'daily' || initial) return;
    let live = true;
    getRecord('progress', 'daily')
      .then((r) => {
        const next = r?.startLetter;
        if (live && typeof next === 'string' && /^[A-Z]$/.test(next)) {
          setOpts((o) => (o.letterOrder === 'sequence' && o.remember ? { ...o, startLetter: next } : o));
        }
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [def.id, initial, account?.uid]);

  /** Bookkeeping after a successful download/print. */
  const afterOutput = async () => {
    try {
      if (def.id === 'packs') {
        const w = await startWorkbook(String(opts.pack));
        setToast(`“${w.title}” is in My workbooks on the home page – tick off each part as it's done!`);
      }
      const d = opts as DailyOpts;
      if (def.id === 'daily' && d.letterOrder === 'sequence' && d.remember) {
        const next = nextStartLetter(d);
        await putRecord('progress', 'daily', { startLetter: next, updatedAt: Date.now() });
        setOpts((o) => ({ ...o, startLetter: next }));
        setToast(`Next time we'll start with the letter ${next}.`);
      }
    } catch (e) {
      console.warn('Could not save progress', e);
    }
  };

  const dOpts = useDebounced(opts, 150);
  const dCommon = useDebounced(common, 150);
  const pages = useMemo(() => def.build(dOpts, paperFor(dCommon)), [def, dOpts, dCommon.paper, dCommon.country]);
  const infos = useMemo(() => pages.map((_, i) => pageInfo(dCommon, i, pages.length)), [pages, dCommon]);

  const run = async (kind: 'download' | 'print') => {
    if (!pages.length || busy) return;
    setBusy('Preparing…');
    try {
      const fresh = def.build(opts, paperFor(common));
      const pdf = await buildPdf(fresh, common, (n) => setBusy(`Page ${n} of ${fresh.length}…`));
      track(kind === 'download' ? 'download_pdf' : 'print_pdf', { worksheet: def.id, pages: fresh.length });
      if (kind === 'download') await savePdf(pdf, def.fileName(opts));
      else await printPdf(pdf, def.fileName(opts));
      await afterOutput();
    } catch (e) {
      console.error(e);
      alert('Sorry, something went wrong while making the PDF.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <main className="builder" style={{ ['--accent' as string]: def.theme.main, ['--soft' as string]: def.theme.soft }}>
      <aside className="panel">
        <a className="back" href="#/">
          ← All worksheets
        </a>
        <h1>
          <span className="card-icon">{def.icon}</span> {def.title}
        </h1>
        <p className="panel-blurb">{def.blurb}</p>

        <OptionsForm fields={def.fields} values={opts} onChange={setOpts} />
        {def.id === 'packs' && (
          <p className="panel-note">
            📒 Downloading adds this pack to <b>My workbooks</b> so you can tick off each part.{' '}
            {account ? 'Progress is saved to your Google account.' : 'Sign in to keep progress on all your devices.'}
          </p>
        )}

        <details className="more" open>
          <summary>Page settings</summary>
          <label className="field">
            <span className="field-label">Child’s name (printed on the page)</span>
            <input
              type="text"
              placeholder="Optional"
              maxLength={30}
              value={common.childName}
              onChange={(e) => setCommon({ ...common, childName: e.target.value })}
            />
          </label>
          <label className="field toggle">
            <input type="checkbox" checked={common.showNameLine} onChange={(e) => setCommon({ ...common, showNameLine: e.target.checked })} />
            <span className="switch" aria-hidden />
            <span>Name & date line</span>
          </label>
          <label className="field toggle">
            <input type="checkbox" checked={common.inkSaver} onChange={(e) => setCommon({ ...common, inkSaver: e.target.checked })} />
            <span className="switch" aria-hidden />
            <span>Ink saver (less color)</span>
          </label>
        </details>

        <div className="actions">
          <button className="btn primary" disabled={!pages.length || !!busy} onClick={() => run('download')}>
            {busy ?? `⬇ Download PDF`}
          </button>
          <button className="btn" disabled={!pages.length || !!busy} onClick={() => run('print')}>
            🖨 Print
          </button>
        </div>
        <div className="secondary-actions">
          <button className="btn small" onClick={share}>
            🔗 Share link
          </button>
          <button className="btn small" onClick={saveSheet}>
            ♡ Save
          </button>
        </div>
        {toast && (
          <div className="toast" role="status">
            {toast}
          </div>
        )}
        <div className="page-count">
          {pages.length} page{pages.length === 1 ? '' : 's'} · {common.paper === 'A4' ? 'A4 (210 × 297 mm)' : 'US Letter'}
        </div>
      </aside>

      <section className="preview" ref={ref}>
        {pages.length === 0 ? (
          <div className="empty">Choose at least one item on the left to see your pages here. 👈</div>
        ) : (
          <div className="pages">
            {pages.map((draw, i) => (
              <div key={`${i}-${pages.length}`} className="page-wrap">
                <PageCanvas draw={draw} info={infos[i]} cssWidth={cssWidth} label={`Page ${i + 1}`} />
                <div className="page-num">Page {i + 1}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
