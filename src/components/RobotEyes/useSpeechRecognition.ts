/**
 * useSpeechRecognition — Speech-to-Text using Web Speech API.
 * Client-side only to avoid hydration mismatches.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseSpeechRecognitionOptions {
  lang?: string;
  interimResults?: boolean;
  continuous?: boolean;
}

export interface UseSpeechRecognitionState {
  supported: boolean;
  listening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {},
): UseSpeechRecognitionState {
  const { lang = 'en-US', interimResults = true, continuous = false } = options;

  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }
    setSupported(true);

    const recognition = new SR();
    recognition.lang = lang;
    recognition.interimResults = interimResults;
    recognition.continuous = continuous;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      if (!mountedRef.current) return;
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript;
        else interim += event.results[i][0].transcript;
      }
      if (final) { setTranscript(p => p ? p + ' ' + final.trim() : final.trim()); setInterimTranscript(''); }
      else setInterimTranscript(interim);
    };

    recognition.onend = () => { if (mountedRef.current) { setListening(false); setInterimTranscript(''); } };
    recognition.onerror = (e: any) => {
      console.warn('STT error:', e.error);
      if (mountedRef.current) {
        setListening(false); setInterimTranscript('');
        if (e.error === 'not-allowed') setError('Microphone access denied.');
        else if (e.error === 'no-speech') setError('No speech detected.');
        else if (e.error === 'network') setError('Network error.');
        else setError(`Error: ${e.error}`);
      }
    };

    recognitionRef.current = recognition;
    return () => { try { recognition.abort(); } catch {} };
  }, [lang, interimResults, continuous]);

  const start = useCallback(() => {
    if (!recognitionRef.current) { setError('STT not supported.'); return; }
    setError(null); setTranscript(''); setInterimTranscript(''); setListening(true);
    try { recognitionRef.current.start(); } catch { setListening(false); }
  }, []);

  const stop = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch {}
    setListening(false); setInterimTranscript('');
  }, []);

  const reset = useCallback(() => { setTranscript(''); setInterimTranscript(''); setError(null); }, []);

  return { supported, listening, transcript, interimTranscript, error, start, stop, reset };
}
