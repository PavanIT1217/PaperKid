import { emoji, footer, header, mulberry32, type Ctx } from '../lib/draw';
import type { DrawPage, WorksheetDef } from './types';

interface Maze {
  cols: number;
  rows: number;
  /** walls[cell] bit flags: 1 = top, 2 = right, 4 = bottom, 8 = left */
  walls: number[];
  solution: number[];
}

const DIRS = [
  { bit: 1, dx: 0, dy: -1, opp: 4 },
  { bit: 2, dx: 1, dy: 0, opp: 8 },
  { bit: 4, dx: 0, dy: 1, opp: 1 },
  { bit: 8, dx: -1, dy: 0, opp: 2 },
];

/** Perfect maze via randomized depth-first search; solution from top-left to bottom-right. */
export function makeMaze(cols: number, rows: number, rand: () => number): Maze {
  const walls = new Array(cols * rows).fill(15);
  const seen = new Array(cols * rows).fill(false);
  const stack = [0];
  seen[0] = true;
  while (stack.length) {
    const c = stack[stack.length - 1];
    const x = c % cols;
    const y = Math.floor(c / cols);
    const options = DIRS.filter((d) => {
      const nx = x + d.dx;
      const ny = y + d.dy;
      return nx >= 0 && ny >= 0 && nx < cols && ny < rows && !seen[ny * cols + nx];
    });
    if (!options.length) {
      stack.pop();
      continue;
    }
    const d = options[Math.floor(rand() * options.length)];
    const n = (y + d.dy) * cols + x + d.dx;
    walls[c] &= ~d.bit;
    walls[n] &= ~d.opp;
    seen[n] = true;
    stack.push(n);
  }
  // BFS for the solution
  const prev = new Array(cols * rows).fill(-1);
  const q = [0];
  prev[0] = 0;
  while (q.length) {
    const c = q.shift()!;
    const x = c % cols;
    const y = Math.floor(c / cols);
    for (const d of DIRS) {
      if (walls[c] & d.bit) continue;
      const n = (y + d.dy) * cols + x + d.dx;
      if (prev[n] !== -1) continue;
      prev[n] = c;
      q.push(n);
    }
  }
  const solution: number[] = [];
  for (let c = cols * rows - 1; c !== 0; c = prev[c]) solution.push(c);
  solution.push(0);
  return { cols, rows, walls, solution: solution.reverse() };
}

function drawMaze(ctx: Ctx, mz: Maze, x: number, y: number, cell: number, color: string, solve: boolean) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(0.6, cell * 0.09);
  ctx.strokeStyle = color;
  ctx.beginPath();
  for (let i = 0; i < mz.walls.length; i++) {
    const cx = x + (i % mz.cols) * cell;
    const cy = y + Math.floor(i / mz.cols) * cell;
    const w = mz.walls[i];
    // leave the entrance (top of first cell) and exit (bottom of last cell) open
    if (w & 1 && i !== 0) {
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + cell, cy);
    }
    if (w & 8) {
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, cy + cell);
    }
    if (i % mz.cols === mz.cols - 1 && w & 2) {
      ctx.moveTo(cx + cell, cy);
      ctx.lineTo(cx + cell, cy + cell);
    }
    if (Math.floor(i / mz.cols) === mz.rows - 1 && w & 4 && i !== mz.walls.length - 1) {
      ctx.moveTo(cx, cy + cell);
      ctx.lineTo(cx + cell, cy + cell);
    }
  }
  ctx.stroke();
  if (solve) {
    ctx.beginPath();
    ctx.strokeStyle = '#e5484d';
    ctx.lineWidth = Math.max(0.8, cell * 0.18);
    ctx.lineJoin = 'round';
    ctx.moveTo(x + cell / 2, y - cell * 0.3);
    for (const c of mz.solution) ctx.lineTo(x + (c % mz.cols) * cell + cell / 2, y + Math.floor(c / mz.cols) * cell + cell / 2);
    ctx.lineTo(x + (mz.cols - 0.5) * cell, y + mz.rows * cell + cell * 0.3);
    ctx.stroke();
  }
  ctx.restore();
}

