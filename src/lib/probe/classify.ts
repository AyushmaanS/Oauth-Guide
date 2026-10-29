import type { Classification } from "@/lib/schema/guide";
import { stripText } from "./html";

export interface ClassifyInput {
  status: number;
  /** URL actually reached (after followed redirects), or the requested URL. */
  finalUrl: string;
  /** Location header when the last response was a redirect that was NOT followed. */
  location?: string;
  headers: Record<string, string | undefined>;
  body: string;
}

export interface Classified {
  classification: Classification;
  signals: string[];
}

const LOGIN_PATH = /\/(log-?in|sign-?in|signin|sso|auth|oauth\/authorize|session|accounts?\/login|users?\/sign_in)(\/|$|\?)/i;
const LOGIN_HOST = /^(accounts|auth|login|id|sso|signin)\./i;
const BOT_MARKERS: [RegExp, string][] = [
  [/g-recaptcha|recaptcha\/api|google\.com\/recaptcha/i, "recaptcha"],
  [/h-captcha|hcaptcha\.com/i, "hcaptcha"],
  [/cf-challenge|cf-turnstile|challenges\.cloudflare\.com|Just a moment\.\.\./i, "cloudflare_challenge"],
  [/Attention Required! \| Cloudflare/i, "cloudflare_block"],
  [/px-captcha|perimeterx|datadome/i, "bot_vendor"],
  [/please verify you are (a )?human|are you a robot/i, "human_check_text"],
];

export function isLoginUrl(u: string): boolean {
  try {
    const url = new URL(u);
    return LOGIN_HOST.test(url.hostname) || LOGIN_PATH.test(url.pathname + url.search);
  } catch {
    return false;
  }
}

/** Visible text length and shell hints used to avoid ever guessing a gate on JavaScript apps. */
function bodySignals(body: string) {
  const text = stripText(body);
  const lower = body.toLowerCase();
  const forms = (body.match(/<form\b/gi) ?? []).length;
  const requiredInputs = (body.match(/<(input|select|textarea)\b[^>]*\brequired\b/gi) ?? []).length;
  const textInputs = (body.match(/<input\b[^>]*type\s*=\s*["']?(text|email|url|tel|search)\b/gi) ?? []).length;
  return {
    textLen: text.length,
    password: /<input\b[^>]*type\s*=\s*["']?password/i.test(body),
    appRoot: /<div[^>]+id\s*=\s*["'](root|__next|app|__nuxt|__sapper)["']/i.test(body) || lower.includes("enable javascript") || /<noscript>[\s\S]{0,300}javascript/i.test(body),
    forms,
    requiredInputs,
    textInputs,
  };
}

/** Pure and conservative: when unsure, say unclear. Never claims a gate that was not clearly observed. */
export function classify(i: ClassifyInput): Classified {
  const signals: string[] = [`status:${i.status}`];
  const h = (k: string) => i.headers[k.toLowerCase()];
  const b = bodySignals(i.body);

  // Redirects we did not follow (they would leave the allow-list)
  if (i.status >= 300 && i.status < 400) {
    if (i.location && isLoginUrl(i.location)) {
      signals.push(`redirect:${safePath(i.location)}`);
      return { classification: "login_redirect", signals };
    }
    signals.push(`redirect_off_policy:${safeHost(i.location)}`);
    return { classification: "blocked_by_policy", signals };
  }

  if (h("cf-mitigated") === "challenge") {
    signals.push("cf-mitigated:challenge");
    return { classification: "captcha_or_bot", signals };
  }
  for (const [re, name] of BOT_MARKERS) if (re.test(i.body.slice(0, 60_000))) {
    signals.push(`bot_marker:${name}`);
    if (i.status === 403 || i.status === 429 || i.status === 503 || b.textLen < 1500) return { classification: "captcha_or_bot", signals };
  }

  if (i.status === 404 || i.status === 410) return { classification: "not_found", signals };

  const loginUrl = isLoginUrl(i.finalUrl);
  if (loginUrl) signals.push(`login_url:${safePath(i.finalUrl)}`);
  if (i.status === 401 || i.status === 403) {
    if (loginUrl || h("www-authenticate") || b.password) return { classification: "login_redirect", signals };
    return { classification: "forbidden", signals };
  }
  if (i.status >= 400) return { classification: "error", signals };

  if (b.password) {
    signals.push("password_input");
    return { classification: "login_redirect", signals };
  }
  if (loginUrl && b.forms > 0) return { classification: "login_redirect", signals };

  signals.push(`text_len:${b.textLen}`);
  if (i.status >= 200 && i.status < 300) {
    if (b.textLen < 400 || (b.appRoot && b.textLen < 800)) {
      signals.push("js_shell");
      return { classification: "js_shell_unclear", signals };
    }
    // A short page that is mostly a form with required inputs: stop, never type or submit.
    if (b.forms > 0 && b.requiredInputs > 0 && b.textInputs > 0 && b.textLen < 1500) {
      signals.push("form_required_inputs");
      return { classification: "input_required", signals };
    }
    return { classification: "public", signals };
  }
  return { classification: "error", signals };
}

const safePath = (u: string) => {
  try {
    return new URL(u).pathname.slice(0, 40);
  } catch {
    return "?";
  }
};
const safeHost = (u?: string) => {
  try {
    return u ? new URL(u, "https://x.invalid").hostname.slice(0, 60) : "?";
  } catch {
    return "?";
  }
};
