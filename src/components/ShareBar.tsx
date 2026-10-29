"use client";
import { useState } from "react";
import { Icon } from "./ui";

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
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Share this guide">
      <button type="button" className="btn" onClick={() => copy(window.location.href, "Link")}><Icon name="copy" /> Copy link</button>
      <button type="button" className="btn" onClick={() => copy(markdown, "Markdown")}><Icon name="file" /> Copy as markdown</button>
      <span role="status" className="flex items-center gap-1 text-sm font-medium text-[var(--tested)]">{msg && <><Icon name="check" className="h-4 w-4" />{msg}</>}</span>
    </div>
  );
}
