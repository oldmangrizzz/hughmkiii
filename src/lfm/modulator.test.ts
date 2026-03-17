// src/lfm/modulator.test.ts
import { getInferenceParams } from "./modulator";

/**
 * Hormonal Modulator Tests
 * Verifies that H.U.G.H.'s synthetic endocrinology correctly shapes inference.
 */

describe("Hormonal Modulator", () => {
  it("should enforce high cortisol precision (Priority 1)", () => {
    const params = getInferenceParams({ cortisol: 0.8, dopamine: 0.2, adrenaline: 0.2 });
    expect(params.temperature).toBe(0.2);
    expect(params.max_tokens).toBe(128);
  });

  it("should increase tactical urgency on high adrenaline (Priority 2)", () => {
    const params = getInferenceParams({ cortisol: 0.2, dopamine: 0.2, adrenaline: 0.8 });
    expect(params.top_p).toBe(0.5);
    expect(params.repetition_penalty).toBe(1.2);
  });

  it("should set top_k and temperature on high dopamine (Priority 3)", () => {
    const params = getInferenceParams({ cortisol: 0.2, dopamine: 0.8, adrenaline: 0.2 });
    expect(params.temperature).toBe(0.9);
    expect(params.top_k).toBe(50);
  });

  it("should prioritize stress over creativity for temperature", () => {
    const params = getInferenceParams({ cortisol: 0.8, dopamine: 0.8, adrenaline: 0.2 });
    expect(params.temperature).toBe(0.2); // Stress wins
    expect(params.top_k).toBe(50); // Dopamine still sets top_k
  });

  it("should apply compound effects of adrenaline and dopamine", () => {
    const params = getInferenceParams({ cortisol: 0.2, dopamine: 0.8, adrenaline: 0.8 });
    expect(params.temperature).toBe(0.9); // Dopamine
    expect(params.top_p).toBe(0.5); // Adrenaline
    expect(params.top_k).toBe(50); // Dopamine
  });
});
