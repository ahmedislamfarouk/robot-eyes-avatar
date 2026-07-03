/**
 * useAutoExpressions – Auto-play hook that cycles through emotions for demos.
 *
 * Features:
 *   • Random timing between transitions (configurable range)
 *   • Pause / resume / toggle
 *   • Optional idle micro-expressions (subtle pupil drift + occasional
 *     quick-blink) layered on top of the base expression cycle
 *   • Configurable emotion pool (defaults to all available emotions)
 *
 * Usage:
 *   const { isPlaying, play, pause, toggle } = useAutoExpressions({
 *     setEmotion: stateMachine.setEmotion,
 *     interval: [2000, 5000],
 *     idleMicro: true,
 *   });
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Emotion } from './expressions';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseAutoExpressionsOptions {
  /**
   * The `setEmotion` function from `useExpressionState` (or any
   * `(emotion: Emotion) => void`).
   */
  setEmotion: (emotion: Emotion) => void;
  /**
   * Min/max interval between automatic transitions, in milliseconds.
   * Default: [2000, 5000].
   */
  interval?: [number, number];
  /**
   * Pool of emotions to randomly cycle through.
   * Default: all six emotions.
   */
  emotions?: readonly Emotion[];
  /**
   * Start playing immediately on mount. Default: false.
   */
  autoStart?: boolean;
  /**
   * Enable idle micro-expressions – subtle pupil movements and
   * occasional blinks layered on top of the current expression.
   * Default: false.
   */
  idleMicro?: boolean;
  /**
   * Minimum delay between idle micro-expressions in ms.
   * Default: 4000.
   */
  idleMinInterval?: number;
  /**
   * Maximum delay between idle micro-expressions in ms.
   * Default: 9000.
   */
  idleMaxInterval?: number;
}

export interface AutoExpressionsState {
  /** Whether the auto-cycler is currently running. */
  isPlaying: boolean;
  /** Start (or resume) auto-cycling. */
  play: () => void;
  /** Pause auto-cycling. */
  pause: () => void;
  /** Toggle between play/pause. */
  toggle: () => void;
  /** The number of transitions that have fired. */
  transitionCount: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_INTERVAL: [number, number] = [2000, 5000];
const DEFAULT_EMOTIONS: readonly Emotion[] = [
  'normal',
  'happy',
  'excited',
  'surprised',
  'concerned',
  'sleepy',
];
const DEFAULT_IDLE_MIN = 4000;
const DEFAULT_IDLE_MAX = 9000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAutoExpressions(
  options: UseAutoExpressionsOptions,
): AutoExpressionsState {
  const {
    setEmotion,
    interval = DEFAULT_INTERVAL,
    emotions = DEFAULT_EMOTIONS,
    autoStart = false,
    idleMicro = false,
    idleMinInterval = DEFAULT_IDLE_MIN,
    idleMaxInterval = DEFAULT_IDLE_MAX,
  } = options;

  const [isPlaying, setIsPlaying] = useState(autoStart);
  const [transitionCount, setTransitionCount] = useState(0);

  // Refs for stable access in timers
  const isPlayingRef = useRef(autoStart);
  const setEmotionRef = useRef(setEmotion);
  const cycleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const lastEmotionRef = useRef<Emotion>('normal');

  // Keep refs in sync
  useEffect(() => {
    setEmotionRef.current = setEmotion;
  }, [setEmotion]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ---- clear all timers ----
  const clearTimers = useCallback(() => {
    if (cycleTimerRef.current !== null) {
      clearTimeout(cycleTimerRef.current);
      cycleTimerRef.current = null;
    }
    if (idleTimerRef.current !== null) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  // ---- cycle: pick next emotion, schedule next ----
  const cycleOnce = useCallback(() => {
    if (!mountedRef.current || !isPlayingRef.current) return;

    // Pick an emotion different from the current one.
    let next = pickRandom(emotions);
    let attempts = 0;
    while (next === lastEmotionRef.current && attempts < 8) {
      next = pickRandom(emotions);
      attempts++;
    }

    lastEmotionRef.current = next;
    setEmotionRef.current(next);

    if (mountedRef.current) {
      setTransitionCount((c) => c + 1);
    }

    // Schedule next cycle with random delay.
    const delay = randInt(interval[0], interval[1]);
    cycleTimerRef.current = setTimeout(() => {
      cycleOnce();
    }, delay);
  }, [emotions, interval]);

  // ---- start cycle loop ----
  const startCycle = useCallback(() => {
    clearTimers();
    // Immediate first transition
    cycleOnce();
  }, [cycleOnce, clearTimers]);

  // ---- idle micro-expression scheduler ----
  const scheduleIdleMicro = useCallback(() => {
    if (!idleMicro) return;

    const delay = randInt(idleMinInterval, idleMaxInterval);
    idleTimerRef.current = setTimeout(() => {
      if (!mountedRef.current || !isPlayingRef.current) return;

      // 50% chance: subtle pupil drift, 50% chance: quick blink
      if (Math.random() < 0.5) {
        // Quick double-blink: set to current, blink twice rapidly
        // The Eye component handles blink timing, so we just
        // set the same emotion to trigger a re-render cycle.
        setEmotionRef.current(lastEmotionRef.current);
      }
      // else: just a no-op beat – the Eye component's built-in
      // idle movement handles the visual.

      scheduleIdleMicro();
    }, delay);
  }, [idleMicro, idleMinInterval, idleMaxInterval]);

  // ---- play / pause / toggle ----
  const play = useCallback(() => {
    if (isPlayingRef.current) return;
    isPlayingRef.current = true;
    setIsPlaying(true);
    startCycle();
    scheduleIdleMicro();
  }, [startCycle, scheduleIdleMicro]);

  const pause = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    clearTimers();
  }, [clearTimers]);

  const toggle = useCallback(() => {
    if (isPlayingRef.current) {
      pause();
    } else {
      play();
    }
  }, [play, pause]);

  // ---- auto-start effect ----
  useEffect(() => {
    if (autoStart) {
      play();
    }
    return () => {
      clearTimers();
    };
    // We intentionally only run this on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isPlaying,
    play,
    pause,
    toggle,
    transitionCount,
  };
}
