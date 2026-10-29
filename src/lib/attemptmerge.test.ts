import { describe, it, expect } from "vitest";
import fixture from "@/fixtures/sample-guide.json";
import { Guide, AttemptLog, type GuideShape } from "@/lib/schema/guide";
import { mergeAttempt, diffGuides } from "./attemptmerge";

/** A pre-walkthrough draft: the fake fixture with its walkthrough removed and its steps back to "documented". */
function draft(): GuideShape {
  const g = structuredClone(fixture) as unknown as GuideShape;
  delete g.attempt;
  g.attemptLevel = "L2";
  g.attemptLevelReason = "Gate probed.";
  g.steps = g.steps.map((s) => ({ ...s, observed: false, evidence: { label: "documented" as const, sourceIds: s.evidence.sourceIds.length ? s.evidence.sourceIds : [g.sources.find((x) => x.publisher === "official")!.id] } }));
  g.requirements = g.requirements.map((c) => ({ ...c, evidence: { label: "documented" as const, sourceIds: [g.sources.find((x) => x.publisher === "official")!.id] } }));
  g.verdict.timeToCredentials = { ...g.verdict.timeToCredentials, minHours: 1, maxHours: 2, basis: "Docs estimate.", evidence: { label: "documented", sourceIds: [g.sources.find((x) => x.publisher === "official")!.id] } };
  g.handoff = { agentCanDo: [], youMustDo: [], providerWait: [] };
  return g;
}

const log = (over: Partial<AttemptLog> = {}): AttemptLog => ({
  performedBy: "owner_with_claude_code", date: "2026-11-02", accountType: "free", browserProfile: "separate",
  steps: [
    { id: "a1", guideStepOrder: 1, action: "Opened the developer docs", observation: "Docs page loaded; no account needed.", outcome: "completed", tags: ["docs_reading"], minutes: 2 },
    { id: "a2", guideStepOrder: 2, action: "Opened the console", observation: "Redirected to sign-in; stopped for the owner.", outcome: "stopped_human_required", tags: ["login_or_account", "two_factor"], minutes: 3 },
    { id: "a3", guideStepOrder: 3, action: "Registered a throwaway app", observation: "Form needed an extra homepage URL not in the docs.", outcome: "differs_from_docs", tags: ["config_check"], minutes: 4 },
  ],
  stoppedAt: "the review-submission step", stoppedBecause: ["manual_submission"], minutesToCredentials: 9,
  corrections: [{ docClaim: "A free developer account on the provider's site (fake).", observed: "A free account is needed and it also asks for two-factor setup." }],
  cleanup: { appsDeleted: true, secretsRemoved: true },
  ...over,
});

