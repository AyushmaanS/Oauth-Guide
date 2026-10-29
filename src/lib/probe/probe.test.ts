import { describe, it, expect, vi } from "vitest";
import { isPrivateIp, parseRobots, robotsAllows, safeGet, type Resolver, type SafeGetOptions, type Transport, type TransportResponse } from "./safefetch";
import { classify } from "./classify";
import { extractLinks, extractTitle, stripText } from "./html";

const pub: Resolver = async () => [{ address: "93.184.216.34", family: 4 }];
const resp = (over: Partial<TransportResponse> = {}): TransportResponse => ({ status: 200, headers: {}, body: Buffer.from("<html>ok</html>"), truncated: false, ...over });
function transportOf(handler: (url: URL, ip: { address: string }) => Partial<TransportResponse> | Error) {
  const seen: string[] = [];
  const t: Transport = {
    async get(url, ip, _h, opts) {
      seen.push(url.toString());
      void opts;
      if (url.pathname === "/robots.txt") { const r = handler(url, ip); if (r instanceof Error) throw r; return resp(r); }
      const r = handler(url, ip);
      if (r instanceof Error) throw r;
      return resp(r);
    },
  };
  return { t, seen };
}
const base: SafeGetOptions = { allowHosts: ["example.com"], resolver: pub, checkRobots: false };

describe("isPrivateIp", () => {
  it.each(["127.0.0.1", "10.1.2.3", "172.16.0.1", "172.31.255.1", "192.168.1.1", "169.254.169.254", "0.0.0.0", "100.64.0.1", "224.0.0.1", "::1", "::", "fd00::1", "fe80::1", "::ffff:127.0.0.1", "::ffff:7f00:1", "::ffff:10.0.0.1", "not-an-ip"])("flags %s", (ip) => expect(isPrivateIp(ip)).toBe(true));
  it.each(["8.8.8.8", "93.184.216.34", "2606:4700:4700::1111", "172.32.0.1"])("allows %s", (ip) => expect(isPrivateIp(ip)).toBe(false));
});

