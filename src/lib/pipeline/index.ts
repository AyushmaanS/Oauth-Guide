import { Guide, type GuideShape, type Source } from "@/lib/schema/guide";
import { computeDifficulty } from "@/lib/rubric";
import { validateGuide } from "@/lib/validate";
import { extractFactors } from "./factors";
import { fixedGather } from "./gather/fixed";
import { classifyPublisher, isHttps, normalizeUrl } from "./gather/sources";
import { PIPELINE_VERSION } from "./prompts/common";
import { InputError, resolveApp, validateInput } from "./resolve";
import { selfCheck } from "./selfcheck";
import { assemble, synthesize } from "./synthesize";
import type { Ctx, Deps, Gathered, Models, PipelineMode, Resolved } from "./types";

export interface PipelineResult {
  guide: Guide | null;
  /** Present when validation failed; the unvalidated draft is never shown to users. */
  errors: string[];
  warnings: string[];
}

const DEFAULT_BUDGET_MS: Record<PipelineMode, number> = { fast: 120_000, deep: 20 * 60_000 };
const UNKNOWN_FACTORS = {
  registrationFriction: "unknown",
  reviewRequired: "unknown",
  reviewDepth: "unknown",
  docsQuality: "poor",
  waitBasis: "unknown",
  waitMagnitude: "unknown",
  businessEntityRequired: "unknown",
  specialRequirements: [],
} as const;

const unverifiedRange = (basis: string) => ({ basis, evidence: { label: "unverified" as const, sourceIds: [] as string[] } });

/** A short, honest guide when we cannot go further (no OAuth, or a stage failed). */
export function minimalGuide(app: Resolved, mode: PipelineMode, model: string, now: Date, why: string, sources: Source[], complete: boolean): GuideShape {
  const d = computeDifficulty({ ...UNKNOWN_FACTORS, specialRequirements: [] });
  return {
    schemaVersion: 1,
    slug: app.slug,
    appName: app.appName,
    providerSite: app.providerSite,
    mode: mode === "deep" ? "library" : "live",
    generatedAt: now.toISOString(),
    pipelineVersion: PIPELINE_VERSION,
    modelUsed: model,
    complete,
    attemptLevel: "L1",
    attemptLevelReason: "Only a quick identification search was done. Nothing was observed directly.",
    probe: [],
    verdict: {
      difficulty: d.difficulty,
      difficultyReason: d.reason,
      useCase: "Registering your own OAuth app for a product that connects your customers' accounts",
      timeToCredentials: unverifiedRange("No time estimate: sources were not analysed."),
      timeToProduction: unverifiedRange("No time estimate: sources were not analysed."),
      humanEffortHours: unverifiedRange("No effort estimate: sources were not analysed."),
      summary: why,
      biggestLaunchRisk: "Unknown. This guide has no verified information about approval.",
      factors: { ...UNKNOWN_FACTORS, specialRequirements: [] },
    },
    managedVsOwn: { composioManaged: "unknown", managedCovers: [], youNeedOwnWhen: [] },
    requirements: [],
    steps: [
      {
        order: 1,
        title: "Check the provider's developer documentation directly",
        estimate: "15 min",
        detail: "We could not build a full guide. Look for how third parties authenticate with this product on its official developer site.",
        requires: ["docs_reading"],
        actor: "agent",
        observed: false,
        evidence: { label: "unverified", sourceIds: [] },
      },
    ],
    scopesAndNuances: [],
    blockers: [],
    handoff: { agentCanDo: [], youMustDo: [], providerWait: [] },
    tested: { unverified: [why] },
    sources,
    research: { method: "fixed", actionsUsed: 1, pageReads: 0, seconds: 0, checklist: [] },
    nextAction: "Check the provider's official developer documentation, or try the guide again.",
    warnings: [],
  };
}

function hitSources(app: Resolved, now: Date): Source[] {
  const seen = new Set<string>();
  const out: Source[] = [];
  for (const h of app.hits) {
    const url = normalizeUrl(h.url);
    if (!isHttps(url) || seen.has(url)) continue;
    seen.add(url);
    out.push({ id: `s${out.length + 1}`, title: (h.title || url).slice(0, 160), url, publisher: classifyPublisher(url, app.providerDomains), retrievedAt: now.toISOString().slice(0, 10) });
  }
  return out;
}

export interface RunArgs {
  query: string;
  mode: PipelineMode;
  models: Models;
  deps: Deps;
  ctx?: Partial<Ctx>;
}

