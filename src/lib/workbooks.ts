import { PACKS, buildPack } from '../worksheets/packs';
import { PAPER } from './render';
import { deleteRecord, listRecords, putRecord } from './userdata';

// "My workbooks": a pack the family downloaded, with a tick per section.
// Stored per account when signed in (users/{uid}/workbooks/{pack}), else on this device.
export interface Workbook {
  pack: string;
  title: string;
  icon: string;
  award: string;
  sections: { title: string; icon: string; pages: number }[];
  done: boolean[];
  startedAt: number;
  updatedAt: number;
}

const COLL = 'workbooks';

function fromRecord(data: Record<string, unknown>): Workbook | null {
  try {
    const sections = JSON.parse(String(data.sections ?? '[]'));
    const done = Array.isArray(data.done) ? data.done.map(Boolean) : [];
    return {
      pack: String(data.pack),
      title: String(data.title),
      icon: String(data.icon ?? '📚'),
      award: String(data.award ?? 'effort'),
      sections,
      done: sections.map((_: unknown, i: number) => Boolean(done[i])),
      startedAt: Number(data.startedAt) || 0,
      updatedAt: Number(data.updatedAt) || 0,
    };
  } catch {
    return null;
  }
}

const toRecord = (w: Workbook) => ({
  pack: w.pack,
  title: w.title,
  icon: w.icon,
  award: w.award,
  sections: JSON.stringify(w.sections),
  done: w.done,
  startedAt: w.startedAt,
  updatedAt: w.updatedAt,
});

export async function listWorkbooks(): Promise<Workbook[]> {
  const rows = await listRecords(COLL, 'updatedAt');
  return rows.map((r) => fromRecord(r.data)).filter((w): w is Workbook => !!w && !!PACKS[w.pack]);
}

/** Called after a pack PDF is downloaded/printed: adds it to My workbooks (keeps existing ticks). */
export async function startWorkbook(packId: string): Promise<Workbook> {
  const pack = PACKS[packId];
  const existing = (await listWorkbooks()).find((w) => w.pack === packId);
  if (existing) {
    const touched = { ...existing, updatedAt: Date.now() };
    await putRecord(COLL, packId, toRecord(touched));
    return touched;
  }
  const { contents } = buildPack(packId, false, PAPER.A4);
  const w: Workbook = {
    pack: packId,
    title: pack.title,
    icon: pack.icon,
    award: pack.award,
    sections: contents,
    done: contents.map(() => false),
    startedAt: Date.now(),
    updatedAt: Date.now(),
  };
  await putRecord(COLL, packId, toRecord(w));
  return w;
}

export async function saveWorkbook(w: Workbook) {
  await putRecord(COLL, w.pack, toRecord({ ...w, updatedAt: Date.now() }));
}

export async function removeWorkbook(packId: string) {
  await deleteRecord(COLL, packId);
}