describe("mergeAttempt", () => {
  it("sets level L3 with a reason and attaches the log", () => {
    const r = mergeAttempt(draft(), log());
    expect(r.guide.attemptLevel).toBe("L3");
    expect(r.guide.attemptLevelReason).toContain("2026-11-02");
    expect(r.guide.attempt?.steps.length).toBe(3);
  });
  it("replaces observed step tags, marks them observed and earns 'tested' with an observationRef", () => {
    const g = mergeAttempt(draft(), log()).guide;
    const s2 = g.steps[1];
    expect(s2.requires).toEqual(["login_or_account", "two_factor"]);
    expect(s2.observed).toBe(true);
    expect(s2.evidence).toMatchObject({ label: "tested", observationRef: "a2" });
    expect(s2.evidence.testNote).toContain("walkthrough");
  });
  it("recomputes actors and the handoff table from the observed tags", () => {
    const g = mergeAttempt(draft(), log()).guide;
    expect(g.steps[1].actor).toBe("you");
    expect(g.handoff.youMustDo.some((c) => c.text.startsWith("Step 2"))).toBe(true);
    expect(g.handoff.agentCanDo.some((c) => c.text.startsWith("Step 1"))).toBe(true);
  });
  it("leaves steps the walkthrough never reached as documented and says so", () => {
    const g = mergeAttempt(draft(), log()).guide;
    expect(g.steps[4].evidence.label).toBe("documented");
    expect(g.steps[4].observed).toBe(false);
    expect(g.tested.unverified.join(" ")).toMatch(/Steps? 4/);
  });
  it("a failed attempt step is not tested and keeps the documented tags", () => {
    const l = log({ steps: [{ id: "a1", guideStepOrder: 1, action: "x", observation: "Timed out.", outcome: "failed", tags: [], minutes: 1 }] });
    const g = mergeAttempt(draft(), l).guide;
    expect(g.steps[0].evidence.label).toBe("documented");
    expect(g.steps[0].requires).toEqual(["docs_reading"]);
    expect(g.tested.unverified.join(" ")).toContain("failed");
  });
  it("sums measured minutes into the step estimate and sets measured time to credentials", () => {
    const g = mergeAttempt(draft(), log()).guide;
    expect(g.steps[1].estimate).toContain("3 min");
    const t = g.verdict.timeToCredentials;
    expect(t.minHours).toBeCloseTo(9 / 60);
    expect(t.maxHours).toBeCloseTo(9 / 60);
    expect(t.evidence.label).toBe("tested");
    expect(t.basis).toContain("one");
  });
  it("applies a correction to the matching claim, keeps what the docs said, and adds a changelog line", () => {
    const r = mergeAttempt(draft(), log());
    const claim = r.guide.requirements.find((c) => c.text.includes("two-factor"));
    expect(claim).toBeTruthy();
    expect(claim!.text).toContain("Docs said");
    expect(claim!.evidence.label).toBe("tested");
    expect(r.guide.changelog?.[0]).toContain("2026-11-02");
  });
  it("a correction that matches no claim becomes a new tested note, never lost", () => {
    const l = log({ corrections: [{ docClaim: "Something no claim mentions.", observed: "It actually needs a homepage URL." }] });
    const g = mergeAttempt(draft(), l).guide;
    expect(g.scopesAndNuances.some((c) => c.text.includes("homepage URL") && c.evidence.label === "tested")).toBe(true);
  });
  it("an empty log keeps L2 with the reason and changes no step", () => {
    const before = draft();
    const l = log({ steps: [], stoppedAt: "a company page is required before any app can be created", stoppedBecause: ["identity_or_business_verification"], minutesToCredentials: undefined, corrections: [] });
    const g = mergeAttempt(before, l).guide;
    expect(g.attemptLevel).toBe("L2");
    expect(g.attemptLevelReason).toContain("could not start");
    expect(g.steps.map((s) => s.evidence.label)).toEqual(before.steps.map((s) => s.evidence.label));
  });
  it("applies factor updates through the rubric and recomputes difficulty", () => {
    const r = mergeAttempt(draft(), log(), { factorUpdates: { reviewRequired: "none", reviewDepth: "none", waitMagnitude: "none" } });
    expect(r.guide.verdict.factors.reviewRequired).toBe("none");
    expect(r.guide.verdict.factorBasis?.reviewRequired).toBe("stated");
    expect(["easy", "moderate"]).toContain(r.guide.verdict.difficulty);
  });
  it("the merged guide validates, and secrets-like text in an observation is rejected before merging", () => {
    const r = mergeAttempt(draft(), log());
    expect(Guide.safeParse(r.guide).success).toBe(true);
    expect(() => mergeAttempt(draft(), log({ steps: [{ id: "a1", guideStepOrder: 1, action: "x", observation: "client_secret = " + "abcd1234".repeat(5), outcome: "completed", tags: ["docs_reading"] }] }))).toThrow(/secret/i);
  });
  it("does not mistake a long documentation URL for a secret", () => {
    const url = "https://docs.example.com/en/apps/creating-github-apps/registering-a-github-app-with-a-very-long-descriptive-slug";
    expect(() => mergeAttempt(draft(), log({ steps: [{ id: "a1", guideStepOrder: 1, action: "Opened docs", observation: url, outcome: "completed", tags: ["docs_reading"] }] }))).not.toThrow();
  });
  it("rejects a log that does not finish with cleanup done unless it says so", () => {
    const g = mergeAttempt(draft(), log({ cleanup: { appsDeleted: false, secretsRemoved: true } }));
    expect(g.guide.tested.unverified.join(" ")).toContain("test app");
  });
  it("produces a visible diff against the draft", () => {
    const before = draft();
    const r = mergeAttempt(before, log());
    const d = diffGuides(before, r.guide);
    expect(d.length).toBeGreaterThan(4);
    expect(d.join("\n")).toMatch(/attemptLevel/);
    expect(d.join("\n")).toMatch(/Step 2/);
  });
});
