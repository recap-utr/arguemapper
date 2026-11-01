import { type Context, createContext, type ReactNode, useContext } from "react";
import type * as model from "@/model.js";

/**
 * The minimal slice the node/edge renderers need to draw a graph. Supplying it via context (rather
 * than reading the zustand store) lets the same `NodeTypes`/`EdgeTypes` render both in the
 * store-backed editor and in the store-less `GraphViewer`.
 */
export interface GraphRender {
  edgeStyle: model.EdgeStyle;
  /** Whether the primary pointer is coarse (touch), which enlarges handles and edges. */
  coarse: boolean;
  /** Content of the toolbar of a selected edge, none if absent. */
  edgeToolbar?: (edgeId: string) => ReactNode;
  /** Save the text of an atom edited on the canvas and stop editing it, absent in viewers. */
  finishEditing?: (id: string, text: string) => void;
}

const GraphRenderContext = createContext<GraphRender | null>(null);

export const GraphRenderProvider: Context<GraphRender | null> = GraphRenderContext;

export function useGraphRender(): GraphRender {
  const value = useContext(GraphRenderContext);
  if (value === null) {
    throw new Error("useGraphRender must be used within a <GraphCanvas>");
  }
  return value;
}
