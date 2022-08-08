import Elk, { ElkNode, ElkPrimitiveEdge } from "elkjs";
import produce from "immer";
import * as model from "../model";

const DEFAULT_WIDTH = 300;
const DEFAULT_HEIGHT = 50;

const elk = new Elk({
  defaultLayoutOptions: {
    algorithm: "layered",
    "elk.direction": "UP",
    "elk.layered.nodePlacement.strategy": "BRANDES_KOEPF",
    "elk.layered.layering.strategy": "NETWORK_SIMPLEX",
  },
});

// https://github.com/wbkd/react-flow/issues/5#issuecomment-1026515350
const layout = async (state: model.State): Promise<Array<model.Node>> => {
  if (state.nodes.length === 0) {
    return [];
  }

  const elkNodes: ElkNode[] = state.nodes.map((node) => ({
    id: node.id,
    width: node.width ?? DEFAULT_WIDTH,
    height: node.height ?? DEFAULT_HEIGHT,
  }));

  const elkEdges: ElkPrimitiveEdge[] = state.edges.map((edge) => ({
    id: edge.id,
    target: edge.target,
    source: edge.source,
  }));

  const elkGraph = await elk.layout({
    id: "root",
    children: elkNodes,
    edges: elkEdges,
  });

  return state.nodes.map((node) =>
    produce(node, (draft) => {
      const elkNode = elkGraph?.children?.find((n) => n.id === node.id);

      if (elkNode?.x && elkNode?.y && elkNode?.width && elkNode?.height) {
        draft.position = {
          x: elkNode.x - elkNode.width / 2 + Math.random() / 1000,
          y: elkNode.y - elkNode.height / 2,
        };
      }
    })
  );
};

export default layout;
