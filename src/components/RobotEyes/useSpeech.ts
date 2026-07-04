/**
 * useSpeech — TTS using Web Speech API with mbrola voice (human-sounding).
 * Falls back to espeak-ng if mbrola isn't available.
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
  voices: SpeechSynthesisVoice[];
}

export function useSpeech(): UseSpeechState {
  const [speaking, setSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [supported, setSupported] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const speakingRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const synth = window.speechSynthesis;
    if (!synth) return;
    synthRef.current = synth;
    setSupported(true);
    const loadVoices = () => {
      const v = synth.getVoices();
      setVoices(v);
      // Log available voices
      console.log('Voices:', v.map(x => `${x.name} [${x.lang}]`).join(', '));
    };
    loadVoices();
    synth.addEventListener('voiceschanged', loadVoices);
    return () => synth.removeEventListener('voiceschanged', loadVoices);
  }, []);

  const stop = useCallback(() => {
    synthRef.current?.cancel();
    speakingRef.current = false;
    setSpeaking(false);
  }, []);

  const speak = useCallback((text: string, options: SpeechOptions = {}) => {
    const synth = synthRef.current;
    if (!synth || !text.trim()) return;

    synth.cancel();

    // Clean text
    const cleanText = text
      .replace(/[*_`#\[\](){}|]/g, '')
      .replace(/\n+/g, '. ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = options.rate ?? 0.85;
    utterance.pitch = options.pitch ?? 1.1;
    utterance.lang = options.lang ?? 'en-US';

    // Pick best voice: mbrola > Google > en-US > first
    if (voices.length > 0) {
      const mbrola = voices.find(v => v.name.includes('us-mbrola'));
      const google = voices.find(v => v.name.includes('Google') && v.lang.startsWith('en'));
      const enUs = voices.find(v => v.lang === 'en-US');
      const en = voices.find(v => v.lang.startsWith('en'));
      utterance.voice = mbrola || google || enUs || en || voices[0];
      console.log('Using voice:', utterance.voice?.name, utterance.voice?.lang);
    }

    utterance.onstart = () => { speakingRef.current = true; setSpeaking(true); };
    utterance.onend = () => { speakingRef.current = false; setSpeaking(false); };
    utterance.onerror = (e) => {
      console.warn('TTS error:', e.error);
      speakingRef.current = false;
      setSpeaking(false);
    };

    // Chrome keep-alive workaround
    const keepAlive = setInterval(() => {
      if (synth.speaking && !synth.paused) {
        synth.pause();
        synth.resume();
      } else {
        clearInterval(keepAlive);
      }
    }, 8000);

    synth.speak(utterance);
  }, [voices]);

  useEffect(() => { return () => synthRef.current?.cancel(); }, []);

  return { supported, speaking, speak, stop, voices };
}
