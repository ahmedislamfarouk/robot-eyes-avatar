/**
 * RobotFace — Square dark screen with two CSS-based glowing eyes.
 * Excited state has a subtle pulsing idle animation.
 */

import { useEffect, useRef, useState } from 'react';
import Eye from './Eye';
import { type Emotion, expressions } from './expressions';

export interface RobotFaceProps {
  emotion?: Emotion;
  size?: number;
  disableBlink?: boolean;
  backgroundColor?: string;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Inject CSS keyframes once
if (typeof document !== 'undefined' && !document.getElementById('robot-eye-animations')) {
  const style = document.createElement('style');
  style.id = 'robot-eye-animations';
  style.textContent = `
    @keyframes excited-pulse {
      0%, 100% { transform: scaleY(var(--eye-sy, 1)) scaleX(var(--eye-sx, 1)); }
      50% { transform: scaleY(calc(var(--eye-sy, 1) * 1.15)) scaleX(calc(var(--eye-sx, 1) * 1.08)); }
    }
  `;
  document.head.appendChild(style);
}

export default function RobotFace({
  emotion = 'normal',
  size = 120,
  disableBlink = false,
  backgroundColor = '#1a1a2e',
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
  const isExcited = currentEmotion === 'excited';

  return (
    <div
      role="figure"
      aria-label={`Robot face – ${expr.name}`}
      style={{
        width: size,
        height: size * 0.85,
        backgroundColor,
        borderRadius: size * 0.15,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: size * 0.12,
        flexShrink: 0,
        transition: 'width 0.4s ease, height 0.4s ease',
      }}
    >
      <div style={{ width: size * 0.35, height: size * 0.3 }}>
        <Eye state={expr.leftEye} isBlinking={isBlinking} isExcited={isExcited} />
      </div>
      <div style={{ width: size * 0.35, height: size * 0.3 }}>
        <Eye state={expr.rightEye} isBlinking={isBlinking} isExcited={isExcited} />
      </div>
    </div>
  );
}
