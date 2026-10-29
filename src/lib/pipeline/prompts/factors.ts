import { z } from "zod";
import { Factors } from "@/lib/schema/guide";
import { EVIDENCE_RULES, UNTRUSTED_RULE } from "./common";

const Claim = z.object({ text: z.string().max(300), sourceIds: z.array(z.string()) });

export const FactorsOut = z.object({
  useCase: z.string().min(5).max(200),
  factors: Factors,
  // Claims are context for the next stage only: keep the well-formed ones rather than failing the whole call.
  claims: z
    .array(z.unknown())
    .default([])
    .transform((list) => list.flatMap((c) => (Claim.safeParse(c).success ? [Claim.parse(c)] : [])).slice(0, 25)),
});
export type FactorsOut = z.infer<typeof FactorsOut>;

export const FACTORS_SYSTEM = `You extract difficulty factors for registering a developer's OWN OAuth app with a provider, from provided sources only.
${UNTRUSTED_RULE}
${EVIDENCE_RULES}
First choose "useCase": the single use case an AI-agent builder most likely has (for example "an agent that reads and sends a customer's Gmail"). The factors must describe THAT use case. If difficulty differs a lot by scope tier, describe the harder tier the use case needs.
Return ONE JSON object only with keys: useCase, factors, claims.
"factors" keys and allowed values:
- registrationFriction: "instant" | "account_needed" | "paid_or_business_account" | "unknown"  (ONLY about creating the app and getting credentials. "paid_or_business_account" only if a paid plan or business account is needed just to register; needing a legal entity for REVIEW goes in businessEntityRequired instead)
- reviewRequired: "none" | "for_public_use" | "for_sensitive_scopes" | "always" | "unknown"  (is provider review required for the use case? An optional marketplace listing does NOT count as required)
- reviewDepth: "none" | "automated" | "manual" | "security_assessment" | "partnership_contract" | "unknown"
- docsQuality: "clear" | "partial" | "poor"
- waitBasis: "documented" | "reported" | "unknown"  (how well the review wait is evidenced)
- waitMagnitude: "none" | "hours" | "days" | "weeks" | "unknown"  (typical wait for the REQUIRED review)
- businessEntityRequired: "yes" | "no" | "unknown"  (is a registered legal organisation or verified business required to get access for this use case?)
- specialRequirements: string[] (things you must obtain or prepare BEYOND filling in the registration form, such as "privacy policy URL", "demo video", "domain verification", "business documents", "security assessment"; do NOT list ordinary form fields like app name, homepage or callback URL; only if the sources state them)
Use "unknown" whenever the sources do not say. Do not use outside knowledge.
"claims": up to 25 items shaped exactly {"text": "short factual statement", "sourceIds": ["s1"]} (ids from the SOURCE INDEX).`;
