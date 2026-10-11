import { card, emoji, footer, glyphText, guideLines, header, practiceRow, text, FONT_TITLE } from '../lib/draw';
import { measureText } from '../lib/glyphs';
import { capFor, fitRows, SIZE_FIELD, type DrawPage, type WorksheetDef } from './types';

export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const LETTER_WORDS: Record<string, [string, string]> = {
  A: ['Apple', '🍎'],
  B: ['Butterfly', '🦋'],
  C: ['Cat', '🐱'],
  D: ['Dog', '🐶'],
  E: ['Elephant', '🐘'],
  F: ['Fish', '🐟'],
  G: ['Grapes', '🍇'],
  H: ['House', '🏠'],
  I: ['Ice cream', '🍦'],
  J: ['Juice', '🧃'],
  K: ['Kite', '🪁'],
  L: ['Lion', '🦁'],
  M: ['Moon', '🌙'],
  N: ['Nose', '👃'],
  O: ['Octopus', '🐙'],
  P: ['Pig', '🐷'],
  Q: ['Queen', '👸'],
  R: ['Rabbit', '🐰'],
  S: ['Sun', '☀️'],
  T: ['Tree', '🌳'],
  U: ['Umbrella', '☂️'],
  V: ['Violin', '🎻'],
  W: ['Whale', '🐳'],
  X: ['Fox', '🦊'],
  Y: ['Yo-yo', '🪀'],
  Z: ['Zebra', '🦓'],
};

type LetterOpts = {
  letters: string[];
  letterCase: 'both' | 'upper' | 'lower';
  size: 'large' | 'medium' | 'small';
  picture: boolean;
};

const theme = { main: '#ff8a3d', soft: '#ffe9d9', ink: '#a34a12' };

export const letters: WorksheetDef<LetterOpts> = {
  id: 'letters',
  title: 'ABC Tracing',
  icon: '✏️',
  blurb: 'One page per letter with stroke-order arrows, dotted letters to trace and a picture word.',
  grades: 'Pre-K – Grade 1',
  theme,
  defaults: { letters: ['A', 'B', 'C'], letterCase: 'both', size: 'large', picture: true },
  fields: [
    {
      type: 'chips',
      key: 'letters',
      label: 'Letters',
      compact: true,
      options: ALPHABET.map((l) => ({ value: l, label: l })),
    },
    {
      type: 'segmented',
      key: 'letterCase',
      label: 'Letter case',
      options: [
        { value: 'both', label: 'Aa' },
        { value: 'upper', label: 'A' },
        { value: 'lower', label: 'a' },
      ],
    },
    SIZE_FIELD,
    { type: 'toggle', key: 'picture', label: 'Picture word (A is for Apple)' },
  ],
  fileName: (o) => `PaperKid-letters-${o.letters.length === 26 ? 'A-Z' : o.letters.join('')}`,
  build(o) {
    const list = ALPHABET.filter((l) => o.letters.includes(l));
    return list.map((L): DrawPage => (ctx, p) => {
      const l = L.toLowerCase();
      const [word, pic] = LETTER_WORDS[L];
      const shown = o.letterCase === 'both' ? `${L} ${l}` : o.letterCase === 'upper' ? L : l;
      const top = header(ctx, p, theme, `Let's write ${shown.replace(' ', ' and ')}`, 'Start at the green dot and follow the arrows.', pic);
      const { W, H, margin: m } = p;
      const cw = W - 2 * m;

      // ---- hero card: big model letters + picture word
      const heroH = 54;
      card(ctx, m, top, cw, heroH, theme, p.inkSaver);
      const bigCap = 28;
      const modelText = o.letterCase === 'both' ? `${L}${l}` : o.letterCase === 'upper' ? L : l;
      const modelW = ((measureText(modelText) + (o.letterCase === 'both' ? 30 : 0)) * bigCap) / 100;
      const gl = Math.max(modelW + 16, 70);
      guideLines(ctx, m + 6, top + 8, gl, bigCap);
      let gx = m + 14;
      if (o.letterCase !== 'lower') gx += glyphText(ctx, L, gx, top + 8, bigCap, 'model') + 12;
      if (o.letterCase !== 'upper') glyphText(ctx, l, gx, top + 8, bigCap, 'model');

      if (o.picture) {
        const px = m + 6 + gl + (cw - gl - 6) / 2;
        emoji(ctx, pic, px, top + 15, 18);
        const label = L === 'X' ? 'x is in fox' : `${L} is for ${word}`;
        text(ctx, label, px, top + 31, 5.5, { font: FONT_TITLE, weight: 600, align: 'center', color: p.inkSaver ? '#2b2d42' : theme.ink });
        const wcap = Math.min(10, ((cw - gl - 16) / measureText(word)) * 100);
        const ww = (measureText(word) * wcap) / 100;
        guideLines(ctx, px - ww / 2 - 3, top + 36, ww + 6, wcap, false);
        glyphText(ctx, word, px - ww / 2, top + 36, wcap, 'trace');
      }

      // ---- practice rows
      const cap = capFor(o.size);
      let y = top + heroH + 8;
      const { rows, pitch } = fitRows(y, H - m - 6, cap);
      const seq: { s: string; mode: 'model' | 'trace' | 'free' }[] = [];
      const forms = o.letterCase === 'both' ? [L, l] : o.letterCase === 'upper' ? [L] : [l];
      const practice = Math.max(forms.length, rows - 1);
      for (let i = 0; i < practice; i++) {
        const f = forms[Math.floor((i * forms.length) / practice)];
        const firstOfForm = i === 0 || forms[Math.floor(((i - 1) * forms.length) / practice)] !== f;
        seq.push({ s: f, mode: firstOfForm ? 'model' : 'trace' });
      }
      if (rows > practice) seq.push({ s: forms[forms.length - 1], mode: 'free' });

      for (const r of seq.slice(0, rows)) {
        if (r.mode === 'free') practiceRow(ctx, r.s, m, y, cw, cap, { first: 'solid', traceCount: 1 });
        else practiceRow(ctx, r.s, m, y, cw, cap, { first: r.mode === 'model' ? 'solid' : 'trace' });
        y += pitch;
      }
      footer(ctx, p, theme, 'Trace the dotted letters, then try on your own!');
    });
  },
};
