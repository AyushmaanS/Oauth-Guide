import {
  Guide,
  observationRefs,
  type Claim,
  type Evidence,
  type GuideShape,
} from "@/lib/schema/guide";
import { resolveDifficulty } from "@/lib/rubric";
import { applyOwners, deriveHandoff } from "@/lib/handoff";

export interface ValidateOptions {
  /** Max hops the flow trace may have (PROBE_TRACE_MAX_HOPS). */
  maxHops?: number;
  /** Hosts a trace may touch. Default: registrable-ish domains of providerSite and official sources. */
  allowedHosts?: string[];
}

export interface ValidateResult {
  guide: Guide | null;
  errors: string[];
  warnings: string[];
}

const REQUIRED_CHECKLIST = ["registration", "review_process", "scopes_restrictions", "timing_evidence", "requirements"];
const GATE_CLASSES = ["login_redirect", "captcha_or_bot", "forbidden"];

import { registrable } from "@/lib/probe/safefetch";
const lastTwoLabels = registrable;
const hostOf = (u: string) => {
  try {
    return new URL(u).hostname;
  } catch {
    return "";
  }
};

/**
 * Post-LLM guarantees (spec section 7). Takes a structurally valid draft, repairs or downgrades
 * what it can (recording warnings), and returns the fully validated guide, or null with errors.
 */
