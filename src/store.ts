import produce from "immer";
import { undoMiddleware, UndoState } from "zundo";
import create from "zustand";
import { devtools, persist } from "zustand/middleware";
import * as model from "./model";
import layout from "./services/layout";

export interface State extends UndoState {
  nodes: Array<model.Node>;
  edges: Array<model.Edge>;
  graph: model.Graph;
  resetState: (state?: model.Wrapper) => void;
  selection: model.Selection;
  setState: (func: (draft: State) => State | Partial<State>) => void;
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
          selection: { nodes: [], edges: [] },
          resetState: (preset) => {
            const s = preset ?? model.initWrapper({});
            layout(s.nodes, s.edges).then((layoutedNodes) => {
              set({
                nodes: layoutedNodes,
                edges: s.edges,
                graph: s.graph,
              });
              get().clear?.();
              // flow.fitView();
            });
          },
          // setState: (func) => {
          //   set((draft) => {
          //     return func(draft);
          //   });
          // },
          setState: set,
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
        }),
      }
    )
  )
);

export default useStore;
