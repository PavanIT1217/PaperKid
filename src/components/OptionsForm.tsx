import type { Field } from '../worksheets/types';

interface Props {
  fields: Field[];
  values: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
}

export function OptionsForm({ fields, values, onChange }: Props) {
  const set = (key: string, v: unknown) => onChange({ ...values, [key]: v });

  return (
    <>
      {fields
        .filter((f) => !f.when || f.when(values))
        .map((f) => {
          switch (f.type) {
            case 'select':
              return (
                <label key={f.key} className="field">
                  <span className="field-label">{f.label}</span>
                  <select value={String(values[f.key])} onChange={(e) => set(f.key, e.target.value)}>
                    {f.options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              );
            case 'segmented':
              return (
                <div key={f.key} className="field">
                  <span className="field-label">{f.label}</span>
                  <div className="segmented" role="radiogroup" aria-label={f.label}>
                    {f.options.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        role="radio"
                        aria-checked={values[f.key] === o.value}
                        className={values[f.key] === o.value ? 'on' : ''}
                        onClick={() => set(f.key, o.value)}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            case 'toggle':
              return (
                <label key={f.key} className="field toggle">
                  <input type="checkbox" checked={Boolean(values[f.key])} onChange={(e) => set(f.key, e.target.checked)} />
                  <span className="switch" aria-hidden />
                  <span>
                    {f.label}
                    {f.hint && <small className="field-hint">{f.hint}</small>}
                  </span>
                </label>
              );
            case 'date':
              return (
                <label key={f.key} className="field">
                  <span className="field-label">{f.label}</span>
                  <input type="date" value={String(values[f.key] ?? '')} onChange={(e) => set(f.key, e.target.value)} />
                  {f.hint && <small className="field-hint">{f.hint}</small>}
                </label>
              );
            case 'number': {
              const v = Number(values[f.key]);
              const clamp = (n: number) => Math.max(f.min, Math.min(f.max, n));
              return (
                <div key={f.key} className="field">
                  <span className="field-label">{f.label}</span>
                  <div className="stepper">
                    <button type="button" aria-label={`Less ${f.label}`} onClick={() => set(f.key, clamp(v - 1))}>
                      −
                    </button>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={f.min}
                      max={f.max}
                      value={v}
                      onChange={(e) => set(f.key, clamp(Number(e.target.value) || 0))}
                    />
                    <button type="button" aria-label={`More ${f.label}`} onClick={() => set(f.key, clamp(v + 1))}>
                      +
                    </button>
                  </div>
                </div>
              );
            }
            case 'text':
              return (
                <label key={f.key} className="field">
                  <span className="field-label">{f.label}</span>
                  {f.multiline ? (
                    <textarea rows={5} placeholder={f.placeholder} value={String(values[f.key] ?? '')} onChange={(e) => set(f.key, e.target.value)} />
                  ) : (
                    <input type="text" placeholder={f.placeholder} value={String(values[f.key] ?? '')} onChange={(e) => set(f.key, e.target.value)} />
                  )}
                </label>
              );
            case 'chips': {
              const sel = (values[f.key] as string[]) ?? [];
              const toggle = (v: string) => set(f.key, sel.includes(v) ? sel.filter((x) => x !== v) : [...sel, v]);
              return (
                <div key={f.key} className="field">
                  <div className="field-row">
                    <span className="field-label">
                      {f.label} <small>({sel.length})</small>
                    </span>
                    <span className="mini-links">
                      <button type="button" onClick={() => set(f.key, f.options.map((o) => o.value))}>
                        All
                      </button>
                      <button type="button" onClick={() => set(f.key, [])}>
                        None
                      </button>
                    </span>
                  </div>
                  <div className={`chips ${f.compact ? 'compact' : ''}`}>
                    {f.options.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        aria-pressed={sel.includes(o.value)}
                        className={sel.includes(o.value) ? 'on' : ''}
                        onClick={() => toggle(o.value)}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            }
            case 'reroll':
              return (
                <button key={f.key} type="button" className="btn ghost" onClick={() => set(f.key, Math.floor(Math.random() * 1e9))}>
                  🎲 {f.label}
                </button>
              );
          }
        })}
    </>
  );
}
