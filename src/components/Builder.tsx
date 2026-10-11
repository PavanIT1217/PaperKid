import { useEffect, useMemo, useRef, useState } from 'react';
import { track } from '../lib/analytics';
import { buildPdf, pageInfo, PAPER, printPdf, savePdf, type CommonOptions } from '../lib/render';
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

  const saveSheet = () => {
    const name = window.prompt('Name for this worksheet', def.title);
    if (name === null) return;
    addSaved({ id: def.id, name: name.trim() || def.title, icon: def.icon, opts });
    track('save_sheet', { worksheet: def.id });
    setToast('Saved! Find it under “My saved worksheets” on the home page.');
  };
  const [ref, cssWidth] = usePreviewWidth();

  useEffect(() => save(`ws:${def.id}`, opts), [def.id, opts]);

  const dOpts = useDebounced(opts, 150);
  const dCommon = useDebounced(common, 150);
  const pages = useMemo(() => def.build(dOpts, PAPER[dCommon.paper]), [def, dOpts, dCommon.paper]);
  const infos = useMemo(() => pages.map((_, i) => pageInfo(dCommon, i, pages.length)), [pages, dCommon]);

  const run = async (kind: 'download' | 'print') => {
    if (!pages.length || busy) return;
    setBusy('Preparing…');
    try {
      const fresh = def.build(opts, PAPER[common.paper]);
      const pdf = await buildPdf(fresh, common, (n) => setBusy(`Page ${n} of ${fresh.length}…`));
      track(kind === 'download' ? 'download_pdf' : 'print_pdf', { worksheet: def.id, pages: fresh.length });
      if (kind === 'download') await savePdf(pdf, def.fileName(opts));
      else await printPdf(pdf, def.fileName(opts));
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
