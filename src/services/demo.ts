import * as cytoModel from "../model/cytoWrapper";

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
