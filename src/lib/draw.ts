import { GLYPHS, LETTER_GAP, SPACE_WIDTH, measureText } from './glyphs';

/** All drawing happens in millimetres: callers scale the canvas so 1 unit = 1 mm. */
export type Ctx = CanvasRenderingContext2D;

export const FONT_TITLE = '"Fredoka", "Andika", system-ui, sans-serif';
export const FONT_BODY = '"Andika", "Fredoka", system-ui, sans-serif';

export interface Theme {
  main: string;
  soft: string;
  ink: string;
}

export const INK = '#2b2d42';
export const TRACE_GREY = '#8a94a6';
export const GUIDE_TOP = '#7fa7e8';
export const GUIDE_MID = '#a9c2ee';
export const GUIDE_BASE = '#ef7f7f';

export interface PageInfo {
  W: number;
  H: number;
  margin: number;
  inkSaver: boolean;
  childName: string;
  showNameLine: boolean;
  pageNumber: number;
  pageCount: number;
}

// ---------------------------------------------------------------- primitives

export function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

export function text(
  ctx: Ctx,
  s: string,
  x: number,
  y: number,
  size: number,
  opts: { font?: string; color?: string; align?: CanvasTextAlign; weight?: string | number; baseline?: CanvasTextBaseline } = {},
) {
  ctx.save();
  ctx.font = `${opts.weight ?? 500} ${size}px ${opts.font ?? FONT_BODY}`;
  ctx.fillStyle = opts.color ?? INK;
  ctx.textAlign = opts.align ?? 'left';
  ctx.textBaseline = opts.baseline ?? 'alphabetic';
  ctx.fillText(s, x, y);
  ctx.restore();
}

