import type { Claim, Evidence } from "@/lib/schema/guide";
import { EvidenceBadge } from "./EvidenceBadge";
import { Icon } from "./ui";

export function SourceRefs({ evidence }: { evidence: Evidence }) {
  if (!evidence.sourceIds.length) return null;
  return (
    <span className="inline-flex flex-wrap gap-1 align-middle">
      {evidence.sourceIds.map((id) => (
        <a key={id} href={`#source-${id}`} title={`Source ${id.replace(/^s/, "")}`} className="rounded-md border border-line bg-surface-2 px-1.5 font-mono text-[0.7rem] text-ink-2 no-underline hover:border-ink">
          {id.replace(/^s/, "")}
        </a>
      ))}
    </span>
  );
}

export function EvidenceLine({ evidence }: { evidence: Evidence }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <EvidenceBadge label={evidence.label} />
      <SourceRefs evidence={evidence} />
      {evidence.testNote && <span className="basis-full text-xs leading-snug text-muted">{evidence.testNote}</span>}
    </span>
  );
}

function ClaimRow({ c }: { c: Claim }) {
  return (
    <li className={`tone-${c.evidence.label} flex gap-3 rounded-xl border border-line bg-surface p-3 text-sm`}>
      <span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: "var(--tone)" }} />
      <div className="min-w-0 flex-1">
        <p className="leading-relaxed text-ink">{c.text}</p>
        <div className="mt-1.5"><EvidenceLine evidence={c.evidence} /></div>
      </div>
    </li>
  );
}

export function ClaimList({ claims, empty, collapseAfter }: { claims: Claim[]; empty?: string; collapseAfter?: number }) {
  if (!claims.length) return <p className="text-sm text-muted">{empty ?? "None recorded."}</p>;
  const head = collapseAfter ? claims.slice(0, collapseAfter) : claims;
  const rest = collapseAfter ? claims.slice(collapseAfter) : [];
  return (
    <div>
      <ul className="space-y-2">{head.map((c, i) => (<ClaimRow key={i} c={c} />))}</ul>
      {rest.length > 0 && (
        <details className="group mt-2">
          <summary className="btn !px-3 !py-1 text-xs"><Icon name="chevron" className="chev h-3.5 w-3.5" /> Show {rest.length} more</summary>
          <ul className="mt-2 space-y-2">{rest.map((c, i) => (<ClaimRow key={i} c={c} />))}</ul>
        </details>
      )}
    </div>
  );
}
