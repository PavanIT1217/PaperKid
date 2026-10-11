import { footer, glyphText, guideLines, header, text, FONT_TITLE, INK } from '../lib/draw';
import { measureText } from '../lib/glyphs';
import { PICTURES } from './coloring';
import type { DrawPage, WorksheetDef } from './types';

/** Dot-to-dot figures in the same 200×200 box as the coloring pictures. */
const FIGURES: Record<string, { label: string; word: string; outline: string; details: string[] }> = {
  star: {
    label: '⭐ Star',
    word: 'star',
    outline: PICTURES.star.shapes[0].d,
    details: PICTURES.star.shapes.slice(1).map((s) => s.d),
  },
  heart: {
    label: '❤️ Heart',
    word: 'heart',
    outline: 'M100,62 C100,30 40,20 28,68 C22,108 68,140 100,178 C132,140 178,108 172,68 C160,20 100,30 100,62 Z',
    details: [],
  },
  apple: {
    label: '🍎 Apple',
    word: 'apple',
    outline: PICTURES.apple.shapes[2].d,
    details: [PICTURES.apple.shapes[0].d, PICTURES.apple.shapes[1].d],
  },
  fish: {
    label: '🐟 Fish',
    word: 'fish',
    outline: 'M36,100 C58,58 122,54 152,100 L182,66 L174,100 L182,134 L152,100 C122,146 58,142 36,100 Z',
    details: ['M59,92 A7,7 0 1,0 73,92 A7,7 0 1,0 59,92 Z'],
  },
  house: {
    label: '🏠 House',
    word: 'house',
    outline: 'M44,182 L44,100 L28,100 L100,34 L172,100 L156,100 L156,182 Z',
    details: ['M84,182 L84,132 L116,132 L116,182', 'M54,112 L78,112 L78,136 L54,136 Z', 'M122,112 L146,112 L146,136 L122,136 Z'],
  },
  rocket: {
    label: '🚀 Rocket',
    word: 'rocket',
    outline: 'M100,18 C132,44 136,90 130,110 L156,152 L128,142 L72,142 L44,152 L70,110 C64,90 68,44 100,18 Z',
    details: ['M85,80 A15,15 0 1,0 115,80 A15,15 0 1,0 85,80 Z', 'M82,142 C82,164 94,172 100,190 C106,172 118,164 118,142'],
  },
  car: {
    label: '🚗 Car',
    word: 'car',
    outline: PICTURES.car.shapes[0].d,
    details: [PICTURES.car.shapes[3].d, PICTURES.car.shapes[5].d, PICTURES.car.shapes[1].d, PICTURES.car.shapes[2].d],
  },
};

/** Vertices that should become dots (end points of M/L/C segments). */
function vertices(d: string): [number, number][] {
  const out: [number, number][] = [];
  const re = /([MLCZ])([^MLCZ]*)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(d))) {
    const nums = (m[2].match(/-?\d*\.?\d+/g) ?? []).map(Number);
    const cmd = m[1].toUpperCase();
    if (cmd === 'M' || cmd === 'L') for (let i = 0; i + 1 < nums.length; i += 2) out.push([nums[i], nums[i + 1]]);
    if (cmd === 'C') for (let i = 4; i + 1 < nums.length; i += 6) out.push([nums[i], nums[i + 1]]);
  }
  return out;
}

const dotCache = new Map<string, [number, number][]>();
function dotsFor(d: string, n: number): [number, number][] {
  const key = `${n}|${d}`;
  const hit = dotCache.get(key);
  if (hit) return hit;
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  el.setAttribute('d', d);
  const len = el.getTotalLength();
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const q = el.getPointAtLength((i / n) * len);
    pts.push([q.x, q.y]);
  }
  // snap the nearest dot onto each corner so the shape keeps its points
  const used = new Set<number>();
  for (const v of vertices(d)) {
    let best = -1;
    let bd = Infinity;
    pts.forEach((p, i) => {
      const dd = (p[0] - v[0]) ** 2 + (p[1] - v[1]) ** 2;
      if (!used.has(i) && dd < bd) {
        bd = dd;
        best = i;
      }
    });
    if (best >= 0 && bd < (len / n) ** 2) {
      pts[best] = v;
      used.add(best);
    }
  }
  dotCache.set(key, pts);
  return pts;
}

