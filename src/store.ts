import { produce } from "immer";
import { throttle } from "lodash";
import type { ZundoOptions } from "zundo";
import { temporal } from "zundo";
import { create } from "zustand";
import type { PersistOptions } from "zustand/middleware";
import { persist } from "zustand/middleware";
import * as model from "./model/index.js";

export interface State {
  nodes: Array<model.Node>;
  edges: Array<model.Edge>;
  graph: model.Graph;
  analyst: model.Analyst;
  firstVisit: boolean;
  layoutAlgorithm: model.LayoutAlgorithm;
  edgeStyle: model.EdgeStyle;
  shouldLayout: boolean;
  isLoading: boolean;
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  selection: model.Selection;
  prettifyJson: boolean;
  imageScale: number;
  selectedResource: string;
  sidebarWidth: number;
  headerHeight: number;
}

const persistOptions: PersistOptions<State, Partial<State>> = {
  name: "state",
  version: 1,
  serialize: (state) => {
    const modified = produce(state, (draft) => {
      draft.state.nodes = draft.state.nodes.map((node) => ({
        id: node.id,
        data: node.data,
        type: node.type,
        position: node.position,
      }));
      draft.state.edges = draft.state.edges.map((edge) => ({
        id: edge.id,
        data: edge.data,
        source: edge.source,
        target: edge.target,
      }));
    });

    return JSON.stringify(modified);
  },
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

const temporalOptions: ZundoOptions<State, Partial<State>> = {
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

export const useStore = create<State>()(
  temporal<State>(
    persist(
      () => ({
        nodes: [],
        edges: [],
        graph: model.initGraph({}),
        analyst: model.initAnalyst({}),
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
      }),
      persistOptions
    ),
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
