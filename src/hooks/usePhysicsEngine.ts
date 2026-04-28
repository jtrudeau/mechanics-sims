import { useState, useEffect, useRef, useCallback } from 'react';

type EngineOptions = {
  onStep: (dt: number) => void;
  onReset: () => void;
  maxDt?: number;
};

export function usePhysicsEngine({ onStep, onReset, maxDt = 0.05 }: EngineOptions) {
  const [isRunning, setIsRunning] = useState(false);
  const requestRef = useRef<number>();
  const lastTimeRef = useRef<number>();

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
      lastTimeRef.current = undefined; // Reset time so we don't get a huge jump when unpausing
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isRunning, step]);

  const toggle = () => setIsRunning(prev => !prev);
  
  const reset = () => {
    setIsRunning(false);
    lastTimeRef.current = undefined;
    onReset();
  };

  return { isRunning, toggle, reset };
}
