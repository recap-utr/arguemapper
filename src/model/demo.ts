import * as cytoModel from "./cytoModel";

const demoGraph: cytoModel.CytoGraph = {
  elements: {
    nodes: [
      {
        data: cytoModel.node.initAtomData(
          "Every person is going to die, plus additional text such that the node will have to wrap to the next line.",
          "a1"
        ),
      },
      {
        data: cytoModel.node.initAtomData("This is a fact", "a2"),
      },
      {
        data: cytoModel.node.initAtomData("Just a third node", "a3"),
      },
      {
        data: cytoModel.node.initSchemeData(
          cytoModel.node.SchemeType.SUPPORT,
          null,
          "s1"
        ),
      },
    ],
    edges: [
      {
        data: cytoModel.edge.initData("a1", "s1", "e1"),
      },
      {
        data: cytoModel.edge.initData("s1", "a2", "e2"),
      },
    ],
  },
  data: cytoModel.graph.initData(),
};

export default demoGraph;
