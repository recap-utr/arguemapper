import { useReactFlow } from "@xyflow/react";
import { useStore } from "zustand";
import { type ArgueActions, createActions } from "@/store/actions.js";
import { useArgueConfig, useWorkspaceApi } from "@/store/context.js";
import type { DocumentState, DocumentStore, WorkspaceState } from "@/store/types.js";
import { activeDocument } from "@/store/workspace.js";

/** Subscribe to the workspace of the editor, e.g. its settings. */
export function useWorkspace<U>(selector: (state: WorkspaceState) => U): U {
  return useStore(useWorkspaceApi(), selector);
}

/** The store of the shown graph. */
export function useDocumentApi(): DocumentStore {
  return useWorkspace(activeDocument);
}

/** Subscribe to the shown graph. */
export function useDocument<U>(selector: (state: DocumentState) => U): U {
  return useStore(useDocumentApi(), selector);
}

/** The action helpers bound to the shown graph. */
export function useArgueActions(): ArgueActions {
  const workspace = useWorkspaceApi();
  const doc = useDocumentApi();
  const flow = useReactFlow();
  const { wrapperRef, readOnly } = useArgueConfig();

  return createActions({
    workspace,
    doc,
    screenToFlow: (position) => flow.screenToFlowPosition(position),
    wrapperRef,
    readOnly,
  });
}
