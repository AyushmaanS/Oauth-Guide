import { z } from "zod";
import type { Classification, FlowTrace, Step } from "@/lib/schema/guide";
import { classify } from "./classify";
import { extractLinks, extractTitle, type RawLink } from "./html";
import { hostAllowed, type SafeResult } from "./safefetch";

export type Fetcher = (url: string) => Promise<SafeResult>;
/** Returns an index into the numbered list, or null. It can never supply a URL. */
export type Chooser = (links: { index: number; text: string; path: string }[]) => Promise<number | null>;

export interface TraceOptions {
  startUrl: string;
  allowHosts: string[];
  fetch: Fetcher;
  chooser?: Chooser;
  maxHops?: number;
  maxSeconds?: number;
  now?: () => Date;
  onHop?: (hop: FlowTrace["hops"][number]) => void;
}

export const ChooserOut = z.object({ choice: z.number().int().nullable(), reason: z.string().max(200).optional() });

const GATES: Classification[] = ["login_redirect", "captcha_or_bot", "forbidden"];
export const isGate = (c: Classification) => GATES.includes(c);

// ---- rule-based link choice ---------------------------------------------------------------------
// Links that lead toward the app-creation console or its sign-in wall outrank more documentation,
// because the point of the trace is to reach the first gate, not to read every docs page.
const POSITIVE: [RegExp, number][] = [
  [/\b(create|register|new|add)\b.{0,20}\b(app|application|integration|client|connection|bot)\b/i, 6],
  [/\b(developer |cloud |api )?(console|dashboard|portal)\b/i, 5],
  [/\b(my apps|your apps|manage apps|app settings|developer settings)\b/i, 5],
  [/\bsign ?in\b|\blog ?in\b|\bsign up\b/i, 5],
  [/\b(get started|getting started|build an app|build your app|start building)\b/i, 3],
  [/\bcredentials?\b/i, 3],
  [/\boauth\b|\bauthenticat|\bauthoriz/i, 1],
  [/\b(my )?apps?\b|\bintegrations?\b/i, 1],
];
const NEGATIVE = /\b(pricing|blog|careers?|jobs|contact|support|status|forum|community|changelog|release notes|press|about us|cookie|privacy|terms|legal|language|english|español|français|deutsch|日本語|theme|dark mode|twitter|facebook|linkedin|youtube|github|instagram|discord|slack community)\b/i;
const NOISE_HOST = /(twitter|x|facebook|linkedin|youtube|instagram|discord|medium|reddit)\.com$/i;
export const MIN_RULE_SCORE = 3;
/** Sign-in-ish links are only worth following to confirm a gate; documentation-ish links are not. */

export function scoreLink(l: RawLink): number {
  let path = "";
  try {
    path = new URL(l.url).pathname;
  } catch {
    return -1;
  }
  const hay = `${l.text} ${path.replace(/[/_-]+/g, " ")}`;
  if (NEGATIVE.test(l.text) || /\/(blog|careers|pricing|legal|privacy|terms|status|changelog)(\/|$)/i.test(path)) return -1;
  let score = 0;
  for (const [re, w] of POSITIVE) if (re.test(hay)) score += w;
  return score;
}

/** Candidates: allow-listed https hosts, unvisited, not noise; capped at 40. */
export function candidates(links: RawLink[], allow: string[], visited: Set<string>, from: string): RawLink[] {
  const seen = new Set<string>();
  const out: RawLink[] = [];
  for (const l of links) {
    let u: URL;
    try {
      u = new URL(l.url);
    } catch {
      continue;
    }
    const key = u.origin + u.pathname.replace(/\/$/, "") + u.search;
    if (u.protocol !== "https:" || !hostAllowed(u.hostname, allow) || NOISE_HOST.test(u.hostname) || visited.has(key) || seen.has(key) || key === from) continue;
    if (!l.text && u.pathname === "/") continue;
    seen.add(key);
    out.push(l);
    if (out.length >= 40) break;
  }
  return out;
}

const keyOf = (u: string) => {
  const x = new URL(u);
  return x.origin + x.pathname.replace(/\/$/, "") + x.search;
};

