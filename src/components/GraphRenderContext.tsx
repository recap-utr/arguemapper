import { type Context, createContext, useContext } from "react";
import * as model from "@/model.js";

/**
 * The minimal slice the node/edge renderers need to draw a graph. Supplying it via context (rather
 * than reading the zustand store) lets the same `NodeTypes`/`EdgeTypes` render both in the
 * store-backed editor and in the store-less `GraphViewer`.
 */
export interface GraphRender {
  /** Instance id; namespaces the SVG arrow markers so multiple graphs on a page don't collide. */
  instanceId: string;
  edgeStyle: model.EdgeStyle;
  /** Id of the node marked as the major claim, highlighted darker. */
  majorClaim: string | undefined;
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
