/**
 * useSpeech — Text-to-Speech hook using the Web Speech API.
 *
 * No API keys needed. Works in Chrome, Edge, Safari.
 *
 * Usage:
 *   const { speak, stop, speaking, supported } = useSpeech();
 *   speak("Hello world!", { rate: 1, pitch: 1.2 });
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export interface SpeechOptions {
  /** Speech rate (0.1–10, default 1) */
  rate?: number;
  /** Pitch (0–2, default 1) */
  pitch?: number;
  /** Language code (default 'en-US') */
  lang?: string;
  /** Voice name to use (from window.speechSynthesis.getVoices()) */
  voiceName?: string;
}

export interface UseSpeechState {
  /** Whether speech synthesis is supported in this browser */
  supported: boolean;
  /** Whether currently speaking */
  speaking: boolean;
  /** Speak text */
  speak: (text: string, options?: SpeechOptions) => void;
  /** Stop speaking */
  stop: () => void;
  /** Available voices */
  voices: SpeechSynthesisVoice[];
}

export function useSpeech(): UseSpeechState {
  const [speaking, setSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load voices
  useEffect(() => {
    if (!supported) return;
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, [supported]);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
    utteranceRef.current = null;
  }, [supported]);

  const speak = useCallback((text: string, options: SpeechOptions = {}) => {
    if (!supported || !text.trim()) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate ?? 1;
    utterance.pitch = options.pitch ?? 1;
    utterance.lang = options.lang ?? 'en-US';

    // Find voice by name
    if (options.voiceName && voices.length > 0) {
      const voice = voices.find(v => v.name === options.voiceName);
      if (voice) utterance.voice = voice;
    }

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [supported, voices]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (supported) window.speechSynthesis.cancel();
    };
  }, [supported]);

  return { supported, speaking, speak, stop, voices };
}
