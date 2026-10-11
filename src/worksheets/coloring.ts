import { footer, glyphText, guideLines, header, roundRect, INK } from '../lib/draw';
import { measureText } from '../lib/glyphs';
import type { DrawPage, WorksheetDef } from './types';

/**
 * Line-art pictures in a 200×200 box. Shapes are painted in order: each closed shape is
 * filled white first, so later shapes neatly cover earlier lines (no messy overlaps).
 */
interface Shape {
  d: string;
  open?: boolean; // open path: stroke only
  w?: number; // stroke width multiplier
}

const circ = (cx: number, cy: number, r: number): string =>
  `M${cx - r},${cy} A${r},${r} 0 1,0 ${cx + r},${cy} A${r},${r} 0 1,0 ${cx - r},${cy} Z`;

const ell = (cx: number, cy: number, rx: number, ry: number, deg = 0): string => {
  const t = (deg * Math.PI) / 180;
  const dx = rx * Math.cos(t);
  const dy = rx * Math.sin(t);
  return `M${cx - dx},${cy - dy} A${rx},${ry} ${deg} 1,0 ${cx + dx},${cy + dy} A${rx},${ry} ${deg} 1,0 ${cx - dx},${cy - dy} Z`;
};

/** Mirror an absolute-coordinate path horizontally around x = 100. */
function mirror(d: string): string {
  const tokens = d.match(/[A-Za-z]|-?\d*\.?\d+/g) ?? [];
  let out = '';
  let cmd = '';
  let idx = 0;
  for (const tk of tokens) {
    if (/[A-Za-z]/.test(tk)) {
      cmd = tk;
      idx = 0;
      out += ` ${tk}`;
      continue;
    }
    let v = parseFloat(tk);
    if (cmd === 'A') {
      const k = idx % 7;
      if (k === 2) v = -v;
      else if (k === 4) v = 1 - v;
      else if (k === 5) v = 200 - v;
    } else if (idx % 2 === 0) {
      v = 200 - v;
    }
    out += `${idx === 0 || (cmd === 'A' && idx % 7 === 0) ? ' ' : ','}${v}`;
    idx++;
  }
  return out.trim();
}

const S = (d: string, extra: Partial<Shape> = {}): Shape => ({ d, ...extra });
const O = (d: string, w?: number): Shape => ({ d, open: true, w });