export function emoji(ctx: Ctx, e: string, cx: number, cy: number, size: number) {
  ctx.save();
  ctx.font = `${size}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = INK;
  ctx.fillText(e, cx, cy);
  ctx.restore();
}

export function star(ctx: Ctx, cx: number, cy: number, r: number, color: string) {
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    ctx.lineTo(cx + rad * Math.cos(a), cy + rad * Math.sin(a));
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

/** Dotted stroke style that reads as "trace me". `lw` in current units. */
export function setTraceStyle(ctx: Ctx, lw: number, color = TRACE_GREY) {
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = color;
  ctx.setLineDash([0.001, lw * 1.6]);
}

export function setSolidStyle(ctx: Ctx, lw: number, color = INK) {
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = color;
  ctx.setLineDash([]);
}

// ---------------------------------------------------------------- handwriting lines

/**
 * Handwriting guide lines. `y` is the top line, `cap` the distance top→baseline in mm.
 */
export function guideLines(ctx: Ctx, x: number, y: number, w: number, cap: number, descender = true) {
  ctx.save();
  const lw = Math.max(0.25, cap * 0.022);
  // top
  ctx.setLineDash([]);
  ctx.lineWidth = lw;
  ctx.strokeStyle = GUIDE_TOP;
  line(ctx, x, y, x + w, y);
  // middle (dashed)
  ctx.setLineDash([cap * 0.09, cap * 0.07]);
  ctx.strokeStyle = GUIDE_MID;
  line(ctx, x, y + cap / 2, x + w, y + cap / 2);
  // baseline
  ctx.setLineDash([]);
  ctx.lineWidth = lw * 1.4;
  ctx.strokeStyle = GUIDE_BASE;
  line(ctx, x, y + cap, x + w, y + cap);
  if (descender) {
    ctx.lineWidth = lw * 0.8;
    ctx.setLineDash([cap * 0.03, cap * 0.06]);
    ctx.strokeStyle = GUIDE_MID;
    line(ctx, x, y + cap * 1.5, x + w, y + cap * 1.5);
  }
  ctx.restore();
}

export function line(ctx: Ctx, x1: number, y1: number, x2: number, y2: number) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

// ---------------------------------------------------------------- glyph text

/**
 * solid  – dark ink (example to copy)
 * model  – solid + numbered stroke-order arrows
 * trace  – dotted line to trace
 * hint   – dotted + small stroke-order arrows
 * light  – lighter dots (fading practice)
 * start  – only a dot where each stroke begins (last step before writing alone)
 * faint  – very light solid
 */
export type GlyphStyle = 'solid' | 'trace' | 'model' | 'hint' | 'light' | 'start' | 'faint';

export const LIGHT_GREY = '#c4cbd7';

const pathCache = new Map<string, Path2D>();
function path2d(d: string): Path2D {
  let p = pathCache.get(d);
  if (!p) {
    p = new Path2D(d);
    pathCache.set(d, p);
  }
  return p;
}

interface StrokeStart {
  x: number;
  y: number;
  angle: number;
}
const startCache = new Map<string, StrokeStart>();
let svgPathEl: SVGPathElement | null = null;

/** Start point and initial direction of an SVG path (used for stroke-order arrows). */
function strokeStart(d: string): StrokeStart {
  const hit = startCache.get(d);
  if (hit) return hit;
  let res: StrokeStart;
  try {
    if (!svgPathEl) svgPathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    svgPathEl.setAttribute('d', d);
    const p0 = svgPathEl.getPointAtLength(0);
    const p1 = svgPathEl.getPointAtLength(Math.min(6, svgPathEl.getTotalLength()));
    res = { x: p0.x, y: p0.y, angle: Math.atan2(p1.y - p0.y, p1.x - p0.x) };
  } catch {
    const m = /M\s*(-?[\d.]+)[ ,]+(-?[\d.]+)/.exec(d);
    res = { x: m ? +m[1] : 0, y: m ? +m[2] : 0, angle: 0 };
  }
  startCache.set(d, res);
  return res;
}

const STROKE_COLORS = ['#2fb36f', '#4f8ff7', '#f27d3d', '#b062e8', '#e0457b'];

/**
 * Draw `s` with single-stroke glyphs. `x`,`y` = left edge / top line, `cap` = cap height in mm.
 * Returns the width used, in mm.
 */
export function glyphText(ctx: Ctx, s: string, x: number, y: number, cap: number, style: GlyphStyle, color?: string): number {
  const k = cap / 100;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k, k);
  // stroke width in glyph units, slightly lighter on large text so it stays kid-friendly.
  const lw = cap > 14 ? 6.5 : cap > 9 ? 7.5 : 8.5;

  let cx = 0;
  let first = true;
  for (const ch of s) {
    if (ch === ' ') {
      cx += SPACE_WIDTH;
      first = true;
      continue;
    }
    const g = GLYPHS[ch];
    if (!g) continue;
    if (!first) cx += LETTER_GAP;
    first = false;

    ctx.save();
    ctx.translate(cx, 0);
    const dotted = style === 'trace' || style === 'hint' || style === 'light';
    const ink =
      style === 'trace' || style === 'hint' ? (color ?? TRACE_GREY) :
      style === 'light' ? LIGHT_GREY :
      style === 'faint' ? '#d5dae3' : (color ?? INK);
    if (dotted) setTraceStyle(ctx, lw, ink);
    else setSolidStyle(ctx, lw, ink);

    if (style === 'start') {
      // just a green dot at each stroke start, and the pen taps
      ctx.fillStyle = '#2fb36f';
      for (const d of g.strokes) {
        const st = strokeStart(d);
        ctx.beginPath();
        ctx.arc(st.x, st.y, lw * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = LIGHT_GREY;
    } else {
      for (const d of g.strokes) ctx.stroke(path2d(d));
      ctx.fillStyle = ink;
    }
    for (const [dx, dy] of g.dots ?? []) {
      ctx.beginPath();
      ctx.setLineDash([]);
      ctx.arc(dx, dy, lw * 0.75, 0, Math.PI * 2);
      ctx.fill();
    }

    if (style === 'model') g.strokes.forEach((d, i) => drawStrokeHint(ctx, d, i, lw));
    if (style === 'hint') g.strokes.forEach((d, i) => drawStrokeHint(ctx, d, i, lw * 0.7, true));
    ctx.restore();
    cx += g.width;
  }
  ctx.restore();
  return measureText(s) * k;
}

function drawStrokeHint(ctx: Ctx, d: string, i: number, lw: number, small = false) {
  const st = strokeStart(d);
  const color = STROKE_COLORS[i % STROKE_COLORS.length];
  if (small) {
    // compact version for traced copies: arrow only, no number
    ctx.save();
    ctx.setLineDash([]);
    ctx.fillStyle = color;
    const a = st.angle;
    const s = lw * 1.3;
    const ax = st.x + Math.cos(a) * s * 0.4;
    const ay = st.y + Math.sin(a) * s * 0.4;
    ctx.beginPath();
    ctx.moveTo(ax + Math.cos(a) * s, ay + Math.sin(a) * s);
    ctx.lineTo(ax + Math.cos(a + 2.4) * s, ay + Math.sin(a + 2.4) * s);
    ctx.lineTo(ax + Math.cos(a - 2.4) * s, ay + Math.sin(a - 2.4) * s);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    return;
  }
  const r = lw * 1.25;
  // numbered dot sits just before the start point (so strokes sharing a start don't hide each other),
  // the arrow just after it, pointing the way to write.
  const mx = st.x - Math.cos(st.angle) * r * 1.5;
  const my = st.y - Math.sin(st.angle) * r * 1.5;
  const ax = st.x + Math.cos(st.angle) * r * 2.2;
  const ay = st.y + Math.sin(st.angle) * r * 2.2;
  ctx.save();
  ctx.setLineDash([]);
  ctx.fillStyle = color;
  ctx.beginPath();
  const a = st.angle;
  const s = r * 0.95;
  ctx.moveTo(ax + Math.cos(a) * s, ay + Math.sin(a) * s);
  ctx.lineTo(ax + Math.cos(a + 2.4) * s, ay + Math.sin(a + 2.4) * s);
  ctx.lineTo(ax + Math.cos(a - 2.4) * s, ay + Math.sin(a - 2.4) * s);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(mx, my, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = `700 ${r * 1.5}px ${FONT_TITLE}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(i + 1), mx, my + r * 0.08);
  ctx.restore();
}

