import type { Actor, Difficulty, Guide } from "@/lib/schema/guide";

const DIFF: Record<Difficulty, { text: string; cls: string }> = {
  easy: { text: "Easy", cls: "bg-green-100 text-green-900 border-green-700" },
  moderate: { text: "Moderate", cls: "bg-yellow-100 text-yellow-900 border-yellow-700" },
  hard: { text: "Hard", cls: "bg-orange-100 text-orange-900 border-orange-700" },
  gated: { text: "Gated", cls: "bg-red-100 text-red-900 border-red-700" },
  unknown: { text: "Unknown", cls: "bg-gray-100 text-gray-900 border-gray-500 border-dashed" },
};

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

export function DifficultyBadge({
  difficulty,
  large,
  confidence,
  range,
}: {
  difficulty: Difficulty;
  large?: boolean;
  confidence?: "established" | "estimated" | "unresolved";
  range?: { best: Difficulty; worst: Difficulty };
}) {
  const d = DIFF[difficulty];
  const size = large ? "px-3 py-1 text-xl" : "px-2 py-0.5 text-xs";
  if (difficulty === "unknown" && range && range.best !== range.worst)
    return (
      <span title="The sources do not settle the difficulty; this is the plausible range." className={`inline-block rounded border border-dashed border-gray-600 bg-gray-100 font-semibold text-gray-900 ${size}`}>
        {cap(range.best)} to {range.worst}
      </span>
    );
  return (
    <span title={confidence === "estimated" ? "Our estimate: some factors are inferred, not stated by sources." : undefined}
      className={`inline-block rounded border font-semibold ${d.cls} ${confidence === "estimated" ? "border-dashed" : ""} ${size}`}>
      {d.text}
      {confidence === "estimated" && <span className={large ? "ml-2 text-sm font-medium" : "ml-1 font-medium"}>(estimate)</span>}
    </span>
  );
}

const LEVEL_TIP: Record<Guide["attemptLevel"], string> = {
  L1: "L1 — Docs read: sources were read and synthesized. Nothing was observed directly.",
  L2: "L2 — Gate probed: step URLs were requested read-only and the public path followed to the first access gate.",
  L3: "L3 — Signed-in walkthrough: a free-account walkthrough in a real browser up to the first human-only step.",
};

export function AttemptLevelBadge({ level }: { level: Guide["attemptLevel"] }) {
  return (
    <span title={LEVEL_TIP[level]} className="inline-flex cursor-help items-center rounded border border-indigo-700 bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-900">
      Attempt level {level}
    </span>
  );
}

const ACTOR: Record<Actor, { text: string; icon: string; cls: string }> = {
  agent: { text: "Agent", icon: "🤖", cls: "bg-sky-50 text-sky-900 border-sky-700" },
  you: { text: "You", icon: "👤", cls: "bg-rose-50 text-rose-900 border-rose-700" },
  provider_wait: { text: "Waiting on provider", icon: "⏳", cls: "bg-gray-100 text-gray-900 border-gray-600" },
};

export function ActorChip({ actor }: { actor: Actor }) {
  const a = ACTOR[actor];
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium ${a.cls}`}>
      <span aria-hidden="true">{a.icon}</span>
      {a.text}
    </span>
  );
}
