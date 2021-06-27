import { undoMiddleware, UndoState } from "zundo";
import createHook from "zustand";
import { devtools, persist } from "zustand/middleware";
import vanillaCreate from "zustand/vanilla";
import * as cytoModel from "./cytoModel";
import demoGraph from "./demo";
// import pipe from "ramda/es/pipe";
// const createStore = pipe(persist, undoMiddleware, create);

interface StoreState extends UndoState {
  cyto: cytoModel.Wrapper;
  updateCyto(json: cytoModel.Wrapper): void;
}

export const store = vanillaCreate<StoreState>(
  devtools(
    persist(
      undoMiddleware((set, get) => ({
        // cyto: cytoModel.init(),
        cyto: demoGraph,
        // @ts-ignore
        updateCyto: (json) => {
          const { data, elements } = json;
          const toSet = {
            cyto: {
              data: data as cytoModel.graph.Data,
              elements: {
                nodes: elements.nodes.map((node) => ({ data: node.data })),
                edges: elements.edges.map((edge) => ({ data: edge.data })),
              },
            },
          };
          console.log(toSet);
          set(toSet);
        },
      })),
      {
        name: "arguemapper",
      }
    )
  )
);

const useStore = createHook(store);

export default useStore;
