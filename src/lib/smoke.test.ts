import { describe, it, expect } from "vitest";
import { z } from "zod";

describe("toolchain", () => {
  it("runs vitest with zod", () => {
    expect(z.string().safeParse("ok").success).toBe(true);
  });
});
