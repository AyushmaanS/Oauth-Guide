import type { Claim, Evidence, Guide, Range } from "@/lib/schema/guide";
import { formatRange } from "@/components/VerdictCard";

const ev = (e: Evidence) => {
  const refs = e.sourceIds.map((id) => `[${id.replace(/^s/, "")}]`).join("");
  return `**${e.label[0].toUpperCase()}${e.label.slice(1)}**${refs ? " " + refs : ""}${e.testNote ? ` — ${e.testNote}` : ""}`;
};
const claims = (list: Claim[]) => (list.length ? list.map((c) => `- ${c.text} (${ev(c.evidence)})`).join("\n") : "- None recorded.");
const range = (label: string, r: Range) => `- **${label}:** ${formatRange(r)} — ${r.basis} (${ev(r.evidence)})`;

/** Pure, deterministic export of a guide as readable markdown with evidence labels and sources. */
export function guideToMarkdown(g: Guide): string {
  const v = g.verdict;
  const out: string[] = [];
  out.push(`# ${g.appName} — OAuth app setup guide`);
  out.push(
    `*${g.mode === "library" ? "Library (deep research)" : "Live-generated"} · generated ${g.generatedAt.slice(0, 10)} · attempt level ${g.attemptLevel}: ${g.attemptLevelReason}*`,
  );
  if (!g.complete) out.push("> **Incomplete guide.** Some stages did not finish; treat missing parts as unverified.");
  out.push(`## Verdict: ${v.difficulty.toUpperCase()}`);
  out.push(`${v.summary}\n\n*For use case:* ${v.useCase}. *Why this label:* ${v.difficultyReason}`);
  out.push(range("Time to first credentials", v.timeToCredentials));
  out.push(
    "none" in v.timeToProduction
      ? `- **Time to production:** no approval required (${ev(v.timeToProduction.evidence)})`
      : range("Time to production / approval", v.timeToProduction),
  );
  out.push(range("Your effort", v.humanEffortHours));
  out.push(`\n**Biggest risk to your launch date:** ${v.biggestLaunchRisk}`);
  out.push(`## Managed OAuth vs your own app\nComposio-managed: ${g.managedVsOwn.composioManaged}\n\n**Managed covers**\n${claims(g.managedVsOwn.managedCovers)}\n\n**You need your own app when**\n${claims(g.managedVsOwn.youNeedOwnWhen)}`);
  out.push(`## Before you start\n${claims(g.requirements)}`);
  out.push(
    `## Steps\n` +
      g.steps
        .map((s) => {
          const who = { agent: "Agent", you: "You", provider_wait: "Waiting on provider" }[s.actor];
          return `${s.order}. **${s.title}** — ${who}, ${s.estimate} (${s.observed ? "observed" : "inferred"}; ${ev(s.evidence)})\n   ${s.detail}${s.agentPrep ? `\n   Agent prepares: ${s.agentPrep}` : ""}${s.url ? `\n   ${s.url}` : ""}`;
        })
        .join("\n"),
  );
  out.push(`## Scopes and nuances\n${claims(g.scopesAndNuances)}`);
  out.push(
    `## Blockers and fixes\n` +
      (g.blockers.length ? g.blockers.map((b) => `- **${b.problem}** → ${b.fix}${b.contact ? ` (${b.contact})` : ""} (${ev(b.evidence)})`).join("\n") : "- None recorded."),
  );
  out.push(`## What an agent can do vs where you take over\n**Agent**\n${claims(g.handoff.agentCanDo)}\n\n**You**\n${claims(g.handoff.youMustDo)}\n\n**Provider wait**\n${claims(g.handoff.providerWait)}`);
  const obs: string[] = [];
  if (g.flowTrace) obs.push(`**Public path followed:** ${g.flowTrace.hops.map((h) => `${h.title ?? h.url} [${h.classification}]`).join(" → ")}. ${g.flowTrace.endedReason}`);
  if (g.probe.length) obs.push("**Gate probe**\n" + g.probe.map((p) => `- ${p.url} → ${p.classification} (${p.checkedAt.slice(0, 10)})`).join("\n"));
  if (g.providerMetadata) obs.push(g.providerMetadata.found ? `**Provider metadata:** found at ${g.providerMetadata.sourceUrl}; dynamic registration: ${g.providerMetadata.dynamicRegistration}.` : "**Provider metadata:** not published at standard locations.");
  if (g.attempt) obs.push(`**Walkthrough (${g.attempt.date}):** stopped at ${g.attempt.stoppedAt}.\n` + g.attempt.steps.map((s) => `- ${s.id}: ${s.action} → ${s.outcome}. ${s.observation}`).join("\n"));
  obs.push("**Open uncertainties**\n" + (g.tested.unverified.length ? g.tested.unverified.map((u) => `- ${u}`).join("\n") : "- None recorded."));
  out.push(`## How far we observed\n${obs.join("\n\n")}`);
  out.push(`## Sources\n` + g.sources.map((s) => `${s.id.replace(/^s/, "")}. [${s.title}](${s.url}) — ${s.publisher}, retrieved ${s.retrievedAt}`).join("\n"));
  out.push(`## Do this next\n${g.nextAction}`);
  if (g.warnings.length) out.push(`## Warnings\n${g.warnings.map((w) => `- ${w}`).join("\n")}`);
  return out.join("\n\n") + "\n";
}
