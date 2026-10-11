import { load, save } from './storage';

// "My saved worksheets" – kept in this browser for now. When sign-in is added these can sync.
export interface SavedSheet {
  key: string;
  id: string;
  name: string;
  icon: string;
  opts: Record<string, unknown>;
  savedAt: number;
}

export function listSaved(): SavedSheet[] {
  const v = load<SavedSheet[]>('saved', []);
  return Array.isArray(v) ? v : [];
}

export function addSaved(s: Omit<SavedSheet, 'key' | 'savedAt'>): SavedSheet[] {
  const list = [{ ...s, key: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, savedAt: Date.now() }, ...listSaved()].slice(0, 50);
  save('saved', list);
  return list;
}

export function removeSaved(key: string): SavedSheet[] {
  const list = listSaved().filter((s) => s.key !== key);
  save('saved', list);
  return list;
}
