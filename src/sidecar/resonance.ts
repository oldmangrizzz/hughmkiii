// src/sidecar/resonance.ts
import { ThinkingContext } from "./types";

/**
 * Formats the holographic context into a system prompt block.
 * Interleaves pheromones, relational history, and semantic facts.
 */
export const formatContext = (ctx: ThinkingContext): string => {
  const pheromones = ctx.pheromones
    .map(p => `- [${p.type}] ${p.intent || p.source} (weight: ${p.weight.toFixed(2)})`)
    .join("\n") || "No active pheromones.";

  const history = ctx.relationalHistory
    .map(h => `- ${h}`)
    .join("\n") || "No relational history available.";

  const facts = ctx.semanticFacts
    .map(f => `- ${f}`)
    .join("\n") || "No semantic facts available.";

  return `
<pheromones>
${pheromones}
</pheromones>

<history>
${history}
</history>

<facts>
${facts}
</facts>

<mood>
Cortisol: ${ctx.hormones.cortisol.toFixed(2)}
Dopamine: ${ctx.hormones.dopamine.toFixed(2)}
Adrenaline: ${ctx.hormones.adrenaline.toFixed(2)}
</mood>
`.trim();
};
