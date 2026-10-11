import { card, footer, header, text, FONT_TITLE } from '../lib/draw';
import { fontMetrics, fontRow, fontText, fontWidth } from '../lib/fontText';
import type { DrawPage, WorksheetDef } from './types';

interface Script {
  name: string;
  family: string;
  ref: string;
  vowels: string[];
  consonants: string[];
  lines: 'handwriting' | 'box';
}

export const SCRIPTS: Record<string, Script> = {
  hindi: {
    name: 'Hindi (हिन्दी)',
    family: '"Noto Sans Devanagari", sans-serif',
    ref: 'क',
    lines: 'box',
    vowels: 'अ आ इ ई उ ऊ ऋ ए ऐ ओ औ अं अः'.split(' '),
    consonants: 'क ख ग घ ङ च छ ज झ ञ ट ठ ड ढ ण त थ द ध न प फ ब भ म य र ल व श ष स ह क्ष त्र ज्ञ'.split(' '),
  },
  telugu: {
    name: 'Telugu (తెలుగు)',
    family: '"Noto Sans Telugu", sans-serif',
    ref: 'క',
    lines: 'box',
    vowels: 'అ ఆ ఇ ఈ ఉ ఊ ఋ ౠ ఎ ఏ ఐ ఒ ఓ ఔ అం అః'.split(' '),
    consonants: 'క ఖ గ ఘ ఙ చ ఛ జ ఝ ఞ ట ఠ డ ఢ ణ త థ ద ధ న ప ఫ బ భ మ య ర ల వ శ ష స హ ళ క్ష ఱ'.split(' '),
  },
};

type ScriptOpts = {
  script: keyof typeof SCRIPTS;
  set: 'vowels' | 'consonants' | 'all';
  layout: 'page' | 'grid';
};

const theme = { main: '#ff8a3d', soft: '#ffe9d9', ink: '#a34a12' };

export const scripts: WorksheetDef<ScriptOpts> = {
  id: 'scripts',
  title: 'Hindi & Telugu Letters',
  icon: '🪔',
  blurb: 'Trace the vowels and consonants of Hindi (Devanagari) and Telugu, one letter at a time.',
  grades: 'Pre-K – Grade 2',
  category: 'writing',
  theme,
  defaults: { script: 'hindi', set: 'vowels', layout: 'grid' },
  fields: [
    {
      type: 'segmented',
      key: 'script',
      label: 'Language',
      options: Object.entries(SCRIPTS).map(([value, s]) => ({ value, label: s.name })),
    },
    {
      type: 'segmented',
      key: 'set',
      label: 'Letters',
      options: [
        { value: 'vowels', label: 'Vowels' },
        { value: 'consonants', label: 'Consonants' },
        { value: 'all', label: 'All' },
      ],
    },
    {
      type: 'segmented',
      key: 'layout',
      label: 'Layout',
      options: [
        { value: 'grid', label: '6 letters per page' },
        { value: 'page', label: '1 big letter per page' },
      ],
    },
  ],
  fileName: (o) => `PaperKid-${o.script}-${o.set}`,
  build(o, paper) {
    const sc = SCRIPTS[o.script] ?? SCRIPTS.hindi;
    const letters = o.set === 'vowels' ? sc.vowels : o.set === 'consonants' ? sc.consonants : [...sc.vowels, ...sc.consonants];
    const per = o.layout === 'page' ? 1 : 6;
    const { W, H, margin: m } = paper;
    const cw = W - 2 * m;
    const pages: DrawPage[] = [];
    for (let i = 0; i < letters.length; i += per) {
      const chunk = letters.slice(i, i + per);
      pages.push((ctx, p) => {
        const top = header(ctx, p, theme, `Let's write ${sc.name.split(' ')[0]}`, 'Trace the grey letters, then write them on your own.', '🪔');
        if (per === 1) {
          const l = chunk[0];
          const heroH = 70;
          card(ctx, m, top, cw, heroH, theme, p.inkSaver);
          const met = fontMetrics(ctx, sc.family, sc.ref);
          const size = 44 / met.asc;
          const lw = fontWidth(ctx, l, sc.family, size);
          fontText(ctx, l, W / 2 - lw / 2, top + 10 + 44, size, sc.family, 'solid');
          const cap = 16;
          let y = top + heroH + 8;
          const pitch = cap + met.desc * (cap / met.asc) + 9;
          let r = 0;
          while (y + pitch < H - m - 6) {
            fontRow(ctx, l, m, y, cw, cap, sc.family, sc.ref, { first: r === 0 ? 'solid' : 'trace', lines: sc.lines, gap: 9 });
            y += pitch;
            r++;
          }
        } else {
          const slot = (H - m - 8 - top) / per;
          const cap = Math.min(15, slot * 0.36);
          chunk.forEach((l, k) => {
            const y = top + k * slot;
            text(ctx, l, m + 2, y + 6, 4.5, { font: sc.family, color: theme.ink });
            text(ctx, `${i + k + 1}`, W - m, y + 5, 3.2, { align: 'right', font: FONT_TITLE, color: '#8a91a3' });
            fontRow(ctx, l, m, y + 9, cw, cap, sc.family, sc.ref, { first: 'solid', lines: sc.lines, gap: 8 });
          });
        }
        footer(ctx, p, theme);
      });
    }
    return pages;
  },
};
