import { card, emoji, footer, guideLines, header, line, mulberry32, practiceRow, roundRect, setTraceStyle, text, FONT_BODY, FONT_TITLE, INK, type Ctx, type PageInfo } from '../lib/draw';
import { measureText } from '../lib/glyphs';
import { drawPicture, PICTURES } from './coloring';
import { ALPHABET, LETTER_WORDS } from './letters';
import { patternPath } from './lines';
import { makeProblem, type MathOpts } from './math';
import type { DrawPage, WorksheetDef } from './types';
import { SIGHT_WORDS } from './words';

type Level = 'prek' | 'k' | 'g1' | 'g2' | 'g3';

export type DailyOpts = {
  date: string;
  days: number;
  level: Level;
  /** 'calendar' = letter follows the date; 'sequence' = A, B, C… from startLetter */
  letterOrder: 'calendar' | 'sequence';
  startLetter: string;
  /** continue the sequence next time (stored on the device / in the account) */
  remember: boolean;
  cover: boolean;
  answerKey: boolean;
};

const theme = { main: '#2fb36f', soft: '#dcf5e7', ink: '#17734a' };

const MATH_FOR: Record<Level, Partial<MathOpts>> = {
  prek: { operation: 'add', level: 'within5' },
  k: { operation: 'addsub', level: 'within10' },
  g1: { operation: 'addsub', level: 'within20' },
  g2: { operation: 'addsub', level: '2digit' },
  g3: { operation: 'muldiv', tables: 'upto10' },
};
const LEVEL_SEED: Record<Level, number> = { prek: 1, k: 2, g1: 3, g2: 4, g3: 5 };
const PATTERN_ORDER = ['waves', 'zigzag', 'bumps', 'loops', 'castle', 'cups', 'mountains'];
const PICS = Object.keys(PICTURES);
const RED = '#d13a5a';

export function parseDate(s: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

interface Day {
  date: Date;
  dayNo: number;
  letter: string;
  problems: { a: number; b: number; op: string; ans: number }[];
  pic: string;
  pats: [string, string];
  word: string;
}

function plan(o: DailyOpts): Day[] {
  const start = parseDate(o.date);
  const n = Math.max(1, Math.min(7, o.days | 0));
  const startIdx = Math.max(0, ALPHABET.indexOf(String(o.startLetter).toUpperCase()));
  const level: Level = o.level in MATH_FOR ? o.level : 'k';
  return Array.from({ length: n }, (_, i) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const dayNo = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
    // same date + level → same page for everyone (teachers can say "do 14 October")
    const rand = mulberry32(dayNo * 7 + LEVEL_SEED[level]);
    const mo = { operation: 'add', level: 'within10', tables: 'upto10', layout: 'horizontal', perPage: 6, pages: 1, answerKey: false, seed: 1, ...MATH_FOR[level] } as MathOpts;
    const list = SIGHT_WORDS[level].words;
    return {
      date,
      dayNo,
      letter: o.letterOrder === 'sequence' ? ALPHABET[(startIdx + i) % 26] : ALPHABET[dayNo % 26],
      problems: uniqueProblems(mo, rand),
      pic: PICS[dayNo % PICS.length],
      pats: [PATTERN_ORDER[dayNo % PATTERN_ORDER.length], PATTERN_ORDER[(dayNo + 3) % PATTERN_ORDER.length]],
      word: list[dayNo % list.length],
    };
  });
}

function uniqueProblems(mo: MathOpts, rand: () => number) {
  const out: ReturnType<typeof makeProblem>[] = [];
  const seen = new Set<string>();
  for (let tries = 0; out.length < 6 && tries < 200; tries++) {
    const q = makeProblem(mo, rand);
    const key = `${q.a}${q.op}${q.b}`;
    if (seen.has(key) && tries < 150) continue;
    seen.add(key);
    out.push(q);
  }
  return out;
}

/** Letter the next printout should start from when "remember" is on. */
export function nextStartLetter(o: DailyOpts): string {
  const startIdx = Math.max(0, ALPHABET.indexOf(String(o.startLetter).toUpperCase()));
  return ALPHABET[(startIdx + Math.max(1, Math.min(7, o.days | 0))) % 26];
}

