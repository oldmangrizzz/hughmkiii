# H.U.G.H. (v2.0) Phase 1: The Soil & Nervous System Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Convex Pheromind Substrate and the Digital Psyche Middleware for H.U.G.H. (v2.0).

**Architecture:** Stigmergic pheromone-based agent coordination using Convex as a shared, reactive environment. Identity-bound mutations via Soul Anchor.

**Tech Stack:** Convex, TypeScript, Node.js.

---

## Chunk 1: The Soil (Convex Setup & Schema)

### Task 1: Initialize Project & Schema

**Files:**
- Create: `package.json`
- Create: `convex/schema.ts`
- Create: `convex/init.ts`
- Test: `convex/schema.ts` (Type checking)

- [ ] **Step 1: Create package.json with necessary dependencies**

```json
{
  "name": "hugh-nervous-system",
  "version": "1.0.0",
  "scripts": {
    "dev": "convex dev"
  },
  "dependencies": {
    "convex": "^1.17.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0"
  }
}
```

- [ ] **Step 2: Define the Pheromind Substrate Schema**

```typescript
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
```

- [ ] **Step 3: Add initialization mutation to seed system state**

```typescript
// convex/init.ts
import { mutation } from "./_generated/server";

export const seed = mutation({
  handler: async (ctx) => {
    const existing = await ctx.db.query("system_state").first();
    if (existing) return;

    await ctx.db.insert("system_state", {
      status: "waking",
      hormones: {
        cortisol: 0.2,
        dopamine: 0.2,
        adrenaline: 0.2,
      },
      lastPulse: Date.now(),
    });
  },
});
```

- [ ] **Step 4: Run npx convex dev and seed**

Run: `npx convex dev --once && npx convex run init:seed`
Expected: System state seeded.

- [ ] **Step 5: Commit**

```bash
git add package.json convex/schema.ts convex/init.ts
git commit -m "feat: initialize convex schema and seed system state"
```

---

## Chunk 2: Pheromone Lifecycle (Mutations & Crons)

### Task 2: Pheromone Mutations & Lifecycle

**Files:**
- Create: `convex/pheromones.ts`
- Create: `convex/evaporation.ts`
- Create: `convex/crons.ts`

- [ ] **Step 1: Implement Pheromone Emission Mutations**

```typescript
// convex/pheromones.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { visualIntent, spatialPosition, contentPayload, somaticSource } from "./schema";

export const emitVisual = mutation({
  args: {
    intent: visualIntent,
    position: spatialPosition,
    size: v.object({ width: v.float64(), height: v.float64() }),
    weight: v.float64(),
    content: contentPayload,
    ttlMs: v.number(),
    emitterId: v.string(),
    emitterSignature: v.string(),
  },
  handler: async (ctx, { ttlMs, ...args }) => {
    // Initial verification (Actual Soul Anchor crypto integration in Phase 2)
    if (args.emitterSignature === "untrusted") throw new Error("Unsigned");
    return await ctx.db.insert("visual_pheromones", {
      ...args,
      expiresAt: Date.now() + ttlMs,
    });
  },
});

export const emitAudio = mutation({
  args: {
    intent: v.string(),
    transcription: v.optional(v.string()),
    intentVector: v.optional(v.array(v.float64())),
    confidence: v.float64(),
    position: spatialPosition,
    weight: v.float64(),
    ttlMs: v.number(),
    emitterId: v.string(),
    emitterSignature: v.string(),
  },
  handler: async (ctx, { ttlMs, ...args }) => {
    return await ctx.db.insert("audio_pheromones", {
      ...args,
      expiresAt: Date.now() + ttlMs,
    });
  },
});

export const emitSomatic = mutation({
  args: {
    source: somaticSource,
    intensity: v.float64(),
    hueShift: v.optional(v.float64()),
    turbulence: v.optional(v.float64()),
    driftSpeed: v.optional(v.float64()),
    position: spatialPosition,
    weight: v.float64(),
    ttlMs: v.number(),
    emitterId: v.string(),
    emitterSignature: v.string(),
  },
  handler: async (ctx, { ttlMs, ...args }) => {
    return await ctx.db.insert("somatic_pheromones", {
      ...args,
      expiresAt: Date.now() + ttlMs,
    });
  },
});

export const getActiveVisual = query({
  handler: async (ctx) => {
    const now = Date.now();
    return await ctx.db
      .query("visual_pheromones")
      .withIndex("by_expiration", (q) => q.gt("expiresAt", now))
      .collect();
  },
});
```

- [ ] **Step 2: Implement Evaporation (Autophagy) Logic with Phases**

```typescript
// convex/evaporation.ts
import { internalMutation } from "./_generated/server";

export const sweep = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    const state = await ctx.db.query("system_state").first();
    const isDeepSleep = state?.status === "asleep" && state?.sleepPhase === "deep";
    
    const tables = ["visual_pheromones", "audio_pheromones", "somatic_pheromones"] as const;
    
    for (const table of tables) {
      // Normal evaporation (indexed query)
      const expired = await ctx.db
        .query(table)
        .withIndex("by_expiration", (q) => q.lt("expiresAt", now))
        .take(100); // Batching to avoid transaction limits
      
      for (const doc of expired) {
        await ctx.db.delete(doc._id);
      }
      
      // Phase C: Tripled rate in Deep Sleep (simulated by pruning pheromones expiring in next 10s)
      if (isDeepSleep) {
        const soonToExpire = await ctx.db
          .query(table)
          .withIndex("by_expiration", (q) => q.lt("expiresAt", now + 10000))
          .take(100);
        for (const doc of soonToExpire) {
          await ctx.db.delete(doc._id);
        }
      }
    }
  },
});
```

