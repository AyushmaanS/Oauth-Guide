import type { GuideShape, ProbeResult, RequirementTag } from "@/lib/schema/guide";
import { applyOwners, deriveHandoff } from "@/lib/handoff";
import type { Observations } from "./index";
import { CATEGORY_TEXT, GATE_CATEGORIES } from "./reader";

const CLEAR = ["public", "login_redirect", "captcha_or_bot", "forbidden", "not_found", "input_required"];
const norm = (u: string) => u.replace(/#.*$/, "").replace(/\/$/, "");

/**
 * Merge probe, trace and metadata observations into a draft guide (spec 5b, 5c). Deterministic.
 * Tested evidence is scoped to what was observed: that a page was reachable or gated on a date, nothing behind it.
 */
export function applyObservations(g: GuideShape, o: Observations): GuideShape {
  const date = (o.probe[0]?.checkedAt ?? o.flowTrace?.checkedAt ?? new Date().toISOString()).slice(0, 10);
  g.probe = o.probe;
  if (o.flowTrace) g.flowTrace = o.flowTrace;
  if (o.providerMetadata) g.providerMetadata = o.providerMetadata;
  g.warnings.push(...o.warnings);

  const byUrl = new Map<string, ProbeResult>(o.probe.map((p) => [norm(p.url), p]));
  const hopByN = new Map((o.flowTrace?.hops ?? []).map((h) => [h.n, h]));

  for (const s of g.steps) {
    let pr: ProbeResult | undefined = s.url ? byUrl.get(norm(s.url)) : undefined;
    const hopN = o.stepHops.get(s.order);
    if (!pr && hopN) {
      const h = hopByN.get(hopN);
      if (h) pr = byUrl.get(norm(h.url));
    }
    if (hopN) s.traceHop = hopN;
    if (!pr || !CLEAR.includes(pr.classification)) continue;
    s.observed = true;
    s.evidence = {
      label: "tested",
      sourceIds: s.evidence.sourceIds,
      testNote: `Only reachability was observed: a read-only GET of this page on ${date} was classified "${pr.classification}"${pr.finalHost ? ` (host ${pr.finalHost})` : ""}.`,
      observationRef: pr.url,
    };
    const add = (t: RequirementTag) => { if (!s.requires.includes(t)) s.requires = [...s.requires, t]; };
    if (pr.classification === "login_redirect") add("login_or_account");
    if (pr.classification === "captcha_or_bot") add("captcha_or_bot_check");
    if (pr.classification === "not_found") g.tested.unverified.push(`Step ${s.order}: the provider page we linked returned "not found" on ${date}; the link may be outdated.`);
  }

  // Model readings are interpretation, never a tested observation: they add no requirement tag and no "tested" label.
  // A confident, quote-verified gate reading that the code did not see is stated plainly as unverified.
  for (const p of o.probe) {
    const r = p.reading;
    if (!r || !r.quoteVerified || r.confidence === "low") continue;
    if (GATE_CATEGORIES.has(r.category) && p.classification === "public")
      g.tested.unverified.push(`A model reading of ${new URL(p.url).pathname || p.url} suggests a ${CATEGORY_TEXT[r.category]} page ("${r.quote.slice(0, 80)}"). The code classified it public, so this is a reading, not an observation.`);
    else if (r.category === "other" && r.other)
      g.tested.unverified.push(`A model reading of ${new URL(p.url).pathname || p.url} described the page as: ${r.other}. This fits none of our categories and is not used.`);
  }

  // Steps and handoff are recomputed from the (possibly extended) tags.
  g.steps = applyOwners(g.steps);
  g.handoff = deriveHandoff(g.steps);

  // Metadata facts become a tested claim (scoped to the document at that URL on that date).
  const m = g.providerMetadata;
  if (m?.found && m.sourceUrl) {
    const bits = [
      m.scopesListed ? `${m.scopesListed.length} scope(s) listed` : null,
      m.pkceMethods?.length ? `PKCE: ${m.pkceMethods.join(", ")}` : null,
      m.dynamicRegistration === "supported" ? "a registration endpoint is listed (dynamic client registration may be possible)" : "no registration endpoint is listed",
    ].filter(Boolean);
    g.scopesAndNuances.push({
      text: `The provider's published OAuth metadata lists: ${bits.join("; ")}.`,
      evidence: { label: "tested", sourceIds: [], testNote: `The metadata document at ${m.sourceUrl} was read on ${date}.`, observationRef: m.sourceUrl },
    });
  }

  // Limits of what was observed are always stated.
  const last = g.flowTrace?.hops[g.flowTrace.hops.length - 1];
  if (g.flowTrace && last) g.tested.unverified.push(`Not observed: anything beyond the end of the public path (${g.flowTrace.endedAt.replace(/_/g, " ")} at ${last.url}).`);
  if (!g.flowTrace) g.tested.unverified.push("No public path could be traced for this guide.");
  g.tested.unverified.push("No account was used: steps after the first sign-in are inferred from documentation, not observed.");

  // Attempt level: L2 only if something clear was observed, and never beyond what was done.
  if (g.attemptLevel === "L1") {
    const clear = g.probe.filter((p) => CLEAR.includes(p.classification)).length;
    if (clear > 0) {
      g.attemptLevel = "L2";
      g.attemptLevelReason = `Gate probed: ${g.probe.length} page(s) requested read-only on ${date}${g.flowTrace ? `; public path followed for ${g.flowTrace.hops.length} page(s) (${g.flowTrace.endedAt.replace(/_/g, " ")})` : ""}. No account was used.`;
    } else g.attemptLevelReason = "Documentation read. Probing found no clearly classifiable page, so nothing was observed.";
  }
  return g;
}