type DotOpts = {
  figures: string[];
  count: '10' | '20' | '30' | '40';
  labels: 'numbers' | 'letters' | 'by2' | 'by5' | 'by10';
};

const theme = { main: '#3cbf9a', soft: '#d9f6ec', ink: '#177a5c' };

function label(i: number, mode: DotOpts['labels']): string {
  if (mode === 'letters') return String.fromCharCode(65 + i);
  const step = mode === 'by2' ? 2 : mode === 'by5' ? 5 : mode === 'by10' ? 10 : 1;
  return String((i + 1) * step);
}

export const dots: WorksheetDef<DotOpts> = {
  id: 'dots',
  title: 'Dot-to-Dot',
  icon: '✨',
  blurb: 'Join the dots in order – by numbers, letters or skip counting – then color the picture.',
  grades: 'Pre-K – Grade 2',
  category: 'fun',
  theme,
  defaults: { figures: ['star', 'heart', 'apple', 'fish'], count: '20', labels: 'numbers' },
  fields: [
    { type: 'chips', key: 'figures', label: 'Pictures', options: Object.entries(FIGURES).map(([value, f]) => ({ value, label: f.label })) },
    {
      type: 'segmented',
      key: 'count',
      label: 'Number of dots',
      options: ['10', '20', '30', '40'].map((v) => ({ value: v, label: v })),
    },
    {
      type: 'select',
      key: 'labels',
      label: 'Dots are labelled',
      options: [
        { value: 'numbers', label: '1, 2, 3 …' },
        { value: 'letters', label: 'A, B, C … (up to 26 dots)' },
        { value: 'by2', label: 'Count by 2s' },
        { value: 'by5', label: 'Count by 5s' },
        { value: 'by10', label: 'Count by 10s' },
      ],
    },
  ],
  fileName: () => 'PaperKid-dot-to-dot',
  build(o) {
    const n = o.labels === 'letters' ? Math.min(26, Number(o.count)) : Number(o.count);
    return Object.entries(FIGURES)
      .filter(([k]) => o.figures.includes(k))
      .map(([, f]): DrawPage => (ctx, p) => {
        const startLabel = label(0, o.labels);
        const top = header(ctx, p, theme, `Connect the dots`, `Start at ${startLabel} and join the dots in order. Then color it!`, '✨');
        const { W, H, margin: m } = p;
        const area = Math.min(W - 2 * m - 16, H - m - 50 - top);
        const s = area / 200;
        const ox = W / 2 - 100 * s;
        const oy = top + 6;

        // faint details (eyes, windows…) help the picture come alive once joined
        ctx.save();
        ctx.translate(ox, oy);
        ctx.scale(s, s);
        ctx.lineWidth = 1.6;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#9aa3b2';
        for (const d of f.details) ctx.stroke(new Path2D(d));
        ctx.restore();

        const pts = dotsFor(f.outline, n);
        const cx = pts.reduce((a, q) => a + q[0], 0) / pts.length;
        const cy = pts.reduce((a, q) => a + q[1], 0) / pts.length;
        const fs = n > 30 ? 3.2 : 3.8;
        pts.forEach(([x, y], i) => {
          const px = ox + x * s;
          const py = oy + y * s;
          ctx.save();
          ctx.beginPath();
          ctx.arc(px, py, i === 0 ? 1.4 : 1, 0, Math.PI * 2);
          ctx.fillStyle = i === 0 ? '#2fb36f' : INK;
          ctx.fill();
          ctx.restore();
          const ang = Math.atan2(y - cy, x - cx);
          text(ctx, label(i, o.labels), px + Math.cos(ang) * 4, py + Math.sin(ang) * 4 + fs * 0.35, fs, {
            align: 'center',
            font: FONT_TITLE,
            weight: 600,
            color: i === 0 ? '#2fb36f' : INK,
          });
        });

        const cap = 14;
        const ww = (measureText(f.word) * cap) / 100;
        const wy = H - m - 8 - cap * 1.5;
        text(ctx, 'What did you find?', W / 2, wy - 4, 5, { align: 'center', font: FONT_TITLE, weight: 600, color: p.inkSaver ? INK : theme.ink });
        guideLines(ctx, W / 2 - ww / 2 - 10, wy, ww + 20, cap, false);
        glyphText(ctx, f.word, W / 2 - ww / 2, wy, cap, 'trace');
        footer(ctx, p, theme);
      });
  },
};
