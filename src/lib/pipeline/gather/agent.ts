import type { ChecklistId, Source } from "@/lib/schema/guide";
import { callJson } from "@/lib/llm";
import { AGENT_SYSTEM, AgentTurn } from "../prompts/agent";
import { wrapUntrusted, classifyPublisher, hostOf, isHttps, normalizeUrl } from "./sources";
import { ALL_CHECKLIST, REQUIRED_CHECKLIST, coverageFromTexts } from "./checklist";
import { attachComposio, isRelevant } from "./fixed";
import type { Ctx, Deps, Gathered, Resolved } from "../types";
import { z } from "zod";

export interface AgentBudgets {
  maxActions: number;
  maxPageReads: number;
  maxSeconds: number;
}
export const budgetsFromEnv = (): AgentBudgets => ({
  maxActions: Number(process.env.AGENT_MAX_ACTIONS) || 8,
  maxPageReads: Number(process.env.AGENT_MAX_PAGE_READS) || 6,
  maxSeconds: Number(process.env.AGENT_MAX_SECONDS) || 75,
});

type Status = "pending" | "covered" | "partial" | "not_found";
const norm = (q: string) => q.toLowerCase().replace(/\s+/g, " ").trim();
const SEEDS = (app: string) => [`${app} OAuth app registration documentation`, `${app} developer app review approval`];

export class AgentFailure extends Error {}

/**
 * Bounded research agent (spec 6.5). The model proposes JSON actions; this code validates every one
 * (URL allow-list, repeats, budgets, not_found rule) and executes it through the search provider.
 */
