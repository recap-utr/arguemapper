import { useReactFlow } from "@xyflow/react";
import { useMemo } from "react";
import type { TemporalState } from "zundo";
import { useStoreWithEqualityFn } from "zustand/traditional";
import { type ArgueActions, createActions } from "@/store/actions.js";
import { useStoreApi } from "@/store/context.js";
import { useFlowWrapperRef } from "@/store/FlowWrapperContext.js";
import type { State, ZundoState } from "@/store/types.js";

/**
 * Subscribe to the current instance's store. Signature matches the previous global `useStore`, so
 * call sites only change their import path. `Object.is` reproduces the prior default equality.
 */
export function useStore<U>(
  selector: (state: State) => U,
  equality: (a: U, b: U) => boolean = Object.is,
): U {
  const store = useStoreApi();
  return useStoreWithEqualityFn(store, selector, equality);
}

/** Subscribe to the instance's zundo temporal (undo/redo) state. */
export function useTemporalStore<U>(selector: (state: TemporalState<ZundoState>) => U): U {
  const store = useStoreApi();
  return useStoreWithEqualityFn(store.temporal, selector);
}

/** The action helpers bound to the current instance's store. */
export function useArgueActions(): ArgueActions {
  const store = useStoreApi();
  const flow = useReactFlow();
  const wrapperRef = useFlowWrapperRef();
  return useMemo(
    () => createActions(store, (pos) => flow.screenToFlowPosition(pos), wrapperRef),
    [store, flow, wrapperRef],
  );
}
