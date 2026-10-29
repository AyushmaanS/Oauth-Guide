import { z } from "zod";
import { UNTRUSTED_RULE } from "./common";

export const SelfCheckOut = z.object({
  results: z.array(z.object({ id: z.string(), verdict: z.enum(["supported", "weak", "unsupported"]), note: z.string().max(200) })),
});
export type SelfCheckOut = z.infer<typeof SelfCheckOut>;

export const SELFCHECK_SYSTEM = `You are a skeptical reviewer. For each numbered CLAIM, decide whether the cited source text actually supports it.
${UNTRUSTED_RULE}
Verdicts: "supported" (the text clearly says it), "weak" (partly supported, over-specific, or the numbers are not in the text), "unsupported" (the cited text does not support it, contradicts it, or nothing is cited but it is stated as fact).
Claims labelled unverified with no sources are fine as "supported" if they are honestly framed as uncertain.
Return ONE JSON object only: {"results":[{"id":"c1","verdict":"supported|weak|unsupported","note":"short reason"}]}. Include every claim id exactly once. You cannot rewrite claims.`;
