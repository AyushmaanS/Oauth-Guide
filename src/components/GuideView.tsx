import Link from "next/link";
import type { ReactNode } from "react";
import type { EvidenceLabel, Guide } from "@/lib/schema/guide";
import { guideToMarkdown } from "@/lib/markdown";
import { buildAttemptKit } from "@/lib/attemptkit";
import { AttemptKitPanel } from "./AttemptKitPanel";
import { ClaimList, EvidenceLine } from "./Claims";
import { ExpandAll } from "./ExpandAll";
import { HandoffTable } from "./HandoffTable";
import { AttemptLogView, FlowTraceView, ProbeList, ProviderMetadataPanel, TestedPanel } from "./ObservationPanels";
import { SectionNav } from "./SectionNav";
import { ShareBar } from "./ShareBar";
import { SourceList } from "./SourceList";
import { StepList } from "./StepList";
import { VerdictCard } from "./VerdictCard";
import { AppTile, EVIDENCE_ORDER, EVIDENCE_TEXT, EvidenceBar, Icon, LevelLadder, SectionHeading, type IconName } from "./ui";

export function evidenceCounts(guide: Guide): Record<EvidenceLabel, number> {
  const counts: Record<EvidenceLabel, number> = { tested: 0, documented: 0, reported: 0, unverified: 0 };
  const tally = (l: EvidenceLabel) => (counts[l] += 1);
  guide.steps.forEach((s) => tally(s.evidence.label));
  [...guide.requirements, ...guide.scopesAndNuances, ...guide.managedVsOwn.managedCovers, ...guide.managedVsOwn.youNeedOwnWhen].forEach((c) => tally(c.evidence.label));
  guide.blockers.forEach((b) => tally(b.evidence.label));
  return counts;
}

function Section({ id, eyebrow, title, intro, children }: { id: string; eyebrow?: string; title: string; intro?: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="scroll-mt-24 border-t border-line pt-10 first:border-t-0 first:pt-0">
      <SectionHeading id={id} eyebrow={eyebrow} title={title}>{intro}</SectionHeading>
      {children}
    </section>
  );
}

function Accordion({ icon, title, count, open, children }: { icon: IconName; title: string; count?: string; open?: boolean; children: ReactNode }) {
  return (
    <details open={open} className="card-flat group overflow-hidden">
      <summary className="flex items-center gap-3 p-4">
        <Icon name={icon} className="h-4 w-4 text-ink-2" />
        <span className="flex-1 text-sm font-semibold text-ink">{title}</span>
        {count && <span className="chip">{count}</span>}
        <Icon name="chevron" className="chev h-4 w-4 text-muted" />
      </summary>
      <div className="border-t border-line p-4">{children}</div>
    </details>
  );
}

const LEVEL_DETAIL: { id: Guide["attemptLevel"]; name: string; text: string }[] = [
  { id: "L1", name: "Docs read", text: "Official and community sources were read. Nothing was observed." },
  { id: "L2", name: "Gate probed", text: "The provider's public pages were requested read-only and the public path followed to the first sign-in wall, bot check or form. No account used." },
  { id: "L3", name: "Walked through", text: "A free account in a separate browser profile was used up to the first step only a human may do." },
];