/**
 * A full practice row: guide lines, then `s` repeated across the width.
 * The first copy is solid (or a model with stroke hints), the rest dotted.
 * `traceCount` limits how many dotted copies; the remaining space stays blank for free writing.
 */
export function practiceRow(
  ctx: Ctx,
  s: string,
  x: number,
  y: number,
  w: number,
  cap: number,
  opts: {
    first?: GlyphStyle | 'none';
    traceCount?: number;
    gap?: number;
    descender?: boolean;
    /** style of the copies after the first (default 'trace') */
    traceStyle?: GlyphStyle;
    /** stroke arrows on the first traced copy */
    hintFirst?: boolean;
  } = {},
) {
  guideLines(ctx, x, y, w, cap, opts.descender ?? true);
  const unitW = (measureText(s) * cap) / 100;
  const gap = opts.gap ?? Math.max(cap * 0.55, 4);
  const pad = cap * 0.25;
  let cx = x + pad;
  let n = 0;
  const first = opts.first ?? 'solid';
  const max = opts.traceCount ?? Infinity;
  while (cx + unitW <= x + w - pad * 0.5) {
    if (n === 0 && first !== 'none') {
      glyphText(ctx, s, cx, y, cap, first);
    } else {
      const k = n - (first === 'none' ? 0 : 1);
      if (k >= max) break;
      const ts = opts.traceStyle ?? 'trace';
      glyphText(ctx, s, cx, y, cap, k === 0 && opts.hintFirst && ts === 'trace' ? 'hint' : ts);
    }
    cx += unitW + gap;
    n++;
  }
}

