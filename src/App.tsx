import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import RobotFace from './components/RobotEyes/RobotFace';
import {
  useExpressionState,
  useAutoExpressions,
  playSequence,
  GREETING,
  THINKING,
  SLEEPY,
  SURPRISE,
  type Emotion,
  type SequenceName,
} from './components/RobotEyes';

/* ==========================================================================
   Data
   ========================================================================== */

const EMOTIONS: { id: Emotion; label: string; icon: string }[] = [
  { id: 'concerned', label: 'Concerned', icon: '?' },
  { id: 'normal', label: 'Normal', icon: '-' },
  { id: 'happy', label: 'Happy', icon: ')' },
  { id: 'sleepy', label: 'Sleepy', icon: '~' },
  { id: 'excited', label: 'Excited', icon: '!' },
  { id: 'surprised', label: 'Surprised', icon: 'O' },
];

const SEQUENCES: { id: SequenceName; label: string; description: string }[] = [
  { id: 'greeting', label: 'Greeting', description: 'Warm welcome smile' },
  { id: 'thinking', label: 'Thinking', description: 'Contemplative cycle' },
  { id: 'sleepy', label: 'Sleepy', description: 'Drowsy wind-down' },
  { id: 'surprise', label: 'Surprise', description: 'Startled reaction' },
];

const FEATURES = [
  {
    title: 'Eye Tracking',
    description: 'Pupils follow your cursor with spring-damped motion and dead-zone filtering.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="12" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
        <circle cx="14" cy="14" r="6" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="14" cy="14" r="2.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: 'Smooth Animations',
    description: 'Every transition uses spring physics for organic, buttery-smooth motion.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M4 14 C8 8, 12 20, 16 14 C20 8, 24 20, 28 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Multiple Emotions',
    description: 'Six expressive states with distinct eye, brow, and mouth configurations.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="10" cy="11" r="3" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="18" cy="11" r="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 19 Q14 24 20 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

/* ==========================================================================
   Animation Variants
   ========================================================================== */

const EASE_OUT: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.6,
      ease: EASE_OUT,
    },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.8, ease: EASE_OUT },
  },
};

/* ==========================================================================
   Sub-Components
   ========================================================================== */

/** Animated background with grid, gradient orbs, and scan-line. */
function Background() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,212,255,0.04) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 20% 80%, rgba(0,153,204,0.03) 0%, transparent 50%), radial-gradient(ellipse 60% 50% at 80% 80%, rgba(255,0,170,0.02) 0%, transparent 50%)',
        }}
      />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,212,255,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,212,255,0.5) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          animation: 'grid-scroll 8s linear infinite',
        }}
      />

      {/* Floating orb 1 */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 400,
          height: 400,
          left: '10%',
          top: '20%',
          background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -20, 15, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Floating orb 2 */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 300,
          height: 300,
          right: '15%',
          top: '60%',
          background: 'radial-gradient(circle, rgba(255,0,170,0.04) 0%, transparent 70%)',
          filter: 'blur(50px)',
        }}
        animate={{
          x: [0, -25, 20, 0],
          y: [0, 20, -15, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Scan line */}
      <div
        className="absolute left-0 right-0 h-px opacity-[0.04]"
        style={{
          background: 'linear-gradient(90deg, transparent, var(--cyan) 30%, var(--cyan) 70%, transparent)',
          animation: 'scanline 6s linear infinite',
        }}
      />

      {/* Noise overlay */}
      <div className="noise-overlay" />
    </div>
  );
}

/** Section label with mono font and decorative line. */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="h-px flex-1 max-w-[40px] bg-gradient-to-r from-transparent to-[var(--cyan-dim)] opacity-40" />
      <span
        className="font-mono text-[0.65rem] tracking-[0.2em] uppercase"
        style={{ color: 'var(--text-muted)' }}
      >
        {children}
      </span>
      <div className="h-px flex-1 max-w-[40px] bg-gradient-to-l from-transparent to-[var(--cyan-dim)] opacity-40" />
    </div>
  );
}

/* ==========================================================================
   Main App
   ========================================================================== */

