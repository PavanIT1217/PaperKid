import { card, emoji, footer, guideLines, header, mulberry32, practiceRow, roundRect, setTraceStyle, text, FONT_BODY, FONT_TITLE, INK } from '../lib/draw';
import { measureText } from '../lib/glyphs';
import { drawPicture, PICTURES } from './coloring';
import { ALPHABET, LETTER_WORDS } from './letters';
import { patternPath } from './lines';
import { makeProblem, type MathOpts } from './math';
import type { DrawPage, WorksheetDef } from './types';
import { SIGHT_WORDS } from './words';

type Level = 'prek' | 'k' | 'g1' | 'g2' | 'g3';

type DailyOpts = {
  date: string;
  days: number;
  level: Level;
};

const theme = { main: '#2fb36f', soft: '#dcf5e7', ink: '#17734a' };

const MATH_FOR: Record<Level, Partial<MathOpts>> = {
  prek: { operation: 'add', level: 'within5' },
  k: { operation: 'addsub', level: 'within10' },
  g1: { operation: 'addsub', level: 'within20' },
  g2: { operation: 'addsub', level: '2digit' },
  g3: { operation: 'muldiv', tables: 'upto10' },
};
const WORDS_FOR: Record<Level, string> = { prek: 'prek', k: 'k', g1: 'g1', g2: 'g2', g3: 'g3' };
const PATTERN_ORDER = ['waves', 'zigzag', 'bumps', 'loops', 'castle', 'cups', 'mountains'];
const PICS = Object.keys(PICTURES);

