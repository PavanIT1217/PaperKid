import { emoji, footer, header, line, mulberry32, roundRect, text, FONT_BODY, FONT_TITLE, INK, type Ctx, type PageInfo } from '../lib/draw';
import type { DrawPage, WorksheetDef } from './types';

type Op = '+' | '-' | '×' | '÷';
interface Problem {
  a: number;
  b: number;
  op: Op;
  ans: number;
}

type MathOpts = {
  operation: 'add' | 'sub' | 'addsub' | 'mul' | 'div' | 'muldiv' | 'all';
  level: 'within5' | 'within10' | 'within20' | '2digit' | '3digit';
  tables: 'upto5' | 'upto10' | 'upto12';
  layout: 'vertical' | 'horizontal' | 'pictures';
  perPage: number;
  pages: number;
  answerKey: boolean;
  seed: number;
};

const theme = { main: '#b062e8', soft: '#f1e3fc', ink: '#6b2a9c' };
const PICS = ['🍎', '🍓', '🐟', '⭐', '🎈', '🐥', '🍪', '🌸', '🐞', '🚗'];

function maxFor(level: MathOpts['level']): number {
  return { within5: 5, within10: 10, within20: 20, '2digit': 99, '3digit': 999 }[level];
}

function makeProblem(o: MathOpts, rand: () => number): Problem {
  const ri = (lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1));
  const ops: Op[] =
    o.operation === 'add' ? ['+'] :
    o.operation === 'sub' ? ['-'] :
    o.operation === 'addsub' ? ['+', '-'] :
    o.operation === 'mul' ? ['×'] :
    o.operation === 'div' ? ['÷'] :
    o.operation === 'muldiv' ? ['×', '÷'] : ['+', '-', '×', '÷'];
  const picOps = ops.filter((x) => x === '+' || x === '-');
  const pool = o.layout === 'pictures' ? (picOps.length ? picOps : (['+'] as Op[])) : ops;
  const op = pool[ri(0, pool.length - 1)];
  const max = o.layout === 'pictures' ? Math.min(10, maxFor(o.level)) : maxFor(o.level);
  const lo = o.layout === 'pictures' ? 0 : o.level === '2digit' ? 10 : o.level === '3digit' ? 100 : 0;
  const tmax = o.tables === 'upto5' ? 5 : o.tables === 'upto10' ? 10 : 12;
  switch (op) {
    case '+': {
      if (lo) {
        const a = ri(lo, max - lo);
        const b = ri(lo, max - a);
        return { a, b, op, ans: a + b };
      }
      const sum = ri(2, max);
      // zeros are allowed but rare – kids learn more from real sums
      const a = rand() < 0.08 ? 0 : ri(1, sum - 1);
      return { a, b: sum - a, op, ans: sum };
    }
    case '-': {
      const a = ri(Math.max(lo, 2), max);
      const b = lo ? ri(Math.min(lo, a), a) : rand() < 0.08 ? 0 : ri(1, a);
      return { a, b, op, ans: a - b };
    }
    case '×': {
      const a = ri(1, tmax);
      const b = ri(1, tmax);
      return { a, b, op, ans: a * b };
    }
    case '÷': {
      const b = ri(1, tmax);
      const ans = ri(1, tmax);
      return { a: b * ans, b, op, ans };
    }
  }
}

function problems(o: MathOpts): Problem[][] {
  const rand = mulberry32(o.seed);
  const pages: Problem[][] = [];
  const per = perPage(o);
  for (let p = 0; p < Math.max(1, Math.min(20, o.pages | 0)); p++) {
    const list: Problem[] = [];
    const seen = new Set<string>();
    let guard = 0;
    while (list.length < per) {
      const pr = makeProblem(o, rand);
      const key = `${pr.a}${pr.op}${pr.b}`;
      if (seen.has(key) && guard++ < 200) continue;
      seen.add(key);
      list.push(pr);
    }
    pages.push(list);
  }
  return pages;
}

function perPage(o: MathOpts): number {
  if (o.layout === 'pictures') return 6;
  return Math.max(4, Math.min(40, o.perPage | 0));
}

