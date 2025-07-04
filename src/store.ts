import type { GraphJson } from "arg-services/graph/v1/graph_pb";
import * as arguebuf from "arguebuf";
import { dequal } from "dequal";
import { produce } from "immer";
import { throttle } from "lodash";
import type { TemporalState, ZundoOptions } from "zundo";
import { temporal } from "zundo";
import { useStore as wrapStore } from "zustand";
import {
  type PersistOptions,
  type PersistStorage,
  persist,
  type StorageValue,
} from "zustand/middleware";
import { createWithEqualityFn } from "zustand/traditional";
import * as model from "./model.js";
import * as convert from "./services/convert.js";

export const assistantModels = [
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-4.1",
  "gpt-4.1-mini",
  "gpt-4.1-nano",
  "o4-mini",
  "o3",
];

export interface AssistantConfig {
  model: string;
  baseURL: string;
  temperature: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  seed: null | number;
}
export interface State {
  analyst: arguebuf.Analyst;
  edges: model.Edge[];
  edgeStyle: model.EdgeStyle;
  firstVisit: boolean;
  graph: model.Graph;
  headerHeight: number;
  imageScale: number;
  isLoading: boolean;
  layoutAlgorithm: model.LayoutAlgorithm;
  leftSidebarOpen: boolean;
  nodes: model.Node[];
  prettifyJson: boolean;
  rightSidebarOpen: boolean;
  selectedResourceTab: number;
  selection: model.Selection;
  shouldLayout: boolean;
  shouldFitView: boolean;
  sidebarWidth: number;
  assistantConfig: AssistantConfig;
}

type ZundoState = Pick<
  State,
  "edges" | "graph" | "nodes" | "selectedResourceTab" | "selection"
>;

interface SerializedState {
  analyst: arguebuf.AnalystInterface;
  edgeStyle: model.EdgeStyle;
  firstVisit: boolean;
  graph: GraphJson;
  nodes: undefined;
  edges: undefined;
  imageScale: number;
  layoutAlgorithm: model.LayoutAlgorithm;
  leftSidebarOpen: boolean;
  prettifyJson: boolean;
  rightSidebarOpen: boolean;
  selectedResourceTab: number;
  assistantConfig: AssistantConfig;
}

type PersistState = Pick<
  State,
  | "analyst"
  | "edges"
  | "edgeStyle"
  | "firstVisit"
  | "graph"
  | "imageScale"
  | "layoutAlgorithm"
  | "leftSidebarOpen"
  | "nodes"
  | "prettifyJson"
  | "rightSidebarOpen"
  | "selectedResourceTab"
  | "assistantConfig"
>;

const storage: PersistStorage<PersistState> = {
  getItem: (name) => {
    const serializedState = localStorage.getItem(name);

    if (serializedState === null) {
      return null;
    }

    const { version, state } = JSON.parse(
      serializedState,
    ) as StorageValue<SerializedState>;
    const { nodes, edges, graph } = convert.importGraph(state.graph);
    const analyst = new arguebuf.Analyst(state.analyst);

    return {
      version,
      state: {
        ...state,
        nodes,
        edges,
        graph,
        analyst,
      },
    };
  },
  setItem: (name, value) => {
    const { version, state } = value;
    const { nodes, edges, graph } = state;
    const serializedGraph = convert.exportGraph(
      { nodes, edges, graph },
      "arguebuf",
    );

    const serializedState: StorageValue<SerializedState> = {
      version,
      state: {
        ...state,
        graph: serializedGraph,
        nodes: undefined,
        edges: undefined,
      },
    };
    localStorage.setItem(name, JSON.stringify(serializedState));
  },
  removeItem: (name) => {
    localStorage.removeItem(name);
  },
};

const persistOptions: PersistOptions<State, PersistState> = {
  name: "state",
  version: 2,
  storage,
  partialize: (state) => ({
    nodes: state.nodes,
    edges: state.edges,
    graph: state.graph,
    firstVisit: state.firstVisit,
    analyst: state.analyst,
    layoutAlgorithm: state.layoutAlgorithm,
    prettifyJson: state.prettifyJson,
    imageScale: state.imageScale,
    edgeStyle: state.edgeStyle,
    leftSidebarOpen: state.leftSidebarOpen,
    rightSidebarOpen: state.rightSidebarOpen,
    selectedResourceTab: state.selectedResourceTab,
    assistantConfig: state.assistantConfig,
  }),
};

// Store the last comparison result to avoid race conditions
let lastEqualityResult = true;
let lastComparedStates: [ZundoState, ZundoState] | null = null;

