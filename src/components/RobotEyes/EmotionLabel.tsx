/**
 * EmotionLabel — Small badge showing the current emotion with color coding.
 */

import type { Emotion } from './expressions';

interface EmotionLabelProps {
  emotion: Emotion;
  confidence?: number;
}

const EMOTION_CONFIG: Record<Emotion, { label: string; color: string; bg: string }> = {
  normal: { label: 'Neutral', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' },
  happy: { label: 'Happy', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)' },
  sad: { label: 'Sad', color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.15)' },
  excited: { label: 'Excited', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  concerned: { label: 'Concerned', color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)' },
  surprised: { label: 'Surprised', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)' },
  sleepy: { label: 'Sleepy', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' },
};

export default function EmotionLabel({ emotion, confidence = 1 }: EmotionLabelProps) {
  const config = EMOTION_CONFIG[emotion] || EMOTION_CONFIG.normal;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 10px',
        borderRadius: 12,
        fontSize: 11,
        fontWeight: 600,
        color: config.color,
        backgroundColor: config.bg,
        border: `1px solid ${config.color}30`,
        letterSpacing: '0.02em',
        textTransform: 'uppercase',
        transition: 'all 0.3s ease',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: config.color,
          opacity: 0.4 + confidence * 0.6,
          transition: 'opacity 0.3s ease',
        }}
      />
      {config.label}
    </span>
  );
}
