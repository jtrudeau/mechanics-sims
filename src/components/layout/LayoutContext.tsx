import { createContext, useContext } from 'react';

export type LayoutContextValue = {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean | ((prev: boolean) => boolean)) => void;
  wideCanvas: boolean;
  setWideCanvas: (v: boolean | ((prev: boolean) => boolean)) => void;
};

export const LayoutContext = createContext<LayoutContextValue | null>(null);

export function useLayout() {
  const ctx = useContext(LayoutContext);
  if (!ctx) {
    return {
      sidebarCollapsed: false,
      setSidebarCollapsed: () => {},
      wideCanvas: false,
      setWideCanvas: () => {},
    } satisfies LayoutContextValue;
  }
  return ctx;
}
