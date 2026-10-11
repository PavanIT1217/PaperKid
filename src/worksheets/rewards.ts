import { emoji, footer, header, line, roundRect, star, text, FONT_BODY, FONT_TITLE, INK, type Ctx, type PageInfo } from '../lib/draw';
import type { WorksheetDef } from './types';

export const AWARDS: Record<string, [string, string, string]> = {
  alphabet: ['Alphabet Star', 'for learning to write the letters A to Z!', '🔤'],
  numbers: ['Number Ninja', 'for learning to count and write numbers!', '🔢'],
  writer: ['Super Writer', 'for beautiful, careful handwriting!', '✏️'],
  reader: ['Reading Rocket', 'for reading so many words and sentences!', '🚀'],
  math: ['Math Champion', 'for working hard on math practice!', '🏆'],
  artist: ['Amazing Artist', 'for colorful and creative pages!', '🎨'],
  maze: ['Maze Master', 'for finding the way through every maze!', '🌀'],
  effort: ['Great Effort', 'for trying hard and never giving up!', '💪'],
  custom: ['', '', '⭐'],
};

type RewardOpts = {
  kind: 'certificate' | 'chart' | 'stickers';
  award: string;
  customTitle: string;
  customReason: string;
  tasks: string;
  days: 'week' | 'weekdays';
  stickers: number;
  prize: boolean;
};

const theme = { main: '#ffc933', soft: '#fff4cc', ink: '#8a5a00' };

function medal(ctx: Ctx, cx: number, cy: number, r: number, inkSaver: boolean) {
  ctx.save();
  // ribbons
  ctx.fillStyle = inkSaver ? '#ffffff' : '#e5484d';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 0.5;
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + dir * r * 0.2, cy);
    ctx.lineTo(cx + dir * r * 0.9, cy + r * 1.9);
    ctx.lineTo(cx + dir * r * 0.55, cy + r * 1.6);
    ctx.lineTo(cx + dir * r * 0.25, cy + r * 2.0);
    ctx.lineTo(cx - dir * r * 0.25, cy + r * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = inkSaver ? '#ffffff' : '#ffd23f';
  ctx.fill();
  ctx.lineWidth = 0.7;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.78, 0, Math.PI * 2);
  ctx.setLineDash([0.8, 0.8]);
  ctx.lineWidth = 0.35;
  ctx.stroke();
  ctx.restore();
  star(ctx, cx, cy + r * 0.05, r * 0.5, inkSaver ? '#c3c9d6' : '#ff8a3d');
}

