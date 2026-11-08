import { createStore } from "zustand/vanilla";
import { defaultAssistantConfig } from "@/assistant/config.js";
import * as model from "@/model.js";
import type {
  DocumentState,
  DocumentStore,
  Settings,
  WorkspaceState,
  WorkspaceStore,
} from "@/store/types.js";

export interface DocumentInit {
  /** Id within the workspace, a new one by default. */
  readonly id?: string;
  /** The graph, an empty one by default. */
  readonly graph?: model.Graph;
  readonly selectedResource?: string;
  /** Former graphs to undo, the most recent one last. */
  readonly past?: readonly model.Graph[];
  /** Undone graphs to redo, the most recently undone one last. */
  readonly future?: readonly model.Graph[];
}

/** Create the store of one graph with its own undo history. */
export function createDocumentStore({
  id = crypto.randomUUID().slice(0, 8),
  graph = model.newGraph(),
  selectedResource,
  past = [],
  future = [],
}: DocumentInit = {}): DocumentStore {
  const store = createStore<DocumentState>()(() => ({
    graph,
    selectedResource,
    selection: model.emptySelection,
    shouldLayout: false,
    shouldFitView: true,
    past,
    future,
    editedAt: 0,
  }));

  // Every change of the graph, e.g. an edit or an undo, deselects the removed elements.
  store.subscribe((state, previous) => {
    if (state.graph !== previous.graph) {
      const selection = model.pruneSelection(state.graph, state.selection);

      if (selection !== state.selection) store.setState({ selection });
    }
  });

  return Object.assign(store, { id });
}

export interface WorkspaceInit {
  /** Settings that differ from the defaults. */
  readonly settings?: Partial<Settings>;
  /** The graphs to open, unless the documents are given. */
  readonly graphs?: readonly model.Graph[];
  /** The open graphs, a new empty one if there are none. */
  readonly documents?: readonly DocumentStore[];
  /** Id of the shown graph, the first one by default. */
  readonly active?: string;
  /** Whether graphs are opened as tabs, enabled by default. */
  readonly tabs?: boolean;
}

/**
 * Create the store of a workspace, which holds the settings and the open graphs.
 * Each editor owns one, so that several editors on a page share nothing.
 */
export function createWorkspaceStore({
  settings,
  graphs = [],
  documents = graphs.map((graph) => createDocumentStore({ graph })),
  active,
  tabs = true,
}: WorkspaceInit = {}): WorkspaceStore {
  const opened = documents.length > 0 ? documents : [createDocumentStore()];
  const defaults: Settings = {
    analyst: { id: crypto.randomUUID() },
    guide: true,
    layoutAlgorithm: "layered",
    edgeStyle: "step",
    prettifyJson: true,
    imageScale: 3,
    panels: ["text", "inspector"],
    assistantConfig: defaultAssistantConfig,
    assistantApiKey: "",
    assistantMessages: [],
  };

  return createStore<WorkspaceState>()(() => ({
    ...defaults,
    ...settings,
    tabs,
    documents: opened,
    active: opened.find((doc) => doc.id === active)?.id ?? opened[0].id,
    assistantConversation: 0,
  }));
}
