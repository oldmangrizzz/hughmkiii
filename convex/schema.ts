// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const spatialPosition = v.object({
  x: v.float64(),
  y: v.float64(),
  z: v.float64(),
});

export const contentPayload = v.union(
  v.object({ type: v.literal("media"), url: v.string() }),
  v.object({ type: v.literal("text"), body: v.string() }),
  v.object({ type: v.literal("dashboard"), layout: v.string() }),
  v.object({ type: v.literal("control"), action: v.string() })
);

export const visualIntent = v.union(
  v.literal("idle"),
  v.literal("media_playback"),
  v.literal("spatial_search"),
  v.literal("text_display"),
  v.literal("dashboard"),
  v.literal("navigation"),
  v.literal("alert"),
  v.literal("control"),
  v.literal("ha_control")
);

export const somaticSource = v.union(
  v.literal("latency"),
  v.literal("cpu_load"),
  v.literal("memory_pressure"),
  v.literal("data_corruption"),
  v.literal("context_pressure"),
  v.literal("error_recovery"),
  v.literal("network_disruption")
);

export default defineSchema({
  visual_pheromones: defineTable({
    intent: visualIntent,
    position: spatialPosition,
    size: v.object({ width: v.float64(), height: v.float64() }),
    weight: v.float64(),
    content: contentPayload,
    expiresAt: v.number(),
    emitterId: v.string(),
    emitterSignature: v.string(),
  }).index("by_expiration", ["expiresAt"]),

  audio_pheromones: defineTable({
    intent: v.string(),
    transcription: v.optional(v.string()),
    intentVector: v.optional(v.array(v.float64())),
    confidence: v.float64(),
    position: spatialPosition,
    weight: v.float64(),
    expiresAt: v.number(),
    emitterId: v.string(),
    emitterSignature: v.string(),
  }).index("by_expiration", ["expiresAt"]),

  somatic_pheromones: defineTable({
    source: somaticSource,
    intensity: v.float64(),
    hueShift: v.optional(v.float64()),
    turbulence: v.optional(v.float64()),
    driftSpeed: v.optional(v.float64()),
    position: spatialPosition,
    weight: v.float64(),
    expiresAt: v.number(),
    emitterId: v.string(),
    emitterSignature: v.string(),
  }).index("by_expiration", ["expiresAt"]),

  system_state: defineTable({
    status: v.union(v.literal("waking"), v.literal("thinking"), v.literal("asleep")),
    sleepPhase: v.optional(v.union(v.literal("drift"), v.literal("rem"), v.literal("deep"))),
    hormones: v.object({
      cortisol: v.float64(),
      dopamine: v.float64(),
      adrenaline: v.float64(),
    }),
    lastPulse: v.number(),
  }),

  pheromone_audit: defineTable({
    timestamp: v.number(),
    emitterId: v.string(),
    type: v.string(),
    intent: v.string(),
    accepted: v.boolean(),
    reason: v.optional(v.string()),
  }),
});
