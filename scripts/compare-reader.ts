/**
 * Compares the public-path trace with and without the model page-reader. Read-only GETs, no writes to content/.
 *   npx tsx --env-file=.env.local scripts/compare-reader.ts [--only github,zoom]
 * Prints per-hop classification, the model's reading and which one chose the link. Never prints keys.
 */
import fs from "node:fs";
import { openAiClient } from "../src/lib/llm";
import { realProbeGet, runProbes } from "../src/lib/probe";
import { makeReader } from "../src/lib/probe/reader";

const only = process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1].split(",") : null;
const SET: { name: string; site: string; docs: string[]; steps?: string[] }[] = [
  { name: "github", site: "github.com", docs: ["https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app"] },
  { name: "gmail", site: "google.com", docs: ["https://developers.google.com/identity/protocols/oauth2"] },
  { name: "linkedin", site: "linkedin.com", docs: ["https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication"] },
  { name: "zoom", site: "zoom.us", docs: ["https://developers.zoom.us/docs/integrations/oauth/"] },
  { name: "dropbox", site: "dropbox.com", docs: ["https://www.dropbox.com/developers/documentation/http/documentation"] },
  { name: "hubspot", site: "hubspot.com", docs: ["https://developers.hubspot.com/docs/api/oauth-quickstart-guide"] },
];

async function run(item: (typeof SET)[number], useReader: boolean) {
  const llm = openAiClient();
  const model = process.env.MODEL_FAST!;
  const sources = item.docs.map((url, i) => ({ id: `s${i}`, url, publisher: "official" as const })) as never;
  const t0 = Date.now();
  const o = await runProbes({
    steps: [], docsUrls: item.docs, providerSite: item.site, providerDomains: [item.site], sources, get: realProbeGet(), now: () => new Date(),
    ...(useReader ? { reader: makeReader(llm, model, { appName: item.name, goal: "Registering your own OAuth app for a product that connects your customers' accounts" }) } : {}),
  });
  return { o, seconds: Math.round((Date.now() - t0) / 1000) };
}

async function main() {
  const rows: unknown[] = [];
  for (const item of SET.filter((i) => !only || only.includes(i.name))) {
    for (const useReader of [false, true]) {
      try {
        const { o, seconds } = await run(item, useReader);
        const t = o.flowTrace;
        console.log(`\n== ${item.name} | reader ${useReader ? "ON " : "off"} | ${seconds}s | ended: ${t?.endedAt} | ${t?.endedReason.slice(0, 110)}`);
        for (const h of t?.hops ?? []) {
          const r = h.reading;
          console.log(`  ${h.n}. [${h.chosenBy}] ${h.classification.padEnd(16)} ${new URL(h.url).host}${new URL(h.url).pathname.slice(0, 50)}${r ? `\n       reading: ${r.category}${r.other ? ` (${r.other})` : ""} ${r.confidence} quote:${r.quoteVerified ? "ok" : "NOT FOUND"} ${r.agreement}` : ""}`);
        }
        rows.push({ app: item.name, reader: useReader, seconds, endedAt: t?.endedAt, hops: t?.hops.map((h) => ({ url: h.url, c: h.classification, by: h.chosenBy, reading: h.reading?.category, agreement: h.reading?.agreement })) });
      } catch (e) {
        console.log(`== ${item.name} reader ${useReader}: failed: ${(e as Error).message.slice(0, 120)}`);
      }
    }
  }
  fs.mkdirSync(".cache", { recursive: true });
  fs.writeFileSync(`.cache/compare-reader-${Date.now()}.json`, JSON.stringify(rows, null, 2));
}
main();
