// src/lfm/modulator.ts
import { Hormones } from "../sidecar/types";

export interface InferenceParams {
  temperature: number;
  top_p: number;
  max_tokens: number;
  repetition_penalty: number;
  top_k?: number;
}

/**
 * Modulates LFM 2.5 inference parameters based on synthetic endocrinology.
 * 
 * Grizzly Medicine: Stress suppresses creativity; urgency forces focus.
 * PRECEDENCE: Stress (Cortisol) > Tactical (Adrenaline) > Creative (Dopamine).
 */
export const getInferenceParams = (hormones: Hormones): InferenceParams => {
  let params: InferenceParams = {
    temperature: 0.7,
    top_p: 0.9,
    max_tokens: 512,
    repetition_penalty: 1.1
  };

  // High Cortisol (Stress) -> Priority 1: High precision, low verbosity.
  // We clamp down for the mission-critical path.
  if (hormones.cortisol > 0.7) {
    params.temperature = 0.2;
    params.max_tokens = 128;
  } 
  
  // High Adrenaline (Urgency) -> Priority 2: Tactical snap and reduced repetition.
  if (hormones.adrenaline > 0.7) {
    params.top_p = 0.5;
    params.repetition_penalty = 1.2;
  }

  // High Dopamine (Reward) -> Priority 3: Creative resonance and higher temperature.
  if (hormones.dopamine > 0.7) {
    // Only increase temperature if not suppressed by Cortisol
    if (hormones.cortisol <= 0.7) {
      params.temperature = 0.9;
    }
    params.top_k = 50;
  }

  return params;
};
