import type { Difficulty, Factors } from "@/lib/schema/guide";

export interface RubricResult {
  difficulty: Difficulty;
  reason: string;
}

/**
 * Factors -> difficulty label. Pure; the LLM never picks the label.
 * Rules are evaluated top to bottom, first match wins (draft: docs/RUBRIC-DRAFT.md).
 */
export function computeDifficulty(f: Factors): RubricResult {
  // 1. Gated: access itself needs a legal entity, a contract, or a paid/business account.
  if (f.businessEntityRequired === "yes")
    return { difficulty: "gated", reason: "A registered business entity is required for this use case." };
  if (f.reviewDepth === "partnership_contract")
    return { difficulty: "gated", reason: "Access requires a partnership or contract with the provider." };
  if (f.registrationFriction === "paid_or_business_account")
    return { difficulty: "gated", reason: "A paid or business account is required to register at all." };

  // 2. Hard: security assessment, sensitive-scope manual review, or review waits measured in weeks.
  if (f.reviewDepth === "security_assessment")
    return { difficulty: "hard", reason: "A third-party security assessment is required." };
  if (f.reviewRequired === "for_sensitive_scopes" && f.reviewDepth === "manual")
    return { difficulty: "hard", reason: "Sensitive scopes need a manual review." };
  if (f.reviewRequired !== "none" && f.reviewRequired !== "unknown" && f.waitMagnitude === "weeks")
    return { difficulty: "hard", reason: "Required review takes weeks." };

  // 3. Moderate: some review for public use, or several special requirements.
  if (f.reviewRequired === "for_public_use" || f.reviewRequired === "for_sensitive_scopes" || f.reviewRequired === "always") {
    // A review whose depth AND wait are both unknown cannot be labelled: never guess from missing facts.
    if (f.reviewDepth === "unknown" && f.waitMagnitude === "unknown")
      return { difficulty: "unknown", reason: "A review is required, but the sources do not establish its depth or wait." };
    return {
      difficulty: "moderate",
      reason: f.waitMagnitude === "unknown" ? "A review is required; its wait is not established by the sources." : `A review is required, with a wait measured in ${f.waitMagnitude === "none" ? "minutes" : f.waitMagnitude}.`,
    };
  }
  if (f.specialRequirements.length >= 3)
    return { difficulty: "moderate", reason: `${f.specialRequirements.length} special requirements must be met.` };

  // 4. Unknown: never guess a label from missing facts.
  if (f.registrationFriction === "unknown" || f.reviewRequired === "unknown")
    return { difficulty: "unknown", reason: "Not enough verified information about registration or review." };

  // 5. Easy: instant or account-only registration and no required review.
  return { difficulty: "easy", reason: "Credentials are available on a normal account with no required review." };
}
