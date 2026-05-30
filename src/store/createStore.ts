import type { GraphJson } from "arg-services/graph/v1/graph_pb";
import * as arguebuf from "arguebuf";
import { dequal } from "dequal";
import { throttle } from "lodash";
import { type TemporalState, temporal, type ZundoOptions } from "zundo";
import { persist, type PersistStorage } from "zustand/middleware";
import { createStore } from "zustand/vanilla";
import * as convert from "../services/convert.js";
import * as model from "../model.js";
import { localStorageBacked, partialize, persistVersion, type PersistState } from "./storage.js";
import { assistantModels, type AssistantConfig, type ArgueStore, type State, type ZundoState } from "./types.js";

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
}

const defaultAssistantConfig: AssistantConfig = {
  model: assistantModels[0],
  baseURL: "https://api.openai.com/v1",
  reasoningEffort: undefined,
};

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
    leftSidebarOpen: true,
    rightSidebarOpen: true,
    layoutAlgorithm: model.LayoutAlgorithm.LAYERED,
    edgeStyle: model.EdgeStyle.STEP,
    shouldLayout: model.needsLayout(wrapper.nodes),
    shouldFitView: true,
    selection: model.initSelection(),
    prettifyJson: true,
    imageScale: 3,
    selectedResourceTab: 0,
    sidebarWidth: 400,
    headerHeight: 64,
    assistantConfig: { ...defaultAssistantConfig, ...options.assistantConfig },
    assistantPanelOpen: false,
    assistantBusy: false,
    assistantApiKey: options.assistantApiKey ?? "",
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
      const isEqual = dequal(a, b);
      lastEqualityResult = isEqual;
      lastComparedStates = [a, b];
      return isEqual;
    },
    limit: 100,
    handleSet: (callback) =>
      throttle<typeof callback>((state) => {
        callback(state);
      }, 1000),
  };
}

/**
 * Create an independent ArgueMapper store. Each `<ArgueMapper>` instance owns one, so multiple
 * graphs can coexist on a page without sharing nodes, undo history, or persistence.
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
