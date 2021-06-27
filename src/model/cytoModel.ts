import * as common from "./common";
import * as edge from "./edge";
import * as graph from "./graph";
import * as node from "./node";

export interface Wrapper {
  data: graph.Data;
  elements: Elements;
}

export interface Elements {
  nodes: Array<{
    data: node.SchemeData | node.AtomData;
    [x: string]: unknown;
  }>;
  edges: Array<{
    data: edge.Data;
    [x: string]: unknown;
  }>;
}

// function fromJSON() {}

// function toJSON() {
//   return {
//     data: {
//       id: this.id,
//     },
//     elements: {
//       nodes: inodes.concat(snodes),
//       edges: edges,
//     },
//   };
// }

export function init(): Wrapper {
  return {
    data: graph.init(),
    elements: {
      nodes: [],
      edges: [],
    },
  };
}

export { graph, node, edge, common };
