import { deleteRemote, listRemote, putRemote } from './firebase';
import { load, save } from './storage';

// "My saved worksheets": in Firestore when signed in (synced across devices),
// otherwise in this browser. Signing in moves this browser's list into the account.
export interface SavedSheet {
  key: string;
  id: string;
  name: string;
  icon: string;
  opts: Record<string, unknown>;
  savedAt: number;
}

let uid: string | null = null;
export function setSavedAccount(u: string | null) {
  uid = u;
}
export function getSavedAccount(): string | null {
  return uid;
}

function listLocal(): SavedSheet[] {
  const v = load<SavedSheet[]>('saved', []);
  return Array.isArray(v) ? v : [];
}

export async function listSaved(): Promise<SavedSheet[]> {
  return uid ? listRemote(uid) : listLocal();
}

export async function addSaved(s: Omit<SavedSheet, 'key' | 'savedAt'>): Promise<void> {
  const sheet: SavedSheet = { ...s, key: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, savedAt: Date.now() };
  if (uid) await putRemote(uid, [sheet]);
  else save('saved', [sheet, ...listLocal()].slice(0, 50));
}

export async function removeSaved(key: string): Promise<void> {
  if (uid) await deleteRemote(uid, key);
  else save('saved', listLocal().filter((s) => s.key !== key));
}

/** After sign-in: upload anything saved on this device, then clear the local copy. */
export async function moveLocalToAccount(account: string): Promise<number> {
  const local = listLocal();
  if (!local.length) return 0;
  await putRemote(account, local);
  save('saved', []);
  return local.length;
}
