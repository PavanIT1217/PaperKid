import { footer, header, practiceRow } from '../lib/draw';
import { hasGlyph, measureText } from '../lib/glyphs';
import { capFor, rowPitch, SIZE_FIELD, type DrawPage, type WorksheetDef } from './types';

export const SIGHT_WORDS: Record<string, { label: string; words: string[] }> = {
  prek: {
    label: 'Pre-K sight words',
    words: 'a and away big blue can come down find for funny go help here I in is it jump little look make me my not one play red run said see the three to two up we where yellow you'.split(' '),
  },
  k: {
    label: 'Kindergarten sight words',
    words: 'all am are at ate be black brown but came did do eat four get good have he into like must new no now on our out please pretty ran ride saw say she so soon that there they this too under want was well went what white who will with yes'.split(' '),
  },
  g1: {
    label: 'Grade 1 sight words',
    words: 'after again an any as ask by could every fly from give going had has her him his how just know let live may of old once open over put round some stop take thank them then think walk were when'.split(' '),
  },
  g2: {
    label: 'Grade 2 sight words',
    words: "always around because been before best both buy call cold does don't fast first five found gave goes green its made many off or pull read right sing sit sleep tell their these those upon us use very wash which why wish work would write your".split(' '),
  },
  g3: {
    label: 'Grade 3 sight words',
    words: 'about better bring carry clean cut done draw drink eight fall far full got grow hold hot hurt if keep kind laugh light long much myself never only own pick seven shall show six small start ten today together try warm'.split(' '),
  },
};

type WordOpts = {
  source: string;
  custom: string;
  rowsPerWord: number;
  size: 'large' | 'medium' | 'small';
};

const theme = { main: '#2fb36f', soft: '#dcf5e7', ink: '#17734a' };

function wordList(o: WordOpts): string[] {
  if (o.source === 'custom') {
    return o.custom
      .split(/\n/)
      .map((w) => [...w.trim()].filter(hasGlyph).join('').replace(/\s+/g, ' '))
      .filter(Boolean);
  }
  return SIGHT_WORDS[o.source]?.words ?? [];
}

export const words: WorksheetDef<WordOpts> = {
  id: 'words',
  title: 'Words & Names',
  icon: '📝',
  blurb: "Trace your child's name, spelling words or grade-level sight words.",
  grades: 'Pre-K – Grade 3',
  theme,
  defaults: { source: 'custom', custom: 'I can read!\nsun\ncat\nThe dog can run.', rowsPerWord: 2, size: 'medium' },
  fields: [
    {
      type: 'select',
      key: 'source',
      label: 'Words',
      options: [{ value: 'custom', label: 'My own words / name' }, ...Object.entries(SIGHT_WORDS).map(([value, v]) => ({ value, label: v.label }))],
    },
    {
      type: 'text',
      key: 'custom',
      label: 'One word or short sentence per line',
      placeholder: 'Your child’s name\ncat\nI can read!',
      multiline: true,
      when: (o) => o.source === 'custom',
    },
    { type: 'number', key: 'rowsPerWord', label: 'Rows per word', min: 1, max: 4 },
    SIZE_FIELD,
  ],
  fileName: (o) => `PaperKid-words-${o.source}`,
  build(o, paper) {
    const list = wordList(o);
    if (!list.length) return [];
    const baseCap = capFor(o.size);
    const rowsPer = Math.max(1, Math.min(4, o.rowsPerWord | 0));

    const { W, H, margin: m } = paper;
    const cw = W - 2 * m;
    const CONTENT_TOP = m + 38; // header band + name line
    const chunks: { word: string; cap: number }[][] = [[]];
    let used = CONTENT_TOP;
    for (const word of list) {
      // shrink long words so a model + one traced copy fit in a row
      const fit = ((cw - 10) / (measureText(word) * 2 + 60)) * 100;
      const cap = Math.max(6, Math.min(baseCap, fit));
      const need = rowPitch(cap) * rowsPer + 3;
      if (used + need > H - m - 6 && chunks[chunks.length - 1].length) {
        chunks.push([]);
        used = CONTENT_TOP;
      }
      chunks[chunks.length - 1].push({ word, cap });
      used += need;
    }
    const pages: DrawPage[] = chunks.map((chunk) => (ctx, p) => {
      let y = header(ctx, p, theme, 'Trace and write', 'Trace the dotted words, then write them on your own.', '📝');
      for (const { word, cap } of chunk) {
        for (let r = 0; r < rowsPer; r++) {
          const last = r === rowsPer - 1 && rowsPer > 1;
          practiceRow(ctx, word, m, y, cw, cap, {
            first: r === 0 ? 'solid' : 'trace',
            traceCount: last ? 1 : undefined,
            gap: Math.max(cap * 0.9, 6),
          });
          y += rowPitch(cap);
        }
        y += 3;
      }
      footer(ctx, p, theme);
    });
    return pages;
  },
};
