# H.U.G.H. (v2.0) Phase 2: The Muscle & Thinking Chain Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Holographic Thinking Chain, Mind Sidecar, and Liquid Model integration for H.U.G.H. (v2.0) using the specific Heretic-Uncensored-DISTIL model and Highland Grit LoRA.

**Architecture:** A "Mind Sidecar" service that subscribes to Convex pheromones, interleaves MemGPT (relational) and Cognee (semantic) context, and modulates LFM 2.5 reasoning based on hormonal scalars.

**Tech Stack:** Node.js, TypeScript, Convex, Axios, LFM 2.5 (Liquid AI), Docker.

---

## Chunk 1: Foundation & Input Bridge

### Task 1: Schema, Logic & Environment

**Files:**
- Modify: `convex/schema.ts`
- Create: `convex/messages.ts`
- Modify: `package.json`
- Create: `.env`

- [ ] **Step 1: Update Convex Schema to include Messages**

```typescript
// convex/schema.ts (Add table)
export default defineSchema({
  // ... existing tables from Phase 1 ...
  messages: defineTable({
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    timestamp: v.number(),
    processed: v.boolean(),
  }).index("by_processed", ["processed", "timestamp"]),
});
```

- [ ] **Step 2: Implement Message Logic (The Processor)**

```typescript
// convex/messages.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const insert = mutation({
  args: { role: v.string(), content: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("messages", {
      role: args.role as any,
      content: args.content,
      timestamp: Date.now(),
      processed: false,
    });
  },
});

export const getLatestUnprocessed = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_processed", (q) => q.eq("processed", false))
      .order("asc") // FIFO
      .first();
  },
});

export const processResponse = mutation({
  args: { messageId: v.id("messages"), response: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, { processed: true });
    await ctx.db.insert("messages", {
      role: "assistant",
      content: args.response,
      timestamp: Date.now(),
      processed: true,
    });
  },
});
```

- [ ] **Step 3: Update package.json & Create .env**

```json
{
  "name": "hugh-nervous-system",
  "version": "1.0.0",
  "scripts": {
    "dev": "convex dev",
    "build": "tsc",
    "test": "jest",
    "start:sidecar": "node dist/sidecar/index.js"
  },
  "dependencies": {
    "convex": "^1.17.0",
    "axios": "^1.7.7",
    "dotenv": "^16.4.5"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.2.5",
    "@types/jest": "^29.5.13",
    "axios-mock-adapter": "^2.1.0"
  }
}
```

```bash
# .env
CONVEX_URL=http://localhost:3210
MEMGPT_URL=http://kvm4:8080/api
COGNEE_URL=http://kvm2:8000/api
LFM_URL=http://localhost:8080/v1
MODEL_ID=DavidAU/LFM2.5-1.2B-Thinking-Claude-4.6-Opus-Heretic-Uncensored-DISTIL
LORA_PATH=/opt/hugh/lora/v3
```

- [ ] **Step 4: Run npm install**

Run: `npm install`
Expected: Dependencies installed.

- [ ] **Step 5: Commit**

```bash
git add package.json convex/ .env
git commit -m "chore: implement message logic and setup dependencies for Phase 2"
```

---

## Chunk 2: Data Structures & Interleaver

### Task 2: Implement Core Types and Data Bridge

**Files:**
- Create: `src/sidecar/types.ts`
- Create: `src/interleaver/bridge.ts`
- Create: `src/interleaver/bridge.test.ts`

- [ ] **Step 1: Define shared types**

```typescript
// src/sidecar/types.ts
export type Hormones = { cortisol: number; dopamine: number; adrenaline: number };
export type Pheromone = { type: "visual" | "somatic"; intent?: string; source?: string; weight: number };
export type ThinkingContext = { pheromones: Pheromone[]; relationalHistory: string[]; semanticFacts: string[]; hormones: Hormones };
```

- [ ] **Step 2: Implement Interleaver Bridge**

