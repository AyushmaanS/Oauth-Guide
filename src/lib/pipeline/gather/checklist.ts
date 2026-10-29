import type { ChecklistId } from "@/lib/schema/guide";

export const ALL_CHECKLIST: ChecklistId[] = [
  "registration",
  "review_process",
  "scopes_restrictions",
  "timing_evidence",
  "requirements",
  "rate_limits",
  "community_reports",
  "composio_status",
];
export const REQUIRED_CHECKLIST: ChecklistId[] = ["registration", "review_process", "scopes_restrictions", "timing_evidence", "requirements"];

export interface ChecklistEntry {
  item: ChecklistId;
  status: "covered" | "partial" | "not_found";
  sourceIds: string[];
}

export interface SourceText {
  id: string;
  publisher: "official" | "community" | "third_party";
  text: string;
}

/** What each checklist item looks like in retrieved text (text-presence check, deliberately simple). */
export const ITEM_PATTERNS: Record<Exclude<ChecklistId, "composio_status">, RegExp[]> = {
  registration: [/\b(register|create|new)\b[^.\n]{0,40}\b(app|application|client|integration|connection)\b/i],
  review_process: [/\b(review|verif(y|ication)|approv(al|ed)|audit|assessment)\b/i],
  scopes_restrictions: [/\bscopes?\b/i],
  timing_evidence: [/\b\d+\s*(-|–|to)?\s*\d*\s*(business\s+)?(minutes?|hours?|days?|weeks?|months?)\b/i, /\b(review|approv|verif)/i],
  requirements: [/\b(privacy policy|terms of service|homepage|callback url|redirect ur[il]|domain|requirements?)\b/i],
  rate_limits: [/\brate[- ]limit/i],
  community_reports: [/\b(rejected|denied|stuck|took|waited|waiting|delay|weeks|months)\b/i],
};

/**
 * Retrieval coverage: does retrieved text for the item exist, and from an official source?
 * covered: an official source matches (community_reports: a non-official source matches);
 * partial: only non-official sources match; not_found: nothing matches.
 * This says what we found to read, not that the guide's claims are right.
 * composio_status comes from code (directory lookup), passed in.
 */
export function coverageFromTexts(sources: SourceText[], composio: { value: string; sourceId?: string }): ChecklistEntry[] {
  return ALL_CHECKLIST.map((item): ChecklistEntry => {
    if (item === "composio_status")
      return composio.sourceId ? { item, status: "covered", sourceIds: [composio.sourceId] } : { item, status: "not_found", sourceIds: [] };
    const pats = ITEM_PATTERNS[item];
    const matches = sources.filter((s) => s.id !== composio.sourceId && pats.every((p) => p.test(s.text)));
    const ids = matches.map((m) => m.id);
    if (item === "community_reports") {
      const nonOfficial = matches.filter((m) => m.publisher !== "official");
      return { item, status: nonOfficial.length ? "covered" : "not_found", sourceIds: nonOfficial.map((m) => m.id) };
    }
    const official = matches.some((m) => m.publisher === "official");
    return { item, status: official ? "covered" : ids.length ? "partial" : "not_found", sourceIds: ids };
  });
}
