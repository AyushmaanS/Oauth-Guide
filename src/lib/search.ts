import { tavily } from "@tavily/core";

export interface SearchHit {
  url: string;
  title: string;
  snippet: string;
}
export interface ExtractedPage {
  url: string;
  title?: string;
  text: string;
}
export interface SearchProvider {
  search(query: string, max?: number): Promise<SearchHit[]>;
  extract(urls: string[]): Promise<ExtractedPage[]>;
}

const withTimeout = <T>(p: Promise<T>, ms: number, what: string): Promise<T> =>
  new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${what} timed out after ${ms} ms`)), ms);
    p.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); },
    );
  });

/** Per-page text budget (characters) to keep prompts bounded. */
export const PAGE_CHAR_BUDGET = 6000;

export function tavilyProvider(timeoutMs = 20000): SearchProvider {
  const key = process.env.TAVILY_API_KEY;
  if (!key) throw new Error("TAVILY_API_KEY is not set");
  const client = tavily({ apiKey: key });
  return {
    async search(query, max = 5) {
      const r = await withTimeout(client.search(query, { maxResults: max }), timeoutMs, "search");
      return r.results.map((x) => ({ url: x.url, title: x.title, snippet: (x.content ?? "").slice(0, 300) }));
    },
    async extract(urls) {
      if (!urls.length) return [];
      const r = await withTimeout(client.extract(urls), timeoutMs * 2, "extract");
      return r.results.map((x) => ({ url: x.url, title: (x as { title?: string }).title, text: (x.rawContent ?? "").slice(0, PAGE_CHAR_BUDGET) }));
    },
  };
}
