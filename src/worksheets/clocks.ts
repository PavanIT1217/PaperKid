import { footer, header, line, mulberry32, roundRect, text, FONT_BODY, FONT_TITLE, INK, type Ctx } from '../lib/draw';
import type { DrawPage, WorksheetDef } from './types';

export function drawClock(ctx: Ctx, cx: number, cy: number, r: number, time: { h: number; m: number } | null, accent: string) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.lineWidth = r * 0.06;
  ctx.strokeStyle = accent;
  ctx.stroke();
  // minute ticks
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const r1 = i % 5 === 0 ? r * 0.84 : r * 0.9;
    ctx.lineWidth = i % 5 === 0 ? r * 0.035 : r * 0.015;
    ctx.strokeStyle = INK;
    line(ctx, cx + Math.sin(a) * r1, cy - Math.cos(a) * r1, cx + Math.sin(a) * r * 0.95, cy - Math.cos(a) * r * 0.95);
  }
  for (let n = 1; n <= 12; n++) {
    const a = (n / 12) * Math.PI * 2;
    text(ctx, String(n), cx + Math.sin(a) * r * 0.68, cy - Math.cos(a) * r * 0.68 + r * 0.085, r * 0.24, { align: 'center', font: FONT_TITLE, weight: 600 });
  }
  if (time) {
    const ma = (time.m / 60) * Math.PI * 2;
    const ha = (((time.h % 12) + time.m / 60) / 12) * Math.PI * 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = INK;
    ctx.lineWidth = r * 0.085;
    line(ctx, cx, cy, cx + Math.sin(ha) * r * 0.45, cy - Math.cos(ha) * r * 0.45);
    ctx.strokeStyle = '#e5484d';
    ctx.lineWidth = r * 0.055;
    line(ctx, cx, cy, cx + Math.sin(ma) * r * 0.72, cy - Math.cos(ma) * r * 0.72);
  }
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.06, 0, Math.PI * 2);
  ctx.fillStyle = INK;
  ctx.fill();
  ctx.restore();
}

type ClockOpts = {
  mode: 'read' | 'draw';
  precision: 'hour' | 'half' | 'quarter' | 'five' | 'minute';
  perPage: number;
  answerKey: boolean;
  seed: number;
};

const theme = { main: '#4f8ff7', soft: '#e1ecff', ink: '#1d4fa8' };

const fmt = (t: { h: number; m: number }) => `${t.h}:${String(t.m).padStart(2, '0')}`;

export const clocks: WorksheetDef<ClockOpts> = {
  id: 'clocks',
  title: 'Telling Time',
  icon: '🕒',
  blurb: 'Read the clock and write the time, or draw the hands – by the hour down to the minute.',
  grades: 'Grade 1 – Grade 3',
  category: 'math',
  theme,
  defaults: { mode: 'read', precision: 'half', perPage: 9, answerKey: true, seed: 3 },
  fields: [
    {
      type: 'segmented',
      key: 'mode',
      label: 'Activity',
      options: [
        { value: 'read', label: 'Write the time' },
        { value: 'draw', label: 'Draw the hands' },
      ],
    },
    {
      type: 'select',
      key: 'precision',
      label: 'Times',
      options: [
        { value: 'hour', label: "O'clock" },
        { value: 'half', label: 'Hour & half hour' },
        { value: 'quarter', label: 'Quarter hours' },
        { value: 'five', label: '5 minutes' },
        { value: 'minute', label: 'Any minute' },
      ],
    },
    { type: 'number', key: 'perPage', label: 'Clocks per page', min: 4, max: 12 },
    { type: 'toggle', key: 'answerKey', label: 'Add answer key page' },
    { type: 'reroll', key: 'seed', label: 'New times' },
  ],
  fileName: (o) => `PaperKid-time-${o.precision}`,
  build(o) {
    const rand = mulberry32(o.seed);
    const step = { hour: 60, half: 30, quarter: 15, five: 5, minute: 1 }[o.precision] ?? 30;
    const n = Math.max(4, Math.min(12, o.perPage | 0));
    const times: { h: number; m: number }[] = [];
    const seen = new Set<string>();
    while (times.length < n) {
      const t = { h: 1 + Math.floor(rand() * 12), m: Math.floor(rand() * (60 / step)) * step };
      if (seen.has(fmt(t)) && seen.size < 12 * (60 / step)) continue;
      seen.add(fmt(t));
      times.push(t);
    }
    const page =
      (key: boolean): DrawPage =>
      (ctx, p) => {
        const top = header(
          ctx,
          p,
          theme,
          key ? 'Telling time – answers' : 'What time is it?',
          o.mode === 'read' ? 'Look at the clock and write the time.' : 'Draw the hands to show the time. Short hand = hour, long hand = minutes.',
          '🕒',
        );
        const { W, H, margin: m } = p;
        const cols = n <= 4 ? 2 : 3;
        const rows = Math.ceil(n / cols);
        const cw = (W - 2 * m) / cols;
        const ch = (H - m - 8 - top) / rows;
        const r = Math.min(cw * 0.36, ch * 0.33);
        times.forEach((t, i) => {
          const cx = m + (i % cols) * cw + cw / 2;
          const y = top + Math.floor(i / cols) * ch;
          const cy = y + r + 4;
          const show = o.mode === 'read' || key;
          drawClock(ctx, cx, cy, r, show ? t : null, p.inkSaver ? '#8a91a3' : theme.main);
          const by = cy + r + 5;
          const bw = r * 1.3;
          ctx.save();
          roundRect(ctx, cx - bw / 2, by, bw, 11, 2);
          ctx.lineWidth = 0.5;
          ctx.strokeStyle = '#b8bfcc';
          ctx.stroke();
          ctx.restore();
          if (o.mode === 'draw') text(ctx, fmt(t), cx, by + 8.3, 7, { align: 'center', font: FONT_BODY, weight: 700 });
          else if (key) text(ctx, fmt(t), cx, by + 8.3, 7, { align: 'center', font: FONT_BODY, weight: 700, color: '#d13a5a' });
          else text(ctx, ':', cx, by + 8, 7, { align: 'center', font: FONT_BODY, color: '#c3c9d6' });
        });
        footer(ctx, p, theme, key ? 'Answer key' : undefined);
      };
    return o.answerKey ? [page(false), page(true)] : [page(false)];
  },
};
