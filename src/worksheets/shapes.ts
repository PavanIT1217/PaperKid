import { footer, glyphText, guideLines, header, roundRect, setSolidStyle, setTraceStyle, text, FONT_TITLE, INK, type Ctx } from '../lib/draw';
import { measureText } from '../lib/glyphs';
import type { DrawPage, WorksheetDef } from './types';

/** Shapes are defined in a unit box (-1..1) and scaled when drawn. */
function shapePath(name: string): Path2D {
  const p = new Path2D();
  const poly = (n: number, rot = -Math.PI / 2, r = 1) => {
    for (let i = 0; i < n; i++) {
      const a = rot + (i * 2 * Math.PI) / n;
      if (i === 0) p.moveTo(r * Math.cos(a), r * Math.sin(a));
      else p.lineTo(r * Math.cos(a), r * Math.sin(a));
    }
    p.closePath();
  };
  switch (name) {
    case 'circle':
      p.arc(0, 0, 1, -Math.PI / 2, Math.PI * 1.5);
      break;
    case 'square':
      p.rect(-0.85, -0.85, 1.7, 1.7);
      break;
    case 'rectangle':
      p.rect(-1, -0.6, 2, 1.2);
      break;
    case 'triangle':
      p.moveTo(0, -0.95);
      p.lineTo(1, 0.8);
      p.lineTo(-1, 0.8);
      p.closePath();
      break;
    case 'oval':
      p.ellipse(0, 0, 1, 0.65, 0, -Math.PI / 2, Math.PI * 1.5);
      break;
    case 'diamond':
      p.moveTo(0, -1);
      p.lineTo(0.7, 0);
      p.lineTo(0, 1);
      p.lineTo(-0.7, 0);
      p.closePath();
      break;
    case 'star':
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 1 : 0.42;
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        if (i === 0) p.moveTo(r * Math.cos(a), r * Math.sin(a) + 0.08);
        else p.lineTo(r * Math.cos(a), r * Math.sin(a) + 0.08);
      }
      p.closePath();
      break;
    case 'heart':
      p.moveTo(0, -0.45);
      p.bezierCurveTo(0, -0.95, -1, -0.95, -1, -0.3);
      p.bezierCurveTo(-1, 0.25, -0.4, 0.55, 0, 0.95);
      p.bezierCurveTo(0.4, 0.55, 1, 0.25, 1, -0.3);
      p.bezierCurveTo(1, -0.95, 0, -0.95, 0, -0.45);
      p.closePath();
      break;
    case 'pentagon':
      poly(5);
      break;
    case 'hexagon':
      poly(6, 0);
      break;
    case 'octagon':
      poly(8, Math.PI / 8);
      break;
    case 'semicircle':
      p.moveTo(-1, 0.4);
      p.arc(0, 0.4, 1, Math.PI, 0);
      p.closePath();
      break;
  }
  return p;
}

export const SHAPES: { value: string; label: string; color: string }[] = [
  { value: 'circle', label: 'circle', color: '#ff6b6b' },
  { value: 'square', label: 'square', color: '#4f8ff7' },
  { value: 'triangle', label: 'triangle', color: '#2fb36f' },
  { value: 'rectangle', label: 'rectangle', color: '#ffb020' },
  { value: 'oval', label: 'oval', color: '#b062e8' },
  { value: 'diamond', label: 'diamond', color: '#20b8c8' },
  { value: 'star', label: 'star', color: '#ffc933' },
  { value: 'heart', label: 'heart', color: '#ff5fa2' },
  { value: 'pentagon', label: 'pentagon', color: '#7a6ff0' },
  { value: 'hexagon', label: 'hexagon', color: '#ff8a3d' },
  { value: 'octagon', label: 'octagon', color: '#e0457b' },
  { value: 'semicircle', label: 'semicircle', color: '#3cbf9a' },
];

function drawShape(ctx: Ctx, name: string, cx: number, cy: number, r: number, style: 'model' | 'trace' | 'outline', color: string) {
  const path = shapePath(name);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(r, r);
  if (style === 'model') {
    ctx.fillStyle = color + '33';
    ctx.fill(path);
    setSolidStyle(ctx, 0.9 / r, color);
  } else if (style === 'outline') {
    setSolidStyle(ctx, 0.9 / r, INK);
  } else {
    setTraceStyle(ctx, 0.85 / r);
  }
  ctx.stroke(path);
  ctx.restore();
}

