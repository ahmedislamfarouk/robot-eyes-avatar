/**
 * Eye — CSS div with animated border-radius.
 *
 * Different border-radius values = different shapes.
 * Framer-motion can smoothly interpolate border-radius between states.
 */

import { motion, useSpring } from 'framer-motion';
import type { EyeState } from './expressions';

export interface EyeProps {
  state: EyeState;
  isBlinking: boolean;
  size?: number;
}

const SPRING = { stiffness: 80, damping: 14, mass: 1.2 };

export default function Eye({ state, isBlinking, size = 120 }: EyeProps) {
  const scaleY = useSpring(state.scaleY, SPRING);
  const scaleX = useSpring(state.scaleX, SPRING);
  const glow = useSpring(state.glowIntensity, SPRING);

  scaleY.set(isBlinking ? 0.05 : state.scaleY);
  scaleX.set(state.scaleX);
  glow.set(state.glowIntensity);

  const eyeW = size * 0.85;
  const eyeH = size * 0.65;

  return (
    <motion.div
      style={{
        width: eyeW,
        height: eyeH,
        backgroundColor: state.glowColor,
        borderRadius: state.borderRadius,
        scaleY,
        scaleX,
        boxShadow: glow.get() > 0.1
          ? `0 0 ${20 * glow.get()}px ${state.glowColor}, 0 0 ${40 * glow.get()}px ${state.glowColor}40`
          : 'none',
        opacity: glow,
      }}
      transition={{ type: 'spring', stiffness: 180, damping: 20 }}
    />
  );
}
