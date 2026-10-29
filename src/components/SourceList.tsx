import type { Guide } from "@/lib/schema/guide";

export function SourceList({ sources }: { sources: Guide["sources"] }) {
  return (
    <ol className="space-y-2 text-sm">
      {sources.map((s) => (
        <li key={s.id} id={`source-${s.id}`} className="scroll-mt-4">
          <span className="font-mono text-xs">[{s.id.replace(/^s/, "")}]</span>{" "}
          <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-blue-800 underline">{s.title}</a>{" "}
          <span className="text-xs text-gray-700">({s.publisher}, retrieved {s.retrievedAt})</span>
          {s.excerpt && <p className="text-xs text-gray-700">{s.excerpt}</p>}
        </li>
      ))}
    </ol>
  );
}
