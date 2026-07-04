/**
 * useSpeechRecognition — Speech-to-Text hook using the Web Speech API.
 *
 * No API keys needed. Works in Chrome, Edge.
 *
 * Usage:
 *   const { start, stop, listening, transcript, supported } = useSpeechRecognition();
 *   start();
 *   // ... user speaks ...
 *   // transcript updates in real-time
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseSpeechRecognitionOptions {
  /** Language code (default 'en-US') */
  lang?: string;
  /** Whether to return intermediate results (default true) */
  interimResults?: boolean;
  /** Whether to automatically stop after silence (default false) */
  continuous?: boolean;
}

export interface UseSpeechRecognitionState {
  /** Whether speech recognition is supported */
  supported: boolean;
  /** Whether currently listening */
  listening: boolean;
  /** The final transcript */
  transcript: string;
  /** Intermediate transcript while speaking */
  interimTranscript: string;
  /** Start listening */
  start: () => void;
  /** Stop listening */
  stop: () => void;
  /** Reset transcript */
  reset: () => void;
}

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {},
): UseSpeechRecognitionState {
  const { lang = 'en-US', interimResults = true, continuous = false } = options;

  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');

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
        setTranscript(prev => prev ? prev + ' ' + final : final);
        setInterimTranscript('');
      } else {
        setInterimTranscript(interim);
      }
    };

    recognition.onend = () => {
      if (mountedRef.current) setListening(false);
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      if (mountedRef.current) setListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, [supported, lang, interimResults, continuous]);

  const start = useCallback(() => {
    if (!supported || !recognitionRef.current) return;
    setListening(true);
    setInterimTranscript('');
    try {
      recognitionRef.current.start();
    } catch {
      // already started
    }
  }, [supported]);

  const stop = useCallback(() => {
    if (!supported || !recognitionRef.current) return;
    setListening(false);
    recognitionRef.current.stop();
  }, [supported]);

  const reset = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  return { supported, listening, transcript, interimTranscript, start, stop, reset };
}