export const PICTURES: Record<string, { label: string; word: string; shapes: Shape[] }> = {
  apple: {
    label: '🍎 Apple',
    word: 'apple',
    shapes: [
      O('M100,62 C100,46 97,34 90,24', 1.2),
      S('M102,50 C112,32 132,26 148,30 C140,48 120,55 102,50 Z'),
      S('M100,62 C70,40 28,52 28,102 C28,152 64,186 86,186 C96,186 95,180 100,180 C105,180 104,186 114,186 C136,186 172,152 172,102 C172,52 130,40 100,62 Z'),
      O('M52,96 C52,82 60,74 70,70'),
    ],
  },
  sun: {
    label: '☀️ Sun',
    word: 'sun',
    shapes: [
      ...Array.from({ length: 12 }, (_, i) => {
        const a = (i * Math.PI) / 6;
        const c = (r: number) => `${100 + r * Math.cos(a)},${100 + r * Math.sin(a)}`;
        const l = (r: number, off: number) => `${100 + r * Math.cos(a + off)},${100 + r * Math.sin(a + off)}`;
        return S(`M${l(50, 0.18)} L${c(88)} L${l(50, -0.18)} Z`);
      }),
      S(circ(100, 100, 52)),
      S(circ(82, 90, 6)),
      S(circ(118, 90, 6)),
      O('M78,114 Q100,134 122,114'),
      S(circ(70, 110, 6)),
      S(circ(130, 110, 6)),
    ],
  },
  house: {
    label: '🏠 House',
    word: 'house',
    shapes: [
      S('M128,70 L128,36 L148,36 L148,82 Z'),
      S('M44,96 L44,182 L156,182 L156,96 Z'),
      S('M28,102 L100,34 L172,102 Z'),
      S('M84,182 L84,132 L116,132 L116,182 Z'),
      S(circ(109, 158, 2.5)),
      S('M54,112 L78,112 L78,136 L54,136 Z'),
      O('M66,112 L66,136 M54,124 L78,124'),
      S('M122,112 L146,112 L146,136 L122,136 Z'),
      O('M134,112 L134,136 M122,124 L146,124'),
      S(circ(100, 74, 10)),
      O('M10,182 L190,182'),
    ],
  },
  fish: {
    label: '🐟 Fish',
    word: 'fish',
    shapes: [
      S('M146,100 L182,66 L174,100 L182,134 Z'),
      S('M92,70 C96,52 116,50 124,70 Z'),
      S('M36,100 C58,58 122,54 152,100 C122,146 58,142 36,100 Z'),
      S(circ(66, 92, 7)),
      S(circ(68, 90, 2)),
      O('M98,84 Q108,100 98,116'),
      O('M114,82 Q124,100 114,118'),
      O('M48,108 Q56,114 64,110'),
      S(circ(30, 60, 6)),
      S(circ(22, 40, 4)),
      S(circ(34, 24, 3)),
    ],
  },
  flower: {
    label: '🌸 Flower',
    word: 'flower',
    shapes: [
      O('M100,100 C100,130 98,160 100,192', 1.2),
      S('M100,152 C82,130 60,132 52,140 C66,162 88,162 100,152 Z'),
      S(mirror('M100,152 C82,130 60,132 52,140 C66,162 88,162 100,152 Z')),
      ...Array.from({ length: 6 }, (_, i) => {
        const deg = i * 60 - 90;
        const t = (deg * Math.PI) / 180;
        return S(ell(100 + 32 * Math.cos(t), 76 + 32 * Math.sin(t), 24, 15, deg));
      }),
      S(circ(100, 76, 18)),
      S(circ(94, 72, 2.5)),
      S(circ(106, 72, 2.5)),
      O('M93,81 Q100,88 107,81'),
    ],
  },
  tree: {
    label: '🌳 Tree',
    word: 'tree',
    shapes: [
      S('M86,190 L90,120 L110,120 L114,190 Z'),
      S(circ(64, 104, 32)),
      S(circ(136, 104, 32)),
      S(circ(100, 70, 46)),
      S(circ(80, 76, 7)),
      S(circ(120, 60, 7)),
      S(circ(124, 100, 7)),
      S(circ(84, 112, 7)),
      O('M10,190 L190,190'),
      O('M30,190 L34,180 L38,190 M160,190 L164,178 L168,190'),
    ],
  },
  balloons: {
    label: '🎈 Balloons',
    word: 'balloons',
    shapes: [
      O('M62,106 C56,140 96,150 100,192'),
      O('M138,106 C144,140 104,150 100,192'),
      O('M100,146 C96,166 104,176 100,192'),
      S(ell(62, 62, 38, 30, 90)),
      S('M58,107 L66,107 L62,99 Z'),
      S(ell(138, 62, 38, 30, 90)),
      S('M134,107 L142,107 L138,99 Z'),
      S(ell(100, 104, 38, 30, 90)),
      S('M96,149 L104,149 L100,141 Z'),
      O('M44,52 C46,42 52,36 58,34'),
      O('M120,52 C122,42 128,36 134,34'),
      O('M82,94 C84,84 90,78 96,76'),
    ],
  },
  car: {
    label: '🚗 Car',
    word: 'car',
    shapes: [
      S('M24,142 L24,116 C24,108 30,104 38,103 L60,101 L80,74 L136,74 L156,101 L170,104 C176,106 178,112 178,118 L178,142 Z'),
      S('M70,101 L86,82 L105,82 L105,101 Z'),
      S('M113,101 L113,82 L132,82 L146,101 Z'),
      S(circ(60, 142, 18)),
      S(circ(60, 142, 7)),
      S(circ(146, 142, 18)),
      S(circ(146, 142, 7)),
      S(circ(170, 118, 4)),
      O('M100,110 L112,110'),
      O('M6,162 L194,162'),
    ],
  },
  rocket: {
    label: '🚀 Rocket',
    word: 'rocket',
    shapes: [
      S('M80,140 C80,164 94,172 100,192 C106,172 120,164 120,140 Z'),
      S('M72,108 L44,152 L74,142 Z'),
      S(mirror('M72,108 L44,152 L74,142 Z')),
      S('M100,18 C132,44 136,90 130,142 L70,142 C64,90 68,44 100,18 Z'),
      O('M78,44 L122,44'),
      S(circ(100, 80, 15)),
      S(circ(100, 80, 9)),
      S(circ(30, 40, 3)),
      S(circ(170, 60, 4)),
      S(circ(160, 160, 3)),
    ],
  },
  icecream: {
    label: '🍦 Ice cream',
    word: 'ice cream',
    shapes: [
      S('M66,104 L100,188 L134,104 Z'),
      O('M78,120 L120,120 M86,140 L114,140 M92,160 L108,160'),
      S(circ(100, 86, 34)),
      S(circ(100, 46, 26)),
      S(circ(100, 16, 8)),
      O('M100,8 C104,0 110,-2 116,0'),
    ],
  },
  butterfly: {
    label: '🦋 Butterfly',
    word: 'butterfly',
    shapes: [
      S('M96,92 C70,30 18,40 28,82 C34,104 70,106 96,100 Z'),
      S(mirror('M96,92 C70,30 18,40 28,82 C34,104 70,106 96,100 Z')),
      S('M96,106 C70,110 44,130 54,156 C70,172 90,148 96,116 Z'),
      S(mirror('M96,106 C70,110 44,130 54,156 C70,172 90,148 96,116 Z')),
      S(circ(58, 74, 10)),
      S(circ(142, 74, 10)),
      S(circ(72, 140, 7)),
      S(circ(128, 140, 7)),
      S(ell(100, 108, 42, 8, 90)),
      O('M97,68 C94,48 84,40 76,36'),
      O('M103,68 C106,48 116,40 124,36'),
      S(circ(75, 35, 4)),
      S(circ(125, 35, 4)),
    ],
  },
  cat: {
    label: '🐱 Cat',
    word: 'cat',
    shapes: [
      S('M54,84 L48,26 L92,62 Z'),
      S(mirror('M54,84 L48,26 L92,62 Z')),
      S(ell(100, 110, 64, 54)),
      S('M60,72 L57,42 L78,60 Z'),
      S(mirror('M60,72 L57,42 L78,60 Z')),
      S(ell(76, 102, 12, 9, 90)),
      S(ell(124, 102, 12, 9, 90)),
      S(ell(78, 104, 5, 3, 90)),
      S(ell(126, 104, 5, 3, 90)),
      S('M93,122 L107,122 L100,130 Z'),
      O('M100,130 Q92,142 82,136 M100,130 Q108,142 118,136'),
      O('M70,124 L36,118 M70,130 L34,132 M130,124 L164,118 M130,130 L166,132'),
    ],
  },
  star: {
    label: '⭐ Star',
    word: 'star',
    shapes: [
      S(
        'M' +
          Array.from({ length: 10 }, (_, i) => {
            const r = i % 2 === 0 ? 88 : 38;
            const a = -Math.PI / 2 + (i * Math.PI) / 5;
            return `${(100 + r * Math.cos(a)).toFixed(1)},${(106 + r * Math.sin(a)).toFixed(1)}`;
          }).join(' L') +
          ' Z',
      ),
      S(circ(86, 100, 5)),
      S(circ(114, 100, 5)),
      O('M88,116 Q100,128 112,116'),
    ],
  },
};

