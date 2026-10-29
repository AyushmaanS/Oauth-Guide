/** Tiny, dependency-free HTML helpers. Nothing here executes or renders content. */

export function stripText(html: string): string {
  return html
    .replace(/<(script|style|noscript|svg|template)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractTitle(html: string): string | undefined {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const t = m ? stripText(m[1]).slice(0, 120) : "";
  return t || undefined;
}

export interface RawLink {
  url: string;
  text: string;
}

/** Anchors with resolved absolute URLs; fragments dropped; non-http(s) schemes dropped. Text is capped. */
export function extractLinks(html: string, base: string, max = 200): RawLink[] {
  const out: RawLink[] = [];
  const re = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  for (let m = re.exec(html); m && out.length < max; m = re.exec(html)) {
    const href = m[1].match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const raw = href?.[1] ?? href?.[2] ?? href?.[3];
    if (!raw || /^(mailto:|tel:|javascript:|data:|#)/i.test(raw.trim())) continue;
    try {
      const u = new URL(raw.trim().replace(/&amp;/g, "&"), base);
      if (u.protocol !== "https:" && u.protocol !== "http:") continue;
      u.hash = "";
      out.push({ url: u.toString(), text: stripText(m[2]).slice(0, 80) });
    } catch {
      /* skip malformed */
    }
  }
  return out;
}