export function validateGuide(input: GuideShape, opts: ValidateOptions = {}): ValidateResult {
  const g: GuideShape = structuredClone(input);
  const warnings: string[] = [...g.warnings];
  const warn = (m: string) => {
    if (!warnings.includes(m)) warnings.push(m);
  };
  const sourceById = new Map(g.sources.map((s) => [s.id, s]));

  // 4. never keep long excerpts
  for (const s of g.sources) if (s.excerpt && s.excerpt.length > 200) s.excerpt = s.excerpt.slice(0, 197) + "...";

  // 5. drop claims that cite a missing source
  const keep = (list: Claim[], where: string) =>
    list.filter((c) => {
      const missing = c.evidence.sourceIds.filter((id) => !sourceById.has(id));
      if (missing.length) warn(`Removed a claim in ${where} that cited missing source(s): ${missing.join(", ")}`);
      return missing.length === 0;
    });
  g.requirements = keep(g.requirements, "requirements");
  g.scopesAndNuances = keep(g.scopesAndNuances, "scopesAndNuances");
  g.managedVsOwn.managedCovers = keep(g.managedVsOwn.managedCovers, "managedVsOwn.managedCovers");
  g.managedVsOwn.youNeedOwnWhen = keep(g.managedVsOwn.youNeedOwnWhen, "managedVsOwn.youNeedOwnWhen");

  // 3. attempt level can never exceed what was done (fixed before evidence refs are checked)
  if (g.mode === "live" && g.attemptLevel === "L3") {
    g.attemptLevel = "L2";
    warn("Attempt level lowered from L3 to L2: live guides are at most L2");
  }
  if (g.attemptLevel === "L3" && (!g.attempt || g.attempt.steps.length < 1 || !g.attempt.stoppedAt)) {
    g.attemptLevel = g.probe.length ? "L2" : "L1";
    warn("Attempt level lowered: L3 needs an attempt log");
  }
  if (g.attemptLevel === "L2" && g.probe.length < 1) {
    g.attemptLevel = "L1";
    warn("Attempt level lowered to L1: no probe results");
  }

  // 10. flow trace and provider metadata sanity
  const maxHops = opts.maxHops ?? 5;
  const allowed = new Set(
    (opts.allowedHosts ?? [g.providerSite, ...g.sources.filter((s) => s.publisher === "official").map((s) => hostOf(s.url))])
      .filter(Boolean)
      .map(lastTwoLabels),
  );
  if (g.flowTrace) {
    const t = g.flowTrace;
    const last = t.hops[t.hops.length - 1];
    let problem = "";
    if (t.hops.length === 0) problem = "no hops";
    else if (t.hops.length > maxHops) problem = "too many hops";
    else if (t.hops.some((h, i) => h.n !== i + 1)) problem = "hop numbers are not contiguous from 1";
    else if (t.hops.some((h) => !h.url.startsWith("https://") || !allowed.has(lastTwoLabels(hostOf(h.url)))))
      problem = "a hop is not https or not on an allow-listed host";
    else if (t.endedAt === "gate" && !GATE_CLASSES.includes(last.classification)) problem = "ended at a gate but the last hop is not one";
    else if (t.endedAt === "input_required" && last.classification !== "input_required") problem = "ended at input_required but the last hop is not";
    else if (t.endedAt === "js_shell_unclear" && last.classification !== "js_shell_unclear") problem = "ended at js_shell_unclear but the last hop is not";
    if (problem) {
      warn(`Flow trace removed because it failed validation: ${problem}`);
      delete g.flowTrace;
    } else {
      for (const h of t.hops)
        if (h.matchedStepOrder !== undefined && !g.steps.some((s) => s.order === h.matchedStepOrder)) delete h.matchedStepOrder;
    }
  }
  for (const s of g.steps) if (s.traceHop !== undefined && !g.flowTrace?.hops.some((h) => h.n === s.traceHop)) delete s.traceHop;
  if (g.providerMetadata?.dynamicRegistration === "supported" && !g.providerMetadata.registrationEndpoint) {
    g.providerMetadata.dynamicRegistration = g.providerMetadata.found ? "not_listed" : "unknown";
    warn("Provider metadata: dynamic registration downgraded because no registration endpoint was parsed");
  }

  // 3b. repair evidence everywhere: unknown ids, wrong publisher kind, unearned `tested`
  const refs = observationRefs(g);
  const fix = (e: Evidence, where: string) => {
    const bad = e.sourceIds.filter((id) => !sourceById.has(id));
    if (bad.length) {
      e.sourceIds = e.sourceIds.filter((id) => sourceById.has(id));
      warn(`${where}: dropped missing source id(s) ${bad.join(", ")}`);
    }
    const cited = e.sourceIds.map((id) => sourceById.get(id)!);
    const official = cited.some((s) => s.publisher === "official");
    const nonOfficial = cited.some((s) => s.publisher !== "official");
    const set = (label: Evidence["label"], why: string) => {
      warn(`${where}: evidence downgraded from ${e.label} to ${label} (${why})`);
      e.label = label;
    };
    if (e.label === "tested" && (!e.testNote || !e.observationRef || !refs.has(e.observationRef)))
      set("unverified", "no valid observation");
    if (e.label === "documented" && !official) set(nonOfficial ? "reported" : "unverified", "no official source");
    if (e.label === "reported" && !nonOfficial) set(official ? "documented" : "unverified", "no non-official source");
    if (e.label === "unverified") return;
  };
  const claimLists: [string, Claim[]][] = [
    ["requirements", g.requirements],
    ["scopesAndNuances", g.scopesAndNuances],
    ["managedCovers", g.managedVsOwn.managedCovers],
    ["youNeedOwnWhen", g.managedVsOwn.youNeedOwnWhen],
  ];
  for (const [name, list] of claimLists) list.forEach((c, i) => fix(c.evidence, `${name}[${i}]`));
  g.steps.forEach((s, i) => fix(s.evidence, `steps[${i}]`));
  g.blockers.forEach((b, i) => fix(b.evidence, `blockers[${i}]`));
  fix(g.verdict.timeToCredentials.evidence, "verdict.timeToCredentials");
  fix(g.verdict.timeToProduction.evidence, "verdict.timeToProduction");
  fix(g.verdict.humanEffortHours.evidence, "verdict.humanEffortHours");

  // 2. difficulty is always recomputed from factors
  // Stated facts = completed factors with inferred ones put back to "unknown".
  const completed = g.verdict.factors;
  const stated = { ...completed, specialRequirements: [...completed.specialRequirements] } as Record<string, unknown>;
  for (const [k, b] of Object.entries(g.verdict.factorBasis ?? {})) if (b === "inferred") stated[k] = "unknown";
  const d = resolveDifficulty(stated as unknown as typeof completed, completed);
  g.verdict.difficulty = d.difficulty;
  g.verdict.difficultyReason = d.reason;
  g.verdict.difficultyConfidence = d.confidence;
  g.verdict.difficultyRange = d.range;

  // Estimated ranges are always unverified; unsourced, unmarked ranges show no numbers.
  for (const r of [g.verdict.timeToCredentials, g.verdict.humanEffortHours, g.verdict.timeToProduction]) {
    if ("none" in r) continue;
    if (r.estimate) r.evidence = { label: "unverified", sourceIds: [] };
    else if (r.evidence.label === "unverified" && r.evidence.sourceIds.length === 0) {
      delete r.minDays; delete r.maxDays; delete r.minHours; delete r.maxHours;
    }
  }

  // 8. owners and the handoff table come from tags, never from the model
  g.steps = applyOwners(g.steps);
  const handoff = deriveHandoff(g.steps);
  g.handoff = handoff;

  // 7. research gaps are never hidden
  for (const c of g.research.checklist) {
    if (c.status === "covered") continue;
    const text = `Research gap (${c.status === "partial" ? "partial" : "not found"}): ${c.item}`;
    if (!g.tested.unverified.includes(text)) g.tested.unverified.push(text);
    if (c.status === "not_found" && REQUIRED_CHECKLIST.includes(c.item)) warn(`Required checklist item not found: ${c.item}`);
  }

  // 6. a guide with no steps or no next action is incomplete
  if (g.steps.length < 1 || !g.nextAction.trim()) {
    g.complete = false;
    warn("Guide is incomplete: missing steps or next action");
  }

  g.warnings = warnings;
  const parsed = Guide.safeParse(g);
  if (!parsed.success) {
    return { guide: null, errors: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`), warnings };
  }
  return { guide: parsed.data, errors: [], warnings };
}