describe("safeGet: SSRF protections", () => {
  it.each(["10.0.0.5", "127.0.0.1", "169.254.169.254", "::1", "fd00::1", "::ffff:127.0.0.1"])("blocks a host that resolves to %s", async (address) => {
    const { t, seen } = transportOf(() => ({}));
    const r = await safeGet("https://api.example.com/x", { ...base, resolver: async () => [{ address, family: address.includes(":") ? 6 : 4 }], transport: t });
    expect(r.ok).toBe(false);
    expect(r.blocked?.reason).toBe("policy");
    expect(seen).toEqual([]);
  });
  it("blocks if ANY resolved address is private", async () => {
    const { t, seen } = transportOf(() => ({}));
    const r = await safeGet("https://example.com/", { ...base, resolver: async () => [{ address: "93.184.216.34", family: 4 }, { address: "10.0.0.1", family: 4 }], transport: t });
    expect(r.blocked?.reason).toBe("policy");
    expect(seen).toEqual([]);
  });
  it("blocks http, IP-literal hosts, credentials in the URL, and hosts off the allow-list", async () => {
    const { t, seen } = transportOf(() => ({}));
    for (const u of ["http://example.com/", "https://93.184.216.34/", "https://[::1]/", "https://user:pw@example.com/", "https://evil.test/", "https://notexample.com/", "https://example.com.evil.test/"])
      expect((await safeGet(u, { ...base, transport: t })).blocked?.reason).toBe("policy");
    expect(seen).toEqual([]);
  });
  it("connects to the validated IP (DNS pinning)", async () => {
    let used = "";
    const t: Transport = { async get(_u, ip) { used = ip.address; return resp(); } };
    await safeGet("https://example.com/", { ...base, resolver: async () => [{ address: "93.184.216.34", family: 4 }], transport: t });
    expect(used).toBe("93.184.216.34");
  });
  it("re-validates every redirect hop: an allowed name that now resolves privately is blocked", async () => {
    const resolver: Resolver = async (h) => (h === "internal.example.com" ? [{ address: "10.0.0.9", family: 4 }] : [{ address: "93.184.216.34", family: 4 }]);
    const { t, seen } = transportOf((url) => (url.hostname === "example.com" ? { status: 302, headers: { location: "https://internal.example.com/admin" } } : {}));
    const r = await safeGet("https://example.com/start", { ...base, resolver, transport: t });
    expect(r.blocked?.reason).toBe("policy");
    expect(seen).toEqual(["https://example.com/start"]);
  });
  it("does not follow a redirect off the allow-list; records it", async () => {
    const { t, seen } = transportOf(() => ({ status: 302, headers: { location: "https://accounts.other.com/login" } }));
    const r = await safeGet("https://example.com/console", { ...base, transport: t });
    expect(r.ok).toBe(true);
    expect(r.status).toBe(302);
    expect(r.location).toBe("https://accounts.other.com/login");
    expect(seen).toEqual(["https://example.com/console"]);
  });
  it("does not follow a redirect to http", async () => {
    const { t } = transportOf(() => ({ status: 301, headers: { location: "http://example.com/plain" } }));
    expect((await safeGet("https://example.com/", { ...base, transport: t })).location).toBe("http://example.com/plain");
  });
  it("follows allowed redirects up to 3, then stops", async () => {
    let n = 0;
    const { t } = transportOf(() => ({ status: 302, headers: { location: `https://example.com/r${++n}` } }));
    const r = await safeGet("https://example.com/", { ...base, transport: t });
    expect(r.blocked?.detail).toBe("too many redirects");
    const ok = transportOf((u) => (u.pathname === "/" ? { status: 302, headers: { location: "/a" } } : { body: Buffer.from("done") }));
    const r2 = await safeGet("https://example.com/", { ...base, transport: ok.t });
    expect(r2.body).toBe("done");
    expect(r2.redirects).toBe(1);
  });
  it("passes the size cap and timeout to the transport and surfaces truncation", async () => {
    const spy = vi.fn(async (...args: unknown[]) => (void args, resp({ truncated: true, body: Buffer.from("x".repeat(10)) })));
    const r = await safeGet("https://example.com/", { ...base, transport: { get: spy as never }, maxBytes: 1234, timeoutMs: 777 });
    expect(spy.mock.calls[0][3]).toEqual({ timeoutMs: 777, maxBytes: 1234 });
    expect(r.truncated).toBe(true);
  });
  it("a timeout or network error is a soft block, not a throw", async () => {
    const { t } = transportOf(() => new Error("timeout"));
    const r = await safeGet("https://example.com/", { ...base, transport: t });
    expect(r.ok).toBe(false);
    expect(r.blocked?.reason).toBe("error");
  });
  it("sends no cookies or auth headers and a fixed identifying user agent", async () => {
    let hdr: Record<string, string> = {};
    const t: Transport = { async get(_u, _i, h) { hdr = h; return resp(); } };
    await safeGet("https://example.com/", { ...base, transport: t });
    expect(Object.keys(hdr).map((k) => k.toLowerCase())).not.toContain("cookie");
    expect(Object.keys(hdr).map((k) => k.toLowerCase())).not.toContain("authorization");
    expect(hdr["User-Agent"]).toMatch(/^OAuthPathBot\/1\.0/);
  });
});

describe("robots.txt", () => {
  const robots = "User-agent: *\nDisallow: /private\nAllow: /private/open\n\nUser-agent: OAuthPathBot\nDisallow: /nobots\n";
  it("parses groups, prefers the specific agent, longest match wins", () => {
    const r = parseRobots(robots);
    expect(robotsAllows(r, "/nobots/x")).toBe(false);
    expect(robotsAllows(r, "/private")).toBe(true); // the specific group replaces the * group
    const star = parseRobots("User-agent: *\nDisallow: /private\nAllow: /private/open\n");
    expect(robotsAllows(star, "/private/x")).toBe(false);
    expect(robotsAllows(star, "/private/open/x")).toBe(true);
    expect(robotsAllows(star, "/public")).toBe(true);
  });
  it("skips a disallowed path and fetches robots.txt once per host", async () => {
    let robotsCalls = 0;
    const { t, seen } = transportOf((u) => { if (u.pathname === "/robots.txt") { robotsCalls++; return { body: Buffer.from(robots) }; } return {}; });
    const cache = new Map();
    const a = await safeGet("https://example.com/nobots/page", { ...base, checkRobots: true, transport: t, robotsCache: cache });
    expect(a.blocked?.reason).toBe("robots");
    const b = await safeGet("https://example.com/fine", { ...base, checkRobots: true, transport: t, robotsCache: cache });
    expect(b.ok).toBe(true);
    expect(robotsCalls).toBe(1);
    expect(seen).toContain("https://example.com/fine");
  });
  it("a missing robots.txt means no rules", async () => {
    const { t } = transportOf((u) => (u.pathname === "/robots.txt" ? { status: 404 } : {}));
    expect((await safeGet("https://example.com/x", { ...base, checkRobots: true, transport: t })).ok).toBe(true);
  });
});

