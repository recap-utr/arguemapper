export interface Graph {
  nodes: Array<Node>;
  edges: Array<Edge>;
  locutions: Array<Locution>;
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

export interface Locution {
  nodeID: string;
  personID: string;
  timestamp: string;
  start?: string;
  end?: string;
  source?: string;
}

export type SchemeType = "RA" | "CA" | "MA" | "TA" | "PA" | "YA";

export const DATE_FORMAT = "yyyy-MM-dd HH:mm:ss";
