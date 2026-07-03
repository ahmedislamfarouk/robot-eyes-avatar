/**
 * RobotFace – The main face/screen component.
 *
 * Renders a rounded "screen" with two Eyes, headphone accents, a glowing
 * border, and optional mouth. Handles expression transitions, auto-blinking,
 * and idle micro-animation.
 */

import {
  useEffect,
  useRef,
  useState,
} from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import Eye from './Eye';
import {
  type Emotion,
  expressions,
} from './expressions';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface RobotFaceProps {
  /** The desired emotion – drives expression transitions. */
  emotion?: Emotion;
  /** Width of the face viewport (default 420). */
  width?: number;
  /** Height of the face viewport (default 480). */
  height?: number;
  /** Disable auto-blinking (for testing). */
  disableBlink?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Random integer in [min, max]. */
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RobotFace({
  emotion = 'normal',
  width = 420,
  height = 480,
  disableBlink = false,
}: RobotFaceProps) {
  // ---- expression state ----
  const [currentEmotion, setCurrentEmotion] = useState<Emotion>(emotion);
  const [isBlinking, setIsBlinking] = useState(false);
  const blinkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track incoming emotion prop changes
  useEffect(() => {
    setCurrentEmotion(emotion);
  }, [emotion]);

  // ---- auto-blink ----
  useEffect(() => {
    if (disableBlink) return;

    const scheduleNextBlink = () => {
      const delay = randInt(2000, 6000);
      blinkTimerRef.current = setTimeout(() => {
        setIsBlinking(true);
        // Blink duration: 120–180 ms
        setTimeout(() => setIsBlinking(false), randInt(120, 180));
        scheduleNextBlink();
      }, delay);
    };

    scheduleNextBlink();

    return () => {
      if (blinkTimerRef.current) clearTimeout(blinkTimerRef.current);
    };
  }, [disableBlink]);

  // ---- eye states ----
  const expr = expressions[currentEmotion];

  // ---- layout constants ----
  const faceCx = width / 2;
  const faceCy = height / 2 - 10;
  const eyeSpacing = width * 0.24;
  const leftEyeX = faceCx - eyeSpacing;
  const rightEyeX = faceCx + eyeSpacing;
  const eyeY = faceCy - 10;

  // ---- spring for border glow ----
  const glowSpring = useSpring(expr.leftEye.glowIntensity, {
    stiffness: 180,
    damping: 24,
  });

  useEffect(() => {
    glowSpring.set(expr.leftEye.glowIntensity);
  }, [expr.leftEye.glowIntensity, glowSpring]);

  const borderGlowOpacity = useTransform(glowSpring, [0.2, 1], [0.25, 0.85]);

  // ---- headphone positions ----
  const hpWidth = width * 0.12;
  const hpHeight = height * 0.32;
  const hpRadius = hpWidth * 0.45;
  const hpLeftX = width * 0.06;
  const hpRightX = width - width * 0.06 - hpWidth;
  const hpY = faceCy - hpHeight * 0.38;

  // ---- mouth path ----
  const mouthPath = expr.mouth;

  return (
    <motion.div
      className="relative select-none"
      style={{ width, height }}
      role="figure"
      aria-label={`Robot face – ${expr.name}`}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        {/* ---- Definitions ---- */}
        <defs>
          {/* Face glow filter */}
          <filter id="face-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="0 0 0 0 0  0 0.83 1 0 0  0 0.83 1 0 0  0 0 0 12 -5"
              result="glow"
            />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Headphone gradient */}
          <linearGradient id="hp-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3d3d5c" />
            <stop offset="100%" stopColor="#1e1e30" />
          </linearGradient>
        </defs>

        {/* ---- Background / Screen ---- */}
        <rect
          x="4"
          y="4"
          width={width - 8}
          height={height - 8}
          rx={width * 0.16}
          ry={height * 0.14}
          fill="#1a1a2e"
        />

        {/* Inner screen gradient */}
        <rect
          x="4"
          y="4"
          width={width - 8}
          height={height - 8}
          rx={width * 0.16}
          ry={height * 0.14}
          fill="url(#screen-grad)"
          opacity="0.6"
        />
        <defs>
          <radialGradient id="screen-grad" cx="50%" cy="40%">
            <stop offset="0%" stopColor="#222244" />
            <stop offset="100%" stopColor="#111122" />
          </radialGradient>
        </defs>

        {/* ---- Glowing border ---- */}
        <motion.rect
          x="2"
          y="2"
          width={width - 4}
          height={height - 4}
          rx={width * 0.165}
          ry={height * 0.145}
          fill="none"
          stroke="#00d4ff"
          strokeWidth="2"
          style={{
            opacity: borderGlowOpacity,
            filter: 'url(#face-glow)',
          }}
        />

        {/* ---- Headphone band (top) ---- */}
        <path
          d={`M ${width * 0.22} ${hpY + 10}
              Q ${faceCx} ${hpY - height * 0.12}
                ${width * 0.78} ${hpY + 10}`}
          stroke="#2d2d44"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />

        {/* Headphone band highlight */}
        <path
          d={`M ${width * 0.22} ${hpY + 10}
              Q ${faceCx} ${hpY - height * 0.12}
                ${width * 0.78} ${hpY + 10}`}
          stroke="#3d3d5c"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          opacity="0.5"
        />

        {/* ---- Left headphone cup ---- */}
        <rect
          x={hpLeftX}
          y={hpY}
          width={hpWidth}
          height={hpHeight}
          rx={hpRadius}
          ry={hpRadius}
          fill="url(#hp-grad)"
          stroke="#3d3d5c"
          strokeWidth="1.5"
        />
        {/* Left cup accent */}
        <rect
          x={hpLeftX + hpWidth * 0.22}
          y={hpY + hpHeight * 0.2}
          width={hpWidth * 0.56}
          height={hpHeight * 0.6}
          rx={4}
          ry={4}
          fill="#00d4ff"
          opacity="0.15"
        />

        {/* ---- Right headphone cup ---- */}
        <rect
          x={hpRightX}
          y={hpY}
          width={hpWidth}
          height={hpHeight}
          rx={hpRadius}
          ry={hpRadius}
          fill="url(#hp-grad)"
          stroke="#3d3d5c"
          strokeWidth="1.5"
        />
        {/* Right cup accent */}
        <rect
          x={hpRightX + hpWidth * 0.22}
          y={hpY + hpHeight * 0.2}
          width={hpWidth * 0.56}
          height={hpHeight * 0.6}
          rx={4}
          ry={4}
          fill="#00d4ff"
          opacity="0.15"
        />

        {/* ---- Eyes (foreignObject for React rendering) ---- */}
        <foreignObject x={leftEyeX - 60} y={eyeY - 60} width="120" height="120">
          <Eye
            state={expr.leftEye}
            isBlinking={isBlinking}
            idPrefix="eye-left"
          />
        </foreignObject>

        <foreignObject x={rightEyeX - 60} y={eyeY - 60} width="120" height="120">
          <Eye
            state={expr.rightEye}
            isBlinking={isBlinking}
            idPrefix="eye-right"
          />
        </foreignObject>

        {/* ---- Mouth ---- */}
        <AnimatePresence mode="wait">
          {mouthPath && (
            <motion.path
              key={currentEmotion}
              d={mouthPath}
              stroke="#00d4ff"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              opacity="0.7"
              transform={`translate(${faceCx - 100}, ${eyeY + 72})`}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.7 }}
              exit={{ pathLength: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
            />
          )}
        </AnimatePresence>
      </svg>
    </motion.div>
  );
}
