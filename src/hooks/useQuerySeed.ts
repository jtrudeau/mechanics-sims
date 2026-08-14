import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Read URL query params into a partial object of numbers/booleans/strings.
 * Booleans: "1"/"true"/"yes" → true; "0"/"false"/"no" → false.
 */
export function useQuerySeed<T extends Record<string, unknown>>(
  keys: (keyof T & string)[]
): Partial<T> {
  const [searchParams] = useSearchParams();

  return useMemo(() => {
    const out: Partial<T> = {};
    for (const key of keys) {
      const raw = searchParams.get(key);
      if (raw === null || raw === '') continue;
      const lower = raw.toLowerCase();
      if (lower === 'true' || lower === '1' || lower === 'yes') {
        (out as Record<string, unknown>)[key] = true;
        continue;
      }
      if (lower === 'false' || lower === '0' || lower === 'no') {
        (out as Record<string, unknown>)[key] = false;
        continue;
      }
      const num = Number(raw);
      if (!Number.isNaN(num) && raw.trim() !== '') {
        (out as Record<string, unknown>)[key] = num;
        continue;
      }
      (out as Record<string, unknown>)[key] = raw;
    }
    return out;
  }, [searchParams, keys.join('|')]);
}

export function useQuizMode(): boolean {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('quiz');
  return q === '1' || q === 'true';
}

/** Build a sim path with optional query seed params. */
export function simPathWithParams(
  simPath: string,
  params?: Record<string, string | number | boolean>
): string {
  if (!params || Object.keys(params).length === 0) return simPath;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    qs.set(k, String(v));
  }
  const s = qs.toString();
  return s ? `${simPath}?${s}` : simPath;
}