function certificate(ctx: Ctx, p: PageInfo, o: RewardOpts) {
  const { W, H } = p;
  const [t, reason, icon] = AWARDS[o.award] ?? AWARDS.effort;
  const title = o.award === 'custom' ? o.customTitle || 'Super Star' : t;
  const why = o.award === 'custom' ? o.customReason || 'for being amazing!' : reason;
  const m = 10;
  ctx.save();
  roundRect(ctx, m, m, W - 2 * m, H - 2 * m, 8);
  ctx.lineWidth = 3;
  ctx.strokeStyle = p.inkSaver ? '#c3c9d6' : '#ffb020';
  ctx.stroke();
  roundRect(ctx, m + 5, m + 5, W - 2 * m - 10, H - 2 * m - 10, 5);
  ctx.lineWidth = 0.6;
  ctx.setLineDash([2, 1.5]);
  ctx.strokeStyle = p.inkSaver ? '#c3c9d6' : '#4f8ff7';
  ctx.stroke();
  ctx.restore();
  // corner stars
  const colors = ['#ff5fa2', '#4f8ff7', '#2fb36f', '#b062e8'];
  [
    [m + 14, m + 14],
    [W - m - 14, m + 14],
    [m + 14, H - m - 14],
    [W - m - 14, H - m - 14],
  ].forEach(([x, y], i) => star(ctx, x, y, 6, p.inkSaver ? '#e3e7ee' : colors[i]));
  // confetti dots
  if (!p.inkSaver)
    for (let i = 0; i < 26; i++) {
      const a = i * 2.39996;
      const x = W / 2 + Math.cos(a) * (60 + (i % 5) * 9);
      const y = 70 + Math.sin(a) * (32 + (i % 4) * 5);
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(x, y, 1 + (i % 3) * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = colors[i % 4];
      ctx.fill();
      ctx.restore();
    }

  medal(ctx, W / 2, 62, 20, p.inkSaver);
  text(ctx, 'CERTIFICATE', W / 2, 128, 17, { align: 'center', font: FONT_TITLE, weight: 600, color: p.inkSaver ? INK : '#a34a12' });
  text(ctx, 'of achievement', W / 2, 140, 7, { align: 'center', font: FONT_TITLE, weight: 500, color: '#5c6378' });
  text(ctx, 'This award is proudly given to', W / 2, 160, 5.5, { align: 'center', font: FONT_BODY, color: '#5c6378' });
  if (p.childName) text(ctx, p.childName, W / 2, 182, 15, { align: 'center', font: FONT_TITLE, weight: 600, color: INK });
  ctx.save();
  ctx.strokeStyle = '#9aa3b2';
  ctx.lineWidth = 0.4;
  line(ctx, W / 2 - 65, 186, W / 2 + 65, 186);
  ctx.restore();
  text(ctx, `${icon}  ${title}  ${icon}`, W / 2, 206, 11, { align: 'center', font: FONT_TITLE, weight: 600, color: p.inkSaver ? INK : '#1d4fa8' });
  text(ctx, why, W / 2, 220, 5.5, { align: 'center', font: FONT_BODY, color: INK });
  // date & signature
  ctx.save();
  ctx.strokeStyle = '#9aa3b2';
  ctx.lineWidth = 0.4;
  line(ctx, 32, H - 42, 92, H - 42);
  line(ctx, W - 92, H - 42, W - 32, H - 42);
  ctx.restore();
  text(ctx, 'Date', 62, H - 36, 4.2, { align: 'center', font: FONT_TITLE, color: '#5c6378' });
  text(ctx, 'Signed', W - 62, H - 36, 4.2, { align: 'center', font: FONT_TITLE, color: '#5c6378' });
  text(ctx, 'PaperKid', W / 2, H - 24, 3.4, { align: 'center', font: FONT_TITLE, weight: 600, color: '#8a91a3' });
}

function chart(ctx: Ctx, p: PageInfo, o: RewardOpts) {
  const top = header(ctx, p, theme, p.childName ? `${p.childName}'s Star Chart` : 'My Star Chart', 'Color a star every time you do it!', '⭐');
  const { W, H, margin: m } = p;
  const days = o.days === 'weekdays' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const tasks = o.tasks
    .split('\n')
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 10);
  const firstW = 52;
  const cw = (W - 2 * m - firstW) / days.length;
  const bottomSpace = o.prize ? 30 : 6;
  const rh = Math.min(26, (H - m - 8 - top - 12 - bottomSpace) / Math.max(1, tasks.length));
  const y0 = top + 2;
  days.forEach((d, i) => {
    const x = m + firstW + i * cw;
    ctx.save();
    roundRect(ctx, x + 1, y0, cw - 2, 10, 2);
    ctx.fillStyle = p.inkSaver ? '#ffffff' : ['#ffe1ee', '#e1ecff', '#dcf5e7', '#fff1d1', '#f1e3fc', '#d8f5f8', '#ffe9d9'][i];
    ctx.fill();
    ctx.restore();
    text(ctx, d, x + cw / 2, y0 + 7, 4.5, { align: 'center', font: FONT_TITLE, weight: 600 });
  });
  tasks.forEach((t, r) => {
    const y = y0 + 12 + r * rh;
    ctx.save();
    ctx.strokeStyle = '#e3e7ee';
    ctx.lineWidth = 0.3;
    line(ctx, m, y + rh, W - m, y + rh);
    ctx.restore();
    let fs = 4.6;
    ctx.save();
    ctx.font = `600 ${fs}px ${FONT_BODY}`;
    while (ctx.measureText(t).width > firstW - 4 && fs > 3) {
      fs -= 0.2;
      ctx.font = `600 ${fs}px ${FONT_BODY}`;
    }
    ctx.restore();
    text(ctx, t, m + 1, y + rh / 2 + fs * 0.35, fs, { font: FONT_BODY, weight: 700 });
    days.forEach((_, i) => {
      const cx = m + firstW + i * cw + cw / 2;
      const cy = y + rh / 2;
      const r = Math.min(cw, rh) * 0.34;
      ctx.save();
      ctx.beginPath();
      for (let k = 0; k < 10; k++) {
        const rr = k % 2 === 0 ? r : r * 0.45;
        const a = -Math.PI / 2 + (k * Math.PI) / 5;
        ctx.lineTo(cx + rr * Math.cos(a), cy + rr * Math.sin(a));
      }
      ctx.closePath();
      ctx.lineWidth = 0.45;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#b8bfcc';
      ctx.stroke();
      ctx.restore();
    });
  });
  if (o.prize) prizeLine(ctx, p, H - m - 26);
  footer(ctx, p, theme);
}

