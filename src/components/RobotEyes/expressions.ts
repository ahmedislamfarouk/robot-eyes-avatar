/**
 * Expression definitions — CSS border-radius shapes.
 *
 * Each emotion = different border-radius = different eye shape.
 * Framer-motion smoothly interpolates between border-radius values.
 */

export type Emotion =
  | 'concerned'
  | 'normal'
  | 'happy'
  | 'sleepy'
  | 'excited'
  | 'surprised';

export interface EyeState {
  scaleY: number;
  scaleX: number;
  borderRadius: string;  // CSS border-radius — drives the shape
  glowIntensity: number;
  glowColor: string;
}

export interface Expression {
  name: string;
  leftEye: EyeState;
  rightEye: EyeState;
}

const CYAN = '#00d4ff';
const CYAN_DIM = '#0099cc';

const BASE: EyeState = {
  scaleY: 1,
  scaleX: 1,
  borderRadius: '12px',
  glowIntensity: 0.8,
  glowColor: CYAN,
};

export const expressions: Record<Emotion, Expression> = {
  // Square-ish rectangles — neutral
  normal: {
    name: 'normal',
    leftEye: { ...BASE },
    rightEye: { ...BASE },
  },

  // Tilted parallelogram — worried
  concerned: {
    name: 'concerned',
    leftEye: {
      ...BASE,
      scaleY: 0.8,
      scaleX: 0.9,
      borderRadius: '8px 20px 8px 20px',  // tilted corners
      glowIntensity: 0.5,
      glowColor: CYAN_DIM,
    },
    rightEye: {
      ...BASE,
      scaleY: 0.8,
      scaleX: 0.9,
      borderRadius: '20px 8px 20px 8px',  // mirrored tilt
      glowIntensity: 0.5,
      glowColor: CYAN_DIM,
    },
  },

  // Curved upward — smile/happy (leaf shape)
  happy: {
    name: 'happy',
    leftEye: {
      ...BASE,
      scaleY: 0.7,
      scaleX: 1.05,
      borderRadius: '50% 50% 50% 50% / 80% 80% 20% 20%',  // curved top, flat bottom
      glowIntensity: 1,
      glowColor: CYAN,
    },
    rightEye: {
      ...BASE,
      scaleY: 0.7,
      scaleX: 1.05,
      borderRadius: '50% 50% 50% 50% / 80% 80% 20% 20%',
      glowIntensity: 1,
      glowColor: CYAN,
    },
  },

  // Thin horizontal lines — drowsy
  sleepy: {
    name: 'sleepy',
    leftEye: {
      ...BASE,
      scaleY: 0.3,
      scaleX: 0.85,
      borderRadius: '50%',  // pill shape
      glowIntensity: 0.2,
      glowColor: CYAN_DIM,
    },
    rightEye: {
      ...BASE,
      scaleY: 0.3,
      scaleX: 0.85,
      borderRadius: '50%',
      glowIntensity: 0.2,
      glowColor: CYAN_DIM,
    },
  },

  // Wide tall rectangles — alert
  excited: {
    name: 'excited',
    leftEye: {
      ...BASE,
      scaleY: 1.2,
      scaleX: 1.1,
      borderRadius: '6px 6px 6px 6px',  // sharp corners = wide awake
      glowIntensity: 1,
      glowColor: CYAN,
    },
    rightEye: {
      ...BASE,
      scaleY: 1.2,
      scaleX: 1.1,
      borderRadius: '6px 6px 6px 6px',
      glowIntensity: 1,
      glowColor: CYAN,
    },
  },

  // Perfect circles — O shape
  surprised: {
    name: 'surprised',
    leftEye: {
      ...BASE,
      scaleY: 1,
      scaleX: 1,
      borderRadius: '50%',  // circle
      glowIntensity: 1,
      glowColor: CYAN,
    },
    rightEye: {
      ...BASE,
      scaleY: 1,
      scaleX: 1,
      borderRadius: '50%',
      glowIntensity: 1,
      glowColor: CYAN,
    },
  },
};

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function lerpEyeState(a: EyeState, b: EyeState, t: number): EyeState {
  return {
    scaleY: lerp(a.scaleY, b.scaleY, t),
    scaleX: lerp(a.scaleX, b.scaleX, t),
    borderRadius: t < 0.5 ? a.borderRadius : b.borderRadius,
    glowIntensity: lerp(a.glowIntensity, b.glowIntensity, t),
    glowColor: t < 0.5 ? a.glowColor : b.glowColor,
  };
}
