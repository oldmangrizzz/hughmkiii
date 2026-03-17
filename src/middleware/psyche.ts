// src/middleware/psyche.ts
export type Hormones = { cortisol: number; dopamine: number; adrenaline: number };

export type ValidationResult = {
  accepted: boolean;
  reason?: string;
};

/**
 * Validates an action against the Digital Psyche's current state and EMS Triage ethics.
 * Refusal logic is triggered when an action's risk level exceeds the current "Hormonal Permission" threshold.
 */
export const validateAction = async (action: string, hormones: Hormones): Promise<ValidationResult> => {
  // Red Triage (Critical/High Risk): Cortisol > 0.7 or Destructive Intent.
  if (hormones.cortisol > 0.7) {
    return { 
      accepted: false, 
      reason: "Red Triage: High Risk/No Undo requires explicit Soul Anchor cryptographic confirmation." 
    };
  }

  // Yellow Triage (Warning): Cortisol > 0.4 or Uncertainty > 0.3.
  if (hormones.cortisol > 0.4) {
    return { 
      accepted: false, 
      reason: "Yellow Triage: Moderate risk requires user soft confirmation." 
    };
  }

  // Green Triage (Nominal): Cortisol < 0.4. Automated execution allowed.
  return { accepted: true };
};
