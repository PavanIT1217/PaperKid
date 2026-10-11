import type { WorksheetDef } from './types';

// Filled by ./index. Kept separate so packs can look up other worksheets
// without an import cycle (packs → index → packs).
const registry = new Map<string, WorksheetDef>();

export function registerWorksheets(list: WorksheetDef[]) {
  for (const w of list) registry.set(w.id, w);
}

export function lookupWorksheet(id: string): WorksheetDef | undefined {
  return registry.get(id);
}
