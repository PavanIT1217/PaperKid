import { emoji, footer, header, line, mulberry32, roundRect, text, FONT_BODY, FONT_TITLE, INK, type Ctx, type PageInfo } from '../lib/draw';
import type { DrawPage, WorksheetDef } from './types';

type Mode = 'bonds' | 'chart' | 'oddeven' | 'skip' | 'missing' | 'compare';

type SenseOpts = {
  mode: Mode;
  range: '10' | '20' | '100' | '1000';
  chartStyle: 'full' | 'missing' | 'blank';
  skipBy: string;
  pages: number;
  answerKey: boolean;
  seed: number;
};

const theme = { main: '#ff8a3d', soft: '#ffe9d9', ink: '#a34a12' };
const RED = '#d13a5a';

const MODE_TEXT: Record<Mode, [string, string, string]> = {
  bonds: ['Number bonds', 'Fill in the missing number. The two parts make the whole!', '🔗'],
  chart: ['100 chart', 'Fill in the missing numbers.', '💯'],
  oddeven: ['Odd and even', 'Color the even numbers blue and the odd numbers red.', '🎨'],
  skip: ['Skip counting', 'Count on and fill in the blanks.', '🦘'],
  missing: ['Before, after, between', 'Write the missing numbers.', '🔢'],
  compare: ['Greater, less or equal?', 'Write >, < or = in each circle. The crocodile eats the bigger number!', '🐊'],
};

function box(ctx: Ctx, x: number, y: number, w: number, h: number, value: string | null, key: boolean) {
  ctx.save();
  roundRect(ctx, x, y, w, h, 1.6);
  ctx.lineWidth = 0.45;
  ctx.strokeStyle = value === null || key ? '#8a91a3' : '#d5dae3';
  ctx.stroke();
  ctx.restore();
}

function bonds(ctx: Ctx, p: PageInfo, top: number, o: SenseOpts, rand: () => number, key: boolean) {
  const { W, H, margin: m } = p;
  const max = o.range === '10' ? 10 : 20;
  const cols = 3;
  const rows = 3;
  const cw = (W - 2 * m) / cols;
  const ch = (H - m - 8 - top) / rows;
  for (let i = 0; i < cols * rows; i++) {
    const whole = 2 + Math.floor(rand() * (max - 1));
    const a = Math.floor(rand() * (whole + 1));
    const vals = [whole, a, whole - a];
    const hide = Math.floor(rand() * 3);
    const cx = m + (i % cols) * cw + cw / 2;
    const y = top + Math.floor(i / cols) * ch;
    const r = Math.min(cw, ch) * 0.16;
    const pts: [number, number][] = [
      [cx, y + r + 4],
      [cx - r * 1.6, y + r * 3.4 + 4],
      [cx + r * 1.6, y + r * 3.4 + 4],
    ];
    ctx.save();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.6;
    line(ctx, pts[0][0], pts[0][1], pts[1][0], pts[1][1]);
    line(ctx, pts[0][0], pts[0][1], pts[2][0], pts[2][1]);
    pts.forEach(([x, yy], k) => {
      ctx.beginPath();
      ctx.arc(x, yy, k === 0 ? r * 1.1 : r, 0, Math.PI * 2);
      ctx.fillStyle = p.inkSaver ? '#fff' : k === 0 ? theme.soft : '#ffffff';
      ctx.fill();
      ctx.stroke();
    });
    ctx.restore();
    pts.forEach(([x, yy], k) => {
      if (k !== hide) text(ctx, String(vals[k]), x, yy + r * 0.38, r * 1.05, { align: 'center', font: FONT_BODY, weight: 700 });
      else if (key) text(ctx, String(vals[k]), x, yy + r * 0.38, r * 1.05, { align: 'center', font: FONT_BODY, weight: 700, color: RED });
    });
  }
}

function chart(ctx: Ctx, p: PageInfo, top: number, o: SenseOpts, rand: () => number, key: boolean) {
  const { W, H, margin: m } = p;
  const size = Math.min(W - 2 * m, H - m - 22 - top);
  const cell = size / 10;
  const x0 = (W - size) / 2;
  const step = Number(o.skipBy) || 0;
  for (let n = 1; n <= 100; n++) {
    const i = n - 1;
    const x = x0 + (i % 10) * cell;
    const y = top + Math.floor(i / 10) * cell;
    const given =
      o.chartStyle === 'full' ? true : o.chartStyle === 'missing' ? rand() > 0.35 : n % 10 === 1 || n <= 10;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, cell, cell);
    if (key && step && n % step === 0) {
      ctx.fillStyle = '#ffe3a3';
      ctx.fill();
    }
    ctx.lineWidth = 0.35;
    ctx.strokeStyle = '#9aa3b2';
    ctx.stroke();
    ctx.restore();
    if (given) text(ctx, String(n), x + cell / 2, y + cell * 0.66, cell * 0.42, { align: 'center', font: FONT_BODY, weight: 700 });
    else if (key) text(ctx, String(n), x + cell / 2, y + cell * 0.66, cell * 0.42, { align: 'center', font: FONT_BODY, weight: 700, color: RED });
  }
  if (step) text(ctx, `Color every number you say when you count by ${step}s.`, W / 2, top + size + 9, 4.6, { align: 'center', font: FONT_TITLE, weight: 500 });
}

