import type { ChecklistId, Source } from "@/lib/schema/guide";
import type { LlmClient } from "@/lib/llm";
import type { SearchHit, SearchProvider } from "@/lib/search";
import type { ChecklistEntry } from "./gather/checklist";
import type { ComposioDirectory } from "./composio";

export type PipelineMode = "fast" | "deep";

export type PipelineEvent =
  | { type: "stage_start"; stage: string; label: string }
  | { type: "stage_done"; stage: string }
  | { type: "source_found"; title: string; url: string }
  | { type: "agent_step"; n: number; action: "search" | "read"; target: string; reason: string }
  | { type: "checklist"; items: { item: ChecklistId; status: "pending" | "covered" | "partial" | "not_found" }[] }
  | { type: "warning"; message: string }
  | { type: "complete"; slug: string };

export interface Ctx {
  emit: (e: PipelineEvent) => void;
  /** Epoch ms after which stages are skipped and the guide is finalised as incomplete. */
  deadline: number;
}

export interface Deps {
  llm: LlmClient;
  search: SearchProvider;
  /** Returns null if the directory cannot be read (best effort). */
  composio: () => Promise<ComposioDirectory | null>;
  now: () => Date;
}

export interface Models {
  fast: string;
  deep: string;
}

export interface Resolved {
  appName: string;
  slug: string;
  providerSite: string;
  providerDomains: string[];
  supportsOAuth: "yes" | "no" | "unclear";
  docsUrls: string[];
  note: string;
  /** Search results seen while resolving; used as sources for a "no OAuth" result. */
  hits: SearchHit[];
}

export interface Gathered {
  sources: Source[];
  texts: Map<string, string>;
  checklist: ChecklistEntry[];
  composio: { value: "yes" | "no" | "unknown"; sourceId?: string };
  searches: number;
  pageReads: number;
  warnings: string[];
  method: "agent" | "fixed" | "fixed_fallback";
  /** Agent trace (truncated), shown in "How this was researched". */
  agentSteps?: { action: "search" | "read"; target: string; reason: string }[];
}

export type { ChecklistId };
