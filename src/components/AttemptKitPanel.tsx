"use client";
import { useState } from "react";

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
    <details className="rounded border border-gray-400 p-4 text-sm">
      <summary className="cursor-pointer text-base font-semibold">Upgrade this guide: try the setup with your own agent</summary>
      <div className="mt-3 space-y-3">
        <p>
          Our guide for {appName} was built from documentation and read-only checks. You can go further: the kit below is a copy-paste prompt for your own
          browser-capable AI agent. It tries the setup on <strong>your own free account</strong> and stops whenever a human is needed.
        </p>
        <div>
          <h3 className="font-semibold">What you need</h3>
          <ul className="list-disc pl-5">
            <li>An AI agent that can use a browser (for example Claude Code with a browser, or Claude in Chrome).</li>
            <li>A free account with the provider, in a separate browser profile.</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold">Five steps</h3>
          <ol className="list-decimal pl-5">
            <li>Copy the kit.</li>
            <li>Paste it into your agent.</li>
            <li>Sign in when the agent asks. You type the password, never the agent.</li>
            <li>The agent stops at the human-only steps; you complete them and tell it to continue.</li>
            <li>Keep the log it returns.</li>
          </ol>
        </div>
        <p role="note" className="rounded border border-amber-700 bg-amber-50 p-2 text-amber-950">
          <strong>Read the kit before you run it.</strong> It is generated from this guide, but you are still giving instructions to an agent that acts in your account.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={copy} className="rounded border border-gray-900 bg-gray-900 px-3 py-1 text-white">Copy the kit</button>
          <span role="status" className="text-green-800">{msg}</span>
        </div>
        <details>
          <summary className="cursor-pointer">Preview the kit</summary>
          <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap rounded bg-gray-100 p-3 text-xs">{kit}</pre>
        </details>
        <p className="text-xs text-gray-700">
          Your results stay with you. They are not sent to us and are never published as &quot;Verified&quot;. Nothing runs in anyone else&apos;s account.
        </p>
      </div>
    </details>
  );
}
