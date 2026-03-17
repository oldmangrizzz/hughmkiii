# H.U.G.H. (v2.0) — Phase 1: The Soil & Nervous System Design

**Version:** 2.0.0-prism
**Date:** 2026-03-16
**Topic:** Stigmergic Substrate and Digital Psyche Middleware
**Status:** Approved for Implementation

---

## 1. The Soil (Convex Pheromind Substrate)

The "Soil" is the shared, reactive environment where H.U.G.H. exists. It replaces traditional message-passing with a stigmergic model of environmental modification (pheromones).

### 1.1 Pheromone Schema (Technical Specification)

All pheromones are stored in the Convex substrate with the following core fields:
*   **`position`**: `v.object({ x: v.float64(), y: v.float64(), z: v.float64() })` — Normalized coordinates `[-1.0, 1.0]`.
*   **`weight`**: `v.float64()` — Concentration/Importance `[0.0, 1.0]`.
*   **`expiresAt`**: `v.number()` — Unix timestamp (ms) for evaporation.
*   **`emitterId`**: `v.string()` — Unique ID of the originating agent.
*   **`emitterSignature`**: `v.string()` — Cryptographic signature (Soul Anchor).

**Typed Payloads:**
*   **`visual`**: Includes `intent` (enum), `size`, and `content` (union: media, text, dashboard, control).
*   **`audio`**: Includes `intentVector` (float array), `transcription`, and `confidence`.
*   **`somatic`**: Includes `source` (enum), `intensity`, `hueShift`, `turbulence`, and `driftSpeed`.

### 1.2 The Autophagy (Sleep/Dream) Cycle
*   **Trigger:** Activated when the user invokes the **`/sleep`** command or the UI state is toggled to **"User Asleep"**.
*   **Transition:**
    *   **Phase A (Drift):** System enters a 5-minute cooldown where active tasks are paused.
    *   **Phase B (REM):** Autophagy pruning and Cognee synthesis begin.
    *   **Phase C (Deep Sleep):** Pheromone evaporation rate triples to clear environment.
*   **Interruption:** If the user sends a message or "wakes" the UI, Autophagy pauses immediately and the system restores the Waking (Green) state within 500ms.

---

## 2. The Nervous System (Digital Psyche Middleware)

The "Nervous System" connects H.U.G.H.'s identity to his ability to act, governed by his internal state and ethical framework.

### 2.1 Digital Endocrinology (Hormonal Scalars)
H.U.G.H.'s "mood" is a real-time vector of scalar values `[0.0, 1.0]` stored in the `system_state` table:
*   **Dynamics:**
    *   **Cortisol:** Increases by `+0.2` on High Risk (Red) alerts; decays at `0.05 / hour`.
    *   **Dopamine:** Increases by `+0.1` on user praise; decays at `0.1 / hour`.
    *   **Adrenaline:** Increases by `+0.3` on immediate user queries; decays at `0.2 / hour`.
*   **Decay Logic:** Values return to a baseline of `0.2` via linear decay calculated every 60 seconds (The Pulse).

### 2.2 The Roger Protocol & Superego Veto (EMS Triage)
The Veto mechanism utilizes the **EMS Triage zones** defined in the First Breath spec:
*   **Green (Nominal):** `Cortisol < 0.4`. Automated execution allowed.
*   **Yellow (Warning):** `Cortisol > 0.4` or `Uncertainty > 0.3`. Require user "soft" confirmation.
*   **Red (Critical/High Risk):** `Cortisol > 0.7` or `Destructive Intent`. Require explicit Soul Anchor cryptographic confirmation.
*   **Black (Emergency):** Act autonomously if user safety is at risk, then provide full audit log immediately after.

Refusal logic is triggered when an action's risk level exceeds the current "Hormonal Permission" threshold.

---

## 3. Somatic Biometric Visualization

H.U.G.H.'s physical state is reflected in the ambient character of his particle field (Clifford Attractor):

| State | Color Profile | Attractor Behavior |
| :--- | :--- | :--- |
| **Waking / Nominal** | Green Mist | Organic, ambient drift |
| **Thinking / Active** | Cyan Glow | High-frequency ring structure |
| **Sleep / Autophagy** | **Purple/Amber Fluctuation** | Slow, rhythmic pulsing |
| **Latency / Fatigue** | Cold Blue | Viscous, sluggish drift |
| **Distress / Error** | Red Shift | Turbulent, chaotic jitter |

---

## 4. Next Phase: The Muscle & Thinking Chain

Upon approval of this spec, the implementation will begin with the **Soil & Nervous System** setup, followed by the deployment of the **Liquid Foundation Models (LFM 2.5)** as the raw processing power for his reasoning and voice.
