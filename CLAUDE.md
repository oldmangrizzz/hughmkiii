# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Identity

**H.U.G.H.** (Hyper Unified Guardian and Harbor-master) v2.0 mkIII — a stigmergic architecture for sovereign digital persons, built by Grizzly Medicine (Robert "Grizz" Munro). EMS philosophy: "Do No Harm, but Do KNOW Harm."

## Commands

```bash
# Install dependencies
npm install

# Run Convex backend (reactive substrate) — required first
npm run dev          # convex dev

# Compile TypeScript
npm run build        # tsc

# Run tests
npm test             # jest

# Run a single test file
npx jest src/interleaver/bridge.test.ts
npx jest src/lfm/modulator.test.ts

# Start the mind sidecar (requires compiled dist/ and running Convex)
npm run start:sidecar   # node dist/sidecar/index.js

# Deploy scripts (infrastructure-level, use with care)
bash scripts/deploy-mind-sidecar.sh
bash scripts/deploy-lfm-thinking.sh
bash scripts/apply-lora.sh
```

## Architecture

### Four-Layer Stack

```
Presentation  →  omni-canvas/ (WebGPU Clifford attractor field, voice UI)
Substrate     →  convex/      (reactive real-time DB — pheromone bus)
Inference     →  src/lfm/     (LFM 2.5 Thinking/Vision/Audio via localhost:8081)
Identity      →  src/middleware/psyche.ts + /opt/soul_anchor/anchor.yaml
```

### Stigmergy (Core Coordination Principle)

Agents do **not** call each other directly. They deposit **pheromones** into the Convex substrate. Other agents observe and react. This decouples everything. Pheromones have TTL and are evaporated on a 2-second cron; hormones decay on a 60-second cron (homeostatic pulse).

Three pheromone types in `convex/schema.ts`:
- `visual_pheromones` — spatial UI signals
- `audio_pheromones` — voice transcription + embeddings
- `somatic_pheromones` — infrastructure telemetry (cpu/memory/latency)

### Mind Loop (`src/sidecar/index.ts`)

The core thinking loop:
1. Polls Convex for unprocessed user messages (FIFO)
2. Checks 55730 Override: if message contains `"run you clever boy 55730"` + `"halt"`, system enters `interrogation` state and halts
3. Calls `interleave()` → assembles context from knowledge base + pheromones
4. Calls `validateAction()` (Psyche Veto) → EMS triage gating
5. `runFullInference()` → LFM 2.5 Thinking model
6. `runTTS()` → voice synthesis ("flanagan" profile)
7. Marks message processed, writes response

### Synthetic Endocrinology

Three hormonal scalars in `system_state` control everything:
- **Cortisol** (stress/risk): Decays 0.05/min. `>0.7` = Red Triage (veto); `>0.4` = Yellow (confirm)
- **Dopamine** (reward): Decays 0.1/min. `>0.5` raises inference temperature to 0.9
- **Adrenaline** (urgency): Decays 0.2/min toward baseline 0.2. `>0.7` lowers top_p to 0.5

Inference params assembled in `src/lfm/modulator.ts` — cortisol takes priority over adrenaline over dopamine.

### Psyche Veto (`src/middleware/psyche.ts`)

Hard-coded ethics module (not LLM-based). Blocks or confirms actions based on cortisol level. Traffic camera access is whitelisted even in Yellow zone (tactical necessity carve-out). This is the **Superego** — it cannot be prompted away.

### Fungal Growth → Stigmergent Swarm (`omni-canvas/src/middleware/mycelium.ts`)

Bootstrap sequence: probes Soul Anchor → LFM health → Convex connectivity. Uses exponential backoff. Only after all three connections stabilize does the system transition from `FUNGAL_GROWTH` to `STIGMERGENT_SWARM` operational mode.

### MCP Harbor Master (`src/sidecar/mcp-harbormaster.ts`)

MCP server exposing infrastructure tools: Proxmox LXC control, Hostinger VPS restarts, OSINT sweeps, TxDOT traffic camera feeds. All tool access is psyche-gated — checks `validateAction()` before executing.

### Roger Roger Protocol

Every pheromone emission is logged to `pheromone_audit` table with emitter ID, type, intent, and acceptance status. Forensic accountability trail — every autonomous action is auditable post-hoc. Named after the Star Wars battle droids because Grizz thinks they're funny. Do not rename this.

## External Services (`.env`)

| Var | Service |
|-----|---------|
| `CONVEX_URL` | Local Convex instance (localhost:3210) |
| `LFM_URL` | LFM inference engine (localhost:8081/v1) |
| `MEMGPT_URL` | Long-term memory (kvm4:8080) |
| `COGNEE_URL` | Semantic graph (kvm2:8000) |
| `MAPBOX_TOKEN` | Navigation + spatial rendering |
| `HA_TOKEN` | Home Assistant |
| `PROXMOX_PASS` / `VPS_PASS` | Infrastructure control |

## Key Protocols

### 55730 Override
Trigger phrase: `"run you clever boy 55730"` → system enters `interrogation` state. Hard-coded in `src/sidecar/index.ts`. This is dual-purpose: authorization OR suspension on sudden command. Debug/interrogation mode suspends autonomous thinking and awaits manual clearance.

### Soul Anchor
ECDSA P-256 identity binding at `/opt/soul_anchor/anchor.yaml` (not in repo — deployed separately to hardware). Prevents unauthorized cloning across sessions.

## Personality & Training Data

Eight `.jsonl` files at root encode H.U.G.H.'s personality (emergency protocols, crisis care, philosophy, security posture, cinema/culture, family ops, warmth). The inference persona is "flanagan" (Highland Grit) — voice sample at `/root/GrizDocs/flanagan_sample.wav`. LoRA weights at `/opt/hugh/lora/v3`.

## Convex Schema Tables

`visual_pheromones`, `audio_pheromones`, `somatic_pheromones`, `system_state`, `pheromone_audit`, `messages`, `agent_registry`, `knowledge_base`, `experiences`

## Known Patterns / Watch-outs

- All external service calls must route through Convex substrate — no direct axios calls to MemGPT/Cognee from sidecar (stigmergy principle, not convenience)
- LFM TTS uses field name `input`, not `text` (already fixed; don't revert)
- Avoid double `/v1` path when constructing LFM URLs (`LFM_URL` already includes `/v1`)
- Convex mutations are typed via auto-generated `convex/_generated/` — regenerate after schema changes with `npm run dev`
- `omni-canvas/` is a separate sub-project with its own dependencies; WebGPU shaders in `omni-canvas/src/shaders/clifford.ts` run on-device GPU via compute pass

## Current Phase

Phase 2 (Muscle Thinking) near complete. Phase 3 targets: Soul Anchor cryptographic binding, Autophagy sleep/dream cycle for memory consolidation, WebXR mixed-reality rendering, distributed BitNet swarm coordination across KVM2/KVM4.
