import { guideLines, INK, LIGHT_GREY, type Ctx } from './draw';

/**
 * Tracing helpers for scripts drawn from a font (cursive, Hindi, Telugu…) rather than
 * our single-stroke glyphs. Copies to trace are a pale grey fill with a dashed outline.
 */
export type FontStyle = 'solid' | 'trace' | 'light';

const ratioCache = new Map<string, { asc: number; desc: number }>();

/** Ascent/descent (per 1px of font size) of a reference string, so rows line up. */
export function fontMetrics(ctx: Ctx, family: string, ref: string) {
  const key = `${family}|${ref}`;
  const hit = ratioCache.get(key);
  if (hit) return hit;
  ctx.save();
  ctx.font = `500 100px ${family}`;
  const m = ctx.measureText(ref);
  ctx.restore();
  const res = { asc: (m.actualBoundingBoxAscent || 70) / 100, desc: (m.actualBoundingBoxDescent || 20) / 100 };
  // only cache real measurements (fonts may still be loading)
  if (m.actualBoundingBoxAscent) ratioCache.set(key, res);
  return res;
}

export function fontWidth(ctx: Ctx, s: string, family: string, size: number): number {
  ctx.save();
  ctx.font = `500 ${size}px ${family}`;
  const w = ctx.measureText(s).width;
  ctx.restore();
  return w;
}

/** Draw `s` with its baseline at `baseline`. */
export function fontText(ctx: Ctx, s: string, x: number, baseline: number, size: number, family: string, style: FontStyle) {
  ctx.save();
  ctx.font = `500 ${size}px ${family}`;
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  if (style === 'solid') {
    ctx.fillStyle = INK;
    ctx.fillText(s, x, baseline);
  } else {
    ctx.fillStyle = style === 'light' ? '#f1f3f7' : '#e3e7ee';
    ctx.fillText(s, x, baseline);
    ctx.setLineDash([size * 0.025, size * 0.025]);
    ctx.lineWidth = Math.max(0.18, size * 0.012);
    ctx.strokeStyle = style === 'light' ? LIGHT_GREY : '#8a94a6';
    ctx.strokeText(s, x, baseline);
  }
  ctx.restore();
}

/**
 * A practice row for font-based scripts. `cap` is the distance between the top line and
 * the baseline (mm); the font is sized so the reference glyph's ascent fills it.
 */
export function fontRow(
  ctx: Ctx,
  s: string,
  x: number,
  y: number,
  w: number,
  cap: number,
  family: string,
  ref: string,
  opts: { first?: FontStyle; rest?: FontStyle; count?: number; gap?: number; lines?: 'handwriting' | 'box' } = {},
) {
  const met = fontMetrics(ctx, family, ref);
  const size = cap / met.asc;
  if (opts.lines === 'box') {
    // simple top/base lines with a faint band – suits scripts with a head line (Devanagari)
    ctx.save();
    ctx.fillStyle = '#f6f8fc';
    ctx.fillRect(x, y, w, cap + met.desc * size);
    ctx.strokeStyle = '#a9c2ee';
    ctx.lineWidth = 0.3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.moveTo(x, y + cap);
    ctx.lineTo(x + w, y + cap);
    ctx.stroke();
    ctx.restore();
  } else guideLines(ctx, x, y, w, cap);
  const unit = fontWidth(ctx, s, family, size);
  const gap = opts.gap ?? Math.max(cap * 0.6, 5);
  let cx = x + cap * 0.3;
  let n = 0;
  while (cx + unit <= x + w - 1 && n < (opts.count ?? Infinity)) {
    fontText(ctx, s, cx, y + cap, size, family, n === 0 ? (opts.first ?? 'solid') : (opts.rest ?? 'trace'));
    cx += unit + gap;
    n++;
  }
  return size;
}
