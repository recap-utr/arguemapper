import { type Context, createContext, useContext } from "react";
import type { WorkspaceStore } from "@/store/types.js";

const WorkspaceContext = createContext<WorkspaceStore | null>(null);

export const WorkspaceProvider: Context<WorkspaceStore | null> = WorkspaceContext;

/** The store of the workspace of the editor. */
export function useWorkspaceApi(): WorkspaceStore {
  const store = useContext(WorkspaceContext);

  if (store === null) {
    throw new Error("useWorkspaceApi must be used within a <GraphEditor> or <GraphWorkspace>.");
  }

  return store;
}
