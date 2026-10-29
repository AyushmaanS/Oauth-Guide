import { z } from "zod";
import { RequirementTag } from "@/lib/schema/guide";
import { EVIDENCE_RULES, UNTRUSTED_RULE } from "./common";

const Ev = z.object({ label: z.enum(["documented", "reported", "unverified"]), sourceIds: z.array(z.string()).default([]) });
const SClaim = z.object({ text: z.string().min(3).max(400), evidence: Ev });
const SRange = z.object({
  minDays: z.number().optional(),
  maxDays: z.number().optional(),
  minHours: z.number().optional(),
  maxHours: z.number().optional(),
  basis: z.string().min(3).max(300),
  evidence: Ev,
});

export const SynthOut = z.object({
  summary: z.string().min(10).max(300),
  biggestLaunchRisk: z.string().min(5).max(300),
  timeToCredentials: SRange,
  timeToProduction: z.union([SRange, z.object({ none: z.literal(true), evidence: Ev })]),
  humanEffortHours: SRange,
  managedCovers: z.array(SClaim).max(6),
  youNeedOwnWhen: z.array(SClaim).max(8),
  requirements: z.array(SClaim).max(14),
  steps: z
    .array(
      z.object({
        title: z.string().min(3).max(140),
        estimate: z.string().max(60),
        detail: z.string().max(500),
        url: z.string().optional(),
        requires: z.array(RequirementTag).min(1),
        agentPrep: z.string().max(250).optional(),
        evidence: Ev,
      }),
    )
    .min(1)
    .max(14),
  scopesAndNuances: z.array(SClaim).max(12),
  blockers: z.array(z.object({ problem: z.string().max(250), fix: z.string().max(350), contact: z.string().max(200).optional(), evidence: Ev })).max(8),
  unverified: z.array(z.string().max(250)).max(12),
  nextAction: z.string().min(5).max(250),
});
export type SynthOut = z.infer<typeof SynthOut>;

export const SYNTH_SYSTEM = `You write the body of a verdict-first guide for a developer who must register their OWN OAuth app with a provider. Use ONLY the provided sources and the provided factors. Do not decide the difficulty label or who performs a step: code does that.
${UNTRUSTED_RULE}
${EVIDENCE_RULES}
RULES:
- Plain, direct language a product manager can follow. Time as RANGES with a "basis" sentence that names where the figure comes from; if no source gives a time, leave the numbers out, say so in the basis, and use "unverified".
- Every NUMBER in a range must come from a source. If you would be estimating, leave the numbers out and use "unverified". Never fill a range with your own guess and label it documented or reported.
- A time range's evidence cannot be stronger than the weakest evidence behind it.
- "timeToProduction": if the provider needs no review/approval for the use case, return {"none": true, "evidence": {...}}; otherwise a range.
- Steps: ordered, concrete, each with "requires": a non-empty list of tags from EXACTLY this set: login_or_account, email_or_phone_verification, two_factor, captcha_or_bot_check, identity_or_business_verification, payment, legal_acceptance, manual_submission, provider_review_wait, text_drafting, config_check, code_writing, docs_reading. Tag honestly what the step needs. "manual_submission" is ONLY for submitting something to the provider's review/approval (review form with business details, demo video, "Submit for review"); creating or editing the app itself in the developer console is "config_check" (signing in is its own "login_or_account" step). "legal_acceptance" only when the sources say terms must be accepted. Put preparable work for human-only steps in "agentPrep" (for example "draft the scope justification"). Do NOT say who performs a step.
- Step "url": only a URL that appears EXACTLY in the SOURCE INDEX; otherwise omit it.
- Include steps for waiting on provider review when a review is required (tag provider_review_wait).
- "unverified": list open uncertainties and things the sources did not answer.
- "managedCovers"/"youNeedOwnWhen": when managed OAuth (a shared OAuth app supplied by an integration platform such as Composio) is enough for prototyping and when the developer must bring their own app. Base these only on sources; Composio's directory source supports only the statement of Composio-managed status.
- Observed facts are NOT available yet: never claim anything was tested or observed.
Return ONE JSON object only, matching exactly the JSON schema given in the user message.`;
