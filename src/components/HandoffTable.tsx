import type { Guide } from "@/lib/schema/guide";
import { ClaimList } from "./Claims";

export function HandoffTable({ handoff }: { handoff: Guide["handoff"] }) {
  return (
    <div>
      <div className="grid gap-4 md:grid-cols-3">
        <div><h3 className="mb-2 font-semibold">🤖 Agent can do</h3><ClaimList claims={handoff.agentCanDo} /></div>
        <div><h3 className="mb-2 font-semibold">👤 You must do</h3><ClaimList claims={handoff.youMustDo} /></div>
        <div><h3 className="mb-2 font-semibold">⏳ Provider wait</h3><ClaimList claims={handoff.providerWait} /></div>
      </div>
      <p className="mt-3 text-xs text-gray-700">
        This split is computed by code from each step&apos;s requirement tags. It is observed up to the first gate we hit and inferred after it.
      </p>
    </div>
  );
}
