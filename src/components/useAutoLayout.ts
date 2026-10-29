import { type Edge, type Node, useReactFlow, type XYPosition } from "@xyflow/react";
import { useEffect } from "react";
import type * as model from "@/model.js";
import { layout } from "@/services/layout.js";

export interface AutoLayoutOptions {
  nodes: readonly Node[];
  edges: readonly Edge[];
  layoutAlgorithm: model.LayoutAlgorithm;
  /** When `true`, re-run ELK layout as soon as every node has been measured. */
  shouldLayout: boolean;
  /** When `true`, fit the graph into view once any pending layout has settled. */
  shouldFitView: boolean;
  /** Write the computed positions. Must be referentially stable. */
  setPositions: (positions: ReadonlyMap<string, XYPosition>) => void;
  setShouldLayout: (value: boolean) => void;
  setShouldFitView: (value: boolean) => void;
}

/**
 * The auto-layout / fit-view choreography shared by the editor (`Graph`, backed by the zustand
 * store) and the read-only `GraphViewer` (backed by local state). It lays the graph out once every
 * node has been measured, then fits the result into view. The caller decides where the request flags
 * live; this hook only reacts to them and writes back through the supplied (stable) setters.
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

  useEffect(() => {
    if (shouldLayout && nodes.length > 0 && nodes.every((node) => node.measured)) {
      void layout(nodes, edges, layoutAlgorithm)
        .then(setPositions)
        .catch((error) => {
          // A layout failure must not become an unhandled rejection; keep the current positions and
          // clear the request (in `finally`) so the app stays usable instead of getting stuck.
          console.error("Graph layout failed:", error);
        })
        .finally(() => setShouldLayout(false));
    }
  }, [shouldLayout, nodes, edges, layoutAlgorithm, setPositions, setShouldLayout]);

  useEffect(() => {
    if (!shouldLayout && shouldFitView) {
      void flow.fitView();
      setShouldFitView(false);
    }
  }, [shouldLayout, shouldFitView, flow, setShouldFitView]);
}
