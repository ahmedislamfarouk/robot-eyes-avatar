/**
 * Eye – A single SVG-based robot eye with glow, pupil, and reflection.
 *
 * All visual properties are driven by the `EyeState` type and animated
 * with framer-motion for buttery-smooth expression transitions.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useSpring, useTransform, type MotionValue } from 'framer-motion';
import type { EyeState } from './expressions';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface EyeProps {
  /** Current eye state – the parent interpolates between expressions. */
  state: EyeState;
  /** Whether the eye is currently blinking (scaleY collapses to 0). */
  isBlinking: boolean;
  /** Unique id prefix for SVG filter/gradient definitions. */
  idPrefix: string;
  /** Width of the eye viewport (default 120). */
  width?: number;
  /** Height of the eye viewport (default 120). */
  height?: number;
}

// ---------------------------------------------------------------------------
// Spring config
// ---------------------------------------------------------------------------

const SPRING = { stiffness: 260, damping: 28, mass: 0.8 };

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Eye({
  state,
  isBlinking,
  idPrefix,
  width = 120,
  height = 120,
}: EyeProps) {
  // ---- spring-animated values ----
  const scaleYRaw = useSpring(state.scaleY, SPRING);
  const scaleXRaw = useSpring(state.scaleX, SPRING);
  const pupilXRaw = useSpring(state.pupilX, SPRING);
  const pupilYRaw = useSpring(state.pupilY, SPRING);
  const pupilScaleRaw = useSpring(state.pupilScale, SPRING);
  const glowRaw = useSpring(state.glowIntensity, SPRING);
  const browYRaw = useSpring(state.eyebrowY, SPRING);
  const browRotRaw = useSpring(state.eyebrowRotation, SPRING);

  // Update springs when state changes
  useEffect(() => {
    scaleYRaw.set(isBlinking ? 0.05 : state.scaleY);
  }, [state.scaleY, isBlinking, scaleYRaw]);

  useEffect(() => scaleXRaw.set(state.scaleX), [state.scaleX, scaleXRaw]);
  useEffect(() => pupilXRaw.set(state.pupilX), [state.pupilX, pupilXRaw]);
  useEffect(() => pupilYRaw.set(state.pupilY), [state.pupilY, pupilYRaw]);
  useEffect(() => pupilScaleRaw.set(state.pupilScale), [state.pupilScale, pupilScaleRaw]);
  useEffect(() => glowRaw.set(state.glowIntensity), [state.glowIntensity, glowRaw]);
  useEffect(() => browYRaw.set(state.eyebrowY), [state.eyebrowY, browYRaw]);
  useEffect(() => browRotRaw.set(state.eyebrowRotation), [state.eyebrowRotation, browRotRaw]);

  // ---- derived motion values ----
  const eyeHeight = height * 0.38;
  const eyeWidth = width * 0.44;
  const cx = width / 2;
  const cy = height / 2 + 4; // slight downward nudge

  const pupilRadius = useTransform(pupilScaleRaw, (s) => 8 * s);
  const glowOpacity = useTransform(glowRaw, (g) => 0.25 + g * 0.55);

  const pupilOffsetX = useTransform(pupilXRaw, (x) => x * eyeWidth * 0.22);
  const pupilOffsetY = useTransform(pupilYRaw, (y) => y * eyeHeight * 0.22);

  const browOffsetY = useTransform(browYRaw, (y) => y);

  // ---- subtle idle micro-movement ----
  const [idle, setIdle] = useState({ dx: 0, dy: 0 });
  const rafRef = useRef(0);
  const tRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const tick = () => {
      tRef.current += 0.015;
      const t = tRef.current;
      if (!cancelled) {
        setIdle({
          dx: Math.sin(t * 1.1) * 0.02 + Math.sin(t * 2.7) * 0.01,
          dy: Math.cos(t * 0.9) * 0.015 + Math.cos(t * 3.1) * 0.008,
        });
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Combined pupil offsets including idle
  const finalPupilX = useTransform(pupilOffsetX, (v) => v + idle.dx * eyeWidth);
  const finalPupilY = useTransform(pupilOffsetY, (v) => v + idle.dy * eyeHeight);

  // ---- memoise static SVG parts ----
  const filterId = useMemo(() => `${idPrefix}-glow`, [idPrefix]);
  const gradId = useMemo(() => `${idPrefix}-grad`, [idPrefix]);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="overflow-visible"
      role="img"
      aria-label="Robot eye"
    >
      {/* ---- Definitions ---- */}
      <defs>
        {/* Glow filter */}
        <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="0 0 0 0 0  0 0.83 1 0 0  0 0.83 1 0 0  0 0 0 18 -7"
            result="coloredBlur"
          />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Radial gradient for pupil depth */}
        <radialGradient id={gradId} cx="40%" cy="35%">
          <stop offset="0%" stopColor="#0a2a3a" />
          <stop offset="100%" stopColor="#000000" />
        </radialGradient>
      </defs>

      {/* ---- Eyebrow ---- */}
      <motion.g
        style={{ y: browOffsetY }}
      >
        <motion.line
          x1={cx - eyeWidth * 0.55}
          y1={cy - eyeHeight * 0.72}
          x2={cx + eyeWidth * 0.55}
          y2={cy - eyeHeight * 0.72}
          stroke={state.glowColor}
          strokeWidth="3"
          strokeLinecap="round"
          style={{
            opacity: useTransform(glowRaw, (g) => 0.3 + g * 0.5),
            rotate: browRotRaw,
            transformOrigin: `${cx}px ${cy - eyeHeight * 0.72}px`,
          }}
        />
      </motion.g>

      {/* ---- Eye group (scale-animated) ---- */}
      <motion.g
        style={{
          scaleY: scaleYRaw,
          scaleX: scaleXRaw,
          transformOrigin: `${cx}px ${cy}px`,
        }}
      >
        {/* Outer glow halo */}
        <motion.ellipse
          cx={cx}
          cy={cy}
          rx={eyeWidth * 0.62}
          ry={eyeHeight * 0.62}
          fill="none"
          stroke={state.glowColor}
          strokeWidth="1"
          style={{
            opacity: useTransform(glowRaw, (g) => g * 0.35),
            filter: `blur(6px)`,
          }}
        />

        {/* Eye socket / dark backing */}
        <rect
          x={cx - eyeWidth / 2 - 4}
          y={cy - eyeHeight / 2 - 4}
          width={eyeWidth + 8}
          height={eyeHeight + 8}
          rx={eyeWidth * 0.32}
          ry={eyeHeight * 0.32}
          fill="#0d0d1a"
        />

        {/* Eye "screen" background */}
        <rect
          x={cx - eyeWidth / 2}
          y={cy - eyeHeight / 2}
          width={eyeWidth}
          height={eyeHeight}
          rx={eyeWidth * 0.28}
          ry={eyeHeight * 0.28}
          fill="#111128"
        />

        {/* Glow ring */}
        <motion.rect
          x={cx - eyeWidth / 2}
          y={cy - eyeHeight / 2}
          width={eyeWidth}
          height={eyeHeight}
          rx={eyeWidth * 0.28}
          ry={eyeHeight * 0.28}
          fill="none"
          stroke={state.glowColor}
          strokeWidth="2"
          style={{
            opacity: glowOpacity,
            filter: `url(#${filterId})`,
          }}
        />

        {/* Pupil */}
        <motion.circle
          cx={cx}
          cy={cy}
          style={{
            r: pupilRadius,
            cx: useTransform([finalPupilX] as MotionValue<number>[], ([px]: number[]) => cx + px),
            cy: useTransform([finalPupilY] as MotionValue<number>[], ([py]: number[]) => cy + py),
          }}
          fill={`url(#${gradId})`}
        />

        {/* Reflection highlight */}
        <motion.circle
          cx={cx}
          cy={cy}
          r="3.5"
          fill="white"
          style={{
            opacity: useTransform(glowRaw, (g) => 0.6 + g * 0.35),
            cx: useTransform([finalPupilX] as MotionValue<number>[], ([px]: number[]) => cx + px - 4),
            cy: useTransform([finalPupilY] as MotionValue<number>[], ([py]: number[]) => cy + py - 5),
          }}
        />

        {/* Secondary smaller reflection */}
        <motion.circle
          cx={cx}
          cy={cy}
          r="1.8"
          fill="white"
          style={{
            opacity: useTransform(glowRaw, (g) => 0.3 + g * 0.3),
            cx: useTransform([finalPupilX] as MotionValue<number>[], ([px]: number[]) => cx + px + 3),
            cy: useTransform([finalPupilY] as MotionValue<number>[], ([py]: number[]) => cy + py + 2),
          }}
        />
      </motion.g>
    </svg>
  );
}
