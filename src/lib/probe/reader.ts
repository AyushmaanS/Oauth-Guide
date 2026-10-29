import { z } from "zod";
import type { Classification, PageCategory, PageReading } from "@/lib/schema/guide";
import { CATEGORY_TEXT, GATE_CATEGORIES } from "./categories";
import { PageCategory as PageCategoryEnum } from "@/lib/schema/guide";
import type { LlmClient } from "@/lib/llm";
import { callJson } from "@/lib/llm";
import { wrapUntrusted } from "@/lib/pipeline/gather/sources";
import { UNTRUSTED_RULE } from "@/lib/pipeline/prompts/common";
import { stripText, extractTitle } from "./html";
import type { SafeResult } from "./safefetch";

export { CATEGORY_TEXT, GATE_CATEGORIES };

/** Pages the deterministic classifier could not settle. Hard facts (404, challenge header, password field, 401, errors) never go to a model. */
const READABLE: Classification[] = ["public", "input_required", "js_shell_unclear"];
const MIN_TEXT = 60;

export interface PageFacts {
  url: string;
  title?: string;
  /** First ~1,500 characters of visible text. */
  text: string;
  inputs: string[];
  forms: number;
  code: Classification;
  signals: string[];
}

export interface ReaderLink {
  index: number;
  text: string;
  path: string;
  /** Deterministic score shown to the model as a hint, never as a decision. */
  hint: number;
}

export interface ReaderInput {
  facts: PageFacts;
  /** Present only when the page is public and a next hop is possible. */
  links?: ReaderLink[];
  hop?: number;
}

export interface ReaderOutput {
  reading: PageReading;
  /** Index into `links`, or null for "none continues the setup". Undefined when no links were offered. */
  choice?: number | null;
  choiceReason?: string;
}

export type Reader = (i: ReaderInput) => Promise<ReaderOutput | null>;

export function shouldRead(code: Classification, textLen: number): boolean {
  return READABLE.includes(code) && textLen >= MIN_TEXT;
}