const longDate = (d: Date) => d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const opSym = (op: string) => (op === '-' ? '−' : op);
const young = (l: Level) => l === 'prek' || l === 'k';

function sectionTitle(ctx: Ctx, p: PageInfo, s: string, x: number, y: number) {
  text(ctx, s, x, y, 4.6, { font: FONT_TITLE, weight: 600, color: p.inkSaver ? INK : theme.ink });
}

function dayPage(d: Day, o: DailyOpts): DrawPage {
  return (ctx, p) => {
    const top = header(ctx, p, theme, 'Daily Practice', longDate(d.date), '📅');
    const { W, H, margin: m } = p;
    const cw = W - 2 * m;
    const gap = 5;
    const avail = H - m - 8 - top;
    const h1 = avail * 0.3;
    const h2 = avail * 0.27;
    const h3 = avail - h1 - h2 - gap * 2;

    // 1. letter of the day
    const L = d.letter;
    const [word, pic] = LETTER_WORDS[L];
    card(ctx, m, top, cw, h1, theme, p.inkSaver);
    sectionTitle(ctx, p, '1  Letter of the day', m + 5, top + 7);
    emoji(ctx, pic, W - m - 12, top + 10, 11);
    text(ctx, L === 'X' ? 'x is in fox' : `${L} is for ${word}`, W - m - 20, top + 11.5, 4, { align: 'right', font: FONT_TITLE, color: '#5c6378' });
    const cap = Math.min(13, (h1 - 18) / 3.2);
    const pitch = (h1 - 12) / 2;
    practiceRow(ctx, L, m + 4, top + 12, cw - 8, cap, { first: 'model', hintFirst: true, traceCount: 5 });
    practiceRow(ctx, L.toLowerCase(), m + 4, top + 12 + pitch, cw - 8, cap, { first: 'model', hintFirst: true, traceCount: 6 });

    // 2. quick math
    const y2 = top + h1 + gap;
    card(ctx, m, y2, cw, h2, theme, p.inkSaver);
    sectionTitle(ctx, p, '2  Quick math', m + 5, y2 + 7);
    const fs = 8;
    d.problems.forEach((q, k) => {
      const x = m + 6 + (k % 3) * ((cw - 8) / 3);
      const y = y2 + 13 + Math.floor(k / 3) * ((h2 - 14) / 2) + (h2 - 14) / 4;
      const s = `${q.a} ${opSym(q.op)} ${q.b} =`;
      text(ctx, s, x, y, fs, { font: FONT_BODY, weight: 700 });
      ctx.save();
      ctx.font = `700 ${fs}px ${FONT_BODY}`;
      const tw = ctx.measureText(s).width;
      ctx.restore();
      ctx.save();
      roundRect(ctx, x + tw + 2, y - fs * 0.9, 14, fs * 1.25, 1.5);
      ctx.lineWidth = 0.4;
      ctx.strokeStyle = '#9aa3b2';
      ctx.stroke();
      ctx.restore();
    });

    // 3. picture to color
    const y3 = y2 + h2 + gap;
    const half = (cw - gap) / 2;
    card(ctx, m, y3, half, h3, theme, p.inkSaver);
    sectionTitle(ctx, p, '3  Color me!', m + 5, y3 + 7);
    drawPicture(ctx, PICTURES[d.pic], m + half / 2, y3 + 10 + (h3 - 14) / 2, Math.min(half - 14, h3 - 16), 1.2);

    // 4. pencil path (young) or word of the day (older)
    const x4 = m + half + gap;
    card(ctx, x4, y3, half, h3, theme, p.inkSaver);
    if (young(o.level)) {
      sectionTitle(ctx, p, '4  Follow the path', x4 + 5, y3 + 7);
      d.pats.forEach((pat, k) => {
        const cy = y3 + 14 + ((h3 - 16) / 2) * (k + 0.5);
        emoji(ctx, k ? '🐶' : '🐝', x4 + 7, cy, 7);
        emoji(ctx, k ? '🦴' : '🌸', x4 + half - 7, cy, 7);
        ctx.save();
        setTraceStyle(ctx, 0.9);
        patternPath(ctx, pat, x4 + 13, x4 + half - 13, cy, Math.min(7, (h3 - 16) / 6));
        ctx.restore();
      });
    } else {
      sectionTitle(ctx, p, '4  Word of the day', x4 + 5, y3 + 7);
      const wcap = Math.min(12, ((half - 12) / (measureText(d.word) * 2 + 40)) * 100);
      const rp = (h3 - 16) / 3;
      for (let r = 0; r < 3; r++) {
        const ry = y3 + 13 + r * rp;
        if (r < 2) practiceRow(ctx, d.word, x4 + 3, ry, half - 6, wcap, { first: r === 0 ? 'solid' : 'trace', gap: wcap * 0.9 });
        else guideLines(ctx, x4 + 3, ry, half - 6, wcap);
      }
    }
    text(ctx, 'How did I do?  😀  🙂  😐', W / 2, H - m - 2.5, 4, { align: 'center', font: FONT_TITLE, color: '#5c6378' });
    footer(ctx, p, theme);
  };
}

