import { z } from "zod";

/** Single source of truth for the guide contract (spec section 5). */

export const EvidenceLabel = z.enum(["tested", "documented", "reported", "unverified"]);
export type EvidenceLabel = z.infer<typeof EvidenceLabel>;

export const Source = z.strictObject({
  id: z.string().min(1),
  title: z.string().min(1),
  url: z.url(),
  publisher: z.enum(["official", "community", "third_party"]),
  retrievedAt: z.string().min(1),
  excerpt: z.string().max(200).optional(),
});
export type Source = z.infer<typeof Source>;

export const Evidence = z.strictObject({
  label: EvidenceLabel,
  sourceIds: z.array(z.string()).default([]),
  testNote: z.string().optional(),
  observationRef: z.string().optional(),
});
export type Evidence = z.infer<typeof Evidence>;

export const Claim = z.strictObject({ text: z.string().min(1), evidence: Evidence });
export type Claim = z.infer<typeof Claim>;

export const Factors = z.strictObject({
  registrationFriction: z.enum(["instant", "account_needed", "paid_or_business_account", "unknown"]),
  reviewRequired: z.enum(["none", "for_public_use", "for_sensitive_scopes", "always", "unknown"]),
  reviewDepth: z.enum([
    "none",
    "automated",
    "manual",
    "security_assessment",
    "partnership_contract",
    "unknown",
  ]),
  docsQuality: z.enum(["clear", "partial", "poor"]),
  waitBasis: z.enum(["documented", "reported", "unknown"]),
  /** Added in Sprint 1 (D-009): typical review wait, needed to tell "days" from "weeks". */
  waitMagnitude: z.enum(["none", "hours", "days", "weeks", "unknown"]),
  /** Added in Sprint 1 (D-009): a registered legal entity is required for the stated use case. */
  businessEntityRequired: z.enum(["yes", "no", "unknown"]),
  specialRequirements: z.array(z.string()),
});
export type Factors = z.infer<typeof Factors>;

export const Range = z.strictObject({
  minDays: z.number().optional(),
  maxDays: z.number().optional(),
  minHours: z.number().optional(),
  maxHours: z.number().optional(),
  basis: z.string().min(1),
  evidence: Evidence,
});
export type Range = z.infer<typeof Range>;

export const Difficulty = z.enum(["easy", "moderate", "hard", "gated", "unknown"]);
export type Difficulty = z.infer<typeof Difficulty>;

export const Verdict = z.strictObject({
  difficulty: Difficulty, // computed by rubric.ts, never by the LLM
  difficultyReason: z.string(),
  /** Added in Sprint 1 (D-009): the use case this verdict is computed for. */
  useCase: z.string().min(1),
  timeToCredentials: Range,
  timeToProduction: z.union([Range, z.strictObject({ none: z.literal(true), evidence: Evidence })]),
  humanEffortHours: Range,
  summary: z.string().min(1),
  biggestLaunchRisk: z.string().min(1),
  factors: Factors,
});
export type Verdict = z.infer<typeof Verdict>;

export const RequirementTag = z.enum([
  "login_or_account",
  "email_or_phone_verification",
  "two_factor",
  "captcha_or_bot_check",
  "identity_or_business_verification",
  "payment",
  "legal_acceptance",
  "manual_submission",
  "provider_review_wait",
  "text_drafting",
  "config_check",
  "code_writing",
  "docs_reading",
]);
export type RequirementTag = z.infer<typeof RequirementTag>;

export const Actor = z.enum(["agent", "you", "provider_wait"]);
export type Actor = z.infer<typeof Actor>;

export const Step = z.strictObject({
  order: z.number().int().min(1),
  title: z.string().min(1),
  estimate: z.string(),
  detail: z.string(),
  url: z.url().optional(),
  requires: z.array(RequirementTag).min(1),
  actor: Actor, // COMPUTED by handoff.ts; any LLM value is overwritten
  agentPrep: z.string().optional(),
  observed: z.boolean(),
  traceHop: z.number().int().optional(),
  evidence: Evidence,
});
export type Step = z.infer<typeof Step>;

export const Classification = z.enum([
  "public",
  "login_redirect",
  "captcha_or_bot",
  "forbidden",
  "not_found",
  "js_shell_unclear",
  "input_required",
  "skipped_robots",
  "blocked_by_policy",
  "error",
]);
export type Classification = z.infer<typeof Classification>;

export const ProbeResult = z.strictObject({
  url: z.url(),
  checkedAt: z.string(),
  httpStatus: z.number().optional(),
  finalHost: z.string().optional(),
  classification: Classification,
  signals: z.array(z.string()),
});
export type ProbeResult = z.infer<typeof ProbeResult>;

