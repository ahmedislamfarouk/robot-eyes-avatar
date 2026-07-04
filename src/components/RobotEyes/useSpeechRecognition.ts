/**
 * useSpeechRecognition — Speech-to-Text hook using the Web Speech API.
 * No API keys needed. Works in Chrome, Edge.
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

  const recognitionRef = useRef<any>(null);
  const mountedRef = useRef(true);

  const supported = typeof window !== 'undefined' && (
    'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Create recognition instance
  useEffect(() => {
    if (!supported) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.interimResults = interimResults;
    recognition.continuous = continuous;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      if (!mountedRef.current) return;

      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (final) {
        setTranscript(prev => prev ? prev + ' ' + final.trim() : final.trim());
        setInterimTranscript('');
      } else {
        setInterimTranscript(interim);
      }
    };

    recognition.onend = () => {
      if (mountedRef.current) {
        setListening(false);
        setInterimTranscript('');
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      if (mountedRef.current) {
        setListening(false);
        setInterimTranscript('');
        if (event.error === 'not-allowed') {
          setError('Microphone access denied. Please allow microphone in your browser settings.');
        } else if (event.error === 'no-speech') {
          setError('No speech detected. Try speaking again.');
        } else {
          setError(`Speech recognition error: ${event.error}`);
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try { recognition.abort(); } catch {}
    };
  }, [supported, lang, interimResults, continuous]);

  const start = useCallback(() => {
    if (!supported || !recognitionRef.current) {
      setError('Speech recognition not supported in this browser.');
      return;
    }
    setError(null);
    setTranscript('');
    setInterimTranscript('');
    setListening(true);
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.warn('STT start error:', e);
      setListening(false);
    }
  }, [supported]);

  const stop = useCallback(() => {
    if (!supported || !recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch {}
    setListening(false);
    setInterimTranscript('');
  }, [supported]);

  const reset = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
  }, []);

  return { supported, listening, transcript, interimTranscript, error, start, stop, reset };
}
