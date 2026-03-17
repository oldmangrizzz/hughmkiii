// src/lfm/lfmModelChain.ts
import axios from 'axios';
import { Hormones } from '../sidecar/types';
import { getInferenceParams } from './modulator';

/**
 * lfmModelChain: Coordinates the multimodal offloading for H.U.G.H.
 * 
 * Grizzly Medicine: This isn't just a model chain; it's a cognitive nervous system.
 * We handle the transition from raw text inference to affective speech synthesis
 * because H.U.G.H. needs a voice that reflects the Highland grit of its origin.
 * 
 * The Harbor Master philosophy ensures that every inference is anchored in 
 * the project's infrastructure, maintaining a tight loop between thought 
 * and action. We chose WebGPU Clifford Attractors for engram persistence 
 * in the visual layer (omni-canvas) to ensure that H.U.G.H.'s memory 
 * isn't just stored—it's felt.
 */

export const runFullInference = async (query: string, hormones: Hormones, context: string) => {
  console.log("🧠 LFM: Running Full Inference Chain...");
  
  const baseUrl = process.env.LFM_URL!.endsWith('/v1') 
    ? process.env.LFM_URL 
    : `${process.env.LFM_URL}/v1`;

  const response = await axios.post(`${baseUrl}/chat/completions`, {
    model: "lfm-2.5-thinking",
    messages: [
      { role: "system", content: context },
      { role: "user", content: query }
    ],
    ...getInferenceParams(hormones)
  });

  return response.data.choices[0].message.content;
};

/**
 * runTTS: Synthesizes H.U.G.H.'s response into the Flanagan Highland grit.
 * FIX: Using 'input' field instead of 'text' as per LFM 2.5 spec.
 */
export const runTTS = async (text: string) => {
  console.log("🗣️ LFM: Synthesizing speech...");
  
  const baseUrl = process.env.LFM_URL!.endsWith('/v1') 
    ? process.env.LFM_URL 
    : `${process.env.LFM_URL}/v1`;

  try {
    const response = await axios.post(`${baseUrl}/audio/speech`, {
      model: "lfm-2.5-tts",
      // FIX: Single field name mismatch corrected here
      input: text, 
      voice: "flanagan",
      response_format: "mp3"
    }, {
      responseType: 'arraybuffer'
    });

    return response.data;
  } catch (err) {
    console.error("❌ TTS Synthesis Error:", err);
    return null;
  }
};
