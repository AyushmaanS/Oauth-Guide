import { AttemptLog, type Claim, type Factors, type FactorKey, type GuideShape, type RequirementTag, type Step } from "@/lib/schema/guide";
import { applyOwners, deriveHandoff } from "@/lib/handoff";
import { resolveDifficulty } from "@/lib/rubric";

export interface MergeOptions {
  /** Factors the walkthrough observed directly (for example the provider asked for no review). They become "stated". */
  factorUpdates?: Partial<Record<FactorKey, string>>;
}

export interface MergeResult {
  guide: GuideShape;
}

const SECRETISH = /(secret|token|password|passwd|api[_-]?key|authorization|bearer)\s*[:=]\s*\S{8,}|\b(?=[A-Za-z0-9]*\d)(?=[A-Za-z0-9]*[a-z])(?=[A-Za-z0-9]*[A-Z])[A-Za-z0-9]{32,}\b/;
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
const uniq = <T>(a: T[]) => [...new Set(a)];

/**
 * Merge a redacted walkthrough log into a library guide (spec 6.9, deterministic).
 * Observed steps become `tested` (scoped to what the log says), unobserved steps stay documented, and
 * actors, the handoff table and the level are recomputed from the observed tags.
 */
export function mergeAttempt(draft: GuideShape, rawLog: AttemptLog, opts: MergeOptions = {}): MergeResult {
  const log = AttemptLog.parse(rawLog);
  for (const s of log.steps) {
    if (SECRETISH.test(s.observation) || SECRETISH.test(s.action)) throw new Error(`Attempt step ${s.id} looks like it contains a secret; redact the log before merging`);
  }
  for (const c of log.corrections) if (SECRETISH.test(c.observed) || SECRETISH.test(c.docClaim)) throw new Error("A correction looks like it contains a secret; redact the log before merging");

  const g: GuideShape = structuredClone(draft);
  g.attempt = log;
  const changelog = [...(g.changelog ?? [])];
  const addUnverified = (t: string) => { if (!g.tested.unverified.includes(t)) g.tested.unverified.push(t); };
  // The draft's "no account was used" line is no longer true once a walkthrough happened.
  if (log.steps.length) g.tested.unverified = g.tested.unverified.filter((t) => !t.startsWith("No account was used"));

  if (log.steps.length === 0) {
    g.attemptLevel = "L2";
    g.attemptLevelReason = `Signed-in walkthrough could not start: ${log.stoppedAt}.`;
    changelog.push(`${log.date}: signed-in walkthrough could not start (${log.stoppedAt}); level stays L2.`);
    g.changelog = changelog;
    return { guide: g };
  }

  g.attemptLevel = "L3";
  g.attemptLevelReason = `Signed-in walkthrough on ${log.date} (free account, separate browser profile) stopped at ${log.stoppedAt}${log.stoppedBecause.length ? `, because a human is needed for: ${log.stoppedBecause.join(", ")}` : ""}.`;
  changelog.push(`${log.date}: signed-in walkthrough merged (level L3).`);

  // ---- steps ----
  const byOrder = new Map<number, AttemptLog["steps"]>();
  for (const s of log.steps) if (s.guideStepOrder !== undefined) byOrder.set(s.guideStepOrder, [...(byOrder.get(s.guideStepOrder) ?? []), s]);
  const reached = new Set<number>();
  g.steps = g.steps.map((step): Step => {
    const group = byOrder.get(step.order);
    if (!group) return step;
    const usable = group.filter((a) => a.outcome !== "failed");
    if (!usable.length) {
      addUnverified(`Step ${step.order}: the walkthrough attempt failed ("${group[0].observation.slice(0, 100)}"), so the documented version stands.`);
      return step;
    }
    reached.add(step.order);
    const tags = uniq(usable.flatMap((a) => a.tags)) as RequirementTag[];
    const minutes = usable.reduce((n, a) => n + (a.minutes ?? 0), 0);
    const hasMinutes = usable.some((a) => a.minutes !== undefined);
    return {
      ...step,
      requires: tags.length ? tags : step.requires,
      observed: true,
      ...(hasMinutes ? { estimate: `${Math.round(minutes * 10) / 10} min (measured in one walkthrough)` } : {}),
      evidence: { label: "tested", sourceIds: step.evidence.sourceIds, testNote: `Observed in a signed-in walkthrough on ${log.date}: ${usable[0].observation}`, observationRef: usable[0].id },
    };
  });
  g.steps = applyOwners(g.steps);
  g.handoff = deriveHandoff(g.steps);

  const notReached = g.steps.filter((s) => !reached.has(s.order)).map((s) => s.order);
  if (notReached.length) {
    const range = notReached.length === 1 ? `Step ${notReached[0]}` : `Steps ${notReached.join(", ")}`;
    addUnverified(`${range} ${notReached.length === 1 ? "was" : "were"} not walked through (the walkthrough stopped at ${log.stoppedAt}); they stay as documented, not observed.`);
  }

  // ---- measured time to credentials ----
  const lastUsable = [...log.steps].reverse().find((a) => a.outcome !== "failed");
  if (log.minutesToCredentials !== undefined && lastUsable) {
    const h = log.minutesToCredentials / 60;
    g.verdict.timeToCredentials = {
      minHours: h,
      maxHours: h,
      basis: `Measured in one signed-in walkthrough on ${log.date}: ${log.minutesToCredentials} minutes of work until credentials were issued. One run only; yours may differ, and waiting for emails or approvals is not included.`,
      evidence: { label: "tested", sourceIds: [], testNote: `Timed during the signed-in walkthrough on ${log.date}.`, observationRef: lastUsable.id },
    };
    changelog.push(`${log.date}: time to credentials replaced with the measured ${log.minutesToCredentials} minutes.`);
  }

  // ---- corrections ----
  const ref = (log.steps.find((a) => a.outcome === "differs_from_docs") ?? log.steps[0]).id;
  const pools: Claim[][] = [g.requirements, g.scopesAndNuances];
  for (const c of log.corrections) {
    const text = `${c.observed} (Docs said: ${c.docClaim})`;
    const evidence = { label: "tested" as const, sourceIds: [], testNote: `Observed in a signed-in walkthrough on ${log.date}; this corrects the documentation.`, observationRef: ref };
    const dc = norm(c.docClaim);
    let matched = false;
    for (const pool of pools) {
      const hit = pool.find((x) => { const t = norm(x.text); return dc.length >= 15 && (t.includes(dc) || dc.includes(t)); });
      if (hit) { hit.text = text; hit.evidence = { ...evidence, sourceIds: hit.evidence.sourceIds }; matched = true; break; }
    }
    if (!matched) g.scopesAndNuances.push({ text, evidence });
    changelog.push(`${log.date}: corrected "${c.docClaim.slice(0, 80)}" to "${c.observed.slice(0, 80)}" after the walkthrough.`);
  }

  // ---- factor updates and difficulty ----
  if (opts.factorUpdates && Object.keys(opts.factorUpdates).length) {
    const updated = { ...g.verdict.factors, specialRequirements: [...g.verdict.factors.specialRequirements] } as Factors;
    const basis = { ...(g.verdict.factorBasis ?? {}) };
    for (const [k, v] of Object.entries(opts.factorUpdates)) {
      (updated as unknown as Record<string, string>)[k] = v as string;
      basis[k as FactorKey] = "stated";
    }
    const stated = { ...updated } as Factors;
    for (const k of Object.keys(basis) as FactorKey[]) if (basis[k] === "inferred") (stated as unknown as Record<string, string>)[k] = "unknown";
    const r = resolveDifficulty(stated, updated);
    g.verdict.factors = updated;
    g.verdict.factorBasis = basis;
    g.verdict.difficulty = r.difficulty;
    g.verdict.difficultyReason = `${r.reason} (Updated after the ${log.date} walkthrough.)`;
    g.verdict.difficultyConfidence = r.confidence;
    g.verdict.difficultyRange = r.range;
    if (g.verdict.inference) g.verdict.inference = g.verdict.inference.filter((i) => !(i.factor in opts.factorUpdates!));
    changelog.push(`${log.date}: difficulty recomputed from walkthrough-observed factors (${Object.keys(opts.factorUpdates).join(", ")}).`);
  }

  if (!log.cleanup.appsDeleted || !log.cleanup.secretsRemoved)
    addUnverified(`Cleanup was incomplete after the walkthrough: ${!log.cleanup.appsDeleted ? "a test app may still exist" : ""}${!log.cleanup.appsDeleted && !log.cleanup.secretsRemoved ? " and " : ""}${!log.cleanup.secretsRemoved ? "secrets may not have been removed" : ""}.`);

  g.changelog = changelog;
  return { guide: g };
}

