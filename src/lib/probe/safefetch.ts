import dns from "node:dns/promises";
import https from "node:https";
import net from "node:net";
import zlib from "node:zlib";

/**
 * SSRF-safe, read-only GET (spec 6.7). Rules enforced here, not in callers:
 * https only; host must be on the allow-list; every address of every hop must be public (checked again on each
 * redirect, and the validated IP is the one connected to, so DNS cannot change between check and use);
 * max 3 redirects, never followed off the allow-list; GET only; no cookies; capped body; timeout; robots.txt.
 */

export type BlockReason = "policy" | "robots" | "error";

export interface SafeResult {
  ok: boolean;
  blocked?: { reason: BlockReason; detail: string };
  status?: number;
  /** URL reached after followed redirects. */
  finalUrl: string;
  finalHost: string;
  /** Location of a redirect that was not followed. */
  location?: string;
  headers: Record<string, string | undefined>;
  body: string;
  truncated: boolean;
  redirects: number;
}

export interface TransportResponse {
  status: number;
  headers: Record<string, string | undefined>;
  body: Buffer;
  truncated: boolean;
}
export interface Transport {
  get(url: URL, ip: { address: string; family: number }, headers: Record<string, string>, opts: { timeoutMs: number; maxBytes: number }): Promise<TransportResponse>;
}
export type Resolver = (host: string) => Promise<{ address: string; family: number }[]>;

export interface SafeGetOptions {
  allowHosts: string[];
  timeoutMs?: number;
  maxBytes?: number;
  maxRedirects?: number;
  userAgent?: string;
  resolver?: Resolver;
  transport?: Transport;
  checkRobots?: boolean;
  /** Shared robots cache for one run. */
  robotsCache?: Map<string, RobotsRules | null>;
}

export const USER_AGENT = `OAuthPathBot/1.0 (+${process.env.SITE_URL || "https://oauthpath.example"}/about)`;

/** Loopback, private, link-local, CGNAT, multicast, reserved and cloud-metadata addresses (v4 and v6). */
export function isPrivateIp(ip: string): boolean {
  const v = net.isIP(ip);
  if (v === 4) {
    const [a, b, c] = ip.split(".").map(Number);
    return (
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0 && c === 0) ||
      (a === 198 && (b === 18 || b === 19)) ||
      (a === 192 && b === 0 && c === 2) || (a === 198 && b === 51 && c === 100) || (a === 203 && b === 0 && c === 113)
    );
  }
  if (v === 6) {
    const l = ip.toLowerCase();
    if (l === "::" || l === "::1") return true;
    const mapped = l.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/) ?? l.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
    if (mapped) {
      if (mapped.length === 2) return isPrivateIp(mapped[1]);
      const hi = parseInt(mapped[1], 16), lo = parseInt(mapped[2], 16);
      return isPrivateIp(`${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`);
    }
    return /^(fc|fd|fe[89ab]|ff|2001:db8|64:ff9b)/.test(l);
  }
  return true; // not an IP at all: treat as unsafe
}

/** Registrable domain, with a small guard for common two-level suffixes (co.uk, com.au, ...). */
export function registrable(host: string): string {
  const l = host.toLowerCase().split(".");
  if (l.length >= 3 && l[l.length - 1].length === 2 && ["co", "com", "org", "net", "gov", "ac", "ne"].includes(l[l.length - 2])) return l.slice(-3).join(".");
  return l.slice(-2).join(".");
}

export const hostAllowed = (host: string, allow: string[]) => {
  const h = host.toLowerCase();
  return allow.some((d) => h === d.toLowerCase() || h.endsWith("." + d.toLowerCase()));
};

const defaultResolver: Resolver = async (host) => (await dns.lookup(host, { all: true })).map((a) => ({ address: a.address, family: a.family }));

