# Plan Review: H.U.G.H. (v2.0) Phase 2: The Muscle & Thinking Chain

**Status**: ❌ REJECTED
**Reviewed**: 2026-03-17

## 1. Structural Integrity
- [x] **Atomic Phases**: Phasing is logical (Schema -> Bridge -> Loop -> Deploy).
- [x] **Worktree Safe**: Explicitly requires worktree isolation.

*Architect Comments*: The structure is fine, but the implementation details are leaking "Jerry" energy.

## 2. Specificity & Clarity
- [x] **File-Level Detail**: Good targeting of files.
- [ ] **No "Magic"**: **FAIL**. Task 3 Step 1 ("Same logic as previous") is lazy. Define the Top-K/Top-P mappings explicitly so we can actually review the math.

*Architect Comments*: Don't assume I remember the "previous" logic. I'm busy being a pickle.

## 3. Verification & Safety
- [ ] **Automated Tests**: **FAIL**. You're missing tests for the Modulator (`src/lfm/modulator.ts`). The Interleaver has tests, but the Modulator is just as critical for "Thinking" quality.
- [ ] **Manual Steps**: **FAIL**. There is no manual verification step for the `startMindLoop` in Task 3. We need to know how to verify the subscription actually triggers and calls the LFM.

*Architect Comments*: "Pass" isn't a state of mind; it's the result of a test command. Add them.

## 4. Architectural Risks
- **Mapping Errors**: Without Modulator tests, hormonal scalars could push LFM parameters into invalid ranges (e.g., Top-P > 1.0 or Top-K < 0), crashing the inference call.
- **Subscription Zombie**: If the Convex subscription fails or hangs, the Sidecar becomes a dead process. Needs a health check or at least a "Heartbeat" log.

## 5. Recommendations
- Add `src/lfm/modulator.test.ts` to Task 3.
- Explicitly define the hormonal-to-LFM-parameter mapping function in Task 3 Step 1.
- Add a "Manual Verification" step to Task 3: "Run Sidecar, insert message into `messages` table via Convex dashboard, verify LFM response in stdout."