export const FlowTrace = z.strictObject({
  startUrl: z.url(),
  checkedAt: z.string(),
  hops: z.array(
    z.strictObject({
      n: z.number().int().min(1),
      url: z.url(),
      title: z.string().optional(),
      classification: Classification,
      viaLinkText: z.string().optional(),
      chosenBy: z.enum(["start", "rule", "model"]),
      matchedStepOrder: z.number().int().optional(),
    }),
  ),
  endedAt: z.enum([
    "gate",
    "input_required",
    "dead_end",
    "depth_limit",
    "js_shell_unclear",
    "policy",
    "error",
  ]),
  endedReason: z.string(),
});
export type FlowTrace = z.infer<typeof FlowTrace>;

export const ProviderMetadata = z.strictObject({
  checkedAt: z.string(),
  found: z.boolean(),
  sourceUrl: z.url().optional(),
  issuer: z.string().optional(),
  authorizationEndpoint: z.string().optional(),
  tokenEndpoint: z.string().optional(),
  /** Parsed value of `registration_endpoint`; "supported" requires this (spec 6.7.2). */
  registrationEndpoint: z.string().optional(),
  scopesListed: z.array(z.string()).max(50).optional(),
  pkceMethods: z.array(z.string()).optional(),
  tokenEndpointAuthMethods: z.array(z.string()).optional(),
  dynamicRegistration: z.enum(["supported", "not_listed", "unknown"]),
  notes: z.array(z.string()),
});
export type ProviderMetadata = z.infer<typeof ProviderMetadata>;

export const AttemptOutcome = z.enum([
  "completed",
  "stopped_human_required",
  "differs_from_docs",
  "failed",
]);

export const AttemptLog = z.strictObject({
  performedBy: z.literal("owner_with_claude_code"),
  date: z.string(),
  accountType: z.literal("free"),
  browserProfile: z.literal("separate"),
  steps: z.array(
    z.strictObject({
      id: z.string().min(1),
      guideStepOrder: z.number().int().optional(),
      action: z.string(),
      observation: z.string().max(200),
      outcome: AttemptOutcome,
      tags: z.array(RequirementTag),
      minutes: z.number().optional(),
    }),
  ),
  stoppedAt: z.string(),
  stoppedBecause: z.array(RequirementTag),
  minutesToCredentials: z.number().optional(),
  corrections: z.array(
    z.strictObject({ docClaim: z.string(), observed: z.string(), sourceId: z.string().optional() }),
  ),
  cleanup: z.strictObject({ appsDeleted: z.boolean(), secretsRemoved: z.boolean() }),
});
export type AttemptLog = z.infer<typeof AttemptLog>;

export const ChecklistId = z.enum([
  "registration",
  "review_process",
  "scopes_restrictions",
  "timing_evidence",
  "requirements",
  "rate_limits",
  "community_reports",
  "composio_status",
]);
export type ChecklistId = z.infer<typeof ChecklistId>;

export const GuideShape = z.strictObject({
  schemaVersion: z.literal(1),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  appName: z.string().min(1),
  providerSite: z.string().min(1),
  mode: z.enum(["library", "live"]),
  generatedAt: z.string(),
  pipelineVersion: z.string(),
  modelUsed: z.string(),
  complete: z.boolean(),
  attemptLevel: z.enum(["L1", "L2", "L3"]),
  attemptLevelReason: z.string(),
  probe: z.array(ProbeResult),
  flowTrace: FlowTrace.optional(),
  providerMetadata: ProviderMetadata.optional(),
  attempt: AttemptLog.optional(),
  verdict: Verdict,
  managedVsOwn: z.strictObject({
    composioManaged: z.enum(["yes", "no", "unknown"]),
    managedCovers: z.array(Claim),
    youNeedOwnWhen: z.array(Claim),
    source: z.string().optional(),
  }),
  requirements: z.array(Claim),
  steps: z.array(Step),
  scopesAndNuances: z.array(Claim),
  blockers: z.array(
    z.strictObject({
      problem: z.string(),
      fix: z.string(),
      contact: z.string().optional(),
      evidence: Evidence,
    }),
  ),
  handoff: z.strictObject({
    agentCanDo: z.array(Claim),
    youMustDo: z.array(Claim),
    providerWait: z.array(Claim),
  }),
  tested: z.strictObject({ unverified: z.array(z.string()) }),
  sources: z.array(Source),
  research: z.strictObject({
    method: z.enum(["agent", "fixed", "fixed_fallback"]),
    actionsUsed: z.number(),
    pageReads: z.number(),
    seconds: z.number(),
    checklist: z.array(
      z.strictObject({
        item: ChecklistId,
        status: z.enum(["covered", "partial", "not_found"]),
        sourceIds: z.array(z.string()),
      }),
    ),
    steps: z
      .array(
        z.strictObject({
          action: z.enum(["search", "read"]),
          target: z.string(),
          reason: z.string(),
        }),
      )
      .optional(),
  }),
  nextAction: z.string(),
  warnings: z.array(z.string()),
});
export type GuideShape = z.infer<typeof GuideShape>;

