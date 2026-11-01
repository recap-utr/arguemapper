import type { ChatMessage } from "@mui/x-chat/headless";
import type { LanguageModelCallOptions } from "ai";
import type * as arguebuf from "arguebuf";
import type { TemporalState } from "zundo";
import type { StoreApi } from "zustand/vanilla";
import type * as model from "@/model.js";

export interface AssistantConfig {
  model: string;
  baseURL: string;
  /** Reasoning effort, the `reasoning` call setting of the AI SDK. */
  reasoning: NonNullable<LanguageModelCallOptions["reasoning"]>;
}

export const defaultAssistantConfig: AssistantConfig = {
  model: "chatgpt-latest",
  baseURL: "https://api.openai.com/v1",
  reasoning: "medium",
};

/** The given settings completed with the defaults, other fields (e.g. of older versions) are dropped. */
export function resolveAssistantConfig({
  model,
  baseURL,
  reasoning,
}: Partial<AssistantConfig> = {}): AssistantConfig {
  return {
    model: model ?? defaultAssistantConfig.model,
    baseURL: baseURL ?? defaultAssistantConfig.baseURL,
    reasoning: reasoning ?? defaultAssistantConfig.reasoning,
  };
}

/**
 * A panel beside the canvas.
 * Wide screens show the text on the left and the inspector or assistant on the right,
 * narrow screens show the last opened panel below the canvas.
 */
export type Panel = "text" | "inspector" | "assistant";

export interface State {
  analyst: arguebuf.Analyst;
  edgeStyle: model.EdgeStyle;
  /** Whether the getting started guide is shown while its steps are not done. */
  guide: boolean;
  /** The argument graph, the single source of truth of the canvas. */
  graph: model.Graph;
  imageScale: number;
  layoutAlgorithm: model.LayoutAlgorithm;
  prettifyJson: boolean;
  /** Id of the resource shown in the text panel, the first one if it is missing. */
  selectedResource?: string;
  selection: model.Selection;
  shouldLayout: boolean;
  shouldFitView: boolean;
  /** The open panels, the last one was opened most recently. */
  panels: Panel[];
  assistantConfig: AssistantConfig;
  /** API key for the assistant; held in memory only (never persisted). */
  assistantApiKey: string;
  /** Transcript of the assistant (MUI X Chat messages), persisted but not part of the undo history. */
  assistantMessages: ChatMessage[];
  /**
   * Counter of the assistant conversation, bumped to start a fresh one, e.g. when the graph is
   * replaced wholesale or the transcript is cleared. A new value also aborts a running reply. Transient.
   */
  assistantConversation: number;
}

/** Undo and redo revert edits of the graph, not the selection or other view state. */
export type ZundoState = Pick<State, "graph">;

/** A per-instance store: the zustand vanilla store plus the zundo temporal (undo/redo) handle. */
export type ArgueStore = StoreApi<State> & {
  temporal: StoreApi<TemporalState<ZundoState>>;
};
