import type { Guide } from "@/lib/schema/guide";

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
const date = (iso: string) => iso.slice(0, 10);

export function ProbeList({ probe }: { probe: Guide["probe"] }) {
  if (!probe.length) return <p className="text-sm text-gray-600">No URLs were probed.</p>;
  return (
    <table className="w-full text-left text-sm">
      <caption className="sr-only">Gate probe results</caption>
      <thead><tr className="border-b text-xs uppercase text-gray-700"><th className="py-1 pr-2">URL</th><th className="pr-2">Result</th><th>Checked</th></tr></thead>
      <tbody>
        {probe.map((p) => (
          <tr key={p.url} className="border-b border-gray-200 align-top">
            <td className="break-all py-1 pr-2">{p.url}</td>
            <td className="pr-2">{isGate(p.classification) ? "🔒 " : ""}{CLASS_TEXT[p.classification]}</td>
            <td className="whitespace-nowrap">{date(p.checkedAt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function FlowTraceView({ trace }: { trace?: Guide["flowTrace"] }) {
  if (!trace) return <p className="text-sm text-gray-600">No public path could be traced for this guide.</p>;
  return (
    <div>
      <ol className="flex flex-wrap items-center gap-2 text-sm">
        {trace.hops.map((h, i) => (
          <li key={h.n} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden="true">→</span>}
            <span className={`rounded border px-2 py-1 ${isGate(h.classification) ? "border-red-700 bg-red-50" : "border-gray-400"}`}>
              {isGate(h.classification) && "🔒 "}{h.title ?? new URL(h.url).pathname}
              <span className="block text-xs text-gray-700">{CLASS_TEXT[h.classification]}{h.viaLinkText ? ` · via "${h.viaLinkText}"` : ""}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-2 text-sm">Ended: {trace.endedReason} <span className="text-xs text-gray-700">(observed {date(trace.checkedAt)})</span></p>
    </div>
  );
}

export function ProviderMetadataPanel({ meta }: { meta?: Guide["providerMetadata"] }) {
  if (!meta) return <p className="text-sm text-gray-600">Provider metadata was not checked.</p>;
  if (!meta.found)
    return <p className="text-sm">Not published at the standard locations (checked {date(meta.checkedAt)}). That does not prove a feature is unsupported.</p>;
  const reg = { supported: "Supported", not_listed: "Not listed", unknown: "Unknown" }[meta.dynamicRegistration];
  return (
    <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[12rem_1fr]">
      <dt className="text-gray-700">Found at</dt><dd className="break-all">{meta.sourceUrl} ({date(meta.checkedAt)})</dd>
      {meta.authorizationEndpoint && (<><dt className="text-gray-700">Authorization endpoint</dt><dd className="break-all">{meta.authorizationEndpoint}</dd></>)}
      {meta.tokenEndpoint && (<><dt className="text-gray-700">Token endpoint</dt><dd className="break-all">{meta.tokenEndpoint}</dd></>)}
      {meta.scopesListed && (<><dt className="text-gray-700">Scopes listed</dt><dd>{meta.scopesListed.join(", ") || "none"}</dd></>)}
      {meta.pkceMethods && (<><dt className="text-gray-700">PKCE</dt><dd>{meta.pkceMethods.join(", ")}</dd></>)}
      <dt className="text-gray-700">Dynamic client registration</dt><dd>{reg}</dd>
      {meta.notes.map((n, i) => (<p key={i} className="sm:col-span-2 text-xs text-gray-700">{n}</p>))}
    </dl>
  );
}

const OUTCOME: Record<string, string> = {
  completed: "Completed",
  stopped_human_required: "Stopped — human needed",
  differs_from_docs: "Differs from docs",
  failed: "Failed",
};

export function AttemptLogView({ attempt }: { attempt?: Guide["attempt"] }) {
  if (!attempt) return null;
  return (
    <div>
      <p className="text-sm">
        Performed {attempt.date} on a free account in a separate browser profile. Stopped at <strong>{attempt.stoppedAt}</strong>
        {attempt.stoppedBecause.length > 0 && <> because a human is needed for: {attempt.stoppedBecause.join(", ")}</>}.
        {attempt.minutesToCredentials !== undefined && <> Measured time to credentials: {attempt.minutesToCredentials} minutes.</>}
      </p>
      <ol className="mt-2 space-y-1 text-sm">
        {attempt.steps.map((s) => (
          <li key={s.id} className="rounded border border-gray-200 p-2">
            <span className="font-mono text-xs">{s.id}</span> · {s.action} → <em>{OUTCOME[s.outcome]}</em>
            <span className="block text-xs text-gray-700">{s.observation}{s.minutes !== undefined ? ` (${s.minutes} min)` : ""}</span>
          </li>
        ))}
      </ol>
      {attempt.corrections.length > 0 && (
        <div className="mt-3">
          <h4 className="font-semibold">Corrections to the documentation</h4>
          <ul className="list-disc pl-5 text-sm">
            {attempt.corrections.map((c, i) => (<li key={i}>Docs said: {c.docClaim} We observed: {c.observed}</li>))}
          </ul>
        </div>
      )}
      <p className="mt-2 text-xs text-gray-700">
        Cleanup: test apps {attempt.cleanup.appsDeleted ? "deleted" : "NOT deleted"}; secrets {attempt.cleanup.secretsRemoved ? "removed" : "NOT removed"}.
      </p>
    </div>
  );
}

export function TestedPanel({ items }: { items: string[] }) {
  if (!items.length) return <p className="text-sm text-gray-600">No open uncertainties recorded.</p>;
  return (<ul className="list-disc space-y-1 pl-5 text-sm">{items.map((t, i) => (<li key={i}>{t}</li>))}</ul>);
}
