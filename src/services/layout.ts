import Elk, { ElkNode, ElkPrimitiveEdge } from "elkjs";
import produce from "immer";
import * as model from "../model";

const DEFAULT_WIDTH = 500;
const DEFAULT_HEIGHT = 100;

const elk = new Elk({
  defaultLayoutOptions: {
    algorithm: "layered",
    "elk.direction": "UP",
    "elk.layered.nodePlacement.strategy": "BRANDES_KOEPF",
    "elk.layered.layering.strategy": "NETWORK_SIMPLEX",
    "elk.layered.spacing.nodeNodeBetweenLayers": "50",
    "elk.spacing.nodeNode": "50",
  },
});

// https://github.com/wbkd/react-flow/issues/5#issuecomment-1026515350
const layout = async (
  nodes: Array<model.Node>,
  edges: Array<model.Edge>
): Promise<Array<model.Node>> => {
  if (nodes.length === 0) {
    return [];
  }

  const elkNodes: ElkNode[] = nodes.map((node) => ({
    id: node.id,
    width: node.width ?? DEFAULT_WIDTH,
    height: node.height ?? DEFAULT_HEIGHT,
  }));

  console.log(JSON.stringify(elkNodes));

  const elkEdges: ElkPrimitiveEdge[] = edges.map((edge) => ({
    id: edge.id,
    target: edge.target,
    source: edge.source,
  }));

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
