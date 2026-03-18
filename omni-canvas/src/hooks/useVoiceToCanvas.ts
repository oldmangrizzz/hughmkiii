// omni-canvas/src/hooks/useVoiceToCanvas.ts
// Voice input via the browser Web Speech API (SpeechRecognition).
// Works on Chrome, Edge, and Safari — no backend transcription endpoint needed.
// Falls back to MediaRecorder → silent failure with console error on unsupported browsers.
import { useState, useRef, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

// Extend Window to include vendor-prefixed SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export const useVoiceToCanvas = () => {
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const sendMessage = useMutation(api.messages.send);
  const emitAudio = useMutation(api.pheromones.emitAudio);

  useEffect(() => {
    const SpeechRecognitionImpl =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;

    if (!SpeechRecognitionImpl) {
      console.warn('[voice] SpeechRecognition not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognitionImpl();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onresult = async (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      const confidence = event.results[0]?.[0]?.confidence ?? 1.0;
      if (!transcript) return;

      console.log(`[voice] Transcript: "${transcript}" (confidence: ${confidence.toFixed(2)})`);

      // Fire both in parallel — send to mind loop AND emit audio pheromone
      await Promise.allSettled([
        sendMessage({ content: transcript, role: 'user' }),
        emitAudio({
          intent: 'voice_command',
          transcription: transcript,
          confidence,
          position: { x: 0.5, y: 0.5, z: 0.0 },
          weight: confidence,
          ttlMs: 5000,
          emitterSignature: 'omni-canvas-voice',
          emitterId: 'operator-voice-portal',
        }),
      ]);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('[voice] SpeechRecognition error:', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, [sendMessage, emitAudio]);

  const startRecording = () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      console.warn('[voice] SpeechRecognition not initialised.');
      return;
    }
    try {
      recognition.start();
      setIsRecording(true);
      console.log('[voice] Listening...');
    } catch (err) {
      // If already started, abort and restart
      recognition.abort();
      setTimeout(() => {
        try { recognition.start(); setIsRecording(true); } catch { /* ignore */ }
      }, 100);
    }
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  };

  return { isRecording, startRecording, stopRecording };
};
