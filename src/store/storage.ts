import type { GraphJson } from "arg-services/graph/v1/graph_pb";
import * as arguebuf from "arguebuf";
import { type PersistStorage, type StorageValue } from "zustand/middleware";
import * as convert from "../services/convert.js";
import type { State } from "./types.js";

export type PersistState = Pick<
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

// On disk the graph is arguebuf JSON and nodes/edges are folded into it, so they are dropped.
type SerializedState = Omit<PersistState, "analyst" | "graph" | "nodes" | "edges"> & {
  analyst: arguebuf.AnalystInterface;
  graph: GraphJson;
  nodes: undefined;
  edges: undefined;
};

/** localStorage-backed persistence that serializes the graph to/from arguebuf JSON. */
export const localStorageBacked: PersistStorage<PersistState> = {
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
    const { nodes, edges, graph, analyst } = state;
    const serializedGraph = convert.exportGraph({ nodes, edges, graph }, "arguebuf", analyst);

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

export const partialize = (state: State): PersistState => ({
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
});

export const persistVersion = 2;
