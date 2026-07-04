/**
 * RobotFace — Square dark screen with two CSS-based glowing eyes.
 */

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Eye from './Eye';
import { type Emotion, expressions } from './expressions';

export interface RobotFaceProps {
  emotion?: Emotion;
  width?: number;
  height?: number;
  disableBlink?: boolean;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function RobotFace({
  emotion = 'normal',
  width = 480,
  height = 440,
  disableBlink = false,
}: RobotFaceProps) {
  const [currentEmotion, setCurrentEmotion] = useState<Emotion>(emotion);
  const [isBlinking, setIsBlinking] = useState(false);
  const blinkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setCurrentEmotion(emotion); }, [emotion]);

  useEffect(() => {
    if (disableBlink) return;
    const scheduleNextBlink = () => {
      const delay = randInt(2500, 5500);
      blinkTimerRef.current = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), randInt(100, 160));
        scheduleNextBlink();
      }, delay);
    };
    scheduleNextBlink();
    return () => { if (blinkTimerRef.current) clearTimeout(blinkTimerRef.current); };
  }, [disableBlink]);

  const expr = expressions[currentEmotion];

  const eyeSpacing = width * 0.16;

  return (
    <motion.div
      className="relative select-none"
      style={{
        width,
        height,
        backgroundColor: '#1a1a2e',
        borderRadius: 28,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: eyeSpacing * 2,
      }}
      role="figure"
      aria-label={`Robot face – ${expr.name}`}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
    >
      <Eye state={expr.leftEye} isBlinking={isBlinking} />
      <Eye state={expr.rightEye} isBlinking={isBlinking} />
    </motion.div>
  );
}