export default function App() {
  // ---- Expression state machine ----
  const expression = useExpressionState({ initial: 'normal' });

  // ---- Auto-cycling ----
  const auto = useAutoExpressions({
    setEmotion: expression.setEmotion,
    interval: [2200, 4500],
  });

  // ---- Sequence playback ----
  const sequenceAbortRef = useRef<AbortController | null>(null);
  const [activeSequence, setActiveSequence] = useState<SequenceName | null>(null);

  const handlePlaySequence = useCallback(
    async (name: SequenceName) => {
      // Abort any running sequence
      sequenceAbortRef.current?.abort();
      const controller = new AbortController();
      sequenceAbortRef.current = controller;

      // Stop auto-play if running
      if (auto.isPlaying) {
        auto.pause();
      }

      setActiveSequence(name);

      const sequences: Record<SequenceName, typeof GREETING> = {
        greeting: GREETING,
        thinking: THINKING,
        sleepy: SLEEPY,
        surprise: SURPRISE,
      };

      try {
        await playSequence(sequences[name], expression.setEmotion, {
          signal: controller.signal,
        });
      } catch {
        // AbortError — expected when user triggers a new sequence
      } finally {
        if (!controller.signal.aborted) {
          setActiveSequence(null);
        }
      }
    },
    [expression.setEmotion, auto],
  );

  const handleStopSequence = useCallback(() => {
    sequenceAbortRef.current?.abort();
    setActiveSequence(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      sequenceAbortRef.current?.abort();
    };
  }, []);

  // ---- Emotion button click ----
  const handleEmotionClick = useCallback(
    (emotion: Emotion) => {
      // Stop auto-play and sequences
      if (auto.isPlaying) auto.pause();
      sequenceAbortRef.current?.abort();
      setActiveSequence(null);
      expression.setEmotion(emotion);
    },
    [expression.setEmotion, auto],
  );

  // ---- Current emotion label ----
  const currentLabel = useMemo(
    () => EMOTIONS.find((e) => e.id === expression.currentEmotion)?.label ?? 'Normal',
    [expression.currentEmotion],
  );

  return (
    <div className="relative min-h-screen flex flex-col">
      <Background />

      {/* ========== Main Content ========== */}
      <main className="relative z-10 flex-1 flex flex-col items-center px-4 sm:px-6 py-8 sm:py-12">

        {/* ---- Hero ---- */}
        <motion.header
          className="text-center mb-8 sm:mb-12"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={0}
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="h-px w-8 sm:w-12 bg-gradient-to-r from-transparent to-[var(--cyan-dim)]" />
            <motion.span
              className="font-mono text-[0.6rem] sm:text-[0.7rem] tracking-[0.25em] uppercase"
              style={{ color: 'var(--cyan-dim)' }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              v2.0 // emotional companion
            </motion.span>
            <div className="h-px w-8 sm:w-12 bg-gradient-to-l from-transparent to-[var(--cyan-dim)]" />
          </div>

          <h1
            className="font-display text-4xl sm:text-5xl md:text-6xl font-black tracking-wider"
            style={{
              background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--cyan) 50%, var(--text-primary) 100%)',
              backgroundSize: '200% 100%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'shimmer 6s ease-in-out infinite',
            }}
          >
            ROBO-RAVE
          </h1>

          <p
            className="font-body text-base sm:text-lg tracking-wide mt-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            Interactive Robot Avatar
          </p>
        </motion.header>

        {/* ---- Robot Face ---- */}
        <motion.div
          className="relative mb-8 sm:mb-10"
          initial="hidden"
          animate="visible"
          variants={scaleIn}
        >
          {/* Glow behind face */}
          <div
            className="absolute inset-0 -m-8 sm:-m-12 rounded-3xl opacity-40"
            style={{
              background: 'radial-gradient(ellipse at center, var(--cyan-glow) 0%, transparent 70%)',
              filter: 'blur(30px)',
              animation: 'pulse-glow 4s ease-in-out infinite',
            }}
          />

          {/* Face container */}
          <div className="relative">
            <RobotFace
              emotion={expression.currentEmotion}
              width={360}
              height={420}
            />
          </div>

          {/* Current emotion indicator */}
          <motion.div
            className="absolute -bottom-2 left-1/2 -translate-x-1/2"
            key={expression.currentEmotion}
            initial={{ opacity: 0, y: -4, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <span
              className="font-mono text-[0.65rem] tracking-[0.15em] uppercase px-3 py-1 rounded-full glass"
              style={{ color: 'var(--cyan)', borderColor: 'var(--border-glow)' }}
            >
              {currentLabel}
            </span>
          </motion.div>
        </motion.div>

        {/* ---- Controls Panel ---- */}
        <motion.div
          className="w-full max-w-2xl"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={2}
        >
          <div className="glass-strong rounded-2xl p-5 sm:p-7">
            {/* Emotion Buttons */}
            <SectionLabel>Expressions</SectionLabel>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3 mb-6">
              {EMOTIONS.map((emo) => {
                const isActive = expression.currentEmotion === emo.id && !auto.isPlaying;
                return (
                  <motion.button
                    key={emo.id}
                    className={`btn text-center ${isActive ? 'btn-active' : ''}`}
                    onClick={() => handleEmotionClick(emo.id)}
                    whileTap={{ scale: 0.95 }}
                    aria-pressed={isActive}
                    aria-label={`Set emotion to ${emo.label}`}
                  >
                    <span className="block text-lg leading-none mb-0.5">{emo.icon}</span>
                    <span className="block text-[0.6rem] sm:text-[0.65rem]">{emo.label}</span>
                  </motion.button>
                );
              })}
            </div>

            {/* Divider */}
            <div className="divider mb-6" />

            {/* Auto Play + Sequences */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              {/* Auto Play */}
              <div className="flex-1">
                <SectionLabel>Auto Play</SectionLabel>
                <motion.button
                  className={`btn w-full ${auto.isPlaying ? 'btn-active' : ''}`}
                  onClick={auto.toggle}
                  whileTap={{ scale: 0.97 }}
                  aria-pressed={auto.isPlaying}
                >
                  <span className="flex items-center justify-center gap-2">
                    {/* Play / Pause icon */}
                    {auto.isPlaying ? (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                        <rect x="2" y="2" width="3.5" height="10" rx="1" />
                        <rect x="8.5" y="2" width="3.5" height="10" rx="1" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                        <path d="M3 1.5 L12 7 L3 12.5Z" />
                      </svg>
                    )}
                    {auto.isPlaying ? 'Pause' : 'Auto Play'}
                  </span>
                </motion.button>
                {auto.isPlaying && (
                  <motion.p
                    className="font-mono text-[0.6rem] text-center mt-2"
                    style={{ color: 'var(--text-muted)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {auto.transitionCount} transitions
                  </motion.p>
                )}
              </div>

              {/* Sequences */}
              <div className="flex-[1.5]">
                <SectionLabel>Sequences</SectionLabel>
                <div className="grid grid-cols-2 gap-2">
                  {SEQUENCES.map((seq) => {
                    const isActive = activeSequence === seq.id;
                    return (
                      <motion.button
                        key={seq.id}
                        className={`btn text-left ${isActive ? 'btn-active' : ''}`}
                        onClick={() =>
                          isActive ? handleStopSequence() : handlePlaySequence(seq.id)
                        }
                        whileTap={{ scale: 0.97 }}
                        aria-pressed={isActive}
                        aria-label={`${isActive ? 'Stop' : 'Play'} ${seq.label} sequence`}
                      >
                        <span className="block text-[0.75rem] font-semibold">{seq.label}</span>
                        <span
                          className="block text-[0.55rem] mt-0.5"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {isActive ? 'Playing...' : seq.description}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ---- Feature Cards ---- */}
        <motion.div
          className="w-full max-w-2xl mt-8 sm:mt-10"
          initial="hidden"
          animate="visible"
        >
          <SectionLabel>Capabilities</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {FEATURES.map((feat, i) => (
              <motion.div
                key={feat.title}
                className="glass rounded-xl p-4 sm:p-5 group cursor-default"
                variants={fadeUp}
                custom={3 + i}
                whileHover={{
                  y: -3,
                  transition: { duration: 0.25 },
                }}
                style={{
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div
                  className="mb-3 transition-colors duration-300 group-hover:text-[var(--cyan)]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {feat.icon}
                </div>
                <h3
                  className="font-display text-sm font-semibold tracking-wide mb-1 transition-colors duration-300 group-hover:text-[var(--text-primary)]"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {feat.title}
                </h3>
                <p
                  className="text-xs leading-relaxed transition-colors duration-300 group-hover:text-[var(--text-secondary)]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {feat.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ---- Spacer ---- */}
        <div className="flex-1 min-h-[2rem]" />

        {/* ---- Footer ---- */}
        <motion.footer
          className="text-center py-6 sm:py-8"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={7}
        >
          <div className="divider mb-5 max-w-xs mx-auto" />
          <p
            className="font-mono text-[0.6rem] sm:text-[0.65rem] tracking-wider"
            style={{ color: 'var(--text-muted)' }}
          >
            Built with React + Framer Motion + SVG
          </p>
          <p
            className="font-mono text-[0.55rem] tracking-wider mt-1"
            style={{ color: 'var(--text-muted)', opacity: 0.5 }}
          >
            ROBO-RAVE EMOTIONAL COMPANION SYSTEM
          </p>
        </motion.footer>
      </main>
    </div>
  );
}
