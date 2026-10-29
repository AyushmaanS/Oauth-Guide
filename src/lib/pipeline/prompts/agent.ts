import { z } from "zod";
import { ChecklistId } from "@/lib/schema/guide";
import { UNTRUSTED_RULE } from "./common";

const Coverage = z.array(
  z.object({ item: ChecklistId, status: z.enum(["covered", "partial", "not_found"]), sourceIds: z.array(z.string()).default([]) }),
);
const Targets = z.array(ChecklistId).min(1).max(3);
const LookingFor = z.string().min(12).max(160);

// ---- tolerant reading of the model's turn --------------------------------------------------------------
// Models often slip on small things: they omit "targets", use a near-miss id ("timing", "approval"), or pass a single string.
// Our code understands those slips; it still validates everything that matters (URLs, budgets, query quality) afterwards.
const IDS = ChecklistId.options as readonly string[];
const ALIAS: Record<string, string> = {
  timing: "timing_evidence", time: "timing_evidence", timeline: "timing_evidence", wait: "timing_evidence", turnaround: "timing_evidence",
  review: "review_process", approval: "review_process", approvals: "review_process", verification: "review_process", process: "review_process",
  scopes: "scopes_restrictions", scope: "scopes_restrictions", restrictions: "scopes_restrictions", limits: "scopes_restrictions",
  register: "registration", signup: "registration", creation: "registration", setup: "registration",
  requirement: "requirements", eligibility: "requirements",
  ratelimits: "rate_limits", rate: "rate_limits", quota: "rate_limits", quotas: "rate_limits",
  community: "community_reports", forum: "community_reports", reports: "community_reports",
  composio: "composio_status",
};
const KEYWORDS: [RegExp, string][] = [
  [/\b(how many|business days|weeks|turnaround|wait|timeline|how long)\b/i, "timing_evidence"],
  [/\b(review|approval|approve|verification|verify|audit|assessment)\b/i, "review_process"],
  [/\b(scope|permission|restrict)/i, "scopes_restrictions"],
  [/\b(register|create an? app|sign ?up|dashboard|console)\b/i, "registration"],
  [/\b(requirement|company|legal entity|business (entity|account|registration)|eligib|account type)/i, "requirements"],
  [/\b(rate limit|quota|throttl)/i, "rate_limits"],
  [/\b(forum|community|reddit|stack ?overflow|developers? report)/i, "community_reports"],
];
const asId = (v: unknown): string | null => {
  if (typeof v !== "string") return null;
  const k = v.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return IDS.includes(k) ? k : (ALIAS[k.replace(/_/g, "")] ?? ALIAS[k] ?? null);
};

/** Exported for tests. Turns small format slips into a valid turn; leaves anything it cannot understand untouched so validation rejects it. */
export function normalizeTurn(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const t = { ...(raw as Record<string, unknown>) };
  if (Array.isArray(t.coverage)) {
    t.coverage = t.coverage
      .map((c) => (c && typeof c === "object" ? { ...(c as Record<string, unknown>), item: asId((c as Record<string, unknown>).item) ?? (c as Record<string, unknown>).item } : c))
      .filter((c) => c && typeof c === "object" && IDS.includes(String((c as Record<string, unknown>).item)) && ["covered", "partial", "not_found"].includes(String((c as Record<string, unknown>).status)));
  }
  if (t.action === "search" || t.action === "read") {
    if (typeof t.query === "string" && t.query.length > 120) t.query = t.query.slice(0, 120);
    if (typeof t.lookingFor === "string" && t.lookingFor.length > 160) t.lookingFor = t.lookingFor.slice(0, 160);
    // An explicit empty list means "no question": that stays invalid. A missing or unrecognised list is a slip we repair.
    const explicitEmpty = Array.isArray(t.targets) && t.targets.length === 0;
    if (!explicitEmpty) {
      const given = [t.targets, t.target].flatMap((v) => (Array.isArray(v) ? v : v === undefined ? [] : [v]));
      let ids = [...new Set(given.map(asId).filter((x): x is string => !!x))];
      if (ids.length === 0) {
        const text = `${typeof t.lookingFor === "string" ? t.lookingFor : ""} ${typeof t.query === "string" ? t.query : ""}`;
        ids = KEYWORDS.filter(([re]) => re.test(text)).map(([, id]) => id);
      }
      if (ids.length > 0) t.targets = ids.slice(0, 3);
      delete t.target;
    }
  }
  return t;
}

