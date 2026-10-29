/**
 * Merge a redacted walkthrough log into a library guide.
 *   npx tsx scripts/merge-attempt.ts <slug> [--factor reviewRequired=none --factor reviewDepth=none]
 * Reads content/guides/<slug>.json and content/attempts/<slug>.json; writes the guide only if it still validates,
 * and writes the before/after diff to content/verification/<slug>-merge-diff.md.
 */
import fs from "node:fs";
import path from "node:path";
import { AttemptLog, Guide, GuideShape, type FactorKey } from "../src/lib/schema/guide";
import { mergeAttempt, diffGuides } from "../src/lib/attemptmerge";
import { validateGuide } from "../src/lib/validate";

const [slug, ...rest] = process.argv.slice(2);
if (!slug) { console.error("Usage: tsx scripts/merge-attempt.ts <slug> [--factor key=value ...]"); process.exit(2); }
const factorUpdates: Partial<Record<FactorKey, string>> = {};
for (let i = 0; i < rest.length; i++) if (rest[i] === "--factor") { const [k, v] = (rest[++i] ?? "").split("="); if (k && v) factorUpdates[k as FactorKey] = v; }

const guideFile = path.join("content", "guides", `${slug}.json`);
const logFile = path.join("content", "attempts", `${slug}.json`);
for (const f of [guideFile, logFile]) if (!fs.existsSync(f)) { console.error(`Missing ${f}`); process.exit(2); }

const before = GuideShape.parse(JSON.parse(fs.readFileSync(guideFile, "utf8")));
const log = AttemptLog.parse(JSON.parse(fs.readFileSync(logFile, "utf8")));
const { guide: merged } = mergeAttempt(before, log, { factorUpdates });
const v = validateGuide(merged);
const final = v.guide ? Guide.safeParse(v.guide) : null;
if (!v.guide || !final?.success) {
  console.error("Merged guide failed validation; nothing was written:");
  (v.errors ?? []).forEach((e) => console.error(`  - ${e}`));
  if (final && !final.success) final.error.issues.slice(0, 8).forEach((i) => console.error(`  - ${i.path.join(".")}: ${i.message}`));
  process.exit(1);
}
const diff = diffGuides(before, v.guide);
if (diff.length < 3) { console.error("The merged guide barely differs from the draft; refusing to write (spec 6.9 requires a visible difference)."); process.exit(1); }
fs.writeFileSync(guideFile, JSON.stringify(v.guide, null, 2) + "\n");
fs.mkdirSync(path.join("content", "verification"), { recursive: true });
fs.writeFileSync(path.join("content", "verification", `${slug}-merge-diff.md`), `# Walkthrough merge diff: ${slug}\n\nMerged ${log.date}. Draft -> merged.\n\n${diff.map((d) => `- ${d}`).join("\n")}\n`);
console.log(`Merged ${slug}: ${diff.length} change(s) written to content/verification/${slug}-merge-diff.md`);
v.warnings.forEach((w) => console.log(`  warning: ${w}`));
