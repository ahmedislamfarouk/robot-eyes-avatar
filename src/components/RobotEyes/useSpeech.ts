/**
 * useSpeech — TTS using backend espeak-ng mbrola endpoint.
 * Sounds human, works reliably.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export interface SpeechOptions {
  rate?: number;
  pitch?: number;
  lang?: string;
}

export interface UseSpeechState {
  supported: boolean;
  speaking: boolean;
  speak: (text: string, options?: SpeechOptions) => void;
  stop: () => void;
}

export function useSpeech(): UseSpeechState {
  const [speaking, setSpeaking] = useState(false);
  const [supported] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    setSpeaking(false);
  }, []);

  const speak = useCallback((text: string, options: SpeechOptions = {}) => {
    if (!text.trim()) return;
    stop();

    // Clean text
    const cleanText = text
      .replace(/[*_`#\[\](){}|]/g, '')
      .replace(/\n+/g, '. ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    // Limit text length
    const limitedText = cleanText.substring(0, 800);

    const host = typeof window !== 'undefined'
      ? (import.meta.env.PUBLIC_API_URL || 'http://localhost:8000')
      : 'http://localhost:8000';

    const url = `${host}/api/v1/tts?text=${encodeURIComponent(limitedText)}&speed=160&pitch=50`;

    const audio = new Audio(url);
    audioRef.current = audio;

    audio.onplay = () => setSpeaking(true);
    audio.onended = () => {
      setSpeaking(false);
      audioRef.current = null;
    };
    audio.onerror = (e) => {
      console.warn('TTS error:', e);
      setSpeaking(false);
      audioRef.current = null;
    };

    audio.play().catch((e) => {
      console.warn('TTS play failed:', e);
      setSpeaking(false);
    });
  }, [stop]);

  useEffect(() => { return () => stop(); }, [stop]);

  return { supported, speaking, speak, stop };
}
