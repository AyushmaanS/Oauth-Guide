import Link from "next/link";
import { GenerateBox } from "@/components/GenerateBox";
import { evidenceCounts } from "@/components/GuideView";
import { LibraryBrowser, type LibraryItem } from "@/components/LibraryBrowser";
import { DifficultyScale, EvidenceBar, Icon, LevelLadder, type IconName } from "@/components/ui";
import { getLibraryGuides } from "@/lib/guides";

const PRINCIPLES: { icon: IconName; title: string; text: string; visual: "scale" | "evidence" | "lanes" | "ladder" }[] = [
  { icon: "flag", title: "A verdict, not a summary", text: "Difficulty is computed by code from the facts, never chosen by a model. If the sources do not settle it, you see the best and worst case.", visual: "scale" },
  { icon: "shield", title: "Every claim wears its evidence", text: "Tested, documented, reported or unverified, with the source next to it. A claim cannot look more certain than its source.", visual: "evidence" },
  { icon: "user", title: "Who does what, step by step", text: "Anything that needs a login, a code, a payment or a signature is yours. The rest an agent can prepare.", visual: "lanes" },
  { icon: "eye", title: "Observed, not only read", text: "We probe the public path and, for library apps, walk through the console with a free account, then say exactly how far we got.", visual: "ladder" },
];

function Visual({ kind }: { kind: (typeof PRINCIPLES)[number]["visual"] }) {
  if (kind === "scale") return <div className="space-y-3"><DifficultyScale difficulty="hard" large /><DifficultyScale difficulty="unknown" range={{ best: "easy", worst: "hard" }} large /></div>;
  if (kind === "evidence") return <EvidenceBar counts={{ tested: 5, documented: 12, reported: 2, unverified: 3 }} height="h-3" />;
  if (kind === "ladder") return <LevelLadder level="L3" />;
  return (
    <div className="flex h-3 w-full overflow-hidden rounded-full">
      <span className="tone-agent" style={{ width: "46%", background: "var(--tone)" }} /><span className="tone-you" style={{ width: "36%", background: "var(--tone)" }} /><span className="tone-wait" style={{ width: "18%", background: "var(--tone)" }} />
    </div>
  );
}

export default async function Home({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const q = (await searchParams).q;
  const initialQuery = typeof q === "string" ? q : "";
  const guides = getLibraryGuides();
  const items: LibraryItem[] = guides.map((g) => ({
    slug: g.slug,
    appName: g.appName,
    difficulty: g.verdict.difficulty,
    confidence: g.verdict.difficultyConfidence,
    range: g.verdict.difficultyRange,
    summary: g.verdict.summary,
    attemptLevel: g.attemptLevel,
    isFixture: g.slug.endsWith("-fixture"),
    counts: evidenceCounts(g),
    steps: g.steps.length,
  }));
  return (
    <main>
      <section className="contours border-b border-line">
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:pt-20">
          <p className="eyebrow flex items-center gap-2"><Icon name="pin" className="h-3.5 w-3.5" /> A field guide to OAuth approval</p>
          <h1 className="display mt-4 max-w-3xl text-4xl sm:text-5xl">
            How hard is OAuth for this app, <span className="text-accent">really</span>?
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-2">
            Before you build an integration, see whether registering your own OAuth app is an hour or a month, what blocks approval,
            and what an agent can do versus what you must do. Every claim says how well it is evidenced.
          </p>
          <div className="mt-9 max-w-3xl"><GenerateBox initialQuery={initialQuery} /></div>
        </div>
      </section>

      <section id="library" aria-labelledby="lib" className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-16">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow mb-1">The library</p>
            <h2 id="lib" className="display text-3xl sm:text-4xl">Researched, walked through, checked</h2>
            <p className="mt-2 max-w-2xl text-ink-2">Deep-research guides for {guides.filter((g) => !g.slug.endsWith("-fixture")).length} popular providers. Most were walked through in a real account up to the first step only a human may do.</p>
          </div>
        </div>
        <LibraryBrowser items={items} />
      </section>

      <section aria-labelledby="why" className="mx-auto max-w-6xl px-4 pt-24">
        <p className="eyebrow mb-1">Why it reads differently</p>
        <h2 id="why" className="display max-w-3xl text-3xl sm:text-4xl">Not a docs summary. A record of how far we actually got.</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {PRINCIPLES.map((p) => (
            <article key={p.title} className="card flex flex-col gap-5 p-6">
              <div className="flex items-center gap-3"><span className="tone-accent grid h-9 w-9 place-items-center rounded-xl" style={{ background: "color-mix(in srgb, var(--tone) 12%, var(--surface))", color: "var(--tone)" }}><Icon name={p.icon} /></span><h3 className="text-lg font-semibold">{p.title}</h3></div>
              <p className="text-sm leading-relaxed text-ink-2">{p.text}</p>
              <div className="mt-auto rounded-xl border border-line bg-surface-2/50 p-4"><Visual kind={p.visual} /></div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-24">
        <div className="rounded-[var(--radius)] bg-ink p-8 text-paper sm:p-12">
          <h2 className="display max-w-2xl text-3xl sm:text-4xl">Curious how a verdict is made, and what we could not verify?</h2>
          <p className="mt-3 max-w-xl text-[color-mix(in_srgb,var(--paper)_75%,transparent)]">The method, the rubric, the safety rules for our checks and our limits are all written down.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/about" className="btn btn-primary">How it works <Icon name="arrow" /></Link>
            <Link href="#generate" className="btn !bg-transparent !text-paper !border-[color-mix(in_srgb,var(--paper)_35%,transparent)]">Generate a guide</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
