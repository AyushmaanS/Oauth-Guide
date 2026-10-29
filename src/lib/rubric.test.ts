import { describe, it, expect } from "vitest";
import { computeDifficulty } from "./rubric";
import type { Factors } from "@/lib/schema/guide";

const base: Factors = {
  registrationFriction: "instant", reviewRequired: "none", reviewDepth: "none", docsQuality: "clear",
  waitBasis: "unknown", waitMagnitude: "none", businessEntityRequired: "no", specialRequirements: [],
};
const d = (o: Partial<Factors>) => computeDifficulty({ ...base, ...o }).difficulty;

describe("computeDifficulty", () => {
  it("gated: partnership contract", () => expect(d({ reviewDepth: "partnership_contract" })).toBe("gated"));
  it("gated: paid or business account", () => expect(d({ registrationFriction: "paid_or_business_account" })).toBe("gated"));
  it("gated: business entity required", () => expect(d({ businessEntityRequired: "yes" })).toBe("gated"));
  it("gated beats hard", () => expect(d({ reviewDepth: "partnership_contract", waitMagnitude: "weeks", reviewRequired: "always" })).toBe("gated"));
  it("hard: security assessment", () => expect(d({ reviewDepth: "security_assessment", reviewRequired: "for_sensitive_scopes" })).toBe("hard"));
  it("hard: sensitive scopes with manual review", () => expect(d({ reviewRequired: "for_sensitive_scopes", reviewDepth: "manual" })).toBe("hard"));
  it("hard: required review that takes weeks", () => expect(d({ reviewRequired: "for_public_use", reviewDepth: "manual", waitMagnitude: "weeks" })).toBe("hard"));
  it("weeks of OPTIONAL review does not make it hard", () => expect(d({ reviewRequired: "none", waitMagnitude: "weeks" })).toBe("easy"));
  it("moderate: review for public use", () => expect(d({ reviewRequired: "for_public_use", reviewDepth: "manual", waitMagnitude: "days" })).toBe("moderate"));
  it("moderate: sensitive scopes, automated review", () => expect(d({ reviewRequired: "for_sensitive_scopes", reviewDepth: "automated" })).toBe("moderate"));
  it("unknown: review required but depth and wait both unknown", () => expect(d({ reviewRequired: "for_sensitive_scopes", reviewDepth: "unknown", waitMagnitude: "unknown" })).toBe("unknown"));
  it("moderate with a known depth but unknown wait says so", () => {
    const r = computeDifficulty({ ...base, reviewRequired: "for_public_use", reviewDepth: "manual", waitMagnitude: "unknown" });
    expect(r.difficulty).toBe("moderate");
    expect(r.reason).toContain("not established");
  });
  it("business entity beats a paid-account reason", () => expect(computeDifficulty({ ...base, registrationFriction: "paid_or_business_account", businessEntityRequired: "yes" }).reason).toContain("business entity"));
  it("moderate: always reviewed", () => expect(d({ reviewRequired: "always", reviewDepth: "automated" })).toBe("moderate"));
  it("moderate: three special requirements", () => expect(d({ specialRequirements: ["a", "b", "c"] })).toBe("moderate"));
  it("two special requirements stay easy", () => expect(d({ specialRequirements: ["a", "b"] })).toBe("easy"));
  it("unknown: registration unknown", () => expect(d({ registrationFriction: "unknown" })).toBe("unknown"));
  it("unknown: review unknown", () => expect(d({ reviewRequired: "unknown" })).toBe("unknown"));
  it("easy: instant", () => expect(d({})).toBe("easy"));
  it("easy: account needed", () => expect(d({ registrationFriction: "account_needed" })).toBe("easy"));
  it("always returns a reason", () => expect(computeDifficulty(base).reason.length).toBeGreaterThan(5));
});

import { difficultyBounds, resolveDifficulty, unknownFactorKeys } from "./rubric";

describe("bounds and resolution under partial information", () => {
  const unk: Factors = { ...base, registrationFriction: "account_needed", reviewRequired: "unknown", reviewDepth: "unknown", waitMagnitude: "unknown", businessEntityRequired: "unknown" };
  it("review unknown spans easy to hard, never gated", () => {
    const b = difficultyBounds(unk);
    expect(b.best).toBe("easy");
    expect(b.worst).toBe("hard");
    expect(b.unknown).toEqual(["reviewRequired", "reviewDepth", "waitMagnitude", "businessEntityRequired"]);
  });
  it("is established when best and worst agree despite unknowns (review stated none)", () => {
    const r = resolveDifficulty({ ...base, reviewRequired: "none", reviewDepth: "unknown", waitMagnitude: "unknown" });
    expect(r.difficulty).toBe("easy");
    expect(r.confidence).toBe("established");
    expect(r.reason).toContain("whatever the unknown");
  });
  it("stated gated stays gated even with other unknowns", () => {
    const r = resolveDifficulty({ ...unk, businessEntityRequired: "yes" });
    expect(r.difficulty).toBe("gated");
    expect(r.confidence).toBe("established");
  });
  it("unresolved without inference: unknown label but a range", () => {
    const r = resolveDifficulty(unk);
    expect(r.difficulty).toBe("unknown");
    expect(r.confidence).toBe("unresolved");
    expect(r.range).toEqual({ best: "easy", worst: "hard" });
    expect(r.reason).toContain("easy to hard");
  });
  it("uses inferred values to give an estimated label", () => {
    const completed: Factors = { ...unk, reviewRequired: "for_public_use", reviewDepth: "manual", waitMagnitude: "days", businessEntityRequired: "no" };
    const r = resolveDifficulty(unk, completed);
    expect(r.difficulty).toBe("moderate");
    expect(r.confidence).toBe("estimated");
    expect(r.reason).toContain("Our estimate");
  });
  it("security assessment stated, wait unknown: hard, established", () => {
    const r = resolveDifficulty({ ...base, reviewRequired: "for_sensitive_scopes", reviewDepth: "security_assessment", waitMagnitude: "unknown" });
    expect(r.difficulty).toBe("hard");
    expect(r.confidence).toBe("established");
  });
  it("lists unknown keys", () => expect(unknownFactorKeys(unk)).toContain("reviewDepth"));
});
