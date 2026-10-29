import type { Claim, Evidence } from "@/lib/schema/guide";
import { EvidenceBadge } from "./EvidenceBadge";

export function SourceRefs({ evidence }: { evidence: Evidence }) {
  if (!evidence.sourceIds.length) return null;
  return (
    <span className="text-xs text-gray-700">
      {evidence.sourceIds.map((id) => (
        <a key={id} href={`#source-${id}`} className="mr-1 underline">
          [{id.replace(/^s/, "")}]
        </a>
      ))}
    </span>
  );
}

export function EvidenceLine({ evidence }: { evidence: Evidence }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <EvidenceBadge label={evidence.label} />
      <SourceRefs evidence={evidence} />
      {evidence.testNote && <span className="text-xs text-gray-700">— {evidence.testNote}</span>}
    </span>
  );
}

export function ClaimList({ claims, empty }: { claims: Claim[]; empty?: string }) {
  if (!claims.length) return <p className="text-sm text-gray-600">{empty ?? "None recorded."}</p>;
  return (
    <ul className="space-y-2">
      {claims.map((c, i) => (
        <li key={i} className="text-sm">
          <span className="mr-2">{c.text}</span>
          <EvidenceLine evidence={c.evidence} />
        </li>
      ))}
    </ul>
  );
}