const PAIRS: [string, string, string][] = [
  ['🐭', '🧀', 'Help the mouse find the cheese!'],
  ['🐶', '🦴', 'Help the puppy find its bone!'],
  ['🐝', '🌻', 'Help the bee find the flower!'],
  ['🚀', '🌙', 'Fly the rocket to the moon!'],
  ['🐰', '🥕', 'Help the bunny find the carrot!'],
  ['🐵', '🍌', 'Help the monkey find the banana!'],
  ['🐱', '🐟', 'Help the cat find the fish!'],
  ['🚗', '🏠', 'Drive the car home!'],
];

const SIZES = { easy: [6, 8], medium: [10, 13], hard: [15, 20], expert: [22, 30] } as const;

type MazeOpts = {
  level: keyof typeof SIZES;
  perPage: '1' | '2';
  pages: number;
  answerKey: boolean;
  seed: number;
};

const theme = { main: '#7a6ff0', soft: '#e8e6ff', ink: '#3f35a8' };

export const mazes: WorksheetDef<MazeOpts> = {
  id: 'mazes',
  title: 'Mazes',
  icon: '🌀',
  blurb: 'Help the mouse find the cheese! Fresh mazes every time, from easy to expert, with answers.',
  grades: 'Pre-K – Grade 3',
  category: 'fun',
  theme,
  defaults: { level: 'easy', perPage: '1', pages: 2, answerKey: false, seed: 11 },
  fields: [
    {
      type: 'segmented',
      key: 'level',
      label: 'Difficulty',
      options: [
        { value: 'easy', label: 'Easy' },
        { value: 'medium', label: 'Medium' },
        { value: 'hard', label: 'Hard' },
        { value: 'expert', label: 'Expert' },
      ],
    },
    {
      type: 'segmented',
      key: 'perPage',
      label: 'Mazes per page',
      options: [
        { value: '1', label: '1 big' },
        { value: '2', label: '2' },
      ],
    },
    { type: 'number', key: 'pages', label: 'Pages', min: 1, max: 20 },
    { type: 'toggle', key: 'answerKey', label: 'Add answer pages' },
    { type: 'reroll', key: 'seed', label: 'New mazes' },
  ],
  fileName: (o) => `PaperKid-mazes-${o.level}`,
  build(o) {
    const per = o.perPage === '2' ? 2 : 1;
    const rand = mulberry32(o.seed);
    const [c0, r0] = SIZES[o.level] ?? SIZES.easy;
    const sets: { mz: Maze; pair: [string, string, string] }[][] = [];
    const nPages = Math.max(1, Math.min(20, o.pages | 0));
    for (let p = 0; p < nPages; p++) {
      const set = [];
      for (let k = 0; k < per; k++) {
        // two per page → landscape-ish mazes with fewer rows
        const cols = c0;
        const rows = per === 2 ? Math.round(r0 * 0.55) : r0;
        set.push({ mz: makeMaze(cols, rows, rand), pair: PAIRS[(p * per + k + o.seed) % PAIRS.length] });
      }
      sets.push(set);
    }
    const page =
      (set: (typeof sets)[number], solve: boolean): DrawPage =>
      (ctx, p) => {
        const top = header(ctx, p, theme, solve ? 'Maze answers' : 'Find the way!', solve ? 'The red line shows the way.' : set[0].pair[2], '🌀');
        const { W, H, margin: m } = p;
        const slotH = (H - m - 8 - top) / set.length;
        set.forEach(({ mz, pair }, k) => {
          const y0 = top + k * slotH;
          const es = Math.min(14, slotH * 0.12);
          const availW = W - 2 * m - 10;
          const availH = slotH - es * 2 - 8;
          const cell = Math.min(availW / mz.cols, availH / mz.rows);
          const mw = cell * mz.cols;
          const mh = cell * mz.rows;
          const x = (W - mw) / 2;
          const y = y0 + es + 4 + (availH - mh) / 2;
          emoji(ctx, pair[0], x + cell / 2, y - es / 2 - 1, es);
          emoji(ctx, pair[1], x + mw - cell / 2, y + mh + es / 2 + 1, es);
          drawMaze(ctx, mz, x, y, cell, p.inkSaver ? '#2b2d42' : theme.ink, solve);
        });
        footer(ctx, p, theme, solve ? 'Answer key' : 'Start at the top, finish at the bottom.');
      };
    const out = sets.map((s) => page(s, false));
    if (o.answerKey) out.push(...sets.map((s) => page(s, true)));
    return out;
  },
};
