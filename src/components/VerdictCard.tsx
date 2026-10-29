import type { Guide, Range } from "@/lib/schema/guide";
import { DifficultyBadge } from "./badges";
import { EvidenceLine } from "./Claims";

export function formatRange(r: Range): string {
  const base = formatRangeCore(r);
  return r.estimate && base !== "unknown" ? `≈ ${base}` : base;
}

function formatRangeCore(r: Range): string {
  const unit = (min?: number, max?: number, u = "") => {
    if (min === undefined && max === undefined) return "";
    if (min !== undefined && max !== undefined && min !== max) return `${min}–${max} ${u}`;
    return `${max ?? min} ${u}`;
  };
  return unit(r.minDays, r.maxDays, "days") || unit(r.minHours, r.maxHours, "hours") || "unknown";
}

function Stat({ label, value, basis, evidence, estimate }: { label: string; value: string; basis: string; evidence: Range["evidence"]; estimate?: boolean }) {
  return (
    <div className="rounded border border-gray-300 p-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-700">{label}</dt>
      <dd className="mt-1 text-lg font-semibold">{value}{estimate && <span className="ml-2 rounded border border-dashed border-gray-600 px-1.5 py-0.5 align-middle text-xs font-medium">Estimate</span>}</dd>
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
        <DifficultyBadge difficulty={v.difficulty} large confidence={v.difficultyConfidence} range={v.difficultyRange} />
        <p className="text-sm text-gray-800">{v.difficultyReason}</p>
      </div>
      <p className="mt-1 text-xs text-gray-700">Verdict is for: {v.useCase}</p>
      <p className="mt-3 text-lg font-medium">{v.summary}</p>
      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        <Stat label="Time to first credentials" value={formatRange(v.timeToCredentials)} basis={v.timeToCredentials.basis} evidence={v.timeToCredentials.evidence} estimate={v.timeToCredentials.estimate} />
        {"none" in prod ? (
          <div className="rounded border border-gray-300 p-3">
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-700">Time to production</dt>
            <dd className="mt-1 text-lg font-semibold">No approval required</dd>
            <div className="mt-1"><EvidenceLine evidence={prod.evidence} /></div>
          </div>
        ) : (
          <Stat label="Time to production / approval" value={formatRange(prod)} basis={prod.basis} evidence={prod.evidence} estimate={prod.estimate} />
        )}
        <Stat label="Your effort" value={formatRange(v.humanEffortHours)} basis={v.humanEffortHours.basis} evidence={v.humanEffortHours.evidence} estimate={v.humanEffortHours.estimate} />
      </dl>
      <p className="mt-4 rounded bg-amber-50 p-3 text-sm text-amber-950">
        <strong>Biggest risk to your launch date:</strong> {v.biggestLaunchRisk}
      </p>
      <ReasoningPanel verdict={v} />
    </section>
  );
}

const FACTOR_LABEL: Record<string, string> = {
  registrationFriction: "Getting credentials",
  reviewRequired: "Provider review",
  reviewDepth: "Kind of review",
  waitMagnitude: "Review wait",
  businessEntityRequired: "Business entity",
};
const VALUE_TEXT: Record<string, Record<string, string>> = {
  registrationFriction: { instant: "instant, no account hurdles", account_needed: "needs a normal developer account", paid_or_business_account: "needs a paid or business account" },
  reviewRequired: { none: "not required", for_public_use: "required before other customers can use your app", for_sensitive_scopes: "required for sensitive scopes", always: "always required" },
  reviewDepth: { none: "none", automated: "automated checks", manual: "manual review by the provider", security_assessment: "third-party security assessment", partnership_contract: "partnership or contract" },
  waitMagnitude: { none: "no wait", hours: "hours", days: "days", weeks: "weeks" },
  businessEntityRequired: { yes: "a registered business is required", no: "not required" },
};
const say = (factor: string, value: string) => VALUE_TEXT[factor]?.[value] ?? value;

/** What the sources established, what we estimate (with reasoning), what is still open, and what to check first. */
function ReasoningPanel({ verdict: v }: { verdict: Guide["verdict"] }) {
  const basis = v.factorBasis;
  const f = v.factors as unknown as Record<string, string>;
  const keys = Object.keys(FACTOR_LABEL);
  const stated = keys.filter((k) => (basis?.[k as keyof typeof basis] ?? (f[k] === "unknown" ? "unknown" : "stated")) === "stated");
  const unknown = keys.filter((k) => (basis?.[k as keyof typeof basis] ?? (f[k] === "unknown" ? "unknown" : "stated")) === "unknown");
  const hasMore = (v.inference?.length ?? 0) > 0 || (v.checkFirst?.length ?? 0) > 0 || unknown.length > 0 || stated.length > 0;
  if (!hasMore) return null;
  return (
    <details className="mt-4 text-sm" open={v.difficultyConfidence !== "established"}>
      <summary className="cursor-pointer font-semibold">How we got this verdict</summary>
      <div className="mt-2 space-y-3">
        {stated.length > 0 && (
          <div>
            <h3 className="font-semibold">What the sources establish</h3>
            <ul className="list-disc pl-5">{stated.map((k) => (<li key={k}>{FACTOR_LABEL[k]}: {say(k, f[k])}</li>))}</ul>
          </div>
        )}
        {(v.inference?.length ?? 0) > 0 && (
          <div>
            <h3 className="font-semibold">Our estimates (not stated by any source)</h3>
            <ul className="space-y-1">
              {v.inference!.map((i) => (
                <li key={i.factor} className="rounded border border-dashed border-gray-500 p-2">
                  <span className="font-medium">{FACTOR_LABEL[i.factor]}: likely {say(i.factor, i.value)}</span>{" "}
                  <span className="rounded border border-gray-500 px-1 text-xs">{i.confidence} confidence</span>
                  <span className="block text-xs text-gray-800">{i.rationale}{i.sourceIds.length > 0 && <> Based on {i.sourceIds.map((id) => `[${id.replace(/^s/, "")}]`).join(" ")}.</>}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {unknown.length > 0 && (
          <div>
            <h3 className="font-semibold">Still unknown</h3>
            <ul className="list-disc pl-5">{unknown.map((k) => (<li key={k}>{FACTOR_LABEL[k]}</li>))}</ul>
          </div>
        )}
        {(v.checkFirst?.length ?? 0) > 0 && (
          <div>
            <h3 className="font-semibold">What to check first</h3>
            <ol className="list-decimal pl-5">{v.checkFirst!.map((q, i) => (<li key={i}>{q}</li>))}</ol>
          </div>
        )}
      </div>
    </details>
  );
}
