import { card, emoji, footer, glyphText, guideLines, header, practiceRow, roundRect, text, FONT_TITLE, INK } from '../lib/draw';
import { measureText } from '../lib/glyphs';
import { capFor, fitRows, SIZE_FIELD, type DrawPage, type WorksheetDef } from './types';

export const NUMBER_WORDS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty',
];

const COUNTERS = ['🍎', '⭐', '🐞', '🍓', '🐟', '🌸', '🚗', '🍪', '🎈', '🐥'];

type NumberOpts = {
  from: number;
  to: number;
  size: 'large' | 'medium' | 'small';
  counting: 'color' | 'pictures' | 'none';
  word: boolean;
};

const theme = { main: '#4f8ff7', soft: '#e1ecff', ink: '#1d4fa8' };

/** Ten frame(s): 2 rows of 5 boxes. `fill` boxes get a picture (or stay empty to color). */
function tenFrame(ctx: CanvasRenderingContext2D, x: number, y: number, box: number, n: number, mode: 'color' | 'pictures', pic: string, color: string) {
  for (let i = 0; i < 10; i++) {
    const bx = x + (i % 5) * box;
    const by = y + Math.floor(i / 5) * box;
    ctx.save();
    roundRect(ctx, bx, by, box, box, 1.2);
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.restore();
    if (mode === 'pictures' && i < n) emoji(ctx, pic, bx + box / 2, by + box / 2 + 0.4, box * 0.62);
  }
}

export const numbers: WorksheetDef<NumberOpts> = {
  id: 'numbers',
  title: 'Number Tracing',
  icon: '🔢',
  blurb: 'Trace numbers 0–20 with ten frames, counting pictures and the number word.',
  grades: 'Pre-K – Grade 1',
  theme,
  defaults: { from: 1, to: 10, size: 'large', counting: 'pictures', word: true },
  fields: [
    { type: 'number', key: 'from', label: 'From', min: 0, max: 20 },
    { type: 'number', key: 'to', label: 'To', min: 0, max: 20 },
    SIZE_FIELD,
    {
      type: 'segmented',
      key: 'counting',
      label: 'Ten frame',
      options: [
        { value: 'pictures', label: 'Count pictures' },
        { value: 'color', label: 'Color boxes' },
        { value: 'none', label: 'Off' },
      ],
    },
    { type: 'toggle', key: 'word', label: 'Trace the number word' },
  ],
  fileName: (o) => `PaperKid-numbers-${Math.min(o.from, o.to)}-${Math.max(o.from, o.to)}`,
  build(o) {
    const a = Math.max(0, Math.min(20, Math.min(o.from, o.to)));
    const b = Math.max(0, Math.min(20, Math.max(o.from, o.to)));
    const pages: DrawPage[] = [];
    for (let n = a; n <= b; n++) {
      pages.push((ctx, p) => {
        const s = String(n);
        const pic = COUNTERS[n % COUNTERS.length];
        const title = `Let's write ${n}`;
        const sub = o.counting === 'color' ? `Color ${n} box${n === 1 ? '' : 'es'} in the ten frame.` : 'Start at the green dot and follow the arrows.';
        const top = header(ctx, p, theme, title, sub, '🔢');
        const { W, H, margin: m } = p;
        const cw = W - 2 * m;

        const heroH = 56;
        card(ctx, m, top, cw, heroH, theme, p.inkSaver);
        const bigCap = 34;
        const nw = (measureText(s) * bigCap) / 100;
        guideLines(ctx, m + 6, top + 7, nw + 16, bigCap, false);
        glyphText(ctx, s, m + 14, top + 7, bigCap, 'model');

        const rightX = m + nw + 30;
        const rightW = W - m - rightX - 6;
        if (o.counting !== 'none' && n > 0) {
          const frames = n > 10 ? 2 : 1;
          const box = Math.min(8.5, (rightW - (frames - 1) * 6) / (5 * frames));
          const fw = frames * 5 * box + (frames - 1) * 6;
          const fx = rightX + (rightW - fw) / 2;
          for (let f = 0; f < frames; f++) {
            tenFrame(ctx, fx + f * (5 * box + 6), top + 7, box, Math.min(10, n - f * 10), o.counting, pic, p.inkSaver ? '#9aa3b2' : theme.main);
          }
        } else if (o.counting !== 'none') {
          text(ctx, 'Zero means nothing at all!', rightX + rightW / 2, top + 18, 5, { align: 'center', font: FONT_TITLE, color: INK });
        }
        if (o.word) {
          const word = NUMBER_WORDS[n];
          const wcap = Math.min(14, ((rightW - 10) / measureText(word)) * 100);
          const ww = (measureText(word) * wcap) / 100;
          const wx = rightX + (rightW - ww) / 2;
          guideLines(ctx, wx - 4, top + 31, ww + 8, wcap, false);
          glyphText(ctx, word, wx, top + 31, wcap, 'trace');
        }

        const cap = capFor(o.size);
        let y = top + heroH + 8;
        const { rows, pitch } = fitRows(y, H - m - 6, cap, cap * 1.1);
        for (let r = 0; r < rows; r++) {
          const last = r === rows - 1 && rows > 2;
          practiceRow(ctx, s, m, y, cw, cap, { first: r === 0 ? 'solid' : 'trace', traceCount: last ? 1 : undefined, descender: false });
          y += pitch;
        }
        footer(ctx, p, theme, `${n} – ${NUMBER_WORDS[n]}`);
      });
    }
    return pages;
  },
};
