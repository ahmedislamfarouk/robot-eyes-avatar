export { default as RobotFace } from './RobotFace';
export type { RobotFaceProps } from './RobotFace';

export { default as Eye } from './Eye';
export type { EyeProps } from './Eye';

export { expressions, lerpEyeState, lerp, clamp } from './expressions';
export type { Emotion, EyeState, Expression } from './expressions';

export { useEyeAnimation } from './useEyeAnimation';
export type { EyeAnimationState, UseEyeAnimationOptions } from './useEyeAnimation';

export { useExpressionState } from './useExpressionState';
export type { ExpressionState, UseExpressionStateOptions } from './useExpressionState';

export { useMouseTracking } from './useMouseTracking';
export type { UseMouseTrackingOptions, MouseTrackingState } from './useMouseTracking';

export { useAutoExpressions } from './useAutoExpressions';
export type { UseAutoExpressionsOptions, AutoExpressionsState } from './useAutoExpressions';

export {
  playSequence,
  getSequence,
  getRandomSequence,
  GREETING,
  THINKING,
  SLEEPY,
  SURPRISE,
  SEQUENCES,
} from './emotionSequences';
export type {
  SequenceStep,
  EmotionSequence,
  PlaySequenceOptions,
  SequenceName,
} from './emotionSequences';
