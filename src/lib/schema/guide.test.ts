import { describe, it, expect } from "vitest";
import fixture from "@/fixtures/sample-guide.json";
import { Guide, GuideShape } from "./guide";

const fresh = () => structuredClone(fixture) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
const errs = (g: unknown) => {
  const r = Guide.safeParse(g);
  return r.success ? [] : r.error.issues.map((i) => i.message);
};

describe("Guide schema", () => {
  it("accepts the fake fixture", () => {
    expect(errs(fresh())).toEqual([]);
  });
  it("rejects unknown fields (strict)", () => {
    const g = fresh();
    g.surprise = 1;
    expect(GuideShape.safeParse(g).success).toBe(false);
  });
  it("rejects an unknown source id", () => {
    const g = fresh();
    g.steps[5].evidence.sourceIds = ["s99"];
    expect(errs(g).join()).toContain('unknown source id "s99"');
  });
  it("documented needs an official source", () => {
    const g = fresh();
    g.steps[5].evidence = { label: "documented", sourceIds: ["s3"] };
    expect(errs(g).join()).toContain("official");
  });
  it("documented with no sources is rejected", () => {
    const g = fresh();
    g.steps[5].evidence = { label: "documented", sourceIds: [] };
    expect(errs(g).length).toBeGreaterThan(0);
  });
  it("reported needs a non-official source", () => {
    const g = fresh();
    g.blockers[0].evidence = { label: "reported", sourceIds: ["s1"] };
    expect(errs(g).join()).toContain("non-official");
  });
  it("tested needs a testNote", () => {
    const g = fresh();
    delete g.steps[0].evidence.testNote;
    expect(errs(g).join()).toContain("testNote");
  });
  it("tested needs an existing observationRef", () => {
    const g = fresh();
    g.steps[0].evidence.observationRef = "https://nowhere.example.com/x";
    expect(errs(g).join()).toContain("observationRef");
  });
  it("unverified is allowed with no sources", () => {
    const g = fresh();
    g.steps[5].evidence = { label: "unverified", sourceIds: [] };
    expect(errs(g)).toEqual([]);
  });
  it("step order must be contiguous from 1", () => {
    const g = fresh();
    g.steps[2].order = 7;
    expect(errs(g).join()).toContain("contiguous");
  });
  it("source urls must be https", () => {
    const g = fresh();
    g.sources[0].url = "http://developers.example.com/x";
    expect(errs(g).join()).toContain("https");
  });
  it("a step needs at least one requirement tag", () => {
    const g = fresh();
    g.steps[0].requires = [];
    expect(errs(g).length).toBeGreaterThan(0);
  });
  it("a requirement tag must be from the fixed list", () => {
    const g = fresh();
    g.steps[0].requires = ["make_coffee"];
    expect(errs(g).length).toBeGreaterThan(0);
  });
  it("live guides can never be L3", () => {
    const g = fresh();
    g.mode = "live";
    expect(errs(g).join()).toContain("live guide can never be L3");
  });
  it("L3 requires an attempt log", () => {
    const g = fresh();
    delete g.attempt;
    g.attemptLevel = "L3";
    expect(errs(g).join()).toContain("L3 requires");
  });
  it("L2 requires a probe result", () => {
    const g = fresh();
    g.attemptLevel = "L2";
    g.probe = [];
    g.steps.forEach((s: any) => { if (s.evidence.label === "tested") s.evidence = { label: "unverified", sourceIds: [] }; }); // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(errs(g).join()).toContain("L2 requires");
  });
  it("attempt observations over 200 characters are rejected", () => {
    const g = fresh();
    g.attempt.steps[0].observation = "x".repeat(201);
    expect(GuideShape.safeParse(g).success).toBe(false);
  });
});
