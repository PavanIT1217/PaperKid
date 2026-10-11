import { emoji, footer, header, mulberry32, roundRect, shuffle, text, FONT_TITLE } from '../lib/draw';
import type { DrawPage, WorksheetDef } from './types';

const SETS = [
  ['🍎', '🍌', '🍇', '🍓'],
  ['🐶', '🐱', '🐰', '🐻'],
  ['🔴', '🔵', '🟡', '🟢'],
  ['⭐', '🌙', '☀️', '☁️'],
  ['🚗', '🚌', '🚲', '✈️'],
  ['🌸', '🍀', '🍄', '🌻'],
  ['🟥', '🔺', '🔷', '🟣'],
  ['🐟', '🐢', '🦀', '🐙'],
];

export const PATTERN_TYPES = [
  { value: 'AB', label: 'AB AB' },
  { value: 'AAB', label: 'AAB' },
  { value: 'ABB', label: 'ABB' },
  { value: 'ABC', label: 'ABC' },
  { value: 'AABB', label: 'AABB' },
  { value: 'ABCD', label: 'ABCD' },
];

type PatOpts = {
  types: string[];
  choices: boolean;
  pages: number;
  seed: number;
};

const theme = { main: '#ffb020', soft: '#fff1d1', ink: '#8a5a00' };

export const patterns: WorksheetDef<PatOpts> = {
  id: 'patterns',
  title: 'What Comes Next?',
  icon: '🧩',
  blurb: 'Spot the pattern and finish the row – draw it or circle the right answer.',
  grades: 'Pre-K – Grade 1',
  category: 'fun',
  theme,
  defaults: { types: ['AB', 'AAB', 'ABC', 'AABB'], choices: true, pages: 1, seed: 5 },
  fields: [
    { type: 'chips', key: 'types', label: 'Pattern types', options: PATTERN_TYPES },
    { type: 'toggle', key: 'choices', label: 'Show answers to circle' },
    { type: 'number', key: 'pages', label: 'Pages', min: 1, max: 10 },
    { type: 'reroll', key: 'seed', label: 'New patterns' },
  ],
  fileName: () => 'PaperKid-patterns',
  build(o) {
    const types = PATTERN_TYPES.map((t) => t.value).filter((t) => o.types.includes(t));
    if (!types.length) return [];
    const rand = mulberry32(o.seed);
    const ROWS = 7;
    const pages: { seq: string[]; blanks: number; choices: string[] }[][] = [];
    for (let pg = 0; pg < Math.max(1, Math.min(10, o.pages | 0)); pg++) {
      const rows = [];
      for (let r = 0; r < ROWS; r++) {
        const type = types[(r + pg) % types.length];
        const set = shuffle(SETS[Math.floor(rand() * SETS.length)], rand);
        const unit = [...type].map((ch) => set[ch.charCodeAt(0) - 65]);
        const len = Math.max(8, unit.length * 2 + 2);
        const seq = Array.from({ length: len }, (_, i) => unit[i % unit.length]);
        const blanks = type.length >= 4 ? 3 : 2;
        const answer = seq[len - blanks];
        const distractors = set.filter((e) => e !== answer).slice(0, 2);
        rows.push({ seq, blanks, choices: shuffle([answer, ...distractors], rand) });
      }
      pages.push(rows);
    }
    return pages.map((rows): DrawPage => (ctx, p) => {
      const top = header(
        ctx,
        p,
        theme,
        'What comes next?',
        o.choices ? 'Draw what comes next in the boxes, or circle the answer.' : 'Draw what comes next in the boxes.',
        '🧩',
      );
      const { W, H, margin: m } = p;
      const slot = (H - m - 6 - top) / rows.length;
      rows.forEach((row, r) => {
        const y = top + r * slot;
        const cy = y + slot / 2 - 1.5;
        ctx.save();
        roundRect(ctx, m, y + 1, W - 2 * m, slot - 4, 4);
        ctx.lineWidth = 0.35;
        ctx.strokeStyle = p.inkSaver ? '#d5dae3' : '#ffd98a';
        ctx.stroke();
        ctx.restore();
        const choiceW = o.choices ? 46 : 0;
        const avail = W - 2 * m - 8 - choiceW;
        const step = Math.min(avail / row.seq.length, 17);
        const es = Math.min(step * 0.75, slot * 0.45);
        row.seq.forEach((e, i) => {
          const cx = m + 4 + step * i + step / 2;
          if (i >= row.seq.length - row.blanks) {
            ctx.save();
            roundRect(ctx, cx - step * 0.45, cy - step * 0.45, step * 0.9, step * 0.9, 2);
            ctx.setLineDash([1.2, 1]);
            ctx.lineWidth = 0.4;
            ctx.strokeStyle = '#8a91a3';
            ctx.stroke();
            ctx.restore();
          } else emoji(ctx, e, cx, cy, es);
        });
        if (o.choices) {
          const x0 = W - m - choiceW;
          ctx.save();
          ctx.strokeStyle = '#e2d5c0';
          ctx.lineWidth = 0.3;
          ctx.beginPath();
          ctx.moveTo(x0, y + 5);
          ctx.lineTo(x0, y + slot - 8);
          ctx.stroke();
          ctx.restore();
          row.choices.forEach((e, i) => emoji(ctx, e, x0 + 9 + i * 14, cy, Math.min(10, es)));
        }
        text(ctx, String(r + 1), m + 1.2, y + 5, 3, { font: FONT_TITLE, color: '#b5a68a' });
      });
      footer(ctx, p, theme);
    });
  },
};
