import { emoji, footer, header, mulberry32, roundRect, shuffle, text, FONT_BODY, FONT_TITLE, INK, type Ctx, type PageInfo } from '../lib/draw';
import type { DrawPage, WorksheetDef } from './types';

const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const WORD_BANK: [string, string][] = [
  ['apple', '🍎'], ['ant', '🐜'], ['ball', '⚽'], ['bee', '🐝'], ['bus', '🚌'], ['cat', '🐱'], ['car', '🚗'], ['cake', '🎂'],
  ['dog', '🐶'], ['duck', '🦆'], ['egg', '🥚'], ['elephant', '🐘'], ['fish', '🐟'], ['frog', '🐸'], ['goat', '🐐'], ['grapes', '🍇'],
  ['hat', '🎩'], ['horse', '🐴'], ['ice cream', '🍦'], ['juice', '🧃'], ['kite', '🪁'], ['key', '🔑'], ['lion', '🦁'], ['leaf', '🍃'],
  ['moon', '🌙'], ['monkey', '🐵'], ['nose', '👃'], ['octopus', '🐙'], ['orange', '🍊'], ['pig', '🐷'], ['queen', '👸'], ['rabbit', '🐰'],
  ['rainbow', '🌈'], ['sun', '☀️'], ['snake', '🐍'], ['tree', '🌳'], ['tiger', '🐯'], ['umbrella', '☂️'], ['van', '🚐'], ['violin', '🎻'],
  ['whale', '🐳'], ['watch', '⌚'], ['yo-yo', '🪀'], ['zebra', '🦓'],
];

type PhonOpts = {
  mode: 'missing' | 'match' | 'sounds';
  letterCase: 'upper' | 'lower' | 'mixed';
  pages: number;
  answerKey: boolean;
  seed: number;
};

const theme = { main: '#e0457b', soft: '#fde3ec', ink: '#9c1f4c' };
const RED = '#d13a5a';

const caseOf = (l: string, c: PhonOpts['letterCase'], i = 0) => (c === 'lower' || (c === 'mixed' && i % 2) ? l.toLowerCase() : l);

function missingPage(ctx: Ctx, p: PageInfo, top: number, o: PhonOpts, rand: () => number, key: boolean) {
  const { W, H, margin: m } = p;
  const rows = 9;
  const rh = (H - m - 8 - top) / rows;
  const n = 6;
  const bw = (W - 2 * m - (n - 1) * 4) / n;
  for (let r = 0; r < rows; r++) {
    const start = Math.floor(rand() * (26 - n));
    const blanks = new Set<number>();
    while (blanks.size < 2) blanks.add(Math.floor(rand() * n));
    const lower = o.letterCase === 'lower' || (o.letterCase === 'mixed' && r % 2 === 1);
    for (let k = 0; k < n; k++) {
      const l = ABC[start + k];
      const ch = lower ? l.toLowerCase() : l;
      const x = m + k * (bw + 4);
      const y = top + r * rh + rh * 0.15;
      const blank = blanks.has(k);
      ctx.save();
      roundRect(ctx, x, y, bw, rh * 0.7, 3);
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = blank ? '#8a91a3' : p.inkSaver ? '#d5dae3' : '#f6b5ca';
      if (blank) ctx.setLineDash([1.4, 1]);
      ctx.stroke();
      ctx.restore();
      if (!blank || key) text(ctx, ch, x + bw / 2, y + rh * 0.52, rh * 0.48, { align: 'center', font: FONT_BODY, weight: 700, color: blank ? RED : INK });
    }
  }
}

function matchPage(ctx: Ctx, p: PageInfo, top: number, _o: PhonOpts, rand: () => number, key: boolean) {
  const { W, H, margin: m } = p;
  const n = 8;
  const letters = shuffle(ABC, rand).slice(0, n);
  const right = shuffle(letters, rand);
  const rh = (H - m - 8 - top) / n;
  const lx = m + 30;
  const rx = W - m - 30;
  const fs = Math.min(14, rh * 0.55);
  letters.forEach((l, i) => {
    const y = top + i * rh + rh / 2;
    text(ctx, l, lx - 10, y + fs * 0.35, fs, { align: 'center', font: FONT_BODY, weight: 700 });
    ctx.save();
    ctx.beginPath();
    ctx.arc(lx + 4, y, 1.6, 0, Math.PI * 2);
    ctx.fillStyle = INK;
    ctx.fill();
    ctx.restore();
  });
  right.forEach((l, i) => {
    const y = top + i * rh + rh / 2;
    text(ctx, l.toLowerCase(), rx + 10, y + fs * 0.35, fs, { align: 'center', font: FONT_BODY, weight: 700 });
    ctx.save();
    ctx.beginPath();
    ctx.arc(rx - 4, y, 1.6, 0, Math.PI * 2);
    ctx.fillStyle = INK;
    ctx.fill();
    ctx.restore();
  });
  if (key) {
    ctx.save();
    ctx.strokeStyle = RED;
    ctx.lineWidth = 0.6;
    letters.forEach((l, i) => {
      const j = right.indexOf(l);
      ctx.beginPath();
      ctx.moveTo(lx + 4, top + i * rh + rh / 2);
      ctx.lineTo(rx - 4, top + j * rh + rh / 2);
      ctx.stroke();
    });
    ctx.restore();
  }
}

