import type { Guide } from "@/lib/schema/guide";
import { CATEGORY_TEXT } from "@/lib/probe/categories";
import { Icon } from "./ui";

const CLASS_TEXT: Record<string, string> = {
  public: "Public page",
  login_redirect: "Sign-in required",
  captcha_or_bot: "CAPTCHA / bot check",
  forbidden: "Forbidden",
  not_found: "Not found",
  js_shell_unclear: "Unclear (JavaScript page)",
  input_required: "Needs typed input",
  skipped_robots: "Skipped (robots.txt)",
  blocked_by_policy: "Blocked by our safety policy",
  error: "Error",
};
const isGate = (c: string) => ["login_redirect", "captcha_or_bot", "forbidden"].includes(c);
const classTone = (c: string) => (isGate(c) ? "you" : c === "public" ? "tested" : c === "error" || c === "not_found" ? "hard" : "unknown");
const AGREE_TEXT = { agree: "agrees with the code", disagree: "differs from the code", code_unclear: "code could not tell" } as const;
const date = (iso: string) => iso.slice(0, 10);
const short = (u: string) => {
  try {
    const x = new URL(u);
    return { host: x.hostname.replace(/^www\./, ""), path: x.pathname + x.search };
  } catch {
    return { host: u, path: "" };
  }
};

function ClassChip({ c }: { c: string }) {
  return (
    <span className={`chip tone-${classTone(c)} ${c === "public" ? "" : "chip-dashed"}`}>
      {isGate(c) && <Icon name="lock" className="h-3 w-3" />}
      {CLASS_TEXT[c] ?? c}
    </span>
  );
}

/** A model's reading of a page. Labelled as interpretation: it is never shown as a tested observation. */
function Reading({ r }: { r?: NonNullable<Guide["probe"][number]["reading"]> }) {
  if (!r) return null;
  const what = r.category === "other" && r.other ? `other: ${r.other}` : CATEGORY_TEXT[r.category];
  return (
    <p className="mt-1.5 flex items-start gap-1.5 text-xs text-muted" title={r.quoteVerified ? `Quoted from the page: "${r.quote}"` : "The quoted words were not found on the page, so this reading is not relied on."}>
      <Icon name="sparkles" className="mt-0.5 h-3 w-3" />
      <span>Model reading: {what} ({r.confidence}{r.quoteVerified ? "" : ", quote not found"}) · {AGREE_TEXT[r.agreement]}</span>
    </p>
  );
}

export function ProbeList({ probe }: { probe: Guide["probe"] }) {
  if (!probe.length) return <p className="text-sm text-muted">No URLs were probed.</p>;
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
      {probe.map((p) => {
        const u = short(p.url);
        return (
          <li key={p.url} className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 p-3 text-sm">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-ink" title={p.url}>{u.host}<span className="font-normal text-muted">{u.path}</span></p>
              <Reading r={p.reading} />
            </div>
            <div className="flex items-center gap-2"><ClassChip c={p.classification} /><span className="font-mono text-xs text-muted">{date(p.checkedAt)}</span></div>
          </li>
        );
      })}
    </ul>
  );
}

const ENDED_TEXT: Record<string, string> = { gate: "Reached a gate", input_required: "Reached a form", dead_end: "Dead end", depth_limit: "Hop limit", js_shell_unclear: "JavaScript page", policy: "Policy stop", error: "Error" };

export function FlowTraceView({ trace }: { trace?: Guide["flowTrace"] }) {
  if (!trace) return <p className="text-sm text-muted">No public path could be traced for this guide.</p>;
  const gate = trace.endedAt === "gate";
  return (
    <div>
      <ol className="relative">
        {trace.hops.map((h, i) => {
          const u = short(h.url);
          return (
            <li key={h.n} className="relative pb-3 pl-9">
              <span aria-hidden="true" className="route-line absolute bottom-0 left-[0.8rem] top-7 w-0.5" />
              <span aria-hidden="true" className={`tone-${classTone(h.classification)} absolute left-0 top-1 grid h-[1.65rem] w-[1.65rem] place-items-center rounded-full border-2 bg-surface font-mono text-[0.7rem] font-bold`} style={{ borderColor: "var(--tone)" }}>{h.n}</span>
              <div className="card-flat p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="min-w-0 truncate font-medium text-ink" title={h.url}>{h.title ?? `${u.host}${u.path}`}</p>
                  <ClassChip c={h.classification} />
                </div>
                <p className="mt-0.5 truncate text-xs text-muted">{u.host}{u.path}{i > 0 && h.viaLinkText ? ` · via “${h.viaLinkText}”` : ""}{h.chosenBy === "model" ? " · link chosen by the model" : ""}</p>
                <Reading r={h.reading} />
              </div>
            </li>
          );
        })}
        <li className="relative pl-9">
          <span aria-hidden="true" className={`absolute left-0 top-1 grid h-[1.65rem] w-[1.65rem] place-items-center rounded-full ${gate ? "tone-you" : "tone-unknown"}`} style={{ background: "var(--tone)", color: "var(--surface)" }}><Icon name={gate ? "lock" : "flag"} className="h-3.5 w-3.5" /></span>
          <div className="px-1 pt-1 text-sm">
            <p className="font-semibold text-ink">{ENDED_TEXT[trace.endedAt] ?? "Ended"}</p>
            <p className="text-ink-2">{trace.endedReason} <span className="text-xs text-muted">(observed {date(trace.checkedAt)})</span></p>
          </div>
        </li>
      </ol>
    </div>
  );
}

