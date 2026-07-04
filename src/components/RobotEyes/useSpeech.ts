/**
 * useSpeech — TTS using free Google Translate TTS endpoint.
 * Sounds human, works everywhere, no API key needed.
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
      audioRef.current = null;
    }
    setSpeaking(false);
  }, []);

  const speak = useCallback((text: string, options: SpeechOptions = {}) => {
    if (!text.trim()) return;
    stop();

    // Clean text for TTS
    const cleanText = text
      .replace(/[*_`#\[\](){}]/g, '')
      .replace(/\n+/g, '. ')
      .replace(/[^\w\s.,!?;:'-]/g, '')
      .trim();

    if (!cleanText) return;

    // Split long text into chunks (Google TTS has a 200 char limit per request)
    const chunks: string[] = [];
    const sentences = cleanText.match(/[^.!?]+[.!?]+/g) || [cleanText];
    let current = '';
    for (const sentence of sentences) {
      if (current.length + sentence.length > 180) {
        if (current) chunks.push(current);
        current = sentence;
      } else {
        current += sentence;
      }
    }
    if (current) chunks.push(current);

    // Play chunks sequentially
    let index = 0;
    const playNext = () => {
      if (index >= chunks.length) {
        setSpeaking(false);
        return;
      }
      const chunk = chunks[index];
      index++;
      const lang = options.lang || 'en';
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=${lang}&client=tw-ob`;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => playNext();
      audio.onerror = () => {
        console.warn('TTS chunk failed, trying next...');
        playNext();
      };
      audio.play().catch(() => playNext());
    };

    setSpeaking(true);
    playNext();
  }, [stop]);

  useEffect(() => { return () => stop(); }, [stop]);

  return { supported, speaking, speak, stop };
}
