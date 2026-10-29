import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { EvidenceBadge } from "@/components/EvidenceBadge";
import { DIFF_HINT, DIFF_TEXT, DifficultyScale, Icon, LevelLadder, SectionHeading, type IconName } from "@/components/ui";
import { getLibraryGuides } from "@/lib/guides";
import type { Difficulty, EvidenceLabel } from "@/lib/schema/guide";

export const metadata: Metadata = { title: "How it works" };

const REPO_BASE = process.env.NEXT_PUBLIC_REPO_URL?.replace(/\/$/, "");

function verificationLogs(): string[] {
  const dir = path.join(process.cwd(), "content", "verification");
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".md") && !f.endsWith("-merge-diff.md")).sort() : [];
}

function Block({ id, eyebrow, title, intro, children }: { id: string; eyebrow: string; title: string; intro?: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="scroll-mt-24 border-t border-line pt-14">
      <SectionHeading id={id} eyebrow={eyebrow} title={title}>{intro}</SectionHeading>
      {children}
    </section>
  );
}

const EVIDENCE: { label: EvidenceLabel; text: string }[] = [
  { label: "tested", text: "We observed it directly, and only up to the gate we reached. Reading a page is never “tested”; a tested claim always points at a recorded observation." },
  { label: "documented", text: "An official provider source says so, linked with the date we retrieved it." },
  { label: "reported", text: "Only community or third-party sources say so." },
  { label: "unverified", text: "Inferred, conflicting, or unsourced. Our own estimates, shown with “≈” and an “Estimate” chip, are always unverified." },
];

const RUBRIC: { d: Difficulty; text: string }[] = [
  { d: "gated", text: "A registered company, a partnership contract, or a paid or business account is needed just to register." },
  { d: "hard", text: "A third-party security assessment, a manual review of sensitive scopes, or a required review that takes weeks." },
  { d: "moderate", text: "Some review for public use, or three or more special requirements." },
  { d: "easy", text: "Credentials on a normal account with no required review." },
  { d: "unknown", text: "Not enough verified facts. We never guess a label from missing information: we show the best and worst case and the questions to answer first." },
];

const PIPELINE: { step: string; by: string; tone: string; note: string }[] = [
  { step: "Understand the input, find the provider", by: "Code + one model call", tone: "documented", note: "Rejects private addresses and non-web inputs." },
  { step: "Research", by: "Agent proposes, code runs", tone: "agent", note: "The research agent only proposes a search or a page to read, as JSON. Our code checks it against budgets and allow-lists and runs it. It cannot browse, click or write." },
  { step: "Extract facts, write the guide", by: "Single model calls", tone: "documented", note: "Each returns JSON validated against a schema. Invalid output is repaired once or dropped." },
  { step: "Difficulty, step owners, labels, attempt level", by: "Code only", tone: "tested", note: "Models cannot set them. A model can only lower a label, never raise it." },
  { step: "Check the public path", by: "Code, with a model reading pages", tone: "tested", note: "See the next section." },
  { step: "Self-check", by: "One model call, code applies it", tone: "documented", note: "The reviewer returns verdicts; code downgrades unsupported claims." },
  { step: "Signed-in walkthrough and verification (library)", by: "Claude Code with the owner", tone: "you", note: "Never on this website. The site holds no provider logins and performs no signed-in actions." },
];

const SAFETY: { icon: IconName; text: string }[] = [
  { icon: "lock", text: "https only, and only the provider's own domains and the domains of its official sources." },
  { icon: "shield", text: "Never our own or any private address: DNS is resolved and validated, and the validated address is the one connected to." },
  { icon: "arrow", text: "At most three redirects, never off the allow-list." },
  { icon: "file", text: "No cookies, and a 200 KB cap on every page." },
  { icon: "book", text: "robots.txt is respected: a disallowed page is recorded as skipped, not fetched." },
  { icon: "x", text: "We never type, click or submit. GET only." },
];

const STOPS = ["Login", "Email or phone verification", "2-step verification", "CAPTCHA or bot check", "Identity or business verification", "Payment", "Accepting legal terms", "“Submit for review” (never clicked)"];

const LIMITS = [
  "Live guides are not human-verified. Their labels can differ between runs because a model reads the sources; every estimate is marked.",
  "“Tested” means a specific page was reachable or gated on a specific date, or a step was observed in one walkthrough. It does not mean the whole process was tested, and one run is one run.",
  "Everything behind the first sign-in wall is inferred from documentation unless a walkthrough covered it. Every guide lists what was not observed.",
  "Pages that build themselves with JavaScript cannot be read by our checker, so some paths end early. We chose to say “unclear” instead of guessing.",
  "Review waits depend on your use case, your scopes and the provider's queue. Documented ranges are not promises.",
  "Provider policies change. Each guide shows when it was generated; check the linked sources before you rely on it.",
  "This is not legal advice, and we make no claim about any provider's terms beyond quoting what they say.",
];

