"use client";
import { useState } from "react";
import { Icon } from "./ui";

export function AttemptKitPanel({ kit, appName }: { kit: string; appName: string }) {
  const [msg, setMsg] = useState("");
  async function copy() {
    try {
      await navigator.clipboard.writeText(kit);
      setMsg("Kit copied. Read it before you run it.");
    } catch {
      setMsg("Copy failed. Open the preview and select the text.");
    }
    setTimeout(() => setMsg(""), 4000);
  }
  return (
    <details className="card group overflow-hidden">
      <summary className="flex cursor-pointer items-center gap-4 p-5">
        <span className="tone-accent grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={{ background: "color-mix(in srgb, var(--tone) 14%, var(--surface))", color: "var(--tone)" }}><Icon name="sparkles" className="h-5 w-5" /></span>
        <span className="min-w-0 flex-1">
          <span className="display block text-xl">Upgrade this guide with your own agent</span>
          <span className="mt-0.5 block text-sm text-muted">A copy-paste kit that tries the setup in your own free account and stops whenever a human is needed.</span>
        </span>
        <Icon name="chevron" className="chev h-5 w-5 text-muted" />
      </summary>
      <div className="space-y-5 border-t border-line p-5 text-sm">
        <p className="leading-relaxed text-ink-2">
          Our guide for {appName} was built from documentation and read-only checks. You can go further: the kit below is a copy-paste prompt for your own
          browser-capable AI agent. It tries the setup on <strong className="text-ink">your own free account</strong> and stops whenever a human is needed.
        </p>
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <h3 className="eyebrow mb-2">What you need</h3>
            <ul className="space-y-2">
              <li className="flex gap-2"><Icon name="bot" className="mt-0.5 h-4 w-4 text-[var(--agent)]" />An AI agent that can use a browser (for example Claude Code with a browser, or Claude in Chrome).</li>
              <li className="flex gap-2"><Icon name="user" className="mt-0.5 h-4 w-4 text-[var(--you)]" />A free account with the provider, in a separate browser profile.</li>
            </ul>
          </div>
          <div>
            <h3 className="eyebrow mb-2">Five steps</h3>
            <ol className="space-y-1.5">
              {["Copy the kit.", "Paste it into your agent.", "Sign in when the agent asks. You type the password, never the agent.", "The agent stops at the human-only steps; you complete them and tell it to continue.", "Keep the log it returns."].map((t, i) => (
                <li key={i} className="flex gap-2.5"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-surface-2 font-mono text-[0.7rem] font-bold">{i + 1}</span>{t}</li>
              ))}
            </ol>
          </div>
        </div>
        <p role="note" className="tone-moderate tint flex gap-2 rounded-xl border p-3 text-ink">
          <Icon name="alert" className="mt-0.5 h-4 w-4 text-[var(--moderate)]" />
          <span><strong>Read the kit before you run it.</strong> It is generated from this guide, but you are still giving instructions to an agent that acts in your account.</span>
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={copy} className="btn btn-primary"><Icon name="copy" /> Copy the kit</button>
          <span role="status" className="flex items-center gap-1 font-medium text-[var(--tested)]">{msg}</span>
        </div>
        <details>
          <summary className="inline-flex items-center gap-1 text-sm font-medium underline underline-offset-4"><Icon name="chevron" className="chev h-3.5 w-3.5" />Preview the kit</summary>
          <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap rounded-xl border border-line bg-surface-2 p-4 font-mono text-xs leading-relaxed">{kit}</pre>
        </details>
        <p className="text-xs text-muted">
          Your results stay with you. They are not sent to us and are never published as &quot;Verified&quot;. Nothing runs in anyone else&apos;s account.
        </p>
      </div>
    </details>
  );
}