```typescript
// src/interleaver/bridge.ts
import axios from "axios";
import { ThinkingContext, Hormones, Pheromone } from "../sidecar/types";

export const interleave = async (query: string, hormones: Hormones, pheromones: Pheromone[]): Promise<ThinkingContext> => {
  try {
    const [memgptRes, cogneeRes] = await Promise.all([
      axios.post(`${process.env.MEMGPT_URL}/search`, { query }),
      axios.post(`${process.env.COGNEE_URL}/explore`, { query })
    ]);
    return { pheromones, relationalHistory: memgptRes.data.results || [], semanticFacts: cogneeRes.data.nodes || [], hormones };
  } catch (e) {
    return { pheromones, relationalHistory: [], semanticFacts: [], hormones };
  }
};
```

- [ ] **Step 3: Write and Run Interleaver Tests**

```typescript
// src/interleaver/bridge.test.ts
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { interleave } from "./bridge";

const mock = new MockAdapter(axios);

describe("Interleaver Bridge", () => {
  it("should assemble context from MemGPT and Cognee", async () => {
    mock.onPost(/.*\/search/).reply(200, { results: ["relational node"] });
    mock.onPost(/.*\/explore/).reply(200, { nodes: ["semantic node"] });

    const hormones = { cortisol: 0.2, dopamine: 0.2, adrenaline: 0.2 };
    const ctx = await interleave("test query", hormones, []);

    expect(ctx.relationalHistory).toContain("relational node");
    expect(ctx.semanticFacts).toContain("semantic node");
  });
});
```

Run: `npx jest src/interleaver/bridge.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/sidecar/types.ts src/interleaver/
git commit -m "feat: implement verified interleaver bridge"
```

---

## Chunk 3: Resonance & Main Loop

### Task 3: Implement Context Resonance and Thinking Loop

**Files:**
- Create: `src/sidecar/resonance.ts`
- Create: `src/lfm/modulator.ts`
- Create: `src/lfm/modulator.test.ts`
- Create: `src/sidecar/index.ts`

- [ ] **Step 1: Implement Resonance Formatter**

```typescript
// src/sidecar/resonance.ts
import { ThinkingContext } from "./types";

export const formatContext = (ctx: ThinkingContext): string => {
  const pheromones = ctx.pheromones.map(p => `- [${p.type}] ${p.intent || p.source} (weight: ${p.weight})`).join("\n");
  const history = ctx.relationalHistory.map(h => `- ${h}`).join("\n");
  const facts = ctx.semanticFacts.map(f => `- ${f}`).join("\n");

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
```

- [ ] **Step 2: Implement Hormonal Modulator**

```typescript
// src/lfm/modulator.ts
import { Hormones } from "../sidecar/types";

export const getInferenceParams = (hormones: Hormones) => {
  let params: any = { temperature: 0.7, top_p: 0.9, max_tokens: 512, repetition_penalty: 1.1 };

  if (hormones.cortisol > 0.7) {
    params.temperature = 0.2;
    params.max_tokens = 128;
  }
  if (hormones.adrenaline > 0.7) {
    params.top_p = 0.5;
    params.repetition_penalty = 1.2;
  }
  if (hormones.dopamine > 0.7) {
    params.temperature = Math.max(params.temperature, 0.9);
    params.top_k = 50;
  }

  return params;
};
```

- [ ] **Step 3: Run Full Modulator Tests**

```typescript
// src/lfm/modulator.test.ts
import { getInferenceParams } from "./modulator";

describe("Hormonal Modulator", () => {
  it("should support compound hormonal effects", () => {
    const params = getInferenceParams({ cortisol: 0.8, dopamine: 0.2, adrenaline: 0.8 });
    expect(params.temperature).toBe(0.2); // Stress priority
    expect(params.top_p).toBe(0.5); // Adrenaline applied
  });

  it("should set top_k on high dopamine", () => {
    const params = getInferenceParams({ cortisol: 0.2, dopamine: 0.8, adrenaline: 0.2 });
    expect(params.top_k).toBe(50);
  });
});
```

Run: `npm test src/lfm/modulator.test.ts`
Expected: PASS

- [ ] **Step 4: Implement Main Sidecar Loop**

