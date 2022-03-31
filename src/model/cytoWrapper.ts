import * as edge from "./edge";
import * as graph from "./graph";
import * as node from "./node";
export { v1 as uuid } from "uuid";
export { node, graph, edge };

export interface CytoElements {
  nodes: Array<{
    data: node.Node;
    [x: string]: unknown;
  }>;
  edges: Array<{
    data: edge.Edge;
    [x: string]: unknown;
  }>;
}

export interface CytoGraph {
  [x: string]: unknown;
  data: graph.Graph;
  elements: CytoElements;
}

export function init(): CytoGraph {
  return {
    data: graph.init(),
    elements: {
      nodes: [],
      edges: [],
    },
  };
}
