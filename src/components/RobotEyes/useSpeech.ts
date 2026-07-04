/**
 * useSpeech — Text-to-Speech hook using the Web Speech API.
 * Client-side only to avoid hydration mismatches.
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
  const [supported, setSupported] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const synth = window.speechSynthesis;
    if (!synth) return;
    synthRef.current = synth;
    setSupported(true);
    const loadVoices = () => setVoices(synth.getVoices());
    loadVoices();
    synth.addEventListener('voiceschanged', loadVoices);
    return () => synth.removeEventListener('voiceschanged', loadVoices);
  }, []);

  const stop = useCallback(() => {
    synthRef.current?.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback((text: string, options: SpeechOptions = {}) => {
    const synth = synthRef.current;
    if (!synth || !text.trim()) return;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate ?? 1;
    utterance.pitch = options.pitch ?? 1;
    utterance.lang = options.lang ?? 'en-US';
    if (options.voiceName && voices.length > 0) {
      const v = voices.find(v => v.name === options.voiceName);
      if (v) utterance.voice = v;
    } else if (voices.length > 0) {
      const en = voices.find(v => v.lang.startsWith('en'));
      if (en) utterance.voice = en;
    }
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    synth.speak(utterance);
  }, [voices]);

  useEffect(() => { return () => synthRef.current?.cancel(); }, []);

  return { supported, speaking, speak, stop, voices };
}
