// src/sidecar/index.ts
import { ConvexClient } from "convex/browser";
import axios from "axios";
import { api } from "../../convex/_generated/api";
import { formatContext } from "./resonance";
import { interleave } from "../interleaver/bridge";
import { getInferenceParams } from "../lfm/modulator";
import * as dotenv from "dotenv";

dotenv.config();

const CONVEX_URL = process.env.CONVEX_URL || "http://localhost:3210";
const LFM_URL = process.env.LFM_URL || "http://localhost:8080/v1";

const client = new ConvexClient(CONVEX_URL);

// Heartbeat to detect subscription health
setInterval(() => {
  console.log(`[${new Date().toISOString()}] Mind Sidecar Heartbeat: Nominal`);
}, 60000);

/**
 * Main Thinking Loop:
 * 1. Subscribes to unprocessed messages in Convex.
 * 2. Assembles holographic context (Pheromones, MemGPT, Cognee).
 * 3. Modulates LFM 2.5 parameters based on hormonal scalars.
 * 4. Executes inference and persists the response.
 */
async function startMindLoop() {
  console.log("H.U.G.H. Mind Sidecar active. Listening for user messages...");

  client.subscribe(api.messages.getLatestUnprocessed, {}, async (msg) => {
    if (!msg) return;

    console.log(`[${new Date().toISOString()}] Processing message: "${msg.content}"`);

    try {
      // 1. Sniff the Soil (Hormones & Pheromones)
      const state = await client.query(api.system.getSystemState);
      const hormones = state?.hormones || { cortisol: 0.2, dopamine: 0.2, adrenaline: 0.2 };
      
      const visual = await client.query(api.pheromones.getActiveVisual);
      const somatic = await client.query(api.pheromones.getActiveSomatic);
      
      const pheromones = [
        ...visual.map((v: any) => ({ type: "visual", intent: v.intent, weight: v.weight })),
        ...somatic.map((s: any) => ({ type: "somatic", source: s.source, weight: s.weight }))
      ];

      // 2. Interleave Memory & Knowledge
      const holographicCtx = await interleave(msg.content, hormones, pheromones as any);
      
      // 3. Assemble Prompt & Parameters
      const prompt = formatContext(holographicCtx);
      const params = getInferenceParams(hormones);

      console.log(`[${new Date().toISOString()}] Executing resonance with Cortisol: ${hormones.cortisol.toFixed(2)}`);

      // 4. LFM 2.5 Inference
      const response = await axios.post(`${LFM_URL}/chat/completions`, {
        model: "lfm-2.5",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: msg.content }
        ],
        ...params
      });

      const assistantText = response.data.choices[0].message.content;

      // 5. Persist Response & Mark Processed
      await client.mutation(api.messages.processResponse, { 
        messageId: msg._id, 
        response: assistantText 
      });

      console.log(`[${new Date().toISOString()}] H.U.G.H. Response Processed.`);
    } catch (err: any) {
      console.error(`[${new Date().toISOString()}] Thinking loop error:`, err.message);
    }
  });
}

startMindLoop().catch(err => {
  console.error("Fatal Mind Sidecar failure:", err);
  process.exit(1);
});
