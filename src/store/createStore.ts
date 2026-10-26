import type { GraphJson } from "arg-services/graph/v1/graph_pb";
import * as arguebuf from "arguebuf";
import { isEqual, throttle } from "es-toolkit";
import { type TemporalState, temporal, type ZundoOptions } from "zundo";
import { persist, type PersistStorage } from "zustand/middleware";
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
  initialGraph?: GraphJson;
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
  const wrapper = options.initialGraph
    ? convert.importGraph(options.initialGraph)
    : model.initWrapper({});

  return {
    nodes: wrapper.nodes,
    edges: wrapper.edges,
    graph: wrapper.graph,
    analyst: new arguebuf.Analyst({}),
    firstVisit: true,
    layoutAlgorithm: "layered",
    edgeStyle: "step",
    shouldLayout: model.needsLayout(wrapper.nodes),
    shouldFitView: true,
    selection: model.initSelection(),
    prettifyJson: true,
    imageScale: 3,
    selectedResourceTab: 0,
    sidebarSide: options.side ?? "right",
    sidebarSections: ["inspector"],
    sidebarWidth: 480,
    headerHeight: 64,
    assistantConfig: resolveAssistantConfig(options.assistantConfig),
    assistantBusy: false,
    assistantApiKey: options.assistantApiKey ?? "",
    assistantMessages: [],
    graphResetToken: 0,
  };
}

function createTemporalOptions(): ZundoOptions<State, ZundoState> {
  // Per-instance cache so concurrent editors don't poison each other's equality checks.
  let lastEqualityResult = true;
  let lastComparedStates: [ZundoState, ZundoState] | null = null;

  return {
    partialize: (state) => {
      const { nodes, edges, graph, selectedResourceTab, selection } = state;
      const partialNodes = nodes.map((node) => {
        // State should not update if dragged, width, etc. are changed
        const { data, id, position, selected, type } = node;
        return { data, id, position, selected, type };
      });
      return { nodes: partialNodes, edges, graph, selectedResourceTab, selection };
    },
    equality: (a, b) => {
      if (a === b) return true;
      if (lastComparedStates && lastComparedStates[0] === a && lastComparedStates[1] === b) {
        return lastEqualityResult;
      }
      lastEqualityResult = isEqual(a, b);
      lastComparedStates = [a, b];
      return lastEqualityResult;
    },
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
