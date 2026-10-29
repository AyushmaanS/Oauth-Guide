import type { ChecklistId, Source } from "@/lib/schema/guide";
import type { PageLike } from "./types-local";
import { classifyPublisher, isHttps, normalizeUrl } from "./sources";
import { coverageFromTexts } from "./checklist";
import { COMPOSIO_URL, lookupComposio } from "../composio";
import type { Ctx, Deps, Gathered, Resolved, PipelineMode } from "../types";

export interface QuerySpec {
  q: string;
  target: ChecklistId;
}

/** Deterministic wide gather (spec 6.1 step 2). Deep: ~12 queries; fast fallback: one per required item. */
export function buildQueries(app: string, mode: PipelineMode): QuerySpec[] {
  const all: QuerySpec[] = [
    { target: "registration", q: `${app} register OAuth app create developer application` },
    { target: "review_process", q: `${app} OAuth app verification review approval process` },
    { target: "scopes_restrictions", q: `${app} OAuth scopes restricted sensitive scopes testing mode limits` },
    { target: "timing_evidence", q: `${app} OAuth app review how long approval takes` },
    { target: "requirements", q: `${app} OAuth app requirements privacy policy domain verification` },
    { target: "rate_limits", q: `${app} API rate limits OAuth apps` },
    { target: "community_reports", q: `${app} OAuth app review rejected stackoverflow reddit` },
    { target: "registration", q: `${app} OAuth client id client secret setup guide` },
    { target: "review_process", q: `${app} app review submission requirements demo video` },
    { target: "scopes_restrictions", q: `${app} OAuth unverified app warning user cap` },
    { target: "timing_evidence", q: `${app} app approval timeline weeks rejected delay` },
    { target: "community_reports", q: `${app} OAuth verification took weeks forum` },
    { target: "review_process", q: `${app} OAuth third-party security assessment required restricted scopes` },
  ];
  return mode === "deep" ? all : all.slice(0, 7).filter((x) => x.target !== "rate_limits");
}

/** Drop pages that are not about OAuth, and non-official pages that barely mention the app. */
export function isRelevant(text: string, appName: string, publisher: Source["publisher"]): boolean {
  if (!/oauth|authoriz|access token/i.test(text)) return false;
  if (publisher === "official") return true;
  const hits = text.toLowerCase().split(appName.toLowerCase()).length - 1;
  return hits >= 3;
}

/** Run the fixed gather: parallel searches, dedupe, extract pages, build sources with ids s1.. */
export async function fixedGather(app: Resolved, mode: PipelineMode, deps: Deps, ctx: Ctx): Promise<Gathered> {
  const warnings: string[] = [];
  const maxPages = mode === "deep" ? 15 : 6;
  const queries = buildQueries(app.appName, mode);

  const results = await Promise.all(
    queries.map(async (spec) => {
      try {
        return { spec, hits: await deps.search.search(spec.q, 5) };
      } catch (e) {
        warnings.push(`Search failed (${spec.target}): ${(e as Error).message}`);
        return { spec, hits: [] as Awaited<ReturnType<Deps["search"]["search"]>> };
      }
    }),
  );

  // Candidate URLs: docs entry URLs first, then hits; remember which checklist items each served.
  const cand = new Map<string, { url: string; title: string; targets: Set<ChecklistId>; rank: number; publisher: Source["publisher"] }>();
  const add = (url: string, title: string, target: ChecklistId | null, rank: number) => {
    if (!isHttps(url)) return;
    const key = normalizeUrl(url);
    const existing = cand.get(key);
    if (existing) {
      if (target) existing.targets.add(target);
      existing.rank = Math.min(existing.rank, rank);
      return;
    }
    cand.set(key, { url: key, title, targets: new Set(target ? [target] : []), rank, publisher: classifyPublisher(url, app.providerDomains) });
  };
  app.docsUrls.forEach((u) => add(u, u, null, 0));
  results.forEach(({ spec, hits }) => hits.forEach((h, i) => add(h.url, h.title, spec.target, i + 1)));

  // Prefer official, then those serving several checklist items, then search rank. Keep room for community reports.
  const order = [...cand.values()].sort(
    (a, b) =>
      Number(b.publisher === "official") - Number(a.publisher === "official") ||
      b.targets.size - a.targets.size ||
      a.rank - b.rank,
  );
  const community = order.filter((c) => c.publisher !== "official" && c.targets.has("community_reports")).slice(0, 3);
  const picked = [...new Map([...order.filter((c) => c.publisher === "official").slice(0, maxPages - community.length), ...community, ...order].map((c) => [c.url, c])).values()].slice(0, maxPages);

  const pages = new Map<string, PageLike>();
  for (let i = 0; i < picked.length; i += 5) {
    if (Date.now() > ctx.deadline) {
      warnings.push("Deadline reached while reading pages; some sources were not read");
      break;
    }
    const batch = picked.slice(i, i + 5).map((c) => c.url);
    try {
      for (const p of await deps.search.extract(batch)) pages.set(normalizeUrl(p.url), { text: p.text, title: p.title });
    } catch (e) {
      warnings.push(`Page read failed for ${batch.length} page(s): ${(e as Error).message}`);
    }
  }

  const sources: Source[] = [];
  const texts = new Map<string, string>();
  for (const c of picked) {
    const page = pages.get(c.url);
    if (!page || page.text.trim().length < 80) {
      warnings.push(`Could not read ${c.url}; not used as a source`);
      continue;
    }
    if (!isRelevant(page.text, app.appName, c.publisher)) {
      warnings.push(`Skipped off-topic page: ${c.url}`);
      continue;
    }
    const id = `s${sources.length + 1}`;
    sources.push({ id, title: (page.title || c.title || c.url).slice(0, 160), url: c.url, publisher: c.publisher, retrievedAt: deps.now().toISOString().slice(0, 10) });
    texts.set(id, page.text);
    ctx.emit({ type: "source_found", title: sources[sources.length - 1].title, url: c.url });
  }

  // Composio status is computed by code from the public directory, never by the model.
  const composio: Gathered["composio"] = { value: "unknown" };
  const dir = await deps.composio();
  if (dir) {
    const v = lookupComposio(dir, app.appName);
    if (v !== "unknown") {
      const id = `s${sources.length + 1}`;
      const text = `Composio's managed-auth directory lists "${app.appName}" under ${v === "yes" ? "Composio-managed OAuth available" : "Bring your own OAuth app"}.`;
      sources.push({ id, title: "Composio: Managed OAuth apps (directory)", url: COMPOSIO_URL, publisher: "official", retrievedAt: deps.now().toISOString().slice(0, 10) });
      texts.set(id, text);
      composio.value = v;
      composio.sourceId = id;
    }
  } else warnings.push("Composio directory could not be read; managed-OAuth status left unknown");

  return {
    sources,
    texts,
    checklist: coverageFromTexts(sources.map((x) => ({ id: x.id, publisher: x.publisher, text: texts.get(x.id) ?? "" })), composio),
    composio,
    searches: queries.length,
    pageReads: pages.size,
    warnings,
  };
}
