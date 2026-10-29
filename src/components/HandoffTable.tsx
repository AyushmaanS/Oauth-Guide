import type { Claim, Guide } from "@/lib/schema/guide";
import { EvidenceBadge } from "./EvidenceBadge";
import { Icon, type IconName } from "./ui";

function Lane({ tone, icon, title, claims }: { tone: "agent" | "you" | "wait"; icon: IconName; title: string; claims: Claim[] }) {
  return (
    <section aria-label={title} className={`tone-${tone} card-flat flex flex-col overflow-hidden`}>
      <header className="flex items-center justify-between gap-2 border-b border-line px-4 py-3" style={{ background: "color-mix(in srgb, var(--tone) 8%, var(--surface))" }}>
        <h3 className="flex items-center gap-2 font-semibold tone-text"><Icon name={icon} className="h-4 w-4" />{title}</h3>
        <span className="chip">{claims.length}</span>
      </header>
      {claims.length === 0 ? <p className="p-4 text-sm text-muted">Nothing here.</p> : (
        <ul className="divide-y divide-line">
          {claims.map((c, i) => (
            <li key={i} className="space-y-1.5 p-3.5 text-sm">
              <p className="leading-snug text-ink">{c.text}</p>
              <EvidenceBadge label={c.evidence.label} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function HandoffTable({ handoff }: { handoff: Guide["handoff"] }) {
  const a = handoff.agentCanDo.length, y = handoff.youMustDo.length, w = handoff.providerWait.length;
  const total = a + y + w || 1;
  return (
    <div>
      <div role="img" aria-label={`${a} items an agent can do, ${y} you must do, ${w} provider wait`} className="mb-5 flex h-3 w-full overflow-hidden rounded-full bg-[var(--line)]">
        <span className="tone-agent" style={{ width: `${(a / total) * 100}%`, background: "var(--tone)" }} />
        <span className="tone-you" style={{ width: `${(y / total) * 100}%`, background: "var(--tone)" }} />
        <span className="tone-wait" style={{ width: `${(w / total) * 100}%`, background: "var(--tone)" }} />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Lane tone="agent" icon="bot" title="Agent can do" claims={handoff.agentCanDo} />
        <Lane tone="you" icon="user" title="You must do" claims={handoff.youMustDo} />
        <Lane tone="wait" icon="hourglass" title="Provider wait" claims={handoff.providerWait} />
      </div>
      <p className="mt-4 flex gap-2 text-xs text-muted">
        <Icon name="shield" className="mt-0.5 h-3.5 w-3.5" />
        This split is computed by code from each step&apos;s requirement tags. It is observed up to the first gate we hit and inferred after it.
      </p>
    </div>
  );
}
