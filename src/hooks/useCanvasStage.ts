import { useEffect, useState, type RefObject } from 'react';

/** Bumps when the canvas parent is resized so draw effects re-run at the new size. */
export function useCanvasStage(canvasRef: RefObject<HTMLCanvasElement | null>) {
  const [gen, setGen] = useState(0);
  useEffect(() => {
    const el = canvasRef.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver(() => setGen((g) => g + 1));
    ro.observe(el);
    return () => ro.disconnect();
  }, [canvasRef]);
  return gen;
}
