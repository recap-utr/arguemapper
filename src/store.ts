import * as arguebuf from "arguebuf";
import { throttle } from "lodash";
import type { ZundoOptions } from "zundo";
import { temporal } from "zundo";
import { create, useStore as wrapStore } from "zustand";
import {
  persist,
  PersistOptions,
  PersistStorage,
  StorageValue,
} from "zustand/middleware";
import * as model from "./model.js";
import * as convert from "./services/convert.js";

export interface State {
  analyst: arguebuf.AnalystInterface;
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

    return {
      version,
      state: {
        ...state,
        nodes,
        edges,
        graph,
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
    delete (state as any).graph;
    delete (state as any).nodes;
    delete (state as any).edges;

    const serializedState: StorageValue<SerializedState> = {
      version,
      state: { ...state, graph: serializedGraph },
    };
    localStorage.setItem(name, JSON.stringify(serializedState));
  },
  removeItem: (name) => {
    localStorage.removeItem(name);
  },
};

const persistOptions: PersistOptions<State, PersistState> = {
  name: "state",
  version: 1,
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
    return { nodes, edges, graph, selectedResource, selection };
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
  layoutAlgorithm: model.LayoutAlgorithm.TREE,
  edgeStyle: model.EdgeStyle.STEP,
  shouldLayout: false,
  isLoading: true,
  selection: model.initSelection(),
  prettifyJson: true,
  imageScale: 3,
  selectedResource: "1",
  sidebarWidth: 300,
  headerHeight: 64,
};

export const useStore = create<State>()(
  temporal(
    persist(() => initialState, persistOptions),
    temporalOptions
  )
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

// export const useTemporalStore = wrapStore(useStore.temporal);
// export const useTemporalStore = (
//   selector?: (state: any) => any,
//   equalityFn?: (a: any, b: any) => boolean
// ) =>
//   selector === undefined
//     ? wrapStore(useStore.temporal)
//     : wrapStore(useStore.temporal, selector, equalityFn);
export const useTemporalStore = () => wrapStore(useStore.temporal);
