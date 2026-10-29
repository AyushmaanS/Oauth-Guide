import { z } from "zod";
import { RequirementTag } from "@/lib/schema/guide";
import { EVIDENCE_RULES, UNTRUSTED_RULE } from "./common";

const Ev = z.object({ label: z.enum(["documented", "reported", "unverified"]), sourceIds: z.array(z.string()).default([]) });
const SClaim = z.object({ text: z.string().min(3).max(400), evidence: Ev });
const SRange = z.object({
  /** true = the numbers are your own estimate, not from a source (see rules). */
  estimate: z.boolean().optional(),
  minDays: z.number().optional(),
  maxDays: z.number().optional(),
  minHours: z.number().optional(),
  maxHours: z.number().optional(),
  basis: z.string().min(3).max(300),
  evidence: Ev,
});

/** Keep the well-formed items of a list and drop malformed ones, so one bad item cannot fail the whole guide. */
const lenient = <T extends z.ZodTypeAny>(item: T, max: number) =>
  z
    .array(z.unknown())
    .default([])
    .transform((list) => list.flatMap((x) => { const r = item.safeParse(x); return r.success ? [r.data as z.output<T>] : []; }).slice(0, max));

const Step = z.object({
  title: z.string().min(3).max(140),
  estimate: z.string().max(60),
  detail: z.string().max(500),
  url: z.string().optional(),
  requires: z.array(RequirementTag).min(1),
  agentPrep: z.string().max(250).optional(),
  evidence: Ev,
});
const Blocker = z.object({ problem: z.string().max(250), fix: z.string().max(350), contact: z.string().max(200).optional(), evidence: Ev });

/** `strict` is the shape shown to the model (JSON schema); the lenient variant is what we parse with. */
const build = (strict: boolean) => {
  const L = <T extends z.ZodTypeAny>(item: T, max: number) => (strict ? z.array(item).max(max) : lenient(item, max));
  return z.object({
  summary: z.string().min(10).max(300),
  biggestLaunchRisk: z.string().min(5).max(300),
  timeToCredentials: SRange,
  timeToProduction: z.union([SRange, z.object({ none: z.literal(true), evidence: Ev })]),
  humanEffortHours: SRange,
  managedCovers: L(SClaim, 6),
  youNeedOwnWhen: L(SClaim, 8),
  requirements: L(SClaim, 14),
  steps: L(Step, 14).refine((l) => l.length >= 1, "at least one valid step is required"),
  scopesAndNuances: L(SClaim, 12),
  blockers: L(Blocker, 8),
  unverified: z.array(z.string().max(250)).max(12),
  nextAction: z.string().min(5).max(250),
  });
};
export const SynthOut = build(false);
/** Strict shape, used only to describe the expected JSON to the model. */
export const SynthShape = build(true);
export type SynthOut = z.infer<typeof SynthOut>;

export const SYNTH_SYSTEM = `You write the body of a verdict-first guide for a developer who must register their OWN OAuth app with a provider. Use ONLY the provided sources and the provided factors. Do not decide the difficulty label or who performs a step: code does that.
${UNTRUSTED_RULE}
${EVIDENCE_RULES}
RULES:
- Plain, direct language a product manager can follow. Time as RANGES with a "basis" sentence that names where the figure comes from.
- A number that comes from a source: label documented or reported with its sourceIds.
- If NO source gives a figure, still give a useful WIDE estimated range derived from the FACTORS, set "estimate": true, label "unverified", sourceIds [], and make the basis start with "Our estimate:" and name the reasoning. Typical classes: creating an app with instant/account registration takes minutes to an hour or two; automated review hours to a few days; manual review one to four weeks; security assessment four to twelve weeks or more; no review means timeToProduction is {"none": true}. Keep estimates wide and never narrower than the reasoning supports. Never give an estimate a documented or reported label.
- A time range's evidence cannot be stronger than the weakest evidence behind it.
- "timeToProduction": if the provider needs no review/approval for the use case, return {"none": true, "evidence": {...}}; otherwise a range (sourced or an estimate as above).
- Factors marked ESTIMATED in the input are our estimates, not facts: do not state them as facts anywhere in the guide; say "likely" or "typically".
- Steps: ordered, concrete, each with "requires": a non-empty list of tags from EXACTLY this set: login_or_account, email_or_phone_verification, two_factor, captcha_or_bot_check, identity_or_business_verification, payment, legal_acceptance, manual_submission, provider_review_wait, text_drafting, config_check, code_writing, docs_reading. Tag honestly what the step needs. "manual_submission" is ONLY for submitting something to the provider's review/approval (review form with business details, demo video, "Submit for review"); creating or editing the app itself in the developer console is "config_check" (signing in is its own "login_or_account" step). "legal_acceptance" only when the sources say terms must be accepted. Put preparable work for human-only steps in "agentPrep" (for example "draft the scope justification"). Do NOT say who performs a step.
- Step "url": only a URL that appears EXACTLY in the SOURCE INDEX; otherwise omit it.
- Include steps for waiting on provider review when a review is required (tag provider_review_wait).
- "unverified": list open uncertainties and things the sources did not answer.
- "managedCovers"/"youNeedOwnWhen": when managed OAuth (a shared OAuth app supplied by an integration platform such as Composio) is enough for prototyping and when the developer must bring their own app. Base these only on sources; Composio's directory source supports only the statement of Composio-managed status.
- Observed facts are NOT available yet: never claim anything was tested or observed.
Return ONE JSON object only, matching exactly the JSON schema given in the user message.`;
