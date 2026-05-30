import type { OpenAIResponsesProviderOptions } from "@ai-sdk/openai";
import type { ReactFlowInstance, XYPosition } from "@xyflow/react";
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

export const assistantModels = ["gpt-5.5-nano", "gpt-5.5-mini", "gpt-5.5"];

// `undefined` lets the provider pick its default effort; explicit values come from the AI SDK.
export type ReasoningEffort = OpenAIResponsesProviderOptions["reasoningEffort"];
export const reasoningEfforts = [
  undefined,
  "none",
  "minimal",
  "low",
  "medium",
  "high",
  "xhigh",
] as const satisfies readonly ReasoningEffort[];

export interface AssistantConfig {
  model: string;
  baseURL: string;
  reasoningEffort: ReasoningEffort;
}
export interface State {
  analyst: arguebuf.Analyst;
  edges: model.Edge[];
  edgeStyle: model.EdgeStyle;
  firstVisit: boolean;
  graph: model.Graph;
  headerHeight: number;
  imageScale: number;
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
  assistantPanelOpen: boolean;
  assistantBusy: boolean;
}

type ZundoState = Pick<State, "edges" | "graph" | "nodes" | "selectedResourceTab" | "selection">;

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

    const { version, state } = JSON.parse(serializedState) as StorageValue<SerializedState>;
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
    const serializedGraph = convert.exportGraph({ nodes, edges, graph }, "arguebuf");

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
    if (lastComparedStates && lastComparedStates[0] === a && lastComparedStates[1] === b) {
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
  selection: model.initSelection(),
  prettifyJson: true,
  imageScale: 3,
  selectedResourceTab: 0,
  sidebarWidth: 400,
  headerHeight: 64,
  assistantConfig: {
    model: assistantModels[0],
    baseURL: "https://api.openai.com/v1",
    reasoningEffort: undefined,
  },
  assistantPanelOpen: false,
  assistantBusy: false,
};

export const useStore = createWithEqualityFn<State>()(
  temporal(
    persist(() => initialState, persistOptions),
    temporalOptions,
  ),
  Object.is,
);

useStore.temporal.getState().pause();

// zustand exposes these as standalone closures (they don't rely on `this`), so destructuring is safe.
// oxlint-disable-next-line typescript/unbound-method
export const { getState, setState, subscribe } = useStore;

/** Apply an immer recipe to the store, removing the repeated `setState(produce(...))` ceremony. */
export const mutate = (recipe: (draft: State) => void) => {
  setState(produce(recipe));
};

export const toggleAssistantPanel = () => {
  setState((state) => ({ assistantPanelOpen: !state.assistantPanelOpen }));
};

export const resetState = (preset?: model.Wrapper) => {
  const s = preset ?? model.initWrapper({});

  setState({
    nodes: s.nodes,
    edges: s.edges,
    graph: s.graph,
    shouldLayout: s.nodes.every((node) => node.position.x === 0 && node.position.y === 0),
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

export const useTemporalStore = <T>(selector: (state: TemporalState<ZundoState>) => T) =>
  wrapStore(useStore.temporal, selector);

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
const deselectAll = (draft: State) => {
  for (const node of draft.nodes) {
    node.selected = false;
  }
  for (const edge of draft.edges) {
    edge.selected = false;
  }
};

const selectNodeAtIndex = (draft: State, index: number) => {
  const node = draft.nodes[index];
  node.selected = true;
  draft.selection = { nodes: [index], edges: [], type: node.type };
};

export const clearAllSelections = () => {
  mutate((draft) => {
    deselectAll(draft);
    draft.selection = model.initSelection();
  });
};

export const selectSingleNode = (nodeIndex: number) => {
  mutate((draft) => {
    deselectAll(draft);
    if (draft.nodes[nodeIndex]) {
      selectNodeAtIndex(draft, nodeIndex);
    }
  });
};

export const addNodeWithSelection = (node: model.Node) => {
  mutate((draft) => {
    deselectAll(draft);
    node.selected = true;
    draft.nodes.push(node);
    selectNodeAtIndex(draft, draft.nodes.length - 1);
  });
};

/** Create an atom at the given screen position (defaulting to the canvas center) and select it. */
export const addAtomAt = (flow: ReactFlowInstance, screenPos?: XYPosition, text = "") => {
  const { x, y } = flow.screenToFlowPosition(screenPos ?? canvasCenter());
  addNodeWithSelection(model.initAtom({ data: { text }, position: { x, y } }));
};

/** Create a scheme node at the given screen position (defaulting to the canvas center) and select it. */
export const addSchemeAt = (flow: ReactFlowInstance, screenPos?: XYPosition) => {
  const { x, y } = flow.screenToFlowPosition(screenPos ?? canvasCenter());
  addNodeWithSelection(model.initScheme({ data: {}, position: { x, y } }));
};