function soundsPage(ctx: Ctx, p: PageInfo, top: number, o: PhonOpts, rand: () => number, key: boolean) {
  const { W, H, margin: m } = p;
  const cols = 2;
  const rows = 4;
  const cw = (W - 2 * m) / cols;
  const ch = (H - m - 8 - top) / rows;
  const words = shuffle(WORD_BANK, rand).slice(0, cols * rows);
  words.forEach(([word, pic], i) => {
    const x = m + (i % cols) * cw;
    const y = top + Math.floor(i / cols) * ch;
    ctx.save();
    roundRect(ctx, x + 2, y + 2, cw - 4, ch - 4, 5);
    ctx.lineWidth = 0.4;
    ctx.strokeStyle = p.inkSaver ? '#d5dae3' : '#f6b5ca';
    ctx.stroke();
    ctx.restore();
    emoji(ctx, pic, x + cw / 2, y + ch * 0.32, Math.min(26, ch * 0.38));
    const answer = word[0].toUpperCase();
    const others = shuffle(ABC.filter((l) => l !== answer), rand).slice(0, 2);
    const choices = shuffle([answer, ...others], rand);
    const bw = 13;
    choices.forEach((l, k) => {
      const bx = x + cw / 2 + (k - 1) * (bw + 6) - bw / 2;
      const by = y + ch * 0.62;
      if (key && l === answer) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(bx + bw / 2, by + bw / 2, bw * 0.62, 0, Math.PI * 2);
        ctx.strokeStyle = RED;
        ctx.lineWidth = 0.7;
        ctx.stroke();
        ctx.restore();
      }
      text(ctx, caseOf(l, o.letterCase, i), bx + bw / 2, by + bw * 0.78, bw * 0.75, { align: 'center', font: FONT_BODY, weight: 700 });
    });
    if (key) text(ctx, word, x + cw / 2, y + ch - 7, 4, { align: 'center', font: FONT_TITLE, color: '#8a91a3' });
  });
}

const MODES = {
  missing: ['Missing letters', 'Write the letters that are missing.', '🔤', missingPage],
  match: ['Match the letters', 'Draw a line from each big letter to its little letter.', '🔗', matchPage],
  sounds: ['Beginning sounds', 'Say the picture name. Circle the letter it starts with.', '👂', soundsPage],
} as const;

export const phonics: WorksheetDef<PhonOpts> = {
  id: 'phonics',
  title: 'ABC Games',
  icon: '🔤',
  blurb: 'Missing letters, matching big and little letters, and beginning sounds with pictures.',
  grades: 'Pre-K – Grade 1',
  category: 'reading',
  theme,
  defaults: { mode: 'sounds', letterCase: 'upper', pages: 1, answerKey: true, seed: 2 },
  fields: [
    {
      type: 'segmented',
      key: 'mode',
      label: 'Activity',
      options: [
        { value: 'sounds', label: 'Sounds' },
        { value: 'missing', label: 'Missing' },
        { value: 'match', label: 'Match Aa' },
      ],
    },
    {
      type: 'segmented',
      key: 'letterCase',
      label: 'Letters',
      options: [
        { value: 'upper', label: 'ABC' },
        { value: 'lower', label: 'abc' },
        { value: 'mixed', label: 'Mixed' },
      ],
      when: (o) => o.mode !== 'match',
    },
    { type: 'number', key: 'pages', label: 'Pages', min: 1, max: 10 },
    { type: 'toggle', key: 'answerKey', label: 'Add answer key pages' },
    { type: 'reroll', key: 'seed', label: 'Shuffle' },
  ],
  fileName: (o) => `PaperKid-abc-${o.mode}`,
  build(o) {
    const [title, sub, icon, draw] = MODES[o.mode] ?? MODES.sounds;
    const n = Math.max(1, Math.min(10, o.pages | 0));
    const page =
      (i: number, key: boolean): DrawPage =>
      (ctx, p) => {
        const top = header(ctx, p, theme, key ? `${title} – answers` : title, key ? `Answers for page ${i + 1}` : sub, icon);
        draw(ctx, p, top + 2, o, mulberry32(o.seed * 17 + i), key);
        footer(ctx, p, theme, key ? 'Answer key' : undefined);
      };
    const out = Array.from({ length: n }, (_, i) => page(i, false));
    if (o.answerKey) out.push(...Array.from({ length: n }, (_, i) => page(i, true)));
    return out;
  },
};
