/**
 * useSpeech — Text-to-Speech hook using the Web Speech API.
 * No API keys needed. Works in Chrome, Edge, Safari.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export interface SpeechOptions {
  rate?: number;
  pitch?: number;
  lang?: string;
  voiceName?: string;
}

export interface UseSpeechState {
  supported: boolean;
  speaking: boolean;
  speak: (text: string, options?: SpeechOptions) => void;
  stop: () => void;
  voices: SpeechSynthesisVoice[];
}

export function useSpeech(): UseSpeechState {
  const [speaking, setSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const unlockedRef = useRef(false);

  // Load voices
  useEffect(() => {
    if (!supported) return;
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      setVoices(v);
    };
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, [supported]);

  // Unlock speech on first user interaction
  const unlock = useCallback(() => {
    if (!supported || unlockedRef.current) return;
    unlockedRef.current = true;
    // Chrome needs a silent utterance to unlock
    try {
      const u = new SpeechSynthesisUtterance('');
      u.volume = 0;
      window.speechSynthesis.speak(u);
    } catch {}
  }, [supported]);

  useEffect(() => {
    if (!supported) return;
    const handler = () => unlock();
    window.addEventListener('click', handler, { once: true });
    window.addEventListener('keydown', handler, { once: true });
    return () => {
      window.removeEventListener('click', handler);
      window.removeEventListener('keydown', handler);
    };
  }, [supported, unlock]);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  const speak = useCallback((text: string, options: SpeechOptions = {}) => {
    if (!supported || !text.trim()) return;

    unlock();

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate ?? 1;
    utterance.pitch = options.pitch ?? 1;
    utterance.lang = options.lang ?? 'en-US';

    // Pick a good voice
    if (options.voiceName) {
      const v = voices.find(v => v.name === options.voiceName);
      if (v) utterance.voice = v;
    } else if (voices.length > 0) {
      // Prefer a natural-sounding English voice
      const preferred = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google'));
      const english = voices.find(v => v.lang.startsWith('en'));
      utterance.voice = preferred || english || voices[0];
    }

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = (e) => {
      console.warn('TTS error:', e.error);
      setSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [supported, voices, unlock]);

  useEffect(() => {
    return () => { if (supported) window.speechSynthesis.cancel(); };
  }, [supported]);

  return { supported, speaking, speak, stop, voices };
}
