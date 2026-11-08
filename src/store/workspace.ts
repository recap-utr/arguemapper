import type { GraphSession, GraphWorkspace } from "@/assistant/tools.js";
import * as model from "@/model.js";
import { createDocumentStore, type DocumentInit } from "@/store/createStore.js";
import { commit } from "@/store/history.js";
import type {
  DocumentState,
  DocumentStore,
  Notice,
  WorkspaceState,
  WorkspaceStore,
} from "@/store/types.js";

/** The open graph with the id, if any. */
export const findDocument = (
  { documents }: WorkspaceState,
  id: string,
): DocumentStore | undefined => documents.find((doc) => doc.id === id);

/** The shown graph. */
export const activeDocument = (state: WorkspaceState): DocumentStore =>
  findDocument(state, state.active) ?? state.documents[0];

/** Show the message to the user, replacing the current one. */
export function notify(
  workspace: WorkspaceStore,
  message: string,
  severity: Notice["severity"],
  action?: Notice["action"],
): void {
  workspace.setState({ notice: { key: crypto.randomUUID(), message, severity, action } });
}

/** Insert the graph as a tab, at the end by default, and show it. */
function insertDocument(
  workspace: WorkspaceStore,
  doc: DocumentStore,
  index: number = workspace.getState().documents.length,
): void {
  workspace.setState(({ documents }) => ({
    documents: documents.toSpliced(index, 0, doc),
    active: doc.id,
  }));
}

/**
 * Open the graph in a new tab and show it.
 * Like in browsers, it takes the place of the shown tab if that holds an unused empty graph.
 * Workspaces without tabs replace their graph instead, which the user can undo.
 */
export function openDocument(workspace: WorkspaceStore, init: DocumentInit): DocumentStore {
  const state = workspace.getState();
  const shown = activeDocument(state);

  if (!state.tabs) {
    commit(shown, init.graph ?? model.newGraph(), {
      selection: model.emptySelection,
      selectedResource: init.selectedResource,
      shouldLayout: false,
      shouldFitView: true,
    });

    return shown;
  }

  const doc = createDocumentStore(init);
  const { graph, past, future } = shown.getState();

  if (model.isEmptyGraph(graph) && past.length === 0 && future.length === 0) {
    workspace.setState({
      documents: state.documents.map((current) => (current === shown ? doc : current)),
      active: doc.id,
    });
  } else {
    insertDocument(workspace, doc);
  }

  return doc;
}

/** Show the graph with the id. */
export function showDocument(workspace: WorkspaceStore, id: string): void {
  workspace.setState({ active: id });
}

/**
 * Close the graph with the id, which the user can undo unless it was empty.
 * Closing the last graph opens an empty one.
 */
export function closeDocument(workspace: WorkspaceStore, id: string): void {
  const { documents, active } = workspace.getState();
  const index = documents.findIndex((doc) => doc.id === id);

  if (index === -1) {
    return;
  }

  const closed = documents[index];
  const rest = documents.toSpliced(index, 1);
  const remaining = rest.length > 0 ? rest : [createDocumentStore()];
  workspace.setState({
    documents: remaining,
    active: active === id ? remaining[Math.min(index, remaining.length - 1)].id : active,
  });

  const { graph } = closed.getState();

  if (!model.isEmptyGraph(graph)) {
    // the store is kept, so reopening it restores its undo history as well
    notify(workspace, `Closed “${model.graphTitle(graph)}”.`, "info", {
      label: "Undo",
      run: () => insertDocument(workspace, closed, index),
    });
  }
}

/** Start a fresh assistant conversation, which also aborts a running reply. */
export function resetConversation(workspace: WorkspaceStore): void {
  workspace.setState((state) => ({
    assistantMessages: [],
    assistantConversation: state.assistantConversation + 1,
  }));
}

/** Call the listener on every change of an open graph, also of graphs opened later. */
export function subscribeDocuments(
  workspace: WorkspaceStore,
  listener: (doc: DocumentStore, state: DocumentState, previous: DocumentState) => void,
): () => void {
  const subscriptions = new Map<DocumentStore, () => void>();

  const sync = (documents: readonly DocumentStore[]) => {
    for (const [doc, unsubscribe] of subscriptions) {
      if (!documents.includes(doc)) {
        unsubscribe();
        subscriptions.delete(doc);
      }
    }

    for (const doc of documents) {
      if (!subscriptions.has(doc)) {
        subscriptions.set(
          doc,
          doc.subscribe((state, previous) => listener(doc, state, previous)),
        );
      }
    }
  };

  sync(workspace.getState().documents);
  const unsubscribe = workspace.subscribe((state, previous) => {
    if (state.documents !== previous.documents) sync(state.documents);
  });

  return () => {
    unsubscribe();
    subscriptions.forEach((unsubscribeDoc) => unsubscribeDoc());
  };
}

export interface AssistantWorkspaceOptions {
  /** Id of the graph of tool calls that name none. */
  readonly fallback: string;
  /** Called after the assistant edited the graph. */
  readonly onWrite?: (doc: DocumentStore) => void;
}

/**
 * The graphs of the workspace for the assistant tools.
 * Edits that add or remove nodes trigger a layout, closed graphs can no longer be read or edited.
 */
export function assistantWorkspace(
  workspace: WorkspaceStore,
  { fallback, onWrite }: AssistantWorkspaceOptions,
): GraphWorkspace {
  const open = (doc: DocumentStore): DocumentStore => {
    if (findDocument(workspace.getState(), doc.id) !== doc) {
      throw new Error(`The graph "${doc.id}" was closed by the analyst.`);
    }

    return doc;
  };

  const session = (doc: DocumentStore): GraphSession => ({
    id: doc.id,
    read: () => open(doc).getState(),
    write: (graph, { created, removed }) => {
      const { shouldLayout } = open(doc).getState();
      commit(doc, graph, {
        shouldLayout: shouldLayout || created.length > 0 || removed.length > 0,
      });
      onWrite?.(doc);
    },
  });

  return {
    list: () => workspace.getState().documents.map(session),
    get: (id = fallback) => {
      const doc = findDocument(workspace.getState(), id);

      if (doc === undefined) {
        throw new Error(
          id === fallback
            ? "The graph of the analyst was closed, call listGraphs for the open ones."
            : `No graph with id "${id}", call listGraphs for the open ones.`,
        );
      }

      return session(doc);
    },
    // without tabs, a new graph would replace the one of the analyst
    ...(workspace.getState().tabs && {
      add: (graph: model.Graph) => session(openDocument(workspace, { graph })),
    }),
  };
}
