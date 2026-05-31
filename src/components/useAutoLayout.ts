import { useReactFlow } from "@xyflow/react";
import { useEffect } from "react";
import type * as model from "@/model.js";
import { layout } from "@/services/layout.js";

export interface AutoLayoutOptions {
  nodes: model.Node[];
  edges: model.Edge[];
  layoutAlgorithm: model.LayoutAlgorithm;
  /** When `true`, re-run ELK layout as soon as every node has been measured. */
  shouldLayout: boolean;
  /** When `true`, fit the graph into view once any pending layout has settled. */
  shouldFitView: boolean;
  /** Write the layout result and clear the request flags. Must be referentially stable. */
  setNodes: (nodes: model.Node[]) => void;
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
  setNodes,
  setShouldLayout,
  setShouldFitView,
}: AutoLayoutOptions): void {
  const flow = useReactFlow<model.Node, model.Edge>();

  useEffect(() => {
    if (shouldLayout && nodes.length > 0 && nodes.every((node) => node.measured)) {
      void layout(nodes, edges, layoutAlgorithm)
        .then(setNodes)
        .finally(() => setShouldLayout(false));
    }
  }, [shouldLayout, nodes, edges, layoutAlgorithm, setNodes, setShouldLayout]);

  useEffect(() => {
    if (!shouldLayout && shouldFitView) {
      void flow.fitView();
      setShouldFitView(false);
    }
  }, [shouldLayout, shouldFitView, flow, setShouldFitView]);
}
