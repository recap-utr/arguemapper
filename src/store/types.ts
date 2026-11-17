import type { AlertColor } from "@mui/material";
import type { ChatMessage } from "@mui/x-chat/headless";
import type { Viewport } from "@xyflow/react";
import type { StoreApi } from "zustand/vanilla";
import type { AssistantConfig } from "@/assistant/config.js";
import type * as model from "@/model.js";

/**
 * A panel beside the canvas.
 * Wide editors show the text on the left and the inspector, assistant, or settings on the right,
 * narrow ones show the last opened panel below the canvas.
 */
export const allPanels = ["text", "inspector", "assistant", "settings"] as const;
export type Panel = (typeof allPanels)[number];

/** Person using the editor, exported graphs record them as analyst. */
export type AnalystIdentity = Readonly<{ id: string; name?: string; email?: string }>;

/** Message for the user, each new key shows it again, the action e.g. undoes what it reports. */
export type Notice = Readonly<{
  key: string;
  message: string;
  severity: AlertColor;
  action?: Readonly<{ label: string; run: () => void }>;
}>;

/** State of one graph of the workspace, e.g. of a tab. */
export interface DocumentState {
  /** The argument graph, the single source of truth of the canvas. */
  readonly graph: model.Graph;
  /** Id of the resource shown in the text panel, the first one if it is missing. */
  readonly selectedResource?: string;
  readonly selection: model.Selection;
  readonly shouldLayout: boolean;
  readonly shouldFitView: boolean;
  /** Viewport of the canvas, restored when the graph is shown again. Transient. */
  readonly viewport?: Viewport;
  /** Former graphs to undo, the most recent one last. Undo and redo revert the graph only, not the view. */
  readonly past: readonly model.Graph[];
  /** Undone graphs to redo, the most recently undone one last. */
  readonly future: readonly model.Graph[];
  /** Time of the last undoable edit, later edits within a second join its step. Transient. */
  readonly editedAt: number;
}

/** Store of one graph, the id is unique within the workspace. */
export type DocumentStore = StoreApi<DocumentState> & { readonly id: string };

/** Settings of the workspace, which apply to all of its graphs. */
export interface Settings {
  readonly analyst: AnalystIdentity;
  readonly edgeStyle: model.EdgeStyle;
  /** Whether the getting started guide is shown while its steps are not done. */
  readonly guide: boolean;
  readonly imageScale: number;
  readonly layoutAlgorithm: model.LayoutAlgorithm;
  readonly prettifyJson: boolean;
  /** The open panels, the last one was opened most recently. */
  readonly panels: readonly Panel[];
  readonly assistantConfig: AssistantConfig;
  /** API key for the assistant, persisted in the session storage only. */
  readonly assistantApiKey: string;
  /** Transcript of the assistant (MUI X Chat messages), shared by all graphs. */
  readonly assistantMessages: readonly ChatMessage[];
}

export interface WorkspaceState extends Settings {
  /** Whether graphs are opened as tabs, otherwise opening a graph replaces the only one. Fixed. */
  readonly tabs: boolean;
  /** The open graphs in the order of their tabs, there is always at least one. */
  readonly documents: readonly DocumentStore[];
  /** Id of the shown graph. */
  readonly active: string;
  /** Counter of the assistant chat, a new value remounts it and aborts a running reply. Transient. */
  readonly assistantConversation: number;
  /** Message for the user, shown by the editor until it is closed or replaced. Transient. */
  readonly notice?: Notice;
}

export type WorkspaceStore = StoreApi<WorkspaceState>;