type ShapeOpts = {
  shapes: string[];
  mode: 'rows' | 'big';
  name: boolean;
};

const theme = { main: '#20b8c8', soft: '#d8f5f8', ink: '#0d6f7a' };

export const shapes: WorksheetDef<ShapeOpts> = {
  id: 'shapes',
  title: 'Shapes',
  icon: '🔷',
  blurb: 'Trace circles, triangles, stars, hearts and more – then color them in.',
  grades: 'Pre-K – Grade 1',
  category: 'fun',
  theme,
  defaults: { shapes: SHAPES.slice(0, 8).map((s) => s.value), mode: 'rows', name: true },
  fields: [
    { type: 'chips', key: 'shapes', label: 'Shapes', options: SHAPES.map(({ value, label }) => ({ value, label })) },
    {
      type: 'segmented',
      key: 'mode',
      label: 'Layout',
      options: [
        { value: 'rows', label: 'Trace rows' },
        { value: 'big', label: 'Big trace & color' },
      ],
    },
    { type: 'toggle', key: 'name', label: 'Trace the shape name', when: (o) => o.mode === 'big' },
  ],
  fileName: () => 'PaperKid-shapes',
  build(o) {
    const list = SHAPES.filter((s) => o.shapes.includes(s.value));
    if (!list.length) return [];
    const perPage = o.mode === 'rows' ? 5 : 2;
    const pages: DrawPage[] = [];
    for (let i = 0; i < list.length; i += perPage) {
      const chunk = list.slice(i, i + perPage);
      pages.push((ctx, p) => {
        const top = header(
          ctx,
          p,
          theme,
          o.mode === 'rows' ? 'Trace the shapes' : 'Trace & color',
          o.mode === 'rows' ? 'Trace the dotted shapes, then draw your own in the empty space.' : 'Trace the dotted line, then color the shape.',
          '🔷',
        );
        const { W, H, margin: m } = p;
        const cw = W - 2 * m;
        const avail = H - m - 6 - top;
        const slotH = avail / perPage;
        chunk.forEach((s, k) => {
          const y = top + k * slotH;
          const color = p.inkSaver ? '#8a91a3' : s.color;
          if (o.mode === 'rows') {
            const r = Math.min(slotH * 0.3, 15);
            const cy = y + r + 4;
            ctx.save();
            roundRect(ctx, m, y, cw, slotH - 3, 4);
            ctx.lineWidth = 0.35;
            ctx.strokeStyle = p.inkSaver ? '#c3c9d6' : s.color;
            ctx.stroke();
            ctx.restore();
            const step = (cw - 8) / 5;
            for (let j = 0; j < 5; j++) {
              const cx = m + 4 + step * j + step / 2;
              if (j === 0) drawShape(ctx, s.value, cx, cy, r, 'model', color);
              else if (j < 4) drawShape(ctx, s.value, cx, cy, r, 'trace', color);
            }
            text(ctx, s.label, m + 4 + step / 2, cy + r + 7.5, 5.5, { align: 'center', font: FONT_TITLE, weight: 600, color: p.inkSaver ? INK : s.color });
          } else {
            const r = Math.min(slotH * 0.33, cw * 0.3);
            const cy = y + r + 6;
            drawShape(ctx, s.value, W / 2, cy, r, 'trace', color);
            const cap = 12;
            const nw = (measureText(s.label) * cap) / 100;
            const ny = cy + r + 6;
            if (o.name) {
              guideLines(ctx, W / 2 - nw / 2 - 6, ny, nw + 12, cap, false);
              glyphText(ctx, s.label, W / 2 - nw / 2, ny, cap, 'trace');
            } else {
              text(ctx, s.label, W / 2, ny + 8, 8, { align: 'center', font: FONT_TITLE, color });
            }
          }
        });
        footer(ctx, p, theme);
      });
    }
    return pages;
  },
};
