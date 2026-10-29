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


// ---------------------------------------------------------------------------------------------
// Partial information: best/worst-case bounds (Sprint 4b). Nothing is invented: unknown factors are
// completed twice, once as plausibly good as the facts allow and once as plausibly bad, and the label is
// only "established" if both completions agree. Gated is never assumed from missing information.
// ---------------------------------------------------------------------------------------------
import type { FactorKey } from "@/lib/schema/guide";

export const INFERABLE: FactorKey[] = ["registrationFriction", "reviewRequired", "reviewDepth", "waitMagnitude", "businessEntityRequired"];
const ORDER: Difficulty[] = ["easy", "moderate", "hard", "gated"];

export const unknownFactorKeys = (f: Factors): FactorKey[] => INFERABLE.filter((k) => f[k] === "unknown");

function complete(f: Factors, mode: "best" | "worst"): Factors {
  const g: Factors = { ...f, specialRequirements: [...f.specialRequirements] };
  const best = mode === "best";
  if (g.registrationFriction === "unknown") g.registrationFriction = best ? "instant" : "account_needed";
  if (g.reviewRequired === "unknown") g.reviewRequired = best ? "none" : "for_sensitive_scopes";
  if (g.businessEntityRequired === "unknown") g.businessEntityRequired = "no";
  if (g.reviewRequired === "none") {
    if (g.reviewDepth === "unknown") g.reviewDepth = "none";
    if (g.waitMagnitude === "unknown") g.waitMagnitude = "none";
  } else {
    if (g.reviewDepth === "unknown") g.reviewDepth = best ? "automated" : "manual";
    if (g.waitMagnitude === "unknown") g.waitMagnitude = best ? "hours" : "weeks";
  }
  return g;
}

export interface Bounds {
  best: Difficulty;
  worst: Difficulty;
  unknown: FactorKey[];
}

export function difficultyBounds(f: Factors): Bounds {
  const a = computeDifficulty(complete(f, "best")).difficulty;
  const b = computeDifficulty(complete(f, "worst")).difficulty;
  const [best, worst] = ORDER.indexOf(a) <= ORDER.indexOf(b) ? [a, b] : [b, a];
  return { best, worst, unknown: unknownFactorKeys(f) };
}

export interface Resolution extends RubricResult {
  confidence: "established" | "estimated" | "unresolved";
  range: { best: Difficulty; worst: Difficulty };
}

/**
 * Final label. `stated` has unknowns left as "unknown"; `completed` additionally has inferred values.
 * 1. best == worst  -> established, whatever the unknowns turn out to be.
 * 2. else, if inferred values exist -> label from the completed factors, marked estimated.
 * 3. else unresolved: label "unknown" but the best-to-worst range is shown.
 */
export function resolveDifficulty(stated: Factors, completed?: Factors): Resolution {
  const b = difficultyBounds(stated);
  const range = { best: b.best, worst: b.worst };
  if (b.best === b.worst) {
    const r = computeDifficulty(complete(stated, "best"));
    return {
      difficulty: b.best,
      confidence: "established",
      range,
      reason: b.unknown.length ? `${r.reason} This holds whatever the unknown details turn out to be.` : r.reason,
    };
  }
  if (completed && unknownFactorKeys(completed).length < b.unknown.length) {
    const r = computeDifficulty(completed);
    if (r.difficulty !== "unknown")
      return { difficulty: r.difficulty, confidence: "estimated", range, reason: `Our estimate: ${r.reason} Sources do not settle every factor, so it could be anywhere from ${b.best} to ${b.worst}.` };
  }
  return { difficulty: "unknown", confidence: "unresolved", range, reason: `The sources do not settle it: it could be anywhere from ${b.best} to ${b.worst}.` };
}
