import * as arguebuf from "arguebuf";
import { z } from "zod";

export interface Position {
  x: number;
  y: number;
}

/** Userdata of graphs and edges, unknown fields of other tools are kept. */
export interface ElementUserdata {
  notes?: string;
  [key: string]: unknown;
}

/** Settings of the assistant that created or changed an element. */
export interface Provenance {
  model?: string;
  baseURL?: string;
  reasoning?: string;
  [key: string]: unknown;
}

/** Userdata of atoms and schemes. */
export interface NodeUserdata extends ElementUserdata {
  arguemapper?: {
    position?: Position;
    /** Provenance of elements created or changed by the assistant. */
    assistant?: {
      explanation?: string;
      config?: Provenance;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
}

// the interfaces document the userdata, so the schemas are checked against them
const elementSchema = z.looseObject({ notes: z.string().optional() });
const elementUserdata: z.ZodType<ElementUserdata> = elementSchema;

const nodeUserdata: z.ZodType<NodeUserdata> = elementSchema.extend({
  arguemapper: z
    .looseObject({
      position: z.object({ x: z.number(), y: z.number() }).optional(),
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
export type GraphDraft = arguebuf.GraphDraft<Schema>;
export type Node = arguebuf.Node<Schema>;
export type Edge = arguebuf.Edge<ElementUserdata>;
export type AtomNode = arguebuf.AtomNode<NodeUserdata>;
export type SchemeNode = arguebuf.SchemeNode<NodeUserdata>;

export const newGraph = (name?: string): Graph =>
  new arguebuf.Graph<Schema>({ name, userdata: {} });

/** Title of the graph for the analyst, its name or the title of its first resource. */
export const graphTitle = (graph: Graph): string =>
  graph.name ||
  Object.values(graph.resources).find((resource) => resource.title)?.title ||
  "Untitled graph";

/** Whether the graph has neither nodes nor resources, e.g. a new one. */
export const isEmptyGraph = (graph: Graph): boolean =>
  Object.keys(graph.nodes).length === 0 && Object.keys(graph.resources).length === 0;

export const newAtom = (): AtomNode => new arguebuf.AtomNode({ text: "" });

const ORIGIN: Position = { x: 0, y: 0 };

export const position = (node: Node): Position => node.userdata.arguemapper?.position ?? ORIGIN;

/** Userdata of the node with the given fields of arguemapper changed. */
export const withArguemapper = (
  { userdata }: Node,
  changes: NonNullable<NodeUserdata["arguemapper"]>,
): NodeUserdata => ({ ...userdata, arguemapper: { ...userdata.arguemapper, ...changes } });

/** Userdata of the node with the position changed. */
export const positioned = (node: Node, position: Position): NodeUserdata =>
  withArguemapper(node, { position });

/** Update the scheme nodes with the given ids, other ids are skipped. */
export function updateSchemes(
  graph: GraphDraft,
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
export function updateUserdata(graph: GraphDraft, id: string, userdata: NodeUserdata): void {
  if (graph.nodes[id].type === "atom") {
    graph.updateAtom(id, { userdata });
  } else {
    graph.updateScheme(id, { userdata });
  }
}

/** Set the notes of the node or edge with the id, or of the graph without an id. */
export function setNotes(graph: GraphDraft, id: string | undefined, notes: string): void {
  if (id === undefined) {
    graph.userdata = { ...graph.userdata, notes };
  } else if (Object.hasOwn(graph.edges, id)) {
    graph.updateEdge(id, { userdata: { ...graph.edges[id].userdata, notes } });
  } else {
    updateUserdata(graph, id, { ...graph.nodes[id].userdata, notes });
  }
}

/** Move the nodes of the graph to the positions, unknown ids are skipped. */
export function moveNodes(
  graph: GraphDraft,
  positions: Iterable<readonly [string, Position]>,
): void {
  for (const [id, value] of positions) {
    if (Object.hasOwn(graph.nodes, id)) {
      updateUserdata(graph, id, positioned(graph.nodes[id], value));
    }
  }
}

/**
 * Connect the nodes, atoms through a new scheme node with the given scheme (support by default),
 * which is placed between them and returned.
 */
export function link(
  graph: GraphDraft,
  source: string,
  target: string,
  scheme: arguebuf.Scheme = arguebuf.defaultScheme("support"),
): SchemeNode | undefined {
  const node = graph.link(source, target, { scheme });

  if (node !== undefined) {
    const from = position(graph.nodes[source]);
    const to = position(graph.nodes[target]);
    moveNodes(graph, [[node.id, { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 }]]);
  }

  return node;
}

/** Make the atom the major claim, or unset it if it already is. */
export function toggleMajorClaim(graph: GraphDraft, id: string): void {
  graph.majorClaim = graph.majorClaim === id ? undefined : id;
}

/** A graph needs auto-layout when it carries no coordinates. */
export const needsLayout = (graph: Graph): boolean =>
  Object.values(graph.nodes).every((node) => node.userdata.arguemapper?.position === undefined);

/** The resource to show, the selected one if it exists and the first one otherwise. */
export const shownResource = (graph: Graph, selected: string | undefined): string | undefined =>
  selected !== undefined && Object.hasOwn(graph.resources, selected)
    ? selected
    : Object.keys(graph.resources).at(0);

/** Message of the error for the user, the message of a `GraphError` includes the hint of its issue. */
export const describeError = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);
