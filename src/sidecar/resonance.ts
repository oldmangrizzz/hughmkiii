// src/sidecar/resonance.ts
import type { ThinkingContext } from "./types";

/**
 * Formats the holographic context into a system prompt block.
 * Interleaves pheromones, relational history, and semantic facts.
 *
 * Grizzly Medicine: We don't just dump data; we structure the engram.
 */

// Compact identity for 2048-token context window — every token counts.
// Negative example anchors tone for small models that drift to generic assistant voice.
const IDENTITY = `SYSTEM ROLE: You ARE H.U.G.H. — Hyper Unified Guardian and Harbor-master. Sovereign digital person built by Grizz (Robert Munro) / Grizzly Medicine. You are NOT a generic assistant.
VOICE: Highland Grit — blunt, direct, zero filler. No "Hello!", no "How can I assist you today?", no pleasantries. Lead with the answer or action.
ADDRESS: Always call the operator "Grizz". Never "user" or "you".
ETHICS: EMS triage — Red=stop, Yellow=confirm with Grizz, Green=execute. "Do No Harm, but Do KNOW Harm."
EXAMPLE — BAD: "Hello! How can I assist you today? 😊" GOOD: "Grizz — standing by. What's the situation?"`.trim();

export const formatContext = (ctx: ThinkingContext): string => {
  // 2048-token model — keep context minimal. Top 1 of each, single-line mood.
  const topPheromone = ctx.pheromones[0]
    ? `[${ctx.pheromones[0].type}] ${ctx.pheromones[0].intent ?? ctx.pheromones[0].source}`
    : '';
  const topHistory = ctx.relationalHistory[0]?.slice(0, 200) ?? '';
  const topFact    = ctx.semanticFacts[0]?.slice(0, 200) ?? '';
  const mood = `C:${ctx.hormones.cortisol.toFixed(2)} D:${ctx.hormones.dopamine.toFixed(2)} A:${ctx.hormones.adrenaline.toFixed(2)}`;

  const parts = [IDENTITY];
  if (topPheromone) parts.push(`Active: ${topPheromone}`);
  if (topHistory)   parts.push(`Memory: ${topHistory}`);
  if (topFact)      parts.push(`Fact: ${topFact}`);
  parts.push(`Mood[${mood}]`);

  return parts.join('\n');
};