function oddeven(ctx: Ctx, p: PageInfo, top: number, o: SenseOpts, rand: () => number, key: boolean) {
  const { W, H, margin: m } = p;
  const max = Number(o.range);
  // legend
  const ly = top + 2;
  [['even', '#4f8ff7'], ['odd', '#e5484d']].forEach(([label, c], k) => {
    const lx = W / 2 - 40 + k * 46;
    ctx.save();
    ctx.beginPath();
    ctx.arc(lx, ly + 3, 3, 0, Math.PI * 2);
    ctx.fillStyle = c;
    ctx.fill();
    ctx.restore();
    text(ctx, label, lx + 5, ly + 4.7, 5, { font: FONT_TITLE, weight: 600 });
  });
  const cols = 5;
  const rows = 6;
  const cw = (W - 2 * m) / cols;
  const ch = (H - m - 8 - top - 12) / rows;
  const r = Math.min(cw, ch) * 0.36;
  for (let i = 0; i < cols * rows; i++) {
    const n = 1 + Math.floor(rand() * max);
    const cx = m + (i % cols) * cw + cw / 2;
    const cy = top + 12 + Math.floor(i / cols) * ch + ch / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    if (key) {
      ctx.fillStyle = n % 2 === 0 ? '#cfe0ff' : '#ffd3d6';
      ctx.fill();
    }
    ctx.lineWidth = 0.6;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.restore();
    text(ctx, String(n), cx, cy + r * 0.3, r * (n >= 100 ? 0.62 : 0.85), { align: 'center', font: FONT_BODY, weight: 700 });
  }
}

function skip(ctx: Ctx, p: PageInfo, top: number, o: SenseOpts, rand: () => number, key: boolean) {
  const { W, H, margin: m } = p;
  const steps = o.skipBy && o.skipBy !== '0' ? [Number(o.skipBy)] : [2, 5, 10, 3, 4];
  const rows = 8;
  const rh = (H - m - 8 - top) / rows;
  for (let r = 0; r < rows; r++) {
    const step = steps[r % steps.length];
    const start = step * Math.floor(rand() * 6);
    const n = 8;
    const y = top + r * rh;
    text(ctx, `Count by ${step}s`, m, y + rh * 0.35, 4.2, { font: FONT_TITLE, weight: 600, color: p.inkSaver ? INK : theme.ink });
    if (r === 0 || steps.length > 1) emoji(ctx, '🦘', W - m - 4, y + rh * 0.3, 5);
    const bw = (W - 2 * m) / n - 3;
    const blanks = new Set<number>();
    while (blanks.size < 3) blanks.add(1 + Math.floor(rand() * (n - 1)));
    for (let k = 0; k < n; k++) {
      const v = start + step * (k + 1);
      const bx = m + k * (bw + 3);
      const by = y + rh * 0.45;
      const blank = blanks.has(k);
      box(ctx, bx, by, bw, rh * 0.42, blank ? null : String(v), key);
      if (!blank || key) text(ctx, String(v), bx + bw / 2, by + rh * 0.3, Math.min(7, rh * 0.28), { align: 'center', font: FONT_BODY, weight: 700, color: blank ? RED : INK });
    }
  }
}

function missing(ctx: Ctx, p: PageInfo, top: number, o: SenseOpts, rand: () => number, key: boolean) {
  const { W, H, margin: m } = p;
  const max = Number(o.range);
  const cols = 2;
  const rows = 9;
  const cw = (W - 2 * m) / cols;
  const rh = (H - m - 8 - top) / rows;
  const kinds = ['before', 'after', 'between'] as const;
  for (let i = 0; i < cols * rows; i++) {
    const kind = kinds[i % 3];
    const n = 2 + Math.floor(rand() * (max - 3));
    const vals = [n - 1, n, n + 1];
    const hide = kind === 'before' ? [0] : kind === 'after' ? [2] : [1];
    const show = kind === 'before' ? [0, 1] : kind === 'after' ? [1, 2] : [0, 1, 2];
    const x0 = m + Math.floor(i / rows) * cw + 4;
    const y = top + (i % rows) * rh + rh * 0.2;
    const bw = 18;
    show.forEach((idx, k) => {
      const bx = x0 + k * (bw + 4);
      const blank = hide.includes(idx);
      box(ctx, bx, y, bw, rh * 0.6, blank ? null : String(vals[idx]), key);
      if (!blank || key) text(ctx, String(vals[idx]), bx + bw / 2, y + rh * 0.43, Math.min(7.5, rh * 0.36), { align: 'center', font: FONT_BODY, weight: 700, color: blank ? RED : INK });
    });
    text(ctx, kind, x0 + 3 * (bw + 4) + 2, y + rh * 0.4, 3.6, { font: FONT_TITLE, color: '#8a91a3' });
  }
}

