import { footer, guideLines, header, practiceRow, roundRect, text, FONT_BODY, FONT_TITLE, INK } from '../lib/draw';
import { measureText } from '../lib/glyphs';
import { drawPicture, PICTURES } from './coloring';
import type { DrawPage, WorksheetDef } from './types';

export const SENTENCES: { pic: string; sentence: string; color?: [string, string] }[] = [
  { pic: 'apple', sentence: 'I see a red apple.', color: ['red', '#e5484d'] },
  { pic: 'sun', sentence: 'The sun is hot.', color: ['yellow', '#ffc933'] },
  { pic: 'cat', sentence: 'The cat can jump.', color: ['orange', '#ff8a3d'] },
  { pic: 'fish', sentence: 'A fish can swim.', color: ['blue', '#4f8ff7'] },
  { pic: 'house', sentence: 'This is my house.' },
  { pic: 'tree', sentence: 'The tree is big.', color: ['green', '#2fb36f'] },
  { pic: 'car', sentence: 'The car can go.', color: ['blue', '#4f8ff7'] },
  { pic: 'flower', sentence: 'I like the flower.', color: ['pink', '#ff5fa2'] },
  { pic: 'balloons', sentence: 'I have three balloons.' },
  { pic: 'rocket', sentence: 'The rocket goes up.' },
  { pic: 'icecream', sentence: 'I like ice cream.', color: ['pink', '#ff5fa2'] },
  { pic: 'butterfly', sentence: 'Look at the butterfly.', color: ['purple', '#b062e8'] },
  { pic: 'star', sentence: 'I see a little star.', color: ['yellow', '#ffc933'] },
];

type ReadOpts = {
  sentences: string[];
  write: boolean;
};

const theme = { main: '#e0457b', soft: '#fde3ec', ink: '#9c1f4c' };

export const reading: WorksheetDef<ReadOpts> = {
  id: 'reading',
  title: 'I Can Read!',
  icon: '📖',
  blurb: 'Read a short sight-word sentence, color the picture, then trace and write the sentence.',
  grades: 'K – Grade 1',
  category: 'reading',
  theme,
  defaults: { sentences: SENTENCES.slice(0, 6).map((s) => s.pic), write: true },
  fields: [
    { type: 'chips', key: 'sentences', label: 'Sentences', options: SENTENCES.map((s) => ({ value: s.pic, label: s.sentence })) },
    { type: 'toggle', key: 'write', label: 'Empty line to write the sentence' },
  ],
  fileName: () => 'PaperKid-i-can-read',
  build(o) {
    const list = SENTENCES.filter((s) => o.sentences.includes(s.pic));
    const pages: DrawPage[] = [];
    for (let i = 0; i < list.length; i += 2) {
      const chunk = list.slice(i, i + 2);
      pages.push((ctx, p) => {
        const top = header(ctx, p, theme, 'I can read!', 'Read the sentence. Color the picture. Trace and write.', '📖');
        const { W, H, margin: m } = p;
        const cw = W - 2 * m;
        const blockH = (H - m - 6 - top) / 2;
        chunk.forEach((s, k) => {
          const y = top + k * blockH;
          ctx.save();
          roundRect(ctx, m, y, cw, blockH - 5, 5);
          ctx.lineWidth = 0.45;
          ctx.strokeStyle = p.inkSaver ? '#c3c9d6' : theme.main;
          ctx.stroke();
          ctx.restore();

          const pic = PICTURES[s.pic];
          const box = Math.min(56, blockH * 0.46);
          drawPicture(ctx, pic, m + 6 + box / 2, y + 5 + box / 2, box, 1.1);

          // the sentence to read, in clear print
          const tx = m + box + 14;
          const maxW = W - m - 6 - tx;
          let fs = 9;
          ctx.save();
          ctx.font = `700 ${fs}px ${FONT_BODY}`;
          while (ctx.measureText(s.sentence).width > maxW && fs > 5) {
            fs -= 0.5;
            ctx.font = `700 ${fs}px ${FONT_BODY}`;
          }
          ctx.restore();
          text(ctx, 'Read:', tx, y + 14, 4, { font: FONT_TITLE, weight: 600, color: '#8a91a3' });
          text(ctx, s.sentence, tx, y + 14 + fs + 2, fs, { font: FONT_BODY, weight: 700 });
          if (s.color) {
            const cy = y + box - 4;
            text(ctx, `Color the ${pic.word} ${s.color[0]}.`, tx, cy, 5, { font: FONT_TITLE, weight: 500, color: INK });
            ctx.save();
            ctx.beginPath();
            ctx.arc(tx + maxW - 6, cy - 1.8, 4, 0, Math.PI * 2);
            ctx.fillStyle = p.inkSaver ? '#ffffff' : s.color[1];
            ctx.fill();
            ctx.lineWidth = 0.4;
            ctx.strokeStyle = INK;
            ctx.stroke();
            ctx.restore();
          } else {
            text(ctx, `Color the ${pic.word}.`, tx, y + box - 4, 5, { font: FONT_TITLE, weight: 500, color: INK });
          }

          // trace + write rows, full width
          const cap = Math.min(12, ((cw - 10) / (measureText(s.sentence) + 20)) * 100);
          let ry = y + box + 9;
          practiceRow(ctx, s.sentence, m + 3, ry, cw - 6, cap, { first: 'trace', traceCount: 0 });
          ry += cap * 1.5 + 4;
          if (o.write && ry + cap * 1.5 < y + blockH - 4) guideLines(ctx, m + 3, ry, cw - 6, cap);
        });
        footer(ctx, p, theme, 'Read it to a grown-up!');
      });
    }
    return pages;
  },
};
