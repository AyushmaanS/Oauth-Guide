import type { Guide, Range } from "@/lib/schema/guide";
import { EvidenceLine } from "./Claims";
import { DIFF_HINT, DIFF_ORDER, DIFF_TEXT, DifficultyScale, Icon } from "./ui";

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

function Stat({ icon, label, value, basis, evidence, estimate }: { icon: "clock" | "flag" | "user"; label: string; value: string; basis?: string; evidence: Range["evidence"]; estimate?: boolean }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2/50 p-4">
      <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted"><Icon name={icon} className="h-3.5 w-3.5" />{label}</dt>
      <dd className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
        <span className={`display leading-none ${value === "unknown" ? "text-2xl text-muted" : "text-3xl"}`}>{value === "unknown" ? "No figure stated" : value}</span>
        {estimate && <span className="chip chip-dashed tone-unverified">Estimate</span>}
      </dd>
      {basis && <p className="mt-2 text-xs leading-relaxed text-ink-2">{basis}</p>}
      <div className="mt-2"><EvidenceLine evidence={evidence} /></div>
    </div>
  );
}

export function VerdictCard({ guide }: { guide: Guide }) {
  const v = guide.verdict;
  const prod = v.timeToProduction;
  const unresolved = v.difficulty === "unknown" && v.difficultyRange && v.difficultyRange.best !== v.difficultyRange.worst;
  const word = unresolved ? `${DIFF_TEXT[v.difficultyRange!.best]} to ${DIFF_TEXT[v.difficultyRange!.worst].toLowerCase()}` : DIFF_TEXT[v.difficulty];
  return (
    <section aria-labelledby="verdict" className={`tone-${v.difficulty} card overflow-hidden`}>
      <h2 id="verdict" className="sr-only">Verdict</h2>
      <div className="h-1.5 w-full" style={{ background: "var(--tone)" }} aria-hidden="true" />
      <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="eyebrow">Verdict · {v.useCase}</p>
          <p className="display mt-3 text-6xl leading-[0.95] sm:text-7xl tone-text">
            {word}
            {v.difficultyConfidence === "estimated" && <span className="ml-3 align-middle text-base font-sans font-semibold not-italic tracking-normal"><span className="chip chip-dashed">Our estimate</span></span>}
          </p>
          <div className="mt-5 max-w-md">
            <DifficultyScale difficulty={v.difficulty} range={v.difficultyRange} large />
            <div className="mt-1.5 flex justify-between text-[0.7rem] font-medium text-muted">{DIFF_ORDER.map((d) => (<span key={d}>{DIFF_TEXT[d]}</span>))}</div>
          </div>
          <p className="mt-5 text-sm text-ink-2">{v.difficultyReason}</p>
          {v.difficulty !== "unknown" && <p className="mt-1 text-xs text-muted">{DIFF_TEXT[v.difficulty]} means: {DIFF_HINT[v.difficulty]}</p>}
          <p className="mt-5 text-base leading-relaxed text-ink sm:text-lg">{v.summary}</p>
        </div>
        <dl className="grid gap-3 lg:col-span-5">
          <Stat icon="clock" label="Time to first credentials" value={formatRange(v.timeToCredentials)} basis={v.timeToCredentials.basis} evidence={v.timeToCredentials.evidence} estimate={v.timeToCredentials.estimate} />
          {"none" in prod ? (
            <Stat icon="flag" label="Time to production" value={prod.evidence.label === "unverified" ? "No approval described" : "No approval required"} evidence={prod.evidence} />
          ) : (
            <Stat icon="flag" label="Time to production / approval" value={formatRange(prod)} basis={prod.basis} evidence={prod.evidence} estimate={prod.estimate} />
          )}
          <Stat icon="user" label="Your effort" value={formatRange(v.humanEffortHours)} basis={v.humanEffortHours.basis} evidence={v.humanEffortHours.evidence} estimate={v.humanEffortHours.estimate} />
        </dl>
      </div>
      <div className="border-t border-line bg-[color-mix(in_srgb,var(--moderate)_8%,var(--surface))] px-6 py-4 sm:px-8">
        <p className="flex gap-3 text-sm text-ink">
          <Icon name="alert" className="mt-0.5 h-4 w-4 text-[var(--moderate)]" />
          <span><strong>Biggest risk to your launch date.</strong> {v.biggestLaunchRisk}</span>
        </p>
      </div>
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
    <details className="group border-t border-line" open={v.difficultyConfidence !== "established"}>
      <summary className="flex items-center justify-between gap-3 px-6 py-4 text-sm font-semibold sm:px-8">
        <span className="flex items-center gap-2"><Icon name="layers" /> How we got this verdict</span>
        <Icon name="chevron" className="chev h-4 w-4 text-muted" />
      </summary>
      <div className="grid gap-6 px-6 pb-6 text-sm sm:px-8 lg:grid-cols-3">
        {stated.length > 0 && (
          <div>
            <h3 className="eyebrow mb-2">What the sources establish</h3>
            <ul className="space-y-2">{stated.map((k) => (<li key={k} className="tone-documented rounded-lg border border-line bg-surface p-2.5"><span className="block text-xs text-muted">{FACTOR_LABEL[k]}</span>{say(k, f[k])}</li>))}</ul>
          </div>
        )}
        {((v.inference?.length ?? 0) > 0 || unknown.length > 0) && (
          <div>
            <h3 className="eyebrow mb-2">Our estimates and what is still open</h3>
            <ul className="space-y-2">
              {v.inference?.map((i) => (
                <li key={i.factor} className="rounded-lg border border-dashed border-line-strong bg-surface p-2.5">
                  <span className="block text-xs text-muted">{FACTOR_LABEL[i.factor]} · {i.confidence} confidence</span>
                  <span className="font-medium">likely {say(i.factor, i.value)}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-ink-2">{i.rationale}{i.sourceIds.length > 0 && <> Based on {i.sourceIds.map((id) => `[${id.replace(/^s/, "")}]`).join(" ")}.</>}</span>
                </li>
              ))}
              {unknown.map((k) => (<li key={k} className="rounded-lg border border-dashed border-line-strong p-2.5 text-muted"><span className="block text-xs">{FACTOR_LABEL[k]}</span>Still unknown</li>))}
            </ul>
          </div>
        )}
        {(v.checkFirst?.length ?? 0) > 0 && (
          <div>
            <h3 className="eyebrow mb-2">What to check first</h3>
            <ol className="space-y-2">{v.checkFirst!.map((q, i) => (<li key={i} className="flex gap-2.5 rounded-lg border border-line bg-surface p-2.5"><span className="font-mono text-xs text-muted">{i + 1}</span>{q}</li>))}</ol>
          </div>
        )}
      </div>
    </details>
  );
}
