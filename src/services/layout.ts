import dagre from "dagre";
import { Edge, Elements, Node } from "react-flow-renderer";

// https://github.com/wbkd/react-flow/issues/5#issuecomment-736012175
// https://reactflow.dev/examples/layouting/
// https://github.com/wbkd/react-flow/issues/991#issuecomment-808862965
export default function layout(nodes: Node[], edges: Edge[]): Elements {
  const dagreGraph = new dagre.graphlib.Graph({ directed: true });
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: "TB" });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: node.__rf.width,
      height: node.__rf.height,
    });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const dagreNode = dagreGraph.node(node.id);
    const layoutedNode = {
      ...node,
      position: {
        x: dagreNode.x - dagreNode.width / 2 + Math.random() / 1000,
        y: dagreNode.y - dagreNode.height / 2 + Math.random() / 1000,
      },
    };
    delete layoutedNode.__rf;

    return layoutedNode;
  });

  return [...layoutedNodes, ...edges];
}
