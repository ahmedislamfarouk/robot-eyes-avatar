/**
 * useSpeech — Text-to-Speech hook using the Web Speech API.
 * Defers browser checks to client side only to avoid hydration mismatches.
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

  // Client-side only init
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

    // Pick voice
    if (options.voiceName && voices.length > 0) {
      const v = voices.find(v => v.name === options.voiceName);
      if (v) utterance.voice = v;
    } else if (voices.length > 0) {
      const en = voices.find(v => v.lang.startsWith('en'));
      if (en) utterance.voice = en;
    }

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = (e) => {
      console.warn('TTS error:', e.error);
      setSpeaking(false);
      // Retry once with a different approach
      if (e.error === 'synthesis-failed' || e.error === 'canceled') {
        setTimeout(() => {
          try {
            const u2 = new SpeechSynthesisUtterance(text);
            u2.rate = utterance.rate;
            u2.pitch = utterance.pitch;
            u2.lang = utterance.lang;
            if (utterance.voice) u2.voice = utterance.voice;
            u2.onstart = () => setSpeaking(true);
            u2.onend = () => setSpeaking(false);
            u2.onerror = () => setSpeaking(false);
            synth.speak(u2);
          } catch {}
        }, 200);
      }
    };

    // Chrome bug workaround: speak in a loop to prevent stopping
    const keepAlive = setInterval(() => {
      if (synth.speaking && !synth.paused) {
        synth.pause();
        synth.resume();
      } else {
        clearInterval(keepAlive);
      }
    }, 10000);

    synth.speak(utterance);
  }, [voices]);

  useEffect(() => {
    return () => synthRef.current?.cancel();
  }, []);

  return { supported, speaking, speak, stop, voices };
}
