import type { Guide } from "@/lib/schema/guide";
import { ActorChip } from "./badges";
import { EvidenceLine } from "./Claims";

export function StepList({ steps }: { steps: Guide["steps"] }) {
  return (
    <ol className="space-y-3">
      {steps.map((s) => (
        <li key={s.order} className="rounded border border-gray-300 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{s.order}. {s.title}</span>
            <ActorChip actor={s.actor} />
            <span className="text-xs text-gray-700">{s.estimate}</span>
            <span className="text-xs text-gray-700">
              {s.observed ? "Observed up to this gate" : "Inferred from documentation"}
            </span>
          </div>
          <p className="mt-1 text-sm">{s.detail}</p>
          {s.agentPrep && <p className="mt-1 text-sm text-sky-900">Agent prepares: {s.agentPrep}</p>}
          <p className="mt-1 text-xs text-gray-700">Needs: {s.requires.join(", ")}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <EvidenceLine evidence={s.evidence} />
            {s.url && (
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-800 underline">
                Open provider page
              </a>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
