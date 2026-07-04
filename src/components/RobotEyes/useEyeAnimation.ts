/**
 * useEyeAnimation – Custom hook encapsulating blink timing and
 * idle micro-movement logic for the robot eyes.
 *
 * Used by RobotFace to drive auto-blink and subtle eye wander.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export interface EyeAnimationState {
  /** Whether the eye is currently in a blink. */
  isBlinking: boolean;
  /** Horizontal idle offset, normalised -1 … 1. */
  idleX: number;
  /** Vertical idle offset, normalised -1 … 1. */
  idleY: number;
}

export interface UseEyeAnimationOptions {
  /** Minimum delay between blinks in ms (default 2000). */
  minBlinkInterval?: number;
  /** Maximum delay between blinks in ms (default 6000). */
  maxBlinkInterval?: number;
  /** Blink duration in ms (default 150). */
  blinkDuration?: number;
  /** Disable idle movement (for testing). */
  disableIdle?: boolean;
  /** Disable blinking (for testing). */
  disableBlink?: boolean;
}

/** Random integer in [min, max]. */
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function useEyeAnimation(options: UseEyeAnimationOptions = {}) {
  const {
    minBlinkInterval = 2000,
    maxBlinkInterval = 6000,
    blinkDuration = 150,
    disableIdle = false,
    disableBlink = false,
  } = options;

  const [isBlinking, setIsBlinking] = useState(false);
  const [idleX, setIdleX] = useState(0);
  const [idleY, setIdleY] = useState(0);

  const blinkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleRafRef = useRef(0);
  const tRef = useRef(0);

  // ---- auto-blink ----
  useEffect(() => {
    if (disableBlink) return;

    const scheduleNext = () => {
      const delay = randInt(minBlinkInterval, maxBlinkInterval);
      blinkTimerRef.current = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), randInt(blinkDuration * 0.8, blinkDuration * 1.2));
        scheduleNext();
      }, delay);
    };

    scheduleNext();

    return () => {
      if (blinkTimerRef.current) clearTimeout(blinkTimerRef.current);
    };
  }, [disableBlink, minBlinkInterval, maxBlinkInterval, blinkDuration]);

  // ---- idle micro-movement ----
  useEffect(() => {
    if (disableIdle) return;

    let cancelled = false;

    const tick = () => {
      tRef.current += 0.012;
      const t = tRef.current;

      if (!cancelled) {
        setIdleX(
          Math.sin(t * 1.1) * 0.025 +
          Math.sin(t * 2.7) * 0.012 +
          Math.sin(t * 0.4) * 0.008
        );
        setIdleY(
          Math.cos(t * 0.9) * 0.018 +
          Math.cos(t * 3.1) * 0.009
        );
        idleRafRef.current = requestAnimationFrame(tick);
      }
    };

    idleRafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(idleRafRef.current);
    };
  }, [disableIdle]);

  /** Manually trigger a single blink. */
  const triggerBlink = useCallback(() => {
    setIsBlinking(true);
    setTimeout(() => setIsBlinking(false), blinkDuration);
  }, [blinkDuration]);

  return {
    isBlinking,
    idleX,
    idleY,
    triggerBlink,
  } satisfies EyeAnimationState & { triggerBlink: () => void };
}
