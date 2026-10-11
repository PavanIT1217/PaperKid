import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { track } from './analytics';
import { signIn, signOutUser, watchAccount, type Account } from './firebase';
import { moveLocalToAccount, setSavedAccount } from './saved';

interface AccountState {
  account: Account | null;
  /** false until Firebase has told us whether someone is signed in */
  ready: boolean;
  /** bumps whenever the saved list may have changed (sign-in, sync) */
  version: number;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AccountState>({
  account: null,
  ready: false,
  version: 0,
  signIn: async () => undefined,
  signOut: async () => undefined,
});

export function AccountProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [ready, setReady] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(
    () =>
      watchAccount(async (a) => {
        setSavedAccount(a?.uid ?? null);
        if (a) {
          try {
            await moveLocalToAccount(a.uid);
          } catch (e) {
            console.warn('Could not sync saved worksheets', e);
          }
        }
        setAccount(a);
        setReady(true);
        setVersion((v) => v + 1);
      }),
    [],
  );

  const value: AccountState = {
    account,
    ready,
    version,
    signIn: async () => {
      try {
        await signIn();
        track('login', { method: 'google' });
      } catch (e) {
        const code = (e as { code?: string }).code ?? '';
        if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return;
        console.error(e);
        alert(
          code === 'auth/popup-blocked'
            ? 'Please allow pop-ups for this site to sign in with Google.'
            : code === 'auth/unauthorized-domain'
              ? 'Sign-in is not enabled for this web address yet.'
              : 'Sorry, sign-in did not work. Please try again.',
        );
      }
    },
    signOut: async () => {
      await signOutUser();
    },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAccount = () => useContext(Ctx);
