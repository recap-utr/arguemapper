export interface Graph {
  nodes: Array<Node>;
  edges: Array<Edge>;
  locutions: Array<Locution>;
}

export interface Node {
  nodeID: string;
  text: string;
  type: NodeType;
  timestamp: string;
  scheme?: string;
}

export interface Edge {
  edgeID: string;
  fromID: string;
  toID: string;
  formEdgeID: null;
}

export interface Locution {
  nodeID: string;
  personID: string;
  timestamp: string;
  start?: string;
  end?: string;
  source?: string;
}

export type NodeType = "I" | "L" | "RA" | "CA" | "MA" | "TA" | "PA" | "YA" | "";

export type SchemeType = "RA" | "CA" | "MA" | "PA" | "";

export const DATE_FORMAT = "yyyy-MM-dd HH:mm:ss";
