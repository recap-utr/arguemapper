import type * as model from "@/model.js";
import type { DocumentState, DocumentStore } from "@/store/types.js";

/** Undo steps kept per graph. */
const LIMIT = 100;
/** Edits within this time after the previous one join its undo step, e.g. typing a text. */
const JOIN_MS = 1000;

/**
 * Store the graph together with the other changes as an undoable edit.
 * Unchanged graphs only store the changes.
 */
export function commit(
  doc: DocumentStore,
  graph: model.Graph,
  changes: Partial<DocumentState> = {},
): void {
  doc.setState((state) => {
    const now = Date.now();
    const joined = now - state.editedAt < JOIN_MS;
    const edit =
      graph === state.graph
        ? {}
        : {
            graph,
            past: joined ? state.past : [...state.past, state.graph].slice(-LIMIT),
            future: [],
            editedAt: now,
          };

    return { ...changes, ...edit };
  });
}

/** Restore the last graph of one stack and put the current one onto the other. */
function travel(doc: DocumentStore, from: "past" | "future", to: "past" | "future"): void {
  doc.setState((state) => {
    const target = state[from].at(-1);

    return target === undefined
      ? {}
      : {
          graph: target,
          [from]: state[from].slice(0, -1),
          [to]: [...state[to], state.graph],
          editedAt: 0,
        };
  });
}

export const canUndo = (state: DocumentState): boolean => state.past.length > 0;
export const canRedo = (state: DocumentState): boolean => state.future.length > 0;

/** Restore the previous graph, if any. */
export const undo = (doc: DocumentStore): void => travel(doc, "past", "future");

/** Restore the most recently undone graph, if any. */
export const redo = (doc: DocumentStore): void => travel(doc, "future", "past");
