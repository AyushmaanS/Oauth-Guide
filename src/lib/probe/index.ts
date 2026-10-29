import type { FlowTrace, Guide, ProbeResult, ProviderMetadata, Source } from "@/lib/schema/guide";
import type { LlmClient } from "@/lib/llm";
import { callJson } from "@/lib/llm";
import { classify } from "./classify";
import { checkMetadata, metadataLocations } from "./metadata";
import { hostAllowed, registrable, safeGet, type RobotsRules, type SafeResult } from "./safefetch";
import { ChooserOut, traceFlow, matchHopsToSteps, type Chooser, type Fetcher } from "./trace";
import { wrapUntrusted } from "@/lib/pipeline/gather/sources";
import { UNTRUSTED_RULE } from "@/lib/pipeline/prompts/common";

/** Bound fetcher factory used by the pipeline: shares one robots cache per run. */
export type ProbeGet = (url: string, allowHosts: string[]) => Promise<SafeResult>;
export function realProbeGet(): ProbeGet {
  const robotsCache = new Map<string, RobotsRules | null>();
  return (url, allowHosts) => safeGet(url, { allowHosts, robotsCache });
}

const lastTwo = registrable;
const hostOf = (u: string) => {
  try {
    return new URL(u).hostname;
  } catch {
    return "";
  }
};

/** Hosts a probe may touch: the provider's own domains and the registrable domains of its OFFICIAL sources. Never Composio. */
export function allowHostsFor(providerDomains: string[], sources: Pick<Source, "url" | "publisher">[]): string[] {
  // providerDomains may be subdomains (developers.google.com); the allow-list is the registrable domain (google.com).
  const set = new Set(providerDomains.map((d) => registrable(d)));
  for (const s of sources) {
    const h = hostOf(s.url);
    if (s.publisher === "official" && h && !/(^|\.)composio\.dev$/.test(h)) set.add(lastTwo(h));
  }
  return [...set];
}

export const toProbeResult = (url: string, r: SafeResult, now: Date): ProbeResult => {
  if (r.blocked) {
    const classification = r.blocked.reason === "robots" ? "skipped_robots" : r.blocked.reason === "policy" ? "blocked_by_policy" : "error";
    return { url, checkedAt: now.toISOString(), classification, signals: [`blocked:${r.blocked.detail.slice(0, 60)}`] };
  }
  const c = classify({ status: r.status ?? 0, finalUrl: r.finalUrl, location: r.location, headers: r.headers, body: r.body });
  return { url, checkedAt: now.toISOString(), ...(r.status ? { httpStatus: r.status } : {}), finalHost: r.finalHost, classification: c.classification, signals: c.signals.slice(0, 8) };
};

export const CHOOSER_SYSTEM = `You help follow the public path of a provider's developer documentation toward the page where a developer creates an OAuth app. You are given a numbered list of links (text and path). Choose the ONE link most likely to continue the setup (create or register an app, get started, developer console, credentials), or null if none does.
${UNTRUSTED_RULE}
Return ONE JSON object only: {"choice": <index number or null>, "reason": "short"}. You cannot supply a URL; only an index from the list.`;

/** At most 4 calls per run; returns an index or null. Link text is untrusted data. */
export function makeChooser(llm: LlmClient, model: string, maxCalls = 4): Chooser {
  let calls = 0;
  return async (links) => {
    if (calls++ >= maxCalls) return null;
    const list = links.map((l) => `${l.index}. ${l.text || "(no text)"} | ${l.path}`).join("\n");
    const out = await callJson({ llm, model, system: CHOOSER_SYSTEM, user: `Links (untrusted data):\n${wrapUntrusted("links", "list", list)}`, schema: ChooserOut, maxTokens: 150, timeoutMs: 15000, repair: false });
    return out.choice;
  };
}

export interface ProbeArgs {
  steps: Pick<Guide["steps"][number], "order" | "url">[];
  docsUrls: string[];
  providerSite: string;
  providerDomains: string[];
  sources: Source[];
  get: ProbeGet;
  chooser?: Chooser;
  now: () => Date;
  emit?: (e: { type: "probe_result"; url: string; classification: string } | { type: "trace_hop"; n: number; url: string; classification: string }) => void;
  maxUrls?: number;
  traceEnabled?: boolean;
}

