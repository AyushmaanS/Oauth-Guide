import type { EvidenceLabel } from "@/lib/schema/guide";

const META: Record<EvidenceLabel, { text: string; icon: string; cls: string; tip: string }> = {
  tested: {
    text: "Tested",
    icon: "✔",
    cls: "bg-green-50 text-green-900 border-green-700",
    tip: "We observed this directly (a probe, a trace hop, or a walkthrough step). Only covers what was observed, not what lies behind a gate.",
  },
  documented: {
    text: "Documented",
    icon: "📄",
    cls: "bg-blue-50 text-blue-900 border-blue-700",
    tip: "An official provider source states this. See the linked source and its retrieval date.",
  },
  reported: {
    text: "Reported",
    icon: "💬",
    cls: "bg-amber-50 text-amber-900 border-amber-700",
    tip: "Only community or third-party sources say this. Treat as weaker.",
  },
  unverified: {
    text: "Unverified",
    icon: "?",
    cls: "bg-gray-100 text-gray-900 border-gray-500 border-dashed",
    tip: "Inferred, conflicting, or no source. Do not rely on it without checking.",
  },
};

export function EvidenceBadge({ label }: { label: EvidenceLabel }) {
  const m = META[label];
  return (
    <span
      title={m.tip}
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded border px-1.5 py-0.5 text-xs font-medium ${m.cls}`}
    >
      <span aria-hidden="true">{m.icon}</span>
      {m.text}
    </span>
  );
}

export const evidenceTip = (l: EvidenceLabel) => META[l].tip;
