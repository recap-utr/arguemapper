export interface Graph {
  nodes: Node[];
  edges: Edge[];
  locutions: any[];
}

export interface Node {
  nodeID: string;
  text: string;
  type: string;
  timestamp: string;
}

export interface Edge {
  edgeID: string;
  fromID: string;
  toID: string;
  formEdgeID: "";
}
