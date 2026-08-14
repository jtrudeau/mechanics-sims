import { useEffect } from 'react';

/** Sets document.title while mounted; restores previous title on unmount. */
export function usePageTitle(title: string) {
  useEffect(() => {
    const prev = document.title;
    document.title = title;
    return () => {
      document.title = prev;
    };
  }, [title]);
}
