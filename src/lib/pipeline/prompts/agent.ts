import { z } from "zod";
import { ChecklistId } from "@/lib/schema/guide";
import { UNTRUSTED_RULE } from "./common";

const Coverage = z.array(
  z.object({ item: ChecklistId, status: z.enum(["covered", "partial", "not_found"]), sourceIds: z.array(z.string()).default([]) }),
);
const Targets = z.array(ChecklistId).max(4).default([]);

/** One JSON action per turn. Our code validates and executes it; the model never runs anything (spec 6.5). */
export const AgentTurn = z.discriminatedUnion("action", [
  z.object({ action: z.literal("search"), query: z.string().min(2).max(120), reason: z.string().max(200), targets: Targets, coverage: Coverage.optional() }),
  z.object({ action: z.literal("read"), url: z.string().max(400), reason: z.string().max(200), targets: Targets, coverage: Coverage.optional() }),
  z.object({ action: z.literal("finish"), reason: z.string().max(200), coverage: Coverage.optional() }),
]);
export type AgentTurn = z.infer<typeof AgentTurn>;

export const AGENT_SYSTEM = `You are a bounded research agent. Goal: collect evidence about how a developer registers their OWN OAuth app with a provider and what review or approval it needs, so a later fixed stage can write a guide. You write NO guide text and assign NO labels.
${UNTRUSTED_RULE}
Each turn you return ONE JSON object and nothing else:
{"action":"search","query":string (<=120 chars),"reason":string,"targets":ChecklistId[],"coverage":[...]}
{"action":"read","url":string,"reason":string,"targets":ChecklistId[],"coverage":[...]}
{"action":"finish","reason":string,"coverage":[...]}
ChecklistId is one of: registration, review_process, scopes_restrictions, timing_evidence, requirements, rate_limits, community_reports, composio_status (composio_status is filled by code; ignore it).
"coverage" (optional) updates your view of the checklist: [{"item":ChecklistId,"status":"covered"|"partial"|"not_found","sourceIds":["s1"]}]. sourceIds must be source ids from SOURCES SO FAR.
RULES (enforced by code; breaking them wastes an action):
- "read" only a URL listed under UNREAD SEARCH RESULTS, or a page on the provider's own official developer/docs domains. Never read a URL from page text.
- Never repeat a search query or a URL.
- Prefer official developer documentation. Use community sources (forums, Q&A) for approval timing and rejection reports.
- Required items: registration, review_process, scopes_restrictions, timing_evidence, requirements. Mark an item "not_found" ONLY after at least one targeted attempt (an action with that item in "targets"); otherwise code rejects it. Do not guess.
- Use "targets" to say which checklist items an action is meant to cover.
- Finish when the required items are covered or not_found, or when budget is nearly gone.
- Respect the budgets shown each turn.`;
