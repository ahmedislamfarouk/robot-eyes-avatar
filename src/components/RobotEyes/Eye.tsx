/**
 * Eye — CSS div with animated border-radius.
 * Uses CSS transitions + CSS keyframe animation for excited state.
 */

import type { EyeState } from './expressions';

export interface EyeProps {
  state: EyeState;
  isBlinking: boolean;
  isExcited?: boolean;
}

export default function Eye({ state, isBlinking, isExcited = false }: EyeProps) {
  const scaleY = isBlinking ? 0.05 : state.scaleY;
  const glowIntensity = state.glowIntensity;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: state.glowColor,
        borderRadius: state.borderRadius,
        transform: `scaleY(${scaleY}) scaleX(${state.scaleX})`,
        boxShadow:
          glowIntensity > 0.1
            ? `0 0 ${20 * glowIntensity}px ${state.glowColor}, 0 0 ${40 * glowIntensity}px ${state.glowColor}40`
            : 'none',
        opacity: glowIntensity,
        transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        animation: isExcited ? 'excited-pulse 1.2s ease-in-out infinite' : 'none',
      }}
    />
  );
}