```typescript
// src/sidecar/index.ts
import { ConvexClient } from "convex/browser";
import axios from "axios";
import { api } from "../../convex/_generated/api";
import { formatContext } from "./resonance";
import { interleave } from "../interleaver/bridge";
import { getInferenceParams } from "../lfm/modulator";
import * as dotenv from "dotenv";

dotenv.config();
const client = new ConvexClient(process.env.CONVEX_URL!);

setInterval(() => console.log("Mind Sidecar Heartbeat: Nominal"), 60000);

async function startMindLoop() {
  client.subscribe(api.messages.getLatestUnprocessed, {}, async (msg) => {
    if (!msg) return;
    try {
      const state = await client.query(api.system.getSystemState);
      const hormones = state?.hormones || { cortisol: 0.2, dopamine: 0.2, adrenaline: 0.2 };
      const visual = await client.query(api.pheromones.getActiveVisual);
      const somatic = await client.query(api.pheromones.getActiveSomatic);
      
      const pheromones = [...visual.map((v: any) => ({ type: "visual", intent: v.intent, weight: v.weight })), ...somatic.map((s: any) => ({ type: "somatic", source: s.source, weight: s.weight }))];
      const holographicCtx = await interleave(msg.content, hormones, pheromones);
      
      const response = await axios.post(`${process.env.LFM_URL}/chat/completions`, {
        model: "lfm-2.5",
        messages: [{ role: "system", content: formatContext(holographicCtx) }, { role: "user", content: msg.content }],
        ...getInferenceParams(hormones)
      });

      await client.mutation(api.messages.processResponse, { messageId: msg._id, response: response.data.choices[0].message.content });
      console.log("H.U.G.H. Response Processed.");
    } catch (err) { console.error("Mind loop error:", err); }
  });
}
startMindLoop();
```

- [ ] **Step 5: Verify Thinking Loop**

Run: `npx convex run messages:insert '{"content":"Status check.","role":"user"}' && npm run start:sidecar`
Expected: Sidecar logs response processing.

- [ ] **Step 6: Commit**

```bash
git add src/sidecar/ src/lfm/ src/sidecar/resonance.ts
git commit -m "feat: implement main mind loop with holographic context"
```

---

## Chunk 4: Swarm Deployment (The Full Muscle)

### Task 4: Deployment Suite

- [ ] **Step 1: Implement Targeted Deployment Scripts**

```bash
# scripts/deploy-lfm-audio.sh (CT104)
ssh root@ct104 "docker run -d --name hugh-audio -p 8083:8083 liquidai/lfm-audio-1.5b:latest --profile tommy_flanagan"

# scripts/deploy-lfm-vision.sh (CT102)
ssh root@ct102 "docker run -d --name hugh-vision -p 8081:8081 liquidai/lfm-vl-1.6b:latest"

# scripts/deploy-lfm-thinking.sh (LXC Harbor - Local)
# Using DavidAU/LFM2.5-1.2B-Thinking-Claude-4.6-Opus-Heretic-Uncensored-DISTIL
docker run -d --name hugh-thinking -p 8080:8080 \
  -e MODEL_ID="DavidAU/LFM2.5-1.2B-Thinking-Claude-4.6-Opus-Heretic-Uncensored-DISTIL" \
  -v /opt/hugh/models:/models \
  liquidai/lfm-1.2b-thinking:latest

# scripts/deploy-bitnet-swarm.sh (Distributed)
for host in ct102 ct104; do ssh root@$host "docker run -d --name hugh-worker liquidai/bitnet-1.58b:latest"; done
```

- [ ] **Step 2: Create LoRA application script**

```bash
# scripts/apply-lora.sh
# Applies the custom personality training (Highland Grit v3 from Kaggle)
docker exec hugh-thinking /bin/bash -c "python3 apply_lora.py --base /models --lora /opt/hugh/lora/v3"
```

- [ ] **Step 3: Commit & Final Build**

```bash
chmod +x scripts/*.sh && npm run build
git add scripts/
git commit -m "feat: add complete targeted swarm deployment suite with LoRA"
```