/** Week cover: what's coming each day + a star to color for every part. */
function coverPage(days: Day[], o: DailyOpts): DrawPage {
  return (ctx, p) => {
    const first = days[0].date;
    const last = days[days.length - 1].date;
    const range = `${first.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${last.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    const top = header(ctx, p, theme, p.childName ? `${p.childName}'s practice week` : 'My practice week', range, '🗓️');
    const { W, H, margin: m } = p;
    const cols = ['Letter', 'Math', 'Color', young(o.level) ? 'Path' : 'Word'];
    const firstW = 62;
    const cw = (W - 2 * m - firstW) / cols.length;
    const y0 = top + 2;
    cols.forEach((c, i) => {
      const x = m + firstW + i * cw;
      ctx.save();
      roundRect(ctx, x + 1, y0, cw - 2, 10, 2);
      ctx.fillStyle = p.inkSaver ? '#ffffff' : ['#ffe9d9', '#f1e3fc', '#fff1d1', '#dcf5e7'][i];
      ctx.fill();
      ctx.restore();
      text(ctx, c, x + cw / 2, y0 + 7, 4.5, { align: 'center', font: FONT_TITLE, weight: 600 });
    });
    const rh = Math.min(30, (H - m - 46 - y0) / days.length);
    days.forEach((d, r) => {
      const y = y0 + 12 + r * rh;
      ctx.save();
      ctx.strokeStyle = '#e3e7ee';
      ctx.lineWidth = 0.3;
      line(ctx, m, y + rh, W - m, y + rh);
      ctx.restore();
      text(ctx, d.date.toLocaleDateString('en-GB', { weekday: 'long' }), m + 1, y + rh / 2 - 0.5, 5, { font: FONT_TITLE, weight: 600 });
      text(ctx, `${d.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · letter ${d.letter}`, m + 1, y + rh / 2 + 5, 3.8, {
        font: FONT_BODY,
        color: '#5c6378',
      });
      emoji(ctx, LETTER_WORDS[d.letter][1], m + firstW - 8, y + rh / 2, 8);
      cols.forEach((_, i) => {
        const cx = m + firstW + i * cw + cw / 2;
        const cy = y + rh / 2;
        const rr = Math.min(cw, rh) * 0.3;
        ctx.save();
        ctx.beginPath();
        for (let k = 0; k < 10; k++) {
          const rad = k % 2 === 0 ? rr : rr * 0.45;
          const a = -Math.PI / 2 + (k * Math.PI) / 5;
          ctx.lineTo(cx + rad * Math.cos(a), cy + rad * Math.sin(a));
        }
        ctx.closePath();
        ctx.lineWidth = 0.45;
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#b8bfcc';
        ctx.stroke();
        ctx.restore();
      });
    });
    // letters learned this week
    const by = H - m - 30;
    ctx.save();
    roundRect(ctx, m, by, W - 2 * m, 22, 5);
    ctx.fillStyle = p.inkSaver ? '#ffffff' : theme.soft;
    ctx.fill();
    ctx.restore();
    emoji(ctx, '🏆', m + 10, by + 11, 10);
    text(ctx, 'This week I learned:', m + 19, by + 9.5, 4.6, { font: FONT_TITLE, weight: 600 });
    text(ctx, days.map((d) => `${d.letter}${d.letter.toLowerCase()}`).join('   '), m + 19, by + 17.5, 6, { font: FONT_BODY, weight: 700, color: p.inkSaver ? INK : theme.ink });
    footer(ctx, p, theme, 'Color a star when you finish each part!');
  };
}

