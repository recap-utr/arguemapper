import type { AlertColor } from "@mui/material";
import type { ChatMessage } from "@mui/x-chat/headless";
import type { LanguageModelCallOptions } from "ai";
import type { TemporalState } from "zundo";
import type { StoreApi } from "zustand/vanilla";
import type * as model from "@/model.js";

export interface AssistantConfig {
  readonly model: string;
  readonly baseURL: string;
  /** Reasoning effort, the `reasoning` call setting of the AI SDK. */
  readonly reasoning: NonNullable<LanguageModelCallOptions["reasoning"]>;
}

/** Connection and model settings of the assistant. */
export interface AssistantSettings extends AssistantConfig {
  /** Optional, local servers usually need none. Persisted for the browser session only. */
  readonly apiKey: string;
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

/** Person using the editor, exported graphs record them as analyst. */
export type AnalystIdentity = Readonly<{ id: string; name?: string; email?: string }>;

/** Message for the user, each new key shows it again. */
export type Notice = Readonly<{ key: string; message: string; severity: AlertColor }>;

export interface State {
  readonly analyst: AnalystIdentity;
  readonly edgeStyle: model.EdgeStyle;
  /** Whether the getting started guide is shown while its steps are not done. */
  readonly guide: boolean;
  /** The argument graph, the single source of truth of the canvas. */
  readonly graph: model.Graph;
  readonly imageScale: number;
  readonly layoutAlgorithm: model.LayoutAlgorithm;
  readonly prettifyJson: boolean;
  /** Id of the resource shown in the text panel, the first one if it is missing. */
  readonly selectedResource?: string;
  readonly selection: model.Selection;
  readonly shouldLayout: boolean;
  readonly shouldFitView: boolean;
  /** The open panels, the last one was opened most recently. */
  readonly panels: readonly Panel[];
  readonly assistantConfig: AssistantConfig;
  /** API key for the assistant, persisted in the session storage only. */
  readonly assistantApiKey: string;
  /** Transcript of the assistant (MUI X Chat messages), persisted but not part of the undo history. */
  readonly assistantMessages: readonly ChatMessage[];
  /**
   * Counter of the assistant chat, a new value remounts it and aborts a running reply,
   * e.g. when the transcript is cleared or the graph is replaced wholesale. Transient.
   */
  readonly assistantConversation: number;
  /** Message for the user, shown by the editor until it is closed or replaced. Transient. */
  readonly notice?: Notice;
}

/** Undo and redo revert edits of the graph, not the selection or other view state. */
export type ZundoState = Pick<State, "graph">;

/** A per-instance store: the zustand vanilla store plus the zundo temporal (undo/redo) handle. */
export type ArgueStore = StoreApi<State> & {
  temporal: StoreApi<TemporalState<ZundoState>>;
};
