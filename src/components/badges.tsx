import type { Actor, Difficulty, Guide } from "@/lib/schema/guide";
import { DIFF_TEXT, Icon, LevelLadder } from "./ui";

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
  const size = large ? "!px-3.5 !py-1 !text-base" : "";
  if (difficulty === "unknown" && range && range.best !== range.worst)
    return (
      <span title="The sources do not settle the difficulty; this is the plausible range." className={`chip chip-dashed tone-unknown ${size}`}>
        <Icon name="help" className="h-3.5 w-3.5" />
        {DIFF_TEXT[range.best]} to {DIFF_TEXT[range.worst].toLowerCase()}
      </span>
    );
  return (
    <span title={confidence === "estimated" ? "Our estimate: some factors are inferred, not stated by sources." : undefined}
      className={`chip tone-${difficulty} ${confidence === "estimated" ? "chip-dashed" : ""} ${size}`}>
      <span className="dot" aria-hidden="true" />
      {DIFF_TEXT[difficulty]}
      {confidence === "estimated" && <span className="font-medium opacity-80">· estimate</span>}
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
    <span title={LEVEL_TIP[level]} className="inline-flex cursor-help items-center gap-2">
      <LevelLadder level={level} compact />
      <span className="text-xs font-semibold text-ink-2">Level {level.slice(1)}</span>
    </span>
  );
}

const ACTOR: Record<Actor, { text: string; icon: "bot" | "user" | "hourglass" }> = {
  agent: { text: "Agent", icon: "bot" },
  you: { text: "You", icon: "user" },
  provider_wait: { text: "Provider wait", icon: "hourglass" },
};

export function ActorChip({ actor }: { actor: Actor }) {
  const a = ACTOR[actor];
  return (
    <span className={`chip ${actor === "agent" ? "tone-agent" : actor === "you" ? "tone-you" : "tone-wait"}`}>
      <Icon name={a.icon} className="h-3.5 w-3.5" />
      {a.text}
    </span>
  );
}
