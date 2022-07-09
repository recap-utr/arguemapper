import type { Edge } from "./edge";
import * as edge from "./edge";
import * as graph from "./graph";
import type { AtomNode, SchemeNode } from "./node";
import * as node from "./node";
import { isAtom, isScheme } from "./node";

export { v1 as uuid } from "uuid";
export { init as initAnalyst } from "./analyst";
export type { Analyst } from "./analyst";
export { init as initEdge } from "./edge";
export type { Edge, EdgeData } from "./edge";
export { init as initGraph } from "./graph";
export type { Graph } from "./graph";
export {
  initAtom,
  initScheme,
  isAtom,
  isScheme,
  label as nodeLabel,
  schemeMap,
  SchemeType,
} from "./node";
export type {
  AtomData,
  AtomNode,
  Node,
  NodeData,
  Scheme,
  SchemeData,
  SchemeNode,
} from "./node";
export { init as initParticipant } from "./participant";
export type { Participant } from "./participant";
export { init as initReference } from "./reference";
export type { Reference } from "./reference";
export { init as initResource } from "./resource";
export type { Resource } from "./resource";
export { node, edge, graph };

export type OptionalElement = Element | undefined;
export type Element = AtomNode | SchemeNode | Edge;
export type Elements = Array<Element> | OptionalElement;
export type ElementType = "atom" | "scheme" | "edge" | "graph";

export const elemType = (elem?: OptionalElement): ElementType => {
  if (elem === undefined) {
    return "graph";
  } else if ("source" in elem && "target" in elem) {
    return "edge";
  } else if (isAtom(elem)) {
    return "atom";
  } else if (isScheme(elem)) {
    return "scheme";
  }

  return "graph";
};

export interface Selection {
  nodes: Array<SchemeNode | AtomNode>;
  edges: Array<Edge>;
}

export type SelectionType = ElementType | "multiple";

export const selectionType = (sel: Selection): SelectionType => {
  if (sel.nodes.length === 0 && sel.edges.length === 0) {
    return "graph";
  } else if (sel.nodes.length === 0 && sel.edges.length === 1) {
    return "edge";
  } else if (sel.nodes.length === 1 && sel.edges.length === 0) {
    const node = sel.nodes[0];

    if (isAtom(node)) {
      return "atom";
    } else {
      return "scheme";
    }
  }

  return "multiple";
};
