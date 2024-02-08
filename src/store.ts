import * as arguebuf from "arguebuf";
import { dequal } from "dequal";
import { throttle } from "lodash";
import type { TemporalState, ZundoOptions } from "zundo";
import { temporal } from "zundo";
import { useStore as wrapStore } from "zustand";
import {
  PersistOptions,
  PersistStorage,
  StorageValue,
  persist,
} from "zustand/middleware";
import { createWithEqualityFn } from "zustand/traditional";
import * as model from "./model.js";
import * as convert from "./services/convert.js";

export interface State {
  analyst: arguebuf.Analyst;
  edges: Array<model.Edge>;
  edgeStyle: model.EdgeStyle;
  firstVisit: boolean;
  graph: model.Graph;
  headerHeight: number;
  imageScale: number;
  isLoading: boolean;
  layoutAlgorithm: model.LayoutAlgorithm;
  leftSidebarOpen: boolean;
  nodes: Array<model.Node>;
  prettifyJson: boolean;
  rightSidebarOpen: boolean;
  selectedResource: string;
  selection: model.Selection;
  shouldLayout: boolean;
  shouldFitView: boolean;
  sidebarWidth: number;
}

type ZundoState = Pick<
  State,
  "edges" | "graph" | "nodes" | "selectedResource" | "selection"
>;

interface SerializedState {
  analyst: arguebuf.AnalystInterface;
  edgeStyle: model.EdgeStyle;
  firstVisit: boolean;
  graph: { [key: string]: any };
  nodes: undefined;
  edges: undefined;
  imageScale: number;
  layoutAlgorithm: model.LayoutAlgorithm;
  leftSidebarOpen: boolean;
  prettifyJson: boolean;
  rightSidebarOpen: boolean;
  selectedResource: string;
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
  | "selectedResource"
>;

const storage: PersistStorage<PersistState> = {
  getItem: (name) => {
    const serializedState = localStorage.getItem(name);

    if (serializedState === null) {
      return null;
    }

    const { version, state } = JSON.parse(
      serializedState
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
      "arguebuf"
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
    selectedResource: state.selectedResource,
  }),
};

const temporalOptions: ZundoOptions<State, ZundoState> = {
  partialize: (state) => {
    const { nodes, edges, graph, selectedResource, selection } = state;
    const partialNodes = nodes.map((node) => {
      // State should not update if dragged, width, etc. are changed
      const { data, id, position, selected, type } = node;
      return { data, id, position, selected, type };
    });
    return { nodes: partialNodes, edges, graph, selectedResource, selection };
  },
  equality: (a, b) => {
    const debouncedFunc = throttle(
      (a: ZundoState, b: ZundoState) => dequal(a, b),
      500
    );
    const debouncedResult = debouncedFunc(a, b);

    return debouncedResult ?? true;
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
  isLoading: true,
  selection: model.initSelection(),
  prettifyJson: true,
  imageScale: 3,
  selectedResource: "1",
  sidebarWidth: 400,
  headerHeight: 64,
};

export const useStore = createWithEqualityFn<State>()(
  temporal(
    persist(() => initialState, persistOptions),
    temporalOptions
  ),
  Object.is
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
      (node) => node.position.x === 0 && node.position.y === 0
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
  selector: (state: TemporalState<ZundoState>) => T
) => wrapStore(useStore.temporal, selector);
