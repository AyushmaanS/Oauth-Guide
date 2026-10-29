import { callJson } from "@/lib/llm";
import type { Evidence, GuideShape } from "@/lib/schema/guide";
import { SELFCHECK_SYSTEM, SelfCheckOut } from "./prompts/selfcheck";
import { wrapUntrusted } from "./gather/sources";
import type { Deps, Gathered } from "./types";

interface Item {
  id: string;
  text: string;
  evidence: Evidence;
}

/** Enumerate checkable claims. Returned evidence objects are the live references inside the guide. */
export function enumerateClaims(guide: GuideShape, max = 70): Item[] {
  const items: Omit<Item, "id">[] = [];
  for (const c of [...guide.requirements, ...guide.scopesAndNuances, ...guide.managedVsOwn.managedCovers, ...guide.managedVsOwn.youNeedOwnWhen])
    items.push({ text: c.text, evidence: c.evidence });
  for (const s of guide.steps) items.push({ text: `${s.title}. ${s.detail}`, evidence: s.evidence });
  for (const b of guide.blockers) items.push({ text: `${b.problem} -> ${b.fix}`, evidence: b.evidence });
  items.push({ text: guide.verdict.timeToCredentials.basis, evidence: guide.verdict.timeToCredentials.evidence });
  if (!("none" in guide.verdict.timeToProduction)) items.push({ text: guide.verdict.timeToProduction.basis, evidence: guide.verdict.timeToProduction.evidence });
  items.push({ text: guide.verdict.humanEffortHours.basis, evidence: guide.verdict.humanEffortHours.evidence });
  return items.slice(0, max).map((x, i) => ({ id: `c${i + 1}`, ...x }));
}

/**
 * Skeptical reviewer pass. The model only returns verdicts; code applies them:
 * unsupported -> label becomes unverified; weak -> listed as an open uncertainty. Never rewrites text.
 */
export async function selfCheck(guide: GuideShape, g: Gathered, deps: Deps, model: string, opts: { maxClaims?: number; perSourceChars?: number } = {}): Promise<{ downgraded: number; weak: number }> {
  // Tested evidence is an observation, not a claim about source text: never sent to the reviewer.
  const items = enumerateClaims(guide, opts.maxClaims ?? 70).filter((i) => i.evidence.label !== "tested" && (i.evidence.label !== "unverified" || i.evidence.sourceIds.length > 0));
  if (!items.length) return { downgraded: 0, weak: 0 };
  const cited = new Set(items.flatMap((i) => i.evidence.sourceIds));
  const sourceText = g.sources
    .filter((s) => cited.has(s.id))
    .map((s) => wrapUntrusted(s.id, s.url, (g.texts.get(s.id) ?? "").slice(0, opts.perSourceChars ?? 3500)))
    .join("\n\n");
  const claimText = items.map((i) => `${i.id} [label=${i.evidence.label}; cites=${i.evidence.sourceIds.join(",") || "none"}]: ${i.text}`).join("\n");
  const out = await callJson({
    llm: deps.llm,
    model,
    system: SELFCHECK_SYSTEM,
    user: `CLAIMS\n${claimText}\n\nSOURCE TEXTS\n${sourceText}`,
    schema: SelfCheckOut,
    maxTokens: 4000,
    timeoutMs: 120000,
  });
  const byId = new Map(items.map((i) => [i.id, i]));
  let downgraded = 0;
  let weak = 0;
  for (const r of out.results) {
    const item = byId.get(r.id);
    if (!item) continue;
    if (r.verdict === "unsupported" && item.evidence.label !== "unverified") {
      item.evidence.label = "unverified";
      guide.warnings.push(`Self-check downgraded a claim to unverified: "${item.text.slice(0, 90)}" (${r.note})`);
      downgraded++;
    } else if (r.verdict === "weak") {
      guide.tested.unverified.push(`Weakly supported (self-check): ${item.text.slice(0, 140)}`);
      weak++;
    }
  }
  return { downgraded, weak };
}
