import { v1 as uuid } from "uuid";
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

function demoGraph(): cytoModel.CytoGraph {
  const resourceId = uuid();
  const resources = {
    [resourceId]: cytoModel.resource.init(
      "The major claim typically appears at the beginning, followed by multiple claims or premises."
    ),
  };
  const participantId = uuid();
  const participants = {
    [participantId]: cytoModel.participant.init("John Doe"),
  };

  const analysts = [cytoModel.participant.init("Michael Web")];

  const nodes = [
    {
      data: cytoModel.node.initAtom(
        "This node represents the major claim of the argument.",
        undefined,
        cytoModel.reference.init(
          "The major claim typically appears at the beginning",
          resourceId,
          0
        )
      ),
    },
    {
      data: cytoModel.node.initAtom(
        "Here we have a premise that supports the claim.",
        undefined,
        cytoModel.reference.init(
          "followed by multiple claims or premises",
          resourceId,
          52
        )
      ),
    },
    {
      data: cytoModel.node.initAtom("And another one that attacks it."),
    },
    {
      data: cytoModel.node.initScheme(cytoModel.node.SchemeType.SUPPORT),
    },
    {
      data: cytoModel.node.initScheme(cytoModel.node.SchemeType.ATTACK),
    },
  ];

  const edges = [
    {
      data: cytoModel.edge.init(nodes[1].data.id, nodes[3].data.id),
    },
    {
      data: cytoModel.edge.init(nodes[3].data.id, nodes[0].data.id),
    },
    {
      data: cytoModel.edge.init(nodes[2].data.id, nodes[4].data.id),
    },
    {
      data: cytoModel.edge.init(nodes[4].data.id, nodes[0].data.id),
    },
  ];

  return {
    elements: {
      nodes,
      edges,
    },
    data: {
      ...cytoModel.graph.init(),
      majorClaim: nodes[0].data.id,
      resources,
      participants,
      analysts,
    },
  };
}

export default demoGraph;
