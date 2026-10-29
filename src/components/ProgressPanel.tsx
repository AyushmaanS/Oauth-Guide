export interface ProgressState {
  stages: { stage: string; label: string; done: boolean }[];
  steps: { n: number; action: "search" | "read"; target: string; reason: string }[];
  sources: { title: string; url: string }[];
  checklist: { item: string; status: "pending" | "covered" | "partial" | "not_found" }[];
  warnings: string[];
}
export const emptyProgress = (): ProgressState => ({ stages: [], steps: [], sources: [], checklist: [], warnings: [] });

const STATUS: Record<string, string> = { pending: "⏳ pending", covered: "✔ covered", partial: "◐ partial", not_found: "✖ not found" };
const ITEM: Record<string, string> = {
  registration: "How to register", review_process: "Review process", scopes_restrictions: "Scopes and limits", timing_evidence: "Timing evidence",
  requirements: "Requirements", rate_limits: "Rate limits", community_reports: "Community reports",
};

export function ProgressPanel({ p }: { p: ProgressState }) {
  return (
    <section aria-label="Generation progress" aria-live="polite" className="mt-4 rounded border border-gray-400 p-4 text-sm">
      <ol className="space-y-1">
        {p.stages.map((s) => (
          <li key={s.stage}>{s.done ? "✔" : "…"} {s.label}</li>
        ))}
      </ol>
      {p.steps.length > 0 && (
        <div className="mt-3">
          <h3 className="font-semibold">What the research agent is doing</h3>
          <ol className="mt-1 space-y-1">
            {p.steps.map((s) => (
              <li key={s.n}>
                <span className="font-mono text-xs">{s.n}.</span> {s.action === "search" ? "Searching" : "Reading"}: <span className="break-all">{s.target}</span>
                <span className="block text-xs text-gray-700">{s.reason}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
      {p.sources.length > 0 && (
        <div className="mt-3">
          <h3 className="font-semibold">Sources found ({p.sources.length})</h3>
          <ul className="mt-1 list-disc pl-5">
            {p.sources.map((s) => (<li key={s.url} className="break-all">{s.title}</li>))}
          </ul>
        </div>
      )}
      {p.checklist.length > 0 && (
        <div className="mt-3">
          <h3 className="font-semibold">Research checklist</h3>
          <ul className="mt-1 grid gap-x-4 sm:grid-cols-2">
            {p.checklist.map((c) => (<li key={c.item}>{ITEM[c.item] ?? c.item}: {STATUS[c.status]}</li>))}
          </ul>
        </div>
      )}
      {p.warnings.map((w, i) => (<p key={i} className="mt-2 text-amber-900">⚠ {w}</p>))}
    </section>
  );
}
