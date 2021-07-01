import cytoscape from "cytoscape";
import { undoMiddleware, UndoState } from "zundo";
import createHook from "zustand";
import { devtools, persist } from "zustand/middleware";
import vanillaCreate from "zustand/vanilla";
import * as cytoModel from "./cytoModel";
import demoGraph from "./demo";
// import pipe from "ramda/es/pipe";
// const createStore = pipe(persist, undoMiddleware, create);

interface StoreState extends UndoState {
  graph: cytoModel.Wrapper;
  updateGraph(cy: cytoscape.Core): void;
}

export const store = vanillaCreate<StoreState>(
  devtools(
    persist(
      undoMiddleware((set, get) => ({
        // cyto: cytoModel.init(),
        graph: demoGraph,
        // @ts-ignore
        updateGraph: (cy) => {
          set({
            graph: {
              // @ts-ignore
              data: cy.data(),
              elements: {
                // @ts-ignore
                nodes: cy
                  .elements("node[kind='scheme'], node[kind='atom']")
                  .jsons(),
                // @ts-ignore
                edges: cy.elements("edge").jsons(),
              },
            },
          });
        },
      })),
      {
        name: "cytoStore",
      }
    )
  )
);

const useCytoStore = createHook(store);

export default useCytoStore;
