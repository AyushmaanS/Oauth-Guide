/**
 * Runs fast mode over the unfamiliar-app test set (in-process, no HTTP).
 *   npm run smoke -- [--gather agent|fixed] [--apps "Zoom,Dropbox"] [--concurrency 2]
 * Prints a table and saves details to .cache/smoke-<time>.json. Never prints keys.
 */
import fs from "node:fs";
import { openAiClient, type LlmClient } from "../src/lib/llm";
import { tavilyProvider, type SearchProvider } from "../src/lib/search";
import { fetchDirectory } from "../src/lib/pipeline/composio";
import { runPipeline } from "../src/lib/pipeline";
import { InputError } from "../src/lib/pipeline/resolve";

const ARGS = process.argv.slice(2);
const arg = (k: string) => { const i = ARGS.indexOf(`--${k}`); return i >= 0 ? ARGS[i + 1] : undefined; };
const SET: { q: string; expect: "guide" | "graceful" }[] = [
  ...["Zoom", "Dropbox", "HubSpot", "Atlassian", "Spotify", "Shopify", "X (Twitter)", "Frame.io"].map((q) => ({ q, expect: "guide" as const })),
  { q: "Craigslist", expect: "graceful" },
  { q: "asdkj qwe zxcv", expect: "graceful" },
];
const apps = arg("apps") ? arg("apps")!.split(",").map((q) => ({ q: q.trim(), expect: "guide" as const })) : SET;
const gather = arg("gather") as "agent" | "fixed" | undefined; // undefined = pipeline default
const conc = Number(arg("concurrency") ?? 2);
const models = { fast: process.env.MODEL_FAST!, deep: process.env.MODEL_DEEP! };

async function one(item: (typeof SET)[number]) {
  let llmCalls = 0, searchCalls = 0, extractCalls = 0;
  const base = openAiClient();
  const llm: LlmClient = { complete: (a) => (llmCalls++, base.complete(a)) };
  const ts = tavilyProvider();
  const search: SearchProvider = { search: (q, m) => (searchCalls++, ts.search(q, m)), extract: (u) => (extractCalls++, ts.extract(u)) };
  const t0 = Date.now();
  const row: Record<string, unknown> = { app: item.q, expect: item.expect, gather };
  try {
    const r = await runPipeline({ query: item.q, mode: "fast", gather, models, deps: { llm, search, composio: () => fetchDirectory(), now: () => new Date() }, ctx: { deadline: Date.now() + 170_000, emit: () => {} } });
    const g = r.guide;
    row.seconds = Math.round((Date.now() - t0) / 1000);
    row.llmCalls = llmCalls; row.searchCalls = searchCalls; row.extractCalls = extractCalls;
    if (!g) { row.outcome = "no guide"; row.errors = r.errors; row.pass = item.expect === "graceful"; return row; }
    const labels = [...g.steps.map((s) => s.evidence.label), ...g.requirements.map((c) => c.evidence.label), ...g.scopesAndNuances.map((c) => c.evidence.label)];
    Object.assign(row, {
      outcome: "guide", difficulty: g.verdict.difficulty, confidence: g.verdict.difficultyConfidence, range: g.verdict.difficultyRange, inferred: g.verdict.inference?.length ?? 0, checkFirst: g.verdict.checkFirst, estimates: [g.verdict.timeToCredentials, g.verdict.timeToProduction, g.verdict.humanEffortHours].filter((r) => "estimate" in r && (r as { estimate?: boolean }).estimate).length, trace: g.research.steps, complete: g.complete, method: g.research.method, sources: g.sources.length,
      official: g.sources.filter((s) => s.publisher === "official").length, steps: g.steps.length,
      covered: g.research.checklist.filter((c) => c.status === "covered").length, unverifiedClaims: labels.filter((l) => l === "unverified").length, claims: labels.length,
      warnings: g.warnings.length, warningList: g.warnings.map((w) => w.slice(0, 160)), factors: g.verdict.factors, summary: g.verdict.summary.slice(0, 140),
    });
    const coherent = g.complete && g.sources.length >= 3 && (row.official as number) >= 1 && g.steps.length >= 3;
    row.pass = item.expect === "guide" ? coherent && (row.seconds as number) <= 150 : true;
  } catch (e) {
    row.seconds = Math.round((Date.now() - t0) / 1000);
    row.outcome = e instanceof InputError ? `rejected: ${e.message}` : `crash: ${(e as Error).message.slice(0, 120)}`;
    row.pass = item.expect === "graceful" && e instanceof InputError;
  }
  return row;
}

async function main() {
  const out: Record<string, unknown>[] = [];
  const queue = [...apps];
  await Promise.all(Array.from({ length: conc }, async () => {
    for (let it = queue.shift(); it; it = queue.shift()) {
      const row = await one(it);
      out.push(row);
      console.log(`${row.pass ? "PASS" : "FAIL"} ${String(row.app).padEnd(16)} ${String(row.seconds).padStart(4)}s ${String(row.outcome)} ${row.difficulty ?? ""}/${row.confidence ?? "-"} inf=${row.inferred ?? "-"} src=${row.sources ?? "-"}/${row.official ?? "-"}off cov=${row.covered ?? "-"} llm=${row.llmCalls ?? "-"} ${row.method ?? ""}`);
    }
  }));
  fs.mkdirSync(".cache", { recursive: true });
  const file = `.cache/smoke-${gather ?? "default"}-${Date.now()}.json`;
  fs.writeFileSync(file, JSON.stringify(out, null, 2));
  const expectGuide = out.filter((r) => r.expect === "guide");
  console.log(`\n${expectGuide.filter((r) => r.pass).length}/${expectGuide.length} unfamiliar apps passed; graceful cases: ${out.filter((r) => r.expect === "graceful").map((r) => `${r.app}=${r.pass ? "ok" : "BAD"}`).join(", ")}\nDetails: ${file}`);
}
main();
