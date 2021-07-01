import createHook from "zustand";
import { devtools, persist } from "zustand/middleware";
import vanillaCreate from "zustand/vanilla";
// import pipe from "ramda/es/pipe";
// const createStore = pipe(persist, undoMiddleware, create);

interface StoreState {
  leftSidebarOpen: boolean;
  setLeftSidebarOpen(open: boolean): void;
  rightSidebarOpen: boolean;
  setRightSidebarOpen(open: boolean): void;
}

export const store = vanillaCreate<StoreState>(
  devtools(
    persist(
      (set, get) => ({
        leftSidebarOpen: true,
        setLeftSidebarOpen: (open) => {
          set({ leftSidebarOpen: open });
        },
        rightSidebarOpen: true,
        setRightSidebarOpen: (open) => {
          set({ rightSidebarOpen: open });
        },
      }),
      {
        name: "appStore",
      }
    )
  )
);

const useAppStore = createHook(store);

export default useAppStore;