type ColorOpts = {
  pictures: string[];
  word: boolean;
};

const theme = { main: '#ffb020', soft: '#fff1d1', ink: '#8a5a00' };

export const coloring: WorksheetDef<ColorOpts> = {
  id: 'coloring',
  title: 'Coloring Pages',
  icon: '🖍️',
  blurb: 'Big, bold outlines that are easy to color – with a word to trace underneath.',
  grades: 'Toddler – Grade 1',
  theme,
  defaults: { pictures: ['apple', 'sun', 'house', 'fish', 'flower', 'butterfly'], word: true },
  fields: [
    { type: 'chips', key: 'pictures', label: 'Pictures', options: Object.entries(PICTURES).map(([value, v]) => ({ value, label: v.label })) },
    { type: 'toggle', key: 'word', label: 'Word to trace under the picture' },
  ],
  fileName: () => 'PaperKid-coloring',
  build(o) {
    return Object.entries(PICTURES)
      .filter(([k]) => o.pictures.includes(k))
      .map(([, pic]): DrawPage => (ctx, p) => {
        const title = `Color the ${pic.word}`;
        const top = header(ctx, p, theme, title, 'Use your favorite colors. Stay inside the lines!', '🖍️');
        const { W, H, margin: m } = p;
        const wordH = o.word ? 34 : 0;
        const boxH = H - m - 8 - top - wordH;
        const box = Math.min(W - 2 * m, boxH);
        ctx.save();
        roundRect(ctx, m, top, W - 2 * m, boxH, 6);
        ctx.lineWidth = 0.5;
        ctx.strokeStyle = p.inkSaver ? '#d5dae3' : theme.main;
        ctx.setLineDash([2, 2]);
        ctx.stroke();
        ctx.restore();

        const s = (box - 14) / 200;
        ctx.save();
        ctx.translate(W / 2 - 100 * s, top + boxH / 2 - 100 * s);
        ctx.scale(s, s);
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.strokeStyle = INK;
        for (const sh of pic.shapes) {
          const path = new Path2D(sh.d);
          ctx.lineWidth = 2.6 * (sh.w ?? 1);
          if (!sh.open) {
            ctx.fillStyle = '#ffffff';
            ctx.fill(path);
          }
          ctx.stroke(path);
        }
        ctx.restore();

        if (o.word) {
          const cap = 16;
          const label = pic.word;
          const ww = (measureText(label) * cap) / 100;
          const y = H - m - 8 - wordH + 6;
          guideLines(ctx, W / 2 - ww / 2 - 10, y, ww + 20, cap, false);
          glyphText(ctx, label, W / 2 - ww / 2, y, cap, 'trace');
        }
        footer(ctx, p, theme);
      });
  },
};
