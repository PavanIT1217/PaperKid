import { emoji, footer, header, roundRect, setTraceStyle, type Ctx } from '../lib/draw';
import type { DrawPage, WorksheetDef } from './types';

export const PATTERNS = [
  { value: 'straight', label: 'Straight ―' },
  { value: 'vertical', label: 'Standing |||' },
  { value: 'diagonal', label: 'Slanted ///' },
  { value: 'zigzag', label: 'Zigzag' },
  { value: 'mountains', label: 'Mountains' },
  { value: 'waves', label: 'Waves' },
  { value: 'bumps', label: 'Rainbows ∩∩' },
  { value: 'cups', label: 'Cups ∪∪' },
  { value: 'castle', label: 'Castle' },
  { value: 'loops', label: 'Loops' },
];

const PAIRS: [string, string][] = [
  ['🐝', '🌸'],
  ['🐶', '🦴'],
  ['🐰', '🥕'],
  ['🐭', '🧀'],
  ['🚗', '🏠'],
  ['🐵', '🍌'],
  ['🐱', '🐟'],
  ['🚀', '🌙'],
  ['🐛', '🍃'],
  ['🐿️', '🌰'],
];

/** Draws pattern `name` between x0..x1, vertically centered on cy with half-height a. */
export function patternPath(ctx: Ctx, name: string, x0: number, x1: number, cy: number, a: number): [number, number] {
  const w = x1 - x0;
  let start: [number, number] | null = null;
  const mv = (x: number, y: number) => {
    start ??= [x, y];
    ctx.moveTo(x, y);
  };
  ctx.beginPath();
  const poly = (pts: [number, number][]) => {
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : mv(x, y)));
  };
  const sample = (f: (t: number) => [number, number], steps = 400) => {
    const pts: [number, number][] = [];
    for (let i = 0; i <= steps; i++) pts.push(f(i / steps));
    poly(pts);
  };
  switch (name) {
    case 'straight':
      poly([[x0, cy], [x1, cy]]);
      break;
    case 'vertical': {
      const n = Math.floor(w / (a * 1.1));
      for (let i = 0; i <= n; i++) {
        const x = x0 + (i * w) / n;
        mv(x, cy - a);
        ctx.lineTo(x, cy + a);
      }
      break;
    }
    case 'diagonal': {
      const n = Math.floor(w / (a * 1.2));
      for (let i = 0; i < n; i++) {
        const x = x0 + (i * w) / n;
        mv(x, cy + a);
        ctx.lineTo(x + a * 0.9, cy - a);
      }
      break;
    }
    case 'zigzag':
    case 'mountains': {
      const n = Math.floor(w / (name === 'zigzag' ? a * 1.2 : a * 2.4));
      const pts: [number, number][] = [];
      for (let i = 0; i <= n; i++) pts.push([x0 + (i * w) / n, i % 2 ? cy - a : cy + a]);
      poly(pts);
      break;
    }
    case 'waves': {
      const cycles = Math.max(2, Math.round(w / (a * 4)));
      sample((t) => [x0 + t * w, cy - a * Math.sin(t * cycles * 2 * Math.PI)]);
      break;
    }
    case 'bumps':
    case 'cups': {
      const n = Math.max(3, Math.round(w / (a * 2.2)));
      const r = w / n / 2;
      const dir = name === 'bumps' ? -1 : 1;
      const base = cy - dir * a * 0.5;
      sample((t) => {
        const seg = Math.min(n - 1, Math.floor(t * n));
        const lt = t * n - seg;
        const ang = Math.PI * (1 - lt);
        return [x0 + seg * 2 * r + r + r * Math.cos(ang), base + dir * Math.sin(ang) * Math.min(r, a * 1.5) * 1.0];
      }, 600);
      break;
    }
    case 'castle': {
      const n = Math.floor(w / (a * 1.4));
      const pts: [number, number][] = [[x0, cy + a]];
      for (let i = 0; i < n; i++) {
        const xa = x0 + (i * w) / n;
        const xb = x0 + ((i + 1) * w) / n;
        const y = i % 2 ? cy + a : cy - a;
        pts.push([xa, y], [xb, y]);
      }
      pts.push([x1, cy + a]);
      poly(pts);
      break;
    }
    case 'loops': {
      // prolate cycloid: makes a row of "e"-like loops
      const loops = Math.max(3, Math.round(w / (a * 2)));
      const T = loops * 2 * Math.PI;
      const b = 1.6;
      const span = T + 2 * b;
      sample((t) => {
        const u = t * T;
        const x = u + b * Math.sin(u + Math.PI) + b;
        const y = -b * Math.cos(u + Math.PI);
        return [x0 + (x / span) * w, cy + (y / b) * a];
      }, 1200);
      break;
    }
  }
  ctx.stroke();
  return start ?? [x0, cy];
}

