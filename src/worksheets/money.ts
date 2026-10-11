import { footer, header, mulberry32, roundRect, text, FONT_BODY, FONT_TITLE, INK, type Ctx } from '../lib/draw';
import type { DrawPage, WorksheetDef } from './types';

interface Denom {
  value: number; // smallest unit (paise, cents, pence) – INR uses rupees
  label: string;
  kind: 'coin' | 'note';
  tint: string;
  size: number; // relative coin diameter
}

const COPPER = '#e7b98a';
const SILVER = '#dfe3ea';
const GOLD = '#f3d67a';

const CURRENCIES: Record<string, { name: string; denoms: Denom[]; format: (v: number) => string }> = {
  INR: {
    name: 'Indian Rupee (₹)',
    format: (v) => `₹${v}`,
    denoms: [
      { value: 1, label: '₹1', kind: 'coin', tint: SILVER, size: 0.8 },
      { value: 2, label: '₹2', kind: 'coin', tint: SILVER, size: 0.88 },
      { value: 5, label: '₹5', kind: 'coin', tint: GOLD, size: 0.92 },
      { value: 10, label: '₹10', kind: 'coin', tint: GOLD, size: 1 },
      { value: 10, label: '₹10', kind: 'note', tint: '#f1d9b5', size: 1 },
      { value: 20, label: '₹20', kind: 'note', tint: '#e5efc4', size: 1 },
      { value: 50, label: '₹50', kind: 'note', tint: '#cfeef0', size: 1 },
      { value: 100, label: '₹100', kind: 'note', tint: '#e2dcf5', size: 1 },
    ],
  },
  USD: {
    name: 'US Dollar ($)',
    format: (v) => (v < 100 ? `${v}¢` : `$${(v / 100).toFixed(2)}`),
    denoms: [
      { value: 1, label: '1¢', kind: 'coin', tint: COPPER, size: 0.78 },
      { value: 5, label: '5¢', kind: 'coin', tint: SILVER, size: 0.88 },
      { value: 10, label: '10¢', kind: 'coin', tint: SILVER, size: 0.72 },
      { value: 25, label: '25¢', kind: 'coin', tint: SILVER, size: 1 },
      { value: 100, label: '$1', kind: 'note', tint: '#dcefd9', size: 1 },
      { value: 500, label: '$5', kind: 'note', tint: '#dcefd9', size: 1 },
    ],
  },
  GBP: {
    name: 'British Pound (£)',
    format: (v) => (v < 100 ? `${v}p` : `£${(v / 100).toFixed(2)}`),
    denoms: [
      { value: 1, label: '1p', kind: 'coin', tint: COPPER, size: 0.75 },
      { value: 2, label: '2p', kind: 'coin', tint: COPPER, size: 0.9 },
      { value: 5, label: '5p', kind: 'coin', tint: SILVER, size: 0.7 },
      { value: 10, label: '10p', kind: 'coin', tint: SILVER, size: 0.88 },
      { value: 20, label: '20p', kind: 'coin', tint: SILVER, size: 0.8 },
      { value: 50, label: '50p', kind: 'coin', tint: SILVER, size: 0.95 },
      { value: 100, label: '£1', kind: 'coin', tint: GOLD, size: 0.92 },
      { value: 200, label: '£2', kind: 'coin', tint: GOLD, size: 1 },
    ],
  },
  EUR: {
    name: 'Euro (€)',
    format: (v) => (v < 100 ? `${v}c` : `€${(v / 100).toFixed(2)}`),
    denoms: [
      { value: 1, label: '1c', kind: 'coin', tint: COPPER, size: 0.7 },
      { value: 2, label: '2c', kind: 'coin', tint: COPPER, size: 0.78 },
      { value: 5, label: '5c', kind: 'coin', tint: COPPER, size: 0.85 },
      { value: 10, label: '10c', kind: 'coin', tint: GOLD, size: 0.8 },
      { value: 20, label: '20c', kind: 'coin', tint: GOLD, size: 0.88 },
      { value: 50, label: '50c', kind: 'coin', tint: GOLD, size: 0.96 },
      { value: 100, label: '€1', kind: 'coin', tint: SILVER, size: 0.92 },
      { value: 200, label: '€2', kind: 'coin', tint: SILVER, size: 1 },
    ],
  },
};

function drawDenom(ctx: Ctx, d: Denom, x: number, cy: number, unit: number, inkSaver: boolean): number {
  ctx.save();
  if (d.kind === 'coin') {
    const r = (unit / 2) * d.size;
    ctx.beginPath();
    ctx.arc(x + r, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = inkSaver ? '#ffffff' : d.tint;
    ctx.fill();
    ctx.lineWidth = 0.45;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + r, cy, r * 0.8, 0, Math.PI * 2);
    ctx.lineWidth = 0.25;
    ctx.stroke();
    ctx.restore();
    text(ctx, d.label, x + r, cy + r * 0.28, r * 0.75, { align: 'center', font: FONT_TITLE, weight: 600 });
    return r * 2;
  }
  const w = unit * 2;
  const h = unit * 1;
  roundRect(ctx, x, cy - h / 2, w, h, 1.2);
  ctx.fillStyle = inkSaver ? '#ffffff' : d.tint;
  ctx.fill();
  ctx.lineWidth = 0.45;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x + w * 0.72, cy, h * 0.28, h * 0.32, 0, 0, Math.PI * 2);
  ctx.lineWidth = 0.25;
  ctx.stroke();
  ctx.restore();
  text(ctx, d.label, x + w * 0.3, cy + h * 0.15, h * 0.42, { align: 'center', font: FONT_TITLE, weight: 600 });
  return w;
}