/** Human-readable differences between a draft and its merged version, for the verification log. */
export function diffGuides(a: GuideShape, b: GuideShape): string[] {
  const out: string[] = [];
  const cmp = (label: string, x: unknown, y: unknown) => { if (JSON.stringify(x) !== JSON.stringify(y)) out.push(`${label}: ${typeof x === "string" ? x : JSON.stringify(x)} -> ${typeof y === "string" ? y : JSON.stringify(y)}`); };
  cmp("attemptLevel", a.attemptLevel, b.attemptLevel);
  cmp("attemptLevelReason", a.attemptLevelReason, b.attemptLevelReason);
  cmp("verdict.difficulty", a.verdict.difficulty, b.verdict.difficulty);
  cmp("verdict.timeToCredentials", { ...a.verdict.timeToCredentials, evidence: a.verdict.timeToCredentials.evidence.label }, { ...b.verdict.timeToCredentials, evidence: b.verdict.timeToCredentials.evidence.label });
  b.steps.forEach((s, i) => {
    const o = a.steps[i];
    if (!o) return;
    cmp(`Step ${s.order} tags`, o.requires, s.requires);
    cmp(`Step ${s.order} actor`, o.actor, s.actor);
    cmp(`Step ${s.order} estimate`, o.estimate, s.estimate);
    cmp(`Step ${s.order} evidence`, o.evidence.label, s.evidence.label);
  });
  const claims = (n: string, x: Claim[], y: Claim[]) => y.forEach((c, i) => { if (!x[i] || x[i].text !== c.text || x[i].evidence.label !== c.evidence.label) out.push(`${n}[${i}]: ${x[i] ? `"${x[i].text.slice(0, 60)}" (${x[i].evidence.label})` : "(new)"} -> "${c.text.slice(0, 80)}" (${c.evidence.label})`); });
  claims("requirements", a.requirements, b.requirements);
  claims("scopesAndNuances", a.scopesAndNuances, b.scopesAndNuances);
  const added = b.tested.unverified.filter((t) => !a.tested.unverified.includes(t));
  const removed = a.tested.unverified.filter((t) => !b.tested.unverified.includes(t));
  added.forEach((t) => out.push(`unverified (added): ${t}`));
  removed.forEach((t) => out.push(`unverified (removed): ${t}`));
  (b.changelog ?? []).filter((l) => !(a.changelog ?? []).includes(l)).forEach((l) => out.push(`changelog: ${l}`));
  return out;
}
