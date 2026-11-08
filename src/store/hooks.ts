import { useReactFlow } from "@xyflow/react";
import { useMemo } from "react";
import { useStoreWithEqualityFn } from "zustand/traditional";
import { type ArgueActions, createActions } from "@/store/actions.js";
import { useWorkspaceApi } from "@/store/context.js";
import { useFlowWrapperRef } from "@/store/FlowWrapperContext.js";
import type { DocumentState, DocumentStore, WorkspaceState } from "@/store/types.js";
import { activeDocument } from "@/store/workspace.js";

/** Subscribe to the workspace of the editor, e.g. its settings. */
export function useWorkspace<U>(
  selector: (state: WorkspaceState) => U,
  equality: (a: U, b: U) => boolean = Object.is,
): U {
  return useStoreWithEqualityFn(useWorkspaceApi(), selector, equality);
}

/** The store of the shown graph. */
export function useDocumentApi(): DocumentStore {
  return useWorkspace(activeDocument);
}

/** Subscribe to the shown graph. */
export function useDocument<U>(
  selector: (state: DocumentState) => U,
  equality: (a: U, b: U) => boolean = Object.is,
): U {
  return useStoreWithEqualityFn(useDocumentApi(), selector, equality);
}

/** The action helpers bound to the shown graph. */
export function useArgueActions(): ArgueActions {
  const workspace = useWorkspaceApi();
  const doc = useDocumentApi();
  const flow = useReactFlow();
  const wrapperRef = useFlowWrapperRef();

  return useMemo(
    () =>
      createActions({
        workspace,
        doc,
        screenToFlow: (position) => flow.screenToFlowPosition(position),
        wrapperRef,
      }),
    [workspace, doc, flow, wrapperRef],
  );
}
