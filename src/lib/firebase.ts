// Google sign-in + Firestore sync for saved worksheets.
// The Firebase SDK is loaded on demand so the first page load stays small.
import type { User } from 'firebase/auth';

// Web config is public by design (it ships in every Firebase web app);
// access is protected by Firestore security rules (see firestore.rules).
const firebaseConfig = {
  apiKey: 'AIzaSyBuJ1AFsaXt5S9rkPrwoypLD9LBUmk1HTE',
  authDomain: 'paperkid.firebaseapp.com',
  projectId: 'paperkid',
  storageBucket: 'paperkid.firebasestorage.app',
  messagingSenderId: '341119612269',
  appId: '1:341119612269:web:91f015bda0b1aee81f1664',
};

export interface Account {
  uid: string;
  name: string;
  email: string;
  photo: string | null;
}

export interface RemoteSheet {
  key: string;
  id: string;
  name: string;
  icon: string;
  opts: Record<string, unknown>;
  savedAt: number;
}

type Sdk = {
  auth: typeof import('firebase/auth');
  fs: typeof import('firebase/firestore');
  app: import('firebase/app').FirebaseApp;
};

let sdkPromise: Promise<Sdk> | null = null;

function sdk(): Promise<Sdk> {
  sdkPromise ??= (async () => {
    const [appMod, auth, fs] = await Promise.all([import('firebase/app'), import('firebase/auth'), import('firebase/firestore')]);
    const app = appMod.getApps()[0] ?? appMod.initializeApp(firebaseConfig);
    return { app, auth, fs };
  })();
  return sdkPromise;
}

const toAccount = (u: User): Account => ({
  uid: u.uid,
  name: u.displayName ?? u.email ?? 'Signed in',
  email: u.email ?? '',
  photo: u.photoURL,
});

/** Calls `cb` with the signed-in account (or null) now and whenever it changes. */
export function watchAccount(cb: (a: Account | null) => void): () => void {
  let unsub: (() => void) | null = null;
  let cancelled = false;
  sdk()
    .then(({ app, auth }) => {
      if (cancelled) return;
      unsub = auth.onAuthStateChanged(auth.getAuth(app), (u) => cb(u ? toAccount(u) : null));
    })
    .catch(() => cb(null));
  return () => {
    cancelled = true;
    unsub?.();
  };
}

export async function signIn(): Promise<Account> {
  const { app, auth } = await sdk();
  const provider = new auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const res = await auth.signInWithPopup(auth.getAuth(app), provider);
  return toAccount(res.user);
}

export async function signOutUser() {
  const { app, auth } = await sdk();
  await auth.signOut(auth.getAuth(app));
}

// ---------------------------------------------------------------- saved worksheets
// users/{uid}/saved/{key} = { id, name, icon, opts (JSON string), savedAt }

export async function listRemote(uid: string): Promise<RemoteSheet[]> {
  const { app, fs } = await sdk();
  const db = fs.getFirestore(app);
  const snap = await fs.getDocs(fs.query(fs.collection(db, 'users', uid, 'saved'), fs.orderBy('savedAt', 'desc')));
  const out: RemoteSheet[] = [];
  snap.forEach((d) => {
    const v = d.data();
    let opts: Record<string, unknown> = {};
    try {
      opts = JSON.parse(String(v.opts ?? '{}'));
    } catch {
      /* keep defaults */
    }
    out.push({ key: d.id, id: String(v.id), name: String(v.name), icon: String(v.icon ?? '📄'), opts, savedAt: Number(v.savedAt) || 0 });
  });
  return out;
}

export async function putRemote(uid: string, s: RemoteSheet[]) {
  if (!s.length) return;
  const { app, fs } = await sdk();
  const db = fs.getFirestore(app);
  const batch = fs.writeBatch(db);
  for (const x of s) {
    batch.set(fs.doc(db, 'users', uid, 'saved', x.key), {
      id: x.id,
      name: x.name.slice(0, 80),
      icon: x.icon.slice(0, 8),
      opts: JSON.stringify(x.opts),
      savedAt: x.savedAt,
    });
  }
  await batch.commit();
}

export async function deleteRemote(uid: string, key: string) {
  const { app, fs } = await sdk();
  await fs.deleteDoc(fs.doc(fs.getFirestore(app), 'users', uid, 'saved', key));
}