describe("classify (fixtures)", () => {
  const big = "Documentation about creating an application and configuring OAuth. ".repeat(20);
  const c = (o: Partial<Parameters<typeof classify>[0]>) => classify({ status: 200, finalUrl: "https://example.com/docs", headers: {}, body: `<html><body><p>${big}</p></body></html>`, ...o });
  it("public page", () => expect(c({}).classification).toBe("public"));
  it("404 and 410", () => { expect(c({ status: 404 }).classification).toBe("not_found"); expect(c({ status: 410 }).classification).toBe("not_found"); });
  it("403 without login signals is forbidden", () => expect(c({ status: 403 }).classification).toBe("forbidden"));
  it("401 with WWW-Authenticate is a login gate", () => expect(c({ status: 401, headers: { "www-authenticate": "Bearer" } }).classification).toBe("login_redirect"));
  it("redirect not followed to a login host", () => expect(c({ status: 302, location: "https://accounts.other.com/ServiceLogin" }).classification).toBe("login_redirect"));
  it("redirect not followed to an ordinary off-list host is blocked_by_policy, not a gate", () => expect(c({ status: 302, location: "https://www.other.com/page" }).classification).toBe("blocked_by_policy"));
  it("final URL on a login path", () => expect(c({ finalUrl: "https://example.com/login?next=/apps", body: "<form><input name=u></form>" }).classification).toBe("login_redirect"));
  it("a long documentation page on a sign-in-looking path with a search form is not a login gate", () => { const r = c({ finalUrl: "https://developers.example.com/identity/sign-in/ios/api-access", body: `<form><input type="text" name="q"></form><p>${big.repeat(3)}</p>` }); expect(r.classification).toBe("public"); });
  it("password input", () => { const r = c({ body: `<form><input type="password"></form><p>${big}</p>` }); expect(r.classification).toBe("login_redirect"); expect(r.signals).toContain("password_input"); });
  it("Cloudflare header challenge", () => expect(c({ status: 403, headers: { "cf-mitigated": "challenge" } }).classification).toBe("captcha_or_bot"));
  it("reCAPTCHA marker on a thin page", () => expect(c({ body: '<div class="g-recaptcha"></div><p>short</p>' }).classification).toBe("captcha_or_bot"));
  it("JavaScript shell is unclear, never a guessed gate", () => {
    const r = c({ body: '<html><body><div id="root"></div><script src="/app.js"></script></body></html>' });
    expect(r.classification).toBe("js_shell_unclear");
    expect(r.signals).toContain("js_shell");
  });
  it("short form with required inputs is input_required", () => {
    const r = c({ body: '<html><body><h1>Create app</h1><p>Fill in the details below to create your app and continue to the next step now.</p><form><input type="text" name="n" required><input type="email" name="e" required></form><p>' + "x ".repeat(250) + "</p></body></html>" });
    expect(r.classification).toBe("input_required");
  });
  it("a docs page with a search box stays public", () => expect(c({ body: `<form><input type="search" name="q"></form><p>${big}</p>` }).classification).toBe("public"));
  it("5xx is an error", () => expect(c({ status: 503, body: "oops" }).classification).toBe("error"));
});

describe("html helpers", () => {
  it("strips scripts and tags", () => expect(stripText("<p>Hi <script>evil()</script><b>there</b></p>")).toBe("Hi there"));
  it("extracts title", () => expect(extractTitle("<title> My   Page </title>")).toBe("My Page"));
  it("extracts absolute links, drops mailto/javascript/fragments", () => {
    const l = extractLinks('<a href="/a#x">A</a><a href="mailto:x@y.z">M</a><a href="javascript:alert(1)">J</a><a href="https://other.com/b">B</a><a href="#top">T</a>', "https://example.com/docs/");
    expect(l.map((x) => x.url)).toEqual(["https://example.com/a", "https://other.com/b"]);
  });
});
