"use client";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./ui";

export interface ProgressState {
  stages: { stage: string; label: string; done: boolean }[];
  steps: { n: number; action: "search" | "read"; target: string; reason: string }[];
  sources: { title: string; url: string }[];
  checklist: { item: string; status: "pending" | "covered" | "partial" | "not_found" }[];
  warnings: string[];
}
export const emptyProgress = (): ProgressState => ({ stages: [], steps: [], sources: [], checklist: [], warnings: [] });

const STATUS: Record<string, { text: string; tone: string; icon: "clock" | "check" | "alert" | "x" }> = {
  pending: { text: "pending", tone: "unknown", icon: "clock" },
  covered: { text: "covered", tone: "tested", icon: "check" },
  partial: { text: "partial", tone: "reported", icon: "alert" },
  not_found: { text: "not found", tone: "hard", icon: "x" },
};
const ITEM: Record<string, string> = {
  registration: "How to register", review_process: "Review process", scopes_restrictions: "Scopes and limits", timing_evidence: "Timing evidence",
  requirements: "Requirements", rate_limits: "Rate limits", community_reports: "Community reports",
};
const EXPECTED_STAGES = 9;

function host(u: string) {
  try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; }
}

/** Live view of a generation run: stages, what the research agent is doing, sources as they arrive, and checklist coverage. */
export function ProgressPanel({ p, subject }: { p: ProgressState; subject?: string }) {
  const [secs, setSecs] = useState(0);
  const root = useRef<HTMLElement>(null);
  useEffect(() => { root.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, []);
  const finished = p.stages.length > 0 && p.stages.every((s) => s.done) && p.stages.some((s) => s.stage === "validate");
  useEffect(() => {
    if (finished) return;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [finished]);
  const done = p.stages.filter((s) => s.done).length;
  const pct = finished ? 100 : Math.min(96, Math.round((done / EXPECTED_STAGES) * 100) + (p.stages.length > done ? 4 : 0));
  const mm = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
  return (
    <section ref={root} aria-label="Generation progress" aria-live="polite" className="card enter mt-6 scroll-mb-6 overflow-hidden text-left">
      <div className="h-1.5 w-full bg-[var(--line)]"><div className="h-full bg-accent transition-all duration-700" style={{ width: `${pct}%` }} /></div>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="tone-accent grid h-9 w-9 place-items-center rounded-full pulse" style={{ background: "color-mix(in srgb, var(--tone) 14%, var(--surface))", color: "var(--tone)" }}><Icon name="sparkles" className="h-4 w-4" /></span>
          <div>
            <p className="display text-2xl leading-none">{finished ? "Guide ready" : subject ? `Researching ${subject}` : "Researching"}</p>
            <p className="mt-1 text-xs text-muted">Live guides are researched quickly and carry lighter evidence than library guides.</p>
          </div>
        </div>
        <p className="font-mono text-sm text-ink-2" aria-label="Elapsed time">{mm}</p>
      </header>

      <div className="grid gap-px bg-[var(--line)] lg:grid-cols-[17rem_1fr]">
        <div className="bg-surface p-5">
          <h3 className="eyebrow mb-3">Stages</h3>
          <ol className="relative space-y-3">
            {p.stages.length === 0 && <li className="text-sm text-muted">Starting…</li>}
            {p.stages.map((s, i) => {
              const active = !s.done && i === p.stages.length - 1;
              return (
                <li key={s.stage} className="enter flex items-start gap-3 text-sm">
                  <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${s.done ? "border-transparent bg-[var(--tested)] text-[var(--surface)]" : "border-line-strong"}`}>
                    {s.done ? <Icon name="check" className="h-3 w-3" /> : active ? <Icon name="loader" className="h-3 w-3 text-accent" spin /> : null}
                  </span>
                  <span className={s.done ? "text-ink-2" : "font-medium text-ink"}>{s.label}</span>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="space-y-6 bg-surface p-5">
          {p.steps.length > 0 && (
            <div>
              <h3 className="eyebrow mb-3">What the research agent is doing</h3>
              <ol className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {p.steps.map((s) => (
                  <li key={s.n} className="enter flex gap-3 rounded-xl border border-line bg-surface-2/50 p-2.5 text-sm">
                    <span className={`tone-${s.action === "search" ? "documented" : "agent"} grid h-7 w-7 shrink-0 place-items-center rounded-lg`} style={{ background: "color-mix(in srgb, var(--tone) 13%, var(--surface))", color: "var(--tone)" }}>
                      <Icon name={s.action === "search" ? "search" : "file"} className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block break-words font-medium text-ink"><span className="mr-1.5 font-mono text-xs text-muted">{s.n}</span>{s.action === "search" ? "Searching" : "Reading"}: {s.target}</span>
                      <span className="block text-xs leading-snug text-muted">{s.reason}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {p.checklist.length > 0 && (
            <div>
              <h3 className="eyebrow mb-3">Research checklist</h3>
              <ul className="grid gap-2 sm:grid-cols-2">
                {p.checklist.map((c) => {
                  const st = STATUS[c.status];
                  return (
                    <li key={c.item} className={`tone-${st.tone} chip !justify-between !rounded-xl !px-3 !py-2 !text-sm !font-medium`}>
                      <span>{ITEM[c.item] ?? c.item}</span>
                      <span className="flex items-center gap-1 text-xs font-semibold"><Icon name={st.icon} className="h-3.5 w-3.5" />{st.text}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {p.sources.length > 0 && (
            <div>
              <h3 className="eyebrow mb-3">Sources found · {p.sources.length}</h3>
              <ul className="flex flex-wrap gap-2">
                {p.sources.map((s) => (
                  <li key={s.url} className="enter flex max-w-full items-center gap-2 rounded-full border border-line bg-surface-2/60 py-1 pl-1 pr-3 text-xs" title={s.url}>
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-surface font-bold text-ink-2">{host(s.url)[0]?.toUpperCase()}</span>
                    <span className="truncate"><span className="font-medium text-ink">{host(s.url)}</span> <span className="text-muted">· {s.title}</span></span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {p.steps.length === 0 && p.sources.length === 0 && p.checklist.length === 0 && (
            <div className="space-y-3" aria-hidden="true">
              <div className="shimmer h-10 rounded-xl border border-line" /><div className="shimmer h-10 rounded-xl border border-line" /><div className="shimmer h-10 w-2/3 rounded-xl border border-line" />
            </div>
          )}
        </div>
      </div>
      {p.warnings.length > 0 && (
        <ul className="border-t border-line bg-[color-mix(in_srgb,var(--moderate)_8%,var(--surface))] px-5 py-3 text-xs text-ink">
          {p.warnings.map((w, i) => (<li key={i} className="flex gap-2"><Icon name="alert" className="mt-0.5 h-3.5 w-3.5 text-[var(--moderate)]" />{w}</li>))}
        </ul>
      )}
    </section>
  );
}