type LineOpts = {
  patterns: string[];
  repeat: number;
};

const theme = { main: '#ff5fa2', soft: '#ffe1ee', ink: '#a3185a' };

export const lines: WorksheetDef<LineOpts> = {
  id: 'lines',
  title: 'Pre-writing Lines',
  icon: '〰️',
  blurb: 'Help the bee reach the flower! Dotted lines, waves, zigzags and loops build pencil control.',
  grades: 'Toddler – K',
  category: 'writing',
  theme,
  defaults: { patterns: PATTERNS.map((p) => p.value), repeat: 1 },
  fields: [
    { type: 'chips', key: 'patterns', label: 'Patterns', options: PATTERNS },
    { type: 'number', key: 'repeat', label: 'Rows of each pattern', min: 1, max: 3 },
  ],
  fileName: () => 'PaperKid-prewriting-lines',
  build(o) {
    const rows: string[] = [];
    for (const pat of PATTERNS) if (o.patterns.includes(pat.value)) for (let i = 0; i < Math.max(1, o.repeat | 0); i++) rows.push(pat.value);
    if (!rows.length) return [];
    const per = 6;
    const pages: DrawPage[] = [];
    for (let i = 0; i < rows.length; i += per) {
      const chunk = rows.slice(i, i + per);
      const pageIdx = i / per;
      pages.push((ctx, p) => {
        const top = header(ctx, p, theme, 'Follow the path', 'Put your pencil on the first picture and trace to the second one.', '✏️');
        const { W, H, margin: m } = p;
        const slot = (H - m - 6 - top) / per;
        chunk.forEach((name, k) => {
          const y = top + k * slot;
          const cy = y + slot / 2 - 1;
          const [from, to] = PAIRS[(pageIdx * per + k) % PAIRS.length];
          ctx.save();
          roundRect(ctx, m, y + 1, W - 2 * m, slot - 4, 5);
          if (!p.inkSaver) {
            ctx.fillStyle = k % 2 ? '#fff8fb' : '#f8fbff';
            ctx.fill();
          }
          ctx.lineWidth = 0.3;
          ctx.strokeStyle = p.inkSaver ? '#d5dae3' : '#f3c4da';
          ctx.stroke();
          ctx.restore();
          const es = Math.min(14, slot * 0.42);
          emoji(ctx, from, m + 4 + es / 2, cy, es);
          emoji(ctx, to, W - m - 4 - es / 2, cy, es);
          ctx.save();
          setTraceStyle(ctx, 1.1);
          ctx.strokeStyle = '#7d8597';
          const [sx, sy] = patternPath(ctx, name, m + 8 + es, W - m - 8 - es, cy, Math.min(slot * 0.28, 10));
          ctx.restore();
          // green start dot
          ctx.save();
          ctx.beginPath();
          ctx.fillStyle = '#2fb36f';
          ctx.arc(sx, sy, 1.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
        footer(ctx, p, theme);
      });
    }
    return pages;
  },
};
