import type { Guide, Range } from "@/lib/schema/guide";
import { DifficultyBadge } from "./badges";
import { EvidenceLine } from "./Claims";

export function formatRange(r: Range): string {
  const unit = (min?: number, max?: number, u = "") => {
    if (min === undefined && max === undefined) return "";
    if (min !== undefined && max !== undefined && min !== max) return `${min}–${max} ${u}`;
    return `${max ?? min} ${u}`;
  };
  return unit(r.minDays, r.maxDays, "days") || unit(r.minHours, r.maxHours, "hours") || "unknown";
}

function Stat({ label, value, basis, evidence }: { label: string; value: string; basis: string; evidence: Range["evidence"] }) {
  return (
    <div className="rounded border border-gray-300 p-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-700">{label}</dt>
      <dd className="mt-1 text-lg font-semibold">{value}</dd>
      <p className="mt-1 text-xs text-gray-700">{basis}</p>
      <div className="mt-1"><EvidenceLine evidence={evidence} /></div>
    </div>
  );
}

export function VerdictCard({ guide }: { guide: Guide }) {
  const v = guide.verdict;
  const prod = v.timeToProduction;
  return (
    <section aria-labelledby="verdict" className="rounded-lg border-2 border-gray-900 p-4">
      <h2 id="verdict" className="sr-only">Verdict</h2>
      <div className="flex flex-wrap items-center gap-3">
        <DifficultyBadge difficulty={v.difficulty} large />
        <p className="text-sm text-gray-800">{v.difficultyReason}</p>
      </div>
      <p className="mt-1 text-xs text-gray-700">Verdict is for: {v.useCase}</p>
      <p className="mt-3 text-lg font-medium">{v.summary}</p>
      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        <Stat label="Time to first credentials" value={formatRange(v.timeToCredentials)} basis={v.timeToCredentials.basis} evidence={v.timeToCredentials.evidence} />
        {"none" in prod ? (
          <div className="rounded border border-gray-300 p-3">
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-700">Time to production</dt>
            <dd className="mt-1 text-lg font-semibold">No approval required</dd>
            <div className="mt-1"><EvidenceLine evidence={prod.evidence} /></div>
          </div>
        ) : (
          <Stat label="Time to production / approval" value={formatRange(prod)} basis={prod.basis} evidence={prod.evidence} />
        )}
        <Stat label="Your effort" value={formatRange(v.humanEffortHours)} basis={v.humanEffortHours.basis} evidence={v.humanEffortHours.evidence} />
      </dl>
      <p className="mt-4 rounded bg-amber-50 p-3 text-sm text-amber-950">
        <strong>Biggest risk to your launch date:</strong> {v.biggestLaunchRisk}
      </p>
    </section>
  );
}
