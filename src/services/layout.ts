import Elk, { ElkExtendedEdge, ElkNode, LayoutOptions } from "elkjs";
import produce from "immer";
import * as model from "../model";

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
const layout = async (
  nodes: Array<model.Node>,
  edges: Array<model.Edge>,
  algorithm: model.LayoutAlgorithm
): Promise<Array<model.Node>> => {
  if (nodes.length === 0) {
    return [];
  }

  const invertEdges = algorithm === model.LayoutAlgorithm.TREE;

  const elkNodes: ElkNode[] = nodes.map((node) => ({
    id: node.id,
    width: node.width ?? DEFAULT_WIDTH,
    height: node.height ?? DEFAULT_HEIGHT,
  }));

  const elkEdges: ElkExtendedEdge[] = edges.map((edge) => {
    const target = invertEdges ? edge.source : edge.target;
    const source = invertEdges ? edge.target : edge.source;

    return {
      id: edge.id,
      targets: [target],
      sources: [source],
    };
  });

  const elk = new Elk({ defaultLayoutOptions: layoutOptions[algorithm] });
  const elkGraph = await elk.layout({
    id: "root",
    children: elkNodes,
    edges: elkEdges,
  });

  return nodes.map((node) =>
    produce(node, (draft) => {
      const elkNode = elkGraph?.children?.find((n) => n.id === node.id);

      if (
        elkNode &&
        elkNode.x &&
        elkNode.y &&
        elkNode.width &&
        elkNode.height
      ) {
        draft.position = {
          x: elkNode.x + Math.random() / 1000,
          y: elkNode.y,
        };
      }
    })
  );
};

export default layout;