export default function About() {
  const logs = verificationLogs();
  const guides = getLibraryGuides().filter((g) => !g.slug.endsWith("-fixture"));
  const walked = guides.filter((g) => g.attemptLevel === "L3").length;
  return (
    <main className="mx-auto max-w-5xl px-4 pb-10">
      <section className="contours -mx-4 border-b border-line px-4 pb-14 pt-14 sm:rounded-b-[2rem]">
        <p className="eyebrow">How it works</p>
        <h1 className="display mt-3 max-w-3xl text-4xl sm:text-5xl">Most guides tell you what the docs say. We tell you <span className="text-accent">how we know</span>.</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-2">
          OAuthPath tells you what it really takes to get OAuth credentials for an app: how hard it is, how long it takes, who has to do each step, and what could block you.
          Every claim says how we know it. This page explains the method and, just as important, what we did not do.
        </p>
        <dl className="mt-8 grid max-w-xl grid-cols-3 gap-3">
          {[[guides.length, "library guides"], [walked, "walked through"], [logs.length, "verification logs"]].map(([n, l]) => (
            <div key={String(l)} className="card-flat p-4"><dd className="display text-3xl">{n}</dd><dt className="text-xs text-muted">{l}</dt></div>
          ))}
        </dl>
      </section>

      <div className="space-y-16">
        <Block id="labels" eyebrow="Evidence" title="Four labels, on every claim" intro="They describe how we know, not how hard the task is.">
          <ul className="grid gap-4 sm:grid-cols-2">
            {EVIDENCE.map((e) => (
              <li key={e.label} className={`tone-${e.label} card-flat p-5`}>
                <EvidenceBadge label={e.label} />
                <p className="mt-3 text-sm leading-relaxed text-ink-2">{e.text}</p>
              </li>
            ))}
          </ul>
        </Block>

        <Block id="levels" eyebrow="Attempt levels" title="How far we actually went" intro="The level says how far we went, and it can never exceed what was done.">
          <div className="card-flat mb-4 p-5"><LevelLadder level="L3" /></div>
          <ol className="grid gap-4 md:grid-cols-3">
            {[
              ["L1", "Docs read", "We read official and community sources. Nothing was observed."],
              ["L2", "Gate probed", "We also requested the provider's public pages (read-only) and followed the public path until the first sign-in wall, bot check or form. No account was used."],
              ["L3", "Signed-in walkthrough", "With the owner's consent, a free account in a separate browser profile was used up to the first step only a human may do. Only library guides can reach L3, and only where the provider's terms allowed it."],
            ].map(([id, name, text]) => (
              <li key={id} className="card-flat p-5"><p className="flex items-center gap-2 font-semibold"><span className="grid h-7 w-7 place-items-center rounded-full bg-accent font-mono text-xs text-[var(--accent-ink)]">{id.slice(1)}</span>{name}</p><p className="mt-2 text-sm leading-relaxed text-ink-2">{text}</p></li>
            ))}
          </ol>
        </Block>

        <Block id="difficulty" eyebrow="The verdict" title="Difficulty is computed, not chosen by a model"
          intro="A language model reads sources and fills in a short list of facts: is review required, how deep, how long is the wait, is a company needed. Plain code then maps those facts to a label, top rule first.">
          <ol className="space-y-2">
            {RUBRIC.map((r, i) => (
              <li key={r.d} className={`tone-${r.d} card-flat grid items-center gap-x-5 gap-y-2 p-4 sm:grid-cols-[3rem_9rem_1fr]`}>
                <span className="font-mono text-xs text-muted">{i + 1}</span>
                <div><p className="font-semibold tone-text">{DIFF_TEXT[r.d]}</p><div className="mt-1.5 max-w-[8rem]"><DifficultyScale difficulty={r.d} range={r.d === "unknown" ? { best: "easy", worst: "gated" } : undefined} /></div></div>
                <p className="text-sm leading-relaxed text-ink-2">{r.text}<span className="sr-only"> {DIFF_HINT[r.d]}</span></p>
              </li>
            ))}
          </ol>
          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-ink-2">
            When sources leave a fact open, a separate step may <em>estimate</em> it, with its reasoning shown. A label that depends on an estimate says so (“Our estimate”), and an estimated number is never counted as documented.
            Who does each step (the agent, you, or the provider&apos;s review queue) is also computed by code from tags such as “needs login” or “needs 2FA”.
          </p>
        </Block>

        <Block id="pipeline" eyebrow="The pipeline" title="Who decides what"
          intro="Two modes share one pipeline. Library guides are researched in depth with a wide fixed search, a stronger model and an always-on self-check, then verified by hand. Live guides (any app you type) use a bounded research agent, a faster model and a lighter check, in about two minutes. Live guides carry less evidence and say so.">
          <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius)] border border-line bg-surface">
            {PIPELINE.map((p) => (
              <li key={p.step} className="grid gap-2 p-4 md:grid-cols-[1fr_13rem_1.4fr] md:items-start md:gap-5">
                <p className="font-medium text-ink">{p.step}</p>
                <p><span className={`chip tone-${p.tone}`}>{p.by}</span></p>
                <p className="text-sm leading-relaxed text-ink-2">{p.note}</p>
              </li>
            ))}
          </ul>
        </Block>

        <Block id="public-path" eyebrow="Observation" title="Checking the public path"
          intro="For every guide we make read-only GET requests to the provider's own public pages and follow the public path for up to five pages. The safety rules are in code and tested.">
          <ul className="grid gap-3 sm:grid-cols-2">
            {SAFETY.map((s) => (<li key={s.text} className="card-flat flex gap-3 p-4 text-sm leading-relaxed text-ink-2"><Icon name={s.icon} className="mt-0.5 h-4 w-4 text-accent" />{s.text}</li>))}
          </ul>
          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-ink-2">
            Each page is classified by code from what the server returned: public, sign-in required, bot check, forbidden, not found, needs typed input, or “unclear (JavaScript page)”. We never guess a gate on a page that builds itself with JavaScript.
            In addition, a model <em>reads</em> pages the code cannot settle: it names the kind of page from a fixed list (or “other” with a description), quotes the words it relied on, and chooses the next link <em>by number</em> from links our code extracted.
            It never supplies a web address. Its answer is shown beside the code&apos;s (“agrees with / differs from the code”), a quote that is not on the page is discarded, and a model-only reading is labelled a reading, never an observation and never “tested”.
            All fetched page text is treated as untrusted data, so instructions hidden in a page have no effect.
          </p>
        </Block>

        <Block id="walkthroughs" eyebrow="Library guides only" title="Signed-in walkthroughs"
          intro="For the library apps whose terms allow it, Claude Code drove the owner's own browser through the provider's developer console with a free account, in a separate browser profile, with throwaway names and no real data.">
          <div className="card-flat p-5">
            <p className="eyebrow mb-3">It stopped and handed back at every step only a human may do</p>
            <ul className="flex flex-wrap gap-2">{STOPS.map((s) => (<li key={s} className="chip tone-you"><Icon name="lock" className="h-3 w-3" />{s}</li>))}</ul>
          </div>
          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-ink-2">
            It never copied secrets anywhere, redacted screenshots, deleted what it created, and only ran after the owner&apos;s written consent for that specific provider. Where a provider&apos;s terms discourage automated use of its console (LinkedIn), no walkthrough was run and the guide says so.
          </p>
        </Block>

        <Block id="kit" eyebrow="Run it yourself" title="The Attempt Kit">
          <div className="card flex gap-4 p-6">
            <span className="tone-accent grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={{ background: "color-mix(in srgb, var(--tone) 14%, var(--surface))", color: "var(--tone)" }}><Icon name="sparkles" className="h-5 w-5" /></span>
            <p className="max-w-3xl text-sm leading-relaxed text-ink-2">
              Each guide includes an <strong className="text-ink">Attempt Kit</strong>: a prompt you can give to your own browser-capable AI agent. It lists the steps, the allowed domains, the stop rules and a log template, and it tells the agent to treat page content as untrusted.
              You run it privately in your own account and decide whether to try it. The website never runs it and never sees your account.
            </p>
          </div>
        </Block>

        <Block id="verification" eyebrow="Verification" title="What we checked, and what we corrected"
          intro="For each library guide we sampled at least eight claims, including every time and effort estimate, checked them against primary sources or the walkthrough log, corrected what was wrong, and downgraded what we could not verify.">
          {logs.length > 0 ? (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {logs.map((f) => (
                <li key={f}>
                  {REPO_BASE ? (
                    <a className="card-flat flex items-center justify-between gap-2 p-4 text-sm font-medium hover:border-ink" href={`${REPO_BASE}/blob/main/content/verification/${f}`}>{f} <Icon name="external" className="h-3.5 w-3.5 text-muted" /></a>
                  ) : (
                    <code className="card-flat block p-4 text-xs">content/verification/{f}</code>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">The verification logs have not been written yet.</p>
          )}
          {guides.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {guides.map((g) => (<li key={g.slug}><Link href={`/guide/${g.slug}`} className={`chip tone-${g.verdict.difficulty} hover:underline`}>{g.appName} · level {g.attemptLevel.slice(1)}</Link></li>))}
            </ul>
          )}
        </Block>

        <Block id="limits" eyebrow="Limits" title="What you should know before relying on this">
          <ul className="grid gap-3 md:grid-cols-2">
            {LIMITS.map((l) => (<li key={l} className="card-flat flex gap-3 p-4 text-sm leading-relaxed text-ink-2"><Icon name="alert" className="mt-0.5 h-4 w-4 text-[var(--moderate)]" />{l}</li>))}
          </ul>
        </Block>
      </div>
    </main>
  );
}
