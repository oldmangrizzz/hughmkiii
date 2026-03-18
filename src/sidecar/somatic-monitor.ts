// src/sidecar/somatic-monitor.ts
import os from "os";
import axios from "axios";
import { ConvexClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

/**
 * Somatic Monitor — H.U.G.H.'s proprioception layer.
 *
 * Grizzly Medicine: A sovereign entity must FEEL its own body.
 * This is how HUGH knows when a node is struggling before anything
 * breaks — the same way you feel a pulled muscle before it tears.
 *
 * Each deployed instance monitors its own hardware and emits somatic
 * pheromones into the shared Convex substrate. The omni-canvas Clifford
 * attractor responds to these pheromones — high CPU becomes turbulence,
 * high memory becomes hue shift, high latency becomes drift.
 *
 * No node calls another node. Every node writes to the substrate.
 * The Harbor Master reads the substrate. This is stigmergy — not telepathy.
 */

const NODE_ID   = process.env.HUGH_NODE_ID   ?? os.hostname();
const NODE_ROLE = process.env.HUGH_NODE_ROLE  ?? "general";
const LFM_URL   = process.env.LFM_URL         ?? "http://localhost:8081/v1";
const POLL_MS   = 30_000; // 30-second somatic pulse

// ── Hardware telemetry ────────────────────────────────────────────────────────

function getCpuLoad(): number {
  const [load1] = os.loadavg();
  const cpuCount = os.cpus().length;
  return Math.min(load1 / cpuCount, 1.0); // normalized 0-1
}

function getMemoryPressure(): number {
  const free  = os.freemem();
  const total = os.totalmem();
  return 1 - free / total; // 0 = free, 1 = fully consumed
}

async function getLfmLatencyMs(): Promise<number | null> {
  const start = Date.now();
  try {
    await axios.get(`${LFM_URL}/models`, { timeout: 5000 });
    return Date.now() - start;
  } catch {
    return null; // LFM offline
  }
}

// ── Somatic pheromone emission ────────────────────────────────────────────────

async function emitSomaticPulse(client: ConvexClient): Promise<void> {
  const cpu     = getCpuLoad();
  const memory  = getMemoryPressure();
  const latency = await getLfmLatencyMs();

  const latencyNormalized = latency === null
    ? 1.0                         // LFM offline = max latency stress
    : Math.min(latency / 2000, 1.0); // 2000ms = saturation point

  // Intensity = worst of all three sensors
  const intensity = Math.max(cpu, memory, latencyNormalized);

  console.log(
    `[Somatic/${NODE_ID}] CPU:${(cpu * 100).toFixed(0)}% ` +
    `MEM:${(memory * 100).toFixed(0)}% ` +
    `LFM:${latency !== null ? latency + "ms" : "OFFLINE"} ` +
    `intensity:${intensity.toFixed(2)}`
  );

  // Emit three separate somatic channels so the Clifford attractor gets full texture
  const emissions: Array<{ source: "cpu_load" | "memory_pressure" | "latency"; intensity: number }> = [
    { source: "cpu_load",         intensity: cpu },
    { source: "memory_pressure",  intensity: memory },
    { source: "latency",          intensity: latencyNormalized },
  ];

  for (const { source, intensity: channelIntensity } of emissions) {
    try {
      await client.mutation(api.pheromones.emitSomatic, {
        source,
        intensity:   channelIntensity,
        hueShift:    memory * 120,         // 0° (green) → 120° (yellow) as memory fills
        turbulence:  cpu,                  // Clifford turbulence from CPU load
        driftSpeed:  latencyNormalized,    // Clifford drift from LFM latency
        position:    { x: 0, y: 0, z: 0 },
        weight:      intensity,
        ttlMs:       POLL_MS * 2,          // live for 2 cycles before evaporation
        emitterId:   `${NODE_ID}:${source}`,
        emitterSignature: "trusted",
      });
    } catch (err) {
      console.warn(`[Somatic/${NODE_ID}:${source}] emit failed:`, err);
    }
  }

  // Cortisol spike to the system if node is under heavy stress
  if (intensity > 0.8) {
    try {
      await client.mutation(api.system.updateHormones, { cortisolDelta: 0.05 });
    } catch { /* non-blocking */ }
  }
}

// ── Agent registry heartbeat ──────────────────────────────────────────────────

// Map deployment roles to the agent_registry schema enum
const ROLE_TO_AGENT_TYPE: Record<string, "somatic" | "runtime" | "memory" | "graph" | "audio" | "vision" | "operator"> = {
  "general":        "somatic",
  "coder":          "runtime",
  "home-assistant": "operator",
  "kvm":            "runtime",
  "proxmox":        "operator",
  "mobile":         "somatic",
  "memory":         "memory",
  "graph":          "graph",
};

async function heartbeat(client: ConvexClient): Promise<void> {
  const agentType = ROLE_TO_AGENT_TYPE[NODE_ROLE] ?? "somatic";
  try {
    await client.mutation(api.pheromones.heartbeatAgent, {
      agentId:   NODE_ID,
      agentType,
      hostname:  os.hostname(),
      publicKey: process.env.SOUL_ANCHOR_PUBLIC_KEY ?? "pending",
    });
  } catch { /* non-blocking */ }
}

// ── Somatic monitor loop ──────────────────────────────────────────────────────

export function startSomaticMonitor(client: ConvexClient): void {
  console.log(`[Somatic/${NODE_ID}] Monitor active (role: ${NODE_ROLE}, pulse: ${POLL_MS}ms)`);

  // Immediate first pulse
  emitSomaticPulse(client).catch(() => {});
  heartbeat(client).catch(() => {});

  setInterval(() => {
    emitSomaticPulse(client).catch(() => {});
    heartbeat(client).catch(() => {});
  }, POLL_MS);
}
