import produce from "immer";
import { undoMiddleware, UndoState } from "zundo";
import create from "zustand";
import { devtools, persist } from "zustand/middleware";
import * as model from "./model";

export interface State extends UndoState {
  setState: (
    partial:
      | State
      | Partial<State>
      | ((state: State) => State | Partial<State>),
    replace?: boolean | undefined
  ) => void;
  nodes: Array<model.Node>;
  edges: Array<model.Edge>;
  graph: model.Graph;
  analyst: model.Analyst;
  resetState: (state?: model.Wrapper) => void;
  firstVisit: boolean;
  layoutAlgorithm: model.LayoutAlgorithm;
  edgeStyle: model.EdgeStyle;
  shouldLayout: boolean;
  isLoading: boolean;
  leftSidebarOpen: boolean | undefined;
  rightSidebarOpen: boolean | undefined;
  selection: model.Selection;
  resetUndoRedo: () => void;
  undoable: () => boolean;
  redoable: () => boolean;
  prettifyJson: boolean;
  selectedResource: string;
}

const useStore = create<State>()(
  devtools(
    persist(
      undoMiddleware(
        (set, get) => ({
          setState: set,
          nodes: [],
          edges: [],
          graph: model.initGraph({}),
          analyst: model.initAnalyst({}),
          firstVisit: true,
          leftSidebarOpen: undefined,
          rightSidebarOpen: undefined,
          layoutAlgorithm: model.LayoutAlgorithm.TREE,
          edgeStyle: model.EdgeStyle.STEP,
          shouldLayout: false,
          isLoading: true,
          selection: model.initSelection(),
          resetState: (preset) => {
            const s = preset ?? model.initWrapper({});
            set({
              nodes: s.nodes,
              edges: s.edges,
              graph: s.graph,
              shouldLayout: s.nodes.every(
                (node) => node.position.x === 0 && node.position.y === 0
              ),
            });
          },
          resetUndoRedo: () => {
            const clear = get().clear;

            if (clear !== undefined) {
              clear();
            }
          },
          undoable: () => (get().getState?.().prevStates.length ?? 0) > 0,
          redoable: () => (get().getState?.().futureStates.length ?? 0) > 0,
          prettifyJson: true,
          selectedResource: "1",
        }),
        {
          include: ["nodes", "edges", "graph", "selectedResource"],
          coolOffDurationMs: 200,
          historyDepthLimit: 100,
        }
      ),
      {
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
        // @ts-ignore
        partialize: (state) => ({
          nodes: state.nodes,
          edges: state.edges,
          graph: state.graph,
          firstVisit: state.firstVisit,
          analyst: state.analyst,
          layoutAlgorithm: state.layoutAlgorithm,
          prettifyJson: state.prettifyJson,
          edgeStyle: state.edgeStyle,
          leftSidebarOpen: state.leftSidebarOpen,
          rightSidebarOpen: state.rightSidebarOpen,
          selectedResource: state.selectedResource,
        }),
      }
    )
  )
);

export default useStore;

export const { getState, setState, subscribe, destroy } = useStore;
