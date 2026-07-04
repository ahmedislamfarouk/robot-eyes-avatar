/**
 * detectFeature — Detect which app feature is relevant based on message content.
 */

const FEATURE_KEYWORDS: Record<string, string[]> = {
  gym: ['gym', 'workout', 'exercise', 'fitness', 'muscle', 'weight', 'reps', 'sets', 'cardio', 'run', 'training', 'protein', 'abs', 'chest', 'legs'],
  health: ['health', 'sleep', 'stress', 'anxiety', 'mental', 'wellness', 'calories', 'diet', 'water', 'hydration', 'mood', 'tired', 'energy', 'headache'],
  study: ['study', 'exam', 'revision', 'flashcard', 'notes', 'homework', 'assignment', 'learn', 'memorize', 'quiz', 'test', 'chapter', 'review'],
  courses: ['course', 'lecture', 'class', 'professor', 'syllabus', 'semester', 'grade', 'gpa', 'major', 'enroll', 'registration'],
  teachers: ['teacher', 'instructor', 'tutor', 'mentor', 'office hours', 'feedback', 'recommendation'],
  quizzes: ['quiz', 'question', 'answer', 'multiple choice', 'true false', 'score', 'result', 'practice'],
  calendar: ['calendar', 'schedule', 'deadline', 'due date', 'reminder', 'event', 'appointment', 'tomorrow', 'today'],
  emergency: ['emergency', 'help', 'urgent', 'panic', 'accident', 'hospital', 'doctor', 'sick', 'injury'],
  lecture: ['lecture', 'video', 'recording', 'stream', 'watch', 'playback'],
  resources: ['resource', 'book', 'article', 'link', 'reference', 'material', 'textbook'],
  plans: ['plan', 'schedule', 'routine', 'timetable', 'goal', 'target', 'deadline'],
};

export function detectFeature(text: string): string | null {
  if (!text) return null;
  const lower = text.toLowerCase();

  let bestFeature: string | null = null;
  let bestScore = 0;

  for (const [feature, keywords] of Object.entries(FEATURE_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestFeature = feature;
    }
  }

  return bestScore > 0 ? bestFeature : null;
}
