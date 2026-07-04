/**
 * useExpressionState – State machine hook for managing robot face emotions.
 *
 * Features:
 *   • Current emotion state with spring-transition-ready output
 *   • Queue system for rapid-fire emotion requests
 *   • Auto-transition timer (optional) – after X ms the face returns to a
 *     fallback emotion or advances to the next queued item
 *   • History ring-buffer of the last N emotions for "undo"
 *   • Transition lock to prevent overlapping transitions
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Emotion } from './expressions';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ExpressionState {
  /** The currently visible emotion. */
  currentEmotion: Emotion;
  /** Push a new emotion. It is enqueued if a transition is in progress. */
  setEmotion: (emotion: Emotion) => void;
  /** Ring-buffer of recent emotions (most recent last). */
  history: readonly Emotion[];
  /** Revert to the previous emotion in history. Returns the reverted emotion. */
  undo: () => Emotion | null;
  /** True while the component is animating between expressions. */
  isTransitioning: boolean;
  /** Number of emotions waiting in the queue. */
  queueLength: number;
  /** Clear the queue and any pending auto-transition timer. */
  flushQueue: () => void;
}

export interface UseExpressionStateOptions {
  /** Initial emotion (default `'normal'`). */
  initial?: Emotion;
  /**
   * How long the transition lock is held after a new emotion is set.
   * During this window new emotions are queued rather than applied
   * immediately. Default: 450 ms.
   */
  transitionDuration?: number;
  /** Maximum history entries kept for undo. Default: 20. */
  maxHistory?: number;
  /**
   * If set, each emotion will automatically advance after this many
   * milliseconds. Pass `null` or omit to disable auto-transitioning.
   */
  autoTransitionMs?: number | null;
  /**
   * The emotion to fall back to when an auto-transition fires and the
   * queue is empty. Default: `'normal'`.
   */
  fallbackEmotion?: Emotion;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_TRANSITION_DURATION = 450;
const DEFAULT_MAX_HISTORY = 20;
const DEFAULT_FALLBACK: Emotion = 'normal';

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useExpressionState(
  options: UseExpressionStateOptions = {},
): ExpressionState {
  const {
    initial = 'normal',
    transitionDuration = DEFAULT_TRANSITION_DURATION,
    maxHistory = DEFAULT_MAX_HISTORY,
    autoTransitionMs = null,
    fallbackEmotion = DEFAULT_FALLBACK,
  } = options;

  // ---- core state ----
  const [currentEmotion, setCurrentEmotion] = useState<Emotion>(initial);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [history, setHistory] = useState<readonly Emotion[]>([initial]);

  // ---- refs (avoid stale closures in timers) ----
  const queueRef = useRef<Emotion[]>([]);
  const lockRef = useRef(false);
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  // Track mount state to prevent state updates after unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ---- internal: clear auto-transition timer ----
  const clearAutoTimer = useCallback(() => {
    if (autoTimerRef.current !== null) {
      clearTimeout(autoTimerRef.current);
      autoTimerRef.current = null;
    }
  }, []);

  // Ref to hold the latest scheduleAutoTransition so applyEmotion can call it
  // without creating a circular dependency in useCallback deps.
  const scheduleAutoTransitionRef = useRef<() => void>(() => {});

  // ---- internal: apply an emotion (bypasses queue) ----
  const applyEmotion = useCallback(
    (emotion: Emotion) => {
      if (!mountedRef.current) return;

      // Start transition lock
      lockRef.current = true;
      setIsTransitioning(true);

      setCurrentEmotion(emotion);
      setHistory((prev) => {
        const next = [...prev, emotion];
        return next.length > maxHistory ? next.slice(next.length - maxHistory) : next;
      });

      // Release lock after transition window
      setTimeout(() => {
        lockRef.current = false;
        if (mountedRef.current) {
          setIsTransitioning(false);
        }

        // If items are waiting, apply the next one immediately
        const queued = queueRef.current.shift();
        if (queued !== undefined) {
          applyEmotion(queued);
        } else {
          scheduleAutoTransitionRef.current();
        }
      }, transitionDuration);
    },
    [maxHistory, transitionDuration],
  );

  // ---- internal: schedule auto-transition ----
  const scheduleAutoTransition = useCallback(() => {
    clearAutoTimer();
    if (autoTransitionMs == null || autoTransitionMs <= 0) return;

    autoTimerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      // If queue has items, apply next; otherwise fall back
      const next = queueRef.current.shift();
      if (next !== undefined) {
        applyEmotion(next);
      } else {
        applyEmotion(fallbackEmotion);
      }
    }, autoTransitionMs);
  }, [autoTransitionMs, fallbackEmotion, clearAutoTimer, applyEmotion]);

  // Keep the ref in sync
  useEffect(() => {
    scheduleAutoTransitionRef.current = scheduleAutoTransition;
  }, [scheduleAutoTransition]);

  // ---- public: setEmotion ----
  const setEmotion = useCallback(
    (emotion: Emotion) => {
      if (lockRef.current) {
        // A transition is in progress → enqueue
        queueRef.current.push(emotion);
        return;
      }
      applyEmotion(emotion);
    },
    [applyEmotion],
  );

  // ---- public: undo ----
  const undo = useCallback((): Emotion | null => {
    if (history.length < 2) return null;

    const previous = history[history.length - 2];
    // Rebuild history without the last entry
    setHistory((prev) => prev.slice(0, prev.length - 1));

    // Skip the transition lock so undo is always immediate
    lockRef.current = true;
    setIsTransitioning(true);
    setCurrentEmotion(previous);

    setTimeout(() => {
      lockRef.current = false;
      if (mountedRef.current) {
        setIsTransitioning(false);
      }
      scheduleAutoTransition();
    }, transitionDuration);

    return previous;
  }, [history, transitionDuration, scheduleAutoTransition]);

  // ---- public: flushQueue ----
  const flushQueue = useCallback(() => {
    queueRef.current = [];
    clearAutoTimer();
  }, [clearAutoTimer]);

  // ---- cleanup ----
  useEffect(() => {
    return () => {
      clearAutoTimer();
    };
  }, [clearAutoTimer]);

  return {
    currentEmotion,
    setEmotion,
    history,
    undo,
    isTransitioning,
    queueLength: queueRef.current.length,
    flushQueue,
  };
}
