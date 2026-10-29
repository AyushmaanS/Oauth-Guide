import { z } from "zod";
import { FactorKey } from "@/lib/schema/guide";
import { EVIDENCE_RULES, UNTRUSTED_RULE } from "./common";

export const InferOut = z.object({
  inferences: z
    .array(
      z.object({
        factor: FactorKey,
        value: z.string().max(40),
        confidence: z.enum(["low", "medium", "high"]),
        // Verbose model output is truncated, not rejected: the whole stage should not fail over length.
        rationale: z.string().min(10).transform((t) => t.slice(0, 260)),
        sourceIds: z.array(z.string()).default([]),
      }),
    )
    .max(5),
  checkFirst: z.array(z.string().transform((t) => t.slice(0, 240))).default([]).transform((l) => l.slice(0, 4)),
});
export type InferOut = z.infer<typeof InferOut>;

export const INFER_SYSTEM = `You estimate difficulty factors that the sources did NOT settle, for a developer registering their OWN OAuth app. Your estimates are shown to users as clearly-labelled ESTIMATES, never as facts.
${UNTRUSTED_RULE}
${EVIDENCE_RULES}
You are given the factors the sources established ("stated") and the list of factors still UNKNOWN. For each UNKNOWN factor, return your best estimate:
{"factor": <name>, "value": <one of the allowed values>, "confidence": "low"|"medium"|"high", "rationale": "one or two sentences", "sourceIds": ["s1"]}
Allowed values: registrationFriction: instant|account_needed|paid_or_business_account; reviewRequired: none|for_public_use|for_sensitive_scopes|always; reviewDepth: none|automated|manual|security_assessment|partnership_contract; waitMagnitude: none|hours|days|weeks; businessEntityRequired: yes|no.
RULES:
- You may combine what the sources say with widely known patterns of how OAuth platforms behave (for example: apps that act for OTHER customers' accounts usually need provider review before public use; apps for the developer's own account usually do not). Phrase the rationale as a likelihood ("Typically...", "The sources suggest...") and name the source ids you rely on. Never state a provider-specific fact that the sources do not support.
- When torn between two values, choose the more cautious one (the one that means more work for the developer), except never assume paid_or_business_account, partnership_contract, security_assessment or businessEntityRequired "yes" unless a source says so: those need a sourceId.
- Be consistent: if reviewRequired is "none", reviewDepth and waitMagnitude are "none".
- "checkFirst": up to 3 SPECIFIC, CLOSED questions about THIS provider whose answers would settle or change the estimate, each naming the app and ending in "?" (good: "Does Zoom review apps before accounts outside the developer's own can install them?"; bad: "What does the review involve?", "Is it hard?"). Order by how much each would change the label.
Return ONE JSON object only: {"inferences":[...],"checkFirst":[...]}.`;
