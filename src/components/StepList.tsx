import type { Guide, RequirementTag } from "@/lib/schema/guide";
import { HUMAN_ONLY_TAGS } from "@/lib/handoff";
import { ActorChip } from "./badges";
import { EvidenceLine } from "./Claims";
import { Icon } from "./ui";

export const TAG_TEXT: Record<RequirementTag, string> = {
  login_or_account: "Sign-in",
  email_or_phone_verification: "Email or phone check",
  two_factor: "2-step verification",
  captcha_or_bot_check: "Bot check",
  identity_or_business_verification: "ID or business check",
  payment: "Payment",
  legal_acceptance: "Accept terms",
  manual_submission: "Manual submission",
  provider_review_wait: "Provider review",
  text_drafting: "Drafting",
  config_check: "Configuration",
  code_writing: "Code",
  docs_reading: "Reading docs",
};

/** The path as a route: solid line where we observed the step, dashed where it is inferred from documentation. */
export function StepList({ steps, id = "route" }: { steps: Guide["steps"]; id?: string }) {
  return (
    <ol id={id} className="relative">
      {steps.map((s, i) => {
        const last = i === steps.length - 1;
        const nextObserved = !last && s.observed && steps[i + 1].observed;
        const tone = s.actor === "agent" ? "agent" : s.actor === "you" ? "you" : "wait";
        const human = s.requires.filter((t) => HUMAN_ONLY_TAGS.includes(t));
        return (
          <li key={s.order} className={`tone-${tone} relative pb-4 pl-14 ${last ? "pb-0" : ""}`}>
            {!last && <span aria-hidden="true" className={`absolute bottom-0 left-[1.2rem] top-11 w-0.5 ${nextObserved ? "route-line-solid" : "route-line"}`} />}
            <span aria-hidden="true" className="absolute left-0 top-1 grid h-10 w-10 place-items-center rounded-full border-2 bg-surface font-mono text-sm font-bold" style={{ borderColor: "var(--tone)", color: "color-mix(in srgb, var(--tone) 75%, var(--ink))" }}>{s.order}</span>
            <details className="group card-flat overflow-hidden transition-shadow open:shadow-[var(--shadow)]">
              <summary className="flex cursor-pointer items-start gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold leading-snug text-ink"><span className="sr-only">Step {s.order}: </span>{s.title}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <ActorChip actor={s.actor} />
                    <span className="inline-flex items-center gap-1 text-xs text-ink-2"><Icon name="clock" className="h-3.5 w-3.5" />{s.estimate}</span>
                    <span className={`inline-flex items-center gap-1 text-xs ${s.observed ? "font-semibold text-[var(--tested)]" : "text-muted"}`}>
                      <Icon name={s.observed ? "eye" : "file"} className="h-3.5 w-3.5" />{s.observed ? "Observed up to this gate" : "From documentation"}
                    </span>
                    {human.length > 0 && <span className="inline-flex items-center gap-1 text-xs text-muted"><Icon name="lock" className="h-3.5 w-3.5" />{human.map((t) => TAG_TEXT[t]).join(" · ")}</span>}
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-2 group-open:hidden">{s.detail}</p>
                </div>
                <Icon name="chevron" className="chev mt-1 h-4 w-4 text-muted" />
              </summary>
              <div className="space-y-3 border-t border-line bg-surface-2/40 p-4 text-sm">
                <p className="leading-relaxed text-ink">{s.detail}</p>
                {s.agentPrep && (
                  <p className="tone-agent tint flex gap-2 rounded-lg border p-3 text-ink">
                    <Icon name="bot" className="mt-0.5 h-4 w-4 text-[var(--agent)]" /><span><strong>Agent prepares:</strong> {s.agentPrep}</span>
                  </p>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {s.requires.map((t) => (
                    <span key={t} className={`chip chip-dashed ${HUMAN_ONLY_TAGS.includes(t) ? "tone-you" : "tone-ink"}`}>{HUMAN_ONLY_TAGS.includes(t) && <Icon name="lock" className="h-3 w-3" />}{TAG_TEXT[t]}</span>
                  ))}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <EvidenceLine evidence={s.evidence} />
                  {s.url && (
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="btn !px-3 !py-1 text-xs">Open provider page <Icon name="external" className="h-3.5 w-3.5" /></a>
                  )}
                </div>
              </div>
            </details>
          </li>
        );
      })}
    </ol>
  );
}
