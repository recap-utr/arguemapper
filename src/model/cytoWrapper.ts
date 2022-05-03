import * as edge from "./edge";
import * as graph from "./graph";
import * as node from "./node";
export { v1 as uuid } from "uuid";
export * as participant from "./participant";
export * as reference from "./reference";
export * as resource from "./resource";
export { node, graph, edge };

export interface CytoNode {
  data: node.Node;
  position?: {
    x: number;
    y: number;
  };
  [x: string]: unknown;
}

export interface CytoEdge {
  data: edge.Edge;
  [x: string]: unknown;
}

export interface CytoElements {
  nodes: Array<CytoNode>;
  edges: Array<CytoEdge>;
}

export interface CytoGraph {
  [x: string]: unknown;
  data: graph.Graph;
  elements: CytoElements;
}

interface Props {}

export function init({}: Props): CytoGraph {
  return {
    data: graph.init({}),
    elements: {
      nodes: [],
      edges: [],
    },
  };
}
