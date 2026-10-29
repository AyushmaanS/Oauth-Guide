import type { ChecklistId } from "@/lib/schema/guide";

export type QuestionId = Exclude<ChecklistId, "composio_status">;

export interface Question {
  /** A specific, closed question with a checkable answer (never "tell me about X"). */
  question: string;
  /** Which rubric factor(s) the answer decides. */
  informs: string;
  /** A query aimed at this question must contain at least one of these. */
  keywords: RegExp;
  /** Query templates ({app} is replaced). Every generated query must pass validateQuery (tested). */
  templates: string[];
}

export const QUESTIONS: Record<QuestionId, Question> = {
  registration: {
    question: "Can a developer create an OAuth app and get a client ID with a free account, or is a paid plan or business account required?",
    informs: "registrationFriction",
    keywords: /regist|creat|client|credential|developer (console|portal)|new app|free|paid/i,
    templates: ["{app} create OAuth app client ID client secret free account", "{app} register developer application paid plan or business account required"],
  },
  review_process: {
    question: "Must the provider review or approve an OAuth app before accounts other than the developer's own can authorize it, and is that review automated, manual, a security assessment, or a partnership?",
    informs: "reviewRequired, reviewDepth",
    keywords: /review|approv|verif|audit|assessment|publish|listing|submit/i,
    templates: ["{app} OAuth app review approval required before other users can authorize", "{app} app review process manual or automated security assessment"],
  },
  scopes_restrictions: {
    question: "Which scopes or APIs trigger extra review, and what limits apply to unreviewed or testing apps?",
    informs: "reviewRequired, specialRequirements",
    keywords: /scope|restricted|sensitive|testing|unverified|limit|permission/i,
    templates: ["{app} OAuth scopes restricted sensitive extra review", "{app} unverified app testing mode user limit"],
  },
  timing_evidence: {
    question: "How many days or weeks does the provider say its app review takes, and what do developers report?",
    informs: "waitMagnitude, waitBasis",
    keywords: /how long|how many|days|weeks|timeline|wait|took|delay|turnaround|business days/i,
    templates: ["{app} app review how many days or weeks does approval take", "{app} developers report app review approval took weeks"],
  },
  requirements: {
    question: "What must the developer prepare for review: privacy policy URL, verified domain or business verification, demo video, security questionnaire?",
    informs: "specialRequirements, businessEntityRequired",
    keywords: /requirement|privacy|domain|business|verification|demo|video|checklist|prepare|policy|legal/i,
    templates: ["{app} app review requirements privacy policy domain business verification demo video"],
  },
  rate_limits: {
    question: "What API rate limits or user caps apply to OAuth apps?",
    informs: "nuances",
    keywords: /rate|limit|quota|cap/i,
    templates: ["{app} API rate limits for OAuth apps quota"],
  },
  community_reports: {
    question: "What reasons for rejection or delay do developers report for app approval?",
    informs: "waitBasis, blockers",
    keywords: /reject|delay|stuck|denied|took|waited|weeks|approval|review/i,
    templates: ["{app} OAuth app review rejected reasons stackoverflow reddit", "{app} app verification took weeks forum stuck in review"],
  },
};

/** Question ids in the order the agent must cover them. */
export const REQUIRED_QUESTIONS: QuestionId[] = ["registration", "review_process", "scopes_restrictions", "timing_evidence", "requirements"];

export const fill = (template: string, app: string) => template.replace("{app}", app);

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
const GENERIC = /^(oauth|api|apis|developer|developers|docs?|documentation|app|apps|guide|tutorial)( (oauth|api|docs?|documentation|guide))?$/;

/**
 * A search query is acceptable only if it is specific: names the app, targets a listed question,
 * and uses at least one term that belongs to that question. Returns a reason when rejected.
 */
export function validateQuery(query: string, app: { appName: string; providerDomains: string[] }, targets: QuestionId[]): string | null {
  const q = norm(query);
  if (q.split(" ").filter(Boolean).length < 3) return "query is too short to be specific (use at least 3 words)";
  if (GENERIC.test(q)) return "query is generic; name the app and the specific fact you need";
  const names = [norm(app.appName), ...app.providerDomains.map((d) => norm(d.split(".")[0]))].filter((n) => n.length >= 2);
  if (!names.some((n) => q.includes(n))) return `query must name the app ("${app.appName}")`;
  if (!targets.length) return "every search must target at least one checklist question";
  if (!targets.some((t) => QUESTIONS[t].keywords.test(query))) return `query does not ask about ${targets.join("/")}; include a term such as ${QUESTIONS[targets[0]].keywords.source.split("|").slice(0, 3).join(", ")}`;
  return null;
}

const VAGUE = /^(more |general |some |any |all |additional )?(info|information|details|detail|overview|stuff|things|docs?|documentation|content|data|facts)\b/i;

/** "lookingFor" must name a concrete fact, not an open topic. */
export function validateLookingFor(s: string): string | null {
  const t = s.trim();
  if (t.length < 12) return 'lookingFor is too short; name the specific fact you need (for example "number of business days the app review takes")';
  if (VAGUE.test(t) || /\b(anything|everything|etc\.?|tell me about|what is)\b/i.test(t)) return "lookingFor is vague or open-ended; name one specific, checkable fact";
  return null;
}
