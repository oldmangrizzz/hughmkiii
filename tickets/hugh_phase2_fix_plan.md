# Implementation Plan: H.U.G.H. Phase 2 Fixing & Psyche Integration

## Goal:
Fix broken tests in `src/interleaver/bridge.test.ts`, integrate `src/middleware/psyche.ts` into the main thinking loop, and implement "Hormonal Resonance" in the Interleaver.

## Tasks:

### 1. Fix Interleaver Bridge Tests
**File:** `src/interleaver/bridge.test.ts`
- [x] Remove `axios` and `axios-mock-adapter` imports.
- [x] Create a mock `ConvexClient` that simulates `client.query(api.pheromones.searchKnowledge)`.
- [x] Update tests to verify that `interleave` handles the mock data correctly.

### 2. Implement Hormonal Resonance & Roger Protocol
**File:** `src/interleaver/bridge.ts`
- [x] Update `client.query` call to pass `category: 'tactical'` if `hormones.cortisol > 0.5`.
- [x] Add audit logging: Call `client.mutation(api.pheromones.auditPheromone)` when context is assembled.

### 3. Integrate Digital Psyche (EMS Triage)
**File:** `src/sidecar/index.ts`
- [x] Import `validateAction` from `../middleware/psyche`.
- [x] Before `runFullInference`, call `validateAction(msg.content, hormones)`.
- [x] If `accepted: false`, log the refusal and call `client.mutation(api.messages.processResponse)` with the rejection reason.
- [x] Ensure the loop continues correctly (skipping the LLM call).

### 4. Verification
- [x] Run `npm run test` to verify the fixed bridge tests.
- [x] Run `npm run build` to ensure no type errors.
- [x] Manual check of the `sidecar` logic.
