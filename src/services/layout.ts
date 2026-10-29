import Elk, {
  type ElkExtendedEdge,
  type ElkNode,
  type LayoutOptions,
} from "elkjs/lib/elk.bundled.js";
import type { Edge, Node, XYPosition } from "@xyflow/react";
import type * as model from "@/model.js";

const DEFAULT_WIDTH = 300;
const DEFAULT_HEIGHT = 50;

const commonOptions: LayoutOptions = {
  "elk.direction": "UP",
  "elk.spacing.nodeNode": "50",
};

const layoutOptions: Record<model.LayoutAlgorithm, LayoutOptions> = {
  layered: {
    ...commonOptions,
    algorithm: "layered",
    "elk.layered.nodePlacement.strategy": "BRANDES_KOEPF",
    "elk.layered.layering.strategy": "NETWORK_SIMPLEX",
    "elk.layered.spacing.nodeNodeBetweenLayers": "50",
  },
  tree: {
    ...commonOptions,
    algorithm: "mrtree",
  },
  force: {
    ...commonOptions,
    algorithm: "force",
  },
  radial: {
    ...commonOptions,
    algorithm: "radial",
  },
};

/** Positions of the nodes computed by ELK, keyed by node id. */
// https://github.com/wbkd/react-flow/issues/5#issuecomment-1026515350
export const layout = async (
  nodes: readonly Node[],
  edges: readonly Edge[],
  algorithm: model.LayoutAlgorithm,
): Promise<Map<string, XYPosition>> => {
  if (nodes.length === 0) {
    return new Map();
  }

  const elkNodes: ElkNode[] = nodes.map((node) => ({
    id: node.id,
    width: node.measured?.width ?? DEFAULT_WIDTH,
    height: node.measured?.height ?? DEFAULT_HEIGHT,
  }));

  const elkEdges: ElkExtendedEdge[] = edges.map((edge) => ({
    id: edge.id,
    targets: [edge.target],
    sources: [edge.source],
  }));

  const elk = new Elk({ defaultLayoutOptions: layoutOptions[algorithm] });
  const elkGraph = await elk.layout({
    id: "root",
    children: elkNodes,
    edges: elkEdges,
  });

  return new Map(
    (elkGraph.children ?? []).flatMap(({ id, x, y }) =>
      x === undefined || y === undefined ? [] : [[id, { x: x + Math.random() / 1000, y }]],
    ),
  );
};
