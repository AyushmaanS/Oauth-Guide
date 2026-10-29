import type { Actor, Claim, RequirementTag, Step } from "@/lib/schema/guide";

/** Tags that only a human can complete (spec 6.6). */
export const HUMAN_ONLY_TAGS: readonly RequirementTag[] = [
  "login_or_account",
  "email_or_phone_verification",
  "two_factor",
  "captcha_or_bot_check",
  "identity_or_business_verification",
  "payment",
  "legal_acceptance",
  "manual_submission",
];

/** Pure rule: provider wait beats human-only beats agent. Empty tags are rejected. */
export function mapOwner(requires: readonly RequirementTag[]): Actor {
  if (requires.length === 0) throw new Error("A step must have at least one requirement tag");
  if (requires.includes("provider_review_wait")) return "provider_wait";
  if (requires.some((t) => HUMAN_ONLY_TAGS.includes(t))) return "you";
  return "agent";
}

export function humanOnlyTags(requires: readonly RequirementTag[]): RequirementTag[] {
  return requires.filter((t) => HUMAN_ONLY_TAGS.includes(t));
}

/** Overwrite every step's actor from its tags. */
export function applyOwners<T extends Pick<Step, "requires" | "actor">>(steps: T[]): T[] {
  return steps.map((s) => ({ ...s, actor: mapOwner(s.requires) }));
}

export interface Handoff {
  agentCanDo: Claim[];
  youMustDo: Claim[];
  providerWait: Claim[];
}

/** Build the handoff table from steps. Ignores any actor already on the steps. */
export function deriveHandoff(steps: Step[]): Handoff {
  const h: Handoff = { agentCanDo: [], youMustDo: [], providerWait: [] };
  for (const s of steps) {
    const owner = mapOwner(s.requires);
    const label = `Step ${s.order}: ${s.title}`;
    if (owner === "agent") {
      h.agentCanDo.push({ text: label, evidence: s.evidence });
    } else if (owner === "you") {
      h.youMustDo.push({
        text: `${label} (needs: ${humanOnlyTags(s.requires).join(", ")})`,
        evidence: s.evidence,
      });
      if (s.agentPrep)
        h.agentCanDo.push({ text: `Step ${s.order} (prep): ${s.agentPrep}`, evidence: s.evidence });
    } else {
      h.providerWait.push({ text: label, evidence: s.evidence });
    }
  }
  return h;
}