export function buildFacts(url: string, r: SafeResult, code: Classification, signals: string[]): PageFacts {
  const text = stripText(r.body).slice(0, 1500);
  const inputs = [...r.body.matchAll(/<input\b[^>]*>/gi)]
    .map((m) => {
      const type = m[0].match(/\btype\s*=\s*["']?([a-z-]+)/i)?.[1]?.toLowerCase() ?? "text";
      const name = m[0].match(/\b(?:name|id)\s*=\s*["']([^"']{1,30})["']/i)?.[1] ?? "";
      return type === "hidden" ? "" : `${type}${name ? `:${name}` : ""}`;
    })
    .filter(Boolean)
    .slice(0, 10);
  return { url, title: extractTitle(r.body), text, inputs, forms: (r.body.match(/<form\b/gi) ?? []).length, code, signals: signals.slice(0, 6) };
}

// ---- model output -----------------------------------------------------------------------------

const ReaderOut = z.object({
  category: PageCategoryEnum,
  also: z.array(PageCategoryEnum).max(2).optional().default([]),
  other: z.string().max(200).optional(),
  confidence: z.enum(["low", "medium", "high"]),
  quote: z.string().max(400).optional().default(""),
  reason: z.string().max(400).optional().default(""),
  choice: z.number().int().nullable().optional(),
  choiceReason: z.string().max(300).optional(),
});

const norm = (s: string) => s.toLowerCase().replace(/[‘’“”"'`]/g, "").replace(/\s+/g, " ").trim();

/** The quote must be words that really appear in the fetched page (visible text or title). */
export function quoteInPage(quote: string, facts: Pick<PageFacts, "text" | "title">): boolean {
  const q = norm(quote);
  if (q.length < 4) return false;
  return norm(`${facts.title ?? ""} ${facts.text}`).includes(q);
}

const ACCEPTABLE: Partial<Record<Classification, PageCategory[]>> = {
  public: ["public_docs", "app_creation_form", "other"],
  input_required: ["app_creation_form", "sign_up", "sign_in", "invite_waitlist_or_sales", "other"],
};

/** Compare with the deterministic result. A reading on a page the code could not read is never a disagreement. */
export function compareWithCode(code: Classification, category: PageCategory): PageReading["agreement"] {
  if (code === "js_shell_unclear") return "code_unclear";
  return ACCEPTABLE[code]?.includes(category) ? "agree" : "disagree";
}

/** A model reading may end the trace as a gate only when it is confident and its quote is really on the page. */
export function isModelGate(r: PageReading | undefined): boolean {
  return !!r && r.quoteVerified && r.confidence !== "low" && GATE_CATEGORIES.has(r.category);
}

export const READER_SYSTEM = `You read ONE fetched web page from a developer platform's public site and say what kind of page it is, so a guide can state honestly where a developer needs an account or a human. You do not act, click or browse.
${UNTRUSTED_RULE}
Pick the single best category for what the page IS (not what it mentions):
public_docs (documentation or marketing readable without an account), sign_in (asks for existing credentials, including "continue with Google/GitHub/SSO"), sign_up (create an account), bot_check (CAPTCHA, "verify you are human", challenge), verification_code (email, phone or 2FA code), identity_or_business_verification (ID, company or domain verification), payment_required (card or billing needed), terms_acceptance (agreement must be accepted to continue), app_creation_form (the form where a developer creates or registers an app), app_review_submission (submit an app for review or verification), invite_waitlist_or_sales (invite only, waitlist, or contact sales), region_restricted (not available in this region), permission_denied (signed in but not allowed), not_found_or_error (missing page or error), unreadable_page (too little readable text to tell), other.
Use "other" when none fits and describe the page in "other" (max 100 characters). Never force a poor fit. You may add up to 2 "also" categories when the page is clearly more than one thing.
"quote" must be 4 to 20 words copied EXACTLY from the page text that justify your category. If you cannot quote evidence, use confidence "low".
Deterministic hints (status, signals, link scores) are given for context; they may be wrong and do not decide anything.
If links are offered, "choice" is the index of the ONE link most likely to continue toward creating or registering an OAuth app for the stated goal (create or register an app, developer console, credentials, get started, sign-in to the console), or null if none does. If the page itself is a gate (sign_in, bot_check, etc.) choose null. You cannot supply a URL, only an index from the list.
Return ONE JSON object only: {"category": string, "also": string[], "other": string?, "confidence": "low"|"medium"|"high", "quote": string, "reason": string (max 150 chars), "choice": number|null, "choiceReason": string (max 120 chars)}`;

export interface ReaderContext {
  appName: string;
  goal: string;
}

/**
 * One constrained model call per page, zod-validated. The model returns a category, a quote and (optionally) an
 * index into links our code already extracted. It never supplies a URL and never decides the evidence label.
 */
export function makeReader(llm: LlmClient, model: string, ctx: ReaderContext, maxCalls = 14): Reader {
  let calls = 0;
  return async (i) => {
    if (calls++ >= maxCalls) return null;
    const f = i.facts;
    const links = i.links?.length ? i.links.map((l) => `${l.index}. ${l.text || "(no text)"} | ${l.path} | hint:${l.hint}`).join("\n") : "";
    const user = [
      `App: ${ctx.appName}\nGoal: ${ctx.goal}${i.hop ? `\nHop: ${i.hop}` : ""}`,
      `Deterministic classifier said: ${f.code} (${f.signals.join(", ") || "no signals"}). Form count: ${f.forms}. Inputs: ${f.inputs.join(", ") || "none"}.`,
      `Page (untrusted data):\n${wrapUntrusted("page", f.url, `Title: ${f.title ?? "(none)"}\n${f.text}`)}`,
      links ? `Links you may choose from (untrusted data):\n${wrapUntrusted("links", "list", links)}` : "No links are offered: leave choice null.",
    ].join("\n\n");
    const out = await callJson({ llm, model, system: READER_SYSTEM, user, schema: ReaderOut, maxTokens: 900, timeoutMs: 20000, attempts: 2 });
    const quoteVerified = quoteInPage(out.quote, f);
    const other = out.category === "other" ? (out.other ?? out.reason ?? "").slice(0, 120) || "unspecified" : undefined;
    const reading: PageReading = {
      category: out.category,
      also: out.also.filter((c) => c !== out.category).slice(0, 2),
      ...(other ? { other } : {}),
      confidence: out.confidence,
      quote: out.quote.slice(0, 160),
      quoteVerified,
      reason: out.reason.slice(0, 200),
      agreement: compareWithCode(f.code, out.category),
    };
    const offered = i.links?.length ?? 0;
    const choice = offered ? (typeof out.choice === "number" && Number.isInteger(out.choice) && out.choice >= 0 && out.choice < offered ? out.choice : null) : undefined;
    return { reading, ...(choice !== undefined ? { choice } : {}), ...(out.choiceReason ? { choiceReason: out.choiceReason.slice(0, 120) } : {}) };
  };
}
