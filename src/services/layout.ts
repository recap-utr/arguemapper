import Elk, { ElkExtendedEdge, ElkNode, LayoutOptions } from "elkjs";
import { produce } from "immer";
import * as model from "../model.js";

const DEFAULT_WIDTH = 300;
const DEFAULT_HEIGHT = 50;

const commonOptions: LayoutOptions = {
  "elk.direction": "UP",
  "elk.spacing.nodeNode": "50",
};

const layoutOptions: { [key in model.LayoutAlgorithm]: LayoutOptions } = {
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

// https://github.com/wbkd/react-flow/issues/5#issuecomment-1026515350
export const layout = async (
  nodes: Array<model.Node>,
  edges: Array<model.Edge>,
  algorithm: model.LayoutAlgorithm,
): Promise<Array<model.Node>> => {
  if (nodes.length === 0) {
    return [];
  }

  const nodeIds = nodes
    .filter((node) => node.type === "atom" || node.type === "scheme")
    .map((node) => node.data.id);

  const elkNodes: ElkNode[] = nodes
    .filter((node) => nodeIds.includes(node.id))
    .map((node) => ({
      id: node.id,
      width: node.width ?? DEFAULT_WIDTH,
      height: node.height ?? DEFAULT_HEIGHT,
    }));

  const elkEdges: ElkExtendedEdge[] = edges
    .filter(
      (edge) => nodeIds.includes(edge.source) && nodeIds.includes(edge.target),
    )
    .map((edge) => ({
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

  return nodes.map((node) =>
    produce(node, (draft) => {
      const elkNode = elkGraph?.children?.find((n) => n.id === node.id);

      if (elkNode?.x && elkNode?.y && elkNode?.width && elkNode?.height) {
        draft.position = {
          x: elkNode.x + Math.random() / 1000,
          y: elkNode.y,
        };
      }
    }),
  );
};
