import { clocks } from './clocks';
import { coloring } from './coloring';
import { cursive } from './cursive';
import { daily } from './daily';
import { dots } from './dots';
import { letters } from './letters';
import { lines } from './lines';
import { math } from './math';
import { mazes } from './mazes';
import { money } from './money';
import { numbers } from './numbers';
import { numbersense } from './numbersense';
import { packs } from './packs';
import { patterns } from './patterns';
import { phonics } from './phonics';
import { reading } from './reading';
import { registerWorksheets } from './registry';
import { rewards } from './rewards';
import { scripts } from './scripts';
import { shapes } from './shapes';
import type { WorksheetDef } from './types';
import { words } from './words';

export const WORKSHEETS = [
  packs,
  daily,
  rewards,
  letters,
  words,
  cursive,
  scripts,
  lines,
  reading,
  phonics,
  numbers,
  math,
  numbersense,
  clocks,
  money,
  mazes,
  dots,
  patterns,
  shapes,
  coloring,
] as unknown as WorksheetDef[];

registerWorksheets(WORKSHEETS);

export function findWorksheet(id: string): WorksheetDef | undefined {
  return WORKSHEETS.find((w) => w.id === id);
}
