import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const STORAGE_KEY = 'sn1-solutions-unlocked';

/** SHA-256 of the default passphrase (trimmed, lowercased). Override with VITE_TEACHER_UNLOCK_HASH. */
const DEFAULT_HASH = 'b4400d36cc98d345d261e622fdd137984bd2e90cb0ba7030f6ecf54632a2f922';

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function expectedHash(): string {
  const fromEnv = import.meta.env.VITE_TEACHER_UNLOCK_HASH;
  if (typeof fromEnv === 'string' && fromEnv.trim()) {
    return fromEnv.trim().toLowerCase();
  }
  return DEFAULT_HASH;
}

type TeacherUnlockContextValue = {
  unlocked: boolean;
  error: string | null;
  unlock: (passphrase: string) => Promise<boolean>;
  lock: () => void;
};

const TeacherUnlockContext = createContext<TeacherUnlockContextValue | null>(null);

export function TeacherUnlockProvider({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [error, setError] = useState<string | null>(null);

  const unlock = useCallback(async (passphrase: string) => {
    const hex = await sha256Hex(passphrase.trim().toLowerCase());
    if (hex === expectedHash()) {
      try {
        sessionStorage.setItem(STORAGE_KEY, '1');
      } catch {
        /* ignore quota / private mode */
      }
      setUnlocked(true);
      setError(null);
      return true;
    }
    setError('That passphrase did not match.');
    return false;
  }, []);

  const lock = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setUnlocked(false);
    setError(null);
  }, []);

  const value = useMemo(
    () => ({ unlocked, error, unlock, lock }),
    [unlocked, error, unlock, lock]
  );

  return (
    <TeacherUnlockContext.Provider value={value}>{children}</TeacherUnlockContext.Provider>
  );
}

export function useTeacherUnlock(): TeacherUnlockContextValue {
  const ctx = useContext(TeacherUnlockContext);
  if (!ctx) {
    throw new Error('useTeacherUnlock must be used within TeacherUnlockProvider');
  }
  return ctx;
}
