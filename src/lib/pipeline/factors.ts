import { callJson } from "@/lib/llm";
import { FACTORS_SYSTEM, FactorsOut } from "./prompts/factors";
import { sourceBundle } from "./prompts/common";
import type { Deps, Gathered, Resolved } from "./types";

export async function extractFactors(app: Resolved, g: Gathered, deps: Deps, model: string): Promise<FactorsOut> {
  const out = await callJson({
    llm: deps.llm,
    model,
    system: FACTORS_SYSTEM,
    user: `App: ${app.appName} (provider site ${app.providerSite})\n\n${sourceBundle(g.sources, g.texts)}`,
    schema: FactorsOut,
    maxTokens: 3000,
    timeoutMs: 120000,
  });
  const known = new Set(g.sources.map((s) => s.id));
  out.claims = out.claims.map((c) => ({ ...c, sourceIds: c.sourceIds.filter((id) => known.has(id)) }));
  return out;
}
