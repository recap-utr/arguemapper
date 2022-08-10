import produce from "immer";
import { undoMiddleware, UndoState } from "zundo";
import create from "zustand";
import { devtools, persist } from "zustand/middleware";
import * as model from "./model";

export interface State extends UndoState {
  nodes: Array<model.Node>;
  edges: Array<model.Edge>;
  graph: model.Graph;
  analyst: model.Analyst;
  resetState: (state?: model.Wrapper) => void;
  firstVisit: boolean;
  disableFirstVisit: () => void;
  layoutAlgorithm: model.LayoutAlgorithm;
  shouldLayout: boolean;
  setShouldLayout: (value: boolean) => void;
  leftSidebarOpen: boolean | undefined;
  rightSidebarOpen: boolean | undefined;
  selection: model.Selection;
  resetUndoRedo: () => void;
  undoable: () => boolean;
  redoable: () => boolean;
}

const useStore = create<State>()(
  devtools(
    persist(
      undoMiddleware(
        (set, get) => ({
          nodes: [],
          edges: [],
          graph: model.initGraph({}),
          analyst: model.initAnalyst({}),
          firstVisit: true,
          leftSidebarOpen: undefined,
          rightSidebarOpen: undefined,
          disableFirstVisit: () => {
            set({ firstVisit: false });
          },
          layoutAlgorithm: model.LayoutAlgorithm.TREE,
          shouldLayout: false,
          setShouldLayout: (value) => {
            set({ shouldLayout: value });
          },
          selection: { nodes: [], edges: [], type: "graph" },
          resetState: (preset) => {
            const s = preset ?? model.initWrapper({});
            set({
              nodes: s.nodes,
              edges: s.edges,
              graph: s.graph,
              shouldLayout: true,
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
        }),
        { include: ["nodes", "edges", "graph"], coolOffDurationMs: 1000 }
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
          leftSidebarOpen: state.leftSidebarOpen,
          rightSidebarOpen: state.rightSidebarOpen,
        }),
      }
    )
  )
);

export default useStore;

export const { getState, setState, subscribe, destroy } = useStore;