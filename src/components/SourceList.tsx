import type { Guide } from "@/lib/schema/guide";
import { Icon } from "./ui";

const KIND: Record<string, { text: string; tone: string }> = {
  official: { text: "Official", tone: "documented" },
  community: { text: "Community", tone: "reported" },
  third_party: { text: "Third party", tone: "reported" },
};

export function SourceList({ sources }: { sources: Guide["sources"] }) {
  return (
    <ol className="grid gap-3 md:grid-cols-2">
      {sources.map((s) => {
        let host = "";
        try { host = new URL(s.url).hostname.replace(/^www\./, ""); } catch { host = s.url; }
        const k = KIND[s.publisher] ?? KIND.third_party;
        return (
          <li key={s.id} id={`source-${s.id}`} className="card-flat scroll-mt-24 p-3.5 text-sm">
            <div className="flex items-start gap-3">
              <span className="grid h-7 min-w-7 place-items-center rounded-lg bg-surface-2 px-1.5 font-mono text-xs font-bold text-ink-2">{s.id.replace(/^s/, "")}</span>
              <div className="min-w-0 flex-1">
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="group inline-flex items-start gap-1 font-medium text-ink underline-offset-4 hover:underline">
                  <span className="line-clamp-2">{s.title}</span><Icon name="external" className="mt-1 h-3.5 w-3.5 text-muted" />
                </a>
                <p className="mt-0.5 truncate text-xs text-muted">{host}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2"><span className={`chip tone-${k.tone}`}>{k.text}</span><span className="text-xs text-muted">retrieved {s.retrievedAt.slice(0, 10)}</span></div>
                {s.excerpt && <p className="mt-2 text-xs leading-relaxed text-ink-2">{s.excerpt}</p>}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
