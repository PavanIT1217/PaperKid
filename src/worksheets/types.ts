import type { Ctx, PageInfo, Theme } from '../lib/draw';

export type DrawPage = (ctx: Ctx, p: PageInfo) => void;

export interface Paper {
  W: number;
  H: number;
  margin: number;
}

export interface Choice {
  value: string;
  label: string;
}

interface FieldBase {
  key: string;
  label: string;
  hint?: string;
  /** Hide the field unless this returns true for the current options. */
  when?: (o: Record<string, unknown>) => boolean;
}

export type Field =
  | (FieldBase & { type: 'select'; options: Choice[] })
  | (FieldBase & { type: 'segmented'; options: Choice[] })
  | (FieldBase & { type: 'toggle' })
  | (FieldBase & { type: 'number'; min: number; max: number })
  | (FieldBase & { type: 'text'; placeholder?: string; multiline?: boolean })
  | (FieldBase & { type: 'chips'; options: Choice[]; compact?: boolean })
  | (FieldBase & { type: 'reroll' });

export interface WorksheetDef<O extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  title: string;
  icon: string;
  blurb: string;
  grades: string;
  theme: Theme;
  defaults: O;
  fields: Field[];
  build: (opts: O, paper: Paper) => DrawPage[];
  /** File name stem for downloads. */
  fileName: (opts: O) => string;
}

export const SIZE_FIELD: Field = {
  type: 'segmented',
  key: 'size',
  label: 'Writing size',
  options: [
    { value: 'large', label: 'Large (Pre-K/K)' },
    { value: 'medium', label: 'Medium (Grade 1)' },
    { value: 'small', label: 'Small (Grade 2–3)' },
  ],
};

/** Cap height in mm for each writing size. */
export function capFor(size: unknown): number {
  return size === 'small' ? 9 : size === 'medium' ? 13 : 18;
}

/**
 * How many practice rows fit between `top` and `bottom`, and the pitch that spreads them evenly.
 * `rowH` is the inked height of one row (cap × 1.5 with descender space).
 */
export function fitRows(top: number, bottom: number, cap: number, rowH = cap * 1.5) {
  const gap = Math.max(4, cap * 0.45);
  const avail = bottom - top;
  const rows = Math.max(1, Math.floor((avail + gap) / (rowH + gap)));
  const pitch = rows > 1 ? Math.min((avail - rowH) / (rows - 1), (rowH + gap) * 1.25) : rowH + gap;
  return { rows, pitch };
}

/** Vertical space a practice row needs (guide lines + descender + gap). */
export function rowPitch(cap: number): number {
  return cap * 1.5 + Math.max(4, cap * 0.45);
}