export function GuideView({ guide }: { guide: Guide }) {
  const counts = evidenceCounts(guide);
  const total = EVIDENCE_ORDER.reduce((n, k) => n + counts[k], 0);
  const observed = guide.steps.filter((s) => s.observed).length;
  const nav = [
    { id: "verdict", label: "Verdict" },
    { id: "path", label: "The path" },
    { id: "handoff", label: "Agent vs you" },
    { id: "needs", label: "Before you start" },
    { id: "scopes", label: "Scopes" },
    { id: "blockers", label: "Blockers" },
    { id: "evidence", label: "How we know" },
    { id: "sources", label: "Sources" },
    { id: "kit", label: "Go further" },
  ];
  const managed = guide.managedVsOwn.composioManaged;

  return (
    <main className="mx-auto max-w-6xl px-4 pb-8 pt-6">
      <Link href="/#library" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"><Icon name="arrow" className="h-3.5 w-3.5 rotate-180" /> Library</Link>

      <div className="mt-3 space-y-3">
        {!guide.complete && (
          <div role="alert" className="tone-hard tint flex gap-3 rounded-xl border p-3.5 text-sm text-ink">
            <Icon name="alert" className="mt-0.5 h-4 w-4 text-[var(--hard)]" /><span><strong>Incomplete guide.</strong> Some stages did not finish. Missing parts are unverified.</span>
          </div>
        )}
        {guide.mode === "live" && (
          <div className="tone-documented tint flex gap-3 rounded-xl border p-3.5 text-sm text-ink">
            <Icon name="sparkles" className="mt-0.5 h-4 w-4 text-[var(--documented)]" /><span><strong>Live-generated.</strong> Researched quickly by a bounded agent. Lighter evidence than library guides.</span>
          </div>
        )}
      </div>

      <header className="mt-5 flex flex-wrap items-start justify-between gap-6">
        <div className="flex min-w-0 items-start gap-4">
          <AppTile name={guide.appName} tone={guide.verdict.difficulty} size="h-14 w-14 text-3xl" />
          <div className="min-w-0">
            <h1 className="display text-3xl sm:text-4xl">{guide.appName}</h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
              <span className="chip tone-ink">{guide.mode === "library" ? "Library · deep research" : "Live-generated"}</span>
              <span className="inline-flex items-center gap-1"><Icon name="globe" className="h-3.5 w-3.5" />{guide.providerSite}</span>
              <span>Generated {guide.generatedAt.slice(0, 10)}</span>
            </p>
          </div>
        </div>
        <ShareBar markdown={guideToMarkdown(guide)} />
      </header>

      <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[12.5rem_minmax(0,1fr)]">
        <aside className="lg:order-first"><SectionNav items={nav} /></aside>

        <div className="min-w-0 space-y-12">
          <div id="verdict" className="scroll-mt-24">
            <VerdictCard guide={guide} />

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <section aria-label="How far we went" className="card-flat p-5">
                <p className="eyebrow mb-3">How far we went</p>
                <LevelLadder level={guide.attemptLevel} />
                <p className="mt-3 text-sm leading-relaxed text-ink-2">{guide.attemptLevelReason}</p>
                <a href="#evidence" className="mt-3 inline-flex items-center gap-1 text-sm font-medium underline underline-offset-4">See what was observed <Icon name="arrow" className="h-3.5 w-3.5" /></a>
              </section>
              <section aria-label="How well evidenced" className="card-flat p-5">
                <p className="eyebrow mb-3">How well evidenced · {total} claims</p>
                <EvidenceBar counts={counts} />
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                  {EVIDENCE_ORDER.map((k) => (
                    <div key={k} className={`tone-${k} flex items-center justify-between gap-2`}>
                      <dt className="flex items-center gap-2 text-ink-2"><span className="dot" />{EVIDENCE_TEXT[k]}</dt>
                      <dd className="font-mono text-ink">{counts[k]}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 text-xs text-muted">{observed} of {guide.steps.length} steps were observed up to a gate; the rest come from documentation.</p>
              </section>
            </div>
          </div>

          <Section id="path" eyebrow="The path" title="Step by step, with who does what"
            intro="A route from sign-in to production. A solid line means we observed that stretch; a dashed line means it comes from documentation. Open a step for detail and evidence.">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
                <span className="inline-flex items-center gap-2"><span className="route-line-solid inline-block h-3 w-0.5" /> observed</span>
                <span className="inline-flex items-center gap-2"><span className="route-line inline-block h-3 w-0.5" /> from documentation</span>
              </div>
              <ExpandAll targetId="route" />
            </div>
            <StepList steps={guide.steps} id="route" />
          </Section>

          <Section id="handoff" eyebrow="Agent versus you" title="Where an agent can help, and where you take over"
            intro="Every step is assigned by code from what it needs: anything that needs a login, a code, a payment or a signature is yours.">
            <HandoffTable handoff={guide.handoff} />
          </Section>

          <Section id="needs" eyebrow="Before you start" title="What you need, and whether you need your own app">
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="eyebrow mb-3">Requirements</h3>
                <ClaimList claims={guide.requirements} collapseAfter={5} />
              </div>
              <div className="card-flat p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold">Managed OAuth or your own app?</h3>
                  <span className={`chip ${managed === "yes" ? "tone-tested" : managed === "no" ? "tone-you" : "tone-unknown chip-dashed"}`}>Composio-managed: {managed}</span>
                </div>
                {guide.managedVsOwn.source && <p className="mt-1 text-xs text-muted">{guide.managedVsOwn.source}</p>}
                <h4 className="eyebrow mb-2 mt-4">Managed OAuth covers</h4>
                <ClaimList claims={guide.managedVsOwn.managedCovers} />
                <h4 className="eyebrow mb-2 mt-4">You need your own app when</h4>
                <ClaimList claims={guide.managedVsOwn.youNeedOwnWhen} />
              </div>
            </div>
          </Section>

          <Section id="scopes" eyebrow="Details that bite" title="Scopes and nuances">
            <ClaimList claims={guide.scopesAndNuances} collapseAfter={6} />
          </Section>

          <Section id="blockers" eyebrow="What goes wrong" title="Blockers and how to get past them">
            {guide.blockers.length === 0 ? <p className="text-sm text-muted">None recorded.</p> : (
              <ul className="grid gap-4 md:grid-cols-2">
                {guide.blockers.map((b, i) => (
                  <li key={i} className={`tone-${b.evidence.label} card-flat flex flex-col overflow-hidden`}>
                    <div className="tone-hard flex gap-3 p-4" style={{ background: "color-mix(in srgb, var(--tone) 7%, var(--surface))" }}>
                      <Icon name="alert" className="mt-0.5 h-4 w-4 text-[var(--hard)]" />
                      <p className="text-sm font-semibold leading-snug text-ink">{b.problem}</p>
                    </div>
                    <div className="flex flex-1 flex-col gap-3 p-4 text-sm">
                      <p className="flex gap-3 leading-relaxed text-ink-2"><Icon name="wrench" className="mt-0.5 h-4 w-4 text-[var(--tested)]" /><span><strong className="text-ink">Fix.</strong> {b.fix}</span></p>
                      {b.contact && <p className="text-xs text-muted">Contact: {b.contact}</p>}
                      <div className="mt-auto"><EvidenceLine evidence={b.evidence} /></div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section id="evidence" eyebrow="How we know" title="What we observed, tested, and could not verify"
            intro="This is the part most guides leave out. Open any panel to see the raw observations behind the verdict.">
            <div className="mb-5 grid gap-3 md:grid-cols-3">
              {LEVEL_DETAIL.map((l) => {
                const reached = ["L1", "L2", "L3"].indexOf(l.id) <= ["L1", "L2", "L3"].indexOf(guide.attemptLevel);
                return (
                  <div key={l.id} className={`rounded-xl border p-4 text-sm ${reached ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_7%,var(--surface))]" : "border-dashed border-line-strong text-muted"}`}>
                    <p className="flex items-center gap-2 font-semibold text-ink"><span className="font-mono text-xs">{l.id}</span>{l.name}{reached && <Icon name="check" className="h-4 w-4 text-[var(--accent)]" />}</p>
                    <p className="mt-1 text-xs leading-relaxed">{l.text}</p>
                  </div>
                );
              })}
            </div>
            <div className="space-y-3">
              <Accordion icon="pin" title="The public path we could follow" open><FlowTraceView trace={guide.flowTrace} /></Accordion>
              <Accordion icon="shield" title="Gate probe" count={`${guide.probe.length} page${guide.probe.length === 1 ? "" : "s"}`}><ProbeList probe={guide.probe} /></Accordion>
              <Accordion icon="book" title="Provider OAuth metadata"><ProviderMetadataPanel meta={guide.providerMetadata} /></Accordion>
              {guide.attempt && <Accordion icon="eye" title="Signed-in walkthrough" count={`${guide.attempt.steps.length} steps`} open={guide.attemptLevel === "L3"}><AttemptLogView attempt={guide.attempt} /></Accordion>}
              {guide.changelog && guide.changelog.length > 0 && (
                <Accordion icon="list" title="Changelog" count={`${guide.changelog.length}`}>
                  <ul className="space-y-2">{guide.changelog.map((l, i) => (<li key={i} className="flex gap-2.5 text-sm leading-relaxed text-ink-2"><Icon name="check" className="mt-0.5 h-4 w-4 text-[var(--tested)]" />{l}</li>))}</ul>
                </Accordion>
              )}
              <Accordion icon="help" title="Open uncertainties" count={`${guide.tested.unverified.length}`}><TestedPanel items={guide.tested.unverified} /></Accordion>
              <Accordion icon="search" title="How this was researched">
                <p className="text-sm text-ink-2">
                  Method: <strong className="text-ink">{guide.research.method}</strong>. {guide.research.actionsUsed} agent actions, {guide.research.pageReads} pages read.
                </p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {guide.research.checklist.map((c) => (
                    <li key={c.item} className={`chip ${c.status === "covered" ? "tone-tested" : c.status === "partial" ? "tone-reported" : "tone-unknown chip-dashed"}`}>
                      <Icon name={c.status === "covered" ? "check" : c.status === "partial" ? "clock" : "x"} className="h-3 w-3" />{c.item.replace(/_/g, " ")} · {c.status.replace("_", " ")}
                    </li>
                  ))}
                </ul>
              </Accordion>
            </div>
            {guide.warnings.length > 0 && (
              <details className="card-flat mt-3 p-4 text-sm">
                <summary className="flex items-center gap-2 font-medium"><Icon name="alert" className="h-4 w-4 text-[var(--moderate)]" />{guide.warnings.length} pipeline warning{guide.warnings.length === 1 ? "" : "s"}<Icon name="chevron" className="chev ml-auto h-4 w-4 text-muted" /></summary>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-ink-2">{guide.warnings.map((w, i) => (<li key={i}>{w}</li>))}</ul>
              </details>
            )}
          </Section>

          <Section id="sources" eyebrow="Sources" title={`${guide.sources.length} sources behind this guide`}>
            <SourceList sources={guide.sources} />
          </Section>

          <section aria-labelledby="next" className="rounded-[var(--radius)] bg-ink p-6 text-paper sm:p-8">
            <p className="eyebrow !text-[color-mix(in_srgb,var(--paper)_65%,transparent)]">Do this next</p>
            <h2 id="next" className="sr-only">Do this next</h2>
            <p className="display mt-2 text-3xl leading-snug sm:text-4xl">{guide.nextAction}</p>
          </section>

          <Section id="kit" eyebrow="Go further" title="Try it yourself, with your own agent">
            <AttemptKitPanel kit={buildAttemptKit(guide)} appName={guide.appName} />
          </Section>
        </div>
      </div>
    </main>
  );
}
