import type { ReactNode } from "react";
import type { Guide } from "@/lib/schema/guide";
import { guideToMarkdown } from "@/lib/markdown";
import { AttemptLevelBadge } from "./badges";
import { ClaimList } from "./Claims";
import { HandoffTable } from "./HandoffTable";
import { AttemptLogView, FlowTraceView, ProbeList, ProviderMetadataPanel, TestedPanel } from "./ObservationPanels";
import { ShareBar } from "./ShareBar";
import { SourceList } from "./SourceList";
import { StepList } from "./StepList";
import { VerdictCard } from "./VerdictCard";

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-8">
      <h2 id={id} className="mb-3 text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export function GuideView({ guide }: { guide: Guide }) {
  const counts = { tested: 0, documented: 0, reported: 0, unverified: 0 };
  const tally = (l: keyof typeof counts) => (counts[l] += 1);
  guide.steps.forEach((s) => tally(s.evidence.label));
  [...guide.requirements, ...guide.scopesAndNuances, ...guide.managedVsOwn.managedCovers, ...guide.managedVsOwn.youNeedOwnWhen].forEach((c) => tally(c.evidence.label));
  guide.blockers.forEach((b) => tally(b.evidence.label));

  return (
    <article className="mx-auto max-w-4xl px-4 py-8">
      {!guide.complete && (
        <div role="alert" className="mb-4 rounded border border-red-700 bg-red-50 p-3 text-sm text-red-950">
          <strong>Incomplete guide.</strong> Some stages did not finish. Missing parts are unverified.
        </div>
      )}
      {guide.mode === "live" && (
        <div className="mb-4 rounded border border-blue-700 bg-blue-50 p-3 text-sm text-blue-950">
          <strong>Live-generated.</strong> Researched quickly by a bounded agent. Lighter evidence than library guides.
        </div>
      )}
      {guide.warnings.length > 0 && (
        <details className="mb-4 rounded border border-gray-400 p-3 text-sm">
          <summary className="cursor-pointer font-medium">{guide.warnings.length} pipeline warning(s)</summary>
          <ul className="mt-2 list-disc pl-5">{guide.warnings.map((w, i) => (<li key={i}>{w}</li>))}</ul>
        </details>
      )}

      <header>
        <h1 className="text-3xl font-semibold">{guide.appName}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded border border-gray-500 px-2 py-0.5 text-xs">{guide.mode === "library" ? "Library (deep research)" : "Live-generated"}</span>
          <AttemptLevelBadge level={guide.attemptLevel} />
          <span className="text-gray-700">{guide.providerSite} · generated {guide.generatedAt.slice(0, 10)}</span>
        </div>
        <p className="mt-2 text-sm text-gray-800">{guide.attemptLevelReason}</p>
        <p className="mt-2 text-sm text-gray-800">
          Claims: {counts.tested} tested · {counts.documented} documented · {counts.reported} reported · {counts.unverified} unverified
        </p>
        <div className="mt-3"><ShareBar markdown={guideToMarkdown(guide)} /></div>
      </header>

      <div className="mt-6"><VerdictCard guide={guide} /></div>

      <Section id="managed" title="Managed OAuth or your own app?">
        <p className="mb-2 text-sm">Composio-managed OAuth available: <strong>{guide.managedVsOwn.composioManaged}</strong>{guide.managedVsOwn.source ? ` (${guide.managedVsOwn.source})` : ""}</p>
        <h3 className="font-semibold">Managed OAuth covers</h3>
        <ClaimList claims={guide.managedVsOwn.managedCovers} />
        <h3 className="mt-3 font-semibold">You need your own app when</h3>
        <ClaimList claims={guide.managedVsOwn.youNeedOwnWhen} />
      </Section>
      <Section id="requirements" title="Before you start"><ClaimList claims={guide.requirements} /></Section>
      <Section id="steps" title="Step-by-step path"><StepList steps={guide.steps} /></Section>
      <Section id="scopes" title="Scopes and nuances"><ClaimList claims={guide.scopesAndNuances} /></Section>
      <Section id="blockers" title="Blockers and fixes">
        {guide.blockers.length === 0 ? <p className="text-sm text-gray-600">None recorded.</p> : (
          <ul className="space-y-3">
            {guide.blockers.map((b, i) => (
              <li key={i} className="rounded border border-gray-300 p-3 text-sm">
                <strong>{b.problem}</strong>
                <p>Fix: {b.fix}</p>
                {b.contact && <p className="text-xs text-gray-700">Contact: {b.contact}</p>}
              </li>
            ))}
          </ul>
        )}
      </Section>
      <Section id="handoff" title="What an agent can do vs. where you take over"><HandoffTable handoff={guide.handoff} /></Section>

      <Section id="observed" title="How far we observed, what we tested, what we could not verify">
        <h3 className="mb-1 font-semibold">Public path we could follow</h3><FlowTraceView trace={guide.flowTrace} />
        <h3 className="mb-1 mt-4 font-semibold">Gate probe</h3><ProbeList probe={guide.probe} />
        <h3 className="mb-1 mt-4 font-semibold">Provider OAuth metadata</h3><ProviderMetadataPanel meta={guide.providerMetadata} />
        {guide.attempt && (<><h3 className="mb-1 mt-4 font-semibold">Signed-in walkthrough</h3><AttemptLogView attempt={guide.attempt} /></>)}
        <h3 className="mb-1 mt-4 font-semibold">Open uncertainties</h3><TestedPanel items={guide.tested.unverified} />
        <h3 className="mb-1 mt-4 font-semibold">How this was researched</h3>
        <p className="text-sm">
          Method: {guide.research.method}. {guide.research.actionsUsed} agent actions, {guide.research.pageReads} pages read.
          Checklist: {guide.research.checklist.map((c) => `${c.item} (${c.status.replace("_", " ")})`).join(", ")}.
        </p>
      </Section>

      <Section id="sources" title="Sources"><SourceList sources={guide.sources} /></Section>
      <Section id="next" title="Do this next"><p className="text-lg">{guide.nextAction}</p></Section>
    </article>
  );
}