function prizeLine(ctx: Ctx, p: PageInfo, y: number) {
  const { W, margin: m } = p;
  ctx.save();
  roundRect(ctx, m, y, W - 2 * m, 20, 5);
  ctx.fillStyle = p.inkSaver ? '#ffffff' : theme.soft;
  ctx.fill();
  ctx.restore();
  emoji(ctx, '🎁', m + 10, y + 10, 10);
  text(ctx, 'When I fill my chart, I get:', m + 19, y + 12, 5, { font: FONT_TITLE, weight: 600 });
  ctx.save();
  ctx.strokeStyle = '#9aa3b2';
  ctx.lineWidth = 0.4;
  line(ctx, m + 92, y + 13, W - m - 6, y + 13);
  ctx.restore();
}

function stickers(ctx: Ctx, p: PageInfo, o: RewardOpts) {
  const top = header(ctx, p, theme, p.childName ? `${p.childName}'s Sticker Chart` : 'My Sticker Chart', 'Add a sticker or color a circle each time!', '🌟');
  const { W, H, margin: m } = p;
  const n = Math.max(5, Math.min(60, o.stickers | 0));
  const cols = n <= 10 ? 5 : n <= 30 ? 5 : 6;
  const rows = Math.ceil(n / cols);
  const bottom = o.prize ? 30 : 8;
  const cw = (W - 2 * m) / cols;
  const ch = (H - m - 8 - top - bottom) / rows;
  const r = Math.min(cw, ch) * 0.4;
  const colors = ['#ffe1ee', '#e1ecff', '#dcf5e7', '#fff1d1', '#f1e3fc', '#d8f5f8'];
  for (let i = 0; i < n; i++) {
    const cx = m + (i % cols) * cw + cw / 2;
    const cy = top + Math.floor(i / cols) * ch + ch / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    if (!p.inkSaver) {
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
    }
    ctx.lineWidth = 0.5;
    ctx.setLineDash([1.4, 1]);
    ctx.strokeStyle = '#9aa3b2';
    ctx.stroke();
    ctx.restore();
    text(ctx, String(i + 1), cx, cy + r * 0.25, r * 0.7, { align: 'center', font: FONT_TITLE, weight: 600, color: '#c3c9d6' });
  }
  if (o.prize) prizeLine(ctx, p, H - m - 26);
  footer(ctx, p, theme);
}

export const rewards: WorksheetDef<RewardOpts> = {
  id: 'rewards',
  title: 'Certificates & Charts',
  icon: '🏆',
  blurb: 'Celebrate progress! Printable award certificates, weekly star charts and sticker charts.',
  grades: 'All ages',
  category: 'packs',
  theme,
  defaults: {
    kind: 'certificate',
    award: 'alphabet',
    customTitle: '',
    customReason: '',
    tasks: 'Brush my teeth\nPractice writing\nRead a book\nTidy my toys\nHelp at home\nBe kind',
    days: 'week',
    stickers: 30,
    prize: true,
  },
  fields: [
    {
      type: 'segmented',
      key: 'kind',
      label: 'Make a',
      options: [
        { value: 'certificate', label: '🏅 Certificate' },
        { value: 'chart', label: '⭐ Star chart' },
        { value: 'stickers', label: '🌟 Sticker chart' },
      ],
    },
    {
      type: 'select',
      key: 'award',
      label: 'Award',
      options: Object.entries(AWARDS).map(([value, a]) => ({ value, label: value === 'custom' ? 'Write my own…' : `${a[2]} ${a[0]}` })),
      when: (o) => o.kind === 'certificate',
    },
    { type: 'text', key: 'customTitle', label: 'Award title', placeholder: 'Super Helper', when: (o) => o.kind === 'certificate' && o.award === 'custom' },
    { type: 'text', key: 'customReason', label: 'Awarded for…', placeholder: 'for helping at home every day!', when: (o) => o.kind === 'certificate' && o.award === 'custom' },
    { type: 'text', key: 'tasks', label: 'Things to do (one per line)', multiline: true, when: (o) => o.kind === 'chart' },
    {
      type: 'segmented',
      key: 'days',
      label: 'Days',
      options: [
        { value: 'week', label: 'Mon – Sun' },
        { value: 'weekdays', label: 'Mon – Fri' },
      ],
      when: (o) => o.kind === 'chart',
    },
    { type: 'number', key: 'stickers', label: 'Number of stickers', min: 5, max: 60, when: (o) => o.kind === 'stickers' },
    { type: 'toggle', key: 'prize', label: 'Add a "my prize" line', when: (o) => o.kind !== 'certificate' },
  ],
  fileName: (o) => `PaperKid-${o.kind}`,
  build(o) {
    if (o.kind === 'chart') return [(ctx, p) => chart(ctx, p, o)];
    if (o.kind === 'stickers') return [(ctx, p) => stickers(ctx, p, o)];
    return [(ctx, p) => certificate(ctx, p, o)];
  },
};
