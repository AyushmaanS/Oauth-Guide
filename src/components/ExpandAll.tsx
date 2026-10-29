"use client";
import { Icon } from "./ui";

/** Opens or closes every <details> inside the element with the given id. Pure presentation. */
export function ExpandAll({ targetId }: { targetId: string }) {
  const set = (open: boolean) => document.querySelectorAll<HTMLDetailsElement>(`#${targetId} details`).forEach((d) => (d.open = open));
  return (
    <div className="flex gap-2" role="group" aria-label="Expand or collapse every step">
      <button type="button" className="btn !px-3 !py-1 text-xs" onClick={() => set(true)}><Icon name="list" className="h-3.5 w-3.5" /> Expand all</button>
      <button type="button" className="btn !px-3 !py-1 text-xs" onClick={() => set(false)}>Collapse all</button>
    </div>
  );
}
