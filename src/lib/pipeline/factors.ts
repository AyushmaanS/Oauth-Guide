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

const KEYS = ["registrationFriction", "reviewRequired", "reviewDepth", "waitMagnitude", "businessEntityRequired"] as const;

/**
 * Cheaper second extraction after the follow-up round: only the NEW sources are shown, with the earlier factors.
 * Code keeps every factor the first pass established; new sources can only settle factors that were "unknown".
 */
export async function refineFactors(app: Resolved, prior: FactorsOut, g: Gathered, newIds: Set<string>, deps: Deps, model: string): Promise<FactorsOut> {
  const fresh = g.sources.filter((s) => newIds.has(s.id));
  const out = await callJson({
    llm: deps.llm,
    model,
    system: FACTORS_SYSTEM,
    user: [
      `App: ${app.appName} (provider site ${app.providerSite})`,
      `Factors extracted earlier from the first sources (JSON): ${JSON.stringify({ useCase: prior.useCase, factors: prior.factors })}`,
      `New sources were added to settle the factors that are still "unknown". Return the FULL JSON object again (useCase, factors, claims). Change a factor only if it was "unknown" and the NEW sources state it; keep all other values as they were. Do not use outside knowledge.`,
      sourceBundle(fresh, g.texts),
    ].join("\n\n"),
    schema: FactorsOut,
    maxTokens: 2500,
    timeoutMs: 90000,
  });
  const merged = { ...out.factors, specialRequirements: [...new Set([...prior.factors.specialRequirements, ...out.factors.specialRequirements])].slice(0, 12) };
  for (const k of KEYS) if (prior.factors[k] !== "unknown") (merged as Record<string, unknown>)[k] = prior.factors[k];
  for (const k of ["docsQuality", "waitBasis"] as const) if (out.factors[k] === prior.factors[k] || prior.factors[k] !== "poor") (merged as Record<string, unknown>)[k] = out.factors[k] ?? prior.factors[k];
  const known = new Set(g.sources.map((s) => s.id));
  return { useCase: prior.useCase, factors: merged, claims: [...prior.claims, ...out.claims.map((c) => ({ ...c, sourceIds: c.sourceIds.filter((id) => known.has(id)) }))].slice(0, 25) };
}