function compare(ctx: Ctx, p: PageInfo, top: number, o: SenseOpts, rand: () => number, key: boolean) {
  const { W, H, margin: m } = p;
  const max = Number(o.range);
  const cols = 2;
  const rows = 9;
  const cw = (W - 2 * m) / cols;
  const rh = (H - m - 8 - top) / rows;
  const fs = Math.min(9, rh * 0.45);
  for (let i = 0; i < cols * rows; i++) {
    const a = Math.floor(rand() * (max + 1));
    const b = rand() < 0.15 ? a : Math.floor(rand() * (max + 1));
    const cx = m + Math.floor(i / rows) * cw + cw / 2;
    const cy = top + (i % rows) * rh + rh / 2;
    text(ctx, String(a), cx - 10, cy + fs * 0.35, fs, { align: 'right', font: FONT_BODY, weight: 700 });
    text(ctx, String(b), cx + 10, cy + fs * 0.35, fs, { align: 'left', font: FONT_BODY, weight: 700 });
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, fs * 0.6, 0, Math.PI * 2);
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = '#8a91a3';
    ctx.stroke();
    ctx.restore();
    if (key) text(ctx, a > b ? '>' : a < b ? '<' : '=', cx, cy + fs * 0.33, fs * 0.9, { align: 'center', font: FONT_TITLE, weight: 600, color: RED });
  }
}

const DRAW: Record<Mode, (ctx: Ctx, p: PageInfo, top: number, o: SenseOpts, rand: () => number, key: boolean) => void> = {
  bonds,
  chart,
  oddeven,
  skip,
  missing,
  compare,
};

export const numbersense: WorksheetDef<SenseOpts> = {
  id: 'numbersense',
  title: 'Number Sense',
  icon: '💯',
  blurb: 'Number bonds, the 100 chart, odd & even, skip counting, before/after and greater-than.',
  grades: 'K – Grade 2',
  category: 'math',
  theme,
  defaults: { mode: 'bonds', range: '10', chartStyle: 'missing', skipBy: '0', pages: 1, answerKey: true, seed: 4 },
  fields: [
    {
      type: 'select',
      key: 'mode',
      label: 'Activity',
      options: [
        { value: 'bonds', label: '🔗 Number bonds' },
        { value: 'chart', label: '💯 100 chart' },
        { value: 'oddeven', label: '🎨 Odd and even' },
        { value: 'skip', label: '🦘 Skip counting' },
        { value: 'missing', label: '🔢 Before, after, between' },
        { value: 'compare', label: '🐊 Greater / less than' },
      ],
    },
    {
      type: 'segmented',
      key: 'range',
      label: 'Numbers up to',
      options: [
        { value: '10', label: '10' },
        { value: '20', label: '20' },
        { value: '100', label: '100' },
        { value: '1000', label: '1000' },
      ],
      when: (o) => ['bonds', 'oddeven', 'missing', 'compare'].includes(o.mode as string),
    },
    {
      type: 'segmented',
      key: 'chartStyle',
      label: 'Chart',
      options: [
        { value: 'full', label: 'Full' },
        { value: 'missing', label: 'Some missing' },
        { value: 'blank', label: 'Mostly empty' },
      ],
      when: (o) => o.mode === 'chart',
    },
    {
      type: 'select',
      key: 'skipBy',
      label: 'Count by',
      options: [
        { value: '0', label: 'Mixed (skip counting) / none (chart)' },
        { value: '2', label: '2s' },
        { value: '3', label: '3s' },
        { value: '5', label: '5s' },
        { value: '10', label: '10s' },
      ],
      when: (o) => o.mode === 'skip' || o.mode === 'chart',
    },
    { type: 'number', key: 'pages', label: 'Pages', min: 1, max: 10 },
    { type: 'toggle', key: 'answerKey', label: 'Add answer key pages' },
    { type: 'reroll', key: 'seed', label: 'New numbers' },
  ],
  fileName: (o) => `PaperKid-number-sense-${o.mode}`,
  build(o) {
    const mode = (DRAW[o.mode] ? o.mode : 'bonds') as Mode;
    const bondsRange = mode === 'bonds' && Number(o.range) > 20 ? { ...o, range: '20' as const } : o;
    const n = Math.max(1, Math.min(10, o.pages | 0));
    const page =
      (i: number, key: boolean): DrawPage =>
      (ctx, p) => {
        const [title, sub, icon] = MODE_TEXT[mode];
        const top = header(ctx, p, theme, key ? `${title} – answers` : title, key ? `Answers for page ${i + 1}` : sub, icon);
        // same seed for a page and its answer key
        DRAW[mode](ctx, p, top + 2, bondsRange, mulberry32(o.seed * 31 + i), key);
        footer(ctx, p, theme, key ? 'Answer key' : undefined);
      };
    const out = Array.from({ length: n }, (_, i) => page(i, false));
    if (o.answerKey && !(mode === 'chart' && o.chartStyle === 'full' && o.skipBy === '0')) out.push(...Array.from({ length: n }, (_, i) => page(i, true)));
    return out;
  },
};
