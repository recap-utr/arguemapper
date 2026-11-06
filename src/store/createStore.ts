import { throttle } from "es-toolkit";
import { temporal, type ZundoOptions } from "zundo";
import { persist } from "zustand/middleware";
import { shallow } from "zustand/shallow";
import { createStore } from "zustand/vanilla";
import * as model from "@/model.js";
import { localStorageBacked, partialize, persistVersion } from "@/store/storage.js";
import {
  type ArgueStore,
  defaultAssistantConfig,
  type State,
  type ZundoState,
} from "@/store/types.js";

export interface CreateArgueStoreOptions {
  /** Initial graph, replaced by a persisted one. */
  graph?: model.Graph;
  /** When set, the store is persisted to localStorage under this key. Absent => no persistence. */
  persistKey?: string;
}

function buildInitialState(options: CreateArgueStoreOptions): State {
  return {
    graph: options.graph ?? model.newGraph(),
    analyst: { id: crypto.randomUUID() },
    guide: true,
    layoutAlgorithm: "layered",
    edgeStyle: "step",
    shouldLayout: false,
    shouldFitView: true,
    selection: model.emptySelection,
    prettifyJson: true,
    imageScale: 3,
    panels: ["text", "inspector"],
    assistantConfig: defaultAssistantConfig,
    assistantApiKey: "",
    assistantMessages: [],
    assistantConversation: 0,
  };
}

const temporalOptions: ZundoOptions<State, ZundoState> = {
  partialize: ({ graph }) => ({ graph }),
  // edits replace the changed parts only, so references suffice
  equality: shallow,
  limit: 100,
  handleSet: (callback) => throttle(callback, 1000),
};

/**
 * Create an independent graph store. Each `<GraphEditor>` instance owns one, so multiple graphs can
 * coexist on a page without sharing nodes, undo history, or persistence.
 */
export function createArgueStore(options: CreateArgueStoreOptions = {}): ArgueStore {
  const initialState = buildInitialState(options);

  const tracked = temporal<State, [], [], ZundoState>(() => initialState, temporalOptions);
  // persistence wraps the history, so that undo and redo are saved as well
  const store: ArgueStore = options.persistKey
    ? createStore<State>()(
        persist(tracked, {
          name: options.persistKey,
          version: persistVersion,
          storage: localStorageBacked,
          partialize,
        }),
      )
    : createStore<State>()(tracked);

  // Every change of the graph, e.g. an edit or an undo, deselects the removed elements.
  store.subscribe((state, previous) => {
    if (state.graph !== previous.graph) {
      const selection = model.pruneSelection(state.graph, state.selection);

      if (selection !== state.selection) store.setState({ selection });
    }
  });

  return store;
}