function drawVertical(ctx: Ctx, p: PageInfo, top: number, list: Problem[], key: boolean) {
  const { W, H, margin: m } = p;
  const cols = list.length <= 12 ? 3 : list.length <= 20 ? 4 : 5;
  const rows = Math.ceil(list.length / cols);
  const cw = (W - 2 * m) / cols;
  const ch = (H - m - 8 - top) / rows;
  const digits = Math.max(...list.map((q) => Math.max(String(q.a).length, String(q.b).length, String(q.ans).length)));
  const fs = Math.min(13, ch * 0.24, cw / (digits + 2.4));
  list.forEach((q, i) => {
    const cx = m + (i % cols) * cw;
    const cy = top + Math.floor(i / cols) * ch;
    const right = cx + cw / 2 + (digits * fs * 0.55) / 2 + fs * 0.3;
    text(ctx, `${i + 1}.`, cx + 2, cy + fs * 0.9, 3.4, { color: '#8a91a3', font: FONT_TITLE });
    text(ctx, String(q.a), right, cy + fs * 1.15, fs, { align: 'right', font: FONT_BODY, weight: 400 });
    text(ctx, String(q.b), right, cy + fs * 2.35, fs, { align: 'right', font: FONT_BODY, weight: 400 });
    text(ctx, q.op === '-' ? '−' : q.op, right - (digits + 1) * fs * 0.6, cy + fs * 2.35, fs, { align: 'left', font: FONT_BODY, weight: 400 });
    ctx.save();
    ctx.lineWidth = 0.6;
    ctx.strokeStyle = INK;
    line(ctx, right - (digits + 1.2) * fs * 0.6, cy + fs * 2.75, right + 1, cy + fs * 2.75);
    ctx.restore();
    if (key) text(ctx, String(q.ans), right, cy + fs * 3.9, fs, { align: 'right', color: '#d13a5a', font: FONT_BODY });
  });
}

function drawHorizontal(ctx: Ctx, p: PageInfo, top: number, list: Problem[], key: boolean) {
  const { W, H, margin: m } = p;
  const cols = list.length > 14 ? 2 : 1;
  const rows = Math.ceil(list.length / cols);
  const cw = (W - 2 * m) / cols;
  const ch = (H - m - 8 - top) / rows;
  const fs = Math.min(9, ch * 0.5);
  list.forEach((q, i) => {
    const cx = m + Math.floor(i / rows) * cw;
    const cy = top + (i % rows) * ch + ch * 0.62;
    text(ctx, `${i + 1}.`, cx + 2, cy, 3.6, { color: '#8a91a3', font: FONT_TITLE });
    const s = `${q.a}  ${q.op === '-' ? '−' : q.op}  ${q.b}  =`;
    ctx.save();
    ctx.font = `400 ${fs}px ${FONT_BODY}`;
    const tw = ctx.measureText(s).width;
    ctx.restore();
    text(ctx, s, cx + 11, cy, fs, { font: FONT_BODY, weight: 400 });
    const bx = cx + 13 + tw;
    const bw = Math.min(cw - (bx - cx) - 6, fs * 3.4);
    ctx.save();
    roundRect(ctx, bx, cy - fs * 0.95, bw, fs * 1.3, 1.5);
    ctx.lineWidth = 0.4;
    ctx.strokeStyle = '#b8bfcc';
    ctx.stroke();
    ctx.restore();
    if (key) text(ctx, String(q.ans), bx + bw / 2, cy, fs, { align: 'center', color: '#d13a5a', font: FONT_BODY });
  });
}

function drawPictures(ctx: Ctx, p: PageInfo, top: number, list: Problem[], key: boolean, seed: number) {
  const { W, H, margin: m } = p;
  const rows = list.length;
  const ch = (H - m - 8 - top) / rows;
  const cw = W - 2 * m;
  list.forEach((q, i) => {
    const y = top + i * ch;
    const pic = PICS[(i + seed) % PICS.length];
    ctx.save();
    roundRect(ctx, m, y + 1.5, cw, ch - 3, 4);
    ctx.lineWidth = 0.35;
    ctx.strokeStyle = p.inkSaver ? '#c3c9d6' : theme.main;
    ctx.stroke();
    ctx.restore();
    const cy = y + ch / 2;
    const size = Math.min(8, ch * 0.32);
    const group = (n: number, x0: number, maxW: number, crossed = 0) => {
      const perRow = 5;
      const r = Math.ceil(n / perRow) || 1;
      const step = Math.min(size * 1.15, maxW / perRow);
      for (let k = 0; k < n; k++) {
        const gx = x0 + (k % perRow) * step + step / 2;
        const gy = cy + (Math.floor(k / perRow) - (r - 1) / 2) * size * 1.15;
        emoji(ctx, pic, gx, gy, size);
        if (k >= n - crossed) {
          ctx.save();
          ctx.strokeStyle = '#d13a5a';
          ctx.lineWidth = 0.7;
          line(ctx, gx - size * 0.45, gy + size * 0.45, gx + size * 0.45, gy - size * 0.45);
          ctx.restore();
        }
      }
      return Math.min(n, perRow) * step;
    };
    let x = m + 5;
    if (q.op === '+') {
      x += group(q.a, x, 55) + 4;
      text(ctx, '+', x + 3, cy + 3, 9, { align: 'center', font: FONT_TITLE });
      x += 10;
      x += group(q.b, x, 55) + 4;
    } else {
      x += group(q.a, x, 70, q.b) + 6;
    }
    // equation with blanks
    const ex = W - m - 66;
    const bw = 11;
    const parts = [String(q.a), q.op === '-' ? '−' : '+', String(q.b), '='];
    let px = ex;
    const fs = 8;
    for (const part of parts) {
      if (/\d/.test(part)) {
        ctx.save();
        roundRect(ctx, px, cy - 6, bw, 11, 2);
        ctx.lineWidth = 0.4;
        ctx.strokeStyle = '#b8bfcc';
        ctx.stroke();
        ctx.restore();
        text(ctx, part, px + bw / 2, cy + 3, fs, { align: 'center', color: '#c3c9d6', font: FONT_BODY });
        px += bw + 2;
      } else {
        text(ctx, part, px + 3, cy + 3, fs, { align: 'center', font: FONT_TITLE });
        px += 7;
      }
    }
    ctx.save();
    roundRect(ctx, px, cy - 6, bw + 2, 11, 2);
    ctx.lineWidth = 0.6;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.restore();
    if (key) text(ctx, String(q.ans), px + (bw + 2) / 2, cy + 3, fs, { align: 'center', color: '#d13a5a', font: FONT_BODY });
  });
}

