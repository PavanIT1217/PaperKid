import { emoji, star, text, FONT_BODY, FONT_TITLE, INK, roundRect } from '../lib/draw';
import { findWorksheet } from './index';
import type { DrawPage, WorksheetDef } from './types';

type Item = [worksheet: string, opts: Record<string, unknown>];

interface Pack {
  title: string;
  icon: string;
  grades: string;
  blurb: string;
  items: Item[];
  award: string;
}

const ALL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const PACKS: Record<string, Pack> = {
  alphabet: {
    title: 'Alphabet A–Z',
    icon: '🔤',
    grades: 'Pre-K – K',
    blurb: 'All 26 letters, upper and lower case, with picture words.',
    items: [['letters', { letters: ALL_LETTERS, letterCase: 'both', size: 'large', picture: true }]],
    award: 'alphabet',
  },
  numbers: {
    title: 'Numbers 0–20',
    icon: '🔢',
    grades: 'Pre-K – Grade 1',
    blurb: 'Trace every number from 0 to 20 with ten frames and number words.',
    items: [['numbers', { from: 0, to: 20, size: 'large', counting: 'pictures', word: true }]],
    award: 'numbers',
  },
  prek: {
    title: 'Pre-K Starter',
    icon: '🧸',
    grades: 'Toddler – Pre-K',
    blurb: 'Pencil-control paths, big shapes, first letters, counting and coloring.',
    items: [
      ['lines', { repeat: 1 }],
      ['shapes', { shapes: ['circle', 'square', 'triangle', 'star'], mode: 'big', name: false }],
      ['letters', { letters: ['A', 'B', 'C'], letterCase: 'upper', size: 'large', fade: true }],
      ['numbers', { from: 1, to: 5, size: 'large', counting: 'pictures' }],
      ['patterns', { types: ['AB', 'AAB'], pages: 1 }],
      ['coloring', { pictures: ['sun', 'fish', 'apple'] }],
      ['mazes', { level: 'easy', perPage: '1', pages: 2, answerKey: false }],
    ],
    award: 'effort',
  },
  kweek: {
    title: 'Kindergarten Week',
    icon: '🎒',
    grades: 'Kindergarten',
    blurb: 'A full week: letters, numbers, sight words, picture math, sounds and fun pages.',
    items: [
      ['letters', { letters: ['A', 'B', 'C', 'D', 'E'], letterCase: 'both', size: 'large' }],
      ['numbers', { from: 1, to: 5, size: 'large', counting: 'color' }],
      ['words', { source: 'prek', rowsPerWord: 2, size: 'medium' }],
      ['math', { operation: 'add', level: 'within10', layout: 'pictures', pages: 2, answerKey: false }],
      ['phonics', { mode: 'sounds', letterCase: 'upper', pages: 1, answerKey: false }],
      ['dots', { figures: ['star', 'heart'], count: '10', labels: 'numbers' }],
      ['mazes', { level: 'easy', perPage: '2', pages: 1 }],
      ['coloring', { pictures: ['house', 'flower'] }],
    ],
    award: 'effort',
  },
  grade1: {
    title: 'Grade 1 Practice',
    icon: '📘',
    grades: 'Grade 1',
    blurb: 'Sight-word sentences, sums within 20, number sense, telling time and phonics.',
    items: [
      ['reading', { sentences: ['cat', 'fish', 'tree', 'car'] }],
      ['words', { source: 'g1', rowsPerWord: 1, size: 'medium' }],
      ['math', { operation: 'addsub', level: 'within20', layout: 'vertical', perPage: 20, pages: 2, answerKey: true }],
      ['numbersense', { mode: 'bonds', range: '20', pages: 1, answerKey: false }],
      ['numbersense', { mode: 'skip', skipBy: '0', pages: 1, answerKey: false }],
      ['clocks', { mode: 'read', precision: 'half', perPage: 9, answerKey: false }],
      ['phonics', { mode: 'missing', letterCase: 'lower', pages: 1, answerKey: false }],
      ['mazes', { level: 'medium', perPage: '1', pages: 1 }],
    ],
    award: 'reader',
  },
  grade2: {
    title: 'Grade 2–3 Practice',
    icon: '📗',
    grades: 'Grade 2 – Grade 3',
    blurb: 'Two-digit sums, times tables, money, time to 5 minutes, cursive and a 100 chart.',
    items: [
      ['math', { operation: 'addsub', level: '2digit', layout: 'vertical', perPage: 20, pages: 1, answerKey: true }],
      ['math', { operation: 'mul', tables: 'upto10', layout: 'horizontal', perPage: 24, pages: 1, answerKey: true }],
      ['money', { level: 'medium', pages: 1, answerKey: true }],
      ['clocks', { mode: 'draw', precision: 'five', perPage: 9, answerKey: true }],
      ['numbersense', { mode: 'chart', chartStyle: 'missing', skipBy: '0', pages: 1, answerKey: false }],
      ['cursive', { mode: 'letters', letters: ['a', 'b', 'c', 'd'], size: 'medium' }],
      ['words', { source: 'g2', rowsPerWord: 1, size: 'small' }],
      ['mazes', { level: 'hard', perPage: '1', pages: 1 }],
    ],
    award: 'math',
  },
  summer: {
    title: 'Summer Fun',
    icon: '🌞',
    grades: 'Pre-K – Grade 2',
    blurb: 'Coloring pages, mazes, dot-to-dots and patterns – perfect for holidays and trips.',
    items: [
      ['coloring', { pictures: ['sun', 'icecream', 'balloons', 'butterfly', 'rocket', 'car'] }],
      ['mazes', { level: 'easy', perPage: '1', pages: 2 }],
      ['mazes', { level: 'medium', perPage: '1', pages: 1 }],
      ['dots', { figures: ['star', 'fish', 'rocket'], count: '20', labels: 'numbers' }],
      ['patterns', { types: ['AB', 'ABC', 'AABB'], pages: 1 }],
    ],
    award: 'artist',
  },
};