/** Real transport: connects to the pinned, already-validated IP; SNI and Host use the real name. */
export const httpsTransport: Transport = {
  get(url, ip, headers, { timeoutMs, maxBytes }) {
    return new Promise((resolve, reject) => {
      const req = https.request(
        {
          host: url.hostname,
          servername: url.hostname,
          port: url.port || 443,
          path: url.pathname + url.search,
          method: "GET",
          headers,
          lookup: (_h, _o, cb) => (_o && (_o as { all?: boolean }).all ? (cb as unknown as (e: null, a: unknown) => void)(null, [{ address: ip.address, family: ip.family }]) : cb(null, ip.address, ip.family)),
          timeout: timeoutMs,
        },
        (res) => {
          const enc = String(res.headers["content-encoding"] ?? "").toLowerCase();
          const stream: NodeJS.ReadableStream = enc === "gzip" ? res.pipe(zlib.createGunzip()) : enc === "br" ? res.pipe(zlib.createBrotliDecompress()) : enc === "deflate" ? res.pipe(zlib.createInflate()) : res;
          const chunks: Buffer[] = [];
          let size = 0;
          let truncated = false;
          const finish = () => resolve({ status: res.statusCode ?? 0, headers: flat(res.headers), body: Buffer.concat(chunks), truncated });
          stream.on("data", (c: Buffer) => {
            if (truncated) return;
            size += c.length;
            if (size > maxBytes) {
              truncated = true;
              chunks.push(c.subarray(0, c.length - (size - maxBytes)));
              res.destroy();
              finish();
            } else chunks.push(c);
          });
          stream.on("end", () => !truncated && finish());
          stream.on("error", (e) => (truncated ? undefined : reject(e)));
        },
      );
      req.on("timeout", () => req.destroy(new Error("timeout")));
      req.on("error", reject);
      req.end();
    });
  },
};
const flat = (h: import("node:http").IncomingHttpHeaders) => Object.fromEntries(Object.entries(h).map(([k, v]) => [k.toLowerCase(), Array.isArray(v) ? v.join(", ") : v]));

// ---- robots.txt -------------------------------------------------------------------------------
export interface RobotsRules {
  disallow: string[];
  allow: string[];
}
export function parseRobots(txt: string, agent = "oauthpathbot"): RobotsRules {
  const groups: { agents: string[]; allow: string[]; disallow: string[] }[] = [];
  let cur: (typeof groups)[number] | null = null;
  let lastWasAgent = false;
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim();
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const k = m[1].toLowerCase(), v = m[2].trim();
    if (k === "user-agent") {
      if (!cur || !lastWasAgent) groups.push((cur = { agents: [], allow: [], disallow: [] }));
      cur.agents.push(v.toLowerCase());
      lastWasAgent = true;
    } else if (cur && (k === "allow" || k === "disallow")) {
      lastWasAgent = false;
      if (v) cur[k].push(v);
    } else lastWasAgent = false;
  }
  const specific = groups.filter((g) => g.agents.some((a) => a && agent.includes(a) && a !== "*"));
  const chosen = specific.length ? specific : groups.filter((g) => g.agents.includes("*"));
  return { allow: chosen.flatMap((g) => g.allow), disallow: chosen.flatMap((g) => g.disallow) };
}
/** Longest matching rule wins; Allow wins ties. Supports * and $ in patterns. */
export function robotsAllows(r: RobotsRules, pathAndQuery: string): boolean {
  const match = (pat: string) => {
    const re = new RegExp("^" + pat.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\\\$$/, "$"));
    return re.test(pathAndQuery) ? pat.length : -1;
  };
  const a = Math.max(-1, ...r.allow.map(match));
  const d = Math.max(-1, ...r.disallow.map(match));
  return d < 0 || a >= d;
}

// ---- main ----------------------------------------------------------------------------------------
const blocked = (url: string, reason: BlockReason, detail: string, redirects = 0): SafeResult => ({
  ok: false, blocked: { reason, detail }, finalUrl: url, finalHost: hostSafe(url), headers: {}, body: "", truncated: false, redirects,
});
const hostSafe = (u: string) => {
  try {
    return new URL(u).hostname;
  } catch {
    return "";
  }
};

