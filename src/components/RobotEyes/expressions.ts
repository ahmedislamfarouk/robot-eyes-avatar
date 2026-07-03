/**
 * Expression definitions for the robot face avatar.
 *
 * Each expression maps to a pair of EyeState objects (left + right)
 * and an optional mouth SVG path. Transitions between expressions
 * are driven by framer-motion spring animations in the Eye component.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Emotion =
  | 'concerned'
  | 'normal'
  | 'happy'
  | 'sleepy'
  | 'excited'
  | 'surprised';

export interface EyeState {
  /** Vertical scale – 0 = fully closed, 1 = fully open. */
  scaleY: number;
  /** Horizontal scale multiplier (1 = default width). */
  scaleX: number;
  /** SVG border-radius string applied to the outer eye shape. */
  borderRadius: string;
  /** Horizontal pupil offset, normalised -1 … 1. */
  pupilX: number;
  /** Vertical pupil offset, normalised -1 … 1. */
  pupilY: number;
  /** Pupil size multiplier (1 = default). */
  pupilScale: number;
  /** Eyebrow vertical offset from centre (px). Negative = up. */
  eyebrowY: number;
  /** Eyebrow rotation in degrees. Positive = outer edge raised. */
  eyebrowRotation: number;
  /** Glow opacity 0 … 1. */
  glowIntensity: number;
  /** CSS colour used for the eye glow (hex or named). */
  glowColor: string;
}

export interface Expression {
  name: string;
  leftEye: EyeState;
  rightEye: EyeState;
  /** Optional mouth SVG path (drawn relative to a 200×60 viewBox). */
  mouth?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CYAN = '#00d4ff';
const CYAN_DIM = '#0099cc';

/** Shared "default" values that every expression inherits from. */
const BASE_EYE: EyeState = {
  scaleY: 1,
  scaleX: 1,
  borderRadius: '50%',
  pupilX: 0,
  pupilY: 0,
  pupilScale: 1,
  eyebrowY: 0,
  eyebrowRotation: 0,
  glowIntensity: 0.8,
  glowColor: CYAN,
};

// ---------------------------------------------------------------------------
// Expressions
// ---------------------------------------------------------------------------

export const expressions: Record<Emotion, Expression> = {
  normal: {
    name: 'normal',
    leftEye: { ...BASE_EYE },
    rightEye: { ...BASE_EYE },
  },

  concerned: {
    name: 'concerned',
    leftEye: {
      ...BASE_EYE,
      scaleY: 0.75,
      scaleX: 0.95,
      borderRadius: '50% 50% 45% 45%',
      pupilY: 0.1,
      eyebrowY: 4,
      eyebrowRotation: 12,
      glowIntensity: 0.5,
      glowColor: CYAN_DIM,
    },
    rightEye: {
      ...BASE_EYE,
      scaleY: 0.75,
      scaleX: 0.95,
      borderRadius: '50% 50% 45% 45%',
      pupilY: 0.1,
      eyebrowY: 4,
      eyebrowRotation: -12,
      glowIntensity: 0.5,
      glowColor: CYAN_DIM,
    },
  },

  happy: {
    name: 'happy',
    leftEye: {
      ...BASE_EYE,
      scaleY: 0.55,
      scaleX: 1.05,
      borderRadius: '50% 50% 50% 50%',
      pupilY: -0.05,
      eyebrowY: -6,
      eyebrowRotation: 5,
      glowIntensity: 1,
      glowColor: CYAN,
    },
    rightEye: {
      ...BASE_EYE,
      scaleY: 0.55,
      scaleX: 1.05,
      borderRadius: '50% 50% 50% 50%',
      pupilY: -0.05,
      eyebrowY: -6,
      eyebrowRotation: -5,
      glowIntensity: 1,
      glowColor: CYAN,
    },
    mouth: 'M 40 10 Q 100 50 160 10',
  },

  sleepy: {
    name: 'sleepy',
    leftEye: {
      ...BASE_EYE,
      scaleY: 0.2,
      scaleX: 0.9,
      borderRadius: '50%',
      pupilY: 0.3,
      eyebrowY: 6,
      eyebrowRotation: 8,
      glowIntensity: 0.2,
      glowColor: CYAN_DIM,
    },
    rightEye: {
      ...BASE_EYE,
      scaleY: 0.2,
      scaleX: 0.9,
      borderRadius: '50%',
      pupilY: 0.3,
      eyebrowY: 6,
      eyebrowRotation: -8,
      glowIntensity: 0.2,
      glowColor: CYAN_DIM,
    },
  },

  excited: {
    name: 'excited',
    leftEye: {
      ...BASE_EYE,
      scaleY: 1.15,
      scaleX: 1.1,
      borderRadius: '50%',
      pupilY: -0.1,
      pupilScale: 1.2,
      eyebrowY: -10,
      eyebrowRotation: 4,
      glowIntensity: 1,
      glowColor: CYAN,
    },
    rightEye: {
      ...BASE_EYE,
      scaleY: 1.15,
      scaleX: 1.1,
      borderRadius: '50%',
      pupilY: -0.1,
      pupilScale: 1.2,
      eyebrowY: -10,
      eyebrowRotation: -4,
      glowIntensity: 1,
      glowColor: CYAN,
    },
  },

  surprised: {
    name: 'surprised',
    leftEye: {
      ...BASE_EYE,
      scaleY: 1.2,
      scaleX: 1.15,
      borderRadius: '50%',
      pupilScale: 0.7,
      pupilY: -0.05,
      eyebrowY: -12,
      eyebrowRotation: 2,
      glowIntensity: 1,
      glowColor: CYAN,
    },
    rightEye: {
      ...BASE_EYE,
      scaleY: 1.2,
      scaleX: 1.15,
      borderRadius: '50%',
      pupilScale: 0.7,
      pupilY: -0.05,
      eyebrowY: -12,
      eyebrowRotation: -2,
      glowIntensity: 1,
      glowColor: CYAN,
    },
    mouth: 'M 80 20 Q 100 45 120 20',
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Linearly interpolate between two numbers. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Clamp a number between min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Merge two EyeState objects per a 0–1 factor (0 = a, 1 = b). */
export function lerpEyeState(a: EyeState, b: EyeState, t: number): EyeState {
  return {
    scaleY: lerp(a.scaleY, b.scaleY, t),
    scaleX: lerp(a.scaleX, b.scaleX, t),
    borderRadius: t < 0.5 ? a.borderRadius : b.borderRadius,
    pupilX: lerp(a.pupilX, b.pupilX, t),
    pupilY: lerp(a.pupilY, b.pupilY, t),
    pupilScale: lerp(a.pupilScale, b.pupilScale, t),
    eyebrowY: lerp(a.eyebrowY, b.eyebrowY, t),
    eyebrowRotation: lerp(a.eyebrowRotation, b.eyebrowRotation, t),
    glowIntensity: lerp(a.glowIntensity, b.glowIntensity, t),
    glowColor: t < 0.5 ? a.glowColor : b.glowColor,
  };
}