// ---------------------------------------------------------------- page chrome

/** Header band with title & optional emoji; returns the y where content can start. */
export function header(ctx: Ctx, p: PageInfo, theme: Theme, title: string, subtitle?: string, icon?: string): number {
  const { W, margin: m } = p;
  const bandH = 22;
  const y0 = m;
  ctx.save();
  roundRect(ctx, m, y0, W - 2 * m, bandH, 5);
  if (p.inkSaver) {
    ctx.lineWidth = 0.6;
    ctx.strokeStyle = theme.main;
    ctx.stroke();
  } else {
    ctx.fillStyle = theme.soft;
    ctx.fill();
    // playful dots
    ctx.globalAlpha = 0.35;
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.arc(W - m - 14 - i * 9, y0 + (i % 2 ? 5 : bandH - 5), 1.4 + (i % 3) * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = theme.main;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();

  let tx = m + 6;
  if (icon) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(m + 13, y0 + bandH / 2, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
    emoji(ctx, icon, m + 13, y0 + bandH / 2 + 0.6, 10);
    tx = m + 25;
  }
  text(ctx, title, tx, y0 + (subtitle ? 10.5 : 13.5), 8, { font: FONT_TITLE, weight: 600, color: p.inkSaver ? INK : theme.ink });
  if (subtitle) text(ctx, subtitle, tx, y0 + 17, 4, { color: '#5c6378' });

  let y = y0 + bandH + 7;
  if (p.showNameLine) {
    const nameW = (W - 2 * m) * 0.62;
    text(ctx, 'Name:', m, y, 4.2, { font: FONT_TITLE, weight: 500, color: '#5c6378' });
    ctx.save();
    ctx.strokeStyle = '#c3c9d6';
    ctx.lineWidth = 0.35;
    line(ctx, m + 14, y + 0.8, m + nameW, y + 0.8);
    line(ctx, m + nameW + 16, y + 0.8, W - m, y + 0.8);
    ctx.restore();
    if (p.childName) text(ctx, p.childName, m + 16, y - 0.2, 5, { font: FONT_BODY, color: INK });
    text(ctx, 'Date:', m + nameW + 4, y, 4.2, { font: FONT_TITLE, weight: 500, color: '#5c6378' });
    y += 8;
  }
  return y;
}

export function footer(ctx: Ctx, p: PageInfo, theme: Theme, note?: string) {
  const { W, H, margin: m } = p;
  const y = H - m + 2;
  star(ctx, m + 2, y - 1.4, 2, p.inkSaver ? '#c3c9d6' : theme.main);
  text(ctx, 'PaperKid', m + 5.5, y, 3.4, { font: FONT_TITLE, weight: 600, color: '#8a91a3' });
  if (note) text(ctx, note, W / 2, y, 3.2, { align: 'center', color: '#8a91a3' });
  if (p.pageCount > 1) text(ctx, `${p.pageNumber} / ${p.pageCount}`, W - m, y, 3.2, { align: 'right', color: '#8a91a3' });
}

/** A rounded "card" area used for grouping content. */
export function card(ctx: Ctx, x: number, y: number, w: number, h: number, theme: Theme, inkSaver: boolean) {
  ctx.save();
  roundRect(ctx, x, y, w, h, 4);
  if (!inkSaver) {
    ctx.fillStyle = '#fbfcff';
    ctx.fill();
  }
  ctx.setLineDash([]);
  ctx.lineWidth = 0.4;
  ctx.strokeStyle = inkSaver ? '#c3c9d6' : theme.main;
  ctx.stroke();
  ctx.restore();
}

/** Trace style for row `i` of `n` when practice should fade out gradually. */
export function fadeStyle(i: number, n: number): GlyphStyle {
  if (n <= 2) return 'trace';
  const f = i / (n - 1);
  return f < 0.45 ? 'trace' : f < 0.8 ? 'light' : 'start';
}

export function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Small deterministic PRNG so previews and downloads match. */
export function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