type MoneyOpts = {
  currency: keyof typeof CURRENCIES;
  level: 'small' | 'medium' | 'big';
  notes: boolean;
  pages: number;
  answerKey: boolean;
  seed: number;
};

const theme = { main: '#2fb36f', soft: '#dcf5e7', ink: '#17734a' };

export const money: WorksheetDef<MoneyOpts> = {
  id: 'money',
  title: 'Counting Money',
  icon: '🪙',
  blurb: 'Count the coins and notes and write the total. Rupees, dollars, pounds or euros.',
  grades: 'Grade 1 – Grade 3',
  category: 'math',
  theme,
  defaults: { currency: 'INR', level: 'small', notes: true, pages: 1, answerKey: true, seed: 9 },
  fields: [
    { type: 'select', key: 'currency', label: 'Currency', options: Object.entries(CURRENCIES).map(([value, c]) => ({ value, label: c.name })) },
    {
      type: 'segmented',
      key: 'level',
      label: 'Amounts',
      options: [
        { value: 'small', label: 'Small' },
        { value: 'medium', label: 'Medium' },
        { value: 'big', label: 'Big' },
      ],
    },
    { type: 'toggle', key: 'notes', label: 'Include notes / bills' },
    { type: 'number', key: 'pages', label: 'Pages', min: 1, max: 10 },
    { type: 'toggle', key: 'answerKey', label: 'Add answer key pages' },
    { type: 'reroll', key: 'seed', label: 'New problems' },
  ],
  fileName: (o) => `PaperKid-money-${o.currency}`,
  build(o) {
    const cur = CURRENCIES[o.currency] ?? CURRENCIES.INR;
    const rand = mulberry32(o.seed);
    const pool = cur.denoms.filter((d) => o.notes || d.kind === 'coin');
    // limit to the smaller denominations for easier levels
    const maxIdx = o.level === 'small' ? Math.ceil(pool.length * 0.5) : o.level === 'medium' ? Math.ceil(pool.length * 0.8) : pool.length;
    const usable = pool.slice(0, Math.max(2, maxIdx));
    const maxItems = o.level === 'small' ? 4 : o.level === 'medium' ? 6 : 7;
    const PER = 6;
    const sets: Denom[][][] = [];
    for (let p = 0; p < Math.max(1, Math.min(10, o.pages | 0)); p++) {
      const list: Denom[][] = [];
      for (let i = 0; i < PER; i++) {
        const k = 2 + Math.floor(rand() * (maxItems - 1));
        const items = Array.from({ length: k }, () => usable[Math.floor(rand() * usable.length)]);
        // biggest first, like counting real money
        items.sort((a, b) => b.value - a.value || (a.kind === 'note' ? -1 : 1));
        list.push(items);
      }
      sets.push(list);
    }
    const page =
      (list: Denom[][], key: boolean, idx: number): DrawPage =>
      (ctx, p) => {
        const top = header(ctx, p, theme, key ? 'Counting money – answers' : 'How much money?', key ? `Answers for page ${idx + 1}` : 'Count the money and write the total.', '🪙');
        const { W, H, margin: m } = p;
        const slot = (H - m - 6 - top) / list.length;
        list.forEach((items, i) => {
          const y = top + i * slot;
          const cy = y + slot / 2 - 1.5;
          ctx.save();
          roundRect(ctx, m, y + 1, W - 2 * m, slot - 4, 4);
          ctx.lineWidth = 0.35;
          ctx.strokeStyle = p.inkSaver ? '#d5dae3' : '#a7dfc1';
          ctx.stroke();
          ctx.restore();
          let unit = Math.min(16, slot * 0.5);
          const avail = W - 2 * m - 58;
          const need = items.reduce((a, d) => a + (d.kind === 'coin' ? unit * d.size : unit * 2) + 2.5, 0);
          if (need > avail) unit *= avail / need;
          let x = m + 5;
          for (const d of items) x += drawDenom(ctx, d, x, cy, unit, p.inkSaver) + 2.5;
          const total = items.reduce((a, d) => a + d.value, 0);
          const bx = W - m - 40;
          text(ctx, '=', bx - 5, cy + 2.5, 8, { align: 'center', font: FONT_TITLE });
          ctx.save();
          roundRect(ctx, bx, cy - 7, 35, 14, 2.5);
          ctx.lineWidth = 0.6;
          ctx.strokeStyle = INK;
          ctx.stroke();
          ctx.restore();
          if (key) text(ctx, cur.format(total), bx + 17.5, cy + 2.8, 7.5, { align: 'center', color: '#d13a5a', font: FONT_BODY, weight: 700 });
        });
        footer(ctx, p, theme, key ? 'Answer key' : undefined);
      };
    const out = sets.map((l, i) => page(l, false, i));
    if (o.answerKey) out.push(...sets.map((l, i) => page(l, true, i)));
    return out;
  },
};