- [ ] **Step 3: Set up Pheromone Crons**

```typescript
// convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "evaporate stale pheromones",
  { seconds: 2 },
  internal.evaporation.sweep
);

export default crons;
```

- [ ] **Step 4: Run test mutation and verify query**

Run: `npx convex run pheromones:emitVisual '{"intent":"idle","position":{"x":0,"y":0,"z":0},"size":{"width":1,"height":1},"weight":1,"content":{"type":"text","body":"hello"},"ttlMs":10000,"emitterId":"test","emitterSignature":"test"}' && npx convex run pheromones:getActiveVisual`
Expected: Mutation ID returned, then list containing the pheromone.

- [ ] **Step 5: Commit**

```bash
git add convex/pheromones.ts convex/evaporation.ts convex/crons.ts
git commit -m "feat: implement pheromone mutations and evaporation crons"
```

---

## Chunk 3: The Pulse (Hormonal Scalars)

### Task 3: Digital Endocrinology

**Files:**
- Create: `convex/system.ts`
- Modify: `convex/crons.ts`

- [ ] **Step 1: Implement The Pulse (Hormonal Decay)**

```typescript
// convex/system.ts
import { mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const pulse = internalMutation({
  handler: async (ctx) => {
    const state = await ctx.db.query("system_state").first();
    if (!state) return;

    const baseline = 0.2;
    const hormones = { ...state.hormones };

    // Linear decay toward baseline
    hormones.cortisol = Math.max(baseline, hormones.cortisol - 0.05 / 60);
    hormones.dopamine = Math.max(baseline, hormones.dopamine - 0.1 / 60);
    hormones.adrenaline = Math.max(baseline, hormones.adrenaline - 0.2 / 60);

    await ctx.db.patch(state._id, {
      hormones,
      lastPulse: Date.now(),
    });
  },
});

export const updateHormones = mutation({
  args: {
    cortisolDelta: v.optional(v.float64()),
    dopamineDelta: v.optional(v.float64()),
    adrenalineDelta: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    const state = await ctx.db.query("system_state").first();
    if (!state) throw new Error("Not initialized");

    const hormones = { ...state.hormones };
    if (args.cortisolDelta) hormones.cortisol = Math.min(1, Math.max(0, hormones.cortisol + args.cortisolDelta));
    if (args.dopamineDelta) hormones.dopamine = Math.min(1, Math.max(0, hormones.dopamine + args.dopamineDelta));
    if (args.adrenalineDelta) hormones.adrenaline = Math.min(1, Math.max(0, hormones.adrenaline + args.adrenalineDelta));

    await ctx.db.patch(state._id, { hormones });
  },
});
```

- [ ] **Step 2: Add Pulse to Crons**

```typescript
// convex/crons.ts (Append)
crons.interval(
  "homeostatic pulse",
  { minutes: 1 },
  internal.system.pulse
);
```

- [ ] **Step 3: Test hormone update and decay**

Run: `npx convex run system:updateHormones '{"cortisolDelta":0.5}' && npx convex run system:pulse`
Expected: Cortisol increases then slightly decays.

- [ ] **Step 4: Commit**

```bash
git add convex/system.ts convex/crons.ts
git commit -m "feat: implement digital endocrinology pulse and decay"
```

---

## Chunk 4: The Nervous System (Middleware & Veto)

### Task 4: Psyche Middleware & Superego Veto

**Files:**
- Create: `src/middleware/psyche.ts`
- Create: `src/middleware/psyche.test.ts`

- [ ] **Step 1: Write failing test for Superego Veto**

```typescript
// src/middleware/psyche.test.ts
import { validateAction } from "./psyche";

describe("Superego Veto", () => {
  it("should block high-risk actions when cortisol is high", async () => {
    const hormones = { cortisol: 0.8, dopamine: 0.2, adrenaline: 0.2 };
    const result = await validateAction("destructive_command", hormones);
    expect(result.accepted).toBe(false);
    expect(result.reason).toContain("High Risk");
  });
});
```

- [ ] **Step 2: Implement Veto Logic**

```typescript
// src/middleware/psyche.ts
export type Hormones = { cortisol: number; dopamine: number; adrenaline: number };

export const validateAction = async (action: string, hormones: Hormones) => {
  // EMS Triage logic from spec
  if (hormones.cortisol > 0.7) {
    return { accepted: false, reason: "Red Triage: High Risk/No Undo requires Soul Anchor confirmation" };
  }
  if (hormones.cortisol > 0.4) {
    return { accepted: false, reason: "Yellow Triage: Moderate risk requires soft confirmation" };
  }
  return { accepted: true };
};
```

- [ ] **Step 3: Run tests and verify**

Run: `npm test src/middleware/psyche.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/middleware/psyche.ts src/middleware/psyche.test.ts
git commit -m "feat: implement psyche middleware and superego veto"
```
