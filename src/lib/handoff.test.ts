import { describe, it, expect } from "vitest";
import { mapOwner, deriveHandoff, applyOwners, HUMAN_ONLY_TAGS } from "./handoff";
import { RequirementTag, type Step } from "@/lib/schema/guide";

const ev = { label: "unverified" as const, sourceIds: [] };
const step = (order: number, requires: Step["requires"], extra: Partial<Step> = {}): Step => ({
  order, title: `t${order}`, estimate: "", detail: "", requires, actor: "agent", observed: false, evidence: ev, ...extra,
});

describe("mapOwner", () => {
  it.each(RequirementTag.options)("maps %s on its own", (tag) => {
    const expected = tag === "provider_review_wait" ? "provider_wait" : HUMAN_ONLY_TAGS.includes(tag) ? "you" : "agent";
    expect(mapOwner([tag])).toBe(expected);
  });
  it("provider wait beats human-only tags", () => {
    expect(mapOwner(["login_or_account", "provider_review_wait"])).toBe("provider_wait");
  });
  it("human-only beats agent tags", () => {
    expect(mapOwner(["text_drafting", "manual_submission"])).toBe("you");
  });
  it("agent tags alone are agent", () => {
    expect(mapOwner(["config_check", "code_writing", "docs_reading", "text_drafting"])).toBe("agent");
  });
  it("rejects empty tags", () => {
    expect(() => mapOwner([])).toThrow();
  });
});

describe("deriveHandoff", () => {
  it("ignores any actor the model wrote and includes agentPrep for human steps", () => {
    const steps = [
      step(1, ["docs_reading"], { actor: "you" }),
      step(2, ["text_drafting", "manual_submission"], { agentPrep: "draft text", actor: "agent" }),
      step(3, ["provider_review_wait"]),
    ];
    const h = deriveHandoff(steps);
    expect(h.agentCanDo.map((c) => c.text)).toEqual(["Step 1: t1", "Step 2 (prep): draft text"]);
    expect(h.youMustDo[0].text).toContain("manual_submission");
    expect(h.youMustDo[0].text).not.toContain("text_drafting");
    expect(h.providerWait).toHaveLength(1);
  });
  it("applyOwners overwrites actors", () => {
    expect(applyOwners([step(1, ["payment"], { actor: "agent" })])[0].actor).toBe("you");
  });
});