function parseDate(s: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export const daily: WorksheetDef<DailyOpts> = {
  id: 'daily',
  title: 'Daily Practice',
  icon: '📅',
  blurb: 'A fresh page every day: letter of the day, quick math, a word or pencil path, and a picture to color.',
  grades: 'Pre-K – Grade 3',
  category: 'packs',
  theme,
  defaults: { date: '', days: 1, level: 'k' },
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
  ],
  fileName: (o) => `PaperKid-daily-${o.date || 'today'}`,
  build(o) {
    const start = parseDate(o.date);
    const n = Math.max(1, Math.min(7, o.days | 0));
    return Array.from({ length: n }, (_, i): DrawPage => {
      const day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const dayNo = Math.floor(Date.UTC(day.getFullYear(), day.getMonth(), day.getDate()) / 86400000);
      const rand = mulberry32(dayNo * 7 + o.level.length);
      return (ctx, p) => {
        const nice = day.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        const top = header(ctx, p, theme, 'Daily Practice', nice, '📅');
        const { W, H, margin: m } = p;
        const cw = W - 2 * m;
        const gap = 5;
        const avail = H - m - 8 - top;
        const h1 = avail * 0.3;
        const h2 = avail * 0.27;
        const h3 = avail - h1 - h2 - gap * 2;

        // 1. letter of the day
        const L = ALPHABET[dayNo % 26];
        const [word, pic] = LETTER_WORDS[L];
        card(ctx, m, top, cw, h1, theme, p.inkSaver);
        text(ctx, '1  Letter of the day', m + 5, top + 7, 4.6, { font: FONT_TITLE, weight: 600, color: p.inkSaver ? INK : theme.ink });
        emoji(ctx, pic, W - m - 12, top + 10, 11);
        text(ctx, `${L} is for ${word}`, W - m - 20, top + 11.5, 4, { align: 'right', font: FONT_TITLE, color: '#5c6378' });
        const cap = Math.min(13, (h1 - 18) / 3.2);
        const pitch = (h1 - 12) / 2;
        practiceRow(ctx, L, m + 4, top + 12, cw - 8, cap, { first: 'model', hintFirst: true, traceCount: 5 });
        practiceRow(ctx, L.toLowerCase(), m + 4, top + 12 + pitch, cw - 8, cap, { first: 'model', hintFirst: true, traceCount: 6 });

        // 2. math
        const y2 = top + h1 + gap;
        card(ctx, m, y2, cw, h2, theme, p.inkSaver);
        text(ctx, '2  Quick math', m + 5, y2 + 7, 4.6, { font: FONT_TITLE, weight: 600, color: p.inkSaver ? INK : theme.ink });
        const mo = { operation: 'add', level: 'within10', tables: 'upto10', layout: 'horizontal', perPage: 6, pages: 1, answerKey: false, seed: 1, ...MATH_FOR[o.level] } as MathOpts;
        const fs = 8;
        for (let k = 0; k < 6; k++) {
          const q = makeProblem(mo, rand);
          const col = k % 3;
          const row = Math.floor(k / 3);
          const x = m + 6 + col * ((cw - 8) / 3);
          const y = y2 + 13 + row * ((h2 - 14) / 2) + (h2 - 14) / 4;
          const s = `${q.a} ${q.op === '-' ? '−' : q.op} ${q.b} =`;
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
        }

        // 3. left: picture to color; right: path (young) or sight word (older)
        const y3 = y2 + h2 + gap;
        const half = (cw - gap) / 2;
        card(ctx, m, y3, half, h3, theme, p.inkSaver);
        const picKey = PICS[dayNo % PICS.length];
        text(ctx, '3  Color me!', m + 5, y3 + 7, 4.6, { font: FONT_TITLE, weight: 600, color: p.inkSaver ? INK : theme.ink });
        drawPicture(ctx, PICTURES[picKey], m + half / 2, y3 + 10 + (h3 - 14) / 2, Math.min(half - 14, h3 - 16), 1.2);

        const x4 = m + half + gap;
        card(ctx, x4, y3, half, h3, theme, p.inkSaver);
        if (o.level === 'prek' || o.level === 'k') {
          text(ctx, '4  Follow the path', x4 + 5, y3 + 7, 4.6, { font: FONT_TITLE, weight: 600, color: p.inkSaver ? INK : theme.ink });
          const pats = [PATTERN_ORDER[dayNo % PATTERN_ORDER.length], PATTERN_ORDER[(dayNo + 3) % PATTERN_ORDER.length]];
          pats.forEach((pat, k) => {
            const cy = y3 + 14 + ((h3 - 16) / 2) * (k + 0.5);
            emoji(ctx, k ? '🐶' : '🐝', x4 + 7, cy, 7);
            emoji(ctx, k ? '🦴' : '🌸', x4 + half - 7, cy, 7);
            ctx.save();
            setTraceStyle(ctx, 0.9);
            patternPath(ctx, pat, x4 + 13, x4 + half - 13, cy, Math.min(7, (h3 - 16) / 6));
            ctx.restore();
          });
        } else {
          text(ctx, '4  Word of the day', x4 + 5, y3 + 7, 4.6, { font: FONT_TITLE, weight: 600, color: p.inkSaver ? INK : theme.ink });
          const list = SIGHT_WORDS[WORDS_FOR[o.level]].words;
          const w = list[dayNo % list.length];
          const wcap = Math.min(12, ((half - 12) / (measureText(w) * 2 + 40)) * 100);
          const rowsN = 3;
          const rp = (h3 - 16) / rowsN;
          for (let r = 0; r < rowsN; r++) {
            const ry = y3 + 13 + r * rp;
            if (r < 2) practiceRow(ctx, w, x4 + 3, ry, half - 6, wcap, { first: r === 0 ? 'solid' : 'trace', gap: wcap * 0.9 });
            else guideLines(ctx, x4 + 3, ry, half - 6, wcap);
          }
        }
        // how did I do?
        text(ctx, 'How did I do?  😀  🙂  😐', W / 2, H - m - 2.5, 4, { align: 'center', font: FONT_TITLE, color: '#5c6378' });
        footer(ctx, p, theme);
      };
    });
  },
};
