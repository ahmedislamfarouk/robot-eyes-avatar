/**
 * FeatureLabel — Small badges for different app features.
 * Can show context about what section or feature the user is in.
 */

export interface FeatureLabelProps {
  feature: string;
  icon?: string;
  color?: string;
}

const FEATURE_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  chat: { label: 'Chat', icon: '💬', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)' },
  gym: { label: 'Gym', icon: '💪', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' },
  health: { label: 'Health', icon: '❤️', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.12)' },
  study: { label: 'Study', icon: '📚', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)' },
  courses: { label: 'Courses', icon: '🎓', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  teachers: { label: 'Teachers', icon: '👨‍🏫', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.12)' },
  quizzes: { label: 'Quizzes', icon: '📝', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.12)' },
  calendar: { label: 'Calendar', icon: '📅', color: '#14b8a6', bg: 'rgba(20, 184, 166, 0.12)' },
  emergency: { label: 'Emergency', icon: '🚨', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.12)' },
  lecture: { label: 'Lecture', icon: '🎥', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.12)' },
  resources: { label: 'Resources', icon: '📖', color: '#0891b2', bg: 'rgba(8, 145, 178, 0.12)' },
  plans: { label: 'Study Plans', icon: '📋', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)' },
  profile: { label: 'Profile', icon: '⚙️', color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)' },
};

export default function FeatureLabel({ feature, icon, color }: FeatureLabelProps) {
  const config = FEATURE_CONFIG[feature.toLowerCase()] || {
    label: feature,
    icon: icon || '📌',
    color: color || '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.12)',
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 8,
        fontSize: 10,
        fontWeight: 600,
        color: config.color,
        backgroundColor: config.bg,
        border: `1px solid ${config.color}25`,
        letterSpacing: '0.02em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: 11 }}>{config.icon}</span>
      {config.label}
    </span>
  );
}
