import {
  type Edge as FlowEdge,
  type FitViewOptions,
  MarkerType,
  type Node as FlowNode,
  type XYPosition,
} from "@xyflow/react";
import { type Graph, type Node, position } from "@/graph.js";

// the editor model extends the graph model, which is free of React for the assistant
export * from "@/graph.js";

/** Canvas element of a graph node, which is part of its data together with its highlights. */
export type CanvasNode = FlowNode<
  { node: Node; isMajorClaim: boolean; isEditing: boolean },
  Node["type"]
>;
export type CanvasEdge = FlowEdge;

/** Size of a node as measured by the canvas. */
export type Dimensions = NonNullable<FlowNode["measured"]>;

/** Small graphs are fitted into view without enlarging them. */
export const fitViewOptions: FitViewOptions = { maxZoom: 1 };

export interface Selection {
  readonly nodes: readonly string[];
  readonly edges: readonly string[];
}

export const emptySelection: Selection = { nodes: [], edges: [] };

/** Selection of the given nodes only. */
export const nodeSelection = (...nodes: string[]): Selection => ({ nodes, edges: [] });

/** The selection without elements that are no longer part of the graph. */
export function pruneSelection(graph: Graph, selection: Selection): Selection {
  const nodes = selection.nodes.filter((id) => Object.hasOwn(graph.nodes, id));
  const edges = selection.edges.filter((id) => Object.hasOwn(graph.edges, id));

  return nodes.length === selection.nodes.length && edges.length === selection.edges.length
    ? selection
    : { nodes, edges };
}

/** What is selected, "schemes" are one or more scheme nodes that are edited together. */
export type SelectionType = "graph" | "atom" | "schemes" | "edge" | "multiple";

export function selectionType(graph: Graph, { nodes, edges }: Selection): SelectionType {
  if (nodes.length === 0) {
    return edges.length === 0 ? "graph" : edges.length === 1 ? "edge" : "multiple";
  }

  if (edges.length === 0 && nodes.every((id) => graph.nodes[id]?.type === "scheme")) {
    return "schemes";
  }

  return nodes.length === 1 && edges.length === 0 ? "atom" : "multiple";
}

/** The node if it is the only selected element. */
export const selectedNode = (graph: Graph, { nodes, edges }: Selection): Node | undefined =>
  nodes.length === 1 && edges.length === 0 ? graph.nodes[nodes[0]] : undefined;

/** The value shared by all items, otherwise undefined. */
export function shared<T>(values: readonly T[]): T | undefined {
  const [first] = values;

  return values.every((value) => value === first) ? first : undefined;
}

/** Ids of all selected elements. */
export const selectedIds = ({ nodes, edges }: Selection): string[] => [...nodes, ...edges];

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
  /** Id of the atom whose text is edited on the canvas. */
  editing?: string;
}

export function canvasNodes(
  graph: Graph,
  { selection, measured, dragged, editing }: CanvasView,
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
      editing === node.id,
    ],
    (node) => ({
      id: node.id,
      type: node.type,
      position: dragged[node.id] ?? position(node),
      data: { node, isMajorClaim: graph.majorClaim === node.id, isEditing: editing === node.id },
      selected: selected.has(node.id),
      measured: measured[node.id],
    }),
  );
}

/** Arrowhead of the edges, colored like their line. */
const ARROW = { type: MarkerType.ArrowClosed, color: "context-stroke", width: 15, height: 15 };

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
    ({ id, source, target }) => ({
      id,
      source,
      target,
      selected: selected.has(id),
      markerEnd: ARROW,
    }),
  );
}

export const layoutAlgorithms = ["layered", "tree", "force", "radial"] as const;
export type LayoutAlgorithm = (typeof layoutAlgorithms)[number];

export const edgeStyles = ["bezier", "straight", "step"] as const;
export type EdgeStyle = (typeof edgeStyles)[number];