/** Orchestrator (spec 6.1). Stages never throw to the caller on soft failure: they degrade to a labelled, incomplete guide. */
export async function runPipeline(args: RunArgs): Promise<PipelineResult> {
  const { mode, deps, models } = args;
  const started = Date.now();
  const ctx: Ctx = { emit: args.ctx?.emit ?? (() => {}), deadline: args.ctx?.deadline ?? started + DEFAULT_BUDGET_MS[mode] };
  const softWarnings: string[] = [];
  const expired = () => Date.now() > ctx.deadline;
  const stage = async <T>(name: string, label: string, fn: () => Promise<T>): Promise<T> => {
    ctx.emit({ type: "stage_start", stage: name, label });
    const r = await fn();
    ctx.emit({ type: "stage_done", stage: name });
    return r;
  };
  const model = mode === "deep" ? models.deep : models.fast;
  const now = deps.now();

  const input = validateInput(args.query); // throws InputError: callers show it as a 400

  let app: Resolved;
  try {
    app = await stage("resolve", "Identifying the app and provider", () => resolveApp(input, deps, models.fast));
  } catch (e) {
    if (e instanceof InputError) throw e;
    return { guide: null, errors: [`Could not identify that app: ${(e as Error).message}`], warnings: softWarnings };
  }

  if (app.supportsOAuth === "no") {
    const why = `We found no evidence that ${app.appName} lets third-party developers register OAuth apps. ${app.note}`.slice(0, 300);
    const draft = minimalGuide(app, mode, model, now, why, hitSources(app, now), true);
    draft.warnings.push("Stopped after identification: the provider does not appear to offer developer OAuth. This is from search results only and is not confirmed.");
    return finish(draft);
  }

  let gathered: Gathered | null = null;
  try {
    gathered = await stage("gather", "Researching official docs and community reports", () => fixedGather(app, mode, deps, ctx));
  } catch (e) {
    softWarnings.push(`Research stage failed: ${(e as Error).message}`);
  }
  // The Composio directory alone is not enough to write a guide: we need pages from the provider side.
  if (!gathered || gathered.sources.filter((s) => s.id !== gathered!.composio.sourceId).length === 0) {
    const draft = minimalGuide(app, mode, model, now, `We could not read enough sources to write a guide for ${app.appName}.`, hitSources(app, now), false);
    draft.warnings.push(...softWarnings, ...(gathered?.warnings ?? []));
    return finish(draft);
  }

  let factors;
  try {
    if (expired()) throw new Error("deadline reached before factor extraction");
    factors = await stage("factors", "Extracting difficulty factors", () => extractFactors(app, gathered!, deps, model));
  } catch (e) {
    softWarnings.push(`Factor extraction failed (${(e as Error).message}); difficulty left unknown`);
    factors = { useCase: "Registering your own OAuth app for a product that connects your customers' accounts", factors: { ...UNKNOWN_FACTORS, specialRequirements: [] }, claims: [] };
  }

  let draft: GuideShape;
  try {
    if (expired()) throw new Error("deadline reached before synthesis");
    const synth = await stage("synthesize", "Drafting the guide", () => synthesize(app, factors, gathered!, deps, model));
    draft = assemble({ app, mode: mode === "deep" ? "library" : "live", model, f: factors, s: synth, g: gathered, seconds: (Date.now() - started) / 1000, now, extraWarnings: softWarnings });
  } catch (e) {
    const g = minimalGuide(app, mode, model, now, `The guide could not be fully written for ${app.appName}; sources are listed below.`, gathered.sources, false);
    g.warnings.push(...softWarnings, ...gathered.warnings, `Synthesis failed: ${(e as Error).message}`);
    g.research = { method: "fixed", actionsUsed: gathered.searches, pageReads: gathered.pageReads, seconds: Math.round((Date.now() - started) / 1000), checklist: gathered.checklist };
    return finish(g);
  }

  if (mode === "deep" || !expired()) {
    try {
      const r = await stage("selfcheck", "Challenging unsupported claims", () => selfCheck(draft, gathered!, deps, model));
      if (r.downgraded || r.weak) draft.warnings.push(`Self-check: ${r.downgraded} claim(s) downgraded, ${r.weak} flagged as weak`);
    } catch (e) {
      draft.warnings.push(`Self-check did not run: ${(e as Error).message}`);
    }
  } else draft.warnings.push("Self-check skipped: time budget used up");

  return finish(draft);

  function finish(d: GuideShape): PipelineResult {
    ctx.emit({ type: "stage_start", stage: "validate", label: "Validating and saving" });
    const r = validateGuide(d);
    ctx.emit({ type: "stage_done", stage: "validate" });
    if (r.guide) ctx.emit({ type: "complete", slug: r.guide.slug });
    return { guide: r.guide, errors: r.errors, warnings: r.warnings };
  }
}

export { InputError, validateInput };
