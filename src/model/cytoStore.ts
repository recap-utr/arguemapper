import cytoscape from "cytoscape";
import { undoMiddleware, UndoState } from "zundo";
import createHook from "zustand";
import { devtools, persist } from "zustand/middleware";
import vanillaCreate from "zustand/vanilla";
import * as cytoModel from "./cytoModel";
import demoGraph from "./demo";

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
          console.log(get().graph.elements.nodes[0].data);
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

          console.log(get().graph.elements.nodes[0].data);
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