async function validatedIp(host: string, resolver: Resolver): Promise<{ address: string; family: number } | string> {
  if (net.isIP(host)) return "IP-literal hosts are not allowed";
  let addrs;
  try {
    addrs = await resolver(host);
  } catch {
    return "DNS lookup failed";
  }
  if (!addrs.length) return "no addresses";
  const bad = addrs.find((a) => isPrivateIp(a.address));
  if (bad) return "resolves to a non-public address";
  return addrs[0];
}

export async function safeGet(rawUrl: string, o: SafeGetOptions): Promise<SafeResult> {
  const timeoutMs = o.timeoutMs ?? (Number(process.env.PROBE_TIMEOUT_MS) || 8000);
  const maxBytes = o.maxBytes ?? 200_000;
  const maxRedirects = o.maxRedirects ?? 3;
  const resolver = o.resolver ?? defaultResolver;
  const transport = o.transport ?? httpsTransport;
  const headers = { "User-Agent": o.userAgent ?? USER_AGENT, Accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.5", "Accept-Encoding": "gzip, deflate, br" };
  const robotsCache = o.robotsCache ?? new Map<string, RobotsRules | null>();

  let current: URL;
  try {
    current = new URL(rawUrl);
  } catch {
    return blocked(rawUrl, "policy", "not a valid URL");
  }
  for (let hop = 0; hop <= maxRedirects; hop++) {
    if (current.protocol !== "https:") return blocked(current.toString(), "policy", "only https is allowed", hop);
    if (current.username || current.password) return blocked(current.toString(), "policy", "credentials in URL are not allowed", hop);
    if (!hostAllowed(current.hostname, o.allowHosts)) return blocked(current.toString(), "policy", `host not on the allow-list: ${current.hostname}`, hop);
    const ip = await validatedIp(current.hostname, resolver);
    if (typeof ip === "string") return blocked(current.toString(), "policy", ip, hop);

    if (o.checkRobots !== false && !current.pathname.endsWith("/robots.txt")) {
      const key = current.hostname;
      if (!robotsCache.has(key)) {
        try {
          const r = await transport.get(new URL(`https://${key}/robots.txt`), ip, headers, { timeoutMs, maxBytes: 100_000 });
          robotsCache.set(key, r.status === 200 ? parseRobots(r.body.toString("utf8")) : null);
        } catch {
          robotsCache.set(key, null); // unreachable robots.txt: treated as no rules
        }
      }
      const rules = robotsCache.get(key);
      if (rules && !robotsAllows(rules, current.pathname + current.search)) return blocked(current.toString(), "robots", "disallowed by robots.txt", hop);
    }

    let res: TransportResponse;
    try {
      res = await transport.get(current, ip, headers, { timeoutMs, maxBytes });
    } catch (e) {
      return blocked(current.toString(), "error", String((e as Error).message).slice(0, 80), hop);
    }
    if (res.status >= 300 && res.status < 400 && res.headers.location) {
      let next: URL;
      try {
        next = new URL(res.headers.location, current);
      } catch {
        return blocked(current.toString(), "error", "bad redirect location", hop);
      }
      // Re-validate on every hop. A redirect off the allow-list (or to http) is recorded, never followed.
      if (next.protocol !== "https:" || !hostAllowed(next.hostname, o.allowHosts)) {
        return { ok: true, status: res.status, finalUrl: current.toString(), finalHost: current.hostname, location: next.toString(), headers: res.headers, body: "", truncated: false, redirects: hop };
      }
      current = next;
      continue;
    }
    return { ok: true, status: res.status, finalUrl: current.toString(), finalHost: current.hostname, headers: res.headers, body: res.body.toString("utf8"), truncated: res.truncated, redirects: hop };
  }
  return blocked(current.toString(), "policy", "too many redirects", maxRedirects);
}
