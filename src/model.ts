import type { Edge as FlowEdge, Node as FlowNode, XYPosition } from "@xyflow/react";
import * as arguebuf from "arguebuf";
import { z } from "zod";

/** Userdata of graphs and edges, unknown fields of other tools are kept. */
export interface ElementUserdata {
  notes?: string;
  [key: string]: unknown;
}

/** Userdata of atoms and schemes. */
export interface NodeUserdata extends ElementUserdata {
  arguemapper?: { position: XYPosition; [key: string]: unknown };
  /** Provenance of elements created or changed by the assistant. */
  assistant?: {
    explanation?: string;
    config?: { model?: string; baseURL?: string; reasoning?: string; [key: string]: unknown };
    [key: string]: unknown;
  };
}

const elementUserdata: z.ZodType<ElementUserdata> = z.looseObject({
  notes: z.string().optional(),
});

const nodeUserdata: z.ZodType<NodeUserdata> = z.looseObject({
  notes: z.string().optional(),
  arguemapper: z.looseObject({ position: z.object({ x: z.number(), y: z.number() }) }).optional(),
  assistant: z
    .looseObject({
      explanation: z.string().optional(),
      config: z
        .looseObject({
          model: z.string().optional(),
          baseURL: z.string().optional(),
          reasoning: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
});

/** Userdata of arguemapper, unknown fields of other tools are kept. */
export type Schema = {
  graph: ElementUserdata;
  atom: NodeUserdata;
  scheme: NodeUserdata;
  edge: ElementUserdata;
};

function codec<T>(schema: z.ZodType<T>): arguebuf.Codec<T> {
  return {
    decode: (data) => schema.parse(data),
    // drops undefined values, which JSON objects cannot hold
    encode: (value): arguebuf.JsonObject => JSON.parse(JSON.stringify(value)),
  };
}

export const codecs: arguebuf.Codecs<Schema> = {
  graph: codec(elementUserdata),
  atom: codec(nodeUserdata),
  scheme: codec(nodeUserdata),
  edge: codec(elementUserdata),
};

export type Graph = arguebuf.Graph<Schema>;
export type Node = arguebuf.Node<Schema>;
export type AtomNode = arguebuf.AtomNode<NodeUserdata>;
export type SchemeNode = arguebuf.SchemeNode<NodeUserdata>;

export const newGraph = (): Graph => new arguebuf.Graph<Schema>({ userdata: {} });

export const newAtom = (): AtomNode => new arguebuf.AtomNode({ text: "" });

export const newScheme = (): SchemeNode => new arguebuf.SchemeNode();

/** Canvas element of a graph node, which is part of its data together with its highlights. */
export type CanvasNode = FlowNode<
  { node: Node; isMajorClaim: boolean; connecting: boolean },
  Node["type"]
>;
export type CanvasEdge = FlowEdge;
export type CanvasElement = CanvasNode | CanvasEdge;

/** Size of a node as measured by the canvas. */
export type Dimensions = NonNullable<FlowNode["measured"]>;

const ORIGIN: XYPosition = { x: 0, y: 0 };

export const position = (node: Node): XYPosition => node.userdata.arguemapper?.position ?? ORIGIN;

/** Userdata of the node with the position changed. */
export const positioned = ({ userdata }: Node, value: XYPosition): NodeUserdata => ({
  ...userdata,
  arguemapper: { ...userdata.arguemapper, position: value },
});

/** Update the scheme nodes with the given ids, other ids are skipped. */
export function updateSchemes(
  graph: Graph,
  ids: readonly string[],
  changes: (node: SchemeNode) => arguebuf.SchemeChanges<NodeUserdata>,
): void {
  for (const id of ids) {
    const node = graph.nodes[id];

    if (node?.type === "scheme") {
      graph.updateScheme(id, changes(node));
    }
  }
}

/** Replace the userdata of an atom or scheme node. */
export function updateUserdata(graph: Graph, id: string, userdata: NodeUserdata): void {
  if (graph.nodes[id].type === "atom") {
    graph.updateAtom(id, { userdata });
  } else {
    graph.updateScheme(id, { userdata });
  }
}

/** Move the nodes of the graph to the positions, unknown ids are skipped. */
export function moveNodes(graph: Graph, positions: Iterable<readonly [string, XYPosition]>): void {
  for (const [id, value] of positions) {
    if (Object.hasOwn(graph.nodes, id)) {
      updateUserdata(graph, id, positioned(graph.nodes[id], value));
    }
  }
}

/** Make the atom the major claim, or unset it if it already is. */
export function toggleMajorClaim(graph: Graph, id: string): void {
  graph.majorClaim = graph.majorClaim === id ? undefined : id;
}

/** A graph needs auto-layout when it carries no coordinates. */
export const needsLayout = (graph: Graph): boolean =>
  Object.values(graph.nodes).every((node) => node.userdata.arguemapper === undefined);

export interface Selection {
  nodes: string[];
  edges: string[];
}

export const emptySelection: Selection = { nodes: [], edges: [] };

/** The resource to show, the selected one if it exists and the first one otherwise. */
export const shownResource = (graph: Graph, selected: string | undefined): string | undefined =>
  selected !== undefined && Object.hasOwn(graph.resources, selected)
    ? selected
    : Object.keys(graph.resources).at(0);

/** The selection without elements that are no longer part of the graph. */
export function pruneSelection(graph: Graph, selection: Selection): Selection {
  const nodes = selection.nodes.filter((id) => Object.hasOwn(graph.nodes, id));
  const edges = selection.edges.filter((id) => Object.hasOwn(graph.edges, id));

  return nodes.length === selection.nodes.length && edges.length === selection.edges.length
    ? selection
    : { nodes, edges };
}

export type ElementType = "atom" | "scheme" | "edge" | "graph";
export type SelectionType = ElementType | "multiple";

export function selectionType(graph: Graph, { nodes, edges }: Selection): SelectionType {
  if (nodes.length === 0 && edges.length === 0) {
    return "graph";
  }

  if (nodes.length === 0 && edges.length === 1) {
    return "edge";
  }

  if (nodes.length === 1 && edges.length === 0) {
    return graph.nodes[nodes[0]]?.type ?? "graph";
  }

  return "multiple";
}

export const elementType = (element?: CanvasElement): ElementType =>
  element === undefined ? "graph" : "source" in element ? "edge" : element.data.node.type;

/** Remove the selected elements, ids that are no longer part of the graph are skipped. */
export function removeElements(graph: Graph, { nodes, edges }: Selection): void {
  graph.removeElements([
    ...edges.filter((id) => Object.hasOwn(graph.edges, id)),
    ...nodes.filter((id) => Object.hasOwn(graph.nodes, id)),
  ]);
}

/** Canvas elements by id together with the inputs they were created from. */
export type CanvasCache<T> = Map<
  string,
  { readonly inputs: readonly unknown[]; readonly element: T }
>;

/** The canvas elements of the graph elements, reusing cached ones whose inputs are unchanged. */
function cachedElements<E extends { readonly id: string }, T>(
  elements: Readonly<Record<string, E>>,
  cache: CanvasCache<T>,
  inputs: (element: E) => readonly unknown[],
  create: (element: E) => T,
): T[] {
  for (const id of cache.keys()) {
    if (!Object.hasOwn(elements, id)) {
      cache.delete(id);
    }
  }

  return Object.values(elements).map((element) => {
    const current = inputs(element);
    const entry = cache.get(element.id);

    if (entry?.inputs.every((input, index) => Object.is(input, current[index]))) {
      return entry.element;
    }

    const created = create(element);
    cache.set(element.id, { inputs: current, element: created });

    return created;
  });
}

export interface CanvasView {
  selection: Selection;
  measured: Readonly<Record<string, Dimensions>>;
  /** Positions of the nodes being dragged, which the graph receives when the drag ends. */
  dragged: Readonly<Record<string, XYPosition>>;
  /** Node whose handle started a click connection. */
  connecting?: string;
}

export function canvasNodes(
  graph: Graph,
  { selection, measured, dragged, connecting }: CanvasView,
  cache: CanvasCache<CanvasNode>,
): CanvasNode[] {
  const selected = new Set(selection.nodes);

  return cachedElements(
    graph.nodes,
    cache,
    (node) => [
      node,
      selected.has(node.id),
      measured[node.id],
      dragged[node.id],
      graph.majorClaim === node.id,
      connecting === node.id,
    ],
    (node) => ({
      id: node.id,
      type: node.type,
      position: dragged[node.id] ?? position(node),
      data: {
        node,
        isMajorClaim: graph.majorClaim === node.id,
        connecting: connecting === node.id,
      },
      selected: selected.has(node.id),
      measured: measured[node.id],
    }),
  );
}

export function canvasEdges(
  edges: Graph["edges"],
  selectedEdges: readonly string[],
  cache: CanvasCache<CanvasEdge>,
): CanvasEdge[] {
  const selected = new Set(selectedEdges);

  return cachedElements(
    edges,
    cache,
    (edge) => [edge, selected.has(edge.id)],
    ({ id, source, target }) => ({ id, source, target, selected: selected.has(id) }),
  );
}

export const layoutAlgorithms = ["layered", "tree", "force", "radial"] as const;
export type LayoutAlgorithm = (typeof layoutAlgorithms)[number];

export const edgeStyles = ["bezier", "straight", "step"] as const;
export type EdgeStyle = (typeof edgeStyles)[number];