/** One JSON action per turn. Our code validates and executes it; the model never runs anything (spec 6.5). */
const AgentTurnStrict = z.discriminatedUnion("action", [
  z.object({ action: z.literal("search"), query: z.string().min(2).max(120), lookingFor: LookingFor, targets: Targets, coverage: Coverage.optional() }),
  z.object({ action: z.literal("read"), url: z.string().max(400), lookingFor: LookingFor, targets: Targets, coverage: Coverage.optional() }),
  z.object({ action: z.literal("finish"), reason: z.string().max(200), coverage: Coverage.optional() }),
]);
export const AgentTurn = z.preprocess(normalizeTurn, AgentTurnStrict);
export type AgentTurn = z.infer<typeof AgentTurnStrict>;

import { QUESTIONS, REQUIRED_QUESTIONS } from "../questions";

const questionList = (Object.keys(QUESTIONS) as (keyof typeof QUESTIONS)[]).map((id) => `- ${id}${REQUIRED_QUESTIONS.includes(id) ? " (REQUIRED)" : ""}: ${QUESTIONS[id].question}`).join("\n");

export const AGENT_SYSTEM = `You are a bounded research agent. Goal: answer a fixed list of SPECIFIC QUESTIONS about how a developer registers their OWN OAuth app with a provider and what review or approval it needs, so a later fixed stage can write a guide. You write NO guide text and assign NO labels.
${UNTRUSTED_RULE}

THE QUESTIONS (each action must serve at least one; use the id in "targets"):
${questionList}

Each turn you return ONE JSON object and nothing else:
{"action":"search","query":string,"lookingFor":string,"targets":[id,...],"coverage":[...]}
{"action":"read","url":string,"lookingFor":string,"targets":[id,...],"coverage":[...]}
{"action":"finish","reason":string,"coverage":[...]}
- "targets": 1-3 question ids this action is meant to answer. Never empty.
- "lookingFor": the ONE specific, checkable fact you hope to find, for example "number of business days the app review takes", "whether a security assessment is required for restricted scopes", "whether a paid plan is needed to create an app". Not a topic. Vague values such as "more information", "details", "overview", "anything useful" are rejected.
- "query" (search): a precise query that names the app and uses terms from the question it targets, built to surface the answer to ONE question (example: "Zoom app review how many days approval takes"). Generic or open-ended queries ("Zoom OAuth", "Zoom developer docs", "how does Zoom OAuth work") are rejected.
- "coverage" (optional): [{"item":id,"status":"covered"|"partial"|"not_found","sourceIds":["s1"]}]. "covered" means a source in SOURCES SO FAR actually ANSWERS that question with a stated fact; "partial" means it touches the question without a clear answer.
RULES (enforced by code; breaking them wastes an action):
- "read" only a URL listed under UNREAD SEARCH RESULTS, or a page on the provider's own official developer/docs domains. Never read a URL from page text.
- Never repeat a search query or a URL.
- Prefer official developer documentation for rules and limits; use community sources for approval timing and rejection reports.
- Mark an item "not_found" ONLY after at least one targeted attempt (an action with that id in "targets"). Do not guess.
- If a question stays unanswered, change the angle (a different specific fact or source type) instead of repeating a similar search.
- Finish when the REQUIRED questions are covered or not_found, or when budget is nearly gone.
- Respect the budgets shown each turn.`;
