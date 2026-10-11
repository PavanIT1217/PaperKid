import { deleteUserDoc, getUserDoc, listUserDocs, setUserDoc } from './firebase';
import { getSavedAccount } from './saved';
import { load, save } from './storage';

// Small per-user records (workbook progress, daily-practice position).
// Signed in → Firestore users/{uid}/{coll}/{id}; otherwise this browser.

const localKey = (coll: string) => `ud:${coll}`;

function localColl(coll: string): Record<string, Record<string, unknown>> {
  const v = load<Record<string, Record<string, unknown>>>(localKey(coll), {});
  return v && typeof v === 'object' ? v : {};
}

export async function getRecord(coll: string, id: string): Promise<Record<string, unknown> | null> {
  const uid = getSavedAccount();
  if (uid) return getUserDoc(uid, coll, id);
  return localColl(coll)[id] ?? null;
}

export async function putRecord(coll: string, id: string, data: Record<string, unknown>) {
  const uid = getSavedAccount();
  if (uid) return setUserDoc(uid, coll, id, data);
  save(localKey(coll), { ...localColl(coll), [id]: data });
}

export async function deleteRecord(coll: string, id: string) {
  const uid = getSavedAccount();
  if (uid) return deleteUserDoc(uid, coll, id);
  const all = localColl(coll);
  delete all[id];
  save(localKey(coll), all);
}

export async function listRecords(coll: string, order: string): Promise<{ id: string; data: Record<string, unknown> }[]> {
  const uid = getSavedAccount();
  if (uid) return listUserDocs(uid, coll, order);
  return Object.entries(localColl(coll))
    .map(([id, data]) => ({ id, data }))
    .sort((a, b) => Number(b.data[order] ?? 0) - Number(a.data[order] ?? 0));
}

/** After sign-in: copy this browser's records into the account (account wins on conflicts). */
export async function moveLocalRecords(uid: string, colls: string[]) {
  for (const coll of colls) {
    const all = localColl(coll);
    for (const [id, data] of Object.entries(all)) {
      const existing = await getUserDoc(uid, coll, id);
      if (!existing) await setUserDoc(uid, coll, id, data);
    }
    save(localKey(coll), {});
  }
}
