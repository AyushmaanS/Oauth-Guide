import type { EvidenceLabel } from "@/lib/schema/guide";
import { Icon, type IconName } from "./ui";

const META: Record<EvidenceLabel, { text: string; icon: IconName; tip: string }> = {
  tested: {
    text: "Tested",
    icon: "flask",
    tip: "We observed this directly (a probe, a trace hop, or a walkthrough step). Only covers what was observed, not what lies behind a gate.",
  },
  documented: {
    text: "Documented",
    icon: "file",
    tip: "An official provider source states this. See the linked source and its retrieval date.",
  },
  reported: {
    text: "Reported",
    icon: "message",
    tip: "Only community or third-party sources say this. Treat as weaker.",
  },
  unverified: {
    text: "Unverified",
    icon: "help",
    tip: "Inferred, conflicting, or no source. Do not rely on it without checking.",
  },
};

export function EvidenceBadge({ label }: { label: EvidenceLabel }) {
  const m = META[label];
  return (
    <span title={m.tip} className={`chip tone-${label} ${label === "unverified" ? "chip-dashed" : ""}`}>
      <Icon name={m.icon} className="h-3.5 w-3.5" />
      {m.text}
    </span>
  );
}

export const evidenceTip = (l: EvidenceLabel) => META[l].tip;
