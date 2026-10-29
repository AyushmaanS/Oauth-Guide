import type { ReactNode } from "react";
import type { Difficulty, EvidenceLabel } from "@/lib/schema/guide";

/* Presentation primitives shared by every screen. Pure markup and CSS: no data logic lives here. */

const PATHS: Record<string, ReactNode> = {
  search: (<><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>),
  arrow: (<><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>),
  check: <path d="M20 6 9 17l-5-5" />,
  x: (<><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>),
  eye: (<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>),
  file: (<><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" /><path d="M14 3v5h5" /><path d="M9 13h6M9 17h6" /></>),
  lock: (<><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>),
  user: (<><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>),
  bot: (<><rect x="4" y="8" width="16" height="12" rx="3" /><path d="M12 8V5" /><circle cx="12" cy="4" r="1" /><path d="M9 14h.01M15 14h.01" /></>),
  clock: (<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  alert: (<><path d="M12 3 2 20h20Z" /><path d="M12 10v4" /><path d="M12 17h.01" /></>),
  wrench: <path d="M14.7 6.3a4 4 0 0 0 5 5L21 13l-8 8a2.8 2.8 0 0 1-4-4l8-8Z" />,
  external: (<><path d="M14 4h6v6" /><path d="M20 4 10 14" /><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></>),
  chevron: <path d="m9 6 6 6-6 6" />,
  copy: (<><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></>),
  flag: (<><path d="M5 21V4" /><path d="M5 4h11l-2 4 2 4H5" /></>),
  shield: (<><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6Z" /><path d="m9 12 2 2 4-4" /></>),
  layers: (<><path d="m12 3 9 5-9 5-9-5Z" /><path d="m3 13 9 5 9-5" /></>),
  sparkles: (<><path d="M12 3l1.8 4.6L18 9l-4.2 1.4L12 15l-1.8-4.6L6 9l4.2-1.4Z" /><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8Z" /></>),
  globe: (<><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>),
  loader: <path d="M12 3a9 9 0 1 0 9 9" />,
  flask: (<><path d="M9 3h6" /><path d="M10 3v6L4.5 19a2 2 0 0 0 1.8 3h11.4a2 2 0 0 0 1.8-3L14 9V3" /></>),
  message: <path d="M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-5.5A8 8 0 1 1 21 12Z" />,
  help: (<><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7" /><path d="M12 17h.01" /></>),
  pin: (<><path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11Z" /><circle cx="12" cy="10" r="2.5" /></>),
  hourglass: (<><path d="M6 3h12M6 21h12" /><path d="M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9" /></>),
  list: (<><path d="M8 6h13M8 12h13M8 18h13" /><path d="M3 6h.01M3 12h.01M3 18h.01" /></>),
  book: (<><path d="M4 5a2 2 0 0 1 2-2h13v17H6a2 2 0 0 0-2 2Z" /><path d="M4 19V5" /></>),
};

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = "h-4 w-4", spin }: { name: IconName; className?: string; spin?: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`${className} shrink-0 ${spin ? "animate-spin" : ""}`}>
      {PATHS[name]}
    </svg>
  );
}

export function Logo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32" className={className} fill="none">
      <rect width="32" height="32" rx="9" fill="var(--accent)" />
      <path d="M7 22c5 0 4-12 9-12s4 8 9 8" stroke="var(--accent-ink)" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="7" cy="22" r="2.4" fill="var(--accent-ink)" />
      <circle cx="25" cy="18" r="2.4" fill="none" stroke="var(--accent-ink)" strokeWidth="2" />
    </svg>
  );
}

/* ------------------------------------------------------------------ difficulty */
export const DIFF_ORDER: Difficulty[] = ["easy", "moderate", "hard", "gated"];
export const DIFF_TEXT: Record<Difficulty, string> = { easy: "Easy", moderate: "Moderate", hard: "Hard", gated: "Gated", unknown: "Unknown" };
export const DIFF_HINT: Record<Difficulty, string> = {
  easy: "Credentials on a normal account, no required review.",
  moderate: "Some review or several special requirements.",
  hard: "A security assessment, a sensitive-scope review, or weeks of review.",
  gated: "Needs a company, a contract, or a paid or business account.",
  unknown: "The sources do not settle it.",
};

/** Four-step trail grade. The filled step is the verdict; a bracket shows the best-to-worst range when it is not settled. */
export function DifficultyScale({ difficulty, range, large }: { difficulty: Difficulty; range?: { best: Difficulty; worst: Difficulty }; large?: boolean }) {
  const lo = range ? DIFF_ORDER.indexOf(range.best) : -1;
  const hi = range ? DIFF_ORDER.indexOf(range.worst) : -1;
  const active = DIFF_ORDER.indexOf(difficulty);
  return (
    <div role="img" aria-label={difficulty === "unknown" && range && lo >= 0 ? `Difficulty could be anywhere from ${range.best} to ${range.worst}` : `Difficulty: ${DIFF_TEXT[difficulty]}`} className={`flex gap-1 ${large ? "gap-1.5" : ""}`}>
      {DIFF_ORDER.map((d, i) => {
        const isActive = i === active;
        const inRange = lo >= 0 && i >= lo && i <= hi;
        return (
          <span key={d} className={`tone-${d} flex-1 rounded-full ${large ? "h-2.5" : "h-1.5"}`}
            style={{
              background: isActive ? "var(--tone)" : inRange ? "color-mix(in srgb, var(--tone) 38%, var(--surface))" : "color-mix(in srgb, var(--line) 85%, transparent)",
              outline: inRange && !isActive ? "1px dashed color-mix(in srgb, var(--tone) 60%, transparent)" : undefined,
              outlineOffset: 1,
            }} />
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ attempt level */
const LEVELS = [
  { id: "L1", name: "Docs read", tip: "Sources were read and synthesised. Nothing was observed." },
  { id: "L2", name: "Gate probed", tip: "The provider's public pages were requested read-only and the public path followed to the first gate." },
  { id: "L3", name: "Walked through", tip: "A free-account walkthrough in a real browser up to the first human-only step." },
] as const;

export function LevelLadder({ level, compact }: { level: "L1" | "L2" | "L3"; compact?: boolean }) {
  const at = LEVELS.findIndex((l) => l.id === level);
  return (
    <ol aria-label={`Attempt level ${level}: ${LEVELS[at].name}`} className={`flex items-center ${compact ? "gap-1" : "gap-2"}`}>
      {LEVELS.map((l, i) => {
        const reached = i <= at;
        const current = i === at;
        return (
          <li key={l.id} className="flex items-center gap-1" title={`${l.id} — ${l.name}: ${l.tip}`}>
            <span className={`grid place-items-center rounded-full border text-[0.65rem] font-bold ${compact ? "h-5 w-5" : "h-7 w-7"} ${reached ? "border-transparent bg-accent text-[var(--accent-ink)]" : "border-line-strong text-muted"} ${current ? "ring-2 ring-offset-2 ring-offset-[var(--surface)] ring-[var(--accent)]" : ""}`}>
              {l.id.slice(1)}
            </span>
            {!compact && <span className={`text-xs font-medium ${current ? "text-ink" : "text-muted"}`}>{l.name}</span>}
            {i < LEVELS.length - 1 && <span aria-hidden="true" className={`${compact ? "w-2" : "w-5"} h-px ${i < at ? "bg-accent" : "bg-line-strong"}`} />}
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------------------------------------------------ evidence */
export const EVIDENCE_ORDER: EvidenceLabel[] = ["tested", "documented", "reported", "unverified"];
export const EVIDENCE_TEXT: Record<EvidenceLabel, string> = { tested: "Tested", documented: "Documented", reported: "Reported", unverified: "Unverified" };

export function EvidenceBar({ counts, height = "h-2.5" }: { counts: Record<EvidenceLabel, number>; height?: string }) {
  const total = EVIDENCE_ORDER.reduce((n, k) => n + counts[k], 0) || 1;
  return (
    <div role="img" aria-label={EVIDENCE_ORDER.map((k) => `${counts[k]} ${EVIDENCE_TEXT[k].toLowerCase()}`).join(", ")} className={`flex w-full overflow-hidden rounded-full bg-[var(--line)] ${height}`}>
      {EVIDENCE_ORDER.map((k) =>
        counts[k] ? (
          <span key={k} className={`tone-${k}`} style={{ width: `${(counts[k] / total) * 100}%`, background: k === "unverified" ? "repeating-linear-gradient(45deg, var(--tone) 0 3px, transparent 3px 6px)" : "var(--tone)" }} />
        ) : null,
      )}
    </div>
  );
}

export function SectionHeading({ id, eyebrow, title, children }: { id: string; eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <header className="mb-5">
      {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
      <h2 id={id} className="display text-3xl sm:text-4xl">{title}</h2>
      {children && <p className="mt-2 max-w-2xl text-[0.95rem] text-ink-2">{children}</p>}
    </header>
  );
}

export function AppTile({ name, tone = "ink", size = "h-10 w-10 text-lg" }: { name: string; tone?: string; size?: string }) {
  return (
    <span aria-hidden="true" className={`tone-${tone} display grid shrink-0 place-items-center rounded-xl border ${size}`} style={{ background: "color-mix(in srgb, var(--tone) 12%, var(--surface))", borderColor: "color-mix(in srgb, var(--tone) 35%, transparent)", color: "color-mix(in srgb, var(--tone) 75%, var(--ink))" }}>
      {name.trim()[0]?.toUpperCase() ?? "?"}
    </span>
  );
}