/** Follow the public path hop by hop: GET only, never type, never submit, never leave the allow-list. */
export async function traceFlow(o: TraceOptions): Promise<FlowTrace> {
  const maxHops = o.maxHops ?? (Number(process.env.PROBE_TRACE_MAX_HOPS) || 5);
  const maxMs = (o.maxSeconds ?? (Number(process.env.PROBE_TRACE_MAX_SECONDS) || 25)) * 1000;
  const now = o.now ?? (() => new Date());
  const t0 = Date.now();
  const hops: FlowTrace["hops"] = [];
  const visited = new Set<string>();
  let url = o.startUrl;
  let via: string | undefined;
  let chosenBy: "start" | "rule" | "model" = "start";
  let endedAt: FlowTrace["endedAt"] = "depth_limit";
  let endedReason = "";

  for (let n = 1; n <= maxHops; n++) {
    const r = await o.fetch(url);
    visited.add(keyOf(r.finalUrl || url));
    visited.add(keyOf(url));
    let classification: Classification;
    let title: string | undefined;
    if (r.blocked) classification = r.blocked.reason === "robots" ? "skipped_robots" : r.blocked.reason === "policy" ? "blocked_by_policy" : "error";
    else {
      const c = classify({ status: r.status ?? 0, finalUrl: r.finalUrl, location: r.location, headers: r.headers, body: r.body });
      classification = c.classification;
      title = extractTitle(r.body);
    }
    const hop: FlowTrace["hops"][number] = { n, url: (r.finalUrl || url).split("#")[0], classification, chosenBy, ...(title ? { title } : {}), ...(via ? { viaLinkText: via } : {}) };
    // A hop must be on the allow-list to be recorded as a trace hop (policy blocks are recorded with the requested URL).
    hops.push(hop);
    o.onHop?.(hop);

    if (isGate(classification)) { endedAt = "gate"; endedReason = gateReason(classification, hop.url); break; }
    if (classification === "input_required") { endedAt = "input_required"; endedReason = "This page is a form that needs typed input. We never type or submit, so the public path ends here."; break; }
    if (classification === "js_shell_unclear") { endedAt = "js_shell_unclear"; endedReason = "This page builds itself with JavaScript, so we could not read where it leads. We did not guess."; break; }
    if (classification === "skipped_robots") { endedAt = "policy"; endedReason = "The site's robots.txt asks automated tools not to fetch this page, so we did not."; break; }
    if (classification === "blocked_by_policy") { endedAt = "policy"; endedReason = r.blocked ? `Not fetched: ${r.blocked.detail}.` : "The page redirected outside the provider's own sites, which we do not follow."; break; }
    if (classification === "error") { endedAt = "error"; endedReason = "The request failed or timed out."; break; }
    if (classification === "not_found") { endedAt = "dead_end"; endedReason = "The next page was not found."; break; }
    if (n === maxHops) { endedAt = "depth_limit"; endedReason = `Stopped after ${maxHops} pages (hop limit).`; break; }
    if (Date.now() - t0 > maxMs) { endedAt = "depth_limit"; endedReason = "Stopped: time limit for the trace was reached."; break; }

    // public page: choose the next link
    const cands = candidates(extractLinks(r.body, r.finalUrl), o.allowHosts, visited, keyOf(r.finalUrl));
    const scored = cands.map((l) => ({ l, s: scoreLink(l) })).sort((a, b) => b.s - a.s);
    let next: RawLink | undefined;
    if (scored[0] && scored[0].s >= MIN_RULE_SCORE) { next = scored[0].l; chosenBy = "rule"; }
    else if (o.chooser && cands.length) {
      const list = cands.map((l, index) => ({ index, text: l.text.slice(0, 80), path: pathOf(l.url) }));
      const pick = await o.chooser(list).catch(() => null);
      // The model returns an index only; anything out of range is ignored.
      if (typeof pick === "number" && Number.isInteger(pick) && pick >= 0 && pick < cands.length) { next = cands[pick]; chosenBy = "model"; }
    }
    if (!next) { endedAt = "dead_end"; endedReason = "No link on this page clearly continues the setup."; break; }
    url = next.url;
    via = next.text || pathOf(next.url);
  }
  return { startUrl: o.startUrl, checkedAt: now().toISOString(), hops, endedAt, endedReason };
}

const pathOf = (u: string) => {
  try {
    return new URL(u).pathname.slice(0, 80);
  } catch {
    return "";
  }
};
const gateReason = (c: Classification, url: string) =>
  c === "login_redirect" ? `Sign-in is required here (${pathOf(url) || url}). Everything beyond this point needs an account, so it was not observed.`
  : c === "captcha_or_bot" ? "A bot check (CAPTCHA or challenge) blocks automated access here. That needs a human."
  : "The provider refused the request (forbidden). Everything beyond this point was not observed.";

/** Map hops to steps by URL equality or shared path prefix (>= 2 segments). Returns new trace and step annotations. */
export function matchHopsToSteps(trace: FlowTrace, steps: Pick<Step, "order" | "url">[]): { trace: FlowTrace; stepHops: Map<number, number> } {
  const stepHops = new Map<number, number>();
  const segs = (u: string) => { try { return new URL(u).pathname.split("/").filter(Boolean); } catch { return []; } };
  const hopsOut = trace.hops.map((h) => {
    const hs = segs(h.url);
    let best: { order: number; score: number } | undefined;
    for (const s of steps) {
      if (!s.url) continue;
      let u: URL, hu: URL;
      try { u = new URL(s.url); hu = new URL(h.url); } catch { continue; }
      if (u.hostname !== hu.hostname) continue;
      const ss = segs(s.url);
      let common = 0;
      while (common < Math.min(ss.length, hs.length) && ss[common] === hs[common]) common++;
      const exact = ss.join("/") === hs.join("/");
      const score = exact ? 100 : common >= 2 ? common : 0;
      if (score > 0 && (!best || score > best.score)) best = { order: s.order, score };
    }
    if (best) { if (!stepHops.has(best.order)) stepHops.set(best.order, h.n); return { ...h, matchedStepOrder: best.order }; }
    return h;
  });
  return { trace: { ...trace, hops: hopsOut }, stepHops };
}
