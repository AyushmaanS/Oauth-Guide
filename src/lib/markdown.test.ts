import { describe, it, expect } from "vitest";
import fixture from "@/fixtures/sample-guide.json";
import { Guide } from "@/lib/schema/guide";
import { guideToMarkdown } from "./markdown";

describe("guideToMarkdown", () => {
  const md = guideToMarkdown(Guide.parse(fixture));
  it("matches the snapshot", () => expect(md).toMatchSnapshot());
  it("carries evidence labels and sources", () => {
    expect(md).toContain("**Tested**");
    expect(md).toContain("**Documented** [2]");
    expect(md).toContain("## Sources");
  });
  it("includes every step", () => {
    for (const n of [1, 2, 3, 4, 5, 6]) expect(md).toContain(`${n}. **`);
  });
});
