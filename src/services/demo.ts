import * as cytoModel from "../model/cytoWrapper";

// STRESS TEST
// const nodes = [];
// const edges = [];

// for (let i = 0; i < 1000; i = i + 2) {
//   nodes.push(
//     {
//       data: cytoModel.node.initAtom(`Node ${i}`, `${i}`),
//     },
//     {
//       data: cytoModel.node.initAtom(`Node ${i + 1}`, `${i + 1}`),
//     }
//   );
//   edges.push({
//     data: cytoModel.edge.init(`${i}`, `${i + 1}`, `${i}-${i + 1}`),
//   });
// }

// const demoGraph: cytoModel.CytoGraph = {
//   elements: {
//     nodes,
//     edges,
//   },
//   data: cytoModel.graph.init(),
// };

const demoGraph: cytoModel.CytoGraph = {
  elements: {
    nodes: [
      {
        data: cytoModel.node.initAtom(
          "Every person is going to die, plus additional text such that the node will have to wrap to the next line.",
          "a1"
        ),
      },
      {
        data: cytoModel.node.initAtom("This is a fact", "a2"),
      },
      {
        data: cytoModel.node.initAtom("Just a third node", "a3"),
      },
      {
        data: cytoModel.node.initScheme(
          cytoModel.node.SchemeType.SUPPORT,
          undefined,
          "s1"
        ),
      },
    ],
    edges: [
      {
        data: cytoModel.edge.init("a1", "s1", "e1"),
      },
      {
        data: cytoModel.edge.init("s1", "a2", "e2"),
      },
    ],
  },
  data: cytoModel.graph.init(),
};

export default demoGraph;