const temporalOptions: ZundoOptions<State, ZundoState> = {
  partialize: (state) => {
    const { nodes, edges, graph, selectedResourceTab, selection } = state;
    const partialNodes = nodes.map((node) => {
      // State should not update if dragged, width, etc. are changed
      const { data, id, position, selected, type } = node;
      return { data, id, position, selected, type };
    });
    return {
      nodes: partialNodes,
      edges,
      graph,
      selectedResourceTab,
      selection,
    };
  },
  equality: (a, b) => {
    // If states are the same reference, they're equal
    if (a === b) return true;

    // Check if we're comparing the same states as last time
    if (
      lastComparedStates &&
      lastComparedStates[0] === a &&
      lastComparedStates[1] === b
    ) {
      return lastEqualityResult;
    }

    // Perform the actual comparison
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

const initialState: State = {
  nodes: [],
  edges: [],
  graph: new arguebuf.Graph({}),
  analyst: new arguebuf.Analyst({}),
  firstVisit: true,
  leftSidebarOpen: true,
  rightSidebarOpen: true,
  layoutAlgorithm: model.LayoutAlgorithm.LAYERED,
  edgeStyle: model.EdgeStyle.STEP,
  shouldLayout: false,
  shouldFitView: false,
  isLoading: false,
  selection: model.initSelection(),
  prettifyJson: true,
  imageScale: 3,
  selectedResourceTab: 0,
  sidebarWidth: 400,
  headerHeight: 64,
  assistantConfig: {
    model: assistantModels[0],
    baseURL: "https://api.openai.com/v1",
    temperature: 0.0,
    topP: 1.0,
    frequencyPenalty: 0.0,
    presencePenalty: 0.0,
    seed: null,
  },
};

export const useStore = createWithEqualityFn<State>()(
  temporal(
    persist(() => initialState, persistOptions),
    temporalOptions,
  ),
  Object.is,
);

useStore.temporal.getState().pause();

export const { getState, setState, subscribe } = useStore;

export const resetState = (preset?: model.Wrapper) => {
  const s = preset ?? model.initWrapper({});

  setState({
    nodes: s.nodes,
    edges: s.edges,
    graph: s.graph,
    shouldLayout: s.nodes.every(
      (node) => node.position.x === 0 && node.position.y === 0,
    ),
    shouldFitView: true,
  });
};

export const canvasCenter = () => {
  let reduceWidth = 0;

  if (getState().leftSidebarOpen) {
    reduceWidth += getState().sidebarWidth;
  }

  if (getState().rightSidebarOpen) {
    reduceWidth += getState().sidebarWidth;
  }

  return {
    x: (window.innerWidth - reduceWidth) / 2,
    y: (window.innerHeight - getState().headerHeight) / 2,
  };
};

export const useTemporalStore = <T>(
  selector: (state: TemporalState<ZundoState>) => T,
) => wrapStore(useStore.temporal, selector);

// Temporal control utilities
export const pauseTemporal = () => {
  useStore.temporal.getState().pause();
};

export const resumeTemporal = () => {
  useStore.temporal.getState().resume();
};

// Utility to execute state updates without affecting undo/redo history
export const setStateWithoutHistory = (
  updater: Partial<State> | ((state: State) => Partial<State>),
) => {
  const wasTracking = useStore.temporal.getState().isTracking;

  if (wasTracking) {
    pauseTemporal();
  }

  if (typeof updater === "function") {
    setState((state) => updater(state));
  } else {
    setState(updater);
  }

  if (wasTracking) {
    resumeTemporal();
  }
};

// Centralized selection management utilities
export const clearAllSelections = () => {
  setState(
    produce((draft: State) => {
      // Clear visual selection on all elements
      for (const node of draft.nodes) {
        node.selected = false;
      }
      for (const edge of draft.edges) {
        edge.selected = false;
      }
      // Reset selection state
      draft.selection = model.initSelection();
    }),
  );
};

export const selectSingleNode = (nodeIndex: number) => {
  setState(
    produce((draft: State) => {
      // Clear existing selections
      for (const node of draft.nodes) {
        node.selected = false;
      }
      for (const edge of draft.edges) {
        edge.selected = false;
      }

      // Select the specific node
      if (draft.nodes[nodeIndex]) {
        draft.nodes[nodeIndex].selected = true;
        draft.selection = {
          nodes: [nodeIndex],
          edges: [],
          type: draft.nodes[nodeIndex].type,
        };
      }
    }),
  );
};

export const addNodeWithSelection = (node: model.Node) => {
  setState(
    produce((draft: State) => {
      // Clear existing selections
      for (const existingNode of draft.nodes) {
        existingNode.selected = false;
      }
      for (const edge of draft.edges) {
        edge.selected = false;
      }

      // Add the new node as selected
      node.selected = true;
      draft.nodes.push(node);

      // Update selection state
      const newNodeIndex = draft.nodes.length - 1;
      draft.selection = {
        nodes: [newNodeIndex],
        edges: [],
        type: node.type,
      };
    }),
  );
};