export interface Observations {
  allowHosts: string[];
  probe: ProbeResult[];
  flowTrace?: FlowTrace;
  providerMetadata?: ProviderMetadata;
  stepHops: Map<number, number>;
  warnings: string[];
}

async function pool<T, R>(items: T[], n: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { for (let k = i++; k < items.length; k = i++) out[k] = await fn(items[k]); }));
  return out;
}

/** Gate probe + public flow trace + provider metadata (spec 6.7). Read-only; never throws. */
export async function runProbes(a: ProbeArgs): Promise<Observations> {
  const warnings: string[] = [];
  const allowHosts = allowHostsFor(a.providerDomains, a.sources);
  const maxUrls = a.maxUrls ?? (Number(process.env.PROBE_MAX_URLS) || 8);
  const cache = new Map<string, SafeResult>();
  const get: Fetcher = async (u) => {
    const hit = cache.get(u);
    if (hit) return hit;
    const r = await a.get(u, allowHosts).catch((e): SafeResult => ({ ok: false, blocked: { reason: "error", detail: String((e as Error).message).slice(0, 60) }, finalUrl: u, finalHost: hostOf(u), headers: {}, body: "", truncated: false, redirects: 0 }));
    cache.set(u, r);
    return r;
  };

  // (i) step URLs
  const stepUrls = [...new Set(a.steps.map((s) => s.url).filter((u): u is string => !!u && u.startsWith("https://") && hostAllowed(hostOf(u), allowHosts)))].slice(0, maxUrls);
  const results = new Map<string, ProbeResult>();
  await pool(stepUrls, 5, async (u) => {
    const pr = toProbeResult(u, await get(u), a.now());
    results.set(u, pr);
    a.emit?.({ type: "probe_result", url: u, classification: pr.classification });
  });

  // (ii) public flow trace from the first public step URL, else the docs entry, else an official source page
  let flowTrace: FlowTrace | undefined;
  const firstPublic = stepUrls.find((u) => results.get(u)?.classification === "public");
  const start = firstPublic ?? a.docsUrls.find((u) => u.startsWith("https://") && hostAllowed(hostOf(u), allowHosts)) ?? a.sources.find((s) => s.publisher === "official" && hostAllowed(hostOf(s.url), allowHosts) && !/composio\.dev$/.test(hostOf(s.url)))?.url;
  const stepHops = new Map<number, number>();
  if (a.traceEnabled !== false && start) {
    try {
      const t = await traceFlow({ startUrl: start, allowHosts, fetch: get, chooser: a.chooser, now: a.now, onHop: (h) => a.emit?.({ type: "trace_hop", n: h.n, url: h.url, classification: h.classification }) });
      const m = matchHopsToSteps(t, a.steps);
      flowTrace = m.trace;
      m.stepHops.forEach((v, k) => stepHops.set(k, v));
      const byFinal = new Map([...cache.values()].map((r) => [r.finalUrl.split("#")[0], r]));
      for (const h of t.hops) if (!results.has(h.url) && !["blocked_by_policy", "skipped_robots", "error"].includes(h.classification)) {
        const r = cache.get(h.url) ?? byFinal.get(h.url);
        if (r) results.set(h.url, toProbeResult(h.url, r, a.now()));
      }
    } catch (e) {
      warnings.push(`Flow trace failed: ${(e as Error).message}`);
    }
  } else if (!start) warnings.push("No starting page for a flow trace was available");

  // (iii) provider metadata on the provider's auth-related hosts
  let providerMetadata: ProviderMetadata | undefined;
  try {
    const discovered = new Set<string>();
    for (const r of cache.values()) for (const h of [r.finalHost, r.location ? hostOf(r.location) : ""]) if (h && /^(accounts|auth|login|id|sso)\./.test(h) && hostAllowed(h, allowHosts)) discovered.add(h);
    providerMetadata = await checkMetadata(metadataLocations(a.providerSite, a.providerDomains, [...discovered]), get, a.now);
  } catch (e) {
    warnings.push(`Provider metadata check failed: ${(e as Error).message}`);
  }

  return { allowHosts, probe: [...results.values()], flowTrace, providerMetadata, stepHops, warnings };
}