export function ProviderMetadataPanel({ meta }: { meta?: Guide["providerMetadata"] }) {
  if (!meta) return <p className="text-sm text-muted">Provider metadata was not checked.</p>;
  if (!meta.found)
    return <p className="text-sm text-ink-2">Not published at the standard locations (checked {date(meta.checkedAt)}). That does not prove a feature is unsupported.</p>;
  const reg = { supported: "Supported", not_listed: "Not listed", unknown: "Unknown" }[meta.dynamicRegistration];
  const rows: [string, string][] = [
    ["Found at", `${meta.sourceUrl} (${date(meta.checkedAt)})`],
    ...(meta.authorizationEndpoint ? ([["Authorization endpoint", meta.authorizationEndpoint]] as [string, string][]) : []),
    ...(meta.tokenEndpoint ? ([["Token endpoint", meta.tokenEndpoint]] as [string, string][]) : []),
    ...(meta.scopesListed ? ([["Scopes listed", meta.scopesListed.join(", ") || "none"]] as [string, string][]) : []),
    ...(meta.pkceMethods ? ([["PKCE", meta.pkceMethods.join(", ")]] as [string, string][]) : []),
    ["Dynamic client registration", reg],
  ];
  return (
    <div className="card-flat overflow-hidden">
      <dl className="divide-y divide-line text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="grid gap-1 p-3 sm:grid-cols-[13rem_1fr]"><dt className="text-muted">{k}</dt><dd className="break-all text-ink">{v}</dd></div>
        ))}
      </dl>
      {meta.notes.map((n, i) => (<p key={i} className="border-t border-line p-3 text-xs text-muted">{n}</p>))}
    </div>
  );
}

const OUTCOME: Record<string, { text: string; tone: string }> = {
  completed: { text: "Completed", tone: "tested" },
  stopped_human_required: { text: "Stopped: human needed", tone: "you" },
  differs_from_docs: { text: "Differs from docs", tone: "reported" },
  failed: { text: "Failed", tone: "hard" },
};

export function AttemptLogView({ attempt }: { attempt?: Guide["attempt"] }) {
  if (!attempt) return null;
  return (
    <div>
      <p className="text-sm leading-relaxed text-ink-2">
        Performed {attempt.date} on a free account in a separate browser profile. Stopped at <strong className="text-ink">{attempt.stoppedAt}</strong>
        {attempt.stoppedBecause.length > 0 && <> because a human is needed for: {attempt.stoppedBecause.join(", ")}</>}.
        {attempt.minutesToCredentials !== undefined && <> Measured time to credentials: {attempt.minutesToCredentials} minutes.</>}
      </p>
      <ol className="mt-4 space-y-2">
        {attempt.steps.map((s) => {
          const o = OUTCOME[s.outcome];
          return (
            <li key={s.id} className="card-flat p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-ink"><span className="mr-2 font-mono text-xs text-muted">{s.id}</span>{s.action}</p>
                <span className={`chip tone-${o.tone}`}>{o.text}</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-ink-2">{s.observation}{s.minutes !== undefined ? ` (${s.minutes} min)` : ""}</p>
            </li>
          );
        })}
      </ol>
      {attempt.corrections.length > 0 && (
        <div className="mt-5">
          <h4 className="eyebrow mb-2">Corrections to the documentation</h4>
          <ul className="space-y-2">
            {attempt.corrections.map((c, i) => (
              <li key={i} className="grid gap-px overflow-hidden rounded-xl border border-line bg-[var(--line)] text-sm sm:grid-cols-2">
                <div className="bg-surface p-3"><p className="eyebrow mb-1">Docs said</p>{c.docClaim}</div>
                <div className="tone-tested bg-surface p-3" style={{ background: "color-mix(in srgb, var(--tone) 7%, var(--surface))" }}><p className="eyebrow mb-1">We observed</p>{c.observed}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted">
        Cleanup:
        <span className={`chip ${attempt.cleanup.appsDeleted ? "tone-tested" : "tone-reported chip-dashed"}`}>test apps {attempt.cleanup.appsDeleted ? "deleted" : "not deleted"}</span>
        <span className={`chip ${attempt.cleanup.secretsRemoved ? "tone-tested" : "tone-reported chip-dashed"}`}>secrets {attempt.cleanup.secretsRemoved ? "removed" : "not removed"}</span>
      </p>
    </div>
  );
}

export function TestedPanel({ items }: { items: string[] }) {
  if (!items.length) return <p className="text-sm text-muted">No open uncertainties recorded.</p>;
  return (
    <ul className="space-y-2">
      {items.map((t, i) => (
        <li key={i} className="flex gap-2.5 rounded-xl border border-dashed border-line-strong p-3 text-sm leading-relaxed text-ink-2"><Icon name="help" className="mt-0.5 h-4 w-4 text-[var(--unverified)]" />{t}</li>
      ))}
    </ul>
  );
}