/** Every Evidence object in a guide, with a readable path (used by refinements and validate.ts). */
export function collectEvidence(g: GuideShape): { path: string; evidence: Evidence }[] {
  const out: { path: string; evidence: Evidence }[] = [];
  const add = (path: string, evidence: Evidence) => out.push({ path, evidence });
  add("verdict.timeToCredentials", g.verdict.timeToCredentials.evidence);
  add("verdict.timeToProduction", g.verdict.timeToProduction.evidence);
  add("verdict.humanEffortHours", g.verdict.humanEffortHours.evidence);
  const claims: [string, Claim[]][] = [
    ["managedVsOwn.managedCovers", g.managedVsOwn.managedCovers],
    ["managedVsOwn.youNeedOwnWhen", g.managedVsOwn.youNeedOwnWhen],
    ["requirements", g.requirements],
    ["scopesAndNuances", g.scopesAndNuances],
    ["handoff.agentCanDo", g.handoff.agentCanDo],
    ["handoff.youMustDo", g.handoff.youMustDo],
    ["handoff.providerWait", g.handoff.providerWait],
  ];
  for (const [p, list] of claims) list.forEach((c, i) => add(`${p}[${i}]`, c.evidence));
  g.steps.forEach((s, i) => add(`steps[${i}]`, s.evidence));
  g.blockers.forEach((b, i) => add(`blockers[${i}]`, b.evidence));
  return out;
}

/** Everything a `tested` observationRef may point at. */
export function observationRefs(g: GuideShape): Set<string> {
  const refs = new Set<string>();
  g.probe.forEach((p) => refs.add(p.url));
  g.flowTrace?.hops.forEach((h) => refs.add(h.url));
  if (g.providerMetadata?.sourceUrl) refs.add(g.providerMetadata.sourceUrl);
  g.attempt?.steps.forEach((s) => refs.add(s.id));
  return refs;
}

export const Guide = GuideShape.superRefine((g, ctx) => {
  const issue = (message: string, path: (string | number)[] = []) =>
    ctx.addIssue({ code: "custom", message, path });
  const sourceById = new Map(g.sources.map((s) => [s.id, s]));
  const refs = observationRefs(g);

  for (const { path, evidence: e } of collectEvidence(g)) {
    // 1. every sourceId exists
    for (const id of e.sourceIds) if (!sourceById.has(id)) issue(`${path}: unknown source id "${id}"`);
    const cited = e.sourceIds.map((id) => sourceById.get(id)).filter(Boolean);
    // 2. documented / reported need the right kind of source
    if (e.label === "documented" && !cited.some((s) => s!.publisher === "official"))
      issue(`${path}: "documented" needs at least one official source`);
    if (e.label === "reported" && !cited.some((s) => s!.publisher !== "official"))
      issue(`${path}: "reported" needs at least one non-official source`);
    // 3. tested must be earned
    if (e.label === "tested") {
      if (!e.testNote) issue(`${path}: "tested" needs a testNote`);
      if (!e.observationRef || !refs.has(e.observationRef))
        issue(`${path}: "tested" needs an observationRef that exists in probe, trace, metadata or attempt`);
    }
  }
  for (const c of g.research.checklist)
    for (const id of c.sourceIds) if (!sourceById.has(id)) issue(`research.checklist: unknown source id "${id}"`);

  // 5. contiguous step order
  g.steps.forEach((s, i) => {
    if (s.order !== i + 1) issue(`steps[${i}]: order must be contiguous from 1 (got ${s.order})`, ["steps", i, "order"]);
  });

  // 6. source URLs are https (z.url() already parses)
  g.sources.forEach((s, i) => {
    if (!s.url.startsWith("https://")) issue(`sources[${i}]: url must be https`, ["sources", i, "url"]);
  });
  const ids = new Set<string>();
  g.sources.forEach((s) => {
    if (ids.has(s.id)) issue(`duplicate source id "${s.id}"`);
    ids.add(s.id);
  });

  // 7. attempt level consistency
  if (g.mode === "live" && g.attemptLevel === "L3") issue("a live guide can never be L3");
  if (g.attemptLevel === "L3" && (!g.attempt || g.attempt.steps.length < 1 || !g.attempt.stoppedAt))
    issue("L3 requires an attempt log with at least one step and a stoppedAt");
  if (g.attemptLevel === "L2" && g.probe.length < 1) issue("L2 requires at least one probe result");
});
export type Guide = z.infer<typeof Guide>;
