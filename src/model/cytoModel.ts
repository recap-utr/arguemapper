import { uuid } from "./common";
import * as edge from "./edge";
import * as graph from "./graph";
import * as node from "./node";
export { node, graph, edge, uuid };

export interface CytoGraph {
  data: graph.Data;
  elements: CytoElements;
}

// TODO: Make nodes/edges array an object with the id as the key

export interface CytoElements {
  nodes: Array<{
    data: node.Data;
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

export function init(): CytoGraph {
  return {
    data: graph.initData(),
    elements: {
      nodes: [],
      edges: [],
    },
  };
}
