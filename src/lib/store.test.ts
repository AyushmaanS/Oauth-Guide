import { describe, it, expect, beforeEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import fixture from "@/fixtures/sample-guide.json";
import { Guide } from "@/lib/schema/guide";
import { fsStore, redisStore } from "@/lib/store";
import { checkLimits, memoryCounter } from "@/lib/ratelimit";
import { guessSlug, validateInput } from "@/lib/pipeline/resolve";

const guide = Guide.parse(fixture);

describe("fsStore", () => {
  it("round-trips a guide and returns null for missing or corrupt files", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "store-"));
    const s = fsStore(dir);
    expect(await s.get("nope")).toBeNull();
    await s.put(guide);
    expect((await s.get(guide.slug))?.appName).toBe(guide.appName);
    fs.writeFileSync(path.join(dir, "bad.json"), "{not json");
    expect(await s.get("bad")).toBeNull();
    fs.writeFileSync(path.join(dir, "invalid.json"), JSON.stringify({ ...guide, steps: [] , schemaVersion: 9 }));
    expect(await s.get("invalid")).toBeNull();
  });
  it("rejects path-like slugs", async () => {
    expect(await fsStore(os.tmpdir()).get("../etc/passwd")).toBeNull();
  });
});

describe("redisStore", () => {
  it("stores JSON and re-validates on read", async () => {
    const data = new Map<string, unknown>();
    const fake = { get: async (k: string) => data.get(k) ?? null, set: async (k: string, v: unknown) => { data.set(k, v); return "OK"; } };
    const s = redisStore(fake as never);
    await s.put(guide);
    expect((await s.get(guide.slug))?.slug).toBe(guide.slug);
    data.set("guide:tampered", JSON.stringify({ hello: "world" }));
    expect(await s.get("tampered")).toBeNull();
  });
});

describe("checkLimits", () => {
  beforeEach(() => { process.env.RATE_LIMIT_PER_HOUR = "2"; process.env.DAILY_GENERATION_CAP = "3"; });
  it("blocks the third request from one IP within an hour (429)", async () => {
    const c = memoryCounter();
    expect((await checkLimits("1.1.1.1", c)).ok).toBe(true);
    expect((await checkLimits("1.1.1.1", c)).ok).toBe(true);
    const r = await checkLimits("1.1.1.1", c);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.status).toBe(429);
  });
  it("applies the global daily cap across IPs (503)", async () => {
    const c = memoryCounter();
    await checkLimits("a", c); await checkLimits("b", c); await checkLimits("c", c);
    const r = await checkLimits("d", c);
    expect(!r.ok && r.status).toBe(503);
  });
  it("a new hour resets the per-IP limit", async () => {
    const c = memoryCounter();
    await checkLimits("x", c, new Date("2026-10-29T10:00:00Z")); await checkLimits("x", c, new Date("2026-10-29T10:10:00Z"));
    expect((await checkLimits("x", c, new Date("2026-10-29T11:00:00Z"))).ok).toBe(true);
  });
});

describe("guessSlug", () => {
  it("maps names and urls to a slug", () => {
    expect(guessSlug(validateInput("Google Drive"))).toBe("google-drive");
    expect(guessSlug(validateInput("https://www.zoom.us/pricing"))).toBe("zoom");
    expect(guessSlug(validateInput("developer.spotify.com"))).toBe("spotify");
  });
});
