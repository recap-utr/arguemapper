import * as arguebuf from "arguebuf";
import { throttle } from "es-toolkit";
import { type TemporalState, temporal, type ZundoOptions } from "zundo";
import { persist, type PersistStorage } from "zustand/middleware";
import { shallow } from "zustand/shallow";
import { createStore } from "zustand/vanilla";
import * as convert from "@/services/convert.js";
import * as model from "@/model.js";
import {
  localStorageBacked,
  partialize,
  persistVersion,
  type PersistState,
} from "@/store/storage.js";
import {
  type AssistantConfig,
  type ArgueStore,
  resolveAssistantConfig,
  type State,
  type ZundoState,
} from "@/store/types.js";

export interface CreateArgueStoreOptions {
  /** Seed graph (arguebuf JSON). Ignored for fields restored from persistence. */
  initialGraph?: arguebuf.GraphJson;
  /** When set, the store is persisted to localStorage under this key. Absent => no persistence. */
  persistKey?: string;
  /** Override the persistence backend (defaults to localStorage). */
  storage?: PersistStorage<PersistState>;
  /** Partial assistant configuration merged over the defaults. */
  assistantConfig?: Partial<AssistantConfig>;
  /** Initial assistant API key (held in memory only). */
  assistantApiKey?: string;
  /** Side the sidebar docks to. Defaults to `"right"`; persisted state takes precedence. */
  side?: "left" | "right";
}

function buildInitialState(options: CreateArgueStoreOptions): State {
  const graph = options.initialGraph
    ? convert.importGraph(options.initialGraph)
    : model.newGraph();

  return {
    graph,
    analyst: new arguebuf.Analyst({}),
    firstVisit: true,
    layoutAlgorithm: "layered",
    edgeStyle: "step",
    shouldLayout: false,
    shouldFitView: true,
    selection: model.emptySelection,
    prettifyJson: true,
    imageScale: 3,
    sidebarSide: options.side ?? "right",
    sidebarSections: ["inspector"],
    sidebarWidth: 480,
    headerHeight: 64,
    assistantConfig: resolveAssistantConfig(options.assistantConfig),
    assistantApiKey: options.assistantApiKey ?? "",
    assistantMessages: [],
    assistantConversation: 0,
  };
}

function createTemporalOptions(): ZundoOptions<State, ZundoState> {
  return {
    partialize: ({ graph, selectedResource, selection }) => ({
      graph,
      selectedResource,
      selection,
    }),
    // edits replace the changed parts only, so references suffice
    equality: shallow,
    limit: 100,
    handleSet: (callback) => throttle(callback, 1000),
  };
}

/**
 * Create an independent graph store. Each `<GraphEditor>` instance owns one, so multiple graphs can
 * coexist on a page without sharing nodes, undo history, or persistence.
 */
export function createArgueStore(options: CreateArgueStoreOptions = {}): ArgueStore {
  const initialState = buildInitialState(options);
  const temporalOptions = createTemporalOptions();

  const initializer = options.persistKey
    ? persist(() => initialState, {
        name: options.persistKey,
        version: persistVersion,
        storage: options.storage ?? localStorageBacked,
        partialize,
      })
    : () => initialState;

  const store = createStore<State>()(temporal(initializer, temporalOptions)) as ArgueStore;

  // Pause history until the flow initializes, so hydration/layout don't enter the undo stack.
  store.temporal.getState().pause();

  return store;
}

export type { TemporalState };
