import { z } from "zod";
import { callJson } from "@/lib/llm";
import type { Evidence, GuideShape, Range } from "@/lib/schema/guide";
import { applyOwners, deriveHandoff } from "@/lib/handoff";
import { computeDifficulty } from "@/lib/rubric";
import { SYNTH_SYSTEM, SynthOut } from "./prompts/synthesize";
import { PIPELINE_VERSION, sourceBundle } from "./prompts/common";
import { normalizeUrl } from "./gather/sources";
import type { FactorsOut } from "./prompts/factors";
import type { Deps, Gathered, Resolved } from "./types";

export async function synthesize(app: Resolved, f: FactorsOut, g: Gathered, deps: Deps, model: string): Promise<SynthOut> {
  const known = new Set(g.sources.map((s) => s.id));
  const out = await callJson({
    llm: deps.llm,
    model,
    system: SYNTH_SYSTEM,
    user: [
      `App: ${app.appName} (provider site ${app.providerSite}). Use case for this guide: ${f.useCase}`,
      `FACTORS (already decided, for context): ${JSON.stringify(f.factors)}`,
      `CANDIDATE CLAIMS from the factor stage: ${JSON.stringify(f.claims)}`,
      `Composio managed OAuth status (computed by code): ${g.composio.value}${g.composio.sourceId ? ` (source ${g.composio.sourceId})` : ""}`,
      `Output JSON schema:\n${JSON.stringify(z.toJSONSchema(SynthOut))}`,
      sourceBundle(g.sources, g.texts),
    ].join("\n\n"),
    schema: SynthOut,
    maxTokens: 8000,
    timeoutMs: 180000,
  });
  void known;
  return out;
}

const ev = (e: { label: Evidence["label"]; sourceIds: string[] }): Evidence => ({ label: e.label, sourceIds: e.sourceIds });
/** A range with no supporting source shows no numbers: an unsourced figure is a guess, so it is stripped (code rule). */
export const range = (r: z.infer<typeof SynthOut>["humanEffortHours"]): Range => {
  const evidence = ev(r.evidence);
  if (evidence.label === "unverified" && evidence.sourceIds.length === 0) return { basis: r.basis, evidence };
  return { ...r, evidence };
};

export interface AssembleArgs {
  app: Resolved;
  mode: "library" | "live";
  model: string;
  f: FactorsOut;
  s: SynthOut;
  g: Gathered;
  seconds: number;
  now: Date;
  extraWarnings: string[];
}

/** Compose a Guide draft from stage outputs. Code, not the model, sets everything not in the synth schema. */
export function assemble(a: AssembleArgs): GuideShape {
  const { app, f, s, g } = a;
  const sourceUrls = new Set(g.sources.map((x) => normalizeUrl(x.url)));
  const extra = [...a.extraWarnings];
  const steps = s.steps.map((st, i) => {
    let url = st.url;
    if (url && !sourceUrls.has(normalizeUrl(url))) {
      extra.push(`Dropped a step link that was not one of the fetched sources (step ${i + 1})`);
      url = undefined;
    }
    return {
      order: i + 1,
      title: st.title,
      estimate: st.estimate,
      detail: st.detail,
      ...(url ? { url } : {}),
      requires: st.requires,
      actor: "agent" as const,
      ...(st.agentPrep ? { agentPrep: st.agentPrep } : {}),
      observed: false,
      evidence: ev(st.evidence),
    };
  });
  const d = computeDifficulty(f.factors);
  const claims = (list: z.infer<typeof SynthOut>["requirements"]) => list.map((c) => ({ text: c.text, evidence: ev(c.evidence) }));
  const owned = applyOwners(steps);
  return {
    schemaVersion: 1,
    slug: app.slug,
    appName: app.appName,
    providerSite: app.providerSite,
    mode: a.mode,
    generatedAt: a.now.toISOString(),
    pipelineVersion: PIPELINE_VERSION,
    modelUsed: a.model,
    complete: true,
    attemptLevel: "L1",
    attemptLevelReason: "Documentation read and synthesized. Nothing was observed directly yet (no probe, trace or walkthrough).",
    probe: [],
    verdict: {
      difficulty: d.difficulty,
      difficultyReason: d.reason,
      useCase: f.useCase,
      timeToCredentials: range(s.timeToCredentials),
      timeToProduction: "none" in s.timeToProduction ? { none: true as const, evidence: ev(s.timeToProduction.evidence) } : range(s.timeToProduction),
      humanEffortHours: range(s.humanEffortHours),
      summary: s.summary,
      biggestLaunchRisk: s.biggestLaunchRisk,
      factors: f.factors,
    },
    managedVsOwn: {
      composioManaged: g.composio.value,
      managedCovers: claims(s.managedCovers),
      youNeedOwnWhen: claims(s.youNeedOwnWhen),
      ...(g.composio.sourceId ? { source: g.sources.find((x) => x.id === g.composio.sourceId)?.url } : {}),
    },
    requirements: claims(s.requirements),
    steps: owned,
    scopesAndNuances: claims(s.scopesAndNuances),
    blockers: s.blockers.map((b) => ({ problem: b.problem, fix: b.fix, ...(b.contact ? { contact: b.contact } : {}), evidence: ev(b.evidence) })),
    handoff: deriveHandoff(owned),
    tested: { unverified: [...s.unverified] },
    sources: g.sources,
    research: {
      method: "fixed",
      actionsUsed: g.searches,
      pageReads: g.pageReads,
      seconds: Math.round(a.seconds),
      checklist: g.checklist,
    },
    nextAction: s.nextAction,
    warnings: [...g.warnings, ...extra],
  };
}
