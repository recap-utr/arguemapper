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
  formEdgeID: null;
}

export type SchemeType = "RA" | "CA" | "MA" | "TA" | "PA" | "YA";

export const DATE_FORMAT = "yyyy-MM-dd HH:mm:ss";
