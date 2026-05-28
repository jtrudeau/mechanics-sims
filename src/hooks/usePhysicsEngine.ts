import { useState, useEffect, useRef, useCallback } from 'react';

type EngineOptions = {
  onStep: (dt: number) => void;
  onReset: () => void;
  maxDt?: number;
};

export function usePhysicsEngine({ onStep, onReset, maxDt = 0.05 }: EngineOptions) {
  const [isRunning, setIsRunning] = useState(false);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  const step = useCallback((time: number) => {
    if (lastTimeRef.current != null) {
      const deltaTime = (time - lastTimeRef.current) / 1000;
      // Clamp dt to prevent massive jumps if tab is inactive
      const clampedDt = Math.min(deltaTime, maxDt);
      onStep(clampedDt);
    }
    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(step);
  }, [onStep, maxDt]);

  useEffect(() => {
    if (isRunning) {
      requestRef.current = requestAnimationFrame(step);
    } else {
      lastTimeRef.current = null; // Reset time so we don't get a huge jump when unpausing
      if (requestRef.current != null) {
        cancelAnimationFrame(requestRef.current);
      }
    }
    return () => {
      if (requestRef.current != null) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isRunning, step]);

  const toggle = () => setIsRunning(prev => !prev);
  
  const reset = () => {
    setIsRunning(false);
    lastTimeRef.current = null;
    onReset();
  };

  return { isRunning, toggle, reset };
}
