/**
 * emotionSequences – Predefined animation sequences for the robot face.
 *
 * Each sequence is an ordered array of steps. A step is a pair of an
 * `Emotion` and a duration in milliseconds. `playSequence()` drives the
 * steps through the supplied `setEmotion` function using async/await
 * so callers can `await` completion or abort via `AbortSignal`.
 *
 * Built-in sequences:
 *   • Greeting   – warm welcome animation
 *   • Thinking   – contemplative cycle
 *   • Sleepy     – drowsy wind-down
 *   • Surprise   – startled reaction
 */

import type { Emotion } from './expressions';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SequenceStep {
  /** The emotion to display for this step. */
  emotion: Emotion;
  /** How long to hold this emotion, in milliseconds. */
  duration: number;
}

export type EmotionSequence = readonly SequenceStep[];

// ---------------------------------------------------------------------------
// Options for playSequence
// ---------------------------------------------------------------------------

export interface PlaySequenceOptions {
  /**
   * An `AbortSignal` to cancel the sequence early.
   * When aborted, the current step completes but no further steps are played.
   */
  signal?: AbortSignal;
  /**
   * Optional callback invoked after each step completes.
   * Receives the emotion that was just displayed and the step index.
   */
  onStep?: (emotion: Emotion, index: number) => void;
}

// ---------------------------------------------------------------------------
// Built-in sequences
// ---------------------------------------------------------------------------

/**
 * Greeting – normal → happy → normal.
 * A quick warm smile that settles back.
 */
export const GREETING: EmotionSequence = [
  { emotion: 'normal', duration: 300 },
  { emotion: 'happy', duration: 1200 },
  { emotion: 'normal', duration: 500 },
] as const;

/**
 * Thinking – normal → concerned → normal → excited.
 * The robot ponders, then has an "aha!" moment.
 */
export const THINKING: EmotionSequence = [
  { emotion: 'normal', duration: 400 },
  { emotion: 'concerned', duration: 1800 },
  { emotion: 'normal', duration: 600 },
  { emotion: 'excited', duration: 1000 },
  { emotion: 'normal', duration: 400 },
] as const;

/**
 * Sleepy – normal → sleepy → sleepy → normal.
 * Slow, drowsy transition that holds the sleepy state.
 */
export const SLEEPY: EmotionSequence = [
  { emotion: 'normal', duration: 500 },
  { emotion: 'sleepy', duration: 2500 },
  { emotion: 'sleepy', duration: 2000 },
  { emotion: 'normal', duration: 600 },
] as const;

/**
 * Surprise – normal → surprised → happy.
 * Quick startled reaction that resolves into delight.
 */
export const SURPRISE: EmotionSequence = [
  { emotion: 'normal', duration: 200 },
  { emotion: 'surprised', duration: 800 },
  { emotion: 'happy', duration: 1500 },
  { emotion: 'normal', duration: 400 },
] as const;

// ---------------------------------------------------------------------------
// playSequence
// ---------------------------------------------------------------------------

/**
 * Execute an emotion sequence step-by-step.
 *
 * @param sequence - The sequence of steps to play.
 * @param setEmotion - Function to set the current emotion (e.g. from
 *   `useExpressionState`).
 * @param options - Optional abort signal and per-step callback.
 * @returns A promise that resolves when the sequence completes (or is aborted).
 *
 * @example
 * ```ts
 * const controller = new AbortController();
 * await playSequence(GREETING, setEmotion, { signal: controller.signal });
 * ```
 */
export async function playSequence(
  sequence: EmotionSequence,
  setEmotion: (emotion: Emotion) => void,
  options: PlaySequenceOptions = {},
): Promise<void> {
  const { signal, onStep } = options;

  for (let i = 0; i < sequence.length; i++) {
    // Check abort before each step.
    if (signal?.aborted) break;

    const step = sequence[i]!;
    setEmotion(step.emotion);

    if (onStep) {
      onStep(step.emotion, i);
    }

    // Wait for the step duration, but respect abort.
    await new Promise<void>((resolve) => {
      if (signal?.aborted) {
        resolve();
        return;
      }

      const timer = setTimeout(() => {
        resolve();
      }, step.duration);

      // If the signal aborts during the wait, clear the timer and resolve.
      signal?.addEventListener(
        'abort',
        () => {
          clearTimeout(timer);
          resolve();
        },
        { once: true },
      );
    });
  }
}

// ---------------------------------------------------------------------------
// Sequences registry (for discovery / random pick)
// ---------------------------------------------------------------------------

/** All built-in sequences, keyed by name. */
export const SEQUENCES = {
  greeting: GREETING,
  thinking: THINKING,
  sleepy: SLEEPY,
  surprise: SURPRISE,
} as const;

/** Names of all built-in sequences. */
export type SequenceName = keyof typeof SEQUENCES;

/**
 * Look up a built-in sequence by name.
 *
 * @example
 * ```ts
 * const seq = getSequence('greeting');
 * await playSequence(seq, setEmotion);
 * ```
 */
export function getSequence(name: SequenceName): EmotionSequence {
  return SEQUENCES[name];
}

/**
 * Pick a random built-in sequence.
 */
export function getRandomSequence(): EmotionSequence {
  const names = Object.keys(SEQUENCES) as SequenceName[];
  return SEQUENCES[names[Math.floor(Math.random() * names.length)]!];
}
