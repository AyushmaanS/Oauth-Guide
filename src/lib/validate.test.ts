import { describe, it, expect } from "vitest";
import fixture from "@/fixtures/sample-guide.json";
import { GuideShape } from "@/lib/schema/guide";
import { validateGuide } from "./validate";

/* eslint-disable @typescript-eslint/no-explicit-any */
const draft = () => GuideShape.parse(structuredClone(fixture));
const run = (mut: (g: any) => void) => {
  const g: any = draft();
  mut(g);
  return validateGuide(g);
};

describe("validateGuide", () => {
  it("passes the fixture unchanged in substance", () => {
    const r = validateGuide(draft());
    expect(r.errors).toEqual([]);
    expect(r.guide?.verdict.difficulty).toBe("moderate");
  });
  it("overrides an LLM-written difficulty", () => {
    const r = run((g) => { g.verdict.difficulty = "easy"; });
    expect(r.guide?.verdict.difficulty).toBe("moderate");
  });
  it("overwrites LLM-written actors and handoff", () => {
    const r = run((g) => { g.steps[1].actor = "agent"; g.handoff = { agentCanDo: [], youMustDo: [], providerWait: [] }; });
    expect(r.guide?.steps[1].actor).toBe("you");
    expect(r.guide?.handoff.youMustDo.length).toBe(2);
  });
  it("removes a claim citing a missing source and warns", () => {
    const r = run((g) => { g.requirements.push({ text: "ghost", evidence: { label: "documented", sourceIds: ["s42"] } }); });
    expect(r.guide?.requirements.some((c) => c.text === "ghost")).toBe(false);
    expect(r.warnings.join()).toContain("s42");
  });
  it("downgrades documented to reported when only a community source backs it", () => {
    const r = run((g) => { g.steps[5].evidence = { label: "documented", sourceIds: ["s3"] }; });
    expect(r.guide?.steps[5].evidence.label).toBe("reported");
  });
  it("downgrades a time range that is stronger than its sources", () => {
    const r = run((g) => { g.verdict.timeToProduction.evidence = { label: "documented", sourceIds: ["s3"] }; });
    expect((r.guide?.verdict.timeToProduction as any).evidence.label).toBe("reported");
  });
  it("downgrades tested evidence whose observationRef is missing", () => {
    const r = run((g) => { g.steps[0].evidence.observationRef = "nope"; });
    expect(r.guide?.steps[0].evidence.label).toBe("unverified");
  });
  it("truncates long excerpts", () => {
    const r = run((g) => { g.sources[0].excerpt = "x".repeat(500); });
    expect(r.guide?.sources[0].excerpt?.length).toBeLessThanOrEqual(200);
  });
  it("lowers a live L3 guide to L2", () => {
    const r = run((g) => { g.mode = "live"; });
    expect(r.guide?.attemptLevel).toBe("L2");
  });
  it("lowers L2 to L1 when there are no probes", () => {
    const r = run((g) => { g.attemptLevel = "L2"; g.probe = []; g.flowTrace = undefined; g.attempt = undefined; });
    expect(r.guide?.attemptLevel).toBe("L1");
  });
  it("adds research gaps to tested.unverified and warns for required items", () => {
    const r = run((g) => { g.research.checklist[0].status = "not_found"; g.tested.unverified = []; });
    expect(r.guide?.tested.unverified).toContain("Research gap (not found): registration");
    expect(r.warnings.join()).toContain("Required checklist item not found: registration");
  });
  it("marks a guide with no next action incomplete", () => {
    const r = run((g) => { g.nextAction = " "; });
    expect(r.guide?.complete).toBe(false);
  });
  it("drops a trace with non-contiguous hops", () => {
    const r = run((g) => { g.flowTrace.hops[1].n = 5; });
    expect(r.guide?.flowTrace).toBeUndefined();
    expect(r.warnings.join()).toContain("Flow trace removed");
  });
  it("drops a trace that leaves the allow-list", () => {
    const r = run((g) => { g.flowTrace.hops[1].url = "https://evil.test/x"; });
    expect(r.guide?.flowTrace).toBeUndefined();
  });
  it("drops a trace whose ending contradicts its last hop", () => {
    const r = run((g) => { g.flowTrace.endedAt = "input_required"; });
    expect(r.guide?.flowTrace).toBeUndefined();
  });
  it("drops a trace over the hop limit", () => {
    const r = validateGuide(draft(), { maxHops: 2 });
    expect(r.guide?.flowTrace).toBeUndefined();
  });
  it("clears matchedStepOrder pointing at a missing step", () => {
    const r = run((g) => { g.flowTrace.hops[1].matchedStepOrder = 99; });
    expect(r.guide?.flowTrace?.hops[1].matchedStepOrder).toBeUndefined();
  });
  it("does not allow dynamic registration without a registration endpoint", () => {
    const r = run((g) => { g.providerMetadata.dynamicRegistration = "supported"; });
    expect(r.guide?.providerMetadata?.dynamicRegistration).toBe("not_listed");
  });
});
