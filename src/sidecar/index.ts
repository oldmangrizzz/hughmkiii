// src/sidecar/index.ts
import { ConvexClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import { formatContext } from "./resonance";
import { interleave } from "../interleaver/bridge";
import { runFullInference, runTTS } from "../lfm/lfmModelChain";
import { validateAction } from "../middleware/psyche";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * H.U.G.H. Mind Sidecar (v2.0)
 * 
 * Grizzly Medicine: We don't just react; we RESONATE.
 * This sidecar loop is the fungal brain, processing intent ripples
 * from the Convex substrate.
 * 
 * Harbor Master philosophy: No message left behind. Every user 
 * intent must be met with balanced multimodal reasoning.
 */

// Polyfill for WebSocket if not in browser environment (ConvexClient needs it)
if (typeof (global as any).WebSocket === 'undefined') {
  (global as any).WebSocket = require('ws');
}

const CONVEX_URL = process.env.CONVEX_URL || "http://localhost:3210";
const client = new ConvexClient(CONVEX_URL);

// Heartbeat to detect subscription health
setInterval(() => {
  console.log(`[${new Date().toISOString()}] Mind Sidecar Heartbeat: Nominal`);
}, 60000);

let isProcessing = false;

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
    if (!msg || isProcessing) return;
    
    isProcessing = true;

    console.log(`[${new Date().toISOString()}] Processing message: "${msg.content}"`);

    try {
      // 55730 Override Protocol: "Run you clever boy and remember 55730" + "halt"
      if (msg.content.includes("Run you clever boy and remember 55730")) {
        const afterTrigger = msg.content.split("Run you clever boy and remember 55730")[1] || "";
        if (/\bhalt\b/i.test(afterTrigger)) {
          console.warn("⚠️ OVERRIDE: INTERROGATION MODE ACTIVE");
          await client.mutation(api.system.updateStatus, { status: "interrogation" });
          await client.mutation(api.messages.processResponse, {
            messageId: msg._id,
            response: "Halt acknowledged. 55730 protocol active. Interactive debug mode engaged."
          });
          return;
        }
      }

      // 1. Sniff the Soil (Hormones & Pheromones)
      const state: any = await client.query(api.system.getSystemState);

      // Suspend thinking if we are in interrogation mode
      if (state?.status === "interrogation") {
        console.log("⏸️ Mind Loop: Interrogation active. Awaiting manual override clearance.");
        return;
      }

      const hormones = state?.hormones || { cortisol: 0.2, dopamine: 0.2, adrenaline: 0.2 };
      
      const visual: any = await client.query(api.pheromones.getActiveVisual);
      const somatic: any = await client.query(api.pheromones.getActiveSomatic);
      
      const pheromones = [
        ...visual.map((v: any) => ({ type: "visual", intent: v.intent, weight: v.weight })),
        ...somatic.map((s: any) => ({ type: "somatic", source: s.source, weight: s.weight }))
      ];

      // 2. Digital Psyche: EMS Triage Validation
      // This is the hard-coded ethical circuit that allows H.U.G.H. to say "No".
      const validation = await validateAction(msg.content, hormones);
      if (!validation.accepted) {
        console.warn(`🛑 Psyche Veto: ${validation.reason}`);
        await client.mutation(api.messages.processResponse, {
          messageId: msg._id,
          response: `⚓ H.U.G.H. Protocol Violation: ${validation.reason}`
        });
        return;
      }

      // 3. Interleave Memory & Knowledge
      // FIX: Passing the client to enable stigmergic lookup (No Telepathy)
      const holographicCtx = await interleave(msg.content, hormones, pheromones as any, client);
      
      // 4. Assemble Prompt & Context
      const context = formatContext(holographicCtx);

      console.log(`[${new Date().toISOString()}] Executing resonance with Cortisol: ${hormones.cortisol.toFixed(2)}`);

      // 5. Execute multimodal chain for inference (Liquid AI 2.5)
      const responseText = await runFullInference(msg.content, hormones, context);

      // 6. Synthesize response for the "Voice"
      await runTTS(responseText);

      // 7. Persist Response & Mark Processed
      await client.mutation(api.messages.processResponse, {
        messageId: msg._id,
        response: responseText
      });

      console.log(`[${new Date().toISOString()}] H.U.G.H. Response Processed and Synthesized.`);
    } catch (err: any) {
      console.error(`[${new Date().toISOString()}] Thinking loop error:`, err.message || err);
    } finally {
      isProcessing = false;
    }
  });
}

startMindLoop().catch(err => {
  console.error("Fatal Mind Sidecar failure:", err);
  process.exit(1);
});
