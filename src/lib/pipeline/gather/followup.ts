import type { ChecklistId, FactorKey } from "@/lib/schema/guide";
import { classifyPublisher, isHttps, normalizeUrl } from "./sources";
import { coverageFromTexts } from "./checklist";
import { isRelevant } from "./fixed";
import { QUESTIONS, fill, type QuestionId } from "../questions";
import type { Ctx, Deps, Gathered, Resolved } from "../types";

/** One precise follow-up question per unknown factor (priority order), each with a query aimed at that single fact. */
export const FOLLOWUPS: Record<FactorKey, { target: QuestionId; lookingFor: string; query: string }> = {
  reviewRequired: { target: "review_process", lookingFor: "whether an app must be approved before other users can authorize it", query: "{app} OAuth app must be approved before other users can install or authorize" },
  reviewDepth: { target: "review_process", lookingFor: "whether the review is automated, manual or a security assessment", query: "{app} app review process manual review security assessment steps" },
  waitMagnitude: { target: "timing_evidence", lookingFor: "how many business days or weeks the app review takes", query: "{app} app review approval how many business days or weeks" },
  businessEntityRequired: { target: "requirements", lookingFor: "whether business verification or a legal entity is required", query: "{app} app review business verification legal entity required" },
  registrationFriction: { target: "registration", lookingFor: "whether a free account can create an app or a paid plan is needed", query: "{app} create OAuth app free account paid plan required" },
};
const PRIORITY: FactorKey[] = ["reviewRequired", "reviewDepth", "waitMagnitude", "businessEntityRequired", "registrationFriction"];
export const MAX_FOLLOWUPS = 3;

/**
 * Second research round (spec: "ask the right questions"). For each factor the first round left unknown,
 * run ONE targeted search and read the best unseen page. Appends sources in place; returns how many were added.
 */
export async function followupGather(app: Resolved, unknown: FactorKey[], g: Gathered, deps: Deps, ctx: Ctx): Promise<number> {
  const picks = PRIORITY.filter((k) => unknown.includes(k)).slice(0, MAX_FOLLOWUPS);
  const have = new Set(g.sources.map((s) => normalizeUrl(s.url)));
  const used = new Set(g.queries.map((q) => q.toLowerCase()));
  const queued = picks.map((k) => ({ k, ...FOLLOWUPS[k], q: fill(FOLLOWUPS[k].query, app.appName) })).filter((x) => !used.has(x.q.toLowerCase()));
  if (!queued.length || Date.now() > ctx.deadline) return 0;

  const results = await Promise.all(
    queued.map(async (x) => {
      ctx.emit({ type: "agent_step", n: 100 + queued.indexOf(x), action: "search", target: x.q, reason: `Follow-up: ${x.lookingFor}`, question: QUESTIONS[x.target].question });
      try {
        g.searches++;
        g.queries.push(x.q);
        return { x, hits: await deps.search.search(x.q, 5) };
      } catch (e) {
        g.warnings.push(`Follow-up search failed (${x.k}): ${(e as Error).message}`);
        return { x, hits: [] };
      }
    }),
  );

  // Best unseen hit per question: official first, then search order.
  const chosen: { url: string; x: (typeof queued)[number] }[] = [];
  for (const { x, hits } of results) {
    const cands = hits
      .filter((h) => isHttps(h.url) && !have.has(normalizeUrl(h.url)) && !chosen.some((c) => c.url === normalizeUrl(h.url)))
      .sort((a, b) => Number(classifyPublisher(b.url, app.providerDomains) === "official") - Number(classifyPublisher(a.url, app.providerDomains) === "official"));
    if (cands[0]) chosen.push({ url: normalizeUrl(cands[0].url), x });
  }
  if (!chosen.length || Date.now() > ctx.deadline) return 0;

  let pages: Awaited<ReturnType<Deps["search"]["extract"]>> = [];
  try {
    pages = await deps.search.extract(chosen.map((c) => c.url));
  } catch (e) {
    g.warnings.push(`Follow-up page read failed: ${(e as Error).message}`);
  }
  let added = 0;
  for (const c of chosen) {
    const page = pages.find((p) => normalizeUrl(p.url) === c.url);
    const publisher = classifyPublisher(c.url, app.providerDomains);
    if (!page || page.text.trim().length < 80 || !isRelevant(page.text, app.appName, publisher)) continue;
    const id = `s${g.sources.length + 1}`;
    g.sources.push({ id, title: (page.title || c.url).slice(0, 160), url: c.url, publisher, retrievedAt: deps.now().toISOString().slice(0, 10) });
    g.texts.set(id, page.text);
    g.pageReads++;
    added++;
    g.agentSteps = [...(g.agentSteps ?? []), { action: "read" as const, target: c.url, reason: `Follow-up: ${c.x.lookingFor}`.slice(0, 200) }].slice(0, 24);
    ctx.emit({ type: "source_found", title: g.sources[g.sources.length - 1].title, url: c.url });
  }
  // Coverage is recomputed over all sources (composio source stays last-added only if it was; text-presence check is order independent).
  g.checklist = coverageFromTexts(g.sources.map((x) => ({ id: x.id, publisher: x.publisher, text: g.texts.get(x.id) ?? "" })), g.composio);
  void (null as unknown as ChecklistId);
  return added;
}
