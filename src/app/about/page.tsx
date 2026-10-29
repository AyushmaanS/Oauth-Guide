import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { getLibraryGuides } from "@/lib/guides";

export const metadata: Metadata = { title: "How it works" };

const REPO_BASE = process.env.NEXT_PUBLIC_REPO_URL?.replace(/\/$/, "");

function verificationLogs(): string[] {
  const dir = path.join(process.cwd(), "content", "verification");
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".md") && !f.endsWith("-merge-diff.md")).sort() : [];
}

const H2 = "mt-10 text-xl font-semibold";

export default function About() {
  const logs = verificationLogs();
  const guides = getLibraryGuides().filter((g) => !g.slug.endsWith("-fixture"));
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold">How OAuthPath works</h1>
      <p className="mt-2 text-gray-800">
        OAuthPath tells you what it really takes to get OAuth credentials for an app: how hard it is, how long it takes, who has to do each step, and what could block you.
        Every claim says how we know it. This page explains the method and, just as important, what we did not do.
      </p>

      <h2 className={H2}>Evidence labels</h2>
      <p className="mt-2 text-sm">Every claim on a guide carries one of four labels. They describe how we know, not how hard the task is.</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        <li><strong>Tested</strong>: we observed it directly, and only up to the gate we reached. Reading a page is never &ldquo;tested&rdquo;; a tested claim always points at a recorded observation.</li>
        <li><strong>Documented</strong>: an official provider source says so (linked, with the date we retrieved it).</li>
        <li><strong>Reported</strong>: only community or third-party sources say so.</li>
        <li><strong>Unverified</strong>: inferred, conflicting, or unsourced. Our own estimates (shown with &ldquo;≈&rdquo; and an &ldquo;Estimate&rdquo; chip) are always unverified.</li>
      </ul>

      <h2 className={H2}>Attempt levels</h2>
      <p className="mt-2 text-sm">The level says how far we actually went, and it can never exceed what was done.</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        <li><strong>L1: docs read.</strong> We read official and community sources. Nothing was observed.</li>
        <li><strong>L2: gate probed.</strong> We also requested the provider&rsquo;s public pages (read-only) and followed the public path until the first sign-in wall, bot check or form. No account was used.</li>
        <li><strong>L3: signed-in walkthrough.</strong> With the owner&rsquo;s consent, a free account in a separate browser profile was used up to the first step only a human may do. Only library guides can reach L3, and only where the provider&rsquo;s terms allowed it.</li>
      </ul>

      <h2 className={H2}>Difficulty is computed, not chosen by a model</h2>
      <p className="mt-2 text-sm">
        A language model reads sources and fills in a short list of facts (is review required, how deep, how long is the wait, is a company needed&hellip;). Plain code then maps those facts to a label, top rule first:
      </p>
      <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
        <li><strong>Gated</strong>: a registered company, a partnership contract, or a paid or business account is needed just to register.</li>
        <li><strong>Hard</strong>: a third-party security assessment, a manual review of sensitive scopes, or a required review that takes weeks.</li>
        <li><strong>Moderate</strong>: some review for public use, or three or more special requirements.</li>
        <li><strong>Easy</strong>: credentials on a normal account with no required review.</li>
        <li><strong>Unknown</strong>: not enough verified facts. We never guess a label from missing information; we show the best and worst case instead (&ldquo;could be anywhere from easy to hard&rdquo;) and the questions to answer first.</li>
      </ol>
      <p className="mt-2 text-sm">
        When sources leave a fact open, a separate step may <em>estimate</em> it, with its reasoning shown. A label that depends on an estimate says so (&ldquo;Our estimate&rdquo;) and an estimated number is never counted as documented.
        Who does each step (the agent, you, or the provider&rsquo;s review queue) is also computed by code from tags such as &ldquo;needs login&rdquo; or &ldquo;needs 2FA&rdquo;.
      </p>

      <h2 className={H2}>How a guide is produced</h2>
      <p className="mt-2 text-sm">
        Two modes share the same pipeline. <strong>Library guides</strong> are researched in depth with a wide fixed search, a stronger model and an always-on self-check, then verified by hand (below).
        <strong> Live guides</strong> (any app you type) use a bounded research agent, a faster model and a lighter check, in about two minutes. Live guides carry less evidence and say so.
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Who decides what in the pipeline</caption>
          <thead><tr className="border-b text-xs uppercase text-gray-700"><th className="py-1 pr-3">Step</th><th className="pr-3">Done by</th><th>Notes</th></tr></thead>
          <tbody className="align-top">
            <tr className="border-b border-gray-200"><td className="py-1 pr-3">Understand the input, find the provider</td><td className="pr-3">Code + one model call</td><td>Rejects private addresses and non-web inputs.</td></tr>
            <tr className="border-b border-gray-200"><td className="py-1 pr-3">Research</td><td className="pr-3">Research agent (live) or fixed search (library)</td><td>The agent only <em>proposes</em> a search or a page to read as JSON. Our code checks the request against budgets and allow-lists and runs it. It cannot browse, click or write.</td></tr>
            <tr className="border-b border-gray-200"><td className="py-1 pr-3">Extract facts, write the guide</td><td className="pr-3">Single model calls</td><td>Each returns JSON that is validated against a schema. Invalid output is repaired once or dropped.</td></tr>
            <tr className="border-b border-gray-200"><td className="py-1 pr-3">Difficulty, step owners, labels, attempt level</td><td className="pr-3">Code only</td><td>Models cannot set them. A model can only lower a label, never raise it.</td></tr>
            <tr className="border-b border-gray-200"><td className="py-1 pr-3">Check the public path</td><td className="pr-3">Code, with a model reading pages</td><td>See below.</td></tr>
            <tr className="border-b border-gray-200"><td className="py-1 pr-3">Self-check</td><td className="pr-3">One model call, code applies it</td><td>The reviewer returns verdicts; code downgrades unsupported claims.</td></tr>
            <tr><td className="py-1 pr-3">Signed-in walkthrough and verification (library)</td><td className="pr-3">Claude Code with the owner</td><td>Never on this website. The site holds no provider logins and performs no signed-in actions.</td></tr>
          </tbody>
        </table>
      </div>

      <h2 className={H2}>Checking the public path</h2>
      <p className="mt-2 text-sm">
        For every guide we make read-only GET requests to the provider&rsquo;s own public pages and follow the public path for up to five pages. The safety rules are in code and tested:
        https only; only the provider&rsquo;s domains and the domains of its official sources; never our own or any private address (DNS is resolved and validated, and the validated address is the one connected to); at most three redirects and never off the allow-list;
        no cookies; a 200 KB cap; robots.txt respected (a page it disallows is recorded as skipped, not fetched). We never type, click or submit.
      </p>
      <p className="mt-2 text-sm">
        Each page is classified by code from what the server returned: public, sign-in required, bot check, forbidden, not found, needs typed input, or &ldquo;unclear (JavaScript page)&rdquo;. We never guess a gate on a page that builds itself with JavaScript.
        In addition, a model <em>reads</em> pages the code cannot settle: it names the kind of page from a fixed list (or &ldquo;other&rdquo; with a description), quotes the words it relied on, and chooses the next link <em>by number</em> from links our code extracted.
        It never supplies a web address. Its answer is shown beside the code&rsquo;s (&ldquo;agrees with / differs from the code&rdquo;), a quote that is not on the page is discarded, and a model-only reading is labelled a reading, never an observation and never &ldquo;tested&rdquo;.
        All fetched page text is treated as untrusted data, so instructions hidden in a page have no effect.
      </p>

      <h2 className={H2}>Signed-in walkthroughs (library guides only)</h2>
      <p className="mt-2 text-sm">
        For the library apps whose terms allow it, Claude Code drove the owner&rsquo;s own browser through the provider&rsquo;s developer console with a <strong>free account, in a separate browser profile, with throwaway names and no real data</strong>.
        It stopped and handed back at every step only a human may do: login, email or phone verification, 2FA, CAPTCHA, identity or business verification, payment, accepting legal terms, and any &ldquo;submit for review&rdquo; button (never clicked).
        It never copied secrets anywhere, redacted screenshots, deleted what it created, and only ran after the owner&rsquo;s written consent for that specific provider. Where a provider&rsquo;s terms discourage automated use of its console (LinkedIn), no walkthrough was run and the guide says so.
      </p>

      <h2 className={H2}>Run it yourself: the Attempt Kit</h2>
      <p className="mt-2 text-sm">
        Each guide includes an <strong>Attempt Kit</strong>: a prompt you can give to your own browser-capable AI agent. It lists the steps, the allowed domains, the stop rules and a log template, and it tells the agent to treat page content as untrusted.
        You run it privately in your own account and decide whether to try it. The website never runs it and never sees your account.
      </p>

      <h2 className={H2}>Verification</h2>
      <p className="mt-2 text-sm">
        For each library guide we sampled at least eight claims (including every time and effort estimate) and checked them against primary sources or the walkthrough log, corrected what was wrong, and downgraded what we could not verify.
      </p>
      {logs.length > 0 ? (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {logs.map((f) => (
            <li key={f}>{REPO_BASE ? <a className="underline" href={`${REPO_BASE}/blob/main/content/verification/${f}`}>{f}</a> : <code>content/verification/{f}</code>}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-gray-700">The verification logs have not been written yet.</p>
      )}
      {guides.length > 0 && (
        <p className="mt-3 text-sm text-gray-700">Library guides: {guides.map((g) => `${g.appName} (${g.attemptLevel})`).join(", ")}.</p>
      )}

      <h2 className={H2}>Limits you should know about</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        <li>Live guides are not human-verified. Their labels can differ between runs because a model reads the sources; every estimate is marked.</li>
        <li>&ldquo;Tested&rdquo; means a specific page was reachable or gated on a specific date, or a step was observed in one walkthrough. It does not mean the whole process was tested, and one run is one run.</li>
        <li>Everything behind the first sign-in wall is inferred from documentation unless a walkthrough covered it. Every guide lists what was not observed.</li>
        <li>Pages that build themselves with JavaScript cannot be read by our checker, so some paths end early. We chose to say &ldquo;unclear&rdquo; instead of guessing.</li>
        <li>Review waits depend on your use case, your scopes and the provider&rsquo;s queue. Documented ranges are not promises.</li>
        <li>Provider policies change. Each guide shows when it was generated; check the linked sources before you rely on it.</li>
        <li>This is not legal advice, and we make no claim about any provider&rsquo;s terms beyond quoting what they say.</li>
      </ul>
    </main>
  );
}