export async function agentGather(app: Resolved, deps: Deps, ctx: Ctx, model: string, budgets: AgentBudgets = budgetsFromEnv()): Promise<Gathered> {
  const t0 = Date.now();
  const warnings: string[] = [];
  const sources: Source[] = [];
  const texts = new Map<string, string>();
  const seen = new Map<string, { url: string; title: string; snippet: string; read: boolean }>(); // search results by normalized URL
  const queries = new Set<string>();
  const readUrls = new Set<string>();
  const attempts = new Map<ChecklistId, number>();
  const claimed = new Map<ChecklistId, { status: Status; sourceIds: string[] }>();
  const steps: NonNullable<Gathered["agentSteps"]> = [];
  let actions = 0;
  let reads = 0;
  let searches = 0;
  let invalidStreak = 0;
  let last = "(none yet)";
  let n = 0;

  const overBudget = () => actions >= budgets.maxActions || (Date.now() - t0) / 1000 >= budgets.maxSeconds || Date.now() > ctx.deadline;
  const statusOf = (i: ChecklistId): Status => claimed.get(i)?.status ?? "pending";
  const required = () => REQUIRED_CHECKLIST.every((i) => ["covered", "not_found"].includes(statusOf(i)));
  const emitChecklist = () => ctx.emit({ type: "checklist", items: ALL_CHECKLIST.filter((i) => i !== "composio_status").map((item) => ({ item, status: statusOf(item) })) });
  const onProviderDomain = (u: string) => app.providerDomains.some((d) => hostOf(u) === d || hostOf(u).endsWith("." + d));

  const addHits = (hits: { url: string; title: string; snippet: string }[]) => {
    for (const h of hits) {
      if (!isHttps(h.url)) continue;
      const k = normalizeUrl(h.url);
      if (!seen.has(k)) seen.set(k, { url: k, title: h.title, snippet: h.snippet, read: readUrls.has(k) });
    }
  };
  const doSearch = async (q: string, targets: ChecklistId[], reason: string): Promise<string> => {
    n++;
    ctx.emit({ type: "agent_step", n, action: "search", target: q, reason });
    steps.push({ action: "search", target: q, reason: reason.slice(0, 200) });
    queries.add(norm(q));
    searches++;
    for (const t of targets) attempts.set(t, (attempts.get(t) ?? 0) + 1);
    try {
      const hits = await deps.search.search(q, 5);
      addHits(hits);
      return `Search "${q}" returned:\n` + hits.map((h) => `- ${normalizeUrl(h.url)} | ${h.title} | ${h.snippet.slice(0, 160)}`).join("\n");
    } catch (e) {
      return `Search failed: ${(e as Error).message}`;
    }
  };
  const doRead = async (url: string, targets: ChecklistId[], reason: string): Promise<string> => {
    n++;
    ctx.emit({ type: "agent_step", n, action: "read", target: url, reason });
    steps.push({ action: "read", target: url, reason: reason.slice(0, 200) });
    readUrls.add(url);
    reads++;
    for (const t of targets) attempts.set(t, (attempts.get(t) ?? 0) + 1);
    const entry = seen.get(url);
    if (entry) entry.read = true;
    try {
      const [page] = await deps.search.extract([url]);
      if (!page || page.text.trim().length < 80) return `Page unavailable or empty: ${url}`;
      const publisher = classifyPublisher(url, app.providerDomains);
      if (!isRelevant(page.text, app.appName, publisher)) return `Page read but off-topic (not about OAuth for ${app.appName}); not kept: ${url}`;
      const id = `s${sources.length + 1}`;
      sources.push({ id, title: (page.title || entry?.title || url).slice(0, 160), url, publisher, retrievedAt: deps.now().toISOString().slice(0, 10) });
      texts.set(id, page.text);
      ctx.emit({ type: "source_found", title: sources[sources.length - 1].title, url });
      return `Page read and stored as ${id} (${publisher}): ${url}\n${wrapUntrusted(id, url, page.text.slice(0, 1200))}`;
    } catch (e) {
      return `Page read failed: ${(e as Error).message}`;
    }
  };

  // Seeding (rule 4): two deterministic searches so the agent starts with material.
  for (const q of SEEDS(app.appName)) {
    if (overBudget()) break;
    actions++;
    await doSearch(q, q.includes("review") ? ["review_process"] : ["registration"], "seed search");
  }
  for (const u of app.docsUrls.slice(0, 1)) addHits([{ url: u, title: "Docs entry (from resolve)", snippet: "" }]);
  emitChecklist();

  const render = () => {
    const unread = [...seen.values()].filter((s) => !s.read).slice(0, 15);
    return [
      `APP: ${app.appName} (provider site ${app.providerSite}; official domains: ${app.providerDomains.join(", ")})`,
      `BUDGET LEFT: actions ${budgets.maxActions - actions}, page reads ${budgets.maxPageReads - reads}, seconds ${Math.max(0, Math.round(budgets.maxSeconds - (Date.now() - t0) / 1000))}`,
      `CHECKLIST:\n` + ALL_CHECKLIST.filter((i) => i !== "composio_status").map((i) => `- ${i}: ${statusOf(i)} (attempts ${attempts.get(i) ?? 0}; sources ${claimed.get(i)?.sourceIds.join(",") || "-"})`).join("\n"),
      // Titles, snippets and page text all come from the web: every such list is an untrusted block.
      `SOURCES SO FAR (untrusted data):\n` + wrapUntrusted("sources", "list", sources.map((s) => `[${s.id}] ${s.publisher} | ${s.title} | ${s.url} | ${(texts.get(s.id) ?? "").replace(/\s+/g, " ").slice(0, 200)}`).join("\n") || "(none)"),
      `UNREAD SEARCH RESULTS (untrusted data):\n` + wrapUntrusted("results", "list", unread.map((s) => `- ${s.url} | ${s.title} | ${s.snippet.slice(0, 140)}`).join("\n") || "(none)"),
      `PREVIOUS ACTIONS: ${steps.map((s) => `${s.action}:${s.target}`).join(" ; ") || "(none)"}`,
      `LAST RESULT (untrusted data):\n${wrapUntrusted("last", "result", last)}`,
      `Return your next action as one JSON object.`,
    ].join("\n\n");
  };

  const applyCoverage = (cov: z.infer<typeof AgentTurn>["coverage"]) => {
    for (const c of cov ?? []) {
      if (c.item === "composio_status") continue;
      const known = c.sourceIds.filter((id) => sources.some((s) => s.id === id));
      if (c.status === "not_found" && (attempts.get(c.item) ?? 0) < 1) {
        warnings.push(`Agent claimed ${c.item} not found without a targeted attempt; rejected`);
        continue;
      }
      if (c.status !== "not_found" && known.length === 0) continue; // covered/partial needs a real source
      claimed.set(c.item, { status: c.status, sourceIds: known });
    }
    emitChecklist();
  };

  let invalidMsg = "";
  while (!overBudget() && !required()) {
    if (invalidStreak >= 2) throw new AgentFailure("two consecutive invalid model outputs");
    let turn: AgentTurn;
    try {
      turn = await callJson({
        llm: deps.llm,
        model,
        system: AGENT_SYSTEM,
        user: (invalidMsg ? `NOTE: your previous output was rejected: ${invalidMsg}\n\n` : "") + render(),
        schema: AgentTurn,
        maxTokens: 700,
        timeoutMs: 30000,
        repair: false,
      });
      invalidStreak = 0;
      invalidMsg = "";
    } catch (e) {
      invalidStreak++;
      invalidMsg = (e as Error).message.slice(0, 200);
      actions++; // a wasted action
      continue;
    }
    applyCoverage(turn.coverage);
    if (turn.action === "finish") break;
    actions++;
    if (turn.action === "search") {
      if (queries.has(norm(turn.query))) {
        last = `Rejected: repeated search query "${turn.query}".`;
        continue;
      }
      last = await doSearch(turn.query, turn.targets, turn.reason);
    } else {
      const url = normalizeUrl(turn.url);
      if (!isHttps(url)) last = "Rejected: only https URLs can be read.";
      else if (readUrls.has(url)) last = `Rejected: already read ${url}.`;
      else if (reads >= budgets.maxPageReads) last = "Rejected: page-read budget used up.";
      else if (!seen.has(url) && !onProviderDomain(url)) last = `Rejected: ${url} did not appear in search results and is not on an official provider domain.`;
      else last = await doRead(url, turn.targets, turn.reason);
    }
    if (process.env.AGENT_DEBUG) console.error(`[agent] ${turn.action} -> ${last.replace(/\s+/g, " ").slice(0, 160)}`);
  }

  if (sources.length === 0) throw new AgentFailure("the agent read no usable pages");
  if (!sources.some((s) => s.publisher === "official")) warnings.push("The research agent found no official source; most claims will be unverified");
  if (!required()) warnings.push("Research agent stopped on budget before all required checklist items were resolved");

  const composio = await attachComposio(app, sources, texts, deps, warnings);
  return {
    sources,
    texts,
    checklist: coverageFromTexts(sources.map((x) => ({ id: x.id, publisher: x.publisher, text: texts.get(x.id) ?? "" })), composio),
    composio,
    method: "agent",
    agentSteps: steps.slice(0, 20),
    searches,
    pageReads: reads,
    warnings,
  };
}
