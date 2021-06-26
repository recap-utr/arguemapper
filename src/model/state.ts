import { undoMiddleware, UndoState } from "zundo";
import create from "zustand";
import { persist } from "zustand/middleware";
// import pipe from "ramda/es/pipe";
// const createStore = pipe(persist, undoMiddleware, create);

interface StoreState extends UndoState {
  cytoscape: unknown;
  update(json: unknown): void;
}

const useStore = create<StoreState>(
  persist(
    undoMiddleware((set) => ({
      cytoscape: null,
      update: (json) => set({ cytoscape: json }),
    })),
    {
      name: "arguemapper",
    }
  )
);
