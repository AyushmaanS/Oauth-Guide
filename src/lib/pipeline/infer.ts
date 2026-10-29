import { callJson } from "@/lib/llm";
import { Factors, type FactorKey, type Verdict } from "@/lib/schema/guide";
import { unknownFactorKeys } from "@/lib/rubric";
import { validateLookingFor } from "./questions";
import { INFER_SYSTEM, InferOut } from "./prompts/infer";
import { sourceBundle } from "./prompts/common";
import type { Deps, Gathered, Resolved } from "./types";

const ALLOWED: Record<FactorKey, string[]> = {
  registrationFriction: ["instant", "account_needed", "paid_or_business_account"],
  reviewRequired: ["none", "for_public_use", "for_sensitive_scopes", "always"],
  reviewDepth: ["none", "automated", "manual", "security_assessment", "partnership_contract"],
  waitMagnitude: ["none", "hours", "days", "weeks"],
  businessEntityRequired: ["yes", "no"],
};
/** Values that move a guide toward "gated"/"hard" and so need a source: never assumed from general patterns. */
const NEEDS_SOURCE: Partial<Record<FactorKey, Record<string, string>>> = {
  registrationFriction: { paid_or_business_account: "account_needed" },
  reviewDepth: { partnership_contract: "manual", security_assessment: "manual" },
  businessEntityRequired: { yes: "no" },
};

export interface Inferred {
  completed: Factors;
  inference: NonNullable<Verdict["inference"]>;
  checkFirst: string[];
  basis: NonNullable<Verdict["factorBasis"]>;
}

/** Pure rule application: validates, clamps and applies model suggestions to the stated factors. */
export function applyInference(stated: Factors, out: InferOut, knownSourceIds: Set<string>, appName: string): Inferred {
  const unknown = new Set(unknownFactorKeys(stated));
  const completed: Factors = { ...stated, specialRequirements: [...stated.specialRequirements] };
  const inference: Inferred["inference"] = [];
  for (const i of out.inferences) {
    if (!unknown.has(i.factor)) continue; // stated facts are never overwritten
    if (!ALLOWED[i.factor].includes(i.value)) continue;
    const sourceIds = i.sourceIds.filter((id) => knownSourceIds.has(id));
    let value = i.value;
    const clamp = NEEDS_SOURCE[i.factor]?.[value];
    if (clamp && sourceIds.length === 0) value = clamp;
    // Without a source an estimate can never be "high" confidence.
    const confidence = sourceIds.length === 0 && i.confidence === "high" ? "medium" : i.confidence;
    (completed as unknown as Record<string, string>)[i.factor] = value;
    inference.push({ factor: i.factor, value, confidence, rationale: value === i.value ? i.rationale : `${i.rationale} (Capped: no source supports a stricter value.)`.slice(0, 260), sourceIds });
  }
  // Consistency: no review means no depth and no wait.
  if (completed.reviewRequired === "none") {
    for (const k of ["reviewDepth", "waitMagnitude"] as const) {
      if (stated[k] === "unknown") (completed as unknown as Record<string, string>)[k] = "none";
    }
  }
  for (const i of inference) i.value = completed[i.factor];
  const basis: Inferred["basis"] = {};
  for (const k of Object.keys(ALLOWED) as FactorKey[]) basis[k] = stated[k] !== "unknown" ? "stated" : completed[k] !== "unknown" ? "inferred" : "unknown";
  const checkFirst = out.checkFirst
    .filter((q) => q.trim().endsWith("?") && q.toLowerCase().includes(appName.toLowerCase().slice(0, 4)) && !validateLookingFor(q.replace(/\?$/, "")))
    .slice(0, 3);
  return { completed, inference, checkFirst, basis };
}

export async function inferFactors(app: Resolved, stated: Factors, useCase: string, g: Gathered, deps: Deps, model: string): Promise<Inferred> {
  const unknown = unknownFactorKeys(stated);
  const out = await callJson({
    llm: deps.llm,
    model,
    system: INFER_SYSTEM,
    user: [
      `App: ${app.appName}. Use case: ${useCase}`,
      `STATED factors (from sources): ${JSON.stringify(stated)}`,
      `UNKNOWN factors to estimate: ${unknown.join(", ")}`,
      sourceBundle(g.sources, g.texts, 3000),
    ].join("\n\n"),
    schema: InferOut,
    maxTokens: 2000,
    timeoutMs: 90000,
  });
  return applyInference(stated, out, new Set(g.sources.map((s) => s.id)), app.appName);
}
