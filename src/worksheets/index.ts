import { coloring } from './coloring';
import { letters } from './letters';
import { lines } from './lines';
import { math } from './math';
import { numbers } from './numbers';
import { shapes } from './shapes';
import type { WorksheetDef } from './types';
import { words } from './words';

export const WORKSHEETS = [letters, numbers, words, math, shapes, lines, coloring] as unknown as WorksheetDef[];

export function findWorksheet(id: string): WorksheetDef | undefined {
  return WORKSHEETS.find((w) => w.id === id);
}
