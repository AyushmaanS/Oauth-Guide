"use client";
import { useState } from "react";

export function ShareBar({ markdown }: { markdown: string }) {
  const [msg, setMsg] = useState("");
  async function copy(text: string, what: string) {
    try {
      await navigator.clipboard.writeText(text);
      setMsg(`${what} copied`);
    } catch {
      setMsg("Copy failed. Select the text manually.");
    }
    setTimeout(() => setMsg(""), 2500);
  }
  const btn = "rounded border border-gray-700 px-3 py-1 text-sm hover:bg-gray-100";
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Share this guide">
      <button type="button" className={btn} onClick={() => copy(window.location.href, "Link")}>Copy link</button>
      <button type="button" className={btn} onClick={() => copy(markdown, "Markdown")}>Copy as markdown</button>
      <span role="status" className="text-sm text-green-800">{msg}</span>
    </div>
  );
}
