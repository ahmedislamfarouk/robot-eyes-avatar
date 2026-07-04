/**
 * ChatRobotFace — Robot face with dynamic emotion label, feature label, TTS.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import RobotFace from './RobotEyes/RobotFace';
import EmotionLabel from './RobotEyes/EmotionLabel';
import FeatureLabel from './RobotEyes/FeatureLabel';
import { useExpressionState } from './RobotEyes/useExpressionState';
import { useSpeech } from './RobotEyes/useSpeech';
import { useSpeechRecognition } from './RobotEyes/useSpeechRecognition';
import { analyzeSentiment } from './sentiment';
import { detectFeature } from './detectFeature';
import { playEmotionSound } from './emotionSounds';
import { Volume2, VolumeX, Mic, MicOff } from 'lucide-react';
import type { Emotion } from './RobotEyes/expressions';

interface ChatRobotFaceProps {
  isGenerating: boolean;
  isConnected: boolean;
  lastMessage?: string;
  lastMessageRole?: 'user' | 'assistant';
  size?: number;
  backgroundColor?: string;
  enableTTS?: boolean;
  onTranscript?: (text: string) => void;
}

function cleanForSpeech(text: string): string {
  return text.replace(/[*_`#\[\](){}|]/g, '').replace(/\n+/g, '. ').replace(/\s+/g, ' ').trim();
}

export default function ChatRobotFace({
  isGenerating,
  isConnected,
  lastMessage,
  lastMessageRole,
  size = 120,
  backgroundColor = '#1a1a2e',
  enableTTS = true,
  onTranscript,
}: ChatRobotFaceProps) {
  const { currentEmotion, setEmotion } = useExpressionState({ initial: 'normal' });
  const { speaking, speak, stop: stopTTS } = useSpeech();
  const { listening, interimTranscript, transcript, start: startSTT, stop: stopSTT, error: sttError } = useSpeechRecognition();
  const [idleTime, setIdleTime] = useState(0);
  const prevEmotionRef = useRef<Emotion | null>(null);
  const autoSpokenRef = useRef<string>('');
  const [mounted, setMounted] = useState(false);

  // Detect feature from last message
  const detectedFeature = useMemo(() => detectFeature(lastMessage || ''), [lastMessage]);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const interval = setInterval(() => setIdleTime((p) => p + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isGenerating || !isConnected) setIdleTime(0);
  }, [isGenerating, isConnected]);

  useEffect(() => {
    if (transcript && onTranscript) onTranscript(transcript);
  }, [transcript, onTranscript]);

  // Determine emotion
  useEffect(() => {
    let newEmotion: Emotion;
    if (!isConnected) newEmotion = 'concerned';
    else if (isGenerating) newEmotion = 'excited';
    else if (listening) newEmotion = 'surprised';
    else if (idleTime > 30) newEmotion = 'sleepy';
    else if (lastMessage && lastMessage.trim().length > 0) {
      const sentiment = analyzeSentiment(lastMessage);
      newEmotion = sentiment.confidence > 0.3 ? sentiment.emotion : (lastMessageRole === 'assistant' ? 'happy' : 'normal');
    } else newEmotion = 'normal';

    setEmotion(newEmotion);
    if (prevEmotionRef.current !== null && newEmotion !== prevEmotionRef.current) playEmotionSound(newEmotion);
    prevEmotionRef.current = newEmotion;
  }, [isGenerating, isConnected, lastMessage, lastMessageRole, idleTime, listening, setEmotion]);

  // Auto-speak assistant responses
  useEffect(() => {
    if (enableTTS && lastMessage && lastMessageRole === 'assistant' && lastMessage !== autoSpokenRef.current && !speaking) {
      autoSpokenRef.current = lastMessage;
      const plainText = cleanForSpeech(lastMessage);
      if (plainText) {
        console.log('🔊 Auto-speaking response...');
        speak(plainText);
      }
    }
  }, [lastMessage, lastMessageRole, enableTTS, speak, speaking]);

  const handleVoice = useCallback(() => {
    if (speaking) { stopTTS(); return; }
    if (lastMessage && lastMessage.trim()) {
      const plainText = cleanForSpeech(lastMessage);
      if (plainText) {
        console.log('🔊 Reading last response...');
        speak(plainText);
        return;
      }
    }
    speak('Hello! I am your AI companion. How can I help you today?');
  }, [speaking, stopTTS, lastMessage, speak]);

  const btnStyle = (active: boolean, color: string) => ({
    display: 'flex' as const, alignItems: 'center' as const, gap: 4,
    padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600 as const,
    border: `1px solid ${active ? color : 'var(--border)'}`,
    backgroundColor: active ? `${color}15` : 'transparent',
    color: active ? color : 'var(--text-secondary)',
    cursor: 'pointer' as const,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div
        onClick={() => speaking ? stopTTS() : playEmotionSound(currentEmotion)}
        style={{ cursor: 'pointer' }}
        title={speaking ? 'Click to stop speaking' : 'Click to hear sound'}
      >
        <RobotFace emotion={currentEmotion} size={size} backgroundColor={backgroundColor} />
      </div>

      {/* Labels row: emotion + detected feature */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        <EmotionLabel emotion={currentEmotion} />
        {detectedFeature && <FeatureLabel feature={detectedFeature} />}
        {!detectedFeature && <FeatureLabel feature="chat" />}
      </div>

      {speaking && (
        <span style={{ fontSize: 11, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Volume2 size={12} /> Speaking...
        </span>
      )}
      {listening && (
        <span style={{ fontSize: 11, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Mic size={12} /> Listening... {interimTranscript && `"${interimTranscript}"`}
        </span>
      )}
      {sttError && (
        <span style={{ fontSize: 10, color: '#ef4444', opacity: 0.8 }}>{sttError}</span>
      )}

      {mounted && (
        <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
          <button onClick={handleVoice} style={btnStyle(speaking, '#22c55e')}>
            {speaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
            {speaking ? 'Stop' : 'Read Last'}
          </button>
          <button onClick={() => listening ? stopSTT() : startSTT()} style={btnStyle(listening, '#ef4444')}>
            {listening ? <MicOff size={14} /> : <Mic size={14} />}
            {listening ? 'Stop Mic' : 'Mic'}
          </button>
        </div>
      )}
    </div>
  );
}
