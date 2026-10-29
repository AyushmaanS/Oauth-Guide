/**
 * Deep mode CLI: npm run guide -- "GitHub"
 * Writes content/guides/<slug>.json only after validation passes. Prints progress and warnings, never keys.
 */
import fs from "node:fs";
import path from "node:path";
import { openAiClient } from "../src/lib/llm";
import { tavilyProvider } from "../src/lib/search";
import { fetchDirectory } from "../src/lib/pipeline/composio";
import { runPipeline } from "../src/lib/pipeline";
import { InputError } from "../src/lib/pipeline/resolve";

async function main() {
  const query = process.argv.slice(2).join(" ").trim();
  if (!query) {
    console.error('Usage: npm run guide -- "<app name or website>"');
    process.exit(2);
  }
  const models = { fast: process.env.MODEL_FAST || "", deep: process.env.MODEL_DEEP || "" };
  if (!models.fast || !models.deep) throw new Error("MODEL_FAST and MODEL_DEEP must be set in .env.local");
  const t0 = Date.now();
  try {
    const r = await runPipeline({
      query,
      mode: "deep",
      models,
      deps: { llm: openAiClient(), search: tavilyProvider(), composio: () => fetchDirectory(), now: () => new Date() },
      ctx: {
        emit: (e) => {
          if (e.type === "stage_start") console.log(`→ ${e.label}...`);
          else if (e.type === "source_found") console.log(`   source: ${e.url}`);
        },
      },
    });
    console.log(`\nFinished in ${Math.round((Date.now() - t0) / 1000)} s`);
    r.warnings.forEach((w) => console.log(`  warning: ${w}`));
    if (!r.guide) {
      console.error("\nValidation failed; nothing was written:");
      r.errors.forEach((e) => console.error(`  - ${e}`));
      process.exit(1);
    }
    const out = path.join("content", "guides", `${r.guide.slug}.json`);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, JSON.stringify(r.guide, null, 2) + "\n");
    const g = r.guide;
    console.log(`\nWrote ${out}`);
    console.log(`  difficulty=${g.verdict.difficulty} complete=${g.complete} sources=${g.sources.length} steps=${g.steps.length}`);
    console.log(`  summary: ${g.verdict.summary}`);
  } catch (e) {
    if (e instanceof InputError) console.error(`Invalid input: ${e.message}`);
    else console.error(`Failed: ${(e as Error).message}`);
    process.exit(1);
  }
}
main();
