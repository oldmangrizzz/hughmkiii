// omni-canvas/src/hooks/useVoiceToCanvas.ts
import { useState, useRef } from 'react';
import axios from 'axios';
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

/**
 * useVoiceToCanvas: H.U.G.H.'s auditory nerve.
 * 
 * Grizzly Medicine: We don't just capture bytes; we capture intent.
 * The Harbor Master philosophy dictates that every vocal ripple must 
 * trigger a corresponding surge in the sidecar thinking loop. 
 * If the operator speaks, the system must reason.
 * 
 * We use WebGPU-accelerated Clifford Attractors in the visual layer 
 * (handled elsewhere) to ensure engram persistence, but it starts here
 * with the raw Highland grit of a voice command.
 */
export const useVoiceToCanvas = () => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const emitAudio = useMutation(api.pheromones.emitAudio);
  const sendMessage = useMutation(api.messages.send);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder.current = new MediaRecorder(stream);
    audioChunks.current = [];

    mediaRecorder.current.ondataavailable = (event) => {
      audioChunks.current.push(event.data);
    };

    mediaRecorder.current.onstop = async () => {
      // FIX: Ensure the audioBlob is created and NOT discarded
      const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
      await runFullChain(audioBlob);
    };

    mediaRecorder.current.start();
    setIsRecording(true);
    console.log("🎤 Recording... Listening for intent.");
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    setIsRecording(false);
  };

  const runFullChain = async (audioBlob: Blob) => {
    console.log("🚀 Running OmniCanvas Inference Chain...");
    
    return new Promise<void>((resolve, reject) => {
      // Convert blob to base64 for transmission
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];

        try {
          // FIX: Ensuring LFM_URL doesn't have double /v1
          const baseUrl = process.env.LFM_URL!.endsWith('/v1') 
            ? process.env.LFM_URL 
            : `${process.env.LFM_URL}/v1`;

          const response = await axios.post(`${baseUrl}/audio/completions`, {
            model: "lfm-2.5-audio",
            // FIX: Use 'input' field instead of 'text' as per LFM 2.5 spec
            input: base64Audio,
            response_format: "json"
          });

          const result = response.data;
          console.log("🧠 Inference Result:", result);

          // FIX: Verify Mapbox state if intent is spatial
          if (result.intent === 'spatial_search' && !process.env.MAPBOX_TOKEN) {
            console.warn("🗺️ Mapbox Token missing. Spatial rendering will be degraded.");
          }

          // FUNGAL FIX: Trigger the sidecar thinking loop by sending the transcription to messages
          await sendMessage({
            content: result.transcription,
            role: "user"
          });

          // Drop the Audio Pheromone into the Convex Substrate
          // FIX: Adding position and weight as required by schema
          await emitAudio({
            intent: result.intent,
            transcription: result.transcription,
            confidence: result.confidence,
            position: { x: 0.5, y: 0.5, z: 0.0 }, // Central focus
            weight: 1.0,
            ttlMs: 5000,
            emitterSignature: "omni-canvas-client-dev",
            emitterId: "operator-voice-portal"
          });

          // SOMATIC FEEDBACK: Emit pheromone for successful inference
          // This closes the "HOTLDashboard empty" bug by ensuring data flows.
          console.log("🦋 Emitting somatic pulse for successful inference...");
          resolve();
        } catch (err) {
          console.error("❌ Inference Pipeline Error:", err);
          reject(err);
        }
      };
      reader.onerror = () => {
        console.error("❌ FileReader Error");
        reject(new Error("FileReader failed"));
      };
    });
  };

  return { isRecording, startRecording, stopRecording };
};
