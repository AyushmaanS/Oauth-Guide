import { describe, it, expect } from "vitest";
import { QUESTIONS, fill, validateLookingFor, validateQuery, type QuestionId } from "./questions";
import { buildQueries } from "./gather/fixed";
import { FOLLOWUPS } from "./gather/followup";

const apps = [
  { appName: "Zoom", providerDomains: ["zoom.us"] },
  { appName: "Google Drive", providerDomains: ["google.com"] },
  { appName: "X (Twitter)", providerDomains: ["x.com", "twitter.com"] },
  { appName: "Frame.io", providerDomains: ["frame.io", "adobe.com"] },
];

describe("every machine-generated query is a specific question", () => {
  it.each(apps)("fixed-gather queries for %j pass validateQuery", (app) => {
    for (const mode of ["deep", "fast"] as const)
      for (const spec of buildQueries(app.appName, mode)) expect(validateQuery(spec.q, app, [spec.target as QuestionId])).toBeNull();
  });
  it.each(apps)("follow-up queries for %j pass validateQuery", (app) => {
    for (const f of Object.values(FOLLOWUPS)) expect(validateQuery(fill(f.query, app.appName), app, [f.target])).toBeNull();
  });
  it("every question is closed and specific", () => {
    for (const q of Object.values(QUESTIONS)) {
      expect(q.question.endsWith("?")).toBe(true);
      expect(q.templates.length).toBeGreaterThan(0);
    }
  });
});

describe("validateQuery", () => {
  const z = apps[0];
  it("rejects short, generic, nameless and off-question queries", () => {
    expect(validateQuery("Zoom OAuth", z, ["review_process"])).toContain("short");
    expect(validateQuery("oauth developer docs", z, ["review_process"])).not.toBeNull();
    expect(validateQuery("how long does approval take", z, ["timing_evidence"])).toContain("name the app");
    expect(validateQuery("Zoom app registration free account", z, ["timing_evidence"])).toContain("does not ask about");
    expect(validateQuery("Zoom app review approval", z, [])).toContain("target");
  });
  it("accepts a precise query", () => expect(validateQuery("Zoom app review how many days approval takes", z, ["timing_evidence"])).toBeNull());
});

describe("validateLookingFor", () => {
  it.each(["more info", "details", "anything useful about oauth", "general overview of the docs", "tell me about review", "what is the process"])("rejects %j", (v) => {
    expect(validateLookingFor(v)).not.toBeNull();
  });
  it.each(["number of business days the app review takes", "whether a paid plan is needed to create an app"])("accepts %j", (v) => {
    expect(validateLookingFor(v)).toBeNull();
  });
});
