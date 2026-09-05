import { useState, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Parses URLSearchParams against default parameters, ensuring numeric and
 * boolean values are properly cast.
 */
export function parseUrlParams<T extends Record<string, unknown>>(
  searchParams: URLSearchParams,
  defaults: T
): T {
  const result = { ...defaults };

  for (const [key, defaultVal] of Object.entries(defaults)) {
    const raw = searchParams.get(key);
    if (raw === null || raw.trim() === '') continue;

    const lower = raw.trim().toLowerCase();

    if (typeof defaultVal === 'boolean') {
      (result as Record<string, unknown>)[key] =
        lower === 'true' || lower === '1' || lower === 'yes';
      continue;
    }

    if (typeof defaultVal === 'number') {
      const num = Number(raw);
      if (Number.isFinite(num)) {
        (result as Record<string, unknown>)[key] = num;
      }
      continue;
    }

    // Default is string or enum
    (result as Record<string, unknown>)[key] = raw;
  }

  return result;
}

/**
 * Builds a query string representation of simulation parameters,
 * excluding functions or undefined values.
 */
export function serializeSimParams(params: Record<string, unknown>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || typeof v === 'function') continue;
    qs.set(k, String(v));
  }
  return qs.toString();
}

/**
 * Hook to support 2-way state sharing and URL parameter management.
 */
export function useShareLink(params: Record<string, unknown>) {
  const [copied, setCopied] = useState(false);
  const location = useLocation();

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const qs = serializeSimParams(params);
    const base = `${window.location.origin}${location.pathname}`;
    return qs ? `${base}?${qs}` : base;
  }, [params, location.pathname]);

  const copyShareLink = useCallback(async (): Promise<boolean> => {
    try {
      const qs = serializeSimParams(params);
      const newUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;

      // Update URL in address bar without causing a reload
      window.history.replaceState(null, '', newUrl);

      const fullUrl = window.location.href;
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      return true;
    } catch {
      // Fallback if clipboard API is blocked
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      return false;
    }
  }, [params]);

  return { copied, shareUrl, copyShareLink };
}
