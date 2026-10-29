/** Deterministic Composio managed-OAuth lookup from the public directory (spec: composioManaged; D-005). */
export const COMPOSIO_URL = "https://docs.composio.dev/toolkits/managed-auth.md";

export interface ComposioDirectory {
  managed: Set<string>;
  byo: Set<string>;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

export function parseDirectory(md: string): ComposioDirectory {
  const managed = new Set<string>();
  const byo = new Set<string>();
  let section: Set<string> | null = null;
  for (const line of md.split("\n")) {
    if (/^##\s+Composio-managed OAuth available/i.test(line)) section = managed;
    else if (/^##\s+Bring your own OAuth/i.test(line)) section = byo;
    else if (/^##\s/.test(line)) section = null;
    const m = line.match(/^\|\s*\[([^\]]+)\]\([^)]*\)\s*\|\s*`([^`]+)`/);
    if (m && section) {
      section.add(norm(m[1]));
      section.add(norm(m[2]));
    }
  }
  return { managed, byo };
}

export function lookupComposio(dir: ComposioDirectory, appName: string): "yes" | "no" | "unknown" {
  const k = norm(appName);
  if (dir.managed.has(k)) return "yes";
  if (dir.byo.has(k)) return "no";
  return "unknown";
}

export async function fetchDirectory(fetchFn: typeof fetch = fetch): Promise<ComposioDirectory | null> {
  try {
    const res = await fetchFn(COMPOSIO_URL, { signal: AbortSignal.timeout(15000), headers: { "User-Agent": "OAuthPathBot/1.0" } });
    if (!res.ok) return null;
    const dir = parseDirectory(await res.text());
    return dir.managed.size ? dir : null;
  } catch {
    return null;
  }
}
