import { footer, guideLines, header } from '../lib/draw';
import { fontRow } from '../lib/fontText';
import { capFor, fitRows, type DrawPage, type WorksheetDef } from './types';

export const CURSIVE = '"Playwrite US Trad", cursive';
const ABC = 'abcdefghijklmnopqrstuvwxyz'.split('');

type CursiveOpts = {
  mode: 'letters' | 'words';
  letters: string[];
  custom: string;
  size: 'medium' | 'small';
};

const theme = { main: '#7a6ff0', soft: '#e8e6ff', ink: '#3f35a8' };

export const cursive: WorksheetDef<CursiveOpts> = {
  id: 'cursive',
  title: 'Cursive Writing',
  icon: '🖋️',
  blurb: 'Joined-up handwriting: trace each cursive letter, then whole words and sentences.',
  grades: 'Grade 2 – Grade 3',
  category: 'writing',
  theme,
  defaults: { mode: 'letters', letters: ['a', 'b', 'c', 'd'], custom: 'cat\nsun\nhappy\nI can write in cursive.', size: 'medium' },
  fields: [
    {
      type: 'segmented',
      key: 'mode',
      label: 'Practice',
      options: [
        { value: 'letters', label: 'Letters' },
        { value: 'words', label: 'Words & sentences' },
      ],
    },
    {
      type: 'chips',
      key: 'letters',
      label: 'Letters',
      compact: true,
      options: ABC.map((l) => ({ value: l, label: l })),
      when: (o) => o.mode === 'letters',
    },
    {
      type: 'text',
      key: 'custom',
      label: 'One word or sentence per line',
      multiline: true,
      when: (o) => o.mode === 'words',
    },
    {
      type: 'segmented',
      key: 'size',
      label: 'Writing size',
      options: [
        { value: 'medium', label: 'Medium (Grade 2)' },
        { value: 'small', label: 'Small (Grade 3)' },
      ],
    },
  ],
  fileName: (o) => `PaperKid-cursive-${o.mode}`,
  build(o, paper) {
    const cap = capFor(o.size) * 1.1;
    const { W, H, margin: m } = paper;
    const cw = W - 2 * m;
    const CONTENT_TOP = m + 38;
    const { rows, pitch } = fitRows(CONTENT_TOP, H - m - 6, cap);

    // every page is a list of rows: [text, rows of it]
    const pages: { text: string; first: boolean; free?: boolean }[][] = [];
    if (o.mode === 'letters') {
      const list = ABC.filter((l) => o.letters.includes(l));
      // 2 letters per page (upper + lower each)
      for (let i = 0; i < list.length; i += 2) {
        const rowsOut: { text: string; first: boolean; free?: boolean }[] = [];
        const forms = list.slice(i, i + 2).flatMap((l) => [l.toUpperCase(), l]);
        const per = Math.max(1, Math.floor(rows / forms.length));
        forms.forEach((f) => {
          for (let r = 0; r < per; r++) rowsOut.push({ text: f, first: r === 0 });
        });
        pages.push(rowsOut);
      }
    } else {
      const words = o.custom
        .split('\n')
        .map((w) => w.trim())
        .filter(Boolean);
      let cur: { text: string; first: boolean; free?: boolean }[] = [];
      for (const w of words) {
        if (cur.length + 3 > rows) {
          pages.push(cur);
          cur = [];
        }
        cur.push({ text: w, first: true }, { text: w, first: false }, { text: w, first: false, free: true });
      }
      if (cur.length) pages.push(cur);
    }

    return pages.map((list): DrawPage => (ctx, p) => {
      let y = header(ctx, p, theme, 'Cursive writing', 'Trace the grey letters, then join them up on your own.', '🖋️');
      for (const r of list) {
        if (r.free) guideLines(ctx, m, y, cw, cap);
        else fontRow(ctx, r.text, m, y, cw, cap, CURSIVE, 'l', { first: r.first ? 'solid' : 'trace', gap: r.text.length > 2 ? cap * 1.2 : cap });
        y += pitch;
      }
      footer(ctx, p, theme);
    });
  },
};