const OP_TITLE: Record<MathOpts['operation'], string> = {
  add: 'Addition',
  sub: 'Subtraction',
  addsub: 'Addition & Subtraction',
  mul: 'Multiplication',
  div: 'Division',
  muldiv: 'Multiplication & Division',
  all: 'Mixed Practice',
};

export const math: WorksheetDef<MathOpts> = {
  id: 'math',
  title: 'Math Practice',
  icon: '➕',
  blurb: 'Picture sums for little ones up to 3-digit and times tables. Fresh problems every time, with answer keys.',
  grades: 'K – Grade 3',
  theme,
  defaults: { operation: 'add', level: 'within10', tables: 'upto10', layout: 'vertical', perPage: 20, pages: 1, answerKey: true, seed: 7 },
  fields: [
    {
      type: 'select',
      key: 'operation',
      label: 'Operation',
      options: Object.entries(OP_TITLE).map(([value, label]) => ({ value, label })),
    },
    {
      type: 'segmented',
      key: 'layout',
      label: 'Style',
      options: [
        { value: 'vertical', label: 'Column' },
        { value: 'horizontal', label: 'In a line' },
        { value: 'pictures', label: 'Pictures' },
      ],
    },
    {
      type: 'select',
      key: 'level',
      label: 'Numbers',
      options: [
        { value: 'within5', label: 'Within 5' },
        { value: 'within10', label: 'Within 10' },
        { value: 'within20', label: 'Within 20' },
        { value: '2digit', label: '2-digit' },
        { value: '3digit', label: '3-digit' },
      ],
      when: (o) => ['add', 'sub', 'addsub', 'all'].includes(o.operation as string),
    },
    {
      type: 'select',
      key: 'tables',
      label: 'Times tables',
      options: [
        { value: 'upto5', label: 'Up to 5 × 5' },
        { value: 'upto10', label: 'Up to 10 × 10' },
        { value: 'upto12', label: 'Up to 12 × 12' },
      ],
      when: (o) => ['mul', 'div', 'muldiv', 'all'].includes(o.operation as string),
    },
    { type: 'number', key: 'perPage', label: 'Problems per page', min: 4, max: 40, when: (o) => o.layout !== 'pictures' },
    { type: 'number', key: 'pages', label: 'Pages', min: 1, max: 20 },
    { type: 'toggle', key: 'answerKey', label: 'Add answer key pages' },
    { type: 'reroll', key: 'seed', label: 'New problems' },
  ],
  fileName: (o) => `PaperKid-math-${o.operation}`,
  build(o) {
    const sets = problems(o);
    const title = o.layout === 'pictures' ? 'Picture Math' : OP_TITLE[o.operation];
    const sub =
      o.layout === 'pictures'
        ? 'Count the pictures and fill in the boxes.'
        : o.operation === 'all' || o.operation.length > 3
          ? 'Look carefully at each sign!'
          : 'Solve each problem. Show your work!';
    const icon = o.layout === 'pictures' ? '🍎' : '➕';
    const page =
      (list: Problem[], key: boolean, idx: number): DrawPage =>
      (ctx, p) => {
        const top = header(ctx, p, theme, key ? `${title} – Answer key` : title, key ? `Answers for page ${idx + 1}` : sub, key ? '✅' : icon);
        const y = top + 2;
        if (o.layout === 'pictures') drawPictures(ctx, p, y, list, key, idx + o.seed);
        else if (o.layout === 'horizontal') drawHorizontal(ctx, p, y, list, key);
        else drawVertical(ctx, p, y, list, key);
        footer(ctx, p, theme, key ? undefined : `Score: ______ / ${list.length}`);
      };
    const out = sets.map((list, i) => page(list, false, i));
    if (o.answerKey) out.push(...sets.map((list, i) => page(list, true, i)));
    return out;
  },
};

