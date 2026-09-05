import { useState, useEffect, useRef, useCallback } from 'react';

export type EngineOptions = {
  onStep: (dt: number) => void;
  onReset: () => void;
  maxDt?: number;
  initialRunning?: boolean;
  fixedDt?: number;
  maxSubSteps?: number;
};

export function usePhysicsEngine({
  onStep,
  onReset,
  maxDt = 0.05,
  initialRunning = false,
  fixedDt,
  maxSubSteps = 10,
}: EngineOptions) {
  const [isRunning, setIsRunning] = useState(initialRunning);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const accumulatorRef = useRef<number>(0);

  const step = useCallback(
    (time: number) => {
      if (lastTimeRef.current != null) {
        const deltaTime = (time - lastTimeRef.current) / 1000;
        // Clamp dt to prevent massive jumps if tab is inactive
        const clampedDt = Math.min(deltaTime, maxDt);

        if (fixedDt && fixedDt > 0) {
          accumulatorRef.current += clampedDt;
          let subSteps = 0;
          while (accumulatorRef.current >= fixedDt && subSteps < maxSubSteps) {
            onStep(fixedDt);
            accumulatorRef.current -= fixedDt;
            subSteps++;
          }
          // Drain excess accumulator to guard against spiral of death
          if (accumulatorRef.current > fixedDt * 2) {
            accumulatorRef.current = 0;
          }
        } else {
          onStep(clampedDt);
        }
      }
      lastTimeRef.current = time;
      requestRef.current = requestAnimationFrame(step);
    },
    [onStep, maxDt, fixedDt, maxSubSteps]
  );

  useEffect(() => {
    if (isRunning) {
      requestRef.current = requestAnimationFrame(step);
    } else {
      lastTimeRef.current = null;
      accumulatorRef.current = 0;
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

  const toggle = () => setIsRunning((prev) => !prev);

  const reset = () => {
    setIsRunning(false);
    lastTimeRef.current = null;
    accumulatorRef.current = 0;
    onReset();
  };

  const stepForward = (dt = 0.05) => {
    setIsRunning(false);
    lastTimeRef.current = null;
    accumulatorRef.current = 0;
    onStep(dt);
  };

  const start = () => setIsRunning(true);
  const pause = () => setIsRunning(false);

  return { isRunning, toggle, reset, stepForward, start, pause };
}
