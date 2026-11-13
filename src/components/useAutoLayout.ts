import { type Edge, type Node, useReactFlow, type XYPosition } from "@xyflow/react";
import { useEffect, useEffectEvent } from "react";
import * as model from "@/model.js";
import { layout } from "@/services/layout.js";

export interface AutoLayoutOptions {
  nodes: readonly Node[];
  edges: readonly Edge[];
  layoutAlgorithm: model.LayoutAlgorithm;
  /** When `true`, re-run ELK layout as soon as every node has been measured. */
  shouldLayout: boolean;
  /** When `true`, fit the graph into view once any pending layout has settled. */
  shouldFitView: boolean;
  /** Write the computed positions. */
  setPositions: (positions: ReadonlyMap<string, XYPosition>) => void;
  setShouldLayout: (value: boolean) => void;
  setShouldFitView: (value: boolean) => void;
}

/**
 * The auto-layout and fit-view choreography shared by the editor (`Graph`, backed by the store)
 * and the read-only `GraphViewer` (backed by local state). It lays the graph out once every node
 * has been measured, then fits the result into view. The caller decides where the request flags
 * live, this hook only reacts to them and writes back through the latest setters.
 */
export function useAutoLayout({
  nodes,
  edges,
  layoutAlgorithm,
  shouldLayout,
  shouldFitView,
  setPositions,
  setShouldLayout,
  setShouldFitView,
}: AutoLayoutOptions): void {
  const flow = useReactFlow();
  const onPositions = useEffectEvent(setPositions);
  const onLaidOut = useEffectEvent(() => setShouldLayout(false));
  const onFitted = useEffectEvent(() => setShouldFitView(false));

  useEffect(() => {
    if (shouldLayout && nodes.length > 0 && nodes.every((node) => node.measured)) {
      void layout(nodes, edges, layoutAlgorithm)
        .then(onPositions)
        .catch((error: unknown) => {
          // a failed layout keeps the current positions, the request is cleared nonetheless
          console.error("Graph layout failed:", error);
        })
        .finally(onLaidOut);
    }
  }, [shouldLayout, nodes, edges, layoutAlgorithm]);

  useEffect(() => {
    if (!shouldLayout && shouldFitView) {
      void flow.fitView(model.fitViewOptions);
      onFitted();
    }
  }, [shouldLayout, shouldFitView, flow]);
}