type PackOpts = {
  pack: string;
  cover: boolean;
  certificate: boolean;
};

const theme = { main: '#ff8a3d', soft: '#ffe9d9', ink: '#a34a12' };

function coverPage(pack: Pack, contents: { title: string; icon: string; pages: number }[]): DrawPage {
  return (ctx, p) => {
    const { W, H } = p;
    const m = 14;
    ctx.save();
    roundRect(ctx, m, m, W - 2 * m, H - 2 * m, 10);
    ctx.fillStyle = p.inkSaver ? '#ffffff' : theme.soft;
    ctx.fill();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = theme.main;
    ctx.stroke();
    ctx.restore();
    const colors = ['#ff5fa2', '#4f8ff7', '#2fb36f', '#b062e8', '#ffc933'];
    for (let i = 0; i < 12; i++) star(ctx, m + 12 + ((i * 37) % (W - 2 * m - 24)), m + 12 + ((i * 53) % 40), 2 + (i % 3), p.inkSaver ? '#e3e7ee' : colors[i % 5]);
    emoji(ctx, pack.icon, W / 2, 80, 34);
    text(ctx, pack.title, W / 2, 118, 15, { align: 'center', font: FONT_TITLE, weight: 600, color: p.inkSaver ? INK : theme.ink });
    text(ctx, 'Activity book', W / 2, 130, 7, { align: 'center', font: FONT_TITLE, color: '#5c6378' });
    text(ctx, 'This book belongs to', W / 2, 150, 5, { align: 'center', font: FONT_BODY, color: '#5c6378' });
    ctx.save();
    ctx.strokeStyle = '#9aa3b2';
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 55, 166);
    ctx.lineTo(W / 2 + 55, 166);
    ctx.stroke();
    ctx.restore();
    if (p.childName) text(ctx, p.childName, W / 2, 163, 11, { align: 'center', font: FONT_TITLE, weight: 600 });
    text(ctx, "What's inside", W / 2, 186, 5.5, { align: 'center', font: FONT_TITLE, weight: 600 });
    let y = 196;
    let pg = 2;
    for (const c of contents) {
      text(ctx, `${c.icon}  ${c.title}`, W / 2 - 50, y, 4.6, { font: FONT_BODY, weight: 700 });
      text(ctx, c.pages === 1 ? `page ${pg}` : `pages ${pg}–${pg + c.pages - 1}`, W / 2 + 50, y, 4.2, { align: 'right', font: FONT_BODY, color: '#5c6378' });
      pg += c.pages;
      y += 7;
      if (y > H - 30) break;
    }
    text(ctx, 'PaperKid · paperkid.webappslab.com', W / 2, H - m - 6, 3.4, { align: 'center', font: FONT_TITLE, color: '#8a91a3' });
  };
}

export const packs: WorksheetDef<PackOpts> = {
  id: 'packs',
  title: 'Workbook Packs',
  icon: '📚',
  blurb: 'One click, one PDF: whole alphabet, numbers 0–20, a kindergarten week, grade packs and summer fun.',
  grades: 'Pre-K – Grade 3',
  category: 'packs',
  theme,
  defaults: { pack: 'kweek', cover: true, certificate: true },
  fields: [
    { type: 'select', key: 'pack', label: 'Pack', options: Object.entries(PACKS).map(([value, pk]) => ({ value, label: `${pk.icon} ${pk.title} (${pk.grades})` })) },
    { type: 'toggle', key: 'cover', label: 'Cover page with contents' },
    { type: 'toggle', key: 'certificate', label: 'Certificate at the end' },
  ],
  fileName: (o) => `PaperKid-pack-${o.pack}`,
  build(o, paper) {
    const pack = PACKS[o.pack] ?? PACKS.kweek;
    const pages: DrawPage[] = [];
    const contents: { title: string; icon: string; pages: number }[] = [];
    for (const [id, opts] of pack.items) {
      const ws = findWorksheet(id);
      if (!ws) continue;
      const built = ws.build({ ...ws.defaults, ...opts }, paper);
      pages.push(...built);
      contents.push({ title: ws.title, icon: ws.icon, pages: built.length });
    }
    if (o.certificate) {
      const rw = findWorksheet('rewards');
      if (rw) {
        const built = rw.build({ ...rw.defaults, kind: 'certificate', award: pack.award }, paper);
        pages.push(...built);
        contents.push({ title: 'Certificate', icon: '🏆', pages: built.length });
      }
    }
    return o.cover ? [coverPage(pack, contents), ...pages] : pages;
  },
};