function answerPage(days: Day[]): DrawPage {
  return (ctx, p) => {
    const top = header(ctx, p, theme, 'Daily Practice – answers', 'Quick math answers for each day', '✅');
    const { W, H, margin: m } = p;
    const rh = Math.min(34, (H - m - 8 - top) / days.length);
    days.forEach((d, r) => {
      const y = top + r * rh;
      text(ctx, longDate(d.date), m, y + 5, 4.4, { font: FONT_TITLE, weight: 600, color: p.inkSaver ? INK : theme.ink });
      d.problems.forEach((q, k) => {
        const x = m + (k % 3) * ((W - 2 * m) / 3);
        const yy = y + 13 + Math.floor(k / 3) * 9;
        const s = `${q.a} ${opSym(q.op)} ${q.b} = `;
        text(ctx, s, x, yy, 6, { font: FONT_BODY, weight: 700 });
        ctx.save();
        ctx.font = `700 6px ${FONT_BODY}`;
        const tw = ctx.measureText(s).width;
        ctx.restore();
        text(ctx, String(q.ans), x + tw, yy, 6, { font: FONT_BODY, weight: 700, color: RED });
      });
      ctx.save();
      ctx.strokeStyle = '#e3e7ee';
      ctx.lineWidth = 0.3;
      line(ctx, m, y + rh - 2, W - m, y + rh - 2);
      ctx.restore();
    });
    footer(ctx, p, theme, 'Answer key');
  };
}

export const daily: WorksheetDef<DailyOpts> = {
  id: 'daily',
  title: 'Daily Practice',
  icon: '📅',
  blurb: 'A fresh page every day: letter of the day, quick math, a word or pencil path, and a picture to color.',
  grades: 'Pre-K – Grade 3',
  category: 'packs',
  theme,
  defaults: { date: '', days: 1, level: 'k', letterOrder: 'sequence', startLetter: 'A', remember: true, cover: true, answerKey: false },
  fields: [
    { type: 'date', key: 'date', label: 'Start date', hint: 'Leave empty for today' },
    { type: 'number', key: 'days', label: 'Days (one page each)', min: 1, max: 7 },
    {
      type: 'select',
      key: 'level',
      label: 'Level',
      options: [
        { value: 'prek', label: 'Pre-K' },
        { value: 'k', label: 'Kindergarten' },
        { value: 'g1', label: 'Grade 1' },
        { value: 'g2', label: 'Grade 2' },
        { value: 'g3', label: 'Grade 3' },
      ],
    },
    {
      type: 'segmented',
      key: 'letterOrder',
      label: 'Letter of the day',
      options: [
        { value: 'sequence', label: 'In order A → Z' },
        { value: 'calendar', label: 'Follows the date' },
      ],
    },
    {
      type: 'select',
      key: 'startLetter',
      label: 'Start from letter',
      options: ALPHABET.map((l) => ({ value: l, label: `${l} ${l.toLowerCase()}` })),
      when: (o) => o.letterOrder === 'sequence',
    },
    {
      type: 'toggle',
      key: 'remember',
      label: 'Remember where we stopped',
      hint: 'After you download, the next printout continues with the next letter. Synced when signed in.',
      when: (o) => o.letterOrder === 'sequence',
    },
    { type: 'toggle', key: 'cover', label: 'Week cover with star chart', when: (o) => Number(o.days) > 1 },
    { type: 'toggle', key: 'answerKey', label: 'Add math answer page' },
  ],
  fileName: (o) => `PaperKid-daily-${o.date || 'today'}${Number(o.days) > 1 ? `-${o.days}days` : ''}`,
  build(o) {
    const days = plan(o);
    const pages = days.map((d) => dayPage(d, o));
    if (o.cover && days.length > 1) pages.unshift(coverPage(days, o));
    if (o.answerKey) pages.push(answerPage(days));
    return pages;
  },
};
