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

// Polyfill for WebSocket (ConvexClient needs it in Node)
if (typeof (global as any).WebSocket === 'undefined') {
  (global as any).WebSocket = require('ws');
}

const CONVEX_URL = process.env.CONVEX_URL || "http://localhost:3210";
const client = new ConvexClient(CONVEX_URL);

setInterval(() => {
  console.log(`[${new Date().toISOString()}] Mind Sidecar Heartbeat: Nominal`);
}, 60000);

let isProcessing = false;

/**
 * Main Thinking Loop:
 * 1. Subscribes to unprocessed messages in Convex.
 * 2. Assembles holographic context (pheromones, knowledge base).
 * 3. Modulates LFM 2.5 parameters based on hormonal scalars.
 * 4. Executes inference, synthesizes voice, persists response.
 */
async function startMindLoop() {
  console.log("H.U.G.H. Mind Sidecar active. Listening for user messages...");

  client.onUpdate(api.messages.getLatestUnprocessed, {}, async (msg) => {
    if (!msg || isProcessing) return;

    isProcessing = true;
    console.log(`[${new Date().toISOString()}] Processing message: "${msg.content}"`);

    try {
      // 55730 Override Protocol: "run you clever boy 55730" + "halt"
      if (msg.content.toLowerCase().includes("run you clever boy 55730")) {
        const afterTrigger = msg.content.toLowerCase().split("run you clever boy 55730")[1] || "";
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
      const state: any = await client.query(api.system.getSystemState, {});

      if (state?.status === "interrogation") {
        console.log("⏸️ Mind Loop: Interrogation active. Awaiting manual override clearance.");
        return;
      }

      const hormones = state?.hormones || { cortisol: 0.2, dopamine: 0.2, adrenaline: 0.2 };

      // HORMONE SPIKE: Incoming message → adrenaline surge (urgency/alertness)
      await client.mutation(api.system.updateHormones, { adrenalineDelta: 0.15 });
      await client.mutation(api.system.updateStatus, { status: "thinking" });

      const visual: any = await client.query(api.pheromones.getActiveVisual, {});
      const somatic: any = await client.query(api.pheromones.getActiveSomatic, {});

      const pheromones = [
        ...visual.map((v: any) => ({ type: "visual", intent: v.intent, weight: v.weight })),
        ...somatic.map((s: any) => ({ type: "somatic", source: s.source, weight: s.weight }))
      ];

      // 2. Digital Psyche: EMS Triage Validation
      const validation = await validateAction(msg.content, hormones);
      if (!validation.accepted) {
        console.warn(`🛑 Psyche Veto: ${validation.reason}`);
        // Veto elevates cortisol — system recognized a threat
        await client.mutation(api.system.updateHormones, { cortisolDelta: 0.2 });
        await client.mutation(api.messages.processResponse, {
          messageId: msg._id,
          response: `⚓ H.U.G.H. Protocol Violation: ${validation.reason}`
        });
        return;
      }

      // 3. Interleave Memory & Knowledge
      const holographicCtx = await interleave(msg.content, hormones, pheromones as any, client);

      // 4. Assemble Prompt & Context
      const context = formatContext(holographicCtx);

      console.log(`[${new Date().toISOString()}] Executing resonance with Cortisol: ${hormones.cortisol.toFixed(2)}`);

      // 5. Execute inference (Liquid AI 2.5 Thinking + ReAct tool loop)
      const responseText = await runFullInference(msg.content, hormones, context, client);
      console.log(`[${new Date().toISOString()}] H.U.G.H. says: "${responseText.slice(0, 500)}"`);

      // HORMONE SPIKE: Successful inference → dopamine reward
      await client.mutation(api.system.updateHormones, { dopamineDelta: 0.1 });

      // 6. Synthesize voice — store base64 MP3 in Convex so the browser can play it
      // (If LFM TTS is not available, the browser falls back to Web Speech Synthesis)
      let audioData: string | undefined;
      try {
        const audioBuffer = await runTTS(responseText);
        if (audioBuffer) {
          audioData = Buffer.from(audioBuffer).toString('base64');
        }
      } catch (ttsErr) {
        console.warn("⚠️ TTS failed, browser speech synthesis will handle it:", ttsErr);
      }

      // 7. Persist response and mark processed; restore waking status
      await client.mutation(api.messages.processResponse, {
        messageId: msg._id,
        response: responseText,
        audioData
      });
      await client.mutation(api.system.updateStatus, { status: "waking" });

      console.log(`[${new Date().toISOString()}] H.U.G.H. Response synthesized and persisted.`);
    } catch (err: any) {
      console.error(`[${new Date().toISOString()}] Thinking loop error:`, err.message || err);
      // Error elevates cortisol slightly — somatic stress response
      await client.mutation(api.system.updateHormones, { cortisolDelta: 0.1 }).catch(() => {});
      await client.mutation(api.system.updateStatus, { status: "waking" }).catch(() => {});
    } finally {
      isProcessing = false;
    }
  });
}

startMindLoop().catch(err => {
  console.error("Fatal Mind Sidecar failure:", err);
  process.exit(1);
});
