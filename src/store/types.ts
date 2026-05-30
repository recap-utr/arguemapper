import type { OpenAIResponsesProviderOptions } from "@ai-sdk/openai";
import type * as arguebuf from "arguebuf";
import type { TemporalState } from "zundo";
import type { StoreApi } from "zustand/vanilla";
import type * as model from "../model.js";

export const assistantModels = ["gpt-5.5-nano", "gpt-5.5-mini", "gpt-5.5"];

// `undefined` lets the provider pick its default effort; explicit values come from the AI SDK.
export type ReasoningEffort = OpenAIResponsesProviderOptions["reasoningEffort"];
export const reasoningEfforts = [
  undefined,
  "none",
  "minimal",
  "low",
  "medium",
  "high",
  "xhigh",
] as const satisfies readonly ReasoningEffort[];

export interface AssistantConfig {
  model: string;
  baseURL: string;
  reasoningEffort: ReasoningEffort;
}

/** A pane in the unified sidebar; any number can be open at once, stacked in canonical order. */
export type SidebarSection =
  | "inspector"
  | "resources"
  | "assistant"
  | "importExport"
  | "participants"
  | "configuration";

export interface State {
  analyst: arguebuf.Analyst;
  edges: model.Edge[];
  edgeStyle: model.EdgeStyle;
  firstVisit: boolean;
  graph: model.Graph;
  headerHeight: number;
  imageScale: number;
  layoutAlgorithm: model.LayoutAlgorithm;
  nodes: model.Node[];
  prettifyJson: boolean;
  selectedResourceTab: number;
  selection: model.Selection;
  shouldLayout: boolean;
  shouldFitView: boolean;
  /** Which side of the canvas the sidebar is docked to. */
  sidebarSide: "left" | "right";
  /** The set of open panes; rendered top-to-bottom in canonical section order. Empty => collapsed. */
  sidebarSections: SidebarSection[];
  sidebarWidth: number;
  assistantConfig: AssistantConfig;
  assistantBusy: boolean;
  /** API key for the assistant; held in memory only (never persisted). */
  assistantApiKey: string;
}

export type ZundoState = Pick<
  State,
  "edges" | "graph" | "nodes" | "selectedResourceTab" | "selection"
>;

/** A per-instance store: the zustand vanilla store plus the zundo temporal (undo/redo) handle. */
export type ArgueStore = StoreApi<State> & {
  temporal: StoreApi<TemporalState<ZundoState>>;
};
