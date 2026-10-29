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

const RECENT_STEPS = 4;
const SHOWN_SOURCES = 6;

/** Live view of a generation run. One column, no inner scrolling, and no clipped text: long lines wrap, and long lists show the latest few with a count. */
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
  const active = p.stages.find((s) => !s.done);
  const last = p.steps[p.steps.length - 1];
  const now = finished ? "Saving your guide…" : active?.stage === "gather" && last ? `${last.action === "search" ? "Searching" : "Reading"}: ${last.target}` : active?.label ?? "Starting…";
  const recent = p.steps.slice(-RECENT_STEPS).reverse();
  const earlier = p.steps.length - recent.length;

  return (
    <section ref={root} aria-label="Generation progress" aria-live="polite" className="card enter mt-6 scroll-mb-6 overflow-hidden text-left">
      <div className="h-1.5 w-full bg-[var(--line)]"><div className="h-full bg-accent transition-all duration-700" style={{ width: `${pct}%` }} /></div>

      <div className="space-y-6 p-5 sm:p-6">
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-lg font-semibold">{finished ? "Guide ready" : subject ? `Researching ${subject}` : "Researching"}</p>
            <p className="mt-0.5 break-words text-sm text-ink-2">{now}</p>
          </div>
          <p className="shrink-0 font-mono text-sm text-muted" aria-label="Elapsed time">{mm}</p>
        </header>

        <div>
          <h3 className="mb-2 text-sm font-semibold">Stages</h3>
          <ol className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {p.stages.length === 0 && <li className="text-sm text-muted">Starting…</li>}
            {p.stages.map((s, i) => {
              const isActive = !s.done && i === p.stages.length - 1;
              return (
                <li key={s.stage} className="flex items-start gap-2.5 text-sm">
                  <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${s.done ? "bg-[var(--tested)] text-[var(--surface)]" : "border border-line-strong"}`}>
                    {s.done ? <Icon name="check" className="h-3 w-3" /> : isActive ? <Icon name="loader" className="h-3 w-3 text-accent" spin /> : null}
                  </span>
                  <span className={s.done ? "text-muted" : "font-medium text-ink"}>{s.label}</span>
                </li>
              );
            })}
          </ol>
        </div>

        {p.steps.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold">What the research agent did</h3>
            <ol className="space-y-2.5">
              {recent.map((s) => (
                <li key={s.n} className="flex gap-3 text-sm">
                  <Icon name={s.action === "search" ? "search" : "file"} className="mt-0.5 h-4 w-4 text-muted" />
                  <span className="min-w-0 break-words">
                    <span className="font-medium text-ink">{s.action === "search" ? "Searched" : "Read"}: {s.target}</span>
                    <span className="mt-0.5 block text-ink-2">{s.reason}</span>
                  </span>
                </li>
              ))}
            </ol>
            {earlier > 0 && <p className="mt-2 text-xs text-muted">and {earlier} earlier action{earlier === 1 ? "" : "s"}</p>}
          </div>
        )}

        {p.sources.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold">Sources found · {p.sources.length}</h3>
            <ul className="space-y-1.5">
              {p.sources.slice(0, SHOWN_SOURCES).map((s) => (
                <li key={s.url} className="break-words text-sm text-ink-2"><span className="font-medium text-ink">{host(s.url)}</span> · {s.title}</li>
              ))}
            </ul>
            {p.sources.length > SHOWN_SOURCES && <p className="mt-2 text-xs text-muted">and {p.sources.length - SHOWN_SOURCES} more</p>}
          </div>
        )}

        {p.checklist.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold">Research checklist</h3>
            <ul className="grid gap-2 sm:grid-cols-2">
              {p.checklist.map((c) => {
                const st = STATUS[c.status];
                return (
                  <li key={c.item} className={`tone-${st.tone} flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2 text-sm`}>
                    <span>{ITEM[c.item] ?? c.item}</span>
                    <span className="flex shrink-0 items-center gap-1 text-xs tone-text"><Icon name={st.icon} className="h-3.5 w-3.5" />{st.text}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <p className="text-xs text-muted">Live guides are researched quickly and carry lighter evidence than library guides.</p>
      </div>

      {p.warnings.length > 0 && (
        <ul className="space-y-1 border-t border-line bg-[color-mix(in_srgb,var(--moderate)_8%,var(--surface))] px-5 py-3 text-sm text-ink sm:px-6">
          {p.warnings.map((w, i) => (<li key={i} className="flex gap-2"><Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0 text-[var(--moderate)]" /><span className="break-words">{w}</span></li>))}
        </ul>
      )}
    </section>
  );
}
