import type {
  Edge as FlowEdge,
  Node as FlowNode,
  XYPosition,
} from "@xyflow/react";
import * as arguebuf from "arguebuf";

export type AtomNodeData = arguebuf.AtomNode & Record<string, unknown>;
export type SchemeNodeData = arguebuf.SchemeNode & Record<string, unknown>;
export type NodeData = AtomNodeData | SchemeNodeData;
export type Node = FlowNode<NodeData, "atom" | "scheme">;
export type AtomNode = FlowNode<AtomNodeData, "atom">;
export type SchemeNode = FlowNode<SchemeNodeData, "scheme">;
export type Edge = FlowEdge<Omit<arguebuf.Edge, "source" | "target">>;
export type Graph = Omit<arguebuf.Graph, "nodes" | "edges">;

export interface Userdata {
  notes?: string;
  clickConnect?: boolean;
  arguemapper: {
    position: XYPosition;
  };
  assistant?: {
    explanation?: string;
    mcExplanation?: string;
    config?: unknown;
    mcConfig?: unknown;
  };
}

export type Element = Node | Edge;
export type OptionalElement = Element | undefined;
export type Elements = Element[] | OptionalElement;
export type ElementType = "atom" | "scheme" | "edge" | "graph";

export interface Wrapper {
  nodes: Node[];
  edges: Edge[];
  graph: Graph;
}

export interface WrapperInitProps {
  nodes?: Node[];
  edges?: Edge[];
  graph?: Graph;
}

export function initWrapper({
  nodes,
  edges,
  graph,
}: WrapperInitProps): Wrapper {
  return {
    nodes: nodes ?? [],
    edges: edges ?? [],
    graph: graph ?? new arguebuf.Graph(),
  };
}

function nodeToArguebuf(obj: Node): arguebuf.Node {
  // immer freezes the object, so we need to clone it
  const node = structuredClone(obj.data) as arguebuf.Node;
  const userdata = node.userdata as Userdata;
  userdata.arguemapper = userdata.arguemapper ?? {};
  userdata.arguemapper.position = obj.position;

  return node;
}

function edgeToArguebuf(obj: Edge): arguebuf.Edge {
  // immer freezes the object, so we need to clone it
  const edge = structuredClone(obj.data) as arguebuf.Edge;
  edge.source = obj.source;
  edge.target = obj.target;

  return edge;
}

export function toArguebuf(obj: Wrapper): arguebuf.Graph {
  const nodes = obj.nodes.map((n) => nodeToArguebuf(n));
  const edges = obj.edges.map((e) => edgeToArguebuf(e));
  const graph = obj.graph as arguebuf.Graph;

  return arguebuf.copy(graph, { nodes, edges });
}

export function fromArguebuf(obj: arguebuf.Graph): Wrapper {
  return {
    nodes: Object.entries(obj.nodes).map(
      ([id, node]) =>
        ({
          id,
          data: node,
          type: node.type,
          position: (node.userdata as Userdata).arguemapper?.position ?? {
            x: 0,
            y: 0,
          },
        }) as Node,
    ),
    edges: Object.entries(obj.edges).map(
      ([id, edge]) =>
        ({
          id,
          data: edge,
          source: edge.source,
          target: edge.target,
        }) as Edge,
    ),
    graph: arguebuf.copy(obj, { nodes: [], edges: [] }),
  };
}

export const elemType = (elem?: OptionalElement): ElementType => {
  if (elem === undefined) {
    return "graph";
  }
  if ("source" in elem && "target" in elem) {
    return "edge";
  }

  return elem.data.type;
};

export enum LayoutAlgorithm {
  LAYERED = "layered",
  TREE = "tree",
  FORCE = "force",
  RADIAL = "radial",
}

export enum EdgeStyle {
  BEZIER = "bezier",
  STRAIGHT = "straight",
  STEP = "step",
}

export interface Selection {
  nodes: number[];
  edges: number[];
  type: SelectionType;
}

export type SelectionType = ElementType | "multiple";

export const selectionType = (
  sel: Omit<Selection, "type">,
  nodeTypes: ("atom" | "scheme")[],
): SelectionType => {
  if (sel.nodes.length === 0 && sel.edges.length === 0) {
    return "graph";
  }
  if (sel.nodes.length === 0 && sel.edges.length === 1) {
    return "edge";
  }
  if (sel.nodes.length === 1 && sel.edges.length === 0) {
    return nodeTypes[0];
  }

  return "multiple";
};

export const initSelection = () =>
  ({ nodes: [], edges: [], type: "graph" }) as Selection;

export interface InitNodeProps<T> {
  id?: string;
  data: Omit<T, "id">;
  position?: XYPosition;
}

export interface InitEdgeProps {
  id?: string;
  data: Omit<arguebuf.EdgeConstructor, "id" | "source" | "target">;
  source: string;
  target: string;
}

export function initAtom({
  id,
  position,
  data,
}: InitNodeProps<arguebuf.AtomNodeConstructor>): AtomNode {
  const parsedId = id ?? arguebuf.uuid();

  return {
    id: parsedId,
    type: "atom",
    data: new arguebuf.AtomNode({ ...data, id: parsedId }) as AtomNodeData,
    position: position ?? { x: 0, y: 0 },
  };
}

export function initScheme({
  id,
  position,
  data,
}: InitNodeProps<arguebuf.SchemeNodeConstructor>): SchemeNode {
  const parsedId = id ?? arguebuf.uuid();

  return {
    id: parsedId,
    type: "scheme",
    data: new arguebuf.SchemeNode({ ...data, id: parsedId }) as SchemeNodeData,
    position: position ?? { x: 0, y: 0 },
  };
}

export function initEdge({ id, data, source, target }: InitEdgeProps): Edge {
  const parsedId = id ?? arguebuf.uuid();

  return {
    id: parsedId,
    source,
    target,
    data: new arguebuf.Edge({ ...data, id: parsedId, source: "", target: "" }),
  };
}
